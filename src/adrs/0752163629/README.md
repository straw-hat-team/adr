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
language toolchain. Both assume the repository holds one thing. A repository
that hosts several independent things, such as products, platform systems and
experiments, spreads each of them across every root directory, with no single
place that holds all of one thing.

Most of the time that is fine: the thing shows up as a namespace segment the
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

- You **SHOULD** express each thing a repository holds as a namespace segment
  inside the root directories: a crate or package name prefix, a protobuf
  package path, an image or chart name, an OpenTelemetry registry domain.
- You **SHOULD NOT** create `projects/` until a thing needs isolation that a
  namespace segment cannot give it: its own owner, its own release cadence, or
  deletion as a unit. You **MUST NOT** create it in anticipation of a second
  thing, and a repository that holds one thing never has it.
- You **MAY** then move that thing into its own `projects/<project>/`
  directory.
- You **MUST** name `<project>` in kebab-case and use the same name as the
  prefix of the crates, packages, images and charts it produces.
- You **MUST** treat `projects/<project>/` as a repository root. Every ADR that
  governs the repository root, including the reserved directories and the
  language workspaces, applies inside it unchanged. A project that runs mise
  tasks **MUST** be a nested mise configuration root per
  [ADR#6647967335](../6647967335/README.md).
- You **MUST NOT** nest `projects/` inside a project.
- You **MUST** keep all of a project inside its directory. You **MUST NOT**
  place any of its source, schemas or operational assets in the root
  directories.
- You **MUST** keep dependencies pointing inward from the root. A project
  **MAY** depend on the root workspaces and schemas. The root **MUST NOT**
  depend on a project, and a project **MUST NOT** depend on another project.
  Code two projects need moves to the root.
- You **MUST NOT** encode maturity or kind in the path. `experiments/`,
  `labs/`, `sandbox/`, `products/` and `apps/` are not containers for
  projects. You **MUST** state the lifecycle on the first line of the
  project's `README.md` as `Status: experimental`, `Status: active` or
  `Status: deprecated`, and change that line instead of moving the directory.
- You **SHOULD** move a project to its own repository when nothing requires it
  to share this one. Moving `projects/<project>/` to a new repository root
  **MUST** be all the extraction takes.

  ```txt
  .
  ├── .config/  devops/  docs/  proto/  otel/   # shared by every project
  ├── rsworkspace/                               # shared code only
  └── projects
      └── <project>
          ├── README.md                          # Status: experimental
          ├── .config/mise/
          ├── rsworkspace/
          ├── goworkspace/
          ├── proto/
          ├── devops/
          └── docs/
  ```

## Consequences

- Each project carries its own lockfile per language, so its dependency
  versions drift from the root and from other projects. That is the price of
  isolation, and the reason the namespace segment stays the default.
- Code shared with a project becomes a path dependency across workspaces
  instead of a workspace member.
- Graduating an experiment is a one-line change to its `README.md`, and
  deleting one is deleting its directory.

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [ADR#5842232571](../5842232571/README.md): Language workspaces
- [ADR#6647967335](../6647967335/README.md): mise tasks and shared code
