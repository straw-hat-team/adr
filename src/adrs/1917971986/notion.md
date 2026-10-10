# Notion: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

A Notion workspace is the top-level container a person works inside. Within a workspace, members organize work in
teamspaces, described as an organizational layer that creates a dedicated area for a team while staying connected to the
wider workspace
([Teamspaces give every team a home for important work](https://www.notion.com/help/guides/teamspaces-give-teams-home-for-important-work)).
Every workspace has at least one default teamspace, called General, that includes every member, and owners can add
further teamspaces for departments, cross-functional groups, or projects
([Teamspaces give every team a home for important work](https://www.notion.com/help/guides/teamspaces-give-teams-home-for-important-work);
[Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)). Inside a teamspace, members add top-level
pages, which can then hold any number of subpages nested below them; Notion's own documentation does not describe
teamspaces as able to contain other teamspaces, only pages and their subpages
([Teamspaces give every team a home for important work](https://www.notion.com/help/guides/teamspaces-give-teams-home-for-important-work)).
Pages nest without a documented depth limit, and a subpage can itself hold further subpages
([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)).

On Enterprise plans, verifying an email domain creates a governance surface, described in Notion's documentation as
letting an organization's owners see and, under conditions, claim other workspaces created by people using addresses on
that domain ([Domain management](https://www.notion.com/help/domain-management)). This is not the same as a workspace
containing other workspaces: a claimed workspace keeps operating as its own separate workspace, with its own data and
membership, unless it is later consolidated ([Domain management](https://www.notion.com/help/domain-management)).

## Governance and work

Membership, roles, and admin rights (owner, membership admin, member, guest) are configured per workspace
([Manage members & guests](https://www.notion.com/help/add-members-admins-guests-and-groups)). On Enterprise, domain
verification extends part of that governance across every workspace sharing the verified domain: it unlocks SAML SSO
configuration and lets an organization control who on that domain may create new workspaces at all
([Domain management](https://www.notion.com/help/domain-management)). Security policy that caps sharing, export, and
moving pages between workspaces is also set at the workspace level, in Settings, Security
([Workspace settings](https://www.notion.com/help/workspace-settings)).

Billing is per workspace. An Enterprise organization that claims another workspace created on its verified domain can
offer to upgrade it, but each workspace remains its own billable unit until it is formally consolidated
([Domain management](https://www.notion.com/help/domain-management)). Work itself, the pages and their content, lives
inside teamspaces and the page tree beneath them, separate from the workspace-level identity and billing settings
([Teamspaces give every team a home for important work](https://www.notion.com/help/guides/teamspaces-give-teams-home-for-important-work)).

## Audiences and visibility

When sharing a page, Notion exposes several audiences: specific people, who may be workspace members or outside guests;
a teamspace; the whole workspace; or anyone on the web with a link
([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)). Teamspaces themselves come in three
types that set a default audience for what is created inside them. Open teamspaces let anyone in the workspace join and
view all content inside. Closed teamspaces are visible to everyone in the workspace, but joining requires an invitation
from an owner or member. Private teamspaces, available only on Business and Enterprise plans, are not visible at all to
people who are not members, and only members or owners can invite others in
([Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)).

A new subpage takes on the sharing of its parent page by default
([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)). Where a person has more than one grant
that applies to the same page, Notion gives them the broadest one: someone with view-only access directly on a page who
also has full access through workspace membership keeps full access
([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)).

## Narrowing below a parent

A subpage can be restricted below what its parent grants. A subpage takes on its parent's permissions, and "to change
this, go into a subpage and update the permissions there"
([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)). Notion's release notes state the
restricting direction explicitly: before the change, nested pages "always inherited the permission level of the parent
page", and since then "you can expand or restrict permissions for any sub-page"
([Release notes, November 11, 2020](https://www.notion.com/releases/2020-11-11)). Notion also "respects the broadest
level of access given to a user", so a restriction on a subpage does not hold against broader access reaching the person
by another route ([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)). One boundary on
narrowing: moving a shared page into a member's private sidebar section removes other people's access to that page, but
any subpages beneath it keep whatever access they already had, so a narrowing action on a parent does not automatically
cascade down to its children ([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)).

## Ceilings from above

Enterprise workspace owners can set security policy, in Settings, Security, that caps what every member may do
workspace-wide: preventing members from publishing pages or forms publicly on the web, disabling guest invitations,
disabling moving or duplicating pages to other workspaces, and disabling export of page and database content
([Workspace settings](https://www.notion.com/help/workspace-settings);
[Understanding Notion's sharing settings](https://www.notion.com/help/guides/understanding-notions-sharing-settings)).
These controls are opt-in: an Enterprise workspace owner chooses to turn them on, and a workspace that enables none of
them leaves members free to share, export, and move pages as they choose
([Understanding Notion's sharing settings](https://www.notion.com/help/guides/understanding-notions-sharing-settings)).
A teamspace's own security settings automatically inherit from the workspace's security settings, and only a teamspace
owner who is also a workspace owner can change them, which keeps a workspace-level ceiling in force at the teamspace
layer ([Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)).

Below Enterprise, plan tier itself acts as a softer ceiling. Allowing outsiders to request access to a page is on by
default for Free, Plus, and Business plans, and can be turned off only on Plus and Business; Enterprise instead ships
with this off and lets an owner turn it on
([Manage members & guests](https://www.notion.com/help/add-members-admins-guests-and-groups);
[Workspace settings](https://www.notion.com/help/workspace-settings)). Private teamspaces are gated the same way: they
exist only on Business and Enterprise plans, so a Free or Plus workspace has no way to create one
([Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)).

## Discovery versus access

A closed teamspace stays discoverable: everyone in the workspace can see that it exists, but cannot open its content
without being invited by an owner or member. A private teamspace removes discovery as well as access, since it is not
visible at all to people who are not members ([Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)).

For pages, a person outside a workspace who reaches a page link can request access, and the page's owner or an admin
approves or denies the request; this is on by default for Free, Plus, and Business plans, and can be disabled on Plus
and Business, while Enterprise has it available but off by default until an owner enables it
([Manage members & guests](https://www.notion.com/help/add-members-admins-guests-and-groups);
[Workspace settings](https://www.notion.com/help/workspace-settings)). Someone who already has view or comment access to
a page can also request a higher level, such as edit access, and that request goes to the page's owner for a decision
([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)).

## Small customers

Signing up for Notion simply creates a workspace; there is no separate organization object to configure first, and
identity, billing, and membership all live on that workspace from the start
([Manage members & guests](https://www.notion.com/help/add-members-admins-guests-and-groups)). The Enterprise-only
governance surface, domain verification, claimable workspaces, and cross-workspace security policy, only becomes
relevant once a company moves to an Enterprise plan and verifies a domain
([Domain management](https://www.notion.com/help/domain-management)). A workspace with a single member that has no
outstanding paid-plan balance can be deleted outright, so a solo user never has to interact with that governance surface
at all ([Domain management](https://www.notion.com/help/domain-management)).

## Consolidation

Notion does not merge separately created workspaces as an ordinary admin action. Enterprise domain verification lets an
organization's owners claim other workspaces created with its verified domain, request ownership transfer of
single-member workspaces, or offer an upgrade to multi-member workspaces, but each claimed workspace keeps operating on
its own until it is actually merged ([Domain management](https://www.notion.com/help/domain-management)). Merging
workspaces together is handled as workspace consolidation, which Notion describes as available to sales-assisted
Enterprise customers through their Notion account management team, not as a self-service tool in workspace settings
([Domain management](https://www.notion.com/help/domain-management)).

## Relevance to this ADR

- Notion's workspace plays this ADR's Workspace role for everyday work, but Notion has no always-present Organization
  node the way this ADR's tenant root always exists in the data. Notion's Enterprise organization layer appears only for
  customers who verify a domain, and it governs a set of separately billed workspaces rather than a single tenant tree
  ([Domain management](https://www.notion.com/help/domain-management)). This diverges from the ADR's position that the
  organization is never optional in the data, only in the interface.
- Notion's teamspace maps closer to this ADR's Folder than to its Workspace: a teamspace sits inside a workspace, groups
  pages, and sets a default audience for what is created inside it
  ([Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)), the same role this ADR assigns to folders
  narrowing or widening what descendants start with.
- Notion's subpage restriction agrees with this ADR's rule that any level may narrow below its parent: a subpage's own
  Share settings can reduce access below what it inherited, and Notion marks the page as no longer fully inheriting
  ([Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)), the same shape as this ADR's
  per-level limit.
- Notion's closed-versus-private teamspace split is a concrete example of this ADR's discovery-versus-access
  distinction: closed teamspaces stay discoverable while access is still gated, and private teamspaces hide existence
  entirely ([Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)), matching this ADR's statement that
  a limit can leave discovery open or close it.
- Notion's lack of a self-service merge for separately created workspaces, since consolidation runs through Notion's
  account management team rather than an ordinary setting
  ([Domain management](https://www.notion.com/help/domain-management)), lines up with this ADR's position that
  separately created organizations consolidate only through an explicit migration, never an ordinary tree operation.

## Sources

- [Teamspaces give every team a home for important work](https://www.notion.com/help/guides/teamspaces-give-teams-home-for-important-work)
- [Intro to teamspaces](https://www.notion.com/help/intro-to-teamspaces)
- [Domain management](https://www.notion.com/help/domain-management)
- [Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)
- [Release notes, November 11, 2020](https://www.notion.com/releases/2020-11-11)
- [Manage members & guests](https://www.notion.com/help/add-members-admins-guests-and-groups)
- [Understanding Notion's sharing settings](https://www.notion.com/help/guides/understanding-notions-sharing-settings)
- [Workspace settings](https://www.notion.com/help/workspace-settings)
