# Google Drive: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

A Google Workspace or Cloud Identity account is the top-level
container for users, groups, configuration, and data, and corresponds
to the notion of a tenant; it is identified by a domain name and is
not itself a user account, but a directory of user accounts
([Overview of Google identity
management](https://docs.cloud.google.com/architecture/identity/overview-google-authentication)).
Under that account, organizational units (OUs) are sub-containers
that segment user accounts into disjoint, hierarchical sets; each
account has a root OU under which further OUs can be nested, and the
customer's OU hierarchy is limited to 35 levels of depth
([Overview of Google identity
management](https://docs.cloud.google.com/architecture/identity/overview-google-authentication);
[Admin SDK: Manage organizational
units](https://developers.google.com/admin-sdk/directory/v1/guides/manage-org-units)).
OUs hold policy, not work: they group people and devices, not Drive
content.

Work itself lives in Drive, which has two kinds of containers. My
Drive is personal storage where folders can nest up to 100 folders
deep, including the parent folder, after which the 100th folder can
hold files and shortcuts but no further folders. Shared drives are
team-owned storage where a folder can likewise have up to 100 levels
of nested folders, and a shared drive can hold up to 500,000 items
total, including files, folders, shortcuts, and trashed items
([Shared drive
limits](https://support.google.com/a/answer/7338880?hl=en)). This
nesting-depth increase to 100 levels (up from 20) and the 500,000-item
ceiling were announced in Google's July 2024 release notes
([Release notes,
07/12/2024](https://workspaceupdates.googleblog.com/2024/07/release-notes-07-12-2024.html)).
Folders in Drive are freely nestable within these limits; there is no
separate "folder type" distinct from a generic container.

A single Workspace customer account can also carry more than one
domain name. An administrator can add a secondary domain so that a
separate team or business unit gets its own domain for user
addresses, all still managed from the same Admin console and the same
customer account, alongside an alias domain option for users who only
need an alternate address ([Add a user alias domain or secondary
domain](https://knowledge.workspace.google.com/admin/domains/add-a-user-alias-domain-or-secondary-domain)).
A secondary domain does not create a second customer account or a
second hierarchy; it is a property of the one existing account.

## Governance and work

Identity, billing, and policy settings live at the Workspace customer
account and its organizational units, administered through the Admin
console. Configuration groups, a separate mechanism from OUs, let
administrators apply exceptions to specific users "without changing
your organizational structure," covering services including Drive,
Calendar, Gmail, Meet, Vault, and Google Cloud Platform, plus
administrative features such as context-aware access and data regions
([Customize service settings using configuration
groups](https://knowledge.workspace.google.com/admin/users/advanced/customize-service-settings-using-configuration-groups)).
A user's group settings generally override their OU's settings for
these supported services, with one documented exception: a two-step
verification (2SV) policy set on a child OU always takes precedence
over a configuration group setting, regardless of group priority
([Customize service settings using configuration
groups](https://knowledge.workspace.google.com/admin/users/advanced/customize-service-settings-using-configuration-groups)).

Work itself is held separately from this governance layer. In My
Drive, the individual who created a file or folder owns it. In a
shared drive, the team, not an individual, owns the content, so files
persist when a member leaves ([My Drive versus shared
drives](https://support.google.com/a/users/answer/7212025)).

## Audiences and visibility

For an individual Drive file or folder, general access can be set to
Restricted (only people explicitly given access can open it), Anyone
with the link (anyone on the internet with the link can access it
without signing in), or a public option where anyone can search on
Google and get access without signing in ([Share files from Google
Drive](https://support.google.com/drive/answer/2494822)). Google
Workspace also exposes target audiences, administrator-curated groups
such as departments or teams that a user can choose as a sharing
option alongside "anyone in the organization" or link sharing; target
audiences are more restricted than organization-wide sharing because
only the group's designated members gain access, and administrators
create the audience, add its members, and apply it to specific
organizational units in the Admin console before it appears as a
sharing choice ([About target
audiences](https://knowledge.workspace.google.com/admin/groups/about-target-audiences)).

Inside a shared drive, access is also split by capability through
membership roles. Google documents five roles: Manager, who can
manage members and upload, edit, move, or delete all files and
folders and can delete the shared drive itself; Content manager, who
can upload, edit, move, or delete files but cannot manage membership
or move folders between drives; Contributor, who can edit files and
add new ones but cannot move or delete existing files; Commenter, who
can only comment; and Viewer, who can only view ([Shared drive roles
and permissions](https://support.google.com/a/users/answer/9310460?hl=en)).
These roles are a finer-grained, per-capability analogue to this ADR's
discover, read, and change capabilities, applied to a single shared
drive or to folders within it.

## Narrowing below a parent

A child organizational unit can override an inherited setting: "to
keep a child organizational unit from inheriting its parent's
settings, apply to the child any settings that are specific to it,"
and those custom settings remain unchanged even as the parent's
setting changes elsewhere ([How the organizational structure
works](https://knowledge.workspace.google.com/admin/users/advanced/how-the-organizational-structure-works)).

Within Drive content itself, shared drive managers and My Drive
owners can restrict a folder to specific users through "limited
access," even though the surrounding shared drive or parent folder
grants broader access. This folder-level restriction beta was
announced in September 2024 ([Google Drive: beta to restrict folder
access](https://workspaceupdates.googleblog.com/2024/09/google-drive-beta-to-restrict-folder-access.html))
and reached general availability, extended to both shared drives and
My Drive, per a February 2025 update that also describes Google's
plan to retire item-level restricted sharing in My Drive in favor of
folder-level limited access by 2026 ([Updating the access experience
in Google
Drive](https://workspaceupdates.googleblog.com/2025/02/updating-access-experience-in-google-drive.html)).

## Ceilings from above

Organization-wide policy can cap what any OU or user is allowed to
do. External sharing controls illustrate this: an administrator can
restrict users to sharing only with domains on an allowlist of
trusted domains, up to 5,000 domains, and this allowlist governs
sharing in Drive (files), Classroom (joining classes), Chat
(conversations with people in trusted domains), and Looker Studio
(asset access). An allowlisted domain must be Google Workspace and
domain-verified, and allowlisting does not allow selecting a subset of
behaviors per domain, all trusted domains are treated the same, and
users still cannot share with personal (non-Workspace) accounts under
this control ([Allow external sharing with only trusted
domains](https://knowledge.workspace.google.com/admin/domains/allow-external-sharing-with-only-trusted-domains)).
This is an administrator-configured ceiling, not a default-on
restriction: Google Workspace ships with broader external sharing
allowed until an administrator narrows it.

## Discovery versus access

A limited-access folder is visible to people who otherwise have
general access to the shared drive or parent folder, but they cannot
open it: "people with general access to the shared drive or shared
folder can see the restricted folder in Drive, but will not be able
to open it," and the folder appears grayed out to them ([Google
Drive: beta to restrict folder
access](https://workspaceupdates.googleblog.com/2024/09/google-drive-beta-to-restrict-folder-access.html);
[Updating the access experience in Google
Drive](https://workspaceupdates.googleblog.com/2025/02/updating-access-experience-in-google-drive.html)).
Those excluded users can request access directly from the folder
view.

For an individual restricted file, a person who tries to open it
without permission reaches a "You need permission" page where they can
click "Request access," optionally add an explanation, and send the
request; the file's owner receives an email with the requester's name,
email, and message, and the requester is notified by email if the
request is approved or denied ([Fix file won't
open](https://support.google.com/drive/answer/53355?hl=en)).

## Small customers

Not documented: Google's primary documentation describing
organizational units and configuration groups is written from the
perspective of an existing Workspace customer account and does not
describe a distinct "simplified" mode that hides OUs for small
customers. Separately, a personal (consumer) Google Account used with
Drive sits entirely outside Workspace: it has no organizational unit,
no Admin console, and no customer-level policy layer, and such a user
only ever sees My Drive and individually owned files and folders, with
the Restricted, link-sharing, and public general-access options
available at the file level ([Share files from Google
Drive](https://support.google.com/drive/answer/2494822)). Google's
documentation does not state that a small Workspace customer's Admin
console is hidden or simplified relative to a large one; it describes
the same OU and configuration-group tools regardless of organization
size.

## Consolidation

Google Workspace Domain Transfer explicitly "does not support merging
user accounts or account deduplication," including in
merger-and-acquisition scenarios involving duplicate accounts across
two customer environments. Google states there is no tool that
offers a comprehensive way to merge two Google Accounts covering all
possible Google services; instead, administrators work service by
service, migrating data such as Gmail, Drive, Calendar, and Contacts
individually (through APIs, GAM, or a data migration service) rather
than merging the underlying accounts or customer records themselves
([Identity merge and
deduplication](https://knowledge.workspace.google.com/admin/domains/identity-merge-and-deduplication)).
There is no documented administrator-facing operation that folds one
Workspace customer account, with its Drive content, into another as a
single step.

## Relevance to this ADR

- Google's Workspace customer account lines up with this ADR's
  Organization: it is the tenant-level root holding identity,
  billing, and policy, confirmed directly by Google's own description
  of the account as "the top-level container for users, groups,
  configuration, and data."
- Google has no single node that plays the ADR's Workspace role.
  Organizational units carry policy and people, not work, while
  shared drives and My Drive hold work but sit entirely outside the
  OU tree; there is no "direct child of the root that holds work" in
  Google's model the way this ADR defines Workspace. Folders inside
  shared drives map more closely onto this ADR's Folder.
- Configuration groups are a precedent for "any level may widen or
  narrow": they let administrators grant exceptions to specific
  people without restructuring the hierarchy, similar in spirit to
  this ADR's grants and limits, though configuration groups attach to
  people and policy rather than to positions in a resource tree.
  Note the documented exception where a child OU's 2SV setting always
  wins over a configuration group, a precedence rule this ADR does
  not carry for its own grants and limits.
- Limited-access folders are a direct, sourced example of this ADR's
  "a limit may leave discovery open" rule: excluded users see that
  the folder exists (grayed out) and can request access, exactly the
  discoverable-but-not-readable behavior the ADR cites Google Drive
  for.
- Google's documented absence of an account-merge tool directly
  supports this ADR's claim that separately created organizations
  consolidate only through migration, not through an ordinary
  operation; Google's own wording that there is no comprehensive
  merge tool for all services matches the ADR's framing of
  consolidation as an explicit, costly step rather than a built-in
  capability.

## Sources

- [Overview of Google identity management](https://docs.cloud.google.com/architecture/identity/overview-google-authentication)
- [Admin SDK: Manage organizational units](https://developers.google.com/admin-sdk/directory/v1/guides/manage-org-units)
- [How the organizational structure works](https://knowledge.workspace.google.com/admin/users/advanced/how-the-organizational-structure-works)
- [Customize service settings using configuration groups](https://knowledge.workspace.google.com/admin/users/advanced/customize-service-settings-using-configuration-groups)
- [My Drive versus shared drives](https://support.google.com/a/users/answer/7212025)
- [Share files from Google Drive](https://support.google.com/drive/answer/2494822)
- [About target audiences](https://knowledge.workspace.google.com/admin/groups/about-target-audiences)
- [Shared drive roles and permissions](https://support.google.com/a/users/answer/9310460?hl=en)
- [Add a user alias domain or secondary domain](https://knowledge.workspace.google.com/admin/domains/add-a-user-alias-domain-or-secondary-domain)
- [Google Drive: beta to restrict folder access](https://workspaceupdates.googleblog.com/2024/09/google-drive-beta-to-restrict-folder-access.html)
- [Updating the access experience in Google Drive](https://workspaceupdates.googleblog.com/2025/02/updating-access-experience-in-google-drive.html)
- [Allow external sharing with only trusted domains](https://knowledge.workspace.google.com/admin/domains/allow-external-sharing-with-only-trusted-domains)
- [Fix file won't open](https://support.google.com/drive/answer/53355?hl=en)
- [Identity merge and deduplication](https://knowledge.workspace.google.com/admin/domains/identity-merge-and-deduplication)
- [Shared drive limits](https://support.google.com/a/answer/7338880?hl=en)
- [Release notes, 07/12/2024](https://workspaceupdates.googleblog.com/2024/07/release-notes-07-12-2024.html)
