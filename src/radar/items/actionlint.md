---
name: actionlint
quadrant: tools
history:
  - edition: '2026.3'
    ring: hold
tags: [ci, linting]
---

# actionlint

actionlint is the original static checker for GitHub Actions workflows, and a good one. It is on Hold because
[jactionlint](./jactionlint.md) started as a fork of it and covers its checks, so a new setup has no reason to
pick the original and give up the security rules.

Hold is not a removal order. A repository already running actionlint is not broken. Be careful with package
names: `actionlint` in Homebrew core installs this project, not the fork.
