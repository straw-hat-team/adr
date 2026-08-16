---
id: '4761776210'
title: Resource placement via untyped recursive containers
state: Approved
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
| Ownership | Which principal answers for it? |

Ownership is never derived from placement: a tenant-wide resource still
needs exactly one accountable principal. The conflation is tempting
enough that reviewers keep proposing it ("whoever owns the place owns
what is in it"), so the Resolution below states the separation as a rule
rather than leaving it as prose.

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

**Structure encoded in the string (paths or prefixes).** Placement as a
path such as `acme/backend/ml`: walk-up is segment-stripping, flow-down is
prefix matching, and no tree needs to exist. Rejected: a rename or move
invalidates every pointer (unrepairable wherever history is immutable;
with opaque ids a single recorded move rearranges everything and no
pointer changes); there is no authoritative structure to validate against, so a
typo silently mints a phantom branch and restructures leave no audit
trail; and policy bound to a prefix detaches silently on rename. The
chosen design keeps the pointer an opaque string and moves the structure
into audited tree operations.

**Multiple placements per resource.** Rejected: placement exists to answer
which policy chain governs a resource and where name resolution starts;
two parents give two ceilings and two shadowing orders with no defined
winner. All three clouds are single-parent for the same reason (AIP-124:
at most one canonical parent). The need to appear in several groupings is
served by labels (unlimited), and cross-place access by shares; one
placement for governance, many labels for queries.

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

Chosen option: one hierarchy of untyped places per tenant, because it is
the only pattern that survived at scale across three independent cloud
vendors, and it removes every platform guess about tenant org charts.

**A container is a named place in the tenant's tree, not a thing.**
Nothing is stored inside one; resources point at it.

The decision, five rules:

1. Each tenant has one tree of places. A place is an opaque id. The tree
   changes only through three audited operations (add, move, remove),
   each validated against the whole tree (parent exists, no cycles, depth
   cap of 10). There is no container record; the current tree is derived
   from the history of those operations.
2. Every resource carries exactly one container id (where it lives,
   spelled `parent` on the resource per
   [ADR#6310044131](../6310044131/README.md)) and one `owner` principal
   (which principal answers for it), stored independently. Neither
   derives from the other, in either direction: placement never confers
   ownership, and ownership never implies placement. See "Placement does
   not confer ownership" below.
3. The platform never interprets what a place *means*. Words like
   "project" or "team" are labels on the id; display names are
   API-surface slugs. No code path is conditioned on them.
4. **Finding walks up.** Looking up a resource by name searches the
   starting place, then its ancestors toward the root; the nearest match
   wins.
5. **Rules flow down.** A policy attached to a place governs everything
   at or below it. Permissions accumulate downward (a child can gain,
   never lose); limits bound downward (a parent caps everything below).

### Placement does not confer ownership

The recurring misreading is that a resource is owned by whoever owns the
place it sits in, making the `owner` field redundant. It is not, for
three reasons, each independently sufficient:

1. **A place has no owner to inherit from.** By rule 1 a place is an
   opaque id with no container record; the tree is derived from the
   history of add, move, and remove operations. There is no field on a
   place naming a principal, and there is deliberately none to add: who
   belongs to a place is membership, which lives in the authorization
   system, not in the tree.
2. **What flows down is permission, not accountability.** Rule 5 grants a
   set of principals access to everything at or below a node. Ownership
   is the opposite shape: exactly one principal answerable for one
   resource. A set that grows as it descends cannot yield a single
   accountable principal. "The team lead can administer everything in
   this place" and "this person answers for this agent" are different
   claims, and only the second survives the team lead's departure.
3. **Placement is designed to change.** Moving a resource is a routine
   audited operation. Under derivation, a move would silently reassign
   accountability with no owner-change event anywhere, which is precisely
   the record an accountability field exists to keep. Ownership transfer
   is its own audited operation on its own field.

The permitted correlation is a **write-time default, never a read-time
derivation**: a create call may default `owner` to the caller, and
tooling may suggest owners from place membership. Whatever is chosen is
then stored on the resource and changes only by explicit reassignment.

Both fields are also mandatory and total, which is what rules out the
derivation as a space saving: a resource placed at the root of the tree,
governed by no narrower policy, still carries exactly one accountable
`owner`.

Neither field says anything about mutation authority, which is a third
axis entirely: whether a row is converged by the system or written by
principals is `managed_by`, per
[ADR#8779742261](../8779742261/README.md), which also reserves
`owner`/`owned_by` for exactly the belonging sense used here.

## Consequences

- "What is in this place?" is a query over resource pointers; the tree
  itself stores nothing.
- Who belongs to a place (membership) is authorization data, kept in the
  authorization system, not in the tree.
- "Who answers for this resource?" is a read of one field, never a walk
  up the tree, and it keeps answering after a move. A schema that omits
  `owner` because the place implies it is a review defect.
- Moving a place is one audited operation; ids never change, so nothing
  that references a place breaks. Policies apply from the new position
  going forward.
- If the platform ever needs to treat one kind of place specially (for
  example, billing per "project"), that kind is promoted to a real
  concept at that moment, by a new decision. Until then, everything stays
  a label.
- How each service stores the tree history (event stream, audited table)
  is that service's implementation choice.

## Links

- [ADR#6310044131](../6310044131/README.md): Placement is referenced by a
  bare parent field
- [ADR#8779742261](../8779742261/README.md): Actor and Authority Taxonomy
  for Managed Systems
- [Google Cloud resource hierarchy (Folders)](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy)
- [AWS Organizations: Organizational Units](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html)
- [Azure management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)
- [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/pub48190/)
- [Kubernetes Hierarchical Namespace Controller](https://github.com/kubernetes-sigs/hierarchical-namespaces)
- [Google AIP-122: Resource names](https://google.aip.dev/122) / [AIP-124: Resource association](https://google.aip.dev/124)
