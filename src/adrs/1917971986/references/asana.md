# Asana: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

The Asana Help Center renders its articles in the browser, so its pages
were read through rendered excerpts rather than raw page text. Claims
that no readable Asana page states are marked as not documented.

## Hierarchy

Asana's top container is either an Organization or a Workspace, and an
account has one or the other, not both nested. An Organization forms
around a verified company email domain: anyone who signs up with that
domain automatically becomes a member. A Workspace has no domain tie,
is used for personal work or for a company without a unique domain, and
behaves like a single team rather than a structure that contains
teams.
([Asana FAQ](https://asana.com/faq.md))

Inside an Organization, Teams group people and the projects they work
on. Divisions sit above Teams on Enterprise and Enterprise plus plans,
letting an organization split users into administrative groups for
license assignment and delegated administration, while organization
admins and super admins retain access across every division.
([Divisions in paid orgs](https://help.asana.com/s/article/divisions-in-paid-orgs))

Below Teams, Projects hold the work, and Portfolios (Advanced,
Enterprise, and Enterprise plus plans) are a separate, flatter
construct: a portfolio is a collection of projects for monitoring
status and progress across them, not a position in the containment
tree, and projects do not nest inside other projects.
([Portfolio management](https://help.asana.com/s/article/portfolio-management))

Tasks are not confined to one project. A task can be multi-homed into
several projects across any teams in the organization, so it is one
record that shows up in every project it is added to, not a copy.
([How to multi-home tasks](https://help.asana.com/s/article/how-to-multi-home-tasks))

## Governance and work

Organization membership, the admin console, and billing live at the
Organization level and are tied to the verified email domain. Billing
and license administration can be delegated to Division admins, but
oversight of every division remains with organization admins and super
admins.
([Divisions in paid orgs](https://help.asana.com/s/article/divisions-in-paid-orgs))

Work itself, meaning Teams, Projects, and the tasks inside them, lives
below the Organization. A Workspace, when a company has no verified
domain, holds both governance (its own member list) and work in one
undivided layer, since Asana does not split a Workspace into a
governing root and a working layer the way it does for an Organization.
([Asana FAQ](https://asana.com/faq.md))

## Audiences and visibility

Asana documents an object-based privacy model that applies to Teams
and Projects, with privacy flowing from the top down so that
organization and team settings constrain project settings.
([Understanding privacy and visibility in Asana](https://help.asana.com/s/article/understanding-privacy-and-visibility-in-asana))

Team privacy has three named settings: Membership by Request
(accessible to team members, others may request to join and an active
member or team admin must approve), Private (accessible to team
members only, no requests accepted), and Public to organization
(accessible to team and organization members, others may request to
join). Public and private team options require a paid tier.
([Team permissions](https://help.asana.com/s/article/team-permissions))

Project privacy has three named settings: Private to members
(accessible only to invited project members, non-members cannot see
the project in search), Team only (accessible to the project's team),
and Shared with organization (accessible to project members, team
members, and every organization member). Shared with organization is
available only in paid organizations and not on a Division
subscription.
([Project permissions](https://help.asana.com/s/article/project-permissions))

Guests, meaning people without an email address on the organization's
approved domain, have limited access and see only what is explicitly
shared with them. A guest can join a team only by invitation and
cannot create, browse, or request to join additional teams. Asana also
names "limited access members," people who lack access to every
project in a team they belong to; they can still see the team's name
and membership.
([Guests FAQ](https://help.asana.com/s/article/guests-faq))

## Narrowing below a parent

A project can narrow its audience below what its team or organization
would otherwise allow by choosing Private to members or Team only
instead of Shared with organization, restricting access to a subset of
the people who could otherwise reach it through the team.
([Project permissions](https://help.asana.com/s/article/project-permissions))

A team can likewise narrow itself to Private even inside an
organization whose other teams are open, limiting discovery and
membership to people explicitly invited.
([Team permissions](https://help.asana.com/s/article/team-permissions))

## Ceilings from above

Asana places organization-wide sharing controls with admins. Admins
"can set default sharing permissions, restrict public links, and
control who sees or shares projects and reports," and super admins
"can enforce consistent permissions at scale by setting and governing
permission defaults across the organization"
([Admin permissions and access controls](https://asana.com/features/admin-security/permissions)).
Organization settings influence team settings, which in turn influence
project settings
([Understanding privacy and visibility](https://help.asana.com/s/article/understanding-privacy-and-visibility-in-asana)).
Whether an admin can remove the Shared with organization option from
every project, rather than only change its default, is not documented
on a publicly readable Asana page.

## Discovery versus access

Asana's privacy settings tie discovery to access rather than
separating them: a Private to members project does not appear in
non-members' search results, and a Private team does not accept
requests to join. Membership by Request teams make an explicit
middle case, where the team is discoverable enough to request access
but the request requires approval before membership is granted.
([Team permissions](https://help.asana.com/s/article/team-permissions),
[Project permissions](https://help.asana.com/s/article/project-permissions))

## Small customers

A personal or domain-less account gets a Workspace, which behaves like
a single team and carries no organization switcher, division
structure, or domain-based admin console. Converting to an Organization
requires adding a company email address to the account and verifying
that domain's ownership through a DNS TXT record before Asana allows
the conversion.
([Asana FAQ](https://asana.com/faq.md);
[Email domain management for Asana organizations](https://help.asana.com/s/article/email-domain-management-for-asana-organizations))

## Consolidation

Each email domain can be associated with only one Organization at a
time, and an Organization can hold multiple domains but a domain
cannot be shared across multiple organizations. Asana support resolves
conflicts when a domain is already tied to an existing organization,
which indicates there is no self-service merge between organizations
built around the same domain.
([Email domain management for Asana organizations](https://help.asana.com/s/article/email-domain-management-for-asana-organizations))

## Relevance to this ADR

- Asana's Organization (domain-bound) versus Workspace (domain-less)
  split maps onto the ADR's single root that is sometimes hidden: a
  one-workspace Asana customer never deals with organization-level
  structure, matching "a one-workspace customer never sees the
  organization," though Asana reaches this by giving domain-less
  customers a different top-level object entirely rather than by
  revealing an always-present root on the second workspace.
- Asana's Team sits where this ADR places Folder and partially where
  it places Workspace: teams hold visibility settings and contain
  projects, while tasks can be multi-homed across projects, so a task
  in Asana has no single position the way a resource with one `parent`
  does in this ADR.
- Asana's per-level privacy settings (team privacy, project privacy)
  and its statement that privacy flows top-down agree with the ADR's
  rule that ancestors' limits cap descendants and that any level may
  narrow below its parent.
- Asana's admin-governed sharing defaults resemble this ADR's root
  ceilings, but the public pages describe defaults rather than
  enforced caps, so they do not confirm the opt-in enforcement this ADR
  calls for.
- Asana diverges from the ADR on consolidation and on "project": Asana
  ties organization identity to an email domain rather than to an
  explicit migration decision, and Asana's Portfolio is a
  cross-project rollup with no parent position, unlike this ADR, where
  nothing above Project is named "project" and Folder, not Portfolio,
  is the grouping construct.

## Sources

- [Asana Frequently Asked Questions (asana.com/faq.md)](https://asana.com/faq.md)
- [Divisions in paid orgs](https://help.asana.com/s/article/divisions-in-paid-orgs)
- [Portfolio management](https://help.asana.com/s/article/portfolio-management)
- [How to multi-home tasks](https://help.asana.com/s/article/how-to-multi-home-tasks)
- [Understanding privacy and visibility in Asana](https://help.asana.com/s/article/understanding-privacy-and-visibility-in-asana)
- [Team permissions](https://help.asana.com/s/article/team-permissions)
- [Project permissions](https://help.asana.com/s/article/project-permissions)
- [Guests FAQ](https://help.asana.com/s/article/guests-faq)
- [Email domain management for Asana organizations](https://help.asana.com/s/article/email-domain-management-for-asana-organizations)
- [Admin permissions and access controls](https://asana.com/features/admin-security/permissions)
