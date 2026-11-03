# Profile v0.2 reference

This defines proposed `x-nats-contract.version: 0.2.0-draft` for Draft [ADR#8612050910](../README.md), replacing the
v0.1 sketch. The [decisions](./decisions.md) resolve design questions; [runtime semantics](./runtime-semantics.md)
defines execution. Approval and implementation evidence remain separate from a specified policy.

## Application and bundle

One application authors `asyncapi/asyncapi.yaml`, using AsyncAPI 3.1.0 and this extension. An actual orchestrator is an
application. Global topology is a generated projection of linked contracts, never a fictional all-applications API.

Portable distributions include `bundle.lock.json`, application documents, profile and adapter schemas, external native
configurations, workflow documents and payload dependencies. Lock entries are `{path, sha256}`. Paths are relative POSIX
paths inside the bundle, without traversal, absolute paths or symlinks. SHA-256 covers exact bytes. The lock excludes
itself; a distribution reference separately pins the lock's digest. Contract `id` and `info.version` are unique in a
bundle. Reusing that identity/version with different bytes is rejected. Validation/generation never resolves the
network. Credentials and live state are deployment inputs and never bundled.

`imports.<alias>` is `{contract, version, path, sha256}` and must match the lock and document. Custom operation
references are a local key or `{contract: alias, operation: key}`. `links` is an array of `{send, receive}` references
with correct operation directions, equal subject languages after parameter renaming, and compatible message schemas.
Custom schema pointers are local `#/components/schemas/...`; standard schema `$ref` can use locked files relative to its
declaring file. For v0.2, linked payload compatibility uses equal normalized schemas after resolving locked references;
validation-irrelevant annotations do not grant permission to change types or constraints. Unknown schema implication is
not assumed safe. The example checker uses a stricter exact resolved-tree comparison and rejects recursive comparison it
cannot prove.

Applications retain their own identity, operation perspective and credentials. The contract-import graph is acyclic;
payload schema recursion is a separate concern and cannot introduce an import cycle.

`deployment` is `{binding, minimumServerVersion}`. Binding names an operator-supplied NATS
system/account/JetStream-domain mapping. Version 0.2 requires NATS server 2.11.0 or later. Account imports/transforms
require an attested identity-preserving mapping; an unknown mapping cannot provide peer identity evidence.

## Token domains and channels

`tokenTypes` has either `{kind: token, alphabet: lower|ascii|hex, first: letter|any, minLength, maxLength, prefix}` or
`{kind: enum, values}`. All concrete values are nonempty ASCII letters, digits, underscore or hyphen. Lower excludes
uppercase; hex permits 0-9 and a-f. Prefix is a literal base-ASCII token prefix; alphabet and first constrain the suffix
after it. Letter requires a leading suffix letter; any allows an empty suffix if the total minimum is satisfied.
Inclusive byte bounds count the whole token, are in 1..128, and require minimum no greater than maximum. Prefix may be
empty. Enum values are distinct valid tokens. There is no regex dialect, escaping, case folding or Unicode
normalization. These finite languages permit exact intersection tests.

`channels.<id>` is `{parameters, filters?, publisherIdentity?}`. Parameters map whole-token address placeholders to
domain names; standard/profile maps and address placeholders agree exactly. Addresses live only in standard channels.
Literal application tokens also use the base ASCII token alphabet; reserved/system subjects outside that alphabet are
explicitly unsupported by this version. Filters name permitted subscription templates: `*` matches one token; final `>`
matches a nonempty suffix. Filter placeholders reuse channel domains. Filters must intersect their channel family but
can receive out-of-contract addresses; parsing still rejects those addresses. Filter overlap is allowed and does not
establish authorization.

`publisherIdentity: {kind: subject-permission, peerParameter}` binds the parameter to the publishing logical peer under
verified deployment ACL evidence. It never trusts a payload assertion alone. Within one application/deployment binding,
concrete channel languages must be disjoint. Multiple operations/messages share one channel. Across applications,
intentional overlap requires a link; partial overlap is rejected. A global parser requires contract/channel identity
rather than guessing between application views. Unknown/dynamic inbox addresses have no normal subject builder.

## Operations

Each profile operation contains exactly one of `publish: {api: core, confirmation: none}`,
`publish: {api: jetstream, confirmation: stream-ack, stream}`, `subscribe: {api: core}`, or
`subscribe: {api: jetstream, consumer}`. Direction matches AsyncAPI action. Core publication may be captured by a
matching stream. API choice, capture and consumption are separate. Storage confirmation, consumer acknowledgment and
application completion are distinct.

`requestReply: {routing: native-inbox, completion: first-response, timeoutMs}` is Core-send only, with a standard reply
channel of unknown address. Invalid first responses fail the RPC; they do not become first-success gathering. Deployment
must verify receiver ownership, allowed responders and native response permissions. JetStream business results use
explicit result operations. Standard queue metadata stays under the pinned standard NATS operation binding.

## Native configuration and authority

A stream is `{authority: contract, config}` or `{authority: external, artifact: {path, sha256}, pointer}`. Consumers add
a local `stream` reference to either form. External artifacts are locked JSON documents; pointers select configurations.
Contract-owned resources can be provisioned explicitly. External resources are compared and never overwritten. Each fact
has one authority.

The closed supported stream configuration requires `name`, `subjects`, `retention` (limits, interest, workqueue),
`storage` (file, memory), `num_replicas` (1, 3, 5), `max_age`, `max_msgs`, `max_bytes`, `discard` (old, new), and
`duplicate_window`. Native durations are nanoseconds and limits are positive integers. The closed consumer configuration
requires `durable_name`, `filter_subject`, `ack_policy: explicit`, `deliver_policy` (all, new), `ack_wait`,
`max_deliver`, `max_ack_pending`, and `replay_policy: instant`. These are durable pull consumers. Push consumers and
additional native fields are explicitly unsupported in v0.2. Native constraints, feature support and effective defaults
are checked against the selected server. Generation does not certify deployed resources, permissions or capacity.

Durable independent delivery requires file-backed limits retention, discard-new behavior, addressed branches and a
distinct filtered consumer per logical peer. Retention and deduplication cover the deadline plus recovery/settlement
grace. Capacity refusal rejects new work instead of evicting accepted work. A shared work-queue consumer does not
satisfy independent fan-out. Result-bearing durable interactions also require a retained result stream and durable
result consumer with the same period. A Core-only result path cannot satisfy recovery. Broker redelivery counts do not
change application attempt identity.

## Adapter protocols

Adapters are `{kind, version, inputSchema, outputSchema, description}`. Kinds are audience, authorization,
result-verifier, aggregation, transform, selection, delivery, ownership, state-store and workflow. Input/output schemas
describe data values. Every call is `{context, data}` with a fixed context; application data slots are validated against
their declared schemas. Control and trust objects are closed. There are no untyped ambient context objects.

Context fields are `contractId`, `contractVersion`, `contractDigest`, `operationId`, `principalId`, `senderPeerId`,
`scopeId`, `systemId`, `accountId`, `jetstreamDomain`, `nowMs`, `deadlineMs`, and `policyRevision`. IDs/revisions are
nonempty strings, digests lowercase SHA-256, and times safe nonnegative integer UTC milliseconds. deadlineMs is null
only before admission. Principal, sender, binding and time are runtime-attested, not caller-asserted. The adapter schema
defines query/snapshot, authorization, verification, aggregation, selection, delivery, ownership and state-store data.
Versions are exact identifiers. The runtime reference defines each method and its required atomicity, not a choice left
to an implementer.

V0.2 chooses subject-permission result verification. Subject, body peer, expected branch/attempt/fence and attested
namespace must agree. The complete publish permission boundary, imports and response permissions must be verified. Broad
publishers or unknown mappings invalidate the evidence. Cross-domain message signing is explicitly unsupported by this
binding; it requires a different versioned binding. Compatible implementations may use any language, subject to shared
conformance.

## Interaction inputs and bindings

An interaction declares `requestOperation?`, `resultOperation?`, `receiverOperation?`, `senderOperation?`, `inputs`,
`bindings`, `audience`, `dispatch`, `delivery`, `correlation`, `completion`, and optional `aggregation`. Request/result
operations are local send/receive operations. Counterparts reference imported receive/send operations through matching
links. Gather-only work omits requestOperation; dispatch-only work need not have a resultOperation.

Inputs are `{source: argument|generated, tokenType}` or `{source: argument|generated, schema}`. In v0.2, generated is
reserved for the operationId input with the exact op-plus-64-hex domain; other generated inputs are unsupported.
Generated operation IDs use `op` plus lowercase SHA-256 of the length-prefixed principal ID, contract digest and
invocation key, and must fit their domain. Runtime invocation accepts a separate idempotency key. Reuse by the same
principal/contract digest returns the existing operation for identical input bytes and rejects different inputs. An
invocation key is not an operation ID or branch.

Bindings contain `subject` and `payload` maps. Target keys are parameter names or JSON Pointers. Source values are
exactly one of `{input: name}`, `{context: field}`, `{branch: id|peerId|attempt|fence|input}`, or
`{literal: JSON-value}`. There is no implicit same-name copying. Destination pointers cannot overlap. Every required
payload field must be bound; correlation metadata cannot be overwritten by business data. A compiler rejects known type
contradictions. Any binding whose schema implication cannot be proved statically requires an explicit
runtime-schema-check capability; concrete inputs and the fully materialized payload are validated before dispatch.
Unknown proof is not successful offline validation. A branch manifest is a typed array of `{branchId, peerId, input}`
with unique branch IDs and authorized recipients. Branch input maps to its declared application data slot.

Audience fields are `kind: peer|group|scope`, `input`, `scopeInput`, `resolver`, `authorization`,
`membership: snapshot-at-admission`, `includeSender`, `offline: include|exclude`, `lateJoiners: exclude`, and
`onRevocation: cancel-open-branches`. Snapshot revision, policy revision and distinct authorized peers are recorded.
Membership additions never grow accepted work. Authorization is rechecked at dispatch, claim renewal, result admission
and cancellation. Revoked open branches become terminal-revoked; previously accepted results remain facts. Membership
removal alone does not cancel obligations. Offline inclusion requires durable delivery. Empty audiences fail admission.

Dispatch is `{mode, branchKey, targetParameter?, branchesInput?, selector?}`. Modes are
`direct|independent|one-eligible|branches|none`, and branchKey is `recipient|declared`. Direct requires one peer.
Independent expands per recipient. One-eligible selects one peer for one logical branch, with reassignment under
ownership rules. Its ID derives from the initial assignee and remains stable; result-bearing one-eligible completion
counts distinct branches. Branches consumes an explicit manifest. None gathers that manifest without dispatch. V0.2
selection uses lexicographic peer-ID order and never bypasses authorization. Existing manifests require authentication
and the same result/closure checks as locally dispatched work.

## Delivery, retries and ownership

Delivery is
`{mode, state, restart, maxAttempts, retryBackoffMs, recoveryGraceMs, settlementGraceMs, adapter?, ownership?, stateStore?}`.
Mode is online-best-effort/durable-per-recipient, state memory/durable, restart fail-unknown/resume. Memory execution
requires one attempt, zero retry backoff, no offline inclusion and indeterminate reporting after loss. Durable execution
requires resume, state-store and delivery adapters, and a recoverable outbox. Max attempts is 1..16. Backoff is a fixed
nonnegative millisecond count; there is no undeclared jitter.

Ownership is `{adapter, leaseMs, renewEveryMs, onLoss: retry}`. Renewal is positive and less than half the lease
duration. Claims have monotonically increasing fencing integers. Stale claims cannot admit results or state transitions.
Anycast reassignment or multiple attempts requires durable state and ownership. Effectful handlers must honor the
operation/branch idempotency key and fence at commit to claim fenced effects. Otherwise only result admission is fenced;
exactly-once business effects are never inferred.

An uncertain publication reuses the same application attempt/message ID. Logical retry starts only after a retryable
failure or expired claim is committed, waits the backoff, increments attempt/fence and keeps the logical branch.
Attempts stop at the budget or operation deadline. Earlier attempts never add votes. Single-record CAS and recovery are
defined in runtime semantics; JetStream KV direct reads are not assumed to provide read-your-writes consistency.

## Completion and cancellation

Correlation uses payload-only message expressions to identify operation, branch, attempt, peer and fence, with a
verifier for result-bearing work. Header correlation/success predicates are unsupported in this version. Types and
locations must agree in request/results. Completion modes are none, first-success, all-terminal, all-successful and
quorum. Unit is distinct-branches/distinct-peers. Success is one typed field/equality predicate without coercion or
arbitrary code. Quorum uses exactly one of count or `fraction: {numerator, denominator}`. The fractional threshold is
ceil(numerator * admittedUnits / denominator), with positive numerator no greater than denominator. Admission freezes
units and rejects impossible thresholds. Other modes have no quorum threshold.

Result-bearing completion requires `deadlineMs`, `onTimeout: fail|partial`, `onImpossible: fail`,
`lateResults: discard`, `remaining: detach|cooperative`, and `waitFor: decision|settled`. Deadline starts at admission
commit. One successful branch supplies a peer's vote; a peer is terminal when all its branches are terminal.
First-success/quorum may decide early. All-terminal waits for every unit; all-successful needs success from every unit
and fails when impossible.

Cooperative cancellation adds `cancelOperation`, `cancelResultOperation`, and `cancelTimeoutMs`. Wire data follows the
fixed CancelRequest/CancelResult schemas. Commands identify operation/branch/attempt/fence. Replies are stopped,
already-completed or unknown. Cancellation has a timeout and cannot prove effect reversal. The decision is immutable;
sibling settlement continues separately until terminal or grace expires, then marks survivors indeterminate. Pipeline
progression honors waitFor. No implicit compensation or exactly-once effect claim exists.

## Composition and generation

Pipelines are `{steps, onFailure: stop}`. Each ordered step names an interaction or sending operation, optional
`inputAdapter`, and `bindings`. An interaction step passes its typed input to the named interaction; its bindings must
be exactly `{subject: {}, payload: {}}`, without partial overrides of that interaction's internal bindings. Its argument
object contains the declared `source: argument` inputs; generated inputs such as operationId remain executor-owned. For
a first operation step, invocation input uses the operation's payload schema.

An operation step binds its subject parameters and payload through exactly one of `{stageInput: JSON-Pointer}`,
`{context: field}`, or `{literal: JSON-value}`. `stageInput` is pipeline-only and selects from the current typed stage
input; an empty pointer selects the whole value. Named interaction inputs and branch fields are unavailable in this
namespace. Every subject parameter and required payload field must be bound. Payload destinations cannot overlap.
Pointers and context fields must exist, literals must satisfy destination constraints, and source/destination types must
be compatible. Required-field coverage includes required descendants of constructed objects. The helper rejects partial
construction through conditional/composed schemas it cannot prove. Concrete subject values still undergo their
token-domain checks before publication, including values from attested context; confirming a context field's string type
offline does not prove that its runtime value belongs to a subject domain.

First input is invocation input and has no inputAdapter. Later input is the previous successful typed output,
transformed by inputAdapter when present. A transform's inputSchema must accept the preceding output and its
outputSchema supplies the current stageInput type. The example checker recognizes interaction aggregation outputSchema
as typed output; it does not invent an application value from a publication acknowledgment or an interaction without an
aggregation schema. If a later step needs such an undefined value, it fails with `PIPELINE_OUTPUT_UNSUPPORTED`. A later
publication using only context and literals can proceed without consuming prior output. The checker conservatively
requires exact resolved schema equality for stage/transform adjacency and nonliteral payload bindings; unknown schema
implication fails rather than being accepted. That restriction is a checker limit, not proof of a general compatibility
algorithm.

Partial, failed and indeterminate outcomes stop the pipeline. Success advances only at waitFor. Publication completes at
the declared publish confirmation, not at subscriber processing. Recursion is rejected.

General graphs use a locked Open Workflow 1.0.4 document through
`workflows.<id>: {artifact: {path, sha256}, adapter, inputSchema, outputSchema}`; the adapter kind is workflow.
Sequence, fork/compete, listen and timeout retain their standard meaning. Contract interaction invocation is a typed
task boundary, and quorum is this profile's interaction primitive, not an invented native workflow feature. Workflow
source/schema/digest are bundled. A provider needs demonstrated workflow conformance before execution. No new graph DSL
or mandatory workflow engine is introduced.

Generation selects a small profile-owned compiler: one normalized model, deterministic Rust/TypeScript templates and
shared fixtures. Outputs are standalone subject/filter value objects, parse/render functions, immutable source backlinks
and interaction descriptors. Existing AsyncAPI parsing/payload tooling may be reused. Broker clients, payload models and
executors are separate targets. No surveyed transport generator is accepted as conformant without evidence. Unsupported
capabilities fail explicitly. Documentation remains useful without generation.
