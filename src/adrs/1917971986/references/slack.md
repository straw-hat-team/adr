# Slack: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

Slack's enterprise product is still named Enterprise Grid in current
documentation, and Slack's own pages use "Enterprise Grid organization"
and "Enterprise organization" interchangeably for the top-level
container, with help-center article titles themselves having shifted
toward "Enterprise organization" while the product name "Enterprise
Grid" remains in use
([Migrate workspaces to an Enterprise organization](https://slack.com/help/articles/115002532808-Migrate-workspaces-to-an-Enterprise-organization);
[An introduction to Slack Enterprise Grid](https://slack.com/resources/why-use-slack/slack-enterprise-grid)).

An Enterprise Grid organization is made up of an unlimited number of
workspaces connected within that organization, often mapped to business
units, departments, or subsidiaries
([An introduction to Slack Enterprise Grid](https://slack.com/resources/why-use-slack/slack-enterprise-grid)).
Only Org Owners and Org Admins can create a new workspace in the
organization; a member who cannot create one can instead request a new
workspace for an owner or admin to review
([Create a workspace on Enterprise Grid](https://slack.com/help/articles/115001344007-Create-a-workspace-on-Enterprise-Grid)).
Below a workspace, channels are the unit that holds conversations, and a
channel can be scoped to a single workspace, to several workspaces, or
to every workspace in the organization; Slack does not document a
further nesting level, such as folders, within this structure in the
pages reviewed.

## Governance and work

The organization is the governance layer: the Org Primary Owner is
automatically assigned to every new workspace created in the
organization, and organization-level settings are configured from
organization settings rather than from any one workspace
([Create a workspace on Enterprise Grid](https://slack.com/help/articles/115001344007-Create-a-workspace-on-Enterprise-Grid)).
Work happens inside workspaces and their channels, not at the
organization level itself.

## Audiences and visibility

Slack channels have two base audiences. A public channel can be found,
viewed, and joined by any member of the workspace, except guests, and
its messages and files surface in workspace-wide search results for
members. A private channel is for conversations that should not be open
to everyone, people must be added by an existing member, and its
messages and files only appear in search for people who are already in
the channel
([What is a channel?](https://slack.com/help/articles/360017938993-Organize-your-work-in-channels)).

On Enterprise Grid, a channel's audience can be widened past a single
workspace. A multi-workspace channel brings people from different
workspaces together in the same channel, and Org Owners, Org Admins, and
members with the right permission can add a channel to additional
workspaces
([Create multi-workspace channels on Enterprise Grid](https://slack.com/help/articles/115001399587-Create-multi-workspace-channels-on-Enterprise-Grid)).
A multi-workspace channel that is added to every workspace in the
organization and set as a default for new members becomes an org-wide
default channel; an organization can have up to 25 such default
channels
([Create multi-workspace channels on Enterprise Grid](https://slack.com/help/articles/115001399587-Create-multi-workspace-channels-on-Enterprise-Grid)).

Guests are a narrower, named audience below ordinary members. A
single-channel guest can access only the one channel they were invited
to. A multi-channel guest can access only the channels specified for
them, though they can additionally accept channel invitations and
invite others into private channels they already belong to. Both guest
types can see only the members and apps present in their own assigned
channels, not the wider workspace or organization, and only Workspace
Owners and Admins can manage a guest's channel access
([Understand guest roles in Slack](https://slack.com/help/articles/202518103-Understand-guest-roles-in-Slack)).

Slack Connect extends audience outward, to people outside the
organization entirely. It lets a workspace collaborate with external
organizations in a shared channel, hosting up to 250 organizations at
once on paid plans, or in a direct message available on any plan; only
the organization that owns a Slack Connect channel can invite or remove
other organizations and manage posting permissions in it
([Slack Connect guide: Work with external organizations](https://slack.com/help/articles/115004151183-Slack-Connect-guide-Work-with-external-organizations)).

## Narrowing below a parent

A workspace inside an Enterprise Grid organization can narrow who may
even find or join it. Workspace owners choose among Open, meaning any
org member can find and join; By request, meaning org members must ask
to join; Invite only; or Hidden, meaning the workspace is not visible
and people must be added directly
([Manage workspace access on Enterprise Grid](https://slack.com/help/articles/115001915507-Manage-workspace-access-on-Enterprise-Grid)).
At the channel level, a private channel is the narrowing mechanism
below a workspace's default openness: membership is granted only by an
existing member adding someone, with no self-service request-to-join
flow documented for private channels
([Join a channel](https://slack.com/help/articles/205239967-Join-a-channel)).

## Ceilings from above

Organization-level policies can cap what individual workspace owners
and admins are allowed to configure, but Slack documents this as
opt-in, not automatic. For app installation, "setting an app management
policy turns on app approval for every workspace in an org," while "if
you don't set an app management policy for your org, Workspace Owners
can still choose to enable approval for workspaces they manage"
([Set organization policies for apps on Enterprise Grid](https://slack.com/help/articles/360038559694-Set-organization-policies-for-apps-on-Enterprise-Grid)).
Once such a policy is set, it can take away a workspace owner's
discretion entirely, for example by removing workspace owners' ability
to manage "Sign in with Slack" permissions once the organization sets
its own policy
([Set organization policies for apps on Enterprise Grid](https://slack.com/help/articles/360038559694-Set-organization-policies-for-apps-on-Enterprise-Grid)).

The same opt-in ceiling pattern applies to external collaboration.
Organization admins choose, per invitation type, which roles in the
organization may send Slack Connect channel invitations at all, which
caps every workspace's ability to let its members invite external
organizations
([Manage Slack Connect channel invitation settings and permissions](https://slack.com/help/articles/1500012572621-Manage-Slack-Connect-channel-invitation-settings-and-permissions)).
Organization-level settings more broadly govern things like display
name rules, retention, and channel posting permissions across every
workspace in the organization, while workspace-level settings apply
only to that one workspace
([Set organization policies for apps on Enterprise Grid](https://slack.com/help/articles/360038559694-Set-organization-policies-for-apps-on-Enterprise-Grid)).

## Discovery versus access

Private channels are the closed end of Slack's discovery spectrum: they
are not found through browsing or search by people outside them, and
the only documented path in is being added by an existing member, with
no request-to-join option described
([Join a channel](https://slack.com/help/articles/205239967-Join-a-channel);
[What is a channel?](https://slack.com/help/articles/360017938993-Organize-your-work-in-channels)).
At the workspace level, the By request access option is the open end of
that spectrum: the workspace can be found by every org member, who can
then ask to join rather than being invited outright
([Manage workspace access on Enterprise Grid](https://slack.com/help/articles/115001915507-Manage-workspace-access-on-Enterprise-Grid)).
A member who cannot create a workspace can similarly request that a new
one be created, rather than being blocked outright
([Create a workspace on Enterprise Grid](https://slack.com/help/articles/115001344007-Create-a-workspace-on-Enterprise-Grid)).

## Small customers

Enterprise Grid is described as Slack's product for large or complex
organizations that need multiple connected workspaces under one
container; it is a distinct offering from the Free, Pro, and
Business+ plans, which run as a single workspace with no organization
layer above it
([An introduction to Slack Enterprise Grid](https://slack.com/resources/why-use-slack/slack-enterprise-grid)).
A team on one of those plans operates only in its workspace and never
encounters organization settings, organization policies, or an
organization switcher, because that layer is part of a different
product tier rather than something hidden within the same product.

## Consolidation

Slack documents bringing an existing workspace into an Enterprise
organization as a migration, not an ordinary move. An Org Owner submits
a migration request using the workspace's ID and URL, and the
workspace's Primary Owner must approve or deny it before anything
happens
([Migrate workspaces to an Enterprise organization](https://slack.com/help/articles/115002532808-Migrate-workspaces-to-an-Enterprise-organization)).
Once approved, Slack walks the admins through a checklist covering SSO
setup, matching identical user accounts, resolving conflicting accounts
that share some but not all profile fields, and reviewing settings that
differ between the workspace and the organization
([Migrate workspaces to an Enterprise organization](https://slack.com/help/articles/115002532808-Migrate-workspaces-to-an-Enterprise-organization)).
After migration, members keep their channel and direct-message history,
files, custom emoji, and apps, and direct messages across the merged
workspaces are combined
([Migrate workspaces to an Enterprise organization](https://slack.com/help/articles/115002532808-Migrate-workspaces-to-an-Enterprise-organization)).
Merging two separately created Enterprise organizations into one is not
covered by this migration flow; the same help article directs that
request to Slack's support team instead, so no self-service path for
that case is documented.

## Relevance to this ADR

- Slack's Enterprise Grid organization-to-workspace relationship is the
  clearest working example of this ADR's organization-governs,
  workspace-holds-work split: the Org Primary Owner is assigned at the
  organization level and organization settings apply across every
  workspace, while channels and conversations are the work that sits
  inside a workspace.
- Slack's Free, Pro, and Business+ plans confirm the ADR's small-customer
  rule in its strongest form: a one-workspace team is not merely
  shielded from an organization screen, it is on a product tier that has
  no organization layer at all, which is a stricter version of this
  ADR's "friendly by default" reveal-on-growth design.
- Slack private channels are the named source for this ADR's closed
  discovery example, and the research confirms it precisely: a private
  channel's existence is not surfaced to non-members through search or
  browsing, and the only documented way in is a direct add, with no
  request-to-join flow, unlike the workspace-level By request option,
  which leaves discovery open.
- Slack's organization-level policies, such as app approval and Slack
  Connect invitation rules, are an opt-in ceiling an org admin must
  deliberately turn on, matching this ADR's rule that "root ceilings
  are opt-in per policy" rather than always-on.
- Slack diverges from the ADR's "project" vocabulary: Slack has no
  resource positioned as a project attached to a workspace or folder,
  and it has no documented folder level between a workspace and its
  channels, so the ADR's folder and project layers have no direct Slack
  counterpart; and consolidating separate Enterprise organizations is
  explicitly left to Slack support rather than being a documented
  self-service migration, so the ADR's "explicit cross-tenant
  migration" expectation is confirmed for workspace-into-org moves but
  left unverified for org-into-org moves.

## Sources

- [Migrate workspaces to an Enterprise organization](https://slack.com/help/articles/115002532808-Migrate-workspaces-to-an-Enterprise-organization)
- [An introduction to Slack Enterprise Grid](https://slack.com/resources/why-use-slack/slack-enterprise-grid)
- [Create a workspace on Enterprise Grid](https://slack.com/help/articles/115001344007-Create-a-workspace-on-Enterprise-Grid)
- [Manage workspace access on Enterprise Grid](https://slack.com/help/articles/115001915507-Manage-workspace-access-on-Enterprise-Grid)
- [Understand guest roles in Slack](https://slack.com/help/articles/202518103-Understand-guest-roles-in-Slack)
- [Join a channel](https://slack.com/help/articles/205239967-Join-a-channel)
- [What is a channel? (Organize your work in channels)](https://slack.com/help/articles/360017938993-Organize-your-work-in-channels)
- [Set organization policies for apps on Enterprise Grid](https://slack.com/help/articles/360038559694-Set-organization-policies-for-apps-on-Enterprise-Grid)
- [Manage Slack Connect channel invitation settings and permissions](https://slack.com/help/articles/1500012572621-Manage-Slack-Connect-channel-invitation-settings-and-permissions)
- [Slack Connect guide: Work with external organizations](https://slack.com/help/articles/115004151183-Slack-Connect-guide-Work-with-external-organizations)
- [Create multi-workspace channels on Enterprise Grid](https://slack.com/help/articles/115001399587-Create-multi-workspace-channels-on-Enterprise-Grid)
