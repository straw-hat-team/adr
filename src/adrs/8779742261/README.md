---
id: '8779742261'
title: Actor and Authority Taxonomy for Managed Systems
state: Reviewing
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

### The channel axis (how a write arrives)

Channels are orthogonal to actors and must never be confused with them:

| Channel | Meaning |
| --- | --- |
| `config` | Declared deployment configuration, converged by `system` |
| `api` | The single governed management surface; every management client (console, CLI appliers, Terraform/Crossplane providers) is a client of it, never a backdoor |
| `sync` | Inbound replication from an `external` system of record |

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

1. Name fields for the axis they check: an authority field names actors
   (or the actor-channel shorthand below), a transport field names
   channels, a scope field names boundaries. Never mix axes in one enum
   without noticing you are doing it.
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
  honest names are what the union shares: **`api`** (the channel every
  member acts through, per the single-management-surface rule) or
  **`principal`** (the actor category every member belongs to). Industry
  precedent exists only for the channel word (Grafana Alerting's
  `provenance` enum uses the literal value `api` for this class; Okta
  marks the converged class with `system`); `principal` is the
  grammatically agent-shaped alternative with no precedent.
- Future authorities join as values, per rule 3: directory-synced rows
  arrive as `managed_by: external` (or a finer-grained `scim`), not as a
  stretched reading of an existing value.
- Enforcement keys off the field at every layer: API writes rejected on
  `system` rows, converge logic writes them freely, database triggers
  make `managed_by` immutable and `system` rows undeletable.

Open point while this ADR is in review: the api-side value, `api`
(precedented channel word) versus `principal` (unprecedented actor word).
The taxonomy proves these are the only two candidates; it does not pick
between them.

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

## Links

- [Okta policy API (`system` attribute)](https://developer.okta.com/docs/api/openapi/okta-management/management/tags/policy/)
- [Grafana alerting provisioning (`provenance`)](https://grafana.com/docs/grafana/latest/alerting/set-up/provision-alerting-resources/)
- [AWS KMS `KeyManager`](https://docs.aws.amazon.com/kms/latest/APIReference/API_KeyMetadata.html)
- [AWS IAM `ListPolicies` `Scope`](https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListPolicies.html)
- [Azure managed identity types](https://learn.microsoft.com/en-us/azure/app-service/overview-managed-identity)
- [Kubernetes recommended labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/)
- [WorkOS roles (`EnvironmentRole | OrganizationRole`)](https://workos.com/docs/reference/roles/role)
- [Clerk directory sync attribute locking](https://clerk.com/docs/guides/configure/auth-strategies/enterprise-connections/directory-sync)
- [Zitadel system API users](https://zitadel.com/docs/guides/integrate/zitadel-apis/access-zitadel-system-api)
