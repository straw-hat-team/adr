---
id: '6310044131'
title: Placement is referenced by a bare parent field
state: Approved
created: 2026-07-09
tags: [naming, multi-tenancy, hierarchy, api-design]
category: Platform
---

# Placement is referenced by a bare parent field

## Context

[ADR#4761776210](../4761776210/README.md) places every resource at
exactly one node of its tenant's container tree. Each service now needs a field on its resources that
references that node, and without a shared convention each service will
invent its own (`folder`, `scope`, `container`, `parentId`), which makes
cross-service reading and tooling needlessly hard.

Two worries shaped the naming:

**Ambiguity with kinship.** Systems also have parent-child relationships
between resources of the same kind (a session spawned by a session, an
agent delegated by an agent). Could `parent` mean two things?

**Collisions.** `container` collides with OCI containers on any platform
that runs workloads; `scope` and `location` carry established meanings in
cloud APIs (auth scopes, regions).

Industry evidence, verified against primary sources (linked below):

- **Google Cloud**: the Project resource has a field named `parent`,
  documented as "A reference to a parent Resource. eg.,
  `organizations/123` or `folders/876`", plus a `projects.move` method
  ("Move a project to another place in your resource hierarchy, under a
  new resource parent").
- **AWS**: Organizations speaks Parent throughout: `ListParents` ("Lists
  the root or organizational units (OUs) that serve as the immediate
  parent of the specified child"), `MoveAccount(AccountId,
  SourceParentId, DestinationParentId)`. Its docs also state the single
  canonical parent outright: "In the current release, a child can have
  only a single parent."
- **Azure**: the ManagementGroup resource carries
  `properties.details.parent` (`ParentGroupInfo`: "The ID of the parent
  management group", with `id`, `name`, `displayName`).
- **Kubernetes HNC**: "The parent is defined by the `.spec.parent` field"
  of each namespace's `HierarchyConfiguration` object.

**An honest caveat about this evidence.** The four attestations above sit
on org-structure objects (OUs, folders, management groups, projects), not
on arbitrary resources placed inside the structure, which is our case.
For placed leaf resources the picture differs: GCP leaves carry no stored
parent field (placement is encoded in the resource name), AWS leaves have
no hierarchy (tags), and Kubernetes, the one platform with a stored
placement field on every object, calls it `namespace`. The convention
still transfers to our case on three narrower grounds:

1. Movability is the real dividing line, not org-versus-resource: GCP's
   stored `parent` field appears exactly on things that move (Project,
   Folder) and not on things that don't. Our resources are movable, so
   the Project precedent is a case match.
2. `parent` is Google's universal request vocabulary for placing any
   resource, not just org nodes: every AIP-133 create is
   `Create<Thing>(parent: ...)` for books and topics as much as folders.
3. The honest counter-candidate from the leaf-resource world,
   `namespace`, names a flat concept; importing it onto a recursive
   tenant-drawn tree would mislead the engineers it is meant to help.

GCP's and Azure's parent values are typed references, so the value states
what kind of node the parent is.

Compound alternatives were considered and each carries a wart:
`parent_id` does not say which parent; `parent_container` reintroduces the
OCI collision; `parent_node` and `parent_folder` introduce vocabulary the
placement ADR does not use. The ambiguity a compound would prevent does
not occur in practice: ambiguity lives inside a single schema, and no
schema carries both placement and unqualified kinship.

## Resolution

Chosen option: a bare `parent` field, because it matches the verified
industry convention for movable resources and the feared ambiguity cannot
arise under the qualification rule below.

1. On any resource, the field `parent` refers to placement: the node of
   the tenant's container tree the resource lives in. It has no other
   meaning, on any resource, in any service.
2. Kinship between resources is always qualified, never bare:
   `parentSessionId`, `parentAgentId`, `sourceParentId`. A bare `parent`
   holding kinship is a review defect.
3. Parent values are typed references (the id carries its kind, in the
   manner of `folders/876`), so the value documents what the parent is.
4. The spellings `parentId` and `parent_id` are disallowed, for a reason
   internal to our own naming pattern rather than imported taste. Every
   id-suffixed reference field we write is `<Type>Id`: the word before
   the suffix names a resource type (`agentId`, `sessionId`,
   `rubricId`). "Parent" is not a type; it is a role, and placement may
   point at a node of any kind, which is its entire point. So the two
   valid shapes are: role-named bare `parent` for placement, and
   role-plus-type `parent<Type>Id` for kinship (`parentSessionId`, where
   Session is the type). `parentId` is a role plus suffix with no type,
   fitting neither pattern, so it cannot be written. This mirrors actual
   Google practice, which mixes bare `parent` with type-named `book_id`
   in one request without contradiction. Weight note: the load-bearing
   rule of this ADR is kinship qualification (rule 2); this spelling rule
   is a consistency rule on top of it.

## Consequences

- Engineers arriving from GCP, AWS, Azure, or Kubernetes read the field
  correctly on sight.
- Grep for `parent[^A-Z_]` finds every placement reference across
  services; qualified kinship never pollutes the result.
- `parent` is where accountability is anchored: attaching to a node is an
  authorized write, so who answers for the node answers for what hangs
  off it. Resources do not carry an `owner` field to restate that, per
  [ADR#4761776210](../4761776210/README.md). The field still grants
  nothing on its own; policy evaluation reads it as input.
- Moving a resource is a change of `parent`, which keeps move APIs
  uniform (`sourceParent`, `destinationParent`) across services.
- The rule is enforced in schema tooling, not review vigilance: the
  protobuf lint pipeline accepts exactly two shapes and rejects the rest.
  A field named exactly `parent` must reference a hierarchy node; a field
  matching `parent<Type>Id` is kinship and must carry the qualifier;
  every other `parent*` spelling (including `parentId` and `parent_id`)
  is rejected (the machine-checkable analog of Google's
  `google.api.resource_reference` annotations on parent fields).
- Domains that own a tree of same-kind resources qualify with their own
  type (`parentTaskId`, `parentCommentId`). The hierarchy service's own
  events are the one near-bare use (`parentId` on a node), which is
  consistent: there the parent is placement.
- Foreign protocols keep their names at the boundary. If an external
  standard uses bare `parent` for kinship, adapters translate at the
  edge; this ADR governs our stored schemas and events only.

## Links

- [ADR#4761776210](../4761776210/README.md): Resource placement via untyped recursive containers
- [GCP Project resource: `parent` field and `projects.move`](https://docs.cloud.google.com/resource-manager/reference/rest/v3/projects)
- [AWS Organizations ListParents ("a child can have only a single parent")](https://docs.aws.amazon.com/organizations/latest/APIReference/API_ListParents.html)
- [AWS Organizations MoveAccount (`SourceParentId`, `DestinationParentId`)](https://docs.aws.amazon.com/organizations/latest/APIReference/API_MoveAccount.html)
- [Azure Management Groups Get (`properties.details.parent`)](https://learn.microsoft.com/en-us/rest/api/managementgroups/management-groups/get)
- [Kubernetes HNC concepts (`.spec.parent`)](https://github.com/kubernetes-sigs/hierarchical-namespaces/blob/master/docs/user-guide/concepts.md)
