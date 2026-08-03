---
id: '8779742261'
title: Naming the Mutation-Authority Field on System-Converged Resources
state: Reviewing
created: 2026-08-03
tags: [naming, schema, authorization, gitops, identity]
category: Platform
---

# Naming the Mutation-Authority Field on System-Converged Resources

## Context

A recurring design in our systems: some rows of a resource table are
converged by the server itself from declared deployment configuration (for
example, a GitOps operator service account and its API keys, created and
kept in sync on every boot), while the rest are created and mutated by API
callers. The converged rows must be read-only through the API: their single
source of truth is the declaration, and every rule that touches them asks
exactly one question:

> **Which authority is allowed to mutate this row?**

The field answering that question needs a name and values. A first attempt
shipped as `origin` with values `config | api` and did not survive contact:
in an identity product, `origin` is saturated vocabulary for the
scheme-host-port web concept (CORS, WebAuthn, trusted origins), and
`config` names where a row came from rather than anything the system ever
checks. The renaming journey (`origin`, `declaration`, `deployment_config`,
`provenance`, `managed_by`) showed the decision deserves a record: what
criteria must the name satisfy, and why each candidate lives or dies.

### Decision criteria

1. **Name the intent, not a mechanism, not history, not a derived
   property.** The intent is the standing mutation authority. This rules
   out provenance-flavored names (history), mechanism names that go stale
   when the declaration transport changes (env-declared hashes today,
   declared public keys or federation trust later), and derived-property
   names like `read_only` or `immutable` (the row is mutable, just not by
   the API; "immutable for whom" is exactly the ambiguity to avoid).
2. **Every value must be true for every row in its class.** The
   API-governed class contains rows created by humans, by service
   accounts, and by infrastructure-as-code controllers; any value naming a
   specific actor is false for part of the class.
3. **Enum, not boolean.** A third authority is plausible (SCIM- or
   directory-synced users, federation-provisioned principals); an enum
   absorbs it as a new value, a boolean forces a breaking reshape.
4. **Survive authority transfer.** Adoption is a bread-and-butter GitOps
   move (`terraform import`, Crossplane observe-and-adopt): a row created
   through the API comes under configuration management later. A field
   named for history cannot record that honestly; a field named for
   authority can.
5. **No collisions with the schema's loaded vocabulary.** In an identity
   product this reserves `origin` (web origin), `owner`/`owned_by` (which
   principal a credential belongs to), `client` (OAuth), `user` (the users
   table), `tenant`, and `operator` (both the converged service account
   itself and the human running the deployment).

### Precedent survey (2026-08-03)

| Product | Field | Values | Behavior |
| --- | --- | --- | --- |
| Okta (policies, network zones) | `system` | boolean | system rows undeletable; "created by a system or by a user" |
| Grafana Alerting | `provenance` | `none`, `api`, `file` | file-provisioned rows locked from the API surface; escape via `X-Disable-Provenance` header |
| Grafana dashboards | `meta.provisioned` | boolean | provisioned dashboards read-only in UI |
| AWS KMS | `KeyManager` | `AWS`, `CUSTOMER` | AWS-managed keys not editable |
| AWS IAM | `Scope` | `AWS`, `Local` | AWS-managed policies copy-to-edit only |
| Azure RBAC | `type` | `BuiltInRole`, `CustomRole` | built-ins read-only |
| Azure managed identity | `identity.type` | `SystemAssigned`, `UserAssigned` | agent-pair naming of the same boundary |
| GCP | none | none | Google-managed vs customer-managed expressed structurally (field presence) and by naming conventions, no enum |
| Kubernetes | `app.kubernetes.io/managed-by` | free-form label | convention only, unenforced |
| Salesforce | `custom` | boolean | standard vs custom objects |
| WorkOS (roles) | `type` | `EnvironmentRole`, `OrganizationRole` | row-level system-vs-custom enum; default environment role undeletable while default |
| WorkOS (directory sync) | none | none | structurally read-only: no mutation endpoints exist; writes flow only from the source directory |
| Clerk | none (presence of enterprise-connection record) | connection `provider`/`protocol` | directory-synced attributes documented read-only; system permissions marked only by a key-prefix convention |
| Zitadel | none | none | runtime config declares config-only API principals (self-signed JWT against a declared public key) but marks nothing in the data model; bootstrap-created rows indistinguishable afterward |
| Keycloak | none | none | built-ins protected by convention only |

