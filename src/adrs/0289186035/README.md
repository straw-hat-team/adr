---
id: '0289186035'
title: Built-In Resources and Their Modes
state: Approved
created: 2026-08-03
tags: [naming, taxonomy, schema, built-in, defaults, lifecycle]
category: Platform
---

# Built-In Resources and Their Modes

## Context

[ADR#8779742261](../8779742261/README.md) establishes the actor ladder and
the mutation-authority field for rows converged from deployment
configuration. A sibling concept keeps appearing next to it and is easy to
conflate with it: resources defined by the **software release itself**.
Default roles, reserved permissions, sentinel rows, standard policies,
template objects: present in every installation, identical everywhere, and
changed only by upgrading the software.

Built-in and system-managed share a surface symptom (the API refuses some
or all mutations) but differ in every property that matters:

| | Built-in | System-managed |
| --- | --- | --- |
| Defined by | the release (code, migrations) | this deployment's configuration |
| Varies per installation | no | yes |
| Changes when | the software upgrades | the operator changes configuration |
| Example | a reserved `admin` role, a sentinel platform row | a config-declared operator service account |

Conflating them produces wrong designs in both directions: treating a
built-in as system-managed invites operators to "configure" something the
release owns; treating a system-managed row as built-in hides it from the
deployment's declared state. And "built-in" alone is underspecified: the
industry applies built-in-ness in several distinct modes, from fully
immutable to merely seeded, so declaring a resource built-in without
declaring its mode leaves the enforcement undefined.

## Resolution

Chosen option: "built-in is the release's authority, documented per
resource as one of six modes", because the verified industry survey shows
built-in-ness is not one behavior but a spectrum, and every ambiguity
encountered came from leaving the mode implicit.

### Definition and place in the taxonomy

A **built-in resource** is one whose defining authority is the software
release: its shape and existence ship with the code, and its legitimate
mutation vehicle is an upgrade. In the actor ladder, the release acts
through the `system` rung's machinery (migrations, boot reconciliation),
but the authority is distinct from deployment configuration: a
`managed_by`-style field, where built-ins are rows at all, marks them with
their own value (`builtin`) rather than overloading `system`.

### The six modes (verified precedents, 2026-08-03)

| Mode | Behavior | Verified precedents |
| --- | --- | --- |
| 1. Immutable | Exists in every installation; nothing about it can change through any surface | PostgreSQL `template0` ("should never be changed after the database cluster has been initialized", "normally marked `datallowconn = false` to prevent its modification"); GCP predefined roles (fixed `ETag AA==`); Azure Policy `policyType: Static`; AWS managed policies ("You cannot change the permissions defined in AWS managed policies"); Grafana fixed roles ("called 'fixed' because you cannot change or delete fixed roles") |
| 2. Editable-except-core | The row is built-in and undeletable, most properties open, specific properties locked | Okta default policies ("Default policies are required, and you can't delete them"; "Default policies always have one default rule that you can't delete... always the last rule in the priority order"); the claim that specific default-rule sub-properties are locked is plausible but UNVERIFIED against a primary source |
| 3. Reconciled-on-boot | Edits are allowed but the platform converges built-ins back to the release's definition on restart, with an explicit per-object opt-out | Kubernetes default RBAC: "The API server reconciles default ClusterRole and ClusterRoleBinding objects on every restart"; opt-out via the `rbac.authorization.k8s.io/autoupdate` annotation set to `false`; "Many of these are `system:` prefixed, which indicates that the resource is directly managed by the cluster control plane"; "Modifications to default `system:` ClusterRoles... are overwritten when the API server restarts" |
| 4. Delete-protected-but-configurable | Cannot be deleted, freely reconfigurable, never reconciled back | Grafana basic roles ("You can use RBAC to modify the permissions associated with any basic role"; "You can't delete basic roles"); WorkOS default environment role (undeletable while it holds default status; reassign first) |
| 5. Seeded-but-unprotected | The release provides defaults copied at creation time; the copies are wholly owned by their owner afterward | GitHub default labels ("anyone with write access to the repository can edit or delete the labels in that repository later. Adding, editing, or deleting a default label does not add, edit, or delete the label from existing repositories"); PostgreSQL `template1` ("If you add objects to `template1`, these objects will be copied into subsequently created user databases") |
| 6. Code-constant | The built-in is not data at all: it lives in code and never materializes as a row | Reserved role/permission keys defined in source; Clerk's `org:sys_*` permission key convention |

### Selection guidance

1. **Prefer mode 6 (code constant) whenever the built-in has no
   per-installation state.** A row that never varies is a liability: it
   must be seeded, protected, and migrated. Reserved role keys and
   capability sets belong in code.
2. **Use mode 1 (immutable row) when relational integrity needs an anchor
   row**: foreign keys, audit chains, or sentinel addressing. Pair the row
   with database-level protection (a type/kind column plus delete and
   immutability triggers), since a sentinel protected only by code
   discipline is not protected.
3. **Use mode 3 (reconciled) when built-ins must be operator-tunable yet
   upgrade-refreshable**, and make the opt-out explicit and per-object,
   as Kubernetes does with `autoupdate`; silent reconciliation over
   operator edits is the K8s-documented footgun ("modifications... are
   overwritten when the API server restarts").
4. **Use mode 5 (seeded) when the default is a starting point, not a
   contract**: after copying, the rows are ordinary user data and take
   the normal authority value, not `builtin`.
5. **Declare the mode in the resource's documentation and, for modes 1
   through 4, enforce it in the API**, following the mutation-authority
   ADR's enforcement rule: the marker must be checked and rejected at the
   write path, not merely displayed.
6. **Never let "default" imply "protected"**: GitHub's default labels and
   Okta's default rules show the industry uses "default" for both
   protected and unprotected things; the mode, not the adjective, defines
   the behavior.

### Relation to the mutation-authority field

Where built-in resources are rows and coexist with system-managed and
API-managed rows on the same table, they take a distinct `managed_by`
value (`builtin`), because their authority (the release) is neither the
deployment configuration nor any principal. Where the built-in is
enforced through a dedicated type column instead (a sentinel row on a
table that otherwise has no authority field), that column plus triggers
is the equivalent mechanism, and adding a redundant authority field is
unnecessary. Mode 5 rows are not built-in after copying and take ordinary
authority values.

## Links

- [ADR#8779742261: Actor and Authority Taxonomy](../8779742261/README.md)
- [Kubernetes default roles and auto-reconciliation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [PostgreSQL template databases](https://www.postgresql.org/docs/current/manage-ag-templatedbs.html)
- [Grafana RBAC: basic and fixed roles](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/)
- [Okta policy concepts (default policies)](https://developer.okta.com/docs/concepts/policies/)
- [GitHub default labels](https://docs.github.com/en/organizations/managing-organization-settings/managing-default-labels-for-repositories-in-your-organization)
- [GCP predefined roles](https://docs.cloud.google.com/iam/docs/roles-overview)
- [Azure Policy `policyType`](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/definition-structure-basics)
