---
id: '4761776210'
title: Resource placement via untyped recursive containers
state: Reviewing
created: 2026-07-09
tags: [multi-tenancy, hierarchy, authorization, platform-design]
category: Platform
---

# Resource placement via untyped recursive containers

## Context

Platforms that host resources on behalf of organizations (agents,
schedules, skills, policies) must answer "where does this resource live?"
before they can answer who sees it, who may use it, and which rules apply
to it.

The tempting first answer is to enumerate the organizational levels the
platform expects, such as `org | project | user`, and put that enum on
every resource. This fails on contact with real tenants. One company
organizes by teams inside departments, another by client accounts, another
by environments, and a solo operator has no structure at all. Any enum we
pick encodes our guess about their org chart, and every mismatch becomes
either a schema migration or a workaround.

Two adjacent concerns get conflated with placement and must be separated
first, because they answer different questions:

| Concern | Question | Nature |
| --- | --- | --- |
| Tenant | Which isolation wall is this inside? | The hard boundary; nothing crosses it. |
| Placement | Where does it live within the tenant? | Structural: visibility, routing, name resolution. |
| Ownership | Which human answers for it? | Accountability: a principal, not a place. |

Ownership must not be derived from placement. A tenant-wide resource still
needs exactly one accountable human, because escalations need an
addressee. A resource placed in one group may be maintained by someone
outside it.

### What the industry converged on

All three major clouds faced unknown tenant structure and independently
built the same architecture:

| Platform | Wall | Generic recursive middle | Promoted leaf (interpreted) | Rules flow down as |
| --- | --- | --- | --- | --- |
| Google Cloud | Organization | Folders (untyped; "departments, teams, applications, environments") | Project (billing, quotas, APIs) | IAM policy (additive) |
| AWS | Organization root | Organizational Units (untyped, recursive) | Account (billing, isolation) | SCPs (ceilings/filters) |
| Azure | Tenant root | Management Groups (untyped, recursive) | Subscription (billing) | Azure Policy + RBAC |

Three properties recur:

1. The middle of the hierarchy is untyped and recursive. None of them ship
   a "team" or "department" concept; customers model themselves. Every
   vendor imposes a small fixed nesting limit rather than unbounded depth.
2. Exactly one container kind is promoted: the level where billing and
   isolation anchor (Project, Account, Subscription). Fully generic
   hierarchies do not exist in production, and fully enumerated ones do
   not either.
3. Policy attaches to nodes and inherits downward, never as fields on the
   resources themselves.

Two boundary cases complete the picture. Kubernetes shipped flat
namespaces plus labels, and hierarchy had to be bolted on afterward via
the Hierarchical Namespace Controller; that is the cautionary tale for
skipping the tree. Zanzibar (Google's authorization system, ancestor of
SpiceDB) is the opposite extreme: no fixed hierarchy at all, only
relations such as `parent-of` and `member-of`, with authorization resolved
over whatever graph the tenant builds. Relations of that kind sit
underneath membership resolution in any of these designs.

### The inheritance-semantics fork

The clouds disagree on one thing, and the disagreement is a real design
input rather than noise. GCP IAM inheritance is additive-only: a child can
gain access from its ancestors, never lose it. AWS SCPs are ceilings: an
ancestor can bound what everything below may do. These are not
interchangeable. Permissions and limits inherit in opposite moods.

## Resolution

Chosen option: one untyped recursive `Container` entity, with the tenant
as the single promoted anchor, because it is the only pattern that
survived at scale across three independent cloud vendors, it removes every
platform guess about tenant org charts, and it keeps the platform's
interpretation surface minimal and provable.

The model, reduced to what the mechanism actually needs: **there is no
container entity at all**. A container is an id that appears in its
tenant's hierarchy, and the hierarchy is the entity:

```
Hierarchy (one per tenant, event-sourced):
  NodeAdded   { nodeId, parentId }
  NodeMoved   { nodeId, fromParent, toParent }
  NodeRemoved { nodeId }
```

The current tree is a projection of those events. This placement of the
parent relationship follows from the commands themselves: adding or moving
a node validates tree invariants (parent exists, no cycle, depth cap), so
the tree is the unit of consistency, not the node. Nodes carry no fields;
a `parentId` is event data, not a node property.

Everything else is derivable, decorative, or a surface concern:

- The tenant is the tree; the wall needs no field anywhere.
- `kind` (`project`, `team`, `user-home`) is an entry in the standard
  labels map, attached to the node id like labels on any entity. A value
  the platform never interprets does not deserve schema.
