# GitHub: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

GitHub's structure places personal accounts and organizations as the
accounts that can own repositories, with an enterprise account sitting
above organizations as a container for several of them. GitHub states
the enterprise account is "the central point of administration for
your business on GitHub" and that it contains multiple organizations,
while repositories and teams exist inside those organizations
([About enterprise accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-enterprise-accounts)).

Within an organization, teams can be nested: "a parent team can have
multiple child teams, while each child team only has one parent team,"
and GitHub supports multiple levels of nested teams. Secret teams are
the exception and cannot be nested
([About teams](https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams)).

Repositories are owned by a personal account or by an organization, and
are not directly accessible under the enterprise account itself
([About enterprise accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-enterprise-accounts)).

## Governance and work

The enterprise account is described as the administrative layer for
identity (inviting or provisioning users and assigning them to
organizations and teams), billing (including cost centers that
allocate spending across business units), and policy (rules that
govern repository creation, visibility, forking, and more across every
organization the enterprise owns)
([About enterprise accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-enterprise-accounts)).

Work itself, meaning repositories, issues, and projects, lives inside
organizations and personal accounts, not at the enterprise level
([About enterprise accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-enterprise-accounts)).

## Audiences and visibility

Repositories have three visibility levels. Public repositories are
"accessible to everyone on the internet." Private repositories are
"only accessible to you, people you explicitly share access with, and,
for organization repositories, certain organization members." Internal
repositories are available only in organizations owned by a GitHub
Enterprise Cloud enterprise account
([About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)).

Internal repositories extend read access across the whole enterprise:
"organization members have read permissions to all internal
repositories in an enterprise, including those in organizations they
are not a member of," while remaining invisible to anyone outside the
enterprise, including outside collaborators on organization
repositories
([About repositories, GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/repositories/creating-and-managing-repositories/about-repositories)).

GitHub Projects have a separate visibility switch, public or private.
A public project can be viewed by "everyone on the internet," while a
private project can be seen only "by users granted at least read
access." Project visibility is independent of the visibility of the
repositories whose items appear in it: viewing an item still requires
access to the repository that item belongs to
([Managing visibility of your projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects)).

## Narrowing below a parent

Organization owners can set base permissions, a default access level
that applies to every organization member across all of the
organization's repositories. Base permissions act as a floor: "if
someone with admin access to an organization's repository grants a
member a higher level of access for the repository, the higher level
of access overrides the base permission." The documentation describes
granting higher access above the base level, and separately notes that
internal repositories keep a minimum read-level visibility even when
base permissions are set to none, which indicates the floor cannot be
pushed below read for internal repositories
([Setting base permissions for an organization](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/setting-base-permissions-for-an-organization)).
Whether a repository can grant a member strictly less than the base
permission for that repository specifically is not documented on this
page.

At the repository level, forking can be narrowed further down the
chain: people with admin permissions to a private repository can
disallow forking of that repository, and separately, organization
owners can disallow forking of any private repository in the
organization
([Forks](https://docs.github.com/en/pull-requests/reference/forks)).

## Ceilings from above

Enterprise owners can enforce policies that cap what organizations may
choose, rather than leaving every choice to the organization. For
repository creation, the enterprise can restrict which visibilities
members may create, restrict creation to organization owners only, or
"allow owners to administer the setting on the organization level,"
which is the non-enforced option. The same three-way pattern applies
to who may change a repository's visibility, and to whether private or
internal repositories may be forked at all, including an option to
"never allow forking of private or internal repositories" across every
organization the enterprise owns
([Enforcing repository management policies in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise)).

If repository creation is already restricted to organization owners
only, members are also unable to change repository visibility,
regardless of how the visibility-change policy itself is set
([Enforcing repository management policies in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise)).
This is a ceiling that is opt-in per policy: an enterprise that leaves
a policy on the organization-choice setting places no cap at all.

## Discovery versus access

Primary documentation states what each visibility level permits,
public, internal, or private, but does not describe a distinct
discovery step in which someone without read access can see that a
private or internal repository exists and request access to it.
Private repository access is described only as something granted
explicitly by an owner or collaborator
([About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)).
Not documented: an explicit request-access flow analogous to a
discoverable but closed resource.

## Small customers

Organizations can exist on their own, with no enterprise account above
them. Only when an organization is invited to and approved into an
enterprise does it become subject to that enterprise's governance
([Setting up an organization](https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding/setting-up-organizations-and-teams/setting-up-an-organization)).
A one-organization customer therefore never has to interact with an
enterprise account, identity provisioning, or enterprise-wide policy.

## Consolidation

An existing organization can be added to an enterprise account.
Enterprise owners invite the organization by name from enterprise
settings, an owner of that organization approves the invitation, and
the enterprise owner then approves the pending organization to
complete the move
([Setting up an organization](https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding/setting-up-organizations-and-teams/setting-up-an-organization)).
An organization can be invited only if it does not already belong to
another enterprise, and enterprises that use Enterprise Managed Users
cannot add existing organizations at all
([Setting up an organization](https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding/setting-up-organizations-and-teams/setting-up-an-organization)).
Organizations with data residency enabled cannot move between
GitHub.com and GHE.com enterprises through this invitation flow and
instead require GitHub Enterprise Importer
([Setting up an organization](https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding/setting-up-organizations-and-teams/setting-up-an-organization)).

## Relevance to this ADR

- The README's own table already maps GitHub's enterprise account to
  the governing role and GitHub's organization to the role that holds
  work. In this ADR's vocabulary that makes the enterprise account the
  Organization (tenant root, governing identity, billing, and policy)
  and a GitHub organization the Workspace (holds repositories, issues,
  and projects). Readers should not confuse this with GitHub's own use
  of the word "organization," which names the Workspace role here, not
  the root.
- GitHub has no typed, freely nestable Folder level between an
  organization and a repository. Teams nest, but teams group people,
  not work; repositories and projects attach directly to an
  organization. This is a divergence from the ADR, which allows
  optional folders between a workspace and a project.
- Internal repository visibility matches the ADR's "Organization"
  audience closely: it grants read access to every member across every
  workspace (GitHub organization) under one root, exactly the audience
  the ADR calls "every principal of the tenant, across all
  workspaces."
- GitHub's base permissions behaving as a floor that a repository can
  raise, together with enterprise policy acting as an opt-in ceiling on
  organization choices, agrees with the ADR's rule that grants
  accumulate upward while limits bound downward and that root ceilings
  are opt-in per policy.
- An organization existing with no enterprise account above it, and
  joining one later only through an explicit invitation and approval
  flow, agrees with the ADR's position that a small customer never
  meets the governing layer and that consolidation of separately
  created top-level accounts happens through deliberate migration, not
  an ordinary tree operation.

## Sources

- [About enterprise accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-enterprise-accounts)
- [About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
- [About repositories, GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/repositories/creating-and-managing-repositories/about-repositories)
- [Setting base permissions for an organization](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/setting-base-permissions-for-an-organization)
- [Enforcing repository management policies in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise)
- [Forks](https://docs.github.com/en/pull-requests/reference/forks)
- [About teams](https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams)
- [Setting up an organization](https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding/setting-up-organizations-and-teams/setting-up-an-organization)
- [Managing visibility of your projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects)
