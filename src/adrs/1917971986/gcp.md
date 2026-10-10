# GCP: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

The Google Cloud resource hierarchy has three typed levels: the
organization at the root, folders as an optional grouping mechanism
beneath it, and projects as the fundamental organizing entity that
actually contains service resources. Organizations, folders, and
projects are all typed resources in Resource Manager, and both
organizations and folders act as policy inheritance points for
everything below them
([About resource
hierarchy](https://docs.cloud.google.com/resource-manager/docs/overview)).

Folders can be nested up to 10 levels deep, and a single parent folder
cannot directly contain more than 300 child folders
([Project
limits](https://docs.cloud.google.com/resource-manager/docs/limits)).

A project does not require an organization above it. A project can sit
at the top of its own hierarchy, with no organization or folder as an
ancestor, when it is created by a free trial or free tier user; such a
project can later be migrated into an organization's hierarchy once one
exists for the relevant domain
([About resource
hierarchy](https://docs.cloud.google.com/resource-manager/docs/overview)).

## Governance and work

The organization is the root policy inheritance point for both IAM
allow and deny policies and for Organization Policy Service
constraints, reaching every folder and project beneath it by default
([Using resource hierarchy for access
control](https://docs.cloud.google.com/iam/docs/resource-hierarchy-access-control);
[About resource
hierarchy](https://docs.cloud.google.com/resource-manager/docs/overview)).
Projects are where the actual work happens: enabling APIs, creating
resources, and managing collaborators
([About resource
hierarchy](https://docs.cloud.google.com/resource-manager/docs/overview)).

Billing runs through a parallel structure rather than the same
ownership chain. A Cloud Billing account defines who pays and can be
linked to one or more projects, while each project links to exactly
one billing account at a time; the organization owns a project for IAM
purposes, but the billing account merely pays for it and can belong to
a different organization, inheriting IAM permissions from its own
parent organization rather than the project's
([Overview of Cloud Billing
concepts](https://docs.cloud.google.com/billing/docs/concepts)).
A project without an active linked billing account cannot use billable
Google Cloud services
([Overview of Cloud Billing
concepts](https://docs.cloud.google.com/billing/docs/concepts)).

## Audiences and visibility

Google Cloud IAM does not document a named audience ladder, such as
public, organization-wide, or invited-members, for organizations,
folders, or projects as a whole. Access is granted through IAM allow
policy bindings naming specific principals: individual accounts,
groups, domains, service accounts, or one of two special identifiers.
`allUsers` represents anyone on the internet, with or without a Google
account, and `allAuthenticatedUsers` represents anyone authenticated
with a Google account or service account, excluding identities
federated from an external identity provider
([Principal
identifiers](https://docs.cloud.google.com/iam/docs/principal-identifiers)).
These identifiers behave as a public-style grant wherever a binding
accepts them, rather than as a configurable audience setting attached
to the hierarchy itself.

## Narrowing below a parent

IAM allow policy inheritance is additive only: the effective allow
policy on a resource is the union of its own policy and every
ancestor's policy, and nothing in an allow policy can revoke a grant
made higher up
([Using resource hierarchy for access
control](https://docs.cloud.google.com/iam/docs/resource-hierarchy-access-control)).
Narrowing access below an ancestor's grant instead requires an IAM deny
policy, attached at the organization, folder, or project level, never
to an individual resource. Deny policies are inherited by everything
below the point where they are attached, and IAM always evaluates
applicable deny policies before applicable allow policies, so a deny
rule blocks a permission regardless of any role granted above it. This
is documented as the intended pattern for granting a role broadly and
then excluding it for a narrower scope beneath that grant
([Deny
policies](https://docs.cloud.google.com/iam/docs/deny-overview)).

Organization Policy Service constraints offer a second, narrower form
of restriction. For list constraints, a parent's explicit `DENY`
values always take precedence during merging, so a child cannot permit
a value its parent has denied, while a child can still shrink an
allow-list further than its parent did
([Hierarchy
evaluation](https://docs.cloud.google.com/organization-policy/hierarchy-evaluation)).

## Ceilings from above

Organization Policy constraints are set at the organization, folder,
or project and, by default, are inherited by every descendant
([Understanding organization
policies](https://docs.cloud.google.com/resource-manager/docs/organization-policy/understanding-policies)).
For list constraints with inheritance enabled, a parent's `DENY`
values always win when merged with a child's configuration, so those
act as a true ceiling a child cannot remove
([Hierarchy
evaluation](https://docs.cloud.google.com/organization-policy/hierarchy-evaluation)).
Boolean constraints behave differently: if a child resource sets its
own explicit policy, that value is used for the child's effective
policy instead of the inherited one, so a project can set
`enforced: false` to turn off a constraint its parent folder enforces
as `enforced: true`, unless the constraint is a managed constraint,
which Google documents as not merged with an inherited parent value at
all and therefore not overridable the same way
([Hierarchy
evaluation](https://docs.cloud.google.com/organization-policy/hierarchy-evaluation)).
This means Organization Policy ceilings are opt-in and constraint
dependent rather than uniformly absolute: whether a descendant can
loosen what an ancestor set depends on the specific constraint's type
and whether it is a managed constraint.

IAM deny policies are a stronger ceiling in comparison: once attached
at a level, nothing documented allows a descendant to remove or
override that inherited deny rule
([Deny
policies](https://docs.cloud.google.com/iam/docs/deny-overview)).

## Discovery versus access

Google Cloud does not document a separate discovery state in which a
principal can see that an organization, folder, or project exists
without already holding access to it. Reading a project's own
metadata requires the `resourcemanager.projects.get` permission on
that specific project; the same permission check governs both knowing
the project exists through the API or console and reading its details
([Method:
projects.get](https://docs.cloud.google.com/resource-manager/reference/rest/v3/projects/get)).

## Small customers

A project can be created and used without any organization above it at
all; this is documented for free trial and free tier users, whose
projects sit at the top of their own hierarchy with no organization or
folder ancestor
([About resource
hierarchy](https://docs.cloud.google.com/resource-manager/docs/overview)).
Such a project still needs its own linked billing account to use
billable services, but that billing account is a separate resource
from the organization and does not require one to exist
([Overview of Cloud Billing
concepts](https://docs.cloud.google.com/billing/docs/concepts)).

## Consolidation

Moving an individual project is supported and documented as a metadata
operation: a project can migrate from one organization to another, or
a standalone project with no organization can be migrated into an
organization's hierarchy, without transferring data or causing
downtime to the project's running resources
([Migrating projects between organization
resources](https://docs.cloud.google.com/resource-manager/docs/project-migration)).
Migration requires the Project IAM Admin role on the project and the
Project Mover role on the destination, and both the source and
destination organizations must explicitly allow the export and import
through their own organization policy settings before a migration can
proceed; moving a project back to having no organization at all is not
self-service and requires contacting Cloud customer support
([Migrating projects between organization
resources](https://docs.cloud.google.com/resource-manager/docs/project-migration)).

There is no documented tool that merges two Google Cloud organization
resources into one. The adjacent operation, merging domains from
separate Google Workspace or Cloud Identity accounts, is a manual
process: data must be exported first, all but one account must be
canceled and deleted, and the deletion of an account from the Admin
console is permanent and cannot be undone
([Merge domains from separate
accounts](https://knowledge.workspace.google.com/admin/domains/merge-domains-from-separate-accounts)).
Merging the identity layer this way does not by itself touch the
separate Google Cloud organization resources tied to each original
account; consolidating the resource hierarchies still requires moving
projects individually.

## Relevance to this ADR

- Google Cloud's three typed levels line up closely with the ADR's
  vocabulary: organization as the governing root, folder as an
  optional nested grouping, and project as the place work actually
  lives, matching the ADR's claim that folders are optional and that
  work attaches at or below the first level under the root.
- The ADR's rule that ancestors' limits cap descendants holds for IAM
  deny policies and for list-type Organization Policy constraints,
  where a parent's denied values are documented as always winning. It
  does not hold uniformly for boolean Organization Policy constraints,
  where a child can set its own value and have it replace, rather than
  be capped by, what a parent enforced, unless the constraint is a
  managed constraint that is not overridden this way.
- The ADR models grants as strictly additive and narrowing as a
  separate limit mechanism; Google Cloud's IAM allow policies match the
  additive half exactly, and IAM deny policies, attached at an
  organization, folder, or project and never to an individual
  resource, match the ADR's narrowing half closely.
- Google Cloud projects without an organization, available to free
  trial and free tier users, match the ADR's goal of a small customer
  never meeting the governing layer, though Google Cloud reaches this
  by omitting the organization resource entirely rather than by hiding
  an organization that already exists underneath, as the ADR's
  one-workspace reveal model does.
- Google Cloud's documented absence of an organization merge tool, with
  project migration as the only supported consolidation path, agrees
  with the ADR's position that separately created top-level entities
  consolidate only through an explicit migration rather than an
  ordinary tree operation.

## Sources

- [About resource
  hierarchy](https://docs.cloud.google.com/resource-manager/docs/overview)
- [Project
  limits](https://docs.cloud.google.com/resource-manager/docs/limits)
- [Using resource hierarchy for access
  control](https://docs.cloud.google.com/iam/docs/resource-hierarchy-access-control)
- [Principal
  identifiers](https://docs.cloud.google.com/iam/docs/principal-identifiers)
- [Deny
  policies](https://docs.cloud.google.com/iam/docs/deny-overview)
- [Understanding organization
  policies](https://docs.cloud.google.com/resource-manager/docs/organization-policy/understanding-policies)
- [Hierarchy
  evaluation](https://docs.cloud.google.com/organization-policy/hierarchy-evaluation)
- [Overview of Cloud Billing
  concepts](https://docs.cloud.google.com/billing/docs/concepts)
- [Method:
  projects.get](https://docs.cloud.google.com/resource-manager/reference/rest/v3/projects/get)
- [Migrating projects between organization
  resources](https://docs.cloud.google.com/resource-manager/docs/project-migration)
- [Merge domains from separate
  accounts](https://knowledge.workspace.google.com/admin/domains/merge-domains-from-separate-accounts)
