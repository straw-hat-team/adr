---
id: '7568965702'
title: Define maintenance tiers for clients, adapters and integrations
state: Draft
created: 2026-11-27
tags: [maintenance, compatibility, release]
category: General
---

# Define maintenance tiers for clients, adapters and integrations

## Context

When a product changes its API, which clients and adapters have to be ready on
release day? Calling an integration "official" tells users little about when
it will gain a feature or who will fix it if an upgrade breaks it.

NATS gives its users a way to choose. Synadia maintains both Tier 1 and Tier 2
clients. Tier 1 clients track new server features at release, Tier 2 clients
can adopt them later, and community clients have independent maintainers.
We adopt that distinction for implementations of a shared product contract.

## Resolution

For each client, adapter or integration it lists, the product team **MUST**
publish a maintenance tier or mark the implementation unmaintained if nobody
owns it. Assign the tier to the individual implementation.
Two adapters for the same product can have different owners and release
commitments.

| Tier          | Maintainer             | When does a new in-scope feature ship?                             |
| ------------- | ---------------------- | ------------------------------------------------------------------ |
| **Tier 1**    | Our team               | With the product release that introduces it.                       |
| **Tier 2**    | Our team               | On the implementation's own schedule. Feature gaps are documented. |
| **Community** | Independent maintainer | On the maintainer's schedule.                                      |

The maintainer owns bug reports, security updates and releases for the
implementation. If a product change would break a documented capability on a
supported version of a Tier 1 or Tier 2 implementation, the team **MUST**
preserve compatibility, ship a fix, or complete the published deprecation
process before releasing the change.

### Assigning and changing a tier

Record the tier where users choose an implementation, alongside its maintainer,
issue-reporting route, supported versions and capabilities. For a community
implementation, link to the maintainer's own documentation for those details.
Record the launch stage separately. A Tier 2 adapter can be GA for the
capabilities it supports. The launch stage governs production support and any
applicable SLA. [ADR#1121224116](../1121224116/README.md)

Before assigning a team-maintained tier, the owning team **MUST** accept the
maintenance work and show passing compatibility checks for the advertised
scope. Tier 1 also requires those checks to run as part of the product release
decision. Choose Tier 2 when the team can maintain existing behavior but needs
an independent feature schedule.

When ownership or release coverage changes, update the listing. Announce a
reduction in commitment in the release notes, with the affected versions,
effective date and any migration path. If maintenance ends, mark the
implementation unmaintained. Assign Community only when an independent
maintainer takes ownership.

### TrogonAI sandbox adapter example

Suppose TrogonAI adds a sandbox operation for pausing and resuming a lease.
If the Daytona adapter is Tier 1 and the operation falls within its scope, the
release waits until a conformance check pauses and resumes a Daytona sandbox.
If the E2B adapter is Tier 2, the team can list pause and resume as pending
and ship. If the same release also breaks command execution on a supported
version of the E2B adapter, that regression blocks the release.
For a community adapter, users check its maintainer's release notes to see
when pause and resume become available.

The tier assignments in this example are hypothetical.

## Links

- [NATS ecosystem and client tiers](https://docs.nats.io/concepts/ecosystem#clients)
