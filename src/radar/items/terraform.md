---
name: Terraform
quadrant: tools
history:
  - edition: '2026.2'
    ring: hold
tags: [infrastructure, iac, licensing]
---

# Terraform

Terraform still provisions infrastructure correctly, and the HCL and state model it popularized are the reason
[OpenTofu](./opentofu.md) could exist at all. That part of the job was never in question.

It is on Hold because HashiCorp stopped granting the license that made adopting it a decision without a
counterparty. In August 2023 HashiCorp relicensed Terraform from MPL 2.0 to the Business Source License, a
source-available license that restricts competing commercial use and only converts to MPL four years after each
version's release. IBM's acquisition of HashiCorp, completed in 2025, adds a second party to that license going
forward, not fewer. Depending on Terraform now means depending on one vendor's terms for the tool underneath every
other infrastructure decision, which is exactly the provider lock-in a build-on-top choice is supposed to avoid.

Hold is not a removal order. Infrastructure already provisioned by Terraform is not broken and does not need an
emergency migration. New infrastructure should start on OpenTofu, and a module written against one reads against
the other with no rewrite, since OpenTofu is a compatible fork of the pre-relicense codebase.
