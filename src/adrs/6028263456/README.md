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

- You **MUST** name the Flux `Kustomization` of the `app/` stage `<name>` in
  `applications`, and `<name>-crds`, `<name>-controllers` or `<name>-configs`
  in the other kinds, because Flux object names are unique per namespace and
  a controller and its configuration share `<name>`. A stage other than
  `app/` takes `<name>-<stage>`. You **MUST** keep Flux objects in
  `flux-system`.

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
- Removing such an object is a deliberate act: remove the annotation in one
  change, and the object in the next.

### Bootstrap and sources

- You **MUST** have the Flux Operator and its `FluxInstance` installed by
  Terraform ([ADR#6561361204](../6561361204/README.md)), with `sync.path` set to
  `clusters/<cluster>` on the default branch, `provider: github` and a GitHub
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
  **MUST** reconcile it at any time. Hand it over by removing it from the old
  tree in the same change that adds it to the new one, with deletion disabled
  in the old controller so the handover never deletes live objects.

## Links

- [ADR#6561361204](../6561361204/README.md): Live infrastructure
- [ADR#6497710059](../6497710059/README.md): OCI artifact paths and tags
- [Flux repository structure](https://fluxcd.io/flux/guides/repository-structure/)
- [Flux Kustomization](https://fluxcd.io/flux/components/kustomize/kustomizations/)
- [Flux Operator FluxInstance](https://fluxoperator.dev/docs/crd/fluxinstance/)
