---
id: '9870790320'
title: Mutability Is Contract or Input, Never Stored Output
state: Approved
created: 2026-08-03
tags: [schema, api-design, mutability, naming, taxonomy]
category: Platform
---

# Mutability Is Contract or Input, Never Stored Output

## Context

Once a mutation-authority field exists
([ADR#8779742261](../8779742261/README.md)), the same design itch recurs:
"should we also add `immutable: true`? or `deletable: false`?" The itch is
understandable, the answer is no, and the major API platforms have a
per-se convention that says exactly where each kind of mutability
knowledge belongs. This ADR records that convention so the question stops
being re-asked per product.

The core confusion is between three different kinds of fact that all get
casually called "immutability":

1. A **field-level rule**: "this property can never change after
   creation" (true for every row).
2. A **row-level derived capability**: "this particular row cannot be
   deleted right now" (a conclusion computed from authority, invariants,
   and flags).
3. A **row-level independent input**: "the owner asked for a safety latch
   on this row" (a fact someone set, derivable from nothing).

Storing kind 1 or kind 2 as a column creates a second source of truth for
a rule that already has one, makes contradictory states representable
(`managed_by: system, immutable: false`?), and flattens many causes with
many remedies into a single unexplained bit.

## Resolution

Chosen option: "declare field rules in the API contract, compute derived
capabilities into responses, store only independent inputs", because this
is verifiably what the platform vendors themselves do, and it is the only
arrangement in which no stored value can drift from the rule it
describes.

### 1. Field-level mutability is API-contract metadata

Google's public API rulebook (the AIP system, google.aip.dev) defines
`google.api.field_behavior` annotations declared on the field in the
contract, not stored in any row: `IMMUTABLE` ("A field on a resource
cannot be changed after its creation"), `OUTPUT_ONLY` ("The field is
provided in responses, but... including the field in a message in a
request does nothing"), `INPUT_ONLY`, `REQUIRED`, `IDENTIFIER` (AIP-203).
Azure's equivalent is the `x-ms-mutability` OpenAPI extension, an array
of `create` | `read` | `update` on the property definition, e.g.
`"x-ms-mutability": ["create", "read"]` for a set-once property.

Applied to a mutation-authority field: `managed_by` is contract-level
`IMMUTABLE` (its value is assigned at birth and never changes through the
API), declared in the OpenAPI/schema definition, enforced by the API
layer, and backstopped by database triggers
([ADR#8779742261](../8779742261/README.md)). Nothing about that requires
or tolerates a per-row `immutable` column.

### 2. Row-level derived capabilities are computed response fields

"Can this row be deleted?" is a question whose answer is derived at
request time from the authority field, invariants (e.g. a last-admin
guard), protection flags, and referential integrity. The precedented
shape is a computed, read-only field in the API response (the
`viewerCanDelete` pattern; in AIP terms, an `OUTPUT_ONLY` field), so a
client can gray out a button without the server ever persisting the
conclusion. A stored `deletable` column is this pattern done wrong: it
conflates causes (system-managed? protected? blocked by an invariant?)
and goes stale the moment any input changes.

### 3. Row-level independent inputs are stored flags

The only mutability-adjacent facts that belong in storage are the ones
that are inputs, set by an authority and derivable from nothing:

- **Owner safety latches**: GCP's `deletionProtectionEnabled` (verified
  on Filestore instances), AWS termination protection. The owner sets it,
  the owner clears it, deletion checks read it.
- **Per-object reconciliation opt-outs**: Kubernetes'
  `rbac.authorization.k8s.io/autoupdate: "false"` annotation on default
  RBAC objects ([ADR#0289186035](../0289186035/README.md), mode 3).

The test for any proposed flag: **is it an independent degree of freedom
someone sets, or is it derivable from existing fields?** Store inputs;
compute outputs; never store an output next to its inputs.

### Which vendor to follow, per se

Google is the only major cloud that publishes a complete, versioned,
public rule system for these questions (the AIPs: resource names in
AIP-122, field behavior in AIP-203), and its rules are the ones this ADR
adopts where they exist. Azure's REST guidelines and `x-ms-mutability`
corroborate the same split (contract metadata, not row data) and serve as
the second reference. AWS exhibits the same patterns in its APIs
(verb-level rejections for system-managed resources, attribution fields,
stored protection toggles) but publishes no equivalent public rulebook,
so it serves as pattern evidence rather than a rule source.

### Summary decision table

| Fact | Where it lives | Precedent |
| --- | --- | --- |
| "This field never changes after create" | API contract annotation (`IMMUTABLE` / `x-ms-mutability`), enforced at the write path, DB triggers as backstop | AIP-203, Azure autorest |
| "This row is owned by X" | The stored authority enum (`managed_by`) | ADR#8779742261 |
| "Can the caller delete/edit this row right now" | Computed `OUTPUT_ONLY` response field | `viewerCan*` pattern, AIP-203 |
| "The owner asked for a deletion guard" | Stored boolean input flag | GCP `deletionProtectionEnabled`, AWS termination protection |
| "Skip reconciling this built-in object" | Stored per-object opt-out marker | Kubernetes `autoupdate` annotation |
| "This row is read-only" as a stored column | Nowhere, ever | The anti-pattern this ADR exists to reject |

## Links

- [ADR#8779742261: Actor and Authority Taxonomy](../8779742261/README.md)
- [ADR#0289186035: Built-In Resources and Their Modes](../0289186035/README.md)
- [AIP-203: Field behavior documentation](https://google.aip.dev/203)
- [AIP-122: Resource names](https://google.aip.dev/122)
- [Azure autorest `x-ms-mutability`](https://github.com/Azure/autorest/blob/main/docs/extensions/readme.md)
- [Kubernetes default RBAC auto-reconciliation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
