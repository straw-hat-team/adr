---
id: '4761776210'
title: Resource hierarchy via untyped recursive nodes
state: Approved
created: 2026-07-09
tags: [multi-tenancy, hierarchy, authorization, platform-design]
category: Platform
---

# Resource hierarchy via untyped recursive nodes

## Context

Platforms that host resources for organizations (agents, schedules,
skills, policies) must answer "where does this resource live?" before they
can answer who sees it, who may use it, and which rules apply to it.

Three concerns are distinct questions, though they are not independent:

| Concern | Question |
| --- | --- |
| Tenant | Which isolation wall is this inside? |
| Position | Which node of the tenant's hierarchy is it attached to? |
| Ownership | Which principal answers for it? |

Position is the governed one. Attaching a resource to a node is an
authorized write: the authorization system decides whether the calling
principal may attach there, and the principal accountable for that node
is accountable for everything under it. Ownership therefore has an answer
the moment position does, which is why this ADR does not require every
resource to carry an owner of its own.

A note on vocabulary, because three words for one concept caused repeated
confusion. The element of the tree is a **node**, the tree is the
tenant's **hierarchy**, and putting a resource at a node is **attaching**
it. This ADR previously said "place" and "container" for the node and
"placement" for the attachment; those words are retired. "Place" invited
a containment reading that the design denies, since nothing is stored
inside a node, and "placement" already means workload scheduling and
topology in cloud vocabulary (EC2 placement groups, proximity placement
groups, compute placement policies, pod placement). "Container" was
rejected for colliding with OCI containers by
[ADR#6310044131](../6310044131/README.md), which applied that same
collision test to the field name.

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
Rejected as the hierarchy: resources lose a single unambiguous home, and
"which `pr-reviewer` do I get here?" has no defined answer. Relations
remain the right substrate for membership.

**Structure encoded in the string (paths or prefixes).** A position
expressed as a path such as `acme/backend/ml`: walk-up is
segment-stripping, flow-down is
prefix matching, and no tree needs to exist. Rejected: a rename or move
invalidates every pointer (unrepairable wherever history is immutable;
with opaque ids a single recorded move rearranges everything and no
pointer changes); there is no authoritative structure to validate against, so a
typo silently mints a phantom branch and restructures leave no audit
trail; and policy bound to a prefix detaches silently on rename. The
chosen design keeps the pointer an opaque string and moves the structure
into audited tree operations.

**Multiple parents per resource.** Rejected: a position exists to answer
which policy chain governs a resource and where name resolution starts;
two parents give two ceilings and two shadowing orders with no defined
winner. All three clouds are single-parent for the same reason (AIP-124:
at most one canonical parent). The need to appear in several groupings is
served by labels (unlimited), and cross-node access by shares; one parent
for governance, many labels for queries.

**A node entity with fields.** Two drafts died under review:
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
model themselves), exactly one node kind is promoted (where billing
and isolation anchor), policy attaches to nodes and inherits downward,
and every vendor caps nesting depth. The clouds disagree on inheritance
mood: GCP IAM is additive-only (children gain, never lose), AWS SCPs are
ceilings (ancestors bound children). Permissions and limits inherit in
opposite moods, and a design needs both.

## Resolution

Chosen option: one hierarchy of untyped nodes per tenant, because it is
the only pattern that survived at scale across three independent cloud
vendors, and it removes every platform guess about tenant org charts.

**A node is a named position in the tenant's tree, not a thing.** Nothing
is stored inside one; resources attach to it.

The decision, five rules:

1. Each tenant has one tree of nodes. A node is an opaque id. The tree
   changes only through three audited operations (add, move, remove),
   each validated against the whole tree (parent exists, no cycles, depth
   cap of 10). There is no node record; the current tree is derived from
   the history of those operations.
