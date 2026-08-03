---
id: '8779742261'
title: Actor and Authority Taxonomy for Managed Systems
state: Approved
created: 2026-08-03
tags: [naming, taxonomy, schema, authorization, gitops, identity]
category: Platform
---

# Actor and Authority Taxonomy for Managed Systems

## Context

Multi-tenant products keep needing to answer the same question in schemas,
enums, role names, and docs: **who is acting, and with what authority?**
Without a shared taxonomy, each field invents its own vocabulary, and the
same words drift across meanings: "system" sometimes means the software,
sometimes the deployment; "platform" sometimes means the product,
sometimes the management plane; "operator" sometimes means a human,
sometimes an automation; "user" sometimes means any caller, sometimes the
end user. A concrete casualty: a mutation-authority field first shipped as
`origin: config | api` and had to be renamed twice because neither word
had an agreed meaning.

This ADR fixes the vocabulary once: a ladder of actors, a set of channels,
the reservation rules for the words involved, and a worked application to
the recurring "system-converged, read-only through the API" pattern.

## Resolution

Chosen option: "a five-rung actor ladder plus an orthogonal channel axis,
with reserved one-meaning words", because every naming dispute encountered
so far reduces to either confusing two rungs of the ladder, confusing an
actor with a channel, or reusing a word that already had a meaning.

### The actor ladder (who can cause a write)

| Rung | Meaning | Trust source | Examples |
| --- | --- | --- | --- |
| `system` | The software itself, acting autonomously with **no principal attached** | The deployment's trust root (declared configuration, master keys) | Boot-time convergence of declared resources, migrations, internal schedulers |
| `platform` | Principals whose scope is the **whole deployment**, across every tenant | Grants in the management plane | Platform administrators, a config-declared operator service account |
| `tenant` | Principals scoped to **one customer organization** | Grants inside that organization | Org admins, org members managing org resources |
| `user` | An individual principal acting on **their own resources** | Self-service capability | Own profile, own API keys, own MFA enrollment |
| `external` | An **outside system of record**; its writes arrive by synchronization and are read-only from inside | The sync trust relationship | SCIM/directory-synced users, upstream-IdP-asserted attributes |

Two structural notes:

- `system` is the only rung with no principal. Everything from `platform`
  down acts as an authenticated principal under the product's capability
  model.
- `external` is the only rung whose authority lives outside the
  deployment entirely; it is the inbound mirror of `system` (both make
  rows read-only through the product's own surfaces, for opposite
  reasons).

