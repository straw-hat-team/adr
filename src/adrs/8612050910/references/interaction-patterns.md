# Interaction patterns and NATS mappings

Research snapshot: 2026-11-01. This material supports the Draft [ADR#8612050910](../README.md). Proposed semantics are
distinct from verified standard or product capabilities. See the [reading guide](./README.md).

## Required interaction-pattern contracts

**Unicast, multicast, scoped broadcast, fan-out, anycast, scatter, gather/fan-in, scatter-gather and pub-sub/pipelines
are required documentation coverage.** Subject generation alone is not sufficient. The source must also describe
audience, distribution, per-recipient obligations, result correlation and completion semantics. This expands the
contract requirements; no currently researched generator has been verified to preserve the complete pattern set.

These patterns are composable. Unicast/multicast/broadcast describe audience selection; fan-out and anycast describe
distribution; scatter introduces identified work branches; gather introduces correlation and completion; pipelines
compose operations and stages. An interaction may select a group, create independent branches for its members and gather
results. A single mutually exclusive pattern label would lose information.

The mappings below are design proposals built from documented NATS primitives. They are not claims that the broker
implements all peer-level semantics automatically.

### Unicast

- **Meaning that the contract must preserve:** One identified peer within an account/scope; logical peer versus a
  particular session/instance must be explicit.
- **Possible NATS realization and missing application semantics:** A peer-addressed subject and appropriate permissions
  can provide routing. Multiple subscribers to that subject do not automatically constitute one specific peer. Identity
  binding, exclusive ownership or intentional instance sharing needs a rule.

### Multicast

- **Meaning that the contract must preserve:** A selected group with defined membership, authorization and the time at
  which recipients are selected.
- **Possible NATS realization and missing application semantics:** Group subjects can reach current matching
  subscribers; an explicit recipient list can drive peer-addressed sends. A group subject does not by itself preserve a
  frozen recipient set or guarantee offline delivery to every member.

### Broadcast

- **Meaning that the contract must preserve:** All authorized peers within a named scope, with explicit rules for
  whether offline peers, the sender and later joiners are included.
- **Possible NATS realization and missing application semantics:** Scoped pub/sub reaches connected matching
  subscribers. Reaching an application-defined authorized population requires membership resolution and, when promised,
  durable delivery obligations. Subscription interest is not a complete peer directory.

### Fan-out

- **Meaning that the contract must preserve:** Independent delivery obligations for each recipient or branch;
  success/failure can differ per delivery.
- **Possible NATS realization and missing application semantics:** Separate consumers on a suitable stream or addressed
  branch messages can provide independent delivery state. One shared consumer distributes work instead. Define partial
  dispatch, per-recipient acknowledgment, retry and expiry behavior.

### Anycast

- **Meaning that the contract must preserve:** Select or assign one eligible peer; define eligibility, selection,
  ownership and reassignment.
- **Possible NATS realization and missing application semantics:** A queue group or workers sharing a JetStream consumer
  can distribute work. Business eligibility must be reflected in routing or an explicit selection/claim protocol. A
  broker delivery is not a durable business claim or proof of exactly-once effects.

### Scatter

- **Meaning that the contract must preserve:** Create identified work branches with recipient assignment and
  branch-specific inputs.
- **Possible NATS realization and missing application semantics:** Explicit branch messages, or a broadcast for a
  deliberately open responder set. Plainly broadcasting the same request does not establish distinct expected branch
  identities or complete dispatch accounting.

### Gather / fan-in

- **Meaning that the contract must preserve:** Associate results with an operation and branch, validate their origin,
  deduplicate and decide when the set is complete.
- **Possible NATS realization and missing application semantics:** A shared result subject, inbox or stream transports
  results. An application aggregator must enforce identity, terminal states, completion and late-result policy.

### Scatter-gather

- **Meaning that the contract must preserve:** Compose branch creation and correlated gathering under an explicit
  completion rule.
- **Possible NATS realization and missing application semantics:** NATS supports multiple responders to a reply inbox.
  For a required peer/branch set, add a branch manifest and completion state. A first-response request helper does not
  implement all-results or quorum completion.

### Pub-sub / pipelines

- **Meaning that the contract must preserve:** Topic subscriptions plus explicit stage relationships, transformations,
  branching, joins and stage-failure behavior.
- **Possible NATS realization and missing application semantics:** Subjects/streams connect stage inputs and outputs.
  Subject naming alone cannot specify causation, stage completion, processing order or recovery across stage boundaries.

Native foundations: [NATS queue groups](https://docs.nats.io/learn/core-nats/queue-groups),
[NATS scatter-gather](https://docs.nats.io/learn/core-nats/scatter-gather),
[JetStream consumers](https://github.com/nats-io/nats.docs/blob/master/nats-concepts/jetstream/consumers.md),
[streams and retention](https://github.com/nats-io/nats.docs/blob/master/nats-concepts/jetstream/streams.md). The
peer-level requirements above are proposed contract semantics layered over those primitives.

### The semantic dimensions to specify

#### Audience and authority

- **Decisions the machine-readable contract must contain or explicitly delegate:** Peer/group/scope selectors;
  authenticated identity binding; authorization policy reference; what a rejected or invisible recipient means.
  Documenting a selector does not grant access.

#### Membership timing

- **Decisions the machine-readable contract must contain or explicitly delegate:** Explicit recipients, a membership
  snapshot at dispatch/admission, or deliberately live membership. State how membership and authorization changes affect
  already accepted obligations. Finite “all” completion needs a fixed expected set or an explicit rule closing the set.

#### Dispatch

- **Decisions the machine-readable contract must contain or explicitly delegate:** Deliver independently to every
  selected recipient, select one, or create named branches. Define selection algorithm where callers rely on it, and
  partial dispatch outcomes.

#### Delivery and ownership

- **Decisions the machine-readable contract must contain or explicitly delegate:** Core/JetStream binding,
  stream/consumer references, online/offline behavior, receipt state, claim lifetime if used, reassignment and
  stale-owner/result handling.

#### Identity and correlation

- **Decisions the machine-readable contract must contain or explicitly delegate:** Operation identity, branch identity,
  intended recipient, delivery/attempt identity, result identity and causation. Retrying delivery must not accidentally
  create a new logical branch or another quorum vote.

#### Completion

- **Decisions the machine-readable contract must contain or explicitly delegate:** No application response,
  delivery/acceptance receipt, one terminal result, all-terminal, all-successful, first-success or a defined quorum.
  State the unit counted: distinct branches or distinct peers.

#### Time and failure

- **Decisions the machine-readable contract must contain or explicitly delegate:** Deadlines, retries, expiry,
  rejected/unreachable recipients, terminal failure, timeout versus unknown outcome, partial results, late results and
  impossibility of satisfying quorum.

#### Cancellation and closure

- **Decisions the machine-readable contract must contain or explicitly delegate:** Who may cancel; whether cancellation
  is advisory or acknowledged; what happens to remaining work after early completion; and whether a closed operation
  accepts late results. Cancellation does not undo completed effects.

#### Aggregation and composition

- **Decisions the machine-readable contract must contain or explicitly delegate:** Result schema and aggregation policy;
  stage/branch relationships; input/output mappings; ordering and idempotency expectations; pipeline recovery
  responsibilities.

#### Traceability

- **Decisions the machine-readable contract must contain or explicitly delegate:** Stable interaction identity/version;
  references to participating operations, schemas, subject families and policy definitions; generated documentation
  links.

Enterprise Integration Patterns provides useful established vocabulary. Recipient List separates determining recipients
from sending copies. Aggregator separates correlation, completeness and aggregation. Those are strong semantic
foundations, but the pattern descriptions are not themselves a NATS code-generation specification.
[Recipient List](https://www.enterpriseintegrationpatterns.com/patterns/messaging/RecipientList.html),
[Aggregator](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Aggregator.html),
[Scatter-Gather](https://www.enterpriseintegrationpatterns.com/patterns/messaging/BroadcastAggregate.html),
[Pipes and Filters](https://www.enterpriseintegrationpatterns.com/patterns/messaging/PipesAndFilters.html).

### Example: a multicast scatter-gather contract

As an illustrative contract, consider a review operation sent to a selected group:

1. Resolve and authorize the intended audience, then freeze the selected set for this operation.
2. Create an operation identity and a named branch for each selected peer, retaining its intended recipient.
3. Create independent delivery obligations for those branches, with the declared persistence/retry behavior.
4. Accept results only for recognized branches and authenticated assignments; count retries and duplicate results
   according to the branch's state.
5. Complete after successful terminal results from two distinct selected peers, or report an explicit
   deadline/impossibility outcome. This example chooses a peer-based quorum; other contracts may choose branch-based
   completion.
6. Return the specified partial-results envelope on timeout. Close result collection according to policy and explicitly
   request cancellation of unfinished work if the contract calls for it.

The quorum size in this example is illustrative. Empty or undersized audiences, early failures and a recipient
disappearing must have declared outcomes. A storage acknowledgment or “accepted” receipt cannot count as a successful
review result. No runtime behavior implementing this example has been built or verified here.

### Broker semantics must remain accurate

- A Core queue group selects one matching member per message, but independent subscribers and other queue groups may
  also receive copies. It is not a statement that the entire system has only one recipient.
  [Queue groups](https://docs.nats.io/learn/core-nats/queue-groups).
- A work-queue stream is not a substitute for independent fan-out: overlapping consumer filters are restricted, and
  acknowledgment removes work under its retention semantics. Independent logical recipients need separate delivery
  state.
  [Stream retention](https://github.com/nats-io/nats.docs/blob/master/nats-concepts/jetstream/streams.md#retentionpolicy).
- Interest retention does not preserve a message for an audience that has not established consumer interest. Limits can
  also remove messages before every recipient completes. An offline-delivery promise therefore needs deliberate consumer
  lifecycle and retention design. [Retention policies](https://docs.nats.io/learn/jetstream/retention-policies).
- Native scatter-gather can collect multiple responders through a reply inbox. It does not discover a closed authorized
  recipient set or implement the declared branch/quorum policy.
  [Scatter-gather](https://docs.nats.io/learn/core-nats/scatter-gather).

### Revised standards fit

AsyncAPI remains a useful description of participating operations and messages, but its standard operation/reply objects
do not supply this entire audience/branch/claim/completion model. A documented extension/profile or a separate linked
interaction specification is necessary for the proposed semantics. An arbitrary pattern tag that generic tools ignore is
insufficient for code generation.

xRegistry's endpoint specification explicitly leaves request/response and scatter/gather correlation contracts out of
scope. It can catalog the related endpoints and message definitions, but it does not replace the required interaction
model. [Endpoint scope](https://github.com/xregistry/spec/blob/v1.0-rc4/endpoint/spec.md).

Open Workflow Specification is a relevant complementary candidate when executable composition is desired: it defines
concurrent forks, competing branches, event listening, timeouts and workflow/task lifecycle concepts. Those features
warrant evaluation against the required completion rules; their presence does not establish native NATS peer membership,
authorized audiences or durable per-peer claims.
[Workflow DSL reference](https://github.com/open-workflow-specification/specification/blob/main/dsl-reference.md).

This changes the evaluation gate: tools must be assessed for **subject grammar plus interaction-contract preservation**.
Generated Rust/TypeScript may initially expose typed descriptors, audience/branch/result models and documentation.
Helpers that execute fan-out, claim work or aggregate results need an implementing runtime and behavioral evidence.
Unsupported required semantics should fail generation or be reported explicitly; they must not silently become ordinary
pub/sub or a first-response request.
