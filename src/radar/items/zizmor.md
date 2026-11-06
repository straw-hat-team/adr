---
name: zizmor
quadrant: tools
history:
  - edition: '2026.3'
    ring: assess
tags: [ci, security, linting]
---

# zizmor

zizmor is a security scanner for GitHub Actions workflows. It flags secrets exposed to steps that do not need
them, template injection from `${{ }}` in scripts, and jobs with broader permissions than they use.

It is in Assess because [jactionlint](./jactionlint.md) says its security rules follow zizmor's audits, which
may make running both redundant. A single run of zizmor against a release workflow, compared with jactionlint's
output on the same file, answers it. Whatever zizmor finds that jactionlint does not is the evidence for Trial.
No finding, and it stays here or moves to Hold.
