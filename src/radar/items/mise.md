---
name: mise
quadrant: tools
history:
  - edition: '2026.2'
    ring: adopt
tags: [developer-experience, task-runner, toolchain]
---

# mise

mise is the entrypoint into a repository. It pins the toolchain a project needs, exposes the tasks that operate
on it, loads the environment those tasks run with, and decrypts the secrets they read. One tool, one config,
checked in next to the code.

The reason it sits in Adopt is not that it runs tasks well. It is that the task and the toolchain the task
depends on stop being two separate promises. A task declared in `.config/mise/tasks` runs against the versions
declared in the same configuration, so `mise run` on a laptop and in CI is the same execution, and a contributor
who cloned the repository five minutes ago is not the person who discovers the version drift.

Secrets follow the same reasoning. mise reads [SOPS](./sops.md)-encrypted files as environment, so decryption is
part of entering the project rather than a step every task has to remember to perform.

This is what replaced both [Task](./task.md) and [EJSON](./ejson.md), and both of those blips are on Hold because
of it.

Adopting a tool is also a bet that it will still be maintained in three years. That bet reads better than it did:
Omarchy ships mise as its developer runtime manager, and the Omacom Foundation behind it is a premier sponsor of
the project. A tool with a distribution depending on it is a different risk profile from a tool with one
maintainer and a good README.
