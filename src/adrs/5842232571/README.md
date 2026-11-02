---
id: '5842232571'
title: Language workspaces
state: Draft
created: 2026-11-01
tags: [directory, monorepo, rust, go, typescript, elixir, python]
category: Platform
---

# Language workspaces

## Context

[ADR#9316364013](../9316364013/README.md) reserves the directories that belong
to no single language workspace, but it does not say where a language
workspace itself lives. A repository that ships a Rust server next to a Go
client, an Elixir client and a TypeScript console has to place several
toolchains, each with its own manifest, lockfile and tool configuration.

A survey of our repositories found most multi-language repositories already
converged on one root directory per toolchain named `<language>workspace/`:
`rsworkspace/`, `goworkspace/`, `tsworkspace/`, `pyworkspace/`. The language
part drifted where nothing fixed it: `rustworkspace/` next to `go-workspace/`
in one repository, `elixirworkspace/` next to `rsworkspace/` in others.
Single-language Rust repositories kept the Cargo workspace at the root.

The language part is fixed here as the language's source file extension, so
a new language never needs a naming decision.

## Resolution

- You **MUST** place each language toolchain of a repository with source in
  more than one language in its own root directory named
  `<extension>workspace/`, where `<extension>` is the language's primary
  source file extension without the dot. The table fixes that extension for
  each language, and a language missing from it is added here before its
  workspace is created:

  | Language   | Directory         |
  | ---------- | ----------------- |
  | Rust       | `rsworkspace/`    |
  | Go         | `goworkspace/`    |
  | TypeScript | `tsworkspace/`    |
  | Elixir     | `exworkspace/`    |
  | Python     | `pyworkspace/`    |
  | Kotlin     | `ktworkspace/`    |
  | Swift      | `swiftworkspace/` |

- You **MUST NOT** spell the language out or separate the words:
  `rustworkspace/`, `elixirworkspace/`, `go-workspace/` and `go_workspace/`
  are wrong.
- You **MUST NOT** use a bare language name (`rust/`, `go/`, `elixir/`) or a
  role name (`clients/`, `sdks/`, `packages/`, `apps/`) at the repository root
  for source a toolchain builds.
- You **MAY** keep the toolchain at the repository root while the repository
  has source in one language only. This is the exception
  [ADR#9316364013](../9316364013/README.md) lets the owning ADR make: the
  `<extension>workspace/` names stay reserved, and you **MUST** move the
  toolchain into its workspace when a second language arrives.
- You **MUST** make each workspace the root of exactly one toolchain: its
  workspace-level manifest and lockfile sit directly in it, such as
  `Cargo.toml` and `Cargo.lock`, `go.work` or a single `go.mod`, `mix.exs`
  and `mix.lock`, `pnpm-workspace.yaml` and `pnpm-lock.yaml`,
  `pyproject.toml` and `uv.lock`. Each package's own manifest, such as a Go
  module's `go.mod` or a crate's `Cargo.toml`, stays in its package
  directory.
- You **SHOULD** set the workspace up with the toolchain's own multi-package
  mechanism, such as a Cargo workspace, a `go.work` file, a pnpm workspace, a
  Mix umbrella, a uv workspace or a Gradle multi-project build, with each
  package in its own directory, even while it holds a single package. A
  second package then joins the workspace instead of reshaping it. You **MAY**
  place a single package directly at the workspace root, such as a single
  Cargo package whose `Cargo.toml` declares no `[workspace]` members.
- You **MUST** keep configuration read by one toolchain only, such as
  `clippy.toml`, `deny.toml`, `rustfmt.toml`, `rust-toolchain.toml`,
  `.golangci.yaml`, `.formatter.exs` and `tsconfig.base.json`, in that
  workspace and **MUST NOT** keep it at the repository root. Configuration for
  a tool that reads the whole repository goes under `.config/<tool>/`.
- You **MUST** keep everything a workspace owns inside it, including database
  migrations its code embeds, test fixtures and examples.
- You **MUST NOT** carry a copy of a directory reserved by
  [ADR#9316364013](../9316364013/README.md) inside a workspace. The workspace
  uses the copy its project nests per [ADR#0752163629](../0752163629/README.md)
  when there is one, and the repository root copy otherwise.
- You **MUST** place the members of a Cargo workspace under `crates/<crate>/`
  relative to the workspace directory, which is `rsworkspace/crates/<crate>/`
  for the root project and `projects/<project>/rsworkspace/crates/<crate>/`
  for a named one. You **MUST** follow the toolchain's own layout inside every
  other workspace.

  ```txt
  .
  ├── .github/
  ├── .config/<tool>/
  ├── devops/
  ├── docs/
  ├── proto/
  ├── otel/
  ├── rsworkspace
  │   ├── Cargo.toml
  │   ├── Cargo.lock
  │   ├── clippy.toml
  │   ├── deny.toml
  │   └── crates/<crate>/
  ├── goworkspace
  │   ├── go.work
  │   └── <module>/go.mod
  ├── exworkspace
  │   ├── mix.exs           # umbrella
  │   ├── mix.lock
  │   └── apps/<app>/
  └── LICENSE
  ```

## Consequences

- The `module` directive in `go.mod` sets a Go module's import path, not its
  directory. A module at `goworkspace/<module>/` whose path matches its
  location is imported as `github.com/<org>/<repo>/goworkspace/<module>` and
  tags its releases `goworkspace/<module>/vX.Y.Z`. A repository that publishes
  a Go module for others to import decides that path before the first
  release, because changing it later breaks every importer.
- Existing `rustworkspace/`, `go-workspace/`, `elixirworkspace/` and
  `kotlinworkspace/` directories are renamed. The rename touches the paths in
  CI workflows, container builds, mise tasks, `CODEOWNERS` and documentation
  links. A Go module that others already import is the exception: Go finds
  it by the directory its path names, so it either keeps its old directory
  or is released as a new module under the new path, with the old module's
  `go.mod` marked `// Deprecated:` in its last release.

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [ADR#4711775939](../4711775939/README.md): Schema source directories
- [ADR#2078011537](../2078011537/README.md): Operational assets
- [ADR#0752163629](../0752163629/README.md): Project namespaces
- [ADR#1631648331](../1631648331/README.md): Rust is the language for new
  services and programs
