---
id: '1917971986'
title: Organization, workspace, folder, and project
state: Draft
created: 2026-10-10
tags: [naming, multi-tenancy, hierarchy, product-vocabulary]
category: Platform
---

# Organization, workspace, folder, and project

## Context

[ADR#4761776210](../4761776210/README.md) gives each tenant one tree of
untyped nodes and forbids the platform from interpreting what a node
means. That keeps the schema honest, but a product still has to show
people words, and every product built on the tree has been inventing its
own: "organization", "workspace", "team", "space", "folder", "project".
Without a shared vocabulary the same tree reads differently in each
product, and the words drift into the schema.

Two tensions shaped the choice:

**The outer level can impersonate the inner one.** If the tenant root
and the nodes under it can both hold work, "organization" and
"workspace" become two names for the same kind of place. People cannot
tell where a resource lives, and "everyone in X" has two plausible
audiences.

**Most customers never need the outer level.** A team of five with one
workspace should never meet billing hierarchies, policy ceilings, or an
organization switcher. Enterprise structure has to be available without
being imposed.

Products that solved this converged on the same split, with an outer
layer that governs and an inner layer that holds work:

| Product         | Governs (optional for small customers) | Holds the work |
| --------------- | -------------------------------------- | -------------- |
| GitHub          | Enterprise account                     | Organization   |
| Slack           | Enterprise Grid organization           | Workspace      |
| Atlassian Cloud | Organization                           | Site           |

In each case the governing layer owns identity, billing, policy, and
audit, never the work itself, and customers who do not need it never see
it.

### Considered options

**The workspace is the tenant, and an organization groups tenants
above.** The literal GitHub Enterprise shape. Rejected: moving work
between workspaces of one customer, or applying one policy to all of
them, would cross tenant isolation walls, and ADR#4761776210 defines
nothing above a tenant's tree.

**Display words stored as labels on nodes.** Each node carries
"workspace" or "folder". Rejected: a label is free text the platform
must not interpret, yet the workspace switcher and the attachment rule
below need to find workspaces. Finding them by label is exactly the
interpretation ADR#4761776210 rule 3 forbids.

**Work may attach at the root.** Rejected: it is the impersonation
problem above. A root that can hold projects is a workspace by another
name.

## Resolution

Chosen option: "display words derive from position, the root governs,
and the organization stays hidden until a second workspace exists",
because it keeps a single tree per tenant, never interprets a label, and
gives a one-workspace customer a product with no enterprise surface at
all.

### The vocabulary

| Position                   | Display word     | Schema                             |
| -------------------------- | ---------------- | ---------------------------------- |
| The tenant root            | **Organization** | the tenant (ADR#8779742261)        |
| A direct child of the root | **Workspace**    | `trogon.hierarchy.v1alpha1.NodeId` |
| Any node below a workspace | **Folder**       | `trogon.hierarchy.v1alpha1.NodeId` |

- **Words come from depth, not from labels.** Workspace means "child of
  the root"; folder means "deeper than that". Nothing is stored to say
  so, and moving a node re-derives its word. Labels from ADR#4761776210
  remain free for tenants to use as they like.
- **Folders are optional.** A resource's `parent` may be a workspace or
  any folder below it, up to the depth cap.
- **These words stay out of field names.** Position is still `parent`
  per [ADR#6310044131](../6310044131/README.md). There is no
  `workspace` or `folder` field; a workspace is found by walking up.

### Project is the work, not a position

```text
Organization                 tenant root, governs
└── Workspace                child of the root, holds work
    └── Folder (optional)    any deeper node, groups work
        └── Project          a resource attached through `parent`
```

- **Project is the display word for the primary container of work**:
  a body of work with a name, a goal, and an audience. It attaches
  through `parent` to a workspace or any folder below it.
- **A project is a resource, never a node.** It has fields and behavior;
  nodes are bare identifiers. Folders and workspaces never become
  projects, and projects never contain folders.
- **Work inside a project references it by kinship.** Tasks and similar
  resources point at their project with the project's own id type
  (`ProjectId project`), not with `parent`, so the tree stays the only
  answer to position.

### The root governs; workspaces hold work

| Concern                                      | Organization (root) | Workspace and folders |
| -------------------------------------------- | ------------------- | --------------------- |
| Identity, SSO, member directory              | Yes                 | No                    |
| Billing                                      | Yes                 | No                    |
| Policy ceilings and audit                    | Yes                 | Inherited             |
| Work resources (projects, agents, schedules) | **No**              | Yes                   |

- **Work resources attach at a workspace or below, never at the
  root.** This is what prevents the organization from impersonating a
  workspace. The root carries only governance resources.
- **A workspace with resources attached cannot be removed.** Removing
  it is refused until its resources and folders have been moved
  elsewhere, each move an audited hierarchy operation. Removing a node
  never deletes or silently re-homes the work attached to it.

### Visibility is per audience, at any level

Visibility is not a single switch. It is a set of audiences, each of
which a level may let in or keep out. The audiences follow the actor
ladder of ADR#8779742261, from widest to narrowest:

| Audience        | Who                                                  |
| --------------- | ---------------------------------------------------- |
| Public          | Anyone, including unauthenticated visitors           |
| Organization    | Every principal of the tenant, across all workspaces |
| Inherited       | Whoever the parent level lets in (the default)       |
| Invited members | Only principals granted on this level                |

- **Any level may widen or narrow.** A workspace, a folder, or a
  project can open itself to a wider audience or close itself to
  invited members. Widening is a grant, which ADR#4761776210 rule 5 lets
  accumulate downward; narrowing is a limit, which the same rule lets
  bound downward. Neither needs a new mechanism.
- **Ancestors' limits cap descendants.** A project inside an
  invited-members folder cannot be public or organization-wide, because
  a parent caps everything below it. Policy at the root caps what any
  level may choose, so an organization that disables public visibility
  disables it everywhere.
- **Audiences differ per capability.** An audience may be let in to
  discover a resource without reading it, or to read without changing
  it. Products present presets such as "Everyone in Engineering" or
  "Only invited members"; a preset is a shortcut over per-audience,
  per-capability bindings held by the authorization system, not the
  model itself, and new audiences or capabilities arrive without
  reshaping it.
- **Labels name the effective audience.** A level that inherits reads
  "Everyone in Engineering" when the nearest limit is the workspace, and
  "Everyone with access to Finance" when an invited-members folder sits
  in between. A level widened to the organization reads "Everyone in
  Acme".
- **Grants combine by union and limits by intersection, per
  capability.** A principal's access is the widest grant reaching it,
  evaluated only after every limit on the path has been applied, the
  same order GCP evaluates deny policies before allow policies. A grant
  never lifts a principal over a limit above it.
- **A limit decides whether it can be discovered.** Narrowing reading
  does not have to hide existence. A limit may leave discovery open, so
  excluded principals see that the level exists and can request access
  (Google Drive's limited-access folders), or close it, so the level is
  invisible to them (Slack private channels). Products choose the
  default per kind of level.
- **Root ceilings are opt-in per policy.** The root caps a capability
  only when an administrator enforces that policy, as GitHub enterprise
  policies do. An organization that enforces nothing leaves every
  workspace free to choose.
- **Governance reaches through every limit.** Audit and the recovery of
  abandoned work, held at the root, are not work permissions and are
  never capped by an invited-members limit. Otherwise a private level
  whose last member leaves could never be recovered.

### Friendly by default

- **The organization exists from the first moment.** Creating a
  customer creates the root and one workspace together, so growing to a
  second workspace later is one "add node" operation with no
  restructuring and no data migration.
- **A one-workspace customer never sees the word "organization".**
  Signup asks for a workspace name only. While exactly one workspace
  exists, governance settings (billing, SSO, members) appear inside
  workspace settings, even though they live at the root. An
  administrator in this mode holds a grant at the root from the start,
  so the reveal changes what is shown, never who holds which grant.
- **The second workspace reveals the organization.** Creating it is the
  moment the product asks for an organization name, defaulting to the
  first workspace's name, and moves governance settings into an
  organization admin view. Nothing moves in the data, because it was
  always at the root.

## Consequences

- A resource's workspace is a query: walk up from `parent` to the
  child of the root. It is never stored on the resource.
- The rules above treat positions specially (the root, and its direct
  children). This is the promotion ADR#4761776210 anticipates for node
  kinds, scoped narrowly to position so that labels stay uninterpreted.
- A single-workspace customer's settings page shows governance it does
  not structurally own. Products must make the second-workspace reveal
  explicit so administrators learn which settings were always
  organization-wide.
- Dropping back to one workspace hides the organization again; its name
  and settings persist.
- The organization is never optional in the data, only in the
  interface. Separately created organizations that later need to become
  one are consolidated by an explicit cross-tenant migration that
  re-homes a workspace and everything below it under another tenant
  root, never by an ordinary tree operation and never by introducing a
  layer above tenants. Products prevent accidental fragmentation at
  signup instead, by offering to join an existing organization that has
  claimed the person's verified email domain.
  Google Workspace confirms the cost: it offers no tool to merge
  separate customer accounts, and consolidation is a data migration.
- This tree answers where work lives and who may reach it. Policy that
  targets people regardless of where their work lives, such as
  enforcing two-step verification for one department (Google
  Workspace's organizational units and configuration groups), is a
  separate axis and is not modeled by attaching people to nodes.
- A workspace is not an isolation wall. Customers who need hard data
  separation between parts of their company, such as regulated
  subsidiaries, need separate organizations, not separate workspaces.
- Billing is held at the root. Cost can be reported per workspace, but
  there is one bill per organization.
- The depth cap of ADR#4761776210 applies to the whole tree, so the
  root and the workspace spend part of it and folders get what remains.
- "Project" is unavailable as a name for any tree position, including
  the tenant root. A product that reaches for it to mean the tenant or a
  grouping of workspaces is using the wrong word.

## Links

- [ADR#4761776210](../4761776210/README.md): Resource hierarchy via
  untyped recursive nodes
- [ADR#6310044131](../6310044131/README.md): Hierarchy position is
  referenced by a bare parent field
- [ADR#8779742261](../8779742261/README.md): Actor and Authority Taxonomy
  for Managed Systems
- [GitHub: About enterprise accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-enterprise-accounts)
- [Slack: Guide to Enterprise Grid](https://slack.com/help/articles/115005481226-Enterprise-Grid-launch-guide)
- [Atlassian: What is an Atlassian organization?](https://support.atlassian.com/organization-administration/docs/what-is-an-atlassian-organization/)
- [Google Drive: limited-access folders in shared drives](https://workspaceupdates.googleblog.com/2025/02/updating-access-experience-in-google-drive.html)
- [Google Workspace: target audiences](https://knowledge.workspace.google.com/admin/groups/about-target-audiences)
- [Google Workspace: identity merge and deduplication](https://knowledge.workspace.google.com/admin/domains/identity-merge-and-deduplication)
- [GCP: IAM deny policies](https://docs.cloud.google.com/iam/docs/deny-overview)
- [AWS: Service control policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [GitHub: Enterprise policies](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/security-and-compliance/enterprise-policies)
