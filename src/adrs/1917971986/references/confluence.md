# Confluence: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

An Atlassian organization sits above everything and is managed from
admin.atlassian.com. An organization is created automatically, together
with a site, the moment anyone signs up for an Atlassian cloud product,
so the layer exists from the first signup rather than being something a
customer opts into later
([Create an Atlassian organization](https://support.atlassian.com/organization-administration/docs/get-started-with-an-atlassian-organization/)).
An organization can contain one or more sites, and each site can run
one instance of each Atlassian product, including Confluence
([What is an Atlassian organization?](https://support.atlassian.com/organization-administration/docs/what-is-an-atlassian-organization/)).

Inside a Confluence site, content lives in spaces. A space holds pages,
and pages can have child pages, forming a tree. Within a space, folders
are an additional container that sits in that same content tree,
alongside pages; a folder can be nested under another folder or under a
page, and Confluence does not document a maximum nesting depth
([Use folders to organize your work](https://support.atlassian.com/confluence-cloud/docs/use-folders-to-organize-your-work/)).
Folders are simple containers with no page content of their own, unlike
a parent page, which carries its own text in addition to grouping its
children.

## Governance and work

The organization is the governance layer: it manages identity through
managed accounts tied to a verified domain, centralizes billing across
every product in the organization, and, with Atlassian Guard Standard,
provides audit logs and security reporting across the organization
([What is an Atlassian organization?](https://support.atlassian.com/organization-administration/docs/what-is-an-atlassian-organization/)).
Work itself, meaning spaces and the pages and folders inside them, lives
at the site and space level, not at the organization level.

Within Confluence, space permissions are the baseline grant of access to
a space, covering who can view, create, edit, comment, and administer
content in that space, assigned through default or custom roles such as
Admin, Manager, Collaborator, and Viewer
([What are space permissions?](https://support.atlassian.com/confluence-cloud/docs/what-are-space-permissions/)).
Page restrictions then narrow that baseline for an individual page or
folder.

## Audiences and visibility

Confluence does not expose a single named set of audiences the way the
ADR's Public, Organization, Inherited, and Invited-members list does.
Instead, visibility is built from three layers that compose:

- Site-level, global settings, including whether anonymous access is
  permitted at all for the site.
- Space permissions, which a space admin sets for named users, groups,
  or anonymous visitors.
- Page restrictions, which narrow a specific page or folder to named
  people or groups.

A site can allow anyone on the internet, with no Atlassian account, to
view a space's content if a Confluence admin enables anonymous access at
the site level and a space admin then turns it on for that space, with
view generally recommended over edit, create, or comment
([Make a space public with anonymous access](https://support.atlassian.com/confluence-cloud/docs/make-a-space-public/)).
New sites enforce site-level control by default, meaning anonymous
access must first be allowed site-wide before any individual space can
turn it on
([Make a space public with anonymous access](https://support.atlassian.com/confluence-cloud/docs/make-a-space-public/)).

Guests are a separate, named audience: external users invited by an
organization or site admin, who by default can view pages, add pages,
comment, and attach files, but who can never be granted space
administration, export, or restriction permissions
([What can guests see and do in Confluence?](https://support.atlassian.com/confluence-cloud/docs/what-can-guests-see-and-do-on-confluence)).
A guest can only be assigned to one space at a time, so a guest's reach
is deliberately narrower than the ADR's "invited members" audience,
which can span a workspace or folder
([What can guests see and do in Confluence?](https://support.atlassian.com/confluence-cloud/docs/what-can-guests-see-and-do-on-confluence)).

## Narrowing below a parent

Page restrictions let a page or folder narrow access below what the
space permissions or a parent page would otherwise allow, and the
mechanism differs by capability:

- View restrictions cascade automatically: "If someone can't view a
  parent content item or folder, they won't be able to view any child
  content items under it"
  ([Change who can find content and what they can do with it](https://support.atlassian.com/confluence-cloud/docs/add-or-remove-page-restrictions/)).
  When a page already inherits a view restriction from its parent and
  then adds its own, a person must satisfy both to see it.
- Edit restrictions do not cascade from a parent page to its children:
  "Even if someone is restricted from editing a parent item, they won't
  automatically be restricted from editing the child content"
  ([Change who can find content and what they can do with it](https://support.atlassian.com/confluence-cloud/docs/add-or-remove-page-restrictions/)).
  Edit restrictions set at the space level are the exception, since they
  apply to everything in the space.

Setting or changing a restriction requires both edit permission on the
page and Restrict, or Admin, permission in the space
([Change who can find content and what they can do with it](https://support.atlassian.com/confluence-cloud/docs/add-or-remove-page-restrictions/)).
A person cannot be given access to one page without also holding access
to the space it lives in; page restrictions only ever narrow a space
member's access, they cannot grant access beyond the space.

## Ceilings from above

Ceilings run from the site downward, not from the organization
downward in a documented way. A Confluence admin can enforce site-level
control over anonymous access, which caps what any individual space
admin can turn on; while that enforcement is active, anonymous access
must be allowed at the site before a space can use it at all
([Make a space public with anonymous access](https://support.atlassian.com/confluence-cloud/docs/make-a-space-public/)).
Site admins also manage global permissions, including guest space
assignment and the handling of public links, from one place in
Confluence administration
([Manage site-level permissions](https://support.atlassian.com/confluence-cloud/docs/manage-site-level-permissions/)).
Whether the organization layer itself can enforce a ceiling that a site
admin cannot override is not documented in the pages reviewed.

## Discovery versus access

Confluence lets admins decide whether people can even ask for access.
Turning off space access requests "prevents users from requesting
access to all spaces" in the site, and admins can separately turn off
requests for individual pages, blogs, and whiteboards, after which
anyone hitting restricted content sees a plain restricted-access message
instead of a request button
([Manage Confluence access requests](https://support.atlassian.com/confluence-cloud/docs/manage-confluence-access-requests/)).
When requests remain on, Confluence routes the request by email to the
content's recent editors or, failing that, to a space admin who can see
the page
([Manage Confluence access requests](https://support.atlassian.com/confluence-cloud/docs/manage-confluence-access-requests/)).

Confluence narrows discovery along with access for restricted pages: a
restricted page "won't display for anyone who doesn't have permission
to view it, neither in the content tree nor any macros," so its title
is not surfaced to people who lack access, though someone holding a
direct link will see the title in the page itself
([Change who can find content and what they can do with it](https://support.atlassian.com/confluence-cloud/docs/add-or-remove-page-restrictions/)).
This is the closed end of the ADR's discovery spectrum: narrowing here
also closes discovery, it does not leave existence visible the way a
Google Drive limited-access folder does.

## Small customers

The organization and its first site are created together at signup, so
there is no separate step that introduces the organization later
([Create an Atlassian organization](https://support.atlassian.com/organization-administration/docs/get-started-with-an-atlassian-organization/)).
Whether a single-site customer is shown the organization admin surface,
or can avoid it entirely the way a one-workspace Slack team avoids an
Enterprise Grid organization, is not addressed in the pages reviewed.

## Consolidation

Separately created Atlassian organizations are not merged by an
ordinary administrative action. Atlassian describes the operation as
organization consolidation, in which all sites, products, and users
transfer from a source organization into a destination organization;
site URLs and apps are not changed or affected during the transfer, but
the process "is not reversible," and the two organizations cannot later
be split apart
([Atlassian Organization consolidation guide](https://support.atlassian.com/atlassian-cloud/kb/atlassian-organization-consolidation-guide/)).
Consolidation is only available under specific conditions, for example
both organizations using centralized user management, and some setups,
such as those using Atlassian Guard Premium or Atlassian Collections,
are not eligible for self-service consolidation at all
([Can I merge my Atlassian organizations?](https://support.atlassian.com/organization-administration/docs/should-i-merge-my-atlassian-organizations)).

## Relevance to this ADR

- Confluence's organization-site-space-page tree maps closely onto the
  ADR's organization-workspace-folder-project shape: the organization
  governs identity and billing exactly as this ADR's root does, and
  work, meaning spaces and their content, sits below it rather than at
  the root, matching the ADR's rule that work never attaches at the
  root.
- Confluence folders are the clearest external precedent for this ADR's
  optional, freely nestable folder level: a folder is "any node below a
  workspace" in the ADR's words, and a Confluence folder is similarly
  just a deeper position in the same content tree, with no separate
  permission model of its own.
- Confluence's view-cascades, edit-does-not pattern is a concrete
  instance of the ADR's "any level may widen or narrow" rule, and it
  shows that narrowing does not have to be uniform across capabilities,
  which is exactly what the ADR's "audiences differ per capability"
  point anticipates.
  View restrictions are also one of the ADR's two closed discovery
  cases, since a restricted page's existence is hidden rather than left
  visible for a request, matching the ADR's Slack private-channel
  example rather than its Google Drive limited-access example.
- Where Confluence diverges from the ADR is in root-level opt-in
  ceilings: Confluence's documented ceiling (site-level enforcement of
  anonymous access) sits at the site, one level below the ADR's root,
  and no reviewed page describes the organization itself enforcing a
  policy ceiling onto a site the way the ADR expects the root to cap
  every level below it.
- Confluence does not confirm the ADR's one-workspace-customer
  invisibility rule the way Slack's plan structure does; an
  organization and site exist together from signup, and no reviewed
  page states whether a single-site customer can avoid the organization
  admin surface, so this remains an open gap rather than a confirmed
  agreement or divergence.

## Sources

- [What is an Atlassian organization?](https://support.atlassian.com/organization-administration/docs/what-is-an-atlassian-organization/)
- [Create an Atlassian organization](https://support.atlassian.com/organization-administration/docs/get-started-with-an-atlassian-organization/)
- [Use folders to organize your work](https://support.atlassian.com/confluence-cloud/docs/use-folders-to-organize-your-work/)
- [What are space permissions?](https://support.atlassian.com/confluence-cloud/docs/what-are-space-permissions/)
- [Manage site-level permissions](https://support.atlassian.com/confluence-cloud/docs/manage-site-level-permissions/)
- [Change who can find content and what they can do with it (add or remove page restrictions)](https://support.atlassian.com/confluence-cloud/docs/add-or-remove-page-restrictions/)
- [Manage Confluence access requests](https://support.atlassian.com/confluence-cloud/docs/manage-confluence-access-requests/)
- [Make a space public with anonymous access](https://support.atlassian.com/confluence-cloud/docs/make-a-space-public/)
- [What can guests see and do in Confluence?](https://support.atlassian.com/confluence-cloud/docs/what-can-guests-see-and-do-on-confluence)
- [Assign space access to guests](https://support.atlassian.com/confluence-cloud/docs/assign-space-access-to-guests/)
- [Can I merge my Atlassian organizations?](https://support.atlassian.com/organization-administration/docs/should-i-merge-my-atlassian-organizations)
- [Atlassian Organization consolidation guide](https://support.atlassian.com/atlassian-cloud/kb/atlassian-organization-consolidation-guide/)
