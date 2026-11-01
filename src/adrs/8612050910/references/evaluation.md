# Evaluation approaches and resolved questions

Research snapshot: 2026-11-01. This material supports the Draft [ADR#8612050910](../README.md). Proposed semantics are
distinct from verified standard or product capabilities. See the [reading guide](./README.md).

## Research alternatives

The [decision record](./decisions.md) selects the current profile direction. These dated alternatives remain preserved
as supporting research, not unanswered current design choices.

### Practical default: one contract, optional subject generation

Use **AsyncAPI as the leading contract-format candidate**, with a defined profile for NATS subject-token constraints,
filter construction and required delivery/topology associations. Generate Rust and TypeScript subject APIs and
documentation from the same semantics. Keep payload definitions linked or bundled without inventing a replacement wire
format.

Choose one authority for declared topology. Where native configuration already owns a resource, reference or import that
configuration into the portable contract artifact. Where the contract is to own the resource, generate native
configuration from it. Do not independently edit equivalent copies. Physical deployment and live observations remain
optional linked views.

The implementation cost is maintaining the semantic profile and delivering subject-generation parity across
Rust/TypeScript. The Codegen Project is a concrete TypeScript evaluation lead; the Rust community template needs
practical validation. A small custom subject generator may be appropriate if neither preserves the required semantics,
but implementation has not been selected or authorized.

Choose EventCatalog, Backstage, Bump.sh or static AsyncAPI HTML only after the contract and generation behavior are
clear. None is required for the document itself to serve as the reference.

### Registry-oriented alternative: xRegistry as the discovery layer

Use **xRegistry for endpoints, messages and schema versions** when clients or tools must discover standardized metadata
dynamically. AsyncAPI can remain the application-interface description. Decide which system authors each kind of fact
and generate projections instead of editing equivalent records independently.

The xRegistry file representation makes a local evaluation possible without committing to a hosted registry service. The
tradeoffs are release-candidate stability, a smaller ecosystem and unproven NATS transport generation. The conceptual
fit is strong enough to evaluate, but it should not be presented as an already-complete JetStream documentation system.

### Operations-oriented alternative: topology visibility first

Evaluate **Synadia Insights/Control Plane** when the pain is understanding deployed accounts, streams, consumers,
connections and historical changes. **Qaze** is a direct desktop topology candidate; **Hyerix** and **NATS Desktop** are
newer alternatives to evaluate. **NUI** is useful for resource and message inspection.

Keep API contracts alongside these operational views. A runtime graph can explain the deployment we can currently
observe, but it cannot supply missing business meaning or inactive interfaces.

## Proposed documentation model

This is a discussion proposal, not a new specification implementation.

### Service/API

- **Identity and relationships to retain:** Stable application identity, version, domain, owner, lifecycle and contract
  reference.

### Subject family

- **Identity and relationships to retain:** Publish-address template, subscription filter where applicable, token
  meanings, account scope and allowed message types.

### Message

- **Identity and relationships to retain:** Stable message identity/version, event/command/query meaning, payload schema
  reference, content type, envelope, examples and compatibility policy.

### Operation

- **Identity and relationships to retain:** Send/receive role, request/reply association, queue group if used,
  error/timeout semantics and relevant service endpoint.

### Stream

- **Identity and relationships to retain:** NATS system/account/JetStream-domain identity, stream name, captured
  subjects, configuration reference, mirrors/sources and transforms.

### Consumer

- **Identity and relationships to retain:** Parent stream, durable or ephemeral identity, filters, pull/push
  configuration, delivery/acknowledgment/redelivery semantics and owning application.

### Account boundary

- **Identity and relationships to retain:** Account identity, import/export and mapping relationships, permission
  references and owning team.

### Deployment

- **Identity and relationships to retain:** Environment, NATS system, server/cluster/region identity,
  routes/gateways/leaves and placement.

### Observation

- **Identity and relationships to retain:** Source interface, collection time, accessible scope, version and
  success/partial/failure status.

A subject string alone is an insufficient global identifier: the same address may occur in different accounts, systems
and environments. A queue group and a durable consumer also need separate identities because they represent different
mechanisms. These distinctions should survive every catalog export and diagram projection.

### Keeping the documentation current

The proposed workflow is:

1. Authors maintain application contracts and semantic descriptions alongside service changes.
2. Payload schemas remain in their existing authoritative source or selected registry.
3. Configuration tooling supplies stream, consumer and deployment intent.
4. Generation joins those facts through stable references and produces the catalog and diagrams.
5. Read-only collectors add timestamped deployment snapshots, without overwriting intended contracts.
6. CI validates contracts, required metadata, reference integrity and meaningful compatibility changes.
7. Drift checks compare intended and observed facts, reporting incomplete access separately from actual differences.

If an AsyncAPI extension is needed, document it as an organization-specific profile and validate it explicitly. Prefer
references to authoritative native configuration over copying every stream setting into an extension that generic
renderers ignore. Do not call a custom extension an official NATS binding.

## Evaluation scenario before selecting a stack

An eventual evaluation should use a representative system rather than a single happy-path publication:

### Core event with a parameterized subject and wildcard receiver

- **What it should reveal:** Whether contracts distinguish possible publish addresses from subscription interest.

### Request/reply API with a dynamic reply inbox and queue group

- **What it should reveal:** Whether request and response semantics survive generation and rendering.

### JetStream stream with a durable pull consumer

- **What it should reveal:** Whether persistence, consumer ownership, filters and acknowledgment behavior are visible.

### Multiple message types or schema versions on one subject family

- **What it should reveal:** Whether schema-to-message-to-subject associations remain explicit.

### Account import/export with subject mapping

- **What it should reveal:** Whether identities and boundary crossings remain understandable.

### Mirror/source and stream subject transform

- **What it should reveal:** Whether data propagation is represented beyond a simple producer-to-consumer arrow.

### Leaf node or multi-cluster deployment

- **What it should reveal:** Whether physical links stay distinct from business dependencies.

### Declared but inactive service, plus incomplete collector permissions

- **What it should reveal:** Whether absence of observation is correctly represented as uncertainty.

### Consumer or schema change

- **What it should reveal:** Whether compatibility/drift checks identify the meaningful change without erasing context.

For each candidate, inspect the generated artifacts, machine-readable export, ownership workflow and documented
limitations. No such evaluation was run as part of this report.

## Resolved questions from the discussion

- Which domains and constraints must both languages preserve? **Answer:** the closed ASCII token/enum grammar, byte
  bounds and prefixes, enforced identically in constructors and parsers.
- Which filters and overlap rules are allowed? **Answer:** named NATS wildcard templates separately typed from
  addresses; disjoint local concrete channels and explicit equal-language links across apps. Partial overlap fails.
- Which membership, delivery, ownership and completion policies are expressible? **Answer:** frozen authorized
  audiences, independent/durable or one-eligible dispatch, fenced claims/retries, identified branches, fixed/fractional
  quorums, bounded cancellation and separate decision/settlement boundaries.
- Generate native topology or reference another owner? **Answer:** explicit contract/external authority, using locked
  artifacts and pointers for external facts. Never independently edit both.
- Are standalone subject libraries sufficient first? **Answer:** yes, Rust/TypeScript value objects, parsers, filters
  and descriptors first; broker clients and execution are separate capability targets.
- Which immutable source reference appears in generated docs? **Answer:** contract ID/version, exact digest and source
  channel/operation/interaction identity.
- Must dependencies work offline? **Answer:** yes; lock every required contract, schema, native artifact and workflow
  source. Validation/generation reject network resolution.

The [decisions](./decisions.md) give rationale, the [profile](./profile-reference.md) supplies fields, and
[conformance](./conformance.md) defines evidence. Earlier research alternatives remain the basis for these choices.
Untested products have not become certified implementations.
