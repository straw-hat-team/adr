# Linear: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

A Workspace is the home for all data belonging to one company: issues,
teams, and every other concept in Linear live inside it, and Linear's
documentation recommends that an organization stay within a single
workspace rather than split across several.
([Workspaces](https://linear.app/docs/workspaces))

Teams are the primary organizing unit beneath a workspace. Teams can be
nested as sub-teams, with a parent team selected under Settings > Team
Hierarchy, and nesting can go up to five levels deep on the Enterprise
plan; a member of a sub-team automatically has access to its parent
team. Members of a sub-team must also be members of the parent team.
([Sub-teams](https://linear.app/docs/sub-teams))

Projects group issues toward a shared, dated outcome and are not
confined to one team: a project can be shared across multiple teams,
with one team designated as the project's lead team, which determines
the project's available statuses, while the other teams contribute to
it. Initiatives sit above projects, grouping multiple projects toward a
broader strategic effort. Issues are the fundamental unit of work and
belong to a team.
([Projects](https://linear.app/docs/projects);
[Conceptual model](https://linear.app/docs/conceptual-model))

## Governance and work

Workspace-level settings, meaning general configuration, security
(including SAML and login-method restrictions), billing, member
administration, and audit-facing features, sit at Settings >
Administration, reachable only by Admins and Owners.
([Members and roles](https://linear.app/docs/members-roles))

Work, meaning teams, issues, projects, and initiatives, is created and
used below that administrative layer. A Workspace Owner role, available
only on the Enterprise plan, carries full administrative control
including billing, security, audit logs, workspace exports, and OAuth
application approvals; the Admin role manages routine workspace
operations such as member roles and suspensions without that sensitive
access.
([Members and roles](https://linear.app/docs/members-roles))

## Audiences and visibility

Linear names Member, Admin, Owner (Enterprise only), and Guest
(Business and Enterprise plans) as roles, each scoped to the whole
workspace rather than to individual teams. There is no separate
"public" audience for a team or project; access is granted through
team membership.
([Members and roles](https://linear.app/docs/members-roles))

Teams can be made private. A private team's issues are visible only to
its members, and people outside the team cannot see those issues
through normal browsing or mention non-members on them.
([Private teams](https://linear.app/docs/private-teams))

Projects inherit their audience from the teams attached to them.
Custom views created inside a project are accessible to anyone with
access to the project, and workspace-level views are accessible to
every workspace member.
([Projects](https://linear.app/docs/projects))

## Narrowing below a parent

A team created as private narrows visibility below whatever the
workspace default would otherwise be: its issues and, by extension,
any project scoped to it, are hidden from non-members.
([Private teams](https://linear.app/docs/private-teams))

A project created under a private team is visible to that team's
members only. If the same project is later shared with a public team,
the project becomes visible to the public team's members, but the
private team's name and its issues do not become visible to people who
are not members of the private team: sharing widens the project's
audience without undoing the private team's own limit.
([Private teams](https://linear.app/docs/private-teams))

Linear does not document a way for a sub-team to narrow membership
below its parent team: the documentation states members of a sub-team
must also be members of the parent team, which is an inherited
requirement rather than a narrowing option.
([Sub-teams](https://linear.app/docs/sub-teams))

## Ceilings from above

Workspace Admins can require specific login methods for all members
under Settings > Administration > Security, and when SAML is enabled
for the workspace, members on SAML-approved domains are required to
log in through SAML by default, with an option to allow non-SAML
logins only for other domains (for example contractors). Owners and
Admins retain the ability to log in through other methods so they are
not locked out.
([Login methods](https://linear.app/docs/login-methods);
[SAML and access control](https://linear.app/docs/saml-and-access-control))

Once SAML is enabled, admins can additionally prevent non-admins from
creating new Linear workspaces using an email credential on the
claimed domain, which Linear frames as a way to keep all of a
company's work consolidated in a single workspace. This ceiling is
opt-in: it only applies once SAML has been turned on and the option
enabled.
([SAML and access control](https://linear.app/docs/saml-and-access-control))

## Discovery versus access

On the Enterprise plan, a workspace Owner cannot see a private team's
issues until joining that team; on other paid plans, workspace Admins
can view that a private team exists from Settings but must explicitly
join it before they can see its issues. This gives private teams a
visible-but-inaccessible state for admins rather than full invisibility.
For ordinary members outside the team, private team issues are not
discoverable through normal browsing.
([Private teams](https://linear.app/docs/private-teams))

Guests only see the teams they have been explicitly added to and
cannot see workspace-wide features such as workspace views, customer
requests, or initiatives; only workspace admins can add a guest.
([Members and roles](https://linear.app/docs/members-roles))

## Small customers

On the Free plan, all users are automatically Admins, so a small
customer never has to assign a separate administrative role before
managing their own workspace.
([Members and roles](https://linear.app/docs/members-roles))

A new workspace comes with a default team created automatically, named
after the workspace, so a small customer can start filing issues
without first creating a team.
([Workspaces](https://linear.app/docs/workspaces))

Sub-teams, Guests, SAML, and the Workspace Owner role are gated to
Business or Enterprise plans, so a small customer on the Free or
Standard plan never encounters that structure.
([Members and roles](https://linear.app/docs/members-roles);
[Sub-teams](https://linear.app/docs/sub-teams))

## Consolidation

Linear does not document a merge operation between two existing
workspaces. The documented path for combining data is Linear-to-Linear
import: an admin account common to both workspaces runs an import
under Settings > Administration > Import/Export, choosing which teams
to bring in and how to map members. Imported data includes issue
fields, comments, projects, initiatives, team templates, dashboards,
and documents, but saved view preferences, favorites, drafts,
integrations, webhooks, OAuth clients, API keys, and billing do not
transfer, and the destination workspace keeps its own URL and billing.
This is a one-time data copy into a receiving workspace, not a merge of
two workspaces into one.
([Linear to Linear import](https://linear.app/docs/linear-to-linear))

Separately, Linear documents that multiple workspaces can exist under
one user account, each with its own separate member list and billing.
([Workspaces](https://linear.app/docs/workspaces))

## Relevance to this ADR

- Linear's Workspace matches this ADR's Organization-as-root only
  loosely: Linear's workspace is explicitly where "all data" lives,
  including work, rather than a governance-only root with work pushed
  down into children, so Linear does not separate a governing root from
  a working layer the way this ADR does.
- Linear's Team, especially with sub-teams nested up to five levels,
  maps closely onto this ADR's Folder: a freely nestable position
  below the top level that groups work and that a project or issue
  attaches through. Linear's requirement that sub-team members also be
  parent-team members is a form of inherited grant this ADR's model
  would describe as a parent not narrowing membership for its child.
- Linear's private-team visibility rule, where a shared project stays
  invisible to the private team's non-members even after being shared
  with a public team, is a concrete, sourced example of a parent's
  limit capping a descendant exactly as this ADR describes.
- Linear's SAML-gated workspace-creation restriction is a precise
  instance of "root ceilings are opt-in per policy": the cap exists
  only once an admin enables SAML and the restriction together.
- Linear diverges from this ADR on consolidation: this ADR requires an
  explicit cross-tenant migration that re-homes a workspace and its
  descendants intact, while Linear's only documented path is a partial,
  team-by-team data import that leaves settings, integrations, and
  billing behind, closer to a one-time copy than a re-homing migration.

## Sources

- [Workspaces](https://linear.app/docs/workspaces)
- [Sub-teams](https://linear.app/docs/sub-teams)
- [Conceptual model](https://linear.app/docs/conceptual-model)
- [Projects](https://linear.app/docs/projects)
- [Private teams](https://linear.app/docs/private-teams)
- [Members and roles](https://linear.app/docs/members-roles)
- [Login methods](https://linear.app/docs/login-methods)
- [SAML and access control](https://linear.app/docs/saml-and-access-control)
- [Linear to Linear import](https://linear.app/docs/linear-to-linear)