2. Every resource carries exactly one node id: the node it is attached
   to, spelled `parent` on the resource per
   [ADR#6310044131](../6310044131/README.md) and typed as
   `trogon.hierarchy.v1alpha1.NodeId`. It is the only position field, and
   it is mandatory. A resource-level `owner` field is not required and is
   not the default; see "Ownership follows the hierarchy" below.
3. The platform never interprets what a node *means*. Words like
   "project" or "team" are labels on the id; display names are
   API-surface slugs. No code path is conditioned on them.
4. **Finding walks up.** Looking up a resource by name searches the
   starting node, then its ancestors toward the root; the nearest match
   wins.
5. **Rules flow down.** A policy attached to a node governs everything
   at or below it. Permissions accumulate downward (a child can gain,
   never lose); limits bound downward (a parent caps everything below).

### Ownership follows the hierarchy

A resource whose `parent` is `node_01h9x`, the node a tenant labels its
billing project, is answered for by whoever answers for that node.
Nothing has to be copied onto the resource for that to be true, because
the attachment was authorized against that node in the first place: the
write path establishes that the calling principal may attach a resource
there, and the principal accountable for the node is accountable for what
hangs off it. Adding an `owner` field to restate that is
counterproductive:

1. **It duplicates a fact the node already carries.** Two records of one
   truth diverge, and the copy is the one that goes stale, so reads have
   to pick a winner that no rule names.
2. **It re-asks a question authorization already answered.** The attach
   check is where a principal is bound to a node. A field written after
   that check reflects it at one instant and stops tracking.
3. **It makes routine governance changes lossy.** Reorganizing the tree,
   or moving a resource to a different node, re-anchors accountability by
   design; the audited tree operation is the record of that change. A
   stored owner survives the move unchanged and quietly becomes wrong.

The rules that follow, stated as bullets so that the numbered references
in this ADR always mean the five rules of the decision above:

- **No owner field by default.** Resources carry `parent`. A schema
  **SHOULD NOT** add an `owner` merely to make ownership look explicit.
- **The answer lives with the node.** Who answers for a node is
  authorization data, resolved in the authorization system exactly like
  membership, never stored in the tree; rule 1 leaves nodes as bare ids
  for exactly this reason.
- **Resolution walks up**, in the mood of rule 4: the nearest ancestor
  with an accountable principal wins, and the tenant root always has one.
  Every resource therefore resolves to exactly one answer, including a
  resource sitting at the root. That is the guarantee a mandatory `owner`
  column used to buy, now bought without the stale copy.
- **An owner field is an exception record.** A resource-level `owner`
  **MAY** exist only where the accountable principal genuinely differs
  from what walking up resolves. It carries no other meaning, so writing
  one that agrees with the resolved answer is a review defect, and the
  exception is worth a comment saying why the node is not the right
  anchor.
- **A recurring exception is a position problem.** If a resource needs a
  different accountable party often enough to feel like a pattern, it
  belongs at a different node; the schema does not need a field.

What a position still does **not** decide, because these are other axes:

- **Permission.** A `parent` value is not itself a grant. Policy attached
  to the node is evaluated per rule 5; the field records which node the
  resource is attached to, and authorization reads it as input rather
  than treating it as an answer.
- **Mutation authority.** Whether a row is converged by the system or
  written by principals is `managed_by`, per
  [ADR#8779742261](../8779742261/README.md), which is orthogonal to both
  position and ownership and reserves `owner`/`owned_by` for the
  belonging sense used here.

## Consequences

- "What is attached to this node?" is a query over resource pointers; the
  tree itself stores nothing.
- Who belongs to a node (membership) is authorization data, kept in the
  authorization system, not in the tree.
- "Who answers for this resource?" is answered from its node, so the
  answer stays correct through reorganizations without a migration or a
  backfill of owner columns.
- Moving a node is one audited operation; ids never change, so nothing
  that references a node breaks. Policies apply from the new position
  going forward.
- If the platform ever needs to treat one kind of node specially (for
  example, billing per "project"), that kind is promoted to a real
  concept at that moment, by a new decision. Until then, everything stays
  a label.
- How each service stores the tree history (event stream, audited table)
  is that service's implementation choice.

## Links

- [ADR#6310044131](../6310044131/README.md): Hierarchy position is
  referenced by a bare parent field
- [ADR#8779742261](../8779742261/README.md): Actor and Authority Taxonomy
  for Managed Systems
- [`trogon.hierarchy.v1alpha1.NodeId`](https://github.com/TrogonStack/trogon-proto/blob/main/proto/trogon/hierarchy/v1alpha1/node.proto)
- [Google Cloud resource hierarchy (Folders)](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy)
- [AWS Organizations: Organizational Units](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html)
- [Azure management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)
- [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/pub48190/)
- [Kubernetes Hierarchical Namespace Controller](https://github.com/kubernetes-sigs/hierarchical-namespaces)
- [Google AIP-122: Resource names](https://google.aip.dev/122) / [AIP-124: Resource association](https://google.aip.dev/124)
