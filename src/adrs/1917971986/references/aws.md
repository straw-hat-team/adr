# AWS: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

An AWS organization is a collection of accounts managed centrally in a
hierarchical, tree-like structure with a single administrative root at
the top and organizational units (OUs) nested under that root. An
organization has exactly one management account, which is the account
used to create it, plus zero or more member accounts, zero or more
OUs, and zero or more policies
([Terminology and concepts for AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html)).

The root is contained in the management account and is the top-most
container; an organization can have only one root, created
automatically. OUs are a group of accounts within an organization and
can contain other OUs, forming a hierarchy; nested OUs inherit the
policies of their parent OU in addition to any controls assigned
directly to them. Excluding the root and the accounts created in the
lowest OUs, the hierarchy can be five levels deep
([Terminology and concepts for AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html);
[Quotas and service limits for AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_reference_limits.html)).
By default an organization can hold 10 accounts, a quota the
management account can raise up to 50,000 based on qualification, and
an organization can hold up to 2,000 OUs
([Quotas and service limits for AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_reference_limits.html)).

An AWS account is the only typed container below the root and OU
level; it is where resources, IAM users, and IAM roles actually live,
and a member account can belong to only one organization at a time
([Terminology and concepts for AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html)).

## Governance and work

The management account is the ultimate owner of the organization, with
final control over security, infrastructure, and billing policy; it
creates and invites accounts, designates delegated administrators,
removes accounts, and attaches policies to the root, OUs, or accounts.
It also acts as the payer account, responsible for the charges of every
account in the organization
([Terminology and concepts for AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html)).
AWS recommends keeping actual resources out of the management account
and in member accounts instead, partly because guardrails such as
service control policies never restrict the management account's own
users and roles
([Terminology and concepts for AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html)).

An organization's policy guardrails flow from the root down through
OUs to accounts. A service control policy (SCP) attached to the root
applies to every OU and member account, but never to the management
account; the same is true for resource control policies (RCPs)
([Terminology and concepts for AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html)).
Audit and billing history are properties of the organization and the
management account; consolidated billing produces a single bill for
every account sharing one Seller of Record, with usage combined across
accounts to reach volume, Reserved Instance, and Savings Plan discounts
faster
([Consolidating billing for AWS
Organizations](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html)).

## Audiences and visibility

