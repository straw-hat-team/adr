# Audiences: naming the organization's own people

Verified against primary documentation on 2026-10-12.

## Separate axes

Vendors keep three questions apart: who a person is, what they may do, and
where an application can be reached.

- Who: AWS divides human identities into "workforce, third parties, and users",
  where "users are the consumers of your applications"
  ([Identity
  management](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/identity-management.html)).
  Microsoft Entra says "a workforce tenant configuration is for your employees,
  internal business apps, and other organizational resources"
  ([Tenant
  configurations](https://learn.microsoft.com/entra/external-id/tenant-configurations)).
  Auth0 names the scenario "B2E (Business to Employees)"
  ([B2E](https://auth0.com/docs/get-started/architecture-scenarios/b2e)).
- What: support and finance people still hold roles named admin, such as Google
  Workspace's "Help Desk Admin"
  ([Prebuilt administrator
  roles](https://knowledge.workspace.google.com/admin/users/prebuilt-administrator-roles))
  and Microsoft's "payroll administrators"
  ([Security
  levels](https://learn.microsoft.com/security/privileged-access-workstations/privileged-access-security-levels)).
- Where: Cloudflare Access describes "internal applications that you host in
  your own environment"
  ([Self-hosted
  applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/)).

The ADR's audiences answer who is calling. Roles answer what they may do, so
admin and support are roles inside the Internal audience, not audiences.

## Admin

In products with customers of their own, admin means the customer's
administrator:

- Stripe: "Administrator: This role is for anyone who needs similar access as
  the account owner", next to a customer-side "Support Specialist"
  ([Roles](https://docs.stripe.com/get-started/account/teams/roles)).
- Atlassian: "An organization admin is the highest level of admin"
  ([Admin
  roles](https://support.atlassian.com/user-management/docs/what-are-the-different-types-of-admin-roles/)).
- Zendesk: "Agents, admins, and the account owner are all team members", all on
  the customer's side
  ([Team member
  roles](https://support.zendesk.com/hc/en-us/articles/4408883763866)).

Naming the organization's own people Admin would collide with every such
customer role.

## Operator

Operator names platform engineers or software, never business staff:

- Kubernetes defines a cluster operator as "a person who configures, controls,
  and monitors clusters" and warns that "cluster operators are different from
  the Operator pattern"
  ([Glossary](https://kubernetes.io/docs/reference/glossary/?all=true)), in
  which "operators are software extensions to Kubernetes"
  ([Operator
  pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)).
- AWS's workforce "includes administrators, developers, and operators" who
  "manage, build, and operate your AWS resources"
  ([Identity
  management](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/identity-management.html)).
- Google's SRE book uses "human operators" for the people running production
  ([Automation at
  Google](https://sre.google/sre-book/automation-at-google/)).

## Staff

Staff points both ways. Shopify's staff accounts belong to the merchant: "you
and your staff members can access the Shopify admin"
([Shopify admin](https://help.shopify.com/en/manual/shopify-admin)). Django's
`is_staff` "designates whether the user can log into this admin site"
([source](https://github.com/django/django/blob/main/django/contrib/auth/models.py)).
Vendors describing their own people put their name first: "GitHub personnel
will not access private repository content without your consent"
([Terms of
Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)),
"Atlassian staff that access and process personal data"
([Security
practices](https://www.atlassian.com/trust/security/security-practices)).

## Internal

"Internal tools" is the common name for what the organization's own people
use. Retool describes itself as a way to "build internal software" and found
that "operations teams were the most popular" audience for them
([State of internal tools
2022](https://retool.com/blog/state-of-internal-tools-2022)). No product
surveyed uses internal for a customer's own people.

Internal also names network reach, as in an internal load balancer
([Google Cloud research](./gcp.md#exposure)), so the ADR uses it only for
people and describes reach in other words.

## Platform

No provider names a level for the platform's own callers, such as the kubelet
or load balancer health checks. Gateway API comes closest with personas, not
levels
([Kubernetes research](./kubernetes.md#exposure)).
