# Runtime semantics and adapter obligations

This specifies execution for proposed profile v0.2 in Draft [ADR#8612050910](../README.md). These are requirements on a
provider, not claims about an installed runtime. Field shapes are in the adapter protocol schema and
[profile reference](./profile-reference.md). Application payloads remain governed by their own schemas.

## Identity, context and authorization

The runtime authenticates an invocation and constructs the closed RuntimeContext. Principal and sender identify the
original invoker; candidate/acting peers are explicit data fields. Account/system/domain come from the operator's
deployment binding. Time comes from the trusted provider clock, never message payload. AuthorizationInput combines the
original invocation context, action, peer, branch and attempt. Authorization attempts are in 1..16; candidate checks
before admission use the prospective first attempt, 1. An unavailable, expired or denied decision fails closed.
Authorization revisions are recorded with admitted obligations, but current revocation is rechecked before subsequent
protected transitions.

V0.2 result identity uses a peer-bearing result subject and complete publish-namespace evidence. For example, a
publisher bound to peer alfa can publish `demo.v1.lab.review.*.result.alfa`, while another peer cannot. Verification
requires the actual received subject, its peer parameter, expected peer and payload peer to agree. The operator must
attest that every principal capable of publishing that namespace maps to the same logical peer. Wildcard administrative
publishers, account imports and subject transforms are part of that boundary. An unattested exception invalidates the
proof; the runtime does not simply trust a body/header. The broker does not generally expose the publisher's
authenticated connection identity in each message.

Native request/reply additionally requires exclusive/intentional receiving ownership and response permissions that
prevent unrelated principals publishing the selected inbox. Its first-response behavior is not a peer-aware quorum rule.

## Admission and immutable manifests

1. Validate input and canonicalize it as I-JSON using RFC 8785 before computing its invocation digest. Duplicate keys,
   nonfinite numbers, unsafe integers and invalid Unicode fail. The contract bundle identity/digest participates in the
   key.
2. The runtime derives the operation ID, resolves candidates, applies sender/offline rules and authorizes every included
   peer. Record resolver/policy revisions and distinct logical peers. A resolver observation does not guarantee that a
   currently online peer remains connected.
3. Expand branch identities and explicit bindings. Independent delivery uses the initial peer ID as branch ID;
   one-eligible derives its branch ID from the initially selected peer and preserves it if the assignee changes.
   Explicit manifests use supplied unique IDs. Gather manifests must be authenticated and authorized; accepting
   arbitrary caller-supplied expected result sets is prohibited.
4. Freeze the expected units and quorum threshold. Reject empty audiences, impossible thresholds, unknown adapters,
   incompatible bindings and unavailable delivery/verification/ownership capabilities. Check serialized record and
   branch-count budgets before creating state. Provider capacity refusal rejects admission without sending any branch.
5. Create the admitted record atomically with the invocation key, input digest, manifest, deadline and pending outbox.
   Duplicate invocation keys for the same principal/contract/input return the existing operation; different inputs fail.
   No sends occur before successful creation. Deadline starts at this admission boundary, not after an unbounded
   dispatch period.

The operation ID is `op` plus the full lowercase SHA-256 of length-prefixed UTF-8 principalId, contractDigest and
invocationKey. Each length is an unsigned 64-bit big-endian byte count. The primary operation key is therefore stable
for retries without an unmodeled transactional secondary index. The record retains immutable invocation identity and
canonical input digest; conflicting identity/input under an existing key fails. The operation token domain must admit 66
bytes. Before admission, context deadlineMs is null. Admission has a fixed 10000 ms budget from the trusted
request-start clock; a hung resolver cannot admit work later.

Create receives AdmissionRecord without admittedAtMs/deadlineMs plus timeoutMs. At the guarded admission transition, the
provider sets admittedAtMs to its authoritative timestamp and deadlineMs to that timestamp plus timeoutMs, returning the
full record. Outbox wire values depending on that timestamp are materialized/persisted before sending. Post-admission
context uses those recorded instants. Context deadlineMs remains the operation deadline; cancellation/settlement
transitions use their separate control/grace deadlines and cannot extend result admission. This avoids provisional
caller-supplied admission timestamps.

Before publishing any request, establish the frozen peers' result subscriptions and synchronize their registration. A
declared forOperation filter is an optimization only when its broader subscription permission is verified. Durable
result consumers must also be ready. Failure to establish the result path consumes deadline budget and closes dispatch
without assuming responses can be recovered later in memory mode.

Directory, policy, broker and store do not share an implied distributed transaction. Admission records the observed
revisions; revision changes during a required snapshot check restart admission within its budget. Authorization validity
must cover the guarded transition, and permission is checked again before dispatch. Revocation takes effect at the
specified protected boundaries; it is not a promise to unsend data or instantly stop already-running effects across
every system.

The deadline is absolute UTC milliseconds in the recorded operation. Mutable directory membership does not change the
manifest. Membership removal alone preserves the obligation; authorization revocation terminates still-open branches.

## State-store protocol and atomic time guards

A store exposes get, create-if-absent and replace-with-expectedRevision for the complete OperationRecord. Revisions are
opaque. All accepted replacements preserve immutable identity, manifest and closed decision. Only trusted executor
capabilities can call the state provider; peer/caller application inputs never authorize direct replacement. CAS is the
coordination authority, so no extra coordinator lease or client-supplied pre-admission lease timestamp is required. They
advance only valid branch/operation transitions. Revision mismatch returns conflict without mutation. Per-operation
serialization makes votes, assignment changes, outbox state and closure one logical record transition; there is no
transaction across unrelated operations.

Create/replace carry `timeGuard: {notBeforeMs, notAfterMs}`. The store checks that interval at its authoritative
serialized transition point and returns that same timestamp as committedAtMs. The interval is inclusive at its lower
bound and exclusive at its upper bound. Empty/reversed intervals are invalid-input. A valid guard outside its window
returns expired without mutation. All time arithmetic rejects safe-integer overflow before mutation; quorum fractions
use exact integer arithmetic. Result admission requires a still-open operation, current attempt/fence, and a time
strictly before deadline. A deadline transition requires time at or after deadline. A result arriving on a socket
earlier but serialized later is late. If a provider cannot guarantee this atomic guard, it cannot claim this execution
capability. Returning a timestamp after an unconditional write is insufficient.

A trusted serialized decision point is the profile's time boundary; it is not a promise that packet arrival, client
clocks, replica reads or wall-clock observation of durability happen simultaneously. Provider clock rollback must stop
new protected transitions until monotonic time is restored. Lease decisions use this same authority. A store must
distinguish unavailable from conflict, expired and not-found; uncertainty is never permission to overwrite state.

JetStream KV provides conditional updates, but direct reads can be stale. A KV-backed provider needs an additional
verified serialization/time-guard layer; an ordinary client read-then-update does not establish the complete contract.
Other durable stores may implement the same interface. No store/provider is certified by naming it in documentation.

Record size, branch count and retention budgets are deployment capabilities with explicit configured limits. Admission
checks actual serialized size before committing. A provider never partially truncates a manifest to fit. Closed records
and invocation keys remain available for the declared replay/recovery period. Durable providers preserve minimal
invocation tombstones after payload expiry and return expired/unknown for an old key rather than recreating it.
Tombstone continuity is required; capacity exhaustion rejects new admissions instead of deleting key history.
Memory-mode idempotency is process-local only: after state loss, clients must not automatically retry POST to
reconstruct an unknown operation; a deliberate new invocation uses a new key.

## Outbox, durable delivery and recovery

The operation record contains each branch's current assignment, application attempt, fence, lease, next eligible retry
time, terminal outcome and outbox status. Persist the intended dispatch before publication. Publish/reconcile uses an
idempotency identity derived from contract digest, operation, branch and attempt, with an unambiguous length-prefixed
encoding. Its hash is the stable native message ID. Repeating an uncertain publication keeps that ID and attempt. A hash
collision or conflicting payload under the same identity fails rather than replacing content.

Delivery receipts distinguish stored, already-stored, rejected, unknown and exhausted. Stored means verified native
storage acknowledgment from the expected stream, not an application result. Unknown remains pending reconciliation or
deadline closure. A provider reconciles deduplication, consumer exhaustion and observed delivery state through the same
branch identity. It cannot turn a timeout into proof of non-delivery. Recovered outbox entries are replayed/reconciled
idempotently from durable state.

Independent logical recipients use independently addressed messages and filtered durable consumers. File-backed limits
retention plus discard-new prevents capacity pressure from silently evicting accepted work. Retention/deduplication must
cover the operation deadline and recovery/settlement grace. Resource changes that violate this guarantee block new
admissions and report affected in-flight operations as indeterminate when continuity cannot be proved. Native
max-delivery exhaustion becomes an observed retryable failure or terminal failure according to the application attempt
budget; it is not a new branch.

A durable worker acknowledges its request only after its terminal result is stored in the retained result stream or a
recoverable result outbox. The coordinator consumes that stream and acknowledges the result only after a guarded durable
record transition, or an idempotent replay proving prior acceptance. Storage PubAck remains separate from application
admission. Lost acknowledgments may redeliver. Workers must retain/return the existing result for the same logical work
instead of assuming acknowledgment loss authorizes a duplicate business effect.

Memory mode keeps the same identities/completion rules but has one attempt and no offline promise. On loss of
coordinator state, clients observe indeterminate outcome; a restarted process cannot reconstruct successful completion
from absence of data.

## Selection, claims and attempts

Selection sorts the eligible authorized peer IDs by unsigned ASCII byte order and chooses the first not excluded by a
terminal assignment outcome. Initial selection and reassignment are persisted before sending. At admission, every branch
has its initial assignment with attempt and fence 1, including a pending branch that has not been dispatched. Fence 0 is
invalid in stored records and wire identities. When no eligible peer remains, the branch becomes failed, never silently
broadcast. A peer may have multiple sessions only when its receiver ownership contract makes that sharing intentional.

Ownership supports acquire, renew and release. A grant identifies peer, application attempt, monotonically increasing
fence and leaseUntilMs. Conditional state replacement authorizes the grant. Renewal is before expiry, under the declared
interval, current fence and current authorization. An expired/revoked owner cannot renew or admit results. Reassignment
starts a new attempt/fence for the same logical branch after the fixed retry backoff. Attempt counts and deadlines are
finite.

A transport retry after uncertain send is not an application retry. A logical retry is allowed only after a committed
retryable failure or expired claim. Permanent failure, revocation, exhausted budget and deadline close the branch.
Stale/duplicate result traffic never creates another attempt. Broker redelivery counters do not enter quorum formulas.

Result admission always checks current assignment/fence. Fenced business effects additionally require the effect sink to
reject older fences and respect the operation/branch idempotency key atomically at its own effect commit boundary. A
lease alone cannot stop already-running code or undo an external side effect. Providers advertise result-fencing and
effect-fencing separately.

## Result admission and decision

Parse the address and payload, verify the publisher namespace, resolve correlation fields and check the frozen manifest.
Recheck authorization. Reject wrong operation/branch/peer, unknown attempt, stale fence, invalid schema, expired lease
and late results. Apply the result only through a guarded conditional record replacement. A valid duplicate of an
accepted terminal result returns the prior decision without another vote. Conflicting terminal results are rejected and
recorded as a protocol conflict.

A branch has pending, success, failure, revoked, cancelled or indeterminate status. A current valid result determines
success through the declared typed equality predicate. False means failure unless a separately typed retryable result
requests an allowed application retry. Retryability cannot override authorization, time, ownership or attempt-budget
checks.

For distinct-branches, every branch supplies at most one success vote. For distinct-peers, any successful branch
supplies its peer's single vote; that peer is terminal only after all its branches are terminal. Thresholds were frozen
at admission. First-success closes on a successful unit. Quorum closes at its count/fraction threshold. All-successful
closes when every unit has success and fails when that becomes impossible. All-terminal waits for every unit to
terminate and reports its outcomes, including failures. Its decision is success when collection is complete, even if
some business branches failed; aggregation preserves those failures. Use all-successful when every unit must succeed.

On timeout, the recorded outcome is partial or failed as declared. On impossibility, success-requiring modes fail before
timeout. Decision outcome is success, partial, failed or indeterminate. Once closed, it never changes because of later
membership/results. Aggregation is a typed projection of the recorded accepted outcomes and explicit context. Projection
failure is reported separately and stops a dependent pipeline; it cannot erase votes or retry a completed effect.

## Cancellation and sibling settlement

Early closure records a decision and the disposition of unfinished siblings in one transition. Detach stops waiting for
their business results but does not imply stopped work. Cooperative cancellation persists cancellation outbox records
and emits fixed CancelRequest values including operation/branch/attempt/fence and a reason. The command is reauthorized.
Peers reject stale fences and return stopped, already-completed or unknown through the explicit cancellation result
operation.

Stopped asserts that the requested assignment is no longer running; it does not assert effect reversal.
Already-completed preserves that fact even when its result arrived after decision. Unknown or missing replies remain
indeterminate. Cancellation timeout and settlement grace are bounded and independent of the operation's decision
deadline. Cancels do not gain permission to target a newer attempt just because the branch ID is unchanged.

The operation phases are admitted, active, closed and settled. Settlement status is pending, complete or indeterminate.
A closed successful decision can coexist with indeterminate sibling settlement. `waitFor: decision` permits pipeline
progress at decision; `waitFor: settled` additionally requires complete settlement. Partial/failed/indeterminate
outcomes, or indeterminate settlement when settlement was requested, stop the pipeline. Grace expiry never reopens a
decision or invents successful cancellation.

Closing an HTTP connection only stops waiting; it does not cancel work. Only the declared authorized cancellation
commands change assignment/settlement state. V0.2 adds no implicit blanket cancellation endpoint or automatic
compensation.

## Adapter behavior and errors

Each call carries the fixed context and typed data. Audience returns a revisioned observed peer set; authorization
returns a revisioned expiring decision; verification returns accepted/rejected identity evidence. Selection, delivery,
ownership and state methods have the state and timing obligations above. Aggregation/transform validate their declared
output schemas before use. Application data is the only schema-parameterized slot; control/trust metadata cannot hide
arbitrary additional fields.

Provider errors use named classes invalid-input, denied, unavailable, conflict, expired, unsupported and
protocol-conflict, with an optional diagnostic description. Retry follows the operation policy, not error-message
matching. Unsupported capabilities fail before dispatch. Temporary provider failure cannot bypass a permission,
deadline, compare-and-swap guard or required durable write.

## Workflows and the execution boundary

Sequential pipeline stages bind current stage-input/context values explicitly. A `stageInput` JSON Pointer selects
invocation input for the first stage or prior successful output after any declared input transform for later stages.
Interaction stages pass the validated argument object through; operation stages materialize explicit subject/payload
bindings. Output-to-input schemas must match, or a named transform must bridge them. Operations in a finite stage must
be sending operations. No unbounded subscribe is treated as a completed stage. The selected waitFor boundary and
stop-on-failure rule determine progression. Pipeline syntax lowers to Open Workflow 1.0.4 sequence/functions, with
deterministic stage invocation keys; execution requires the workflow capability. The workflow provider owns durable
scheduling/progression state, so a second undocumented pipeline-state protocol is unnecessary. Recovery reuses stage
invocation keys so a resumed pipeline does not restart an already accepted interaction under a new identity.

General graphs use the pinned Open Workflow 1.0.4 language rather than a second custom graph syntax. Its reusable
function/task boundary invokes a contract through a typed adapter call: contract ID/version/digest, interaction ID,
invocation key, typed input, and waitFor. The requested boundary must be at least as strong as the contract boundary: a
caller can request settled instead of decision, but cannot weaken settled to decision. The response includes operation
identity, decision, settlement and typed output. The chosen transport is an authenticated HTTP facade: POST
/contract-invocations accepts InvocationRequest, returns 200 when the requested boundary is reached or 202 while
pending, with InvocationResult in either case. GET /contract-invocations/{operationId} returns the same typed state
under authorization for the original invocation. The reusable workflow function uses standard HTTP calls and bounded
polling until the requested boundary or workflow timeout. Retries keep invocationKey and input unchanged. The operator
supplies the HTTPS base endpoint and credential reference; neither a new principal nor a raw credential value is
embedded in the bundle. AdapterError kinds distinguish denial, expired input, unavailability and protocol conflict. An
uncertain HTTP result is retried/looked up idempotently; it never means successful execution.

HTTP 200/202 describes invocation progress, not business success. A reusable workflow function checks decision.outcome
and the requested settlement boundary before reporting task success. Authentication failure is 401; denied is 403;
missing/hidden operation is 404; invalid-input is 400; conflict/protocol-conflict is 409; expired is 410; unsupported is
422; unavailable is 503. Error bodies use AdapterError. A failed/partial business decision remains a valid
InvocationResult rather than being confused with transport failure. Cancel-result subscriptions are established before
cancellation publication just as ordinary result paths precede dispatch.

The workflow provider owns Open Workflow scheduling, fork/compete/listen/timeout behavior; this profile owns peer
admission, branch/ownership/completion/cancellation. The bundle pins workflow source/schema and typed interface. A
provider that has not passed both capability suites cannot execute the combined contract. Choosing a language does not
certify any engine.

## Sources and limits

Native foundations are [NATS subject authorization](https://docs.nats.io/learn/security/authorization),
[JetStream consumers](https://github.com/nats-io/nats.docs/blob/master/nats-concepts/jetstream/consumers.md),
[KV conditional updates and consistency](https://github.com/nats-io/nats.docs/blob/master/nats-concepts/jetstream/key-value-store/README.md),
and the [Open Workflow DSL](https://github.com/open-workflow-specification/specification/blob/main/dsl-reference.md).
Input canonicalization uses [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785). The guarded store, peer protocol and
interaction rules above are this proposal's requirements. They are not claims that native NATS or a surveyed workflow
engine implements them.
