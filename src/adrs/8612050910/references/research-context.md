# Research context and evidence

Research snapshot: 2026-11-01. This material supports the Draft [ADR#8612050910](../README.md). Proposed semantics are
distinct from verified standard or product capabilities. See the [reading guide](./README.md).

Research date: **2026-11-01**. Purpose: a technology landscape and discussion paper for a self-contained NATS contract
that can generate subject APIs in **Rust and TypeScript**, preserve declared messaging topology semantics, and remain
directly usable as documentation when generation is unnecessary. This is research, not an implementation decision.

## Findings to discuss

**[xRegistry](https://github.com/xregistry/spec) is the relevant CloudEvents-origin registry project.** Its own
documentation says it originated inside CloudEvents and became a separate project in April 2023. Its website explicitly
identifies the shared community. It describes endpoints, messages, and schemas, which is relevant to endpoint and
message discovery. [Project history](https://github.com/xregistry/spec), [xRegistry website](https://xregistry.io/).

**[Arazzo](https://spec.openapis.org/arazzo/latest.html)** is another adjacent specification. That is an OpenAPI
Initiative specification for API workflows, not the CloudEvents registry project.
**[Eraser](https://www.eraser.io/diagramgpt)** is a separate diagramming product. These projects address different
description and presentation concerns.

**AsyncAPI is the strongest default for application messaging contracts.** The current specification is **3.1.0**. Its
NATS binding is **0.1.0** and defines operation-level queue metadata; the server, channel, and message bindings remain
reserved. A released, widely supported specification can still have a narrow broker binding. JetStream streams,
consumers, retention, acknowledgment policies, account imports/exports, and server links need additional descriptions.
[Specification releases](https://github.com/asyncapi/spec/releases),
[NATS binding](https://github.com/asyncapi/bindings/blob/master/nats/README.md).

**No complete, ready-made NATS topology documentation solution emerged from this research.** The promising choices cover
different layers. A practical approach combines application contracts, human-facing architecture documentation, native
configuration, and observed runtime state. This is an assessment of the documented capabilities below, not a claim that
every product on the internet has been exhaustively inspected.

For the clarified outcome, the proposed direction is **a self-contained messaging and interaction contract**, using
AsyncAPI for operations/messages where appropriate and a formally specified interaction model for the required patterns.
It needs an explicit NATS binding/profile and optional Rust/TypeScript generation. No surveyed generator has proved the
complete interaction coverage. EventCatalog, Backstage and runtime topology products are secondary presentation or
verification tools. xRegistry remains relevant for standardized metadata discovery; workflow standards deserve
evaluation for executable composition.

## Scope and evidence

The survey covers directly relevant standards, authoring and publishing tools, registries, NATS administration and
discovery, declarative configuration, contract testing, code-first documentation, architecture diagramming, and relevant
legacy or adjacent projects. It prioritizes official specifications, project repositories, and vendor documentation. It
does not enumerate every generic wiki, tracing backend, language SDK, or product with a diagram editor.

Capabilities were checked against public documentation. Tools were **not installed or exercised against a NATS
deployment**. A documented connector is evidence of claimed support, not proof of compatibility with the target
authentication, server version, language, or scale. Latest versions are stated where they materially affect the choice;
otherwise the assessment concerns the product or project family, not a particular binary.

For continuing discovery, the official [AsyncAPI tools directory](https://www.asyncapi.com/tools),
[NATS ecosystem reference](https://docs.nats.io/concepts/ecosystem), and
[NATS downloads/add-ons directory](https://nats.io/download/) are useful indexes. Directory inclusion is a lead, not a
maintenance or compatibility guarantee.

Maturity labels are editorial assessments:

### Established

- **Meaning in this report:** Released specification or substantial tool ecosystem with maintained documentation and an
  identifiable operational role. This does not imply complete NATS support.

### Specialist

- **Meaning in this report:** Usable, focused project with a narrower scope or support base. Validate the exact feature
  set before depending on it.

### Emerging

- **Meaning in this report:** Release candidate, newer implementation, experimental feature, or limited interoperability
  evidence.

### Legacy

- **Meaning in this report:** Archived project or tooling aimed at an older NATS subsystem.

### Unverified fit

- **Meaning in this report:** Product exists, but the NATS capability needed here was not established from primary
  sources.

Foundation project status, specification stability, implementation maturity, and NATS integration maturity are separate
signals. For example, CloudEvents is CNCF Graduated, xRegistry identifies itself as Sandbox, and Apicurio's recent
Sandbox admission does not mean its registry software was newly invented. [CloudEvents](https://cloudevents.io/),
[xRegistry](https://xregistry.io/), [Apicurio CNCF entry](https://www.cncf.io/projects/apicurio-registry/).

## What “NATS topology” needs to describe

We should decide which questions the documentation must answer before selecting a renderer. The following is a proposed
requirements model.

### Application contracts

- **Questions to answer:** What can this service send and receive? How do I call it?
- **Required information:** Subjects and subject parameters, messages, schemas, headers, send/receive direction,
  request/reply contracts, correlation, examples, errors, versioning.

### Logical architecture

- **Questions to answer:** Who produces and consumes each message, and why?
- **Required information:** Services, domains, owners, commands/events/queries, channels, dependencies, workflows,
  lifecycle, documentation links.

### Delivery and persistence

- **Questions to answer:** What is retained? How is it consumed and retried?
- **Required information:** Core versus JetStream, stream subject sets, durable consumers, pull/push behavior, filters,
  acknowledgment and redelivery policies, retention, limits, replicas, placement, mirrors/sources, transforms.

### Account and authorization boundaries

- **Questions to answer:** Which identities can cross which boundaries?
- **Required information:** Accounts, imports/exports, subject mappings, publish/subscribe permissions, response
  permissions, connection identity references. Keep credentials out of the documentation.

### Physical deployment

- **Questions to answer:** How are servers and regions connected?
- **Required information:** Servers, clusters, routes, gateways, leaf nodes, regions, JetStream domains, deployment
  ownership and environment.

### Observed behavior

- **Questions to answer:** What exists now, what has been seen, and what differs from the intended design?
- **Required information:** Discovery snapshots, active connections/subscriptions, deployed configurations, traffic
  observations, traces, timestamps, access scope and provenance.

These distinctions reflect NATS's separate Core, JetStream, services, security, and deployment surfaces.
[NATS learning map](https://docs.nats.io/learn/),
[monitoring endpoints](https://docs.nats.io/learn/monitoring/monitoring-endpoints).

### Why automatic discovery cannot supply the entire contract

NATS subjects do not require advance declaration. A subject pattern can express a large family of possible addresses.
Watching messages or subscriptions can reveal traffic and interest, but cannot establish every valid address, inactive
producer, payload variant, owner, or business guarantee. A publisher may also be authorized to send messages it has
never sent during the observation window. These are consequences of NATS's subject model, not shortcomings a dashboard
can remove. [Subjects and wildcards](https://docs.nats.io/learn/core-nats/subjects-and-wildcards).

Use runtime discovery to check and enrich intended documentation. Label **declared**, **configured**, and **observed**
relationships separately. A missed observation must not erase a declared relationship.
