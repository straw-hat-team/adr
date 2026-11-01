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
  `<extension>workspace/`, where `<extension>` is the language's source file
  extension without the dot:

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
  has source in one language only. You **MUST** move it into its workspace
  when a second language arrives.
- You **MUST** make each workspace the root of exactly one toolchain: its
  manifest and lockfile sit directly in it, such as `Cargo.toml` and
  `Cargo.lock`, `go.mod` or `go.work`, `mix.exs` and `mix.lock`,
  `pnpm-workspace.yaml` and `pnpm-lock.yaml`, `pyproject.toml` and `uv.lock`.
- You **MUST** keep configuration read by one toolchain only, such as
  `clippy.toml`, `deny.toml`, `rustfmt.toml`, `rust-toolchain.toml`,
  `.golangci.yaml`, `.formatter.exs` and `tsconfig.base.json`, in that
  workspace and **MUST NOT** keep it at the repository root. Configuration for
  a tool that reads the whole repository goes under `.config/<tool>/`.
- You **MUST** keep everything a workspace owns inside it, including database
  migrations its code embeds, test fixtures and examples.
- You **MUST** keep the directories reserved by
  [ADR#9316364013](../9316364013/README.md) at the repository root. A
  workspace consumes them; it **MUST NOT** carry its own copy.
- You **MUST** place Rust crates under `rsworkspace/crates/<crate>/`, and
  **MUST** follow the toolchain's own layout inside every other workspace.

  ```txt
  .
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
  │   ├── go.mod
  │   └── go.sum
  ├── exworkspace
  │   ├── mix.exs
  │   └── mix.lock
  └── LICENSE
  ```

## Consequences

- A Go module inside `goworkspace/` carries the directory in its import path,
  `github.com/<org>/<repo>/goworkspace`, and tags its releases
  `goworkspace/vX.Y.Z`. A repository that publishes a Go module for others to
  import decides that path before the first release, because changing it
  later breaks every importer.
- Existing `rustworkspace/`, `go-workspace/` and `elixirworkspace/`
  directories are renamed. The rename touches the paths in CI, container
  builds and mise tasks, and nothing else.

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [ADR#4711775939](../4711775939/README.md): Schema source directories
- [ADR#2078011537](../2078011537/README.md): Operational assets
- [ADR#1631648331](../1631648331/README.md): Rust is the language for new
  services and programs
