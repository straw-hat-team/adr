---
name: direnv
quadrant: tools
history:
  - edition: '2026.2'
    ring: hold
tags: [developer-experience, environment, toolchain]
---

# direnv

direnv loads and unloads environment variables as you move in and out of a directory, driven by a `.envrc` that
lives next to the code. It carried our repositories for years, and the instinct behind it was the right one:
entering a project should be a `cd`, not a checklist. [mise](./mise.md) kept that instinct.

It is on Hold because the `.envrc` is a shell script, and a shell script is an open-ended thing. What began as a
few exports grows toolchain activation, a PATH prepend, a decryption call, and a branch for the one machine where
something is installed elsewhere. The environment then exists twice: once as declarations a reader can compare
against CI, and once as the code that happens to run in an interactive shell. Reviewing the second is reading a
program, and the version drift it hides is exactly what the file was supposed to prevent.

mise takes the same directory-scoped behaviour and states it instead: environment, toolchain versions, tasks, and
[SOPS](./sops.md)-decrypted secrets in one checked-in configuration that `mise run` and CI read the same way. The
shell hook is still there when a directory needs to be entered, but nothing about the project depends on having
entered it.

Hold is not a removal order. A repository with a working `.envrc` is not broken, and `mise` can be invoked from
one while a repository migrates. New repositories should declare the environment in mise and skip the `.envrc`.
