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

- **Identity and relationships to retain:** Send/receive role, publication API and confirmation policy, request/reply
  association, queue group if used, error/timeout semantics and relevant service endpoint. Core publication has no
  storage confirmation; JetStream publication requires the declared stream acknowledgment. Application replies and
  consumer acknowledgments remain separate facts.

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

- **What it should reveal:** Whether contracts distinguish possible publish addresses from subscription interest and
  identify Core publication without a storage confirmation. A matching stream may capture the event, but that does not
  make the Core publish return a JetStream storage acknowledgment.

### Request/reply API with a dynamic reply inbox and queue group

- **What it should reveal:** Whether request and response semantics survive generation and rendering. The checked
  application response or timeout must remain distinct from storage confirmation and consumer acknowledgment.

### JetStream stream with a durable pull consumer

- **What it should reveal:** Whether persistence, consumer ownership, filters and acknowledgment behavior are visible.
  Assert that the publisher requires the declared stream acknowledgment, the consumer separately acknowledges delivery,
  and any application result follows its own correlation/completion rule. A storage acknowledgment alone cannot satisfy
  that result rule.

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

### Interaction pattern coverage

Evaluate these scenarios against the current [profile](./profile-reference.md) and
[runtime semantics](./runtime-semantics.md). Every scenario must preserve audience selection, membership timing,
dispatch, ownership, correlation, completion and failure rules in both the contract and its generated projections. Where
a scenario has no results or ownership protocol, record that explicitly rather than inventing a guarantee.

| Pattern             | Scenario and required checks                                        |
| ------------------- | ------------------------------------------------------------------- |
| Unicast             | [Command to one peer](#command-to-one-peer)                         |
| Multicast           | [Review a selected group](#review-a-selected-group)                 |
| Scoped broadcast    | [Announce within a scope](#announce-within-a-scope)                 |
| Independent fan-out | [Include offline recipients](#include-offline-recipients)           |
| Anycast             | [Reassign an expired claim](#reassign-an-expired-claim)             |
| Scatter             | [Dispatch distinct branch inputs](#dispatch-distinct-branch-inputs) |
| Gather / fan-in     | [Collect an existing manifest](#collect-an-existing-manifest)       |
| Scatter-gather      | [Reach a quorum during failure](#reach-a-quorum-during-failure)     |
| Pub/sub             | [Observe live and durable views](#observe-live-and-durable-views)   |
| Pipelines           | [Review and announce](#review-and-announce)                         |

#### Command to one peer

Resolve and authorize exactly the identified peer at admission; reject an unauthorized or empty audience. Create one
addressed branch. Check result peer, branch, attempt and fence where results are required; exercise the declared
ownership, timeout and offline policy.

#### Review a selected group

Freeze authorized membership at admission, exclude late joiners and apply the declared revocation rule. Create
independent branches for the selected peers. Track ownership and correlated terminal results separately; duplicates
cannot add votes, and timeout follows the declared partial/failure policy.

#### Announce within a scope

Include only authorized scoped peers and honor sender/offline inclusion; late membership changes cannot grow accepted
work. Expand the declared scope into recipient obligations with the declared ownership policy. Distinguish publication
confirmation from correlated recipient completion where required; report failures under the declared delivery policy.

#### Include offline recipients

Freeze the authorized recipient set, including offline peers only under a durable binding. Prove independent delivery
obligations and retained correlated result paths where needed. Preserve branch/attempt identity and ownership through
redelivery and recovery; apply the declared completion rule and reject capacity overflow without evicting accepted work.

#### Reassign an expired claim

Resolve authorized eligible peers from the admitted audience and use the declared selector. Keep one logical branch
across reassignment, advance its attempt/fence under ownership rules, reject stale correlated results, and enforce
retry/deadline limits and the declared completion rule. Result admission fencing alone cannot prove fenced business
effects.

#### Dispatch distinct branch inputs

Authenticate and authorize the manifest's recipients at admission. Preserve distinct branch IDs and per-branch input;
reject duplicate IDs. Declare ownership, result correlation and completion units where required, and exercise dispatch
failure.

#### Collect an existing manifest

Authenticate the expected manifest and its authorized peers without adding new recipients. Dispatch no new work. Admit
only correlated expected results, preserving the manifest's ownership/attempt/fence constraints. Reject wrong peers and
stale attempts/fences, ensure duplicates cannot add votes, then apply the declared completion and timeout rule.

#### Reach a quorum during failure

Freeze authorized membership and admitted voting units; reject impossible thresholds. Dispatch the declared branches,
correlate distinct branch/peer votes and reject stale owners. Exercise success, impossibility and timeout; keep the
decision immutable while cancellation/settlement handles unfinished branches.

#### Observe live and durable views

Publish an event to live subscriptions and a durable consumption view. Preserve subscription interest and authorization;
do not infer a complete peer directory from live subscribers. Keep Core publication, stream capture, JetStream
publication confirmation and consumer acknowledgment distinct. Preserve the declared consumer ownership. With no
application result, do not invent correlation or processing completion; exercise loss/replay according to the declared
view.

#### Review and announce

Run a review, transform its output and publish a completion event. Reapply each stage's declared audience, membership
and authorization boundary. Preserve stage ownership/correlation rules and invocation keys during recovery. Advance at
the declared decision/settlement boundary, check typed output/input bindings and stop on partial, failed or
indeterminate outcomes. Publication completes at its declared confirmation.

The [conformance requirements](./conformance.md) distinguish static checks from provider execution evidence. Declaring
these scenarios is a selection criterion; it does not establish that any candidate has passed them.

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
