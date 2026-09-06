---
name: OpenTofu
quadrant: tools
history:
  - edition: '2026.2'
    ring: adopt
tags: [infrastructure, iac, licensing]
---

# OpenTofu

OpenTofu is the fork of [Terraform](./terraform.md) taken at the last MPL 2.0 release, before HashiCorp's 2023 move
to the Business Source License. Same HCL, same state model, same provider ecosystem; a module written for one
reads for the other.

It sits in Adopt because the thing that made Terraform a safe default, an open license with no single company
holding the terms, moved to OpenTofu and stayed there. The Linux Foundation governs it, MPL 2.0 covers every
release with no four-year conversion clock, and no single vendor's acquisition or relicensing can change those
terms unilaterally. That is the same bet the [SOPS](./sops.md) and [mise](./mise.md) placements are: a tool
maintained under terms nobody can quietly revoke.

The fork has since earned Adopt on its own merits too, not just on the license it inherited. State encryption
ships natively, without a wrapper script around `terraform.tfstate`. Provider and module authors iterate under a
foundation instead of clearing changes with one company. Reaching for Terraform instead of OpenTofu needs a
justification now, not the other way around.
