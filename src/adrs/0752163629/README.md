---
id: '0752163629'
title: Project namespaces
state: Draft
created: 2026-11-02
tags: [directory, monorepo, ownership]
category: Platform
---

# Project namespaces

## Context

[ADR#9316364013](../9316364013/README.md) fixes the directories at the
repository root, and [ADR#5842232571](../5842232571/README.md) splits source by
language toolchain. Both read as if the repository holds one thing. A
repository that hosts several, such as products, platform systems and
experiments, spreads each of them across every root directory, with no single
place that holds all of one thing.

Most of the time that is fine: each thing shows up as a namespace segment the
tools already provide, such as a crate prefix, a protobuf package path or a
chart name. It stops being fine when one thing has its own owner and release
cadence, or is an experiment that has to be deleted without touching anything
else. A survey of our repositories found those cases solved ad hoc, with
`experiments/` at the root and product names as root directories next to the
language workspaces.

Putting maturity in the path, as `experiments/` does, makes graduation a move.
A move breaks import paths, CI filters, ownership rules and links, so an
experiment that succeeds changes its address exactly when people start
depending on it.

## Resolution

### The root project

- You **MUST** treat the repository root as a project with no name. Everything
  not moved into `projects/` lives in the root directories, and is not limited
  to code that named projects share.
- You **SHOULD** tell apart the things the root holds by a namespace segment
  inside the root directories: a crate or package name prefix, a protobuf
  package path, an image or chart name, an OpenTelemetry registry domain.

### Named projects

- You **SHOULD NOT** create `projects/` until a thing needs isolation that a
  namespace segment cannot give it: its own owner, its own release cadence, or
  deletion as a unit. You **MUST NOT** create it in anticipation of a second
  thing, and a repository that holds one thing never has it.
- You **MAY** then move that thing into `projects/<project>/`, named in
  kebab-case. Except for the Rust representation below, you **MUST** use that
  exact name as the prefix of the packages, images and charts it produces.
  Owned Rust Cargo packages preserve its word parts using
  the underscore representation from
  [ADR#3522444690](../3522444690/README.md): `order-book` uses `order_book`
  as its package prefix, matching that exact name and `_`-delimited parts.
  Other kebab-case forms keep `<project>-`.
  You **MUST NOT** choose overlapping project prefixes, including anything the
  root project produces, in either representation. `<project>-*` and the
  canonical Rust package prefix **MUST** each select one project only. Tools
  **MUST** use exact Cargo package names or metadata for package-directory
  lookup, without converting between hyphens and underscores.
- You **MUST** place what a project owns inside `projects/<project>/`: its
  language workspaces per [ADR#5842232571](../5842232571/README.md), its
  `docs/` and its `README.md`. A project that runs its own mise tasks **MUST**
  be a nested mise configuration root per
  [ADR#6647967335](../6647967335/README.md).
- You **MUST NOT** nest `projects/` inside a project.
- You **MUST NOT** encode maturity or kind in the path. `experiments/`,
  `labs/`, `sandbox/`, `products/` and `apps/` are not containers for
  projects. You **MUST** state the lifecycle in a line directly under the
  title of the project's `README.md`, as `Status: experimental`,
  `Status: active` or `Status: deprecated`, and change that line instead of
  moving the directory.
- You **SHOULD** move a project to its own repository when nothing requires it
  to share this one. Extraction takes `projects/<project>/` as the new root,
  plus every path under its namespace segment in the shared root directories.
  Every root path the dependency graph lists for the project **MUST** first be
  published as a versioned package the project consumes, or be copied into it,
  so the extracted repository builds on its own.

### Shared root directories

- You **MUST** keep `.github/` at the repository root, because GitHub reads it
  nowhere else.
- You **SHOULD** keep `.config/`, `devops/`, `otel/` and the schema source
  directories `proto/`, `wit/`, `openapi/` and `asyncapi/` at the repository
  root, shared by the root project and every named project. One buf module,
  one semantic convention registry and one operational estate that see every
  project at once catch conflicts that separate copies hide.
- You **MUST** lay out those root directories to hold several projects side by
  side, each under its namespace segment: `proto/<org>/<project>/`,
  `wit/<project>/`, `openapi/<project>/`, `asyncapi/<project>/`,
  `otel/registry/<vendor>/<project>/`, `devops/docker/images/<project>-*/`,
  `devops/helm/charts/<project>-*/`, and for live infrastructure Terragrunt
  units named `<project>-*` and GitOps directories
  `devops/infra/gitops/clusters/<cluster>/<kind>/<project>-*/`. Live
  infrastructure that no single project owns, such as an account or a
  cluster itself, belongs to the root project.
- You **MAY** nest any of those directories inside `projects/<project>/` when
  the project cannot share the root copy, such as a
  separate buf module or an operational estate no other project touches. The
  nested copy follows the same ADR as the root one, and the project's share
  **MUST NOT** then also live in the root copy.

  ```txt
  .
  ├── .github/  .config/  devops/  otel/  proto/   # shared, one segment each
  ├── rsworkspace/  docs/                           # the root project
  └── projects
      └── <project>
          ├── README.md                             # Status: experimental
          ├── .config/mise/tasks/                   # its own tasks only
          ├── .config/mise/lib/
          ├── rsworkspace/
          ├── goworkspace/
          └── docs/
  ```

### Dependencies

- You **MUST** keep dependencies pointing inward from the root. A project
  **MAY** depend on the root workspaces and the shared root directories. The
  root **MUST NOT** depend on a project, and a project **MUST NOT** depend on
  another project. Code two projects need lives in the root.
- You **MUST** derive the dependency graph from the toolchain manifests, such
  as `cargo metadata`, `go list -deps` and the pnpm workspace, plus the
  namespace segments in the shared root directories and every build or
  generation configuration that names a root path, such as `buf.yaml`,
  `buf.gen.yaml` and OpenAPI or AsyncAPI generator configurations. You
  **MUST NOT** maintain a list of dependencies by hand.
- You **MUST** expose the graph as a mise task that prints, as JSON, every
  project with the paths it owns and the root paths it depends on. A named
  project owns `projects/<project>/` and every path under its namespace
  segment in the shared root directories. The root project owns every other
  path outside `projects/`. A root path a project only consumes is listed as
  a dependency, never as owned.
- You **MUST** compute CI path filters, sparse checkouts and affected-project
  selection from that output, and **MUST NOT** write the paths into a workflow
  by hand. A change under `.config/` or `.github/` affects every project.

## Consequences

- Each project carries its own lockfile per language, so its dependency
  versions drift from the root and from other projects. That is the price of
  isolation, and the reason the namespace segment stays the default.
- A project that depends on code in the root takes it as a path dependency
  across workspaces instead of as a workspace member, and the graph picks the
  edge up from the manifest.
- A project's sparse checkout is its directory, the shared root directories
  and the root paths the graph lists. The shared directories are taken whole,
  which keeps git in cone mode.
- Graduating an experiment is a one-line change to its `README.md`, and
  deleting one is deleting its directory and its namespace paths.

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [ADR#5842232571](../5842232571/README.md): Language workspaces
- [ADR#6647967335](../6647967335/README.md): mise tasks and shared code
- [ADR#4711775939](../4711775939/README.md): Schema source directories
- [ADR#2078011537](../2078011537/README.md): Operational assets
