---
id: '6310044131'
title: Placement is referenced by a bare parent field
state: Reviewing
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

The explicit field appears exactly on movable resources, which is what
our resources are. GCP's and Azure's values are typed references, so the
value states what kind of node the parent is.

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

## Consequences

- Engineers arriving from GCP, AWS, Azure, or Kubernetes read the field
  correctly on sight.
- Grep for `parent[^A-Z_]` finds every placement reference across
  services; qualified kinship never pollutes the result.
- Moving a resource is a change of `parent`, which keeps move APIs
  uniform (`sourceParent`, `destinationParent`) across services.

## Links

- [ADR#4761776210](../4761776210/README.md): Resource placement via untyped recursive containers
- [GCP Project resource: `parent` field and `projects.move`](https://docs.cloud.google.com/resource-manager/reference/rest/v3/projects)
- [AWS Organizations ListParents ("a child can have only a single parent")](https://docs.aws.amazon.com/organizations/latest/APIReference/API_ListParents.html)
- [AWS Organizations MoveAccount (`SourceParentId`, `DestinationParentId`)](https://docs.aws.amazon.com/organizations/latest/APIReference/API_MoveAccount.html)
- [Azure Management Groups Get (`properties.details.parent`)](https://learn.microsoft.com/en-us/rest/api/managementgroups/management-groups/get)
- [Kubernetes HNC concepts (`.spec.parent`)](https://github.com/kubernetes-sigs/hierarchical-namespaces/blob/master/docs/user-guide/concepts.md)