- A human-readable name or slug (unique among siblings) belongs to the
  API-surface layer that renders path-style resource names. Exposing a
  parent pointer on read models (as GCP folders and Kubernetes HNC do) is
  a projection choice, not model.
- Every resource carries a single `container` reference (one canonical
  node id, its placement) plus a separate `owner` principal (its
  accountability). Neither is derivable from the other.
- Depth is capped at a fixed limit of 10 levels, enforced as a tree
  invariant at the point of change. The number is deliberately deeper than
  any observed tenant need while keeping walk-up bounded; changing it
  later only relaxes or tightens a validation, never the model.

The platform interprets the tree through exactly two operations:

1. **Walk up (resolution).** Resolving a resource by name from a container
   searches that container, then its ancestors toward the root; the
   nearest match wins. This generalizes "user copy shadows project copy
   shadows org template" without naming any of those levels.
2. **Flow down (policy).** Stances attached to a container (access
   bindings, budgets, evaluation rules) apply to its entire subtree, with
   the inheritance mood split by stance type:
   - additive for permissions and grants (the GCP IAM mood): descendants
     gain, never lose;
   - ceiling for budgets and limits (the AWS SCP mood): ancestors bound
     descendants.

Three clarifications complete the semantics:

- **Queries are projections, not a third operation.** Listing or selecting
  resources across a subtree (for example, routing work to any agent
  matching a label under a given node) is a read-model query that may
  traverse the projected tree in either direction. The two operations
  above are the only *semantic* interpretations the platform defines;
  everything else reads the projection.
- **Membership is not hierarchy data.** Principals relate to node ids
  through relation tuples (`member-of`) held by the authorization system,
  in the Zanzibar style. The hierarchy stream owns structure only.
  Effective visibility composes the two: membership says where you stand;
  walk up says what you can reach from there.
- **Moves are rare, human-only, and take effect prospectively.**
  `NodeMoved` revalidates tree invariants and repositions the whole
  subtree; inherited stances (grants, ceilings) are positional, so they
  re-evaluate from the new position at their next evaluation. This is
  consistent with the platform rule that definitions pin while
  authorization never pins: nothing that referenced a node id breaks,
  because ids are stable and only the arrangement changed.

Promotion rule, the escape hatch: if the platform ever must genuinely
interpret a kind (for example, billing rolls up per "project"), that one
kind is promoted to a real concept at that time. Promotion is cheap;
demotion is a breaking change. The tenant anchor is the only promotion
made up front, matching the one promotion all three clouds made.

### How the model shrank (decision journey)

The recorded drafts, each rejected on challenge, are part of this
decision:

1. `Container { id, tenant, parentId?, kind, name }`. Rejected: `tenant`
   is derivable (the root ancestor), `kind` is an uninterpreted label
   (belongs in the labels map), `name` is an API-surface slug.
2. `Container { id, parentId? }`. Rejected: the parent relationship is not
   a node property. The commands that change the tree validate tree-wide
   invariants (parent exists, no cycle, depth), so the tree is the
   consistency unit and the event stream; a node owns nothing.
3. Final: no container entity. A container is an opaque id whose meaning
   accrues from the planes that mention it: hierarchy events arrange it,
   labels decorate it, policy bindings select it, resources reference it.
   Validity of an id is checked where it is used, against the hierarchy
   projection, never inside consumers.

What this rejects:

- Enumerated scope levels (`org | project | user` as an enum on
  resources): encodes our guess of their org chart; every mismatch is a
  migration.
- Flat plus labels only (the Kubernetes mood): no native shadowing or
  policy inheritance, so hierarchy gets reinvented badly on top.
- Pure relations with no canonical parent (raw Zanzibar): maximally
  flexible, but resources lose a single unambiguous home, and name
  resolution ("which `pr-reviewer` do I get here?") has no defined answer.
  Relations remain the substrate for membership; placement stays a single
  canonical parent.

## Links

- [Google Cloud resource hierarchy (Folders)](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy)
- [AWS Organizations: Organizational Units](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html)
- [Azure management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)
- [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/pub48190/)
- [Kubernetes Hierarchical Namespace Controller](https://github.com/kubernetes-sigs/hierarchical-namespaces)
- [Google AIP-122: Resource names](https://google.aip.dev/122) / [AIP-124: Resource association](https://google.aip.dev/124)
