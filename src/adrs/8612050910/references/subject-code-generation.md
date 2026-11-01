# Subject code generation

Research snapshot: 2026-11-01. This material supports the Draft [ADR#8612050910](../README.md). Proposed semantics are
distinct from verified standard or product capabilities. See the [reading guide](./README.md).

## Practical outcome: a contract that can generate subjects

The clarified requirement is **contract-first subject generation**. A portal is an optional way to read the contract.
Runtime discovery can check deployments, but cannot author the intended subject vocabulary.

The source should describe a named subject family such as `orders.{tenantId}.{orderId}.created`, the meaning and
constraints of its parameters, its message schemas, permitted operations, and delivery relationships. From that same
contract, tooling should produce Rust and TypeScript subject builders, explicit subscription filters, and reference
documentation. Optional later outputs include client helpers and native topology configuration.

The intended flow is **versioned contract → semantic validation → documentation and optional Rust/TypeScript
generation**. Generated API documentation should link back to the originating contract identity, version and operation.
Callers that do not use generation can consult or reference the same document without adopting a generated runtime
framework.

### What the generated output should preserve

The following are proposed acceptance requirements, not capabilities already proved in a selected generator.

#### Stable subjects

- **Required contract meaning:** Named subject families and parameter meanings.
- **Proposed output or validation:** Constants for fixed addresses and typed builders for parameterized addresses.

#### Parameter domains

- **Required contract meaning:** Which value is a tenant ID, order ID or constrained enumeration; whether it occupies
  one token or an explicitly permitted token sequence.
- **Proposed output or validation:** Rust value types and TypeScript branded/validated values, with runtime construction
  checks. A plain string substitution is insufficient.

#### Publish versus subscribe

- **Required contract meaning:** Concrete publish addresses and subscription-interest patterns are distinct.
- **Proposed output or validation:** Separate publish-subject and subscription-filter APIs. Wildcards cannot be supplied
  to publishing through the typed API.

#### Subject parsing

- **Required contract meaning:** How a concrete address maps back to the named family and its parameters.
- **Proposed output or validation:** Optional parsers and matchers, checked against the same examples as the builders.
  No accidental cross-token capture.

#### Interaction pattern

- **Required contract meaning:** Event broadcast, queue-distributed processing, or request/reply, with explicit
  application roles.
- **Proposed output or validation:** Operation metadata and, optionally, appropriately scoped helpers. A subject name
  alone must not imply the delivery pattern.

#### Core versus JetStream

- **Required contract meaning:** Persistence expectations and stream/consumer associations.
- **Proposed output or validation:** Explicit descriptors and documentation; optional generated configuration. A Core
  publish helper must not imply a JetStream storage acknowledgment.

#### Request/reply

- **Required contract meaning:** Request and response types, dynamic reply routing and application-level errors/time
  bounds.
- **Proposed output or validation:** Optional request helpers preserving inbox behavior; no invented fixed reply
  destination.

#### Ownership and boundaries

- **Required contract meaning:** Producers/consumers, account scope and any subject transformation across
  imports/exports.
- **Proposed output or validation:** Linked reference pages and topology views that retain scoped identity.

#### Cross-language agreement

- **Required contract meaning:** Rust and TypeScript represent exactly the same address grammar.
- **Proposed output or validation:** Shared valid/invalid subject fixtures, expected rendered strings and round-trip
  expectations.

#### Traceability

- **Required contract meaning:** Contract identity, version and operation are stable and addressable.
- **Proposed output or validation:** Generated doc comments and source references; generation remains optional.

NATS's subject rules distinguish concrete destinations from wildcard interest. Token delimiters, wildcard position and
scope therefore need explicit handling. Reject invalid values rather than silently applying URL escaping or changing the
subject's meaning. A one-token identifier containing a dot must not expand into additional routing tokens.
[NATS subject model](https://github.com/nats-io/nats.docs/blob/master/nats-concepts/subjects.md).

Topology semantics here primarily mean **logical messaging and delivery semantics**. Queue groups distribute to a member
of each matching group, while independent subscribers can also receive copies. JetStream stream/consumer behavior is a
separate layer. Physical server routes and leaf links can remain a later operational view. Generation can encode a
contract and check configuration; it cannot guarantee that every running participant or permission obeys it.

### How to distinguish Core, JetStream and request/reply

Declare these facts on operations and their resource relationships. A subject name is only an address and cannot
reliably supply the classification. Model the concerns independently:

- **Application exchange:** one-way message, request/reply, or an explicitly modeled multi-response exchange.
  Request/reply includes the application response schema, reply routing and completion policy.
- **Publication confirmation:** ordinary Core publication or a publication that requires checking a JetStream storage
  acknowledgment.
- **Stream capture:** which stream is configured to capture the subject in the relevant account/system/domain.
- **Consumption:** live Core subscription or a named JetStream consumer, with the consumer's delivery and acknowledgment
  policy.

A Core publication can still be captured by a matching stream. Conversely, a live Core subscriber on a stream's input
subject does not acquire replay or consumer-acknowledgment semantics. One publication may feed both live subscribers and
stored delivery. “Core” on the publishing operation therefore does not mean “this subject can never be persisted.”
[JetStream model](https://docs.nats.io/concepts/jetstream),
[publication acknowledgment](https://docs.nats.io/learn/jetstream/publishing).

Request/reply describes the application's expected answer. NATS implements it using publication plus a reply subject and
a listener for the answer. A reply field alone is insufficient evidence of an application request/reply contract:
JetStream publication itself can receive a broker storage acknowledgment. That acknowledgment does not establish that
application processing completed. [Request/reply](https://docs.nats.io/learn/core-nats/request-reply),
[storage versus delivery](https://docs.nats.io/learn/jetstream/publishing#stored-versus-delivered).

For example, `orders.created` can have a publisher requiring a JetStream acknowledgment, a stream capturing it, a
billing consumer reading stored messages, and a dashboard using a live Core subscription. The application exchange can
remain one-way throughout. A separate `orders.get` operation can declare an application request and an `Order` response.
These are proposed contract examples, not deployed resources.

The generator should emit behavior from those declarations. Deployment checks should confirm matching streams and
consumer settings; runtime checks can confirm acknowledgments and responses for exercised operations. Observations alone
leave unexercised operations unknown. Subject-only generation can preserve the descriptors and documentation without
opening connections or provisioning anything.

### Required interaction patterns

See the [interaction-pattern reference](./interaction-patterns.md) for the complete required semantic scope.

### Revised shortlist for Rust and TypeScript

#### [AsyncAPI with an explicit NATS generation profile](https://www.asyncapi.com/docs/reference/specification/v3.1.0)

- **Practical relevance:** Leading candidate for the canonical, readable contract and existing documentation tooling.
- **Current evidence and remaining gap:** Address templates, parameter metadata, send/receive operations and replies are
  standard concepts. Domain-typed subject tokens, wildcard-builder policy and complete JetStream topology need
  additional specified semantics. This profile would be our proposal, not an existing official binding.

#### [The Codegen Project](https://www.the-codegen-project.org/docs/generators/parameters)

- **Practical relevance:** Strongest directly documented TypeScript lead found for this clarified outcome.
- **Current evidence and remaining gap:** Its parameter generator produces address-substitution and extraction helpers.
  Channel generation is TypeScript-specific. Validate token safety, wildcard construction, parsing and the required
  extensions before adopting.

#### [Ioka community Rust NATS template](https://github.com/Ioka-Technologies/asyncapi-template/blob/main/rust-client/README.md)

- **Practical relevance:** Rust client-generation lead using `async-nats`, with pub/sub and request/reply claims.
- **Current evidence and remaining gap:** **Emerging/unverified for this goal.** Full client generation is documented,
  but standalone subject builders, validated token types and complete topology preservation are not established. No
  generated crate was compiled here.

#### [AsyncAPI Generator with purpose-built Rust/TypeScript templates](https://github.com/asyncapi/generator)

- **Practical relevance:** Could generate the narrower subject layer without adopting a new application runtime.
- **Current evidence and remaining gap:** Reuses a generator framework, but subject semantics, target templates and
  maintenance would be work we own. This is a fallback proposal, not an implementation already supplied by AsyncAPI.

#### [xRegistry / xrcg](https://github.com/xregistry/codegen)

- **Practical relevance:** Useful if discoverable endpoint/message/schema metadata later needs publication through a
  registry.
- **Current evidence and remaining gap:** NATS transport code generation is not listed by xrcg. It is not the leading
  ready-made route to matching Rust/TypeScript subject APIs.

#### [lerenn/asyncapi-codegen](https://github.com/lerenn/asyncapi-codegen)

- **Practical relevance:** Relevant precedent with documented Core NATS and JetStream adapters.
- **Current evidence and remaining gap:** **Specialist Go generator.** It does not satisfy the selected languages. Its
  runtime stream/consumer configuration options illustrate that broker support does not imply topology is fully declared
  in the contract.

The Codegen Project also documents Core publish/subscribe and JetStream publish/pull/push support for TypeScript. Those
are useful optional outputs, separate from whether its generated subjects enforce the desired grammar.
[NATS support matrix](https://www.the-codegen-project.org/docs/protocols/nats),
[channel generation](https://www.the-codegen-project.org/docs/generators/channels).

An important maintenance distinction: the older official **TypeScript NATS** and **.NET NATS** templates are explicitly
marked archived in AsyncAPI Generator's current template list. The same README calls its baked-in template feature
experimental. The maturity of the specification and HTML tooling must not be used as evidence of maintained NATS code
generation. [Template status](https://github.com/asyncapi/generator).

### The main specification gap

AsyncAPI 3.1's channel Parameter Object supports string enumerations, defaults, descriptions, examples and locations. It
does **not** provide an arbitrary JSON Schema field for declaring domain-typed address parameters. Consequently, “this
parameter is a validated tenant ID occupying one NATS token” requires an explicit profile/extension or a separately
linked, machine-readable domain definition that the generators understand. Do not add unsupported standard fields and
assume other tools will enforce them.
[Parameter Object](https://www.asyncapi.com/docs/reference/specification/v3.1.0#parameterObject).

There is also an application-versus-system scope decision. AsyncAPI describes one application's operations. Shared
subject definitions can be referenced from application contracts; a system-wide ownership/topology manifest would need
its own defined model or an extension. Keep those roles explicit even if they are bundled into one distributable
document.

### What self-contained should mean

The contract must contain, or bundle, the semantic descriptions and resolved schema/profile definitions needed to
interpret it without a running broker or a portal. A repository may use referenced files for authoring, then publish a
bundled contract as the portable documentation artifact. Any external payload-schema reference should identify an
immutable version and be included when offline portability is required.

The portable artifact should include subject examples, allowed filters, message associations, application roles,
delivery expectations and explanation of profile fields. The same facts should drive both generated languages. Portal
pages, diagrams, subject libraries and optional configuration outputs are projections of that contract.

**Recommended next discussion:** agree on the subject grammar and the required audience/dispatch/completion model, then
evaluate the TypeScript lead and Rust template against shared fixtures covering every required pattern. Subject
libraries and interaction descriptors can be initial outputs; runtime helpers require separate verification of the
behaviors they promise.