Two shapes dominate: a boolean `system` flag (Okta, Salesforce, Grafana
dashboards) and a two-value ownership enum (AWS, Azure, Grafana Alerting,
WorkOS roles). The cloud providers name agent pairs (`AWS | CUSTOMER`,
system-assigned vs user-assigned), which works because a cloud provider
and its customer really are two parties; self-hosted software has no such
split, because the installing organization writes the deployment
configuration and calls the API. Keycloak's nothing-at-all is the failure
mode the field exists to avoid; Kubernetes' free-form label is the wrong
shape for a closed two-class rule; the adjacent identity products (Clerk,
WorkOS, Zitadel) validate the concept everywhere while fragmenting the
shape (behavioral locks, missing endpoints, config-time auth with no data
marking), so a single inspectable, trigger-enforceable column is more
general than any surveyed implementation.

## Resolution

Chosen option: **`managed_by`, an enum with values `system | api`**,
because it is the only candidate that satisfies every criterion: it names
the standing authority rather than a mechanism or history (criterion 1),
its values are true for every row in their class (criterion 2), the enum
absorbs future authorities such as `scim` or `federation` (criterion 3),
authority transfer on adoption is an honest update rather than a rewritten
history (criterion 4), and neither word collides with the schema's loaded
vocabulary (criterion 5).

- **`system`** names the authority that converges declared rows: the
  server acting on its own trust root, whatever the declaration mechanism
  is. Okta marks exactly this class with `system`.
- **`api`** names the only thing true of every row in the other class: it
  is governed through the management API's capability model, by whichever
  principal holds capability. It is a channel word rather than an agent
  word, a deliberate asymmetry: the class has no single agent (criterion
  2). It leans on the platform rule that the management API is the single
  management surface with no backdoors (every management client, console,
  CLI applier, or IaC provider, is a client of that surface), so there is
  no third write path for the value to be wrong about. Grafana Alerting
  uses the literal value `api` for the same class.
- Enforcement follows the field at every layer: the API rejects writes on
  `system` rows, the converge logic writes them freely, and database
  triggers make `managed_by` immutable and `system` rows undeletable, so
  ownership can be neither promoted nor laundered.

Rejected alternatives:

| Candidate | Kills it |
| --- | --- |
| `origin: config \| api` | `origin` collides with web-origin vocabulary; `config` names provenance, not authority (criteria 1, 5) |
| `source`, `provenance` | Name history, not the standing rule; break on adoption (criterion 4): a hand-created row brought under configuration management keeps its provenance but changes its authority. Grafana's own escape header shows `provenance` behaving as misnamed authority. `provenance` is also vocabulary audit and supply-chain features (SLSA) want with its literal meaning |
| `declaration`, `deployment_config` as the system-side value | Name today's mechanism; go stale when the declaration transport changes (criterion 1) |
| `operator` as the system-side value | Self-referential: the operator service account is the row being managed, and rows the operator creates through the API belong to the other class (criterion 5) |
| boolean `system` flag | Cannot grow a third authority without a breaking reshape (criterion 3) |
| `platform \| customer` (the cloud-provider agent pair) | Right split read as roles (infrastructure-operator hat vs product-user hat), unusable words: `platform` reads as the product's platform/management plane, so rows platform admins create via the API would carry the opposite value; `customer` means tenant organizations in a multi-tenant identity product (criteria 2, 5) |
| `user`, `customer`, `manual`, `client` as the api-side value | Each is false for part of the class (IaC-created rows are not `user`/`manual`; platform-scoped rows are not `customer`) or collides (`client` = OAuth client, `user` = users table) (criteria 2, 5) |
| `management_api` as the api-side value | Semantically identical to `api`, strictly more verbose; acceptable fallback if the bare `api` proves confusing in practice |
| `principal` as the api-side value | The one coherent agent word ("managed by a principal through the management surface"); grammatically reads like a dangling reference to a specific principal, and has no precedent anywhere surveyed; kept as the named alternative if `api` proves confusing in practice |
| `owned_by` / `owner` as the column | Credential ownership already means something else on the same tables; a second ownership recreates the `origin` problem (criterion 5) |

On reserving `managed_by` for a future domain concept: considered and
rejected as a reason to pick a different name. Business-level ownership
axes already have names (credential owner, team placement), a
"managed by organization X" feature would want a reference column rather
than a closed enum, and surveyed identity products name that concept
differently anyway (Entra `onPremisesSyncEnabled`/`creationType`, Okta
`credentials.provider`). If a synced-user feature lands later, it is the
same mutation-authority concept and joins this field as a new value
(`scim`, `federation`) rather than colliding with it.

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
