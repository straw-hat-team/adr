---
id: '6647967335'
title: mise tasks and shared code
state: Approved
created: 2026-10-07
tags: [directory, mise, github-actions]
category: Platform
---

# mise tasks and shared code

## Context

[ADR#9316364013](../9316364013/README.md) reserves `.config/mise/` for task
scripts and the code they share. This ADR fixes the layout inside it.

A survey of our repositories found task scripts in inline `[tasks]` tables in
`mise.toml`, in `scripts/` and in `.config/mise/tasks/`, and the scripts behind
GitHub Actions workflows under three different roots, so the same workflow step
was named differently in each repository. mise searches a fixed list of
directories for file tasks and turns nested directories into colon-separated
task names; `.config/mise/tasks/` is the one that keeps tool configuration out
of the repository root and the one most repositories already use.

## Resolution

### Tasks

- You **MUST** write tasks as file tasks under `.config/mise/tasks/`, using
  subdirectories as the task namespace, so `<group>/<task>` runs as
  `mise run <group>:<task>`.
- You **MUST NOT** use `mise-tasks/`, `.mise-tasks/`, `mise/tasks/`,
  `.mise/tasks/` or `scripts/`.
- You **MAY** declare a task inline in `mise.toml` only when it is a one-line
  aggregator that `depends` on file tasks.
- You **MUST** name the configuration file `mise.toml`.

### Shared code

- You **MUST** keep code shared by several tasks, such as shell functions,
  helper scripts and committed `.env` files, under `.config/mise/lib/`, and
  **MUST** source it through `MISE_PROJECT_ROOT`:

  ```sh
  source "$MISE_PROJECT_ROOT/.config/mise/lib/images.sh"
  ```

- A nested mise configuration root **MUST** keep its own `.config/mise/tasks/`
  and `.config/mise/lib/`, so its tasks resolve only from inside that tree.

### GitHub Actions

- You **MUST** place every script a workflow runs directly under
  `.config/mise/tasks/github/workflows/<workflow>/`, where `<workflow>` is the
  file name of `.github/workflows/<workflow>.yml` without the extension.
- You **MUST** invoke it from the workflow as
  `mise run github:workflows:<workflow>:<step>`, never through `run:` blocks
  longer than that single line.
- A workflow **MUST** install mise, or run on a runner that provides it, before
  its first `mise run`.
- You **MUST** extract a step shared by more than one workflow into a composite
  action at `.github/actions/<name>/`, and place its scripts under
  `.config/mise/tasks/github/actions/<name>/`, invoked as
  `mise run github:actions:<name>:<step>`.

  ```txt
  .
  ├── .github
  │   ├── actions/load-secrets/action.yml
  │   └── workflows/release.yml
  └── .config/mise
      ├── lib/<name>.sh
      └── tasks
          ├── <namespace>/<task>
          └── github
              ├── actions/load-secrets/run
              └── workflows/release
                  ├── resolve-version
                  └── upload-assets
  ```

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [mise file tasks and search directories](https://mise.jdx.dev/tasks/file-tasks.html)
- [mise configuration environments and nested roots](https://mise.jdx.dev/configuration.html)
- [GitHub composite actions](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action)
