---
id: '6028263456'
title: GitOps cluster layout
state: Draft
created: 2026-11-17
tags: [directory, devops, gitops, flux, kubernetes]
category: Platform
---

# GitOps cluster layout

## Context

[ADR#6561361204](../6561361204/README.md) places what a controller reconciles
under `devops/infra/gitops/clusters/<cluster>/<kind>/<name>/` and leaves
`<kind>` undefined. It also says "one Kustomization per directory", which is
ambiguous: kustomize has a `kustomization.yaml`, and Flux has a `Kustomization`
custom resource that points at a directory holding one.

A cluster has to apply things in an order the tree can show: a
CustomResourceDefinition before the objects that use it, a controller before
its configuration, configuration before the workloads that need it. Flux
documents several repository shapes and chooses none. They converge on the
same tiers and on a cluster being a directory
([Flux repository structure](https://fluxcd.io/flux/guides/repository-structure/)).

Pruning is the other risk. A Flux `Kustomization` with `prune: true` deletes
whatever leaves the tree, which is how a namespace, a CustomResourceDefinition
or a volume disappears with a careless commit.

A unit can also carry code. A script in a ConfigMap, or a command that
fetches source or a program when a pod starts, runs in the cluster without a
build, a scan or a pin. The image digest then no longer says what runs. A
restart depends on a package registry that may be down or may serve something
else, and the pod needs egress and build tools that the workload itself never
uses.

## Resolution

### Clusters and kinds

- You **MUST** make each cluster one directory,
  `devops/infra/gitops/clusters/<cluster>/`. `<cluster>` **MUST** equal the
  name of the Terragrunt unit that creates the cluster, so one name finds
  both. An environment is a cluster, never a branch.
- You **MUST** group units under one of these kinds, and **MUST NOT** add
  another. A unit that fits none is an `applications` unit.

  | Kind           | Holds                                            |
  | -------------- | ------------------------------------------------ |
  | `crds`         | CustomResourceDefinitions and nothing else       |
  | `controllers`  | Operators and controllers, with their namespaces |
  | `configs`      | Custom resources that a controller's CRDs define |
  | `applications` | Workloads that people or other systems use       |

### Units

- You **MUST** give each unit its own directory, `<kind>/<name>/`, where
  `<name>` is the kebab-case product or upstream name.
- You **MUST** put in a unit `ks.yaml`, the Flux `Kustomization` objects that
  reconcile it, and `app/`, the payload. `app/` **MUST** hold a
  `kustomization.yaml` that lists every file, and **MUST NOT** encode order in
  file names. A unit whose order matters inside **MAY** add a sibling
  directory per stage, such as `database/` before `app/`, each stage with its
  own `Kustomization` chained by `dependsOn`.
- You **MUST** list each unit's `ks.yaml` in `<kind>/kustomization.yaml`, and
  the four kinds in `clusters/<cluster>/kustomization.yaml`.

  ```txt
  devops/infra/gitops/clusters/<cluster>
  ├── kustomization.yaml                 # lists the four kinds
  └── <kind>/
      ├── kustomization.yaml             # lists each unit's ks.yaml
      └── <name>/
          ├── ks.yaml                    # Flux Kustomization(s)
          └── app/
              ├── kustomization.yaml     # kustomize
              └── ...                    # the payload
  ```

- You **MUST** name the Flux `Kustomization` of the `app/` stage
  `<kind>-<name>`, such as `crds-cert-manager` or `applications-memorizer`,
  and a stage other than `app/` `<kind>-<name>-<stage>`. Flux object names
  are unique per namespace, and a controller and its configuration share
  `<name>`; leading with the kind keeps a unit named `cert-manager-crds` in
  one kind from colliding with `cert-manager` in another. You **MUST** keep
  Flux objects in `flux-system`.

### Payload

A unit declares what runs. An image is what runs.

- You **MUST** keep in a unit only manifests and the configuration that a
  program reads, such as a settings file in a ConfigMap.
- You **MUST NOT** keep in a unit a program that a container executes: a
  script, a module or an entrypoint, as a file beside the manifests or inline
  in one. It belongs in the image, under `devops/docker/images/<name>/`
  ([ADR#2078011537](../2078011537/README.md)), so the image digest identifies
  everything that runs.
- A manifest **MAY** set `command` and `args` to choose a program that the
  image holds and to pass it arguments. They **MUST NOT** carry logic of their
  own. A shell script passed to `sh -c` is a program kept in the unit.
- You **MUST NOT** fetch source, install packages, compile or download a
  program when a pod starts, in an init container or in an entrypoint. This
  holds for third-party software that publishes no image, and for a trial.
  Build the image ahead of time and deploy it by tag and digest
  ([ADR#6497710059](../6497710059/README.md)). A pod **MAY** download data.
- An init container or a Job **MAY** run a step that needs the live cluster,
  such as a schema migration, with a program that the image holds.
- These rules cover the files a unit holds, and the values it passes to a
  chart are among them. What an upstream chart renders from its own
  templates belongs to the upstream.

### Ordering

- You **MUST** order units only with `dependsOn`, naming each dependency
  explicitly. The kind alone orders nothing.
- A unit **MUST NOT** depend on a unit of a later kind in the order `crds`,
  `controllers`, `configs`, `applications`, and the graph **MUST** be acyclic.
- A unit that others depend on **MUST** set `wait: true` and a `timeout`, so
  "ready" means healthy and not only applied.

### Delete safety

- You **MUST** create each new `Kustomization` with `prune: false`, and
  **MAY** change it to `true` only in a later change, after a render shows
  what a prune would delete.
- You **MUST** add `kustomize.toolkit.fluxcd.io/prune: disabled` to every
  Namespace, CustomResourceDefinition, PersistentVolumeClaim and database
  cluster, so that removing it from Git, or its unit with `prune: true`,
  never deletes it. A unit made only of those, such as every `crds` unit,
  **MAY** keep `prune: false` for good.
- The annotation stops Flux pruning only. Removing a `HelmRelease` runs a
  Helm uninstall, which deletes what the chart created whatever Flux says.
  You **MUST** also set `helm.sh/resource-policy: keep` on every such object
  a chart creates, through the chart values or a post-renderer, and **MUST
  NOT** remove a `HelmRelease` that holds data in the same change that
  changes anything else about it.
- Removing such an object is a deliberate act: remove the annotations in one
  change, and the object in the next.

### Bootstrap and sources

- You **MUST** have the Flux Operator and its `FluxInstance` installed by
  Terraform ([ADR#6561361204](../6561361204/README.md)), with `sync.path` set to
  `devops/infra/gitops/clusters/<cluster>` on the default branch, `provider: github` and a GitHub
  App credential in the `pullSecret`. You **MUST NOT** use a personal token.
  Flux then reconciles itself from the tree, and the tree **MUST NOT**
  hold the operator or the `FluxInstance` again.
- You **MUST** deliver a Helm chart that a cluster runs from the team's own
  OCI registry, pinned to an exact version
  ([ADR#6497710059](../6497710059/README.md)).
- You **MUST** pull a chart through an `OCIRepository` whose `ref` sets both
  the `tag` and the `digest`, and point the `HelmRelease` at it with
  `chartRef`. A `HelmRelease` `chart.spec.version` cannot carry a digest, so
  it does not meet the deployment pin rule.
- You **MAY** isolate teams with Flux multi-tenancy lockdown later, by a
  follow-up ADR. Until then every unit is reconciled from `flux-system` as
  cluster-admin.

### Migration

- You **MAY** keep a legacy GitOps tree, such as an existing Argo CD one,
  outside this layout while units move into it one at a time. You **MUST NOT**
  require a single change that moves everything.
- A unit **MUST** live in exactly one place, and exactly one controller
  **MUST** reconcile it at any time. Disabling deletion stops pruning but not
  reconciliation, and two controllers do not see one commit at the same
  moment, so a single change that moves a unit is not a handover. Hand it
  over in order:
  1. Stop the old controller for the unit: turn off its sync and deletion,
     then release the unit without deleting its objects.
  2. Verify the old controller no longer reconciles or owns the unit.
  3. Add the unit to the new tree with `prune: false`, after a render shows
     no change to the live objects.

## Links

- [ADR#6561361204](../6561361204/README.md): Live infrastructure
- [ADR#2078011537](../2078011537/README.md): Operational assets
- [ADR#6497710059](../6497710059/README.md): OCI artifact paths and tags
- [Flux repository structure](https://fluxcd.io/flux/guides/repository-structure/)
- [Flux Kustomization](https://fluxcd.io/flux/components/kustomize/kustomizations/)
- [Flux Operator FluxInstance](https://fluxoperator.dev/docs/crd/fluxinstance/)
