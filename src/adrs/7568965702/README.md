---
id: '7568965702'
title: Define maintenance tiers for clients, adapters and integrations
state: Draft
created: 2026-11-27
tags: [maintenance, compatibility, release]
category: General
---

# Define maintenance tiers for clients, adapters and integrations

## Context and problem statement

When a product changes its API, which clients and adapters have to be ready on
release day? An integration labeled "official" can have a team that fixes bugs
without a commitment to ship every new feature on the day it launches.

## Decision drivers

- Users need to know who fixes a regression and which product versions they can rely on.
- Release owners need to know which implementations can hold up a product release.
- Maintainers need to support existing users even when they cannot take on a new feature immediately.

## Considered options

- **Official or community.** Users can identify the owner. They still have to
  ask whether a new feature will ship with the product.
- **A single release date for all team-maintained implementations.** Users get
  new features together. One delayed adapter holds up users of every other one.
- **Maintenance tiers.** Users can see both ownership and release commitments.
  Owners have to keep each implementation's scope and coverage current.

## Decision outcome

Adopt the NATS client model. Its tiers answer both who maintains an
implementation and when it gains new features. The product team **MUST**
publish the applicable tier for each maintained client, adapter or integration
it lists.

| Tier          | Maintainer             | Commitment for new features within the documented scope          |
| ------------- | ---------------------- | ---------------------------------------------------------------- |
| **Tier 1**    | Product team           | Ships with the product release that introduces the feature.      |
| **Tier 2**    | Product team           | Ships on its own schedule and documents gaps until then.         |
| **Community** | Independent maintainer | The maintainer decides what to implement and when to release it. |

### Assigning a tier

The listing **MUST** identify the maintainer, where to report issues,
supported versions and capabilities. A Community listing **MAY** link to the
maintainer's documentation for these details. If nobody owns maintenance, the
team **MUST** mark the implementation **Unmaintained**.

Before assigning Tier 1 or Tier 2, the owning team **MUST** accept
responsibility for bug reports, security updates and releases, and show passing
compatibility checks for the scope it advertises. For Tier 1, those checks
**MUST** also gate the product release. Tier 2 **MAY** defer new in-scope
features and **MUST** document the gaps.

### Releasing a change

For both team-maintained tiers, if a change would break documented behavior on
a supported version, the team **MUST** preserve compatibility, ship a fix, or
complete the published deprecation process before releasing the change.

When ownership or release coverage changes, the team **MUST** update the
listing. A reduction in commitment **MUST** be announced in the release notes
with the affected versions, effective date and any migration path. The team
**MUST** confirm that an independent maintainer accepts ownership before
assigning Community.

### Consequences

Users can choose a Tier 2 adapter for the capabilities it already supports.
The team takes on the cost of testing that behavior across supported versions.
Each Tier 1 assignment also adds a release dependency. If its checks fail, an
otherwise ready product release waits.

A maintenance tier alone cannot tell users whether a feature is ready for
production. Teams **MUST** document launch stage separately. A Tier 2 adapter
can reach General Availability for the capabilities it supports.
[ADR#1121224116](../1121224116/README.md)

## Links

- [NATS ecosystem and client tiers](https://docs.nats.io/concepts/ecosystem#clients)
