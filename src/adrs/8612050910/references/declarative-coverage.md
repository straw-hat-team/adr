# Declarative coverage and specification packaging

Research snapshot: 2026-11-01. This material supports the Draft [ADR#8612050910](../README.md). Proposed semantics are
distinct from verified standard or product capabilities. See the [reading guide](./README.md).

## What can be defined statically

The current focus is documenting **how much of the subject and interaction behavior can be declared in a contract**,
before selecting or implementing code generation. The desired contract covers the complete required pattern vocabulary.
Code generation remains optional.

**Most interaction structure and policy can be defined declaratively.** The contract can state how to select an
audience, distribute work, correlate results, retry, cancel and determine completion. Runtime inputs supply the actual
participants and observations; a broker or executor performs the declared behavior. Declaring a policy and proving that
its implementation enforces it are separate tasks.

This is a feasibility assessment and proposed contract boundary. It does not establish that AsyncAPI, a particular
extension, or any surveyed generator already supports every declaration described here. No meaningful percentage of
“static coverage” can be assigned before a concrete vocabulary and evaluator are specified.

### Static definition, runtime input and execution

Use these distinct concepts throughout the document:

- **Static definition:** a versioned schema, relationship, rule, state transition or policy. For example, select
  authorized members of a referenced group at dispatch, freeze that audience, and require successful results from a
  declared quorum.
- **Runtime input:** values supplied when an operation runs. Examples include the requested group identity, current
  membership, authenticated caller, operation ID, branch payloads and observed results. An input's type, constraints and
  source can still be declared statically.
- **Execution mechanism:** a broker capability or runtime implementation that resolves, authorizes, sends, persists,
  schedules, claims, counts or cancels according to the rule.

A dynamic audience does not require audience-selection policy to be hidden in application code. The contract can declare
the resolver, its versioned interface, scope, selection time and snapshot behavior. The actual member set is resolved
for each operation and recorded as runtime state.

Similarly, a deadline policy can be static while an operation's start time is dynamic. Retry rules can be static while
observed attempts are dynamic. A quorum formula can be static while its numerical threshold is evaluated against the
selected audience. Required runtime parameters should be named and constrained rather than implicitly read from ambient
configuration.

### Declarative coverage by concern

#### Subject grammar

- **Can be declared in the contract:** Fixed tokens, parameters, token boundaries, parameter domains, allowed filters
  and parse/render rules.
- **Runtime inputs or implementation still needed:** Actual identifiers; validation of externally supplied values.
- **Useful checks before execution:** Missing parameters, invalid literal subjects, forbidden publish wildcards,
  inconsistent parameter references; overlaps where the supported grammar permits a decisive analysis.

#### Message contracts

- **Can be declared in the contract:** Payload/header schemas, content types, versions, correlation fields and semantic
  descriptions.
- **Runtime inputs or implementation still needed:** Actual payloads and their encoding/validation.
- **Useful checks before execution:** Schema/reference validity and selected compatibility checks. Semantic business
  correctness still needs an implementation or evidence.

#### Audience

- **Can be declared in the contract:** Fixed peers or a typed peer/group/scope selector; membership resolver reference;
  sender/offline/late-join rules.
- **Runtime inputs or implementation still needed:** Invocation arguments, current directory data and membership
  resolution.
- **Useful checks before execution:** Selector shape, required scope, resolver interface and compatible peer identity
  types.

#### Authorization

- **Can be declared in the contract:** Policy reference/version, action/resource inputs, result-admission requirements
  and where checks occur.
- **Runtime inputs or implementation still needed:** Authenticated identity, current policy data and authoritative
  authorization decisions.
- **Useful checks before execution:** Required policy bindings and input types. A declaration cannot establish that a
  caller is currently authorized.

#### Membership timing

- **Can be declared in the contract:** Snapshot at a named phase or deliberately live membership; rules for later
  membership/permission changes.
- **Runtime inputs or implementation still needed:** Resolved snapshot and subsequent changes.
- **Useful checks before execution:** A finite “all” completion must have a fixed expected set or a defined way to close
  the set.

#### Distribution

- **Can be declared in the contract:** One target, independent delivery to every selected target, one eligible assignee,
  or named branch expansion.
- **Runtime inputs or implementation still needed:** Selected recipients, generated branch records and routing.
- **Useful checks before execution:** Contradictory cardinalities; undeclared branch inputs; missing
  independent-delivery state requirements.

#### Delivery and persistence

- **Can be declared in the contract:** Core publication/subscription or JetStream bindings; expected stream/consumer
  settings; receipt semantics; retention/expiry requirements.
- **Runtime inputs or implementation still needed:** Existing or provisioned resources, storage acknowledgments and
  observed deliveries.
- **Useful checks before execution:** Declared configuration conflicts and server-feature constraints; actual resource
  existence and drift need deployment checks.

#### Anycast ownership

- **Can be declared in the contract:** Eligibility predicate/resolver, selection policy, claim duration, renewal,
  reassignment and stale-attempt acceptance rules.
- **Runtime inputs or implementation still needed:** Current eligible peers, claim acquisition/renewal and fencing or
  equivalent ownership enforcement.
- **Useful checks before execution:** Missing reassignment/expiry transitions and contradictory result-admission rules.
  Exactly-once business effects cannot be inferred.

#### Correlation

- **Can be declared in the contract:** Operation/branch/attempt/result identity structure; causation; deduplication keys
  and the unit of completion.
- **Runtime inputs or implementation still needed:** Actual identities and durable records of accepted results.
- **Useful checks before execution:** Missing references, incompatible result types and formulas that count attempts
  when the contract requires distinct peers or branches.

#### Completion

- **Can be declared in the contract:** One result, all-terminal, all-successful, first-success, fixed quorum or a
  precisely defined audience-relative threshold.
- **Runtime inputs or implementation still needed:** Results, distinct accepted participants, terminal states and
  threshold evaluation.
- **Useful checks before execution:** Invalid fixed thresholds and impossible fixed audiences. Dynamic audience
  thresholds need admission-time checks.

#### Time and retries

- **Can be declared in the contract:** Relative deadlines, permitted caller overrides and bounds, backoff rules, attempt
  limits, expiry and late-result handling.
- **Runtime inputs or implementation still needed:** Start time, a defined clock basis, observed failures, timers and
  attempts.
- **Useful checks before execution:** Negative/invalid durations, inconsistent bounds and missing deadline transitions.
  Time progression cannot be checked offline.

#### Cancellation

- **Can be declared in the contract:** Who may request it, advisory versus acknowledged cancellation, treatment of
  outstanding work and closed operations.
- **Runtime inputs or implementation still needed:** Cancellation requests, propagation, participant acknowledgment and
  already-completed effects.
- **Useful checks before execution:** Missing state transitions and incompatible acceptance of results after closure.

#### Aggregation

- **Can be declared in the contract:** Standard reducers such as collecting results by branch, selecting a success or
  calculating a specified aggregate; schema of partial outcomes.
- **Runtime inputs or implementation still needed:** Result data and evaluation. A domain-specific reducer can be a
  versioned external handler.
- **Useful checks before execution:** Reducer input/output types and compatibility with the completion rule. Arbitrary
  handler behavior is not proved by its type signature.

#### Pipelines

- **Can be declared in the contract:** Stage graph, inputs/outputs, mappings, fan-out/join relationships, ordering
  requirements and error/recovery edges.
- **Runtime inputs or implementation still needed:** Stage execution, actual messages, external effects and recovery
  state.
- **Useful checks before execution:** Dangling edges, type mismatches and disallowed cycles within the declared graph
  model.

#### Business work

- **Can be declared in the contract:** Handler identity/version, input/output schema, permitted effects and declared
  pre/postconditions.
- **Runtime inputs or implementation still needed:** Domain processing, database/API interactions and proof that the
  implementation meets its contract.
- **Useful checks before execution:** Interface and reference checks; assertions about real-world effects require
  runtime verification.

The proposed declarations draw on existing foundations:
[AsyncAPI operations/messages](https://www.asyncapi.com/docs/reference/specification/v3.1.0),
[native JetStream configuration](https://github.com/nats-io/nats.docs/blob/master/nats-concepts/jetstream/streams.md),
and
[Open Workflow's declarative tasks, timeouts and composition](https://github.com/open-workflow-specification/specification/blob/main/dsl-reference.md).
The coverage above is proposed scope, not a support matrix for those standards.

### Declarative coverage of the required patterns

#### Unicast

- **Static contract:** Specific-peer selector or a typed peer parameter; binding to logical peer/session; delivery and
  receipt policy.
- **Runtime facts and actions:** The selected peer's current location/identity binding and the delivery attempt.

#### Multicast

- **Static contract:** Group/recipient selector, selection phase, membership timing and per-member obligations.
- **Runtime facts and actions:** Resolve and authorize the audience, materialize the selected set and deliver.

#### Broadcast

- **Static contract:** Scope, authorization rule, inclusion rules and audience-closure semantics.
- **Runtime facts and actions:** Resolve the population in scope and fulfill the resulting obligations.

#### Fan-out

- **Static contract:** Per-recipient branch expansion, independent acknowledgment/retry/expiry and partial-dispatch
  policy.
- **Runtime facts and actions:** Create and persist branch state, send copies, record receipts and retry unfinished
  deliveries.

#### Anycast

- **Static contract:** Eligibility, selection and claim/reassignment policy.
- **Runtime facts and actions:** Evaluate current candidates, acquire ownership and enforce stale-owner restrictions.

#### Scatter

- **Static contract:** Branch templates, recipient assignments and input partition/mapping rules.
- **Runtime facts and actions:** Expand parameterized branches and allocate their concrete identities and inputs.

#### Gather / fan-in

- **Static contract:** Correlation, admissible result identities, deduplication, completeness and aggregation.
- **Runtime facts and actions:** Validate incoming results and update the operation's collection state.

#### Scatter-gather

- **Static contract:** Composition of scatter and gather rules, deadline, partial outcomes and remaining-work policy.
- **Runtime facts and actions:** Dispatch, collect, evaluate completion and close/cancel as specified.

#### Pub-sub / pipelines

- **Static contract:** Channel/stage relationships, schemas, mappings, joins and failure/recovery policy.
- **Runtime facts and actions:** Receive and process messages, execute stages and recover their effects/state.

The practical boundary is therefore **declarative policy versus runtime facts and mechanisms**. The presence of a
runtime evaluator does not make the policy code-first: one reusable evaluator can execute many contracts without each
application reimplementing audience selection or quorum logic.

### Example without embedding an algorithm in application code

A review interaction can statically declare: the audience is the authorized membership of a caller-supplied group,
captured at admission; each member gets an independent identified branch; successful terminal results from distinct
selected peers count toward a fixed quorum of two; the deadline is thirty seconds from admission; timeout returns the
collected partial results; and late results are recorded without changing the closed outcome.

The document also declares the group parameter's type, request/result schemas, resolver and authorization references,
delivery binding, retry rules and the undersized-audience outcome. Runtime work is to resolve the group, create
operation state, deliver branches and evaluate the already-declared rules as results arrive. A domain handler produces
each review result. The numbers and policies here are illustrative, not selected defaults.

This decomposition follows established Recipient List and Aggregator concepts: recipient selection is separate from
distribution, and aggregation has explicit correlation and completeness rules.
[Recipient List](https://www.enterpriseintegrationpatterns.com/patterns/messaging/RecipientList.html),
[Aggregator](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Aggregator.html).

### Keeping declarations precise and inspectable

Prefer structural policy choices with defined semantics: named selectors, dispatch strategies, completion rules, state
transitions and standard reducers. Where expressions are needed, define their language/version, available inputs, types,
evaluation limits and failure behavior. A handler reference should expose a clear contract boundary. An opaque callback
name or a block of arbitrary embedded code does not provide the same static understanding as a defined policy.

Document each feature's actual status separately: **describable**, **statically checkable**, **accepted by a
generator**, **supported by an executor**, and **verified against deployed behavior**. A schema accepting a field proves
only that it accepts the field. Code generation and broker configuration are possible projections; neither automatically
implements the entire interaction.

Static checking should reject known contradictions and mark unresolved questions as deferred. For example, a fixed
quorum exceeding a fixed eligible audience is an offline error; a runtime-selected audience requires the same check
after resolution. If a consumer, policy or resolver is supplied externally, preserve its contract reference and state
which guarantees depend on it.

**Documentation priority:** specify the declarative vocabulary, required inputs, validation limits and runtime
responsibilities for each pattern. Keep Rust/TypeScript generation as a later consumer of that specification. The
research question is how completely existing standards can express this vocabulary and where a defined extension or
companion model is necessary.

### Do we need a custom specification file?

For the complete interaction semantics requested here, the current evidence points to **a versioned interaction profile
of our own**, reusing existing standards. This is a proposed approach, not an adopted schema. Ordinary YAML or JSON is
sufficient; a new serialization syntax or custom filename extension is unnecessary.

For an application-scoped contract, a practical starting point is a valid AsyncAPI document containing standard
channels, operations, messages and schema references, plus a schema-defined interaction extension. A name such as
`x-interactions` is illustrative only. AsyncAPI explicitly permits `x-` extension fields at defined locations.
[Specification extensions](https://www.asyncapi.com/docs/reference/specification/v3.1.0#specificationExtensions).

The custom profile would define the missing meaning: audience and membership timing, distribution and branch identity,
delivery/ownership policy, completion/aggregation, deadlines and cancellation. It needs a profile version, documented
field semantics, a structural schema, and semantic validation rules. An AsyncAPI validator accepting an extension does
not establish that it understands those rules; generic renderers and generators may not use them.

When the primary artifact describes interactions across multiple independently owned application APIs, a small companion
interaction manifest can reference those APIs instead. Its contract and dependencies can be bundled for self-contained
distribution. Avoid presenting a system-wide collection of applications as one application's implemented API merely to
fit an existing root object.

The recommendation is to document the semantic profile first, then decide whether its authoring location is an AsyncAPI
extension or a companion manifest. Both can reuse the same interaction vocabulary. Existing workflow constructs should
be reused where their semantics match; gaps should be named explicitly. Generic metadata extensibility alone does not
supply an interoperable interaction standard: xRegistry's endpoint specification explicitly leaves scatter/gather
correlation outside its scope. [Endpoint scope](https://github.com/xregistry/spec/blob/v1.0-rc4/endpoint/spec.md).
