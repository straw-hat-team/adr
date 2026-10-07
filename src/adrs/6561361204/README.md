---
id: '6561361204'
title: Live infrastructure
state: Approved
created: 2026-10-07
tags: [directory, devops, terragrunt, terraform, gitops]
category: Platform
---

# Live infrastructure

## Context

[ADR#9316364013](../9316364013/README.md) reserves `devops/infra/` for the live
estate. This ADR fixes the layout inside it.

Building an image or rendering a chart touches nothing live. Terraform units
and GitOps manifests do, so the repositories that had settled this keep the
live estate under its own subtree with its own code owners, one Terragrunt tree
per provider so that a unit for one provider cannot reach another, and
reusable modules outside the gate because they reach nothing on their own.

## Resolution

- You **MUST** keep everything that creates, changes or reconciles a live
  account or cluster under `devops/infra/`. Nothing else lives there except
  what this ADR names: its mise configuration and its documentation. A
  `CODEOWNERS` entry for that path **MUST** name the owners of the estate.
- You **MAY** make `devops/infra/` a mise configuration root of its own, so
  its tasks and secret references resolve only from inside that tree, and
  the root `mise.toml` keeps the tool pins.

### Terragrunt

- You **MUST** give each provider its own Terragrunt tree under
  `devops/infra/terraform/<provider>/`. A unit under one provider **MUST NOT**
  be able to reach another.
- You **MUST** place `root.hcl` at the top of each tree that owns its own
  state and credentials: `<provider>/root.hcl` for a provider that is one
  tenant, `<provider>/<account>/root.hcl` for a provider that isolates by
  account.
- You **MUST** split a tree by account, project or organisation, and a
  provider that has regions **MUST** then split by region with `_global/` for
  region-free units: `<provider>/<account>/{_global,<region>}/<unit>/`. The
  directory **MUST** decide which account and region a run reaches; a
  credential **MUST NOT**.
- You **MUST** keep lookup tables shared by several provider trees, such as
  `accounts.hcl` and `generate-versions.hcl`, directly under
  `devops/infra/terraform/`.
- You **MUST** keep reusable modules and unit templates in
  `devops/terragrunt/catalog/<provider>/{modules,units}/`, outside the
  ownership gate, because they reach nothing live. A unit's `source` points
  at a catalog module; a unit **MAY** carry its own `.tf` files only when no
  second consumer exists.

### GitOps

- You **MUST** place what a controller reconciles onto a cluster under
  `devops/infra/gitops/clusters/<cluster>/<kind>/<name>/`, one Kustomization
  per directory.
- Nothing under `terraform/` **MUST** read it, and no CI job **MUST** apply
  it.

  ```txt
  devops
  ├── infra
  │   ├── mise.toml                          # nested mise config root
  │   ├── terraform
  │   │   ├── accounts.hcl                   # shared lookups
  │   │   ├── generate-versions.hcl
  │   │   ├── aws
  │   │   │   └── <account>
  │   │   │       ├── root.hcl
  │   │   │       ├── _global/<unit>/terragrunt.hcl
  │   │   │       └── <region>/<unit>/terragrunt.hcl
  │   │   └── <provider>
  │   │       ├── root.hcl
  │   │       └── <org or project>/<unit>/terragrunt.hcl
  │   ├── gitops/clusters/<cluster>/applications/<name>/kustomization.yaml
  │   └── docs/                              # Diátaxis
  └── terragrunt/catalog/<provider>/{modules,units}/<name>/
  ```

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [ADR#2078011537](../2078011537/README.md): Operational assets
- [Terragrunt units](https://terragrunt.gruntwork.io/docs/features/units/)
- [Flux repository structure](https://fluxcd.io/flux/guides/repository-structure/)