AWS does not document a named audience ladder, such as public,
organization-wide, or invited-members, for accounts, OUs, or the
organization itself. Access to a resource is instead the product of
whatever identity-based policies are attached to the requesting IAM
user or role and whatever resource-based policies are attached to the
resource; an administrator must explicitly attach one of these for any
access to exist
([Identity-based policies and resource-based policies - AWS Identity
and Access
Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html)).
Identity-based policies are attached to users, groups, or roles;
resource-based policies, such as an Amazon S3 bucket policy or an IAM
role trust policy, are attached to the resource itself
([Identity-based policies and resource-based policies - AWS Identity
and Access
Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html)).
AWS Resource Access Manager (RAM) lets an owning account share
resources with individual accounts, with OUs, or with an entire
organization as the principal, which is the closest documented
equivalent to a widening grant, but it is still an explicit share
rather than a named audience setting
([Terms and concepts for AWS RAM - AWS Resource Access
Manager](https://docs.aws.amazon.com/ram/latest/userguide/getting-started-terms-and-concepts.html)).

## Narrowing below a parent

SCPs and RCPs are the documented narrowing mechanism, and they narrow
by never granting anything in the first place. An SCP "defines a
permission guardrail, or sets limits, on the actions that the IAM
users and IAM roles in your organization can perform," and no
permissions are granted by an SCP; the administrator must still attach
identity-based or resource-based policies to grant access
([Service control policies (SCPs) - AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)).
Any account "has only those permissions permitted by every parent
above it," so attaching a narrower SCP at an OU below the root removes
permissions for every account in that OU even if a more permissive SCP
sits above it
([Service control policies (SCPs) - AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)).
RCPs work the same way for resources rather than principals: "any
resource in an account has only those permissions permitted by every
parent above it," so an RCP attached lower in the tree can remove
permissions an ancestor RCP allowed
([Resource control policies (RCPs) - AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html)).
There is no documented mechanism for a child OU or account to widen
what a parent SCP or RCP already excludes.

## Ceilings from above

The effective permissions for any principal are the logical
intersection of what the identity-based or resource-based policy
allows and what the applicable SCPs and RCPs allow, evaluated across
every level from the root down to the account
([Service control policies (SCPs) - AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html);
[Resource control policies (RCPs) - AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html)).
A member account administrator cannot lift a principal over a ceiling
set above it, even by attaching the AdministratorAccess policy
([Service control policies (SCPs) - AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)).

These ceilings are opt-in at the organization level rather than always
on. SCPs and RCPs are available only in an organization that has all
features enabled; an organization that instead supports only
consolidated billing cannot use them at all, and no policy types are
enabled by default under that feature set
([Service control policies (SCPs) - AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html);
[Creating an organization with AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_create.html)).
By default, enabling all features also enables SCPs at the root with
the permissive FullAWSAccess policy attached everywhere, so an
organization that enforces nothing beyond that default leaves every
account with full access
([Creating an organization with AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_create.html)).
A member account designated as a delegated administrator for an AWS
service gains read-only access to organization data and administrative
permissions for that service, without being exempt from SCPs or RCPs
([register-delegated-administrator - AWS CLI
Reference](https://docs.aws.amazon.com/cli/latest/reference/organizations/register-delegated-administrator.html);
[Service control policies (SCPs) - AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)).

## Discovery versus access

AWS does not document a mode in which a principal can see that an
account, OU, or resource exists without already having access to it.
Access is granted or denied outright by policy evaluation; there is no
separate discover capability. The closest documented adjacent concept
is IAM Access Analyzer, a detective tool for administrators: an
external access analyzer treats an organization or account as a "zone
of trust" and generates findings whenever a resource-based policy
grants access to a principal outside that zone, which surfaces
unintended sharing after the fact rather than offering requesters a
way to discover a resource before being granted access to it
([Understand how IAM Access Analyzer findings work - AWS Identity and
Access
Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-concepts.html)).

## Small customers

An AWS account can exist and be used on its own, without ever being
part of an organization; creating an organization is a deliberate step
in which the calling account becomes the new organization's management
account
([Creating an organization with AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_create.html)).
A customer can also choose a consolidated-billing-only feature set
instead of all features, which shares billing across accounts without
exposing policy-based governance at all
([Creating an organization with AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_create.html)).
There is no requirement to create OUs; a small customer can leave every
account directly under the root.

## Consolidation

Migrating an account from one organization to another is supported at
any time, for example after a merger or acquisition, provided the
account is not closed or suspended, a created account has existed for
at least four days, the destination organization has existed for at
least seven days, and the account's Seller of Record matches the
destination organization's
([Migrate an account to another organization with AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_account_migration.html)).
Historically this required the account to leave its current
organization, operate as a standalone account, and then accept an
invitation from the new organization; AWS Organizations now also
supports a direct account transfer, in which the new organization
sends an invitation and the account accepts it without first leaving
its current organization
([Migrate an account to another organization with AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_account_migration.html)).
A migrated account lands at the root of the new organization, and the
new organization's SCPs and RCPs apply to it going forward; the
management account itself can migrate only after every member account
is removed and the old organization is deleted
([Migrate an account to another organization with AWS
Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_account_migration.html)).
There is no documented operation that merges two organizations as
wholes; consolidation happens account by account.

## Relevance to this ADR

- AWS has no node that plays the ADR's folder role between an account
  and the work inside it. The account itself is the innermost typed
  container, and OUs are purely an administrative grouping above
  accounts, closer to the ADR's governance layer than to its folder.
- The ADR's "ancestors' limits cap descendants" rule maps closely onto
  SCPs and RCPs: effective permissions are documented as the
  intersection of every parent's policy down to the account, and a
  lower level can only remove permissions, never restore ones excluded
  above it.
- AWS diverges from the ADR's model of grants and limits both existing
  at any level by capability. SCPs and RCPs are exclusively a ceiling
  mechanism; they never grant anything, so the only way to widen access
  in AWS is through identity-based or resource-based policies, and
  AWS's guardrails never play the "widen" half of the ADR's model.
- The ADR's root ceilings being opt-in per policy matches AWS closely:
  SCPs and RCPs are unavailable at all unless an organization enables
  all features, and even then only the FullAWSAccess default applies
  until an administrator attaches something narrower.
- AWS's account-to-account migration, with its waiting periods, Seller
  of Record matching, and explicit invite and accept steps, supports
  the ADR's position that consolidating separately created top-level
  entities is a deliberate operation rather than an ordinary tree move,
  though AWS performs this per account rather than as a single
  workspace-level migration.

## Sources

- [Terminology and concepts for AWS
  Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html)
- [Quotas and service limits for AWS
  Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_reference_limits.html)
- [Service control policies (SCPs) - AWS
  Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [Resource control policies (RCPs) - AWS
  Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html)
- [Identity-based policies and resource-based policies - AWS Identity
  and Access
  Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html)
- [Terms and concepts for AWS RAM - AWS Resource Access
  Manager](https://docs.aws.amazon.com/ram/latest/userguide/getting-started-terms-and-concepts.html)
- [register-delegated-administrator - AWS CLI
  Reference](https://docs.aws.amazon.com/cli/latest/reference/organizations/register-delegated-administrator.html)
- [Consolidating billing for AWS
  Organizations](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html)
- [Creating an organization with AWS
  Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_create.html)
- [Migrate an account to another organization with AWS
  Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_account_migration.html)
- [Understand how IAM Access Analyzer findings work - AWS Identity and
  Access
  Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-concepts.html)
