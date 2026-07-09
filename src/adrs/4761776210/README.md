---
id: '4761776210'
title: Resource placement via untyped recursive containers
state: Draft
created: 2026-07-09
tags: [multi-tenancy, hierarchy, authorization, platform-design]
category: Platform
---

# Resource placement via untyped recursive containers

## Context

Platforms that host resources on behalf of organizations (agents, schedules,
skills, policies, ...) must answer "where does this resource live?" before
they can answer who sees it, who may use it, and which rules apply to it.

The tempting first answer is to enumerate the organizational levels the
platform expects — `org | project | user`, or `org | team | user` — and put
that enum on every resource. This fails on contact with real tenants: one
company organizes by teams inside departments, another by client accounts,
another by environments, and a solo operator has no structure at all. Any
enum we pick encodes *our* guess about *their* org chart, and every mismatch
becomes either a schema migration or a workaround.

Two adjacent concerns get conflated with placement and must be separated
first, because they answer different questions:

| Concern | Question | Nature |
| --- | --- | --- |
| Tenant | which isolation wall is this inside? | the hard boundary; nothing crosses it |
| Placement | where does it live within the tenant? | structural: visibility, routing, name resolution |
| Ownership | which human answers for it? | accountability: a principal, not a place |

Ownership must not be derived from placement: a tenant-wide resource still
needs exactly one accountable human (escalations need an addressee), and a
resource placed in one group may be maintained by someone outside it.

### What the industry converged on

All three major clouds faced unknown tenant structure and independently
built the same architecture:

| Platform | Wall | Generic recursive middle | Promoted leaf (interpreted) | Rules flow down as |
| --- | --- | --- | --- | --- |
| Google Cloud | Organization | **Folders** (untyped; "departments, teams, applications, environments — your choice") | **Project** (billing, quotas, APIs) | IAM policy (additive) |
| AWS | Organization root | **Organizational Units** (untyped, recursive) | **Account** (billing, isolation) | SCPs (ceilings/filters) |
| Azure | Tenant root | **Management Groups** (untyped, recursive) | **Subscription** (billing) | Azure Policy + RBAC |

Three properties recur:

1. **The middle of the hierarchy is untyped and recursive.** None of them
   ship a "team" or "department" concept; customers model themselves.
   Depth is capped at single digits everywhere.
2. **Exactly one container kind is promoted** — the level where billing and
   isolation anchor (Project / Account / Subscription). Fully generic
   hierarchies do not exist in production; fully enumerated ones don't
   either.
3. **Policy attaches to nodes and inherits downward**, never as fields on
   the resources themselves.

Two boundary cases complete the picture. Kubernetes shipped *flat*
namespaces plus labels, and hierarchy had to be bolted on afterward (the
Hierarchical Namespace Controller) — the cautionary tale for skipping the
tree. Zanzibar (Google's authorization system, ancestor of SpiceDB) is the
opposite extreme: no fixed hierarchy at all, only relations
(`parent-of`, `member-of`), with authorization resolved over whatever graph
the tenant builds — which is what sits underneath membership resolution in
any of these designs.

### The inheritance-semantics fork

The clouds disagree on one thing, and the disagreement is a real design
input rather than noise: GCP IAM inheritance is **additive-only** (a child
can gain access from its ancestors, never lose it), while AWS SCPs are
**ceilings** (an ancestor can bound what everything below may do). These
are not interchangeable: permissions and limits inherit in opposite moods.

## Resolution

Chosen option: **one untyped recursive `Container` entity, with the tenant
as the single promoted anchor**, because it is the only pattern that
survived at scale (three independent cloud vendors), it removes every
platform guess about tenant org charts, and it keeps the platform's
interpretation surface minimal and provable.

The model:

```
Container { id, tenant, parentId?, kind, name }
```

- Every tenant has a root container. Tenants build arbitrary trees under
  it. Depth is capped (single digits, matching industry practice).
- Every resource carries a single `container` reference — one canonical
  parent (placement), plus a separate `owner` principal (accountability).
  Neither is derivable from the other.
- **`kind` is a label, not a schema.** `"project"`, `"team"`,
  `"user-home"` are display vocabulary. The platform has no code path
  conditioned on `kind`.

The platform interprets the tree through exactly two operations:

1. **Walk up (resolution).** Resolving a resource by name from a container
   searches that container, then its ancestors toward the root; the
   nearest match wins. This generalizes "user copy shadows project copy
   shadows org template" without naming any of those levels.
2. **Flow down (policy).** Stances attached to a container (access
   bindings, budgets, evaluation rules) apply to its entire subtree — with
   the inheritance mood split by stance type:
   - **additive** for permissions/grants (GCP IAM mood): descendants gain,
     never lose;
   - **ceiling** for budgets/limits (AWS SCP mood): ancestors bound
     descendants.

Promotion rule (the escape hatch): if the platform ever must genuinely
*interpret* a kind — e.g. billing rolls up per "project" — that one kind is
promoted to a real concept at that time. Promotion is cheap; demotion is a
breaking change. The tenant anchor is the only promotion made up front,
matching the one promotion all three clouds made.

What this rejects:

- **Enumerated scope levels** (`org | project | user` as an enum on
  resources): encodes our guess of their org chart; every mismatch is a
  migration.
- **Flat + labels only** (Kubernetes mood): no native shadowing or
  policy inheritance; hierarchy gets reinvented badly on top.
- **Pure relations with no canonical parent** (raw Zanzibar): maximally
  flexible, but resources lose a single unambiguous home, and name
  resolution ("which `pr-reviewer` do I get here?") has no defined answer.
  Relations remain the substrate for *membership*; placement stays a
  single canonical parent.

## Links

- [Google Cloud resource hierarchy (Folders)](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy)
- [AWS Organizations — Organizational Units](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html)
- [Azure management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)
- [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/pub48190/)
- [Kubernetes Hierarchical Namespace Controller](https://github.com/kubernetes-sigs/hierarchical-namespaces)
- [Google AIP-122: Resource names](https://google.aip.dev/122) / [AIP-124: Resource association](https://google.aip.dev/124)
- Internal: agent-platform design record Q10/Q21/Q22 (operator research
  vault, `agent-definition/service-design-qa.md`)
