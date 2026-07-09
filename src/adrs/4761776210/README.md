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

Platforms that host resources for organizations (agents, schedules,
skills, policies) must answer "where does this resource live?" before they
can answer who sees it, who may use it, and which rules apply to it.

Three concerns get conflated and must stay separate:

| Concern | Question |
| --- | --- |
| Tenant | Which isolation wall is this inside? |
| Placement | Where does it live within the tenant? |
| Ownership | Which human answers for it? |

Ownership is never derived from placement: a tenant-wide resource still
needs exactly one accountable human.

### Considered options

**Enumerated levels.** An enum such as `org | project | user` on every
resource. Rejected: it encodes our guess about the tenant's org chart.
One company organizes by teams inside departments, another by client
accounts, another is a solo operator. Every mismatch becomes a schema
migration or a workaround.

**Flat namespaces plus labels** (the Kubernetes shape). Rejected: no
native shadowing or policy inheritance, so hierarchy gets reinvented
badly on top. Kubernetes itself needed the Hierarchical Namespace
Controller bolted on later.

**Pure relations, no canonical parent** (the raw Zanzibar shape).
Rejected for placement: resources lose a single unambiguous home, and
"which `pr-reviewer` do I get here?" has no defined answer. Relations
remain the right substrate for membership.

**A container entity with fields.** Two drafts died under review:
`{ id, tenant, parentId?, kind, name }` (tenant is derivable, kind is an
uninterpreted label, name is an API-surface slug) and then
`{ id, parentId? }` (the parent is not a node property: commands that
change the tree validate tree-wide invariants, so the tree is the
consistency unit, not the node).

### What the industry converged on

All three major clouds faced unknown tenant structure and independently
built the same shape:

| Platform | Wall | Untyped recursive middle | Promoted leaf | Rules flow down as |
| --- | --- | --- | --- | --- |
| Google Cloud | Organization | Folders | Project (billing, quotas) | IAM policy (additive) |
| AWS | Organization root | Organizational Units | Account (billing, isolation) | SCPs (ceilings) |
| Azure | Tenant root | Management Groups | Subscription (billing) | Azure Policy + RBAC |

Recurring properties: the middle is untyped and recursive (customers
model themselves), exactly one container kind is promoted (where billing
and isolation anchor), policy attaches to nodes and inherits downward,
and every vendor caps nesting depth. The clouds disagree on inheritance
mood: GCP IAM is additive-only (children gain, never lose), AWS SCPs are
ceilings (ancestors bound children). Permissions and limits inherit in
opposite moods, and a design needs both.

## Resolution

Chosen option: one event-sourced hierarchy of untyped places per tenant,
because it is the only pattern that survived at scale across three
independent cloud vendors, and it removes every platform guess about
tenant org charts.

**A container is a named place in the tenant's tree, not a thing.**
Nothing is stored inside one; resources point at it. The rules:

1. Each tenant has one tree. Its nodes ("containers") are opaque ids.
   The tree is an event stream (`NodeAdded`, `NodeMoved`, `NodeRemoved`);
   the current tree is a projection. There is no container record.
2. Every resource carries exactly one `container` id (placement) and one
   `owner` principal (accountability). Neither derives from the other.
3. `kind` and display names are labels and API-surface slugs on the node
   id. The platform has no code path conditioned on them.
4. **Resolution walks up.** Finding a resource by name searches the
   starting place, then its ancestors; nearest match wins.
5. **Policy flows down.** A stance attached to a place governs its whole
   subtree: permissions and grants inherit additively; budgets and limits
   inherit as ceilings.
6. Queries ("what is in this place?") are read-model projections over
   resource pointers. Membership is relation tuples in the authorization
   system, not tree data.
7. Moves are human-only tree events. Inherited stances are positional and
   re-evaluate from the new position; ids are stable, so references never
   break. Tree invariants (parent exists, no cycles, depth cap of 10) are
   enforced by the tree's command handler at the point of change.
8. The tenant is the only promoted concept. Any other kind gets promoted
   only when the platform must genuinely interpret it (promotion is
   cheap; demotion is breaking).

## Links

- [Google Cloud resource hierarchy (Folders)](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy)
- [AWS Organizations: Organizational Units](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html)
- [Azure management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)
- [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/pub48190/)
- [Kubernetes Hierarchical Namespace Controller](https://github.com/kubernetes-sigs/hierarchical-namespaces)
- [Google AIP-122: Resource names](https://google.aip.dev/122) / [AIP-124: Resource association](https://google.aip.dev/124)
