# Azure: hierarchy, audiences, and access

Verified against primary documentation on 2026-10-10.

## Hierarchy

Every Azure subscription trusts exactly one Microsoft Entra tenant,
the directory that holds identities and authorizes sign in, while one
tenant can be trusted by many subscriptions
([Add an existing Azure subscription to your
tenant](https://learn.microsoft.com/en-us/entra/fundamentals/how-subscriptions-associated-directory)).

Above subscriptions sits a management group hierarchy. Each directory
has a single root management group, whose ID matches the Microsoft
Entra tenant ID, and all management groups and subscriptions in the
directory fold up into it. A management group tree supports up to six
levels of depth, a limit that does not include the root level or the
subscription level, and a single directory can hold up to 10,000
management groups. Each management group or subscription has exactly
one parent, though a management group can have many children
([Organize your resources with management
groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)).

Below a subscription, Azure role-based access control recognizes four
scope levels in a parent-child chain: management group, subscription,
resource group, and resource
([What is Azure role-based access control
(RBAC)?](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)).

## Governance and work

The Microsoft Entra tenant supplies identity for sign in, while the
subscription is the scope where Azure resources and role assignments
are managed; changing a subscription's tenant changes who can sign in
to manage it, but never makes the subscription owner a Global
Administrator of that tenant
([Add an existing Azure subscription to your
tenant](https://learn.microsoft.com/en-us/entra/fundamentals/how-subscriptions-associated-directory)).

Billing runs through a separate hierarchy from the resource tree. A
billing account is created when a customer signs up to use Azure, and
its shape depends on the agreement type: a Microsoft Online Services
Program account contains subscriptions directly, an Enterprise
Agreement account contains departments and accounts, a Microsoft
Customer Agreement account contains billing profiles and invoice
sections, and a Microsoft Partner Agreement account contains billing
profiles and customers. A subscription can appear under a billing
account and, independently, under a management group in the resource
hierarchy, because the two hierarchies track different concerns
([View your billing accounts in the Azure
portal](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/view-all-accounts)).

Policy and access assigned at the root management group apply to the
entire directory, to every management group, subscription, resource
group, and resource within it, and a resource or subscription owner
cannot override that assignment
([Organize your resources with management
groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)).

## Audiences and visibility

Azure's primary documentation does not describe a general audience
model for resources comparable to public, organization-wide, or
invited-member visibility. Not documented.

Discovery is close to binary rather than audience based. Azure
Resource Graph, which backs the portal's resource search, returns
results only for subscriptions the calling principal already has read
access to, and returns no results, or a 403, when no such access
exists
([Overview of Azure Resource
Graph](https://learn.microsoft.com/en-us/azure/governance/resource-graph/overview)).

One documented exception sits at the very top: all Azure customers can
see the root management group and where their own subscription sits
within the hierarchy, even though only an elevated Global
Administrator can manage the root itself
([Organize your resources with management
groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)).

## Narrowing below a parent

Azure RBAC itself is additive: effective permissions are the sum of a
principal's role assignments at every scope in the chain, with no
customer-facing mechanism to subtract access at a lower scope
([What is Azure role-based access control
(RBAC)?](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)).
Deny assignments can block access regardless of a role assignment, but
customers cannot create their own deny assignments directly; Azure
creates and manages them, for example through deployment stacks, and
customer-managed deny assignments are documented as being in private
preview only
([List Azure deny
assignments](https://learn.microsoft.com/en-us/azure/role-based-access-control/deny-assignments)).

Azure Policy offers an explicit narrowing mechanism instead: a policy
exemption, created as a child object on a resource hierarchy or
individual resource, excuses that scope from an assignment that would
otherwise evaluate it. Exemptions can be time bound through an
`expiresOn` property. Because of the impact of granting one, creating
an exemption requires both the `Microsoft.Authorization/policyExemptions/write`
permission on the target scope and the `exempt/Action` verb on the
policy assignment being exempted, so a lower scope cannot narrow
itself without a grant tied to the parent assignment
([Understand scope in Azure
Policy](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/scope)).

## Ceilings from above

A policy or role assignment made at the root management group reaches
every management group, subscription, resource group, and resource in
the directory, and the resource or subscription owner cannot alter it
([Organize your resources with management
groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)).

When several policy assignments with a deny effect apply to the same
resource at different scopes, Azure documents the outcome as
cumulative and most restrictive: a resource must satisfy every deny
policy in its path, and any one of them can block it
([Azure Policy definitions effect
basics](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effect-basics)).

Ceilings at the root are opt-in rather than automatic. No principal
has default access to the root management group; a Microsoft Entra
Global Administrator must first elevate their own access before they
can assign roles or policy there, and only after that elevation does
anything apply at the directory-wide ceiling
([Organize your resources with management
groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)).

## Discovery versus access

Azure's resource-facing tools largely collapse discovery into access.
Azure Resource Graph requires at least read permission on a resource
or object group before it returns anything for that scope, with no
documented mode that reveals existence without read access
([Overview of Azure Resource
Graph](https://learn.microsoft.com/en-us/azure/governance/resource-graph/overview)).

The one documented departure is the root management group, which
every Azure customer can see and locate their own subscription
within, independent of whether they can manage that root
([Organize your resources with management
groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)).

## Small customers

A billing account is created automatically the moment a customer signs
up for Azure, for example through an Azure Free Account or a
pay-as-you-go offer, without any separate enrollment step; a new
Microsoft Online Services Program billing account of this kind
supports up to five subscriptions by default
([View your billing accounts in the Azure
portal](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/view-all-accounts)).

New subscriptions default automatically to the root management group
when they are created, so a small customer accumulates subscriptions
under the root without ever having to create a management group
([Organize your resources with management
groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)).
Whether such a customer is shown an organization-level concept at all
during signup is not documented.

## Consolidation

Azure's own guidance frames consolidating two Microsoft Entra tenants
into one as the typical goal after a merger or acquisition, but also
as complex enough that organizations sometimes leave the tenants
separate for an extended period rather than complete it. A custom
domain name can only belong to one tenant at a time, which is the
stated reason consolidation is preferred when it is feasible
([Scenarios for multiple Microsoft Entra
tenants](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/multi-tenant/scenarios)).

The documented mechanism for moving a unit of work between tenants
operates at the subscription level, not the tenant level: a
subscription can be transferred to a different Microsoft Entra
directory, but role assignments and custom roles are permanently
deleted from the source directory, and Azure Policy objects,
including definitions, assignments, and exemptions, do not transfer
and must be exported, reimported, and reassigned in the target
directory
([Transfer an Azure subscription to a different Microsoft Entra
directory](https://learn.microsoft.com/en-us/azure/role-based-access-control/transfer-subscription)).
No primary documentation describes a way to merge two tenants
directly; consolidation is a sequence of workload migrations rather
than a single operation.

## Relevance to this ADR

- Azure's root management group matches the ADR's organization: a
  single root per tenant that carries identity, and whose policy and
  role assignments cascade to every workspace-like and folder-like
  node beneath it, with descendants unable to override what the root
  sets.
- Azure diverges from the ADR's strict two-tier split of workspace
  as a typed child of the root and folder as anything deeper.
  Management groups and subscriptions nest freely up to six levels
  with no distinct word or rule marking the first level down from the
  root, and nothing in Azure corresponds to the ADR's project as a
  resource, rather than a position, attached below a workspace or
  folder.
- The ADR's rule that root ceilings are opt-in per policy matches
  Azure closely: no principal has default access to the root
  management group, and an administrator must elevate access before
  anything enforced there becomes a ceiling for the rest of the
  directory.
- Azure's narrowing mechanism, the policy exemption, diverges from
  the ADR's model of any level freely narrowing itself. An exemption
  requires a permission tied to the parent assignment being exempted,
  so narrowing in Azure is closer to a grant issued from above than
  to an independent choice made by the descendant.
- Azure mostly collapses the ADR's discover and read capabilities
  into one: Resource Graph and similar tools reveal a resource only to
  principals who already have read access to it, with the root
  management group as the sole documented case of existence being
  visible without management access. Azure's documented absence of a
  tenant merge tool, requiring workload-by-workload migration instead,
  matches the ADR's position that separately created organizations
  consolidate only through an explicit migration.

## Sources

- [Organize your resources with management
  groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)
- [What is Azure role-based access control
  (RBAC)?](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)
- [List Azure deny
  assignments](https://learn.microsoft.com/en-us/azure/role-based-access-control/deny-assignments)
- [Understand scope in Azure
  Policy](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/scope)
- [Azure Policy definitions effect
  basics](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effect-basics)
- [View your billing accounts in the Azure
  portal](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/view-all-accounts)
- [Transfer an Azure subscription to a different Microsoft Entra
  directory](https://learn.microsoft.com/en-us/azure/role-based-access-control/transfer-subscription)
- [Add an existing Azure subscription to your
  tenant](https://learn.microsoft.com/en-us/entra/fundamentals/how-subscriptions-associated-directory)
- [Overview of Azure Resource
  Graph](https://learn.microsoft.com/en-us/azure/governance/resource-graph/overview)
- [Scenarios for multiple Microsoft Entra
  tenants](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/multi-tenant/scenarios)