A sibling authority sits beside the ladder rather than on it: the
**release** (resources defined by the software itself: default roles,
sentinel rows, reserved permissions). Built-in resources are documented
separately in [ADR#0289186035](../0289186035/README.md), including the
six modes in which built-in-ness applies and when a `builtin` value joins
a `managed_by`-style enum.

### The channel axis (how a write arrives)

Channels are orthogonal to actors and must never be confused with them:

| Channel | Meaning |
| --- | --- |
| `declaration` | The deployment declares desired state and `system` converges it. Transport-agnostic on purpose: env vars, values files, a declared public key, or federation trust are all declarations. Rejected names for this channel: `file` (Grafana's word; misleading, a declaration need not be a file), `config` (names an overloaded artifact, not the way a write arrives), `provisioning`/`provisioned` (collides with SCIM user provisioning, which is the `sync` channel) |
| `api` | The single governed management surface; every management client (console, CLI appliers, Terraform/Crossplane providers) is a client of it, never a backdoor |
| `sync` | Inbound replication from an `external` system of record |

Note the axis discipline this table enforces: `declaration` was rejected
as an authority value (it names how, not who), yet it is exactly right as
a channel name, where "how" is the axis being named.

### Reserved words (one meaning each)

- `system`: the software itself (ladder rung 1). Never "the whole product".
- `platform`: the deployment-wide management plane (rung 2). Never the
  product as a whole.
- `tenant`: the customer-organization boundary (rung 3). Preferred over
  `customer` (billing-flavored, ambiguous between rung 3 and "whoever
  bought the software") and over `organization` where a shorter word is
  viable.
- `user`: an individual end principal (rung 4). Never "any API caller".
- `principal`: any authenticated identity (human or service account)
  acting through governed surfaces; the union of rungs 2 to 4.
- `external`: rung 5 only.
- `operator` unqualified: **banned**. Say "operator service account" (a
  specific rung-2 automation principal) or "infrastructure operator" (the
  human controlling the deployment); the bare word has meant both and
  caused real confusion.
- `client`: OAuth/OIDC client only.
- `origin`: the web scheme-host-port concept only.
- `customer`: avoid in schemas; see `tenant`.
- `owner`/`owned_by`: resource-to-principal belonging (whose credential
  this is), never mutation authority.

### Naming rules derived from the taxonomy

1. Name fields for the axis they check: an authority field names actors,
   a transport field names channels, a scope field names boundaries.
   Never mix axes in one enum; an enum headed by an actor value takes
   actor values throughout.
2. A value must be true for every row in its class. Corollary: a class
   that is the union of several ladder rungs cannot be named after any
   single rung; it must be named by what the union shares.
3. Prefer enums over booleans for authority: new rungs and new external
   authorities arrive as new values, not as breaking reshapes.
4. Authority can transfer (GitOps adoption: `terraform import`,
   observe-and-adopt); history cannot. Fields that drive standing rules
   name authority (`managed_by`), never history (`provenance`, `source`,
   `origin`), and `provenance` stays reserved for genuinely historical
   records (audit, supply-chain attestation).

### Worked application: the mutation-authority field

The recurring pattern: rows converged by `system` from declared
configuration must be read-only through the API, alongside ordinary rows
governed by principals. The field is named **`managed_by`**, and the
taxonomy dictates its value structure:

- The converged class is exactly rung 1: value **`system`**.
- The other class is the union of rungs 2, 3, and 4 (platform, tenant,
  and user principals all mutate through the same governed surface). By
  rule 2 it cannot be called `platform`, `customer`, or `user`; the only
  honest names are what the union shares. The chosen value is
  **`principal`**: the actor category every member belongs to, and the
  taxonomy's own reserved word for exactly this union, so the enum reads
  directly off the ladder (`system | principal`, later joined by
  `external`) and stays on one axis end to end. `principal` is the
  official umbrella actor term at all three major clouds (AWS glossary,
  Azure "security principal", GCP's explicit members-to-principals
  rename).
- The rejected runner-up was **`api`**, the channel every member acts
  through. It carries the only exact-position precedent (Grafana
  Alerting's `provenance` enum uses the literal value `api` for this
  class), but that precedent does not transplant: Grafana's enum is
  channel-consistent (`none | api | file`, all channels), whereas this
  enum is actor-headed (`system`) and its known future value (`external`)
  is also an actor, so importing `api` would mix axes in exactly the way
  rule 1 of this ADR forbids. Repeated reader confusion ("managed by
  api reads as transport, not authority") was the empirical symptom of
  that axis mix.
- Future authorities join as values, per rule 3: directory-synced rows
  arrive as `managed_by: external` (or a finer-grained `scim`), not as a
  stretched reading of an existing value.
- Enforcement keys off the field at every layer: API writes rejected on
  `system` rows, converge logic writes them freely, database triggers
  make `managed_by` immutable and `system` rows undeletable.

### Precedent survey (2026-08-03)

| Product | Field | Values | Behavior |
| --- | --- | --- | --- |
| Okta (policies, network zones) | `system` | boolean | system rows undeletable; "created by a system or by a user" |
| Grafana Alerting | `provenance` | `none`, `api`, `file` | file-provisioned rows locked from the API surface |
| Grafana dashboards | `meta.provisioned` | boolean | provisioned dashboards read-only in UI |
| AWS KMS | `KeyManager` | `AWS`, `CUSTOMER` | AWS-managed keys not editable |
| AWS IAM | `Scope` | `AWS`, `Local` | AWS-managed policies copy-to-edit only |
| Azure RBAC | `type` | `BuiltInRole`, `CustomRole` | built-ins read-only |
| Azure managed identity | `identity.type` | `SystemAssigned`, `UserAssigned` | agent-pair naming of the same boundary |
| GCP | none | none | Google-managed vs customer-managed expressed structurally, no enum |
| Kubernetes | `app.kubernetes.io/managed-by` | free-form label | convention only, unenforced |
| Salesforce | `custom` | boolean | standard vs custom objects |
| WorkOS (roles) | `type` | `EnvironmentRole`, `OrganizationRole` | row-level system-vs-custom enum |
| WorkOS (directory sync) | none | none | structurally read-only: no mutation endpoints exist |
| Clerk | none (enterprise-connection presence) | connection `provider`/`protocol` | directory-synced attributes documented read-only |
| Zitadel | none | none | config-declared API principals exist but nothing is marked in the data model |
| Keycloak | none | none | built-ins protected by convention only |

The cloud providers name agent pairs (`AWS | CUSTOMER`, system-assigned vs
user-assigned), which works because provider and customer really are two
parties; in self-hosted software the installing organization plays both
roles (writes the configuration and calls the API), so the boundary must
be named by ladder rungs, not by legal parties. The identity products
validate the concept everywhere while fragmenting the shape (behavioral
locks, missing endpoints, config-time auth with no data marking); a single
inspectable, trigger-enforceable column is more general than any surveyed
implementation.

### Cloud-provider deep survey (AWS, GCP, Azure; primary sources, verified 2026-08-03)

A second research pass fetched official API references directly. Every
row below is verbatim-verified against the cited page; claims that could
not be confirmed verbatim were dropped or are marked as such.

#### AWS

| Where | Field | Exact values | Enforcement |
| --- | --- | --- | --- |
| KMS `KeyMetadata` | `KeyManager` | `AWS`, `CUSTOMER` | AWS-managed keys: no property changes, no policy changes, no deletion scheduling, rotation fixed |
| IAM `ListPolicies` | `Scope` | `All`, `AWS`, `Local` | "You cannot change the permissions defined in AWS managed policies" |
| IAM service-linked roles | path `/aws-service-role/` | structural | admins "can view, but not edit the permissions"; deletion only via the dedicated `DeleteServiceLinkedRole` API |
| EventBridge `DescribeRule` | `ManagedBy` | service principal name | "created by an AWS service on your behalf... displays the principal name of the AWS service that created the rule"; `DisableRule`, `EnableRule`, `PutRule`, `PutTargets`, `TagResource`, `UntagResource` are rejected with no override; only `DeleteRule`/`RemoveTargets` accept an explicit `Force` |
| Config `Source` | `Owner` | `AWS`, `CUSTOM_LAMBDA`, `CUSTOM_POLICY` | "Indicates whether AWS or the customer owns and manages the AWS Config rule" |
| Organizations `PolicySummary` | `AwsManaged` | boolean | "you can attach the policy... but you cannot edit it" |
| Secrets Manager | `OwningService` | service id string | "Managed secrets can only be created by the AWS service that manages them"; `DeleteSecret` raises `InvalidRequestException` |
| EC2 managed prefix lists | owner | `AWS` | "You cannot create, modify, share, or delete an AWS-managed prefix list" |
| Cross-service tags | reserved `aws:` key prefix | prefix | "you can't edit or delete the tag's key or value" |

Actor vocabulary: IAM's glossary makes **Principal** the umbrella term
("An AWS account root user, IAM user or an IAM role... Principals include
human users, workloads, federated principals, and assumed roles"), with
**service principal** (`{service}.amazonaws.com`) as the named form for
software actors.

#### GCP

| Where | Field / mechanism | Exact values | Enforcement |
| --- | --- | --- | --- |
| Compute `sslCertificates` | `type` | `MANAGED`, `SELF_MANAGED` ("Google-managed SSLCertificate." / "Certificate uploaded by user.") | `managed.status` output-only |
| Certificate Manager | union `managed` / `selfManaged` / `managedIdentity` | structural | managed cert `domains`, `dnsAuthorizations`, `issuanceConfig` marked "Immutable" |
| Storage/BigQuery encryption tiers | field presence (`kmsKeyName`, `customerEncryption`) | none | Google-managed is the absence of both; no enum anywhere |
| IAM predefined roles | `roles/*` namespace | structural | predefined/basic roles "always have the ETag `AA==`" |
| Cloud Logging | bucket ids `_Required`, `_Default` | structural | "You can't change the retention period of the `_Required` log bucket" |
| Org Policy | "managed constraints" vs custom | prose | custom constraints "are managed by your organization instead of by Google" |
| Dataproc | reserved `goog-dataproc-*` label keys | structural | auto-applied; overriding "not recommended" |
| App Engine | default service | none | "You can't delete the default app" |
| GKE Autopilot | "GKE Warden" admission | denial message | `GKE Warden authz [denied by managed-namespaces-limitation]` on GKE-managed namespaces |
| Literal `managedBy` field | searched Filestore, Cloud SQL, GKE NodePool schemas | absent | GCP has no literal `managedBy` API field; the `app.kubernetes.io/managed-by` label is an upstream Kubernetes convention, not a GCP schema field |

Actor vocabulary: GCP's IAM docs use **principals** as the umbrella and
say so explicitly ("In the past, principals were referred to as
_members_. Some APIs still use that term"); workload/workforce federation
identifies actors by `principal://` and `principalSet://` URIs. Note the
prose/schema divergence: the Policy binding field is still literally
`members`. Service agents are marked only by a naming convention
(`service-PROJECT_NUMBER@gcp-sa-*`), with no schema field, and the docs
warn their role permissions "can change without notice".

#### Azure / Entra

| Where | Property | Exact values | Enforcement |
| --- | --- | --- | --- |
| ARM resources and resource groups | `managedBy` | resource id | "ID of the resource that manages this resource"; enforcement is delivered separately via deny assignments, not by the field itself |
| Deny assignments | `isSystemProtected` | boolean | "You can't directly create your own deny assignments. Deny assignments are created and managed by Azure"; "created by Azure and cannot be edited or deleted"; currently all deny assignments are system protected |
| Azure Policy definitions | `policyType` | `NotSpecified`, `BuiltIn`, `Custom`, `Static` | "The policyType property can't be set" (server-assigned); `Static` denotes Microsoft ownership |
| RBAC role definitions | `type`/`roleType` | `BuiltInRole`, `CustomRole` | built-ins copied, not edited |
| Graph `servicePrincipal` | `servicePrincipalType` | `Application`, `ManagedIdentity`, `Legacy`, `ServiceIdentity`, `SocialIdp` | `ManagedIdentity`: "can be granted access and permissions, but can't be updated or modified directly" |
| ARM `identity` | `type` | `SystemAssigned`, `UserAssigned`, `SystemAssigned, UserAssigned`, `None` | system-assigned lifecycle tied to the resource; "Azure automatically deletes the service principal for you" |
| Graph `user` | `onPremisesSyncEnabled` + synced attributes | boolean | "the source of authority for this set of properties is the on-premises and is read-only" |
| Entra hybrid identity | **Source of Authority (SOA)** | concept + per-object conversion | converting Group/User SOA to cloud makes the object cloud-editable: a first-party precedent for authority *transfer* |
| Graph `unifiedRoleDefinition` | `isBuiltIn` | boolean | "Read-only"; cascades read-only onto description, permissions, scopes when true |
| Graph `user` | `creationType` | `null`, `Invitation`, `LocalAccount`, `EmailVerified`, `SelfServiceSignUp` | "Read-only": a pure provenance field, coexisting with SOA (authority), proving the two axes are distinct in the wild |
| AKS | node resource group lockdown | `ReadOnly`, `Unrestricted` | "a deny assignment blocks direct updates" under `ReadOnly` |
| Event Grid | `systemTopics` resource type | structural | "Only Azure services can publish events to system topics" |

Actor vocabulary: "A **security principal** is an object that represents
a user, group, service principal, or managed identity that is requesting
access" (RBAC overview); **tenant** is Entra's word for the directory
boundary. Honesty note: `systemData.createdByType` enumerates `User`,
`Application`, `ManagedIdentity`, `Key` and has no `System` value despite
the field's name; Azure carries the system-owned concept in booleans
(`isSystemProtected`, `isBuiltIn`) and value prefixes (`SystemAssigned`),
never as a bare `system` enum token.

#### What the deep survey establishes

1. **An authority-named enum on the resource is a first-class industry
   pattern**: AWS `KeyManager`/`Source.Owner`/`AwsManaged`, Azure
   `policyType`/`roleType`/`managedBy`, GCP `sslCertificates.type`. GCP's
   own field-presence approach for encryption tiers is the
   counter-example that shows why the explicit enum is the cleaner shape.
2. **Enforcement is verb-level, not decorative**, in every mature
   implementation: AWS rejects specific mutation calls outright (some
   with explicit `Force` escape hatches, identity resources with a
   dedicated deletion API), Azure enforces via system-protected deny
   assignments. This matches pairing the field with API-layer rejections
   and database triggers rather than treating it as informational.
3. **The literal token `system` is this taxonomy's own choice**: AWS's
   token is `AWS`, GCP's is `MANAGED`, Azure's are `BuiltIn`/`Static`/
   `SystemAssigned`/`isSystemProtected`. Each provider names itself; a
   self-hosted product has no vendor name to use, and `system` is the
   generic form of what `SystemAssigned`, `isSystemProtected`, and
   "system topics" already gesture at.
4. **`principal` is the one actor word all three clouds share** as their
   official umbrella for authenticated identities (AWS glossary, Azure
   "security principal", GCP's explicit members-to-principals rename).
   This is the strongest evidence in the whole survey for the ladder's
   union term, and it strengthens `principal` as a viable api-side value
   relative to where the earlier survey left it.
5. **Azure's Source of Authority is the flagship precedent for the
   `external` rung and for rule 4**: externally-mastered objects are
   read-only locally, the concept is named for *authority* (not
   provenance), and Microsoft ships authority *transfer* (SOA conversion)
   as a supported operation, while keeping a separate read-only
   `creationType` field for actual provenance.

## Links

- [AWS EventBridge `ManagedBy` (DescribeRule)](https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_DescribeRule.html)
- [AWS Config `Source.Owner`](https://docs.aws.amazon.com/config/latest/APIReference/API_Source.html)
- [AWS Organizations `PolicySummary.AwsManaged`](https://docs.aws.amazon.com/organizations/latest/APIReference/API_PolicySummary.html)
- [AWS Secrets Manager managed secrets (`OwningService`)](https://docs.aws.amazon.com/secretsmanager/latest/userguide/service-linked-secrets.html)
- [AWS IAM terms (Principal umbrella)](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction_identity-management.html)
- [Azure ARM `managedBy`](https://learn.microsoft.com/en-us/rest/api/resources/resource-groups/get?view=rest-resources-2021-04-01)
- [Azure deny assignments (`isSystemProtected`)](https://learn.microsoft.com/en-us/azure/role-based-access-control/deny-assignments)
- [Azure Policy `policyType`](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/definition-structure-basics)
- [Entra Source of Authority overview](https://learn.microsoft.com/en-us/entra/identity/hybrid/concept-source-of-authority-overview)
- [Azure RBAC overview (security principal)](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)
- [GCP `sslCertificates.type` (MANAGED | SELF_MANAGED)](https://cloud.google.com/compute/docs/reference/rest/v1/sslCertificates)
- [GCP IAM overview (members renamed to principals)](https://docs.cloud.google.com/iam/docs/overview)
- [GCP service agents](https://docs.cloud.google.com/iam/docs/service-agents)
- [GKE Autopilot managed-namespace enforcement](https://docs.cloud.google.com/kubernetes-engine/security/autopilot-cluster-policies-standard)
- [Okta policy API (`system` attribute)](https://developer.okta.com/docs/api/openapi/okta-management/management/tags/policy/)
- [Grafana alerting provisioning (`provenance`)](https://grafana.com/docs/grafana/latest/alerting/set-up/provision-alerting-resources/)
- [AWS KMS `KeyManager`](https://docs.aws.amazon.com/kms/latest/APIReference/API_KeyMetadata.html)
- [AWS IAM `ListPolicies` `Scope`](https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListPolicies.html)
- [Azure managed identity types](https://learn.microsoft.com/en-us/azure/app-service/overview-managed-identity)
- [Kubernetes recommended labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/)
- [WorkOS roles (`EnvironmentRole | OrganizationRole`)](https://workos.com/docs/reference/roles/role)
- [Clerk directory sync attribute locking](https://clerk.com/docs/guides/configure/auth-strategies/enterprise-connections/directory-sync)
- [Zitadel system API users](https://zitadel.com/docs/guides/integrate/zitadel-apis/access-zitadel-system-api)
