---
id: '8612050910'
title: Declarative NATS subject and interaction contracts
state: Draft
created: 2026-11-01
tags: [nats, messaging, contracts, asyncapi, code-generation]
category: Platform
---

# Declarative NATS subject and interaction contracts

## Context

Subject names identify addresses, but they do not explain who receives a message, whether publication requires a storage
acknowledgment, or when a distributed operation is complete. Those rules often live in application code, leaving
documentation, client implementations and deployed topology to drift.

The goal is a self-contained, versioned contract that describes subjects and interaction semantics directly. Readers can
consult it without generating code. Optional Rust and TypeScript generation can derive subject builders, filters,
descriptors and documentation from the same source.

Required interactions include unicast, multicast, scoped broadcast, independent fan-out, anycast, scatter,
gather/fan-in, scatter-gather, and pub-sub/pipelines. These compose: audience selection, distribution and completion are
independent concerns. Core NATS and JetStream bindings are another dimension.

[AsyncAPI](https://www.asyncapi.com/docs/reference/specification/v3.1.0) supplies application operations, channels,
messages and replies. Its NATS binding does not describe the entire interaction model.
[xRegistry's endpoint specification](https://github.com/xregistry/spec/blob/v1.0-rc4/endpoint/spec.md) explicitly leaves
scatter/gather correlation outside its scope. The [supporting research](./references/README.md) evaluates the available
standards and tools without treating documentation support as proven runtime behavior.

## Decision drivers

- Keep subject grammar and interaction policy inspectable outside application implementations.
- Preserve the complete required interaction vocabulary, including authorization scope, membership timing, per-recipient
  obligations and completion rules.
- Reuse existing message/schema standards and native NATS semantics.
- Separate declarations, runtime facts and the mechanisms enforcing them.
- Make code generation optional and consistent across Rust and TypeScript.
- Distinguish static validation from deployment checks and runtime verification.

## Resolution

Proposed option: **a declarative messaging contract with a versioned interaction profile, reusing existing standards**.
This ADR remains Draft. Its proposed requirements do not establish an approved schema, generator or runtime.

### Contract and evidence

- A contract **MUST** declare subject templates, parameter domains, allowed subscription filters, message associations
  and operation roles.
- An interaction **MUST** declare its audience, membership-selection time, dispatch behavior, delivery/ownership policy,
  correlation, completion and failure/closure behavior, or explicitly reference the contract supplying them.
- Pattern names **MUST** resolve to defined semantics. A pattern label alone **MUST NOT** establish a delivery or
  completion guarantee.
- The contract **MUST** separate static rules from typed runtime inputs and from broker/executor responsibilities.
  Current membership, authorization decisions, results and business effects remain runtime facts.
- Each capability **MUST** distinguish what is describable, statically checkable, accepted by a generator, supported by
  an executor and verified against deployed behavior.

For example, a quorum and audience-snapshot rule can be static even when group membership is resolved at admission. The
resulting recipient set and branch outcomes are operation state. A known fixed quorum exceeding a fixed audience can
fail offline validation; a dynamic audience requires the corresponding admission-time check.

### NATS bindings

- The contract **MUST** distinguish application request/reply from broker publication acknowledgment and consumer
  acknowledgment.
- It **MUST** model publication confirmation, stream capture and consumption separately. A Core publication can be
  captured by a matching stream, and live subscriptions can coexist with JetStream consumers on the same subject.
- It **MUST NOT** equate queue-group distribution with independently fulfilled fan-out, or a first-response request with
  a declared all-results/quorum rule.
- Every configuration fact **MUST** have one authority. Native configuration **MAY** be generated from the contract or
  supplied through an explicit versioned reference. Independently edited copies **MUST NOT** be treated as equivalent
  sources of truth.

### Reuse and packaging

- Use ordinary YAML and reuse standard operations, messages and payload-schema definitions where their semantics match.
- An application-scoped profile **MAY** use schema-defined AsyncAPI extension fields. A cross-application interaction
  manifest **MAY** reference application contracts. The proposed application packaging is defined below;
  cross-application packaging remains open.
- A custom profile **MUST** have a version, documented semantics, structural validation and semantic checks. Passing
  standard AsyncAPI validation **MUST NOT** be reported as validation of custom interaction semantics.
- A portable distribution **MUST** include the definitions needed to interpret the contract offline, including its
  profile and payload dependencies, or explicitly state its external dependencies. References **MUST** identify
  immutable versions when they determine contract meaning.
- Existing workflow constructs **SHOULD** be reused where they express the required semantics. This proposal does not
  select or require a new workflow engine.

Application AsyncAPI documents follow the proposed location rules in [ADR#1427717799](../1427717799/README.md), which is
also Draft. This ADR does not reserve a directory or filename for a new interaction specification. Documentation follows
[ADR#3223845695](../3223845695/README.md).

### Proposed application file

The concrete proposal is one `asyncapi/asyncapi.yaml` per application, containing standard AsyncAPI channels, messages
and operations plus a versioned `x-nats-contract` extension. The extension supplies token domains, permitted filters,
operation bindings, native resource declarations, adapter requirements and composable interaction rules.

The [proposed specification](./references/specification.md) defines the fields and their meaning. Its
[complete example](./references/example.md) combines Core request/reply, JetStream publication and consumption, and a
multicast scatter-gather interaction with a quorum. The [profile JSON Schema](./references/profile-schema.md) validates
extension structure; semantic validation and execution remain separate responsibilities. These artifacts are Draft
proposals, not existing tool capabilities.

### Optional generation

- Rust and TypeScript outputs **MUST** preserve the same subject grammar and policy meaning. Publish subjects and
  subscription filters **MUST** remain distinct.
- Generated documentation **MUST** reference the originating contract identity, version and operation/interaction.
- A generator **MUST** report unsupported required semantics explicitly. It **MUST NOT** silently reduce them to
  ordinary pub/sub or first-response RPC.
- Typed descriptors **MAY** be generated without executing interactions. Executing helpers **MUST** identify the runtime
  capabilities they require; generating them does not verify their behavior.

## Considered options

**Keep rules in application code and derive documentation.** This can expose implemented interfaces, but cannot reliably
recover the complete intended audience, ownership and completion model. It leaves semantics duplicated across languages
and implementations.

**Use AsyncAPI unchanged.** This reuses mature contract tooling, but does not supply the complete required
peer/branch/completion vocabulary. It remains a foundation rather than sufficient evidence of full coverage.

**Use a registry or runtime topology product as the contract.** Registries help discovery and versioning; operational
tools describe observed state. Neither alone supplies every intended interaction or proves inactive interfaces.

**Define a versioned profile over existing standards.** This preserves reusable definitions and adds explicit missing
semantics. It creates a schema, compatibility and validation responsibility that this proposal accepts in principle,
subject to further review.

**Adopt an existing workflow specification for composition.** This is a complementary option where its semantics match.
Peer audience resolution, authorization and NATS delivery bindings still need explicit contracts.

## Consequences

Policy can be reviewed and documented without reading each implementation. Subject APIs, diagrams and configuration can
become projections of one source. The contract stays useful when no code is generated.

A profile requires maintained semantics, versioning, validation and conformance fixtures. Generic tools can accept or
display extensions while ignoring their meaning. Declarative policy still requires a functioning executor, durable state
where promised and verification of deployed resources and business effects.

## Open questions

- Does the proposed application extension cover the required authoring cases, and how should cross-application
  interactions reference independently owned contracts?
- Which existing workflow definitions cover the required composition semantics, and which gaps require the interaction
  profile?
- What subject parameter domains, overlap rules and standard policy operators are required?
- What are the membership, ownership, completion, cancellation and recovery rules for each supported pattern?
- Which checks run offline, at admission, at deployment and during execution?
- Which generators and executor capabilities can pass shared contract fixtures?

## Links

- [Proposed specification and worked example](./references/specification.md)
- [Supporting research and reading guide](./references/README.md)
- [Declarative coverage and specification packaging](./references/declarative-coverage.md)
- [Interaction patterns and NATS mappings](./references/interaction-patterns.md)
- [Subject generation and Rust/TypeScript candidates](./references/subject-code-generation.md)
- [Technology landscape, maturity and licensing](./references/technology-landscape.md)
- [Research context and evidence limits](./references/research-context.md)
- [Evaluation scenarios, alternatives and open questions](./references/evaluation.md)
- [ADR#1427717799](../1427717799/README.md): OpenAPI and AsyncAPI source locations (Draft)
- [ADR#4711775939](../4711775939/README.md): Schema source directories
- [ADR#3223845695](../3223845695/README.md): Documentation structure
