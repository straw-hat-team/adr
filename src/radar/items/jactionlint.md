---
name: jactionlint
quadrant: tools
history:
  - edition: '2026.3'
    ring: trial
tags: [ci, security, linting]
---

# jactionlint

jactionlint is a static checker for GitHub Actions workflows, composite actions, and Dependabot configuration.
It started as a fork of [actionlint](./actionlint.md) and covers its checks, and adds rules for script
injection, excessive token permissions, dangerous triggers, and actions referenced by tag instead of by commit.
Its security rules follow the audits of [zizmor](./zizmor.md).

It is in Trial because the claim that one tool can stand in for the other two has been read, not measured. The
plan is to run it on a real release workflow next to zizmor and compare findings. If zizmor finds nothing
jactionlint misses, it moves to Adopt and is the only workflow linter we run. If it does miss things, those
findings are a report for the maintainer, not a reason to run three tools.

Use the shared action in `TrogonStack/github-actions` rather than installing it per repository, so every
repository lints with the same version and the same rules.
