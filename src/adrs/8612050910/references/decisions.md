# Decisions closing the design questions

These are the proposed answers for Draft [ADR#8612050910](../README.md). Design decisions are separate from successful
implementation tests. The [profile](./profile-reference.md), [runtime rules](./runtime-semantics.md) and
[conformance requirements](./conformance.md) make the answers actionable.

## Authoring and system scope

Choose one AsyncAPI 3.1.0 document per real application with `x-nats-contract`. An orchestrator imports independently
owned contracts through exact ID/version/path/digest references and explicit send/receive links. Global topology is a
projection of the locked bundle. There is no second handwritten messaging language or fictional all-applications API.
Addresses, messages and operation perspective stay in standard AsyncAPI fields.

## Self-contained distribution and versions

Bundle all contracts, payload/profile/adapter schemas, external native configurations and workflow sources with an
exact-byte SHA-256 lock. The lock excludes itself; a distribution reference pins its digest separately. Resolve only
inside the bundle. Reject network resolution, traversal, digest mismatch, duplicate identities and schema cycles that
prevent finite interpretation. Credentials and live membership/authorization/provider state are explicit deployment
inputs.

Replace the incompatible v0.1 sketch with v0.2.0-draft. Pin bytes during evaluation, not a mutable version label.
Changing meaning, grammar, wire data or binding incompatibly requires a new profile version. Application compatibility
is separately directional: accepted subject/payload languages and behavioral obligations matter, not merely syntactic
file changes.

## Token domains, parsing and overlap

Choose a closed ASCII token/enum grammar with byte bounds and prefixes. Remove arbitrary regex so Rust/TypeScript cannot
interpret different dialects. Concrete subjects and filters are distinct value types. Tokens occupy whole nonempty
subject segments without escaping, normalization or wildcard insertion. Parsing and rendering enforce the same domains.

Within an application/binding, distinct concrete channel languages are disjoint. Multiple messages/operations share one
channel. Across apps, overlap requires an explicit compatible link; partial overlap fails. Filter overlap is allowed,
and out-of-contract addresses still fail parsing. Finite domain automata make equality/intersection decidable. Generated
names also need language-specific collision checks.

## Policy operators and value bindings

Choose explicit input/context/branch/literal bindings, typed field equality, named completion modes, fixed or rational
quorums rounded upward, deterministic peer selection, fixed retry backoff and explicit closure. There is no embedded
code, arbitrary evaluator, ambient input lookup or implicit same-name copy. Broader transformations use versioned typed
adapters. This finite vocabulary expresses the required patterns without claiming arbitrary business logic is statically
provable.

## Core, JetStream and replies

Model publication API/confirmation separately from stream capture and Core/consumer subscription. Native inbox RPC is
Core-only and ends on the first checked response or timeout. PubAck is storage evidence; consumer acknowledgment is
consumption evidence; explicit result operations carry business results. A subject can support both Core and JetStream
views. A receiving service's standard reply definition remains valid; client requestReply metadata applies to the
sender.

## Native authority and supported surface

Choose an explicit authority union: contract-owned inline config can be generated/provisioned; locked external config is
compared without mutation. The profile defines a closed native field set, durable pull consumers and minimum server
version. Unsupported options fail explicitly. Deployment verifies native constraints, defaults, permissions, binding
identity, retention, capacity and drift. Missing observation is unknown, never proof of equality. Each fact has one
authority.

## Membership and authorization timing

Freeze distinct authorized peers at admission with resolver/policy revisions. Declare sender/offline inclusion; offline
requires durable delivery. Exclude late joiners. Membership removal alone does not erase accepted obligations. Recheck
permission at dispatch, renewal, result admission and cancellation. Revocation terminates open branches; previously
accepted results remain recorded facts. Reject empty audiences, unavailable policy providers and impossible thresholds
before sending. No hidden live-membership mode exists.

## Peer identity and adapter context

Close and version the trust-context/control schemas. Runtime-attested principal, namespace, time and policy revision are
separate from caller data. Choose subject-bound publisher identity with complete broker ACL/import evidence: result
subjects include the publishing peer, which must match payload, expected branch, attempt and fence. Any other principal
able to publish that namespace invalidates the proof. Payload IDs and arbitrary headers never establish identity.
Cross-domain signing is explicitly unsupported by this binding, rather than an unspecified mechanism different
implementations may guess.

Adapter implementations remain runtime code, but inputs, outputs, methods, errors, trust sources and atomicity are
defined. Only application data slots are parameterized by application schemas. Unknown control/context properties fail
validation.

## Durable fan-out and recovery

Persist a complete operation record with frozen manifest, branch states and outbox before sending. Use per-peer
addressed JetStream messages and independently filtered consumers, file-backed limits retention and discard-new capacity
behavior. Retention/deduplication cover deadline plus recovery/settlement grace. Refuse new work instead of evicting
accepted work. Reconcile uncertain sends using stable delivery identity; no reply does not prove failure. Resume the
durable record/outbox after restart. Memory mode promises one attempt and exposes state loss as indeterminate, with no
offline/recovery guarantee.

The state-store contract uses conditional whole-record transitions. A provider may use JetStream KV CAS or another store
if it meets the same atomicity/fencing/deadline fixtures. Direct KV reads alone do not establish read-your-writes
consistency. No messaging persistence transaction automatically spans application effects.

## Anycast, ownership and retries

Choose eligible peers in lexicographic ID order for one logical branch. Derive its ID from the initially selected peer
and persist it across reassignment; current assignee identity is separate. Commit assignment and a monotonic fence
before sending. Declare lease/renewal timing. Reassign only after a committed retryable failure or expired claim, under
the attempt and deadline budget. Renewal rechecks authorization. Uncertain retransmission keeps attempt identity;
logical retry increments attempt/fence, keeps branch ID and waits declared backoff. Multiple attempts require durable
state and ownership.

A handler must enforce operation/branch idempotency and stale-fence rejection at its effect commit boundary to advertise
fenced effects. The profile always fences result admission, never infers exactly-once business effects from queue
delivery, leases or result deduplication. Broker redelivery does not create application attempts or extra votes.

## Correlation, completion and aggregation

Identify operation, branch, attempt, peer and fence. Accept at most one terminal result for the current assignment.
Count distinct branches or peers. One successful branch supplies a peer's vote; all its branches must terminate for
settlement. First-success/quorum may decide early; all-terminal waits for every unit; all-successful needs every unit's
success. Fixed/fractional thresholds use the admitted manifest and never grow with membership.

Serialized commit time resolves result/deadline races: at/after deadline cannot win as an on-time result. Invalid,
duplicate, unverified and stale results do not count. Closed decisions are immutable. Aggregation consumes accepted
outcomes and typed context. Aggregation failure is a failed projection, never permission to rewrite accepted business
facts.

## Cancellation and settlement

Choose fixed CancelRequest/CancelResult wire schemas correlated by operation/branch/attempt/fence. Replies distinguish
stopped, already-completed and unknown. Timeout is not proof of stopped work. Early decision and sibling settlement are
separate recorded boundaries. `waitFor` chooses pipeline progression. Grace expiry marks survivors indeterminate without
reopening the decision or inventing compensation. Reauthorize cancellation; stale commands cannot affect newer
assignments.

## Workflow reuse

Keep a finite sequential pipeline convenience with typed bindings and stop-on-failure. Parallel recipient work and joins
use the specified interaction state machine. General graphs use locked Open Workflow 1.0.4 documents through a typed
workflow adapter, preserving standard sequence, fork/compete, listen and timeout semantics. Contract invocation uses an
explicit typed execution boundary. A native workflow fork never silently supplies peer authorization or quorum. No new
general graph DSL or mandatory engine is selected. Providers prove workflow and interaction capabilities before
admitting execution.

## Generation and implementation direction

Generate standalone Rust/TypeScript subject/filter value objects, parse/render functions, descriptors and immutable
ID/version/digest/channel/operation backlinks first. Choose a profile-owned compiler with one normalized model and
deterministic language backends. Reuse standard parsing/payload tooling as useful. No surveyed transport generator is
accepted as already conformant. Subject-only generation is independent of execution support; unsupported execution
capabilities fail explicitly. Source remains documentation without generation; broker clients/payload models/runtimes
are separate targets.

## Check stages and evidence

Offline checks cover parsing, bundle, structure, domains, overlap, links, bindings, schemas and capability declarations.
Admission checks actual membership, authorization, feasibility and provider availability. Deployment checks native
version, resources, ACLs, mappings, capacity and drift. Runtime evidence covers identity, ownership, retries,
deduplication, closure, recovery and effects. Diagnostics name the stage/capability. Unknown observations never become
verified intent.

Shared fixtures define the acceptance contract for both languages and runtime providers. Static fixture checks prove
only their checked slices; broker/runtime traces need a real provider run. **No generator or executor is certified by
this ADR.** That is the evidence answer, not an open product-choice question. Implementations earn capabilities against
pinned fixtures.
