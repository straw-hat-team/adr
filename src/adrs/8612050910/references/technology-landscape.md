# Technology landscape, maturity and licensing

Research snapshot: 2026-11-01. This material supports the Draft [ADR#8612050910](../README.md). Proposed semantics are
distinct from verified standard or product capabilities. See the [reading guide](./README.md).

## Standards and description formats

### [AsyncAPI](https://www.asyncapi.com/docs/reference/specification/v3.1.0)

- **What it describes:** Application channels, messages, operations, schemas, security and replies.
- **NATS fit and important gaps:** Best general contract interchange choice. Documents the application's behavior; does
  not assume or fully describe deployment topology.
- **Maturity and access:** **Established.** Released 3.1.0; Apache-2.0 specification.

### [AsyncAPI NATS binding](https://github.com/asyncapi/bindings/blob/master/nats/README.md)

- **What it describes:** Protocol-specific NATS operation metadata.
- **NATS fit and important gaps:** Version 0.1.0 defines `queue` and `bindingVersion`. No native JetStream resource
  model. Generic AsyncAPI fields remain useful independently.
- **Maturity and access:** **Specialist, limited coverage.** Official binding, sparse compared with NATS's full surface.

### [xRegistry](https://github.com/xregistry/spec)

- **What it describes:** Extensible, versioned metadata with corresponding document and REST API representations.
- **NATS fit and important gaps:** Strong basis for message/schema/endpoint discovery across systems. Does not
  automatically inspect a NATS estate.
- **Maturity and access:** **Emerging standard.** Latest listed release 1.0-rc4; Apache-2.0; CNCF Sandbox.

### [xRegistry Endpoint Registry](https://github.com/xregistry/spec/blob/v1.0-rc4/endpoint/spec.md)

- **What it describes:** Abstract or concrete endpoints and their relationships to message definitions.
- **NATS fit and important gaps:** Explicit Core NATS publish subjects, subscription filters and queue groups.
  Request/response interaction contracts are outside this endpoint model's scope.
- **Maturity and access:** **Emerging.** Released as 1.0-rc4.

### [xRegistry Message Definitions Registry](https://github.com/xregistry/spec/blob/v1.0-rc4/message/spec.md)

- **What it describes:** Message metadata, payload-schema associations and protocol/envelope information.
- **NATS fit and important gaps:** NATS protocol metadata includes subject, reply-to and headers. Can describe
  non-CloudEvents messages.
- **Maturity and access:** **Emerging.** Released as 1.0-rc4.

### [xRegistry Schema Registry](https://github.com/xregistry/spec/blob/v1.0-rc4/schema/spec.md)

- **What it describes:** Schema identity, versions, formats and metadata.
- **NATS fit and important gaps:** Reusable schema catalog independent of NATS transport. Does not establish stream
  retention or consumer behavior.
- **Maturity and access:** **Emerging.** Domain specification released as 1.0-rc4; source checked 2026-11-02.

### [CloudEvents](https://cloudevents.io/)

- **What it describes:** Common event envelope and context attributes.
- **NATS fit and important gaps:** Useful for shared event identity, type, source and schema references. It is not a
  topology description or application API catalog.
- **Maturity and access:** **Established.** Released 1.0.2; CNCF Graduated.

### [CloudEvents NATS binding](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/nats-protocol-binding.md)

- **What it describes:** How CloudEvents map onto NATS messages.
- **NATS fit and important gaps:** Standardizes envelope transport. Does not define delivery settlement or the service
  graph.
- **Maturity and access:** **Established transport specification.** Use a released binding rather than copying the
  working draft.

### [OpenAPI](https://spec.openapis.org/oas/v3.2.1.html)

- **What it describes:** HTTP API descriptions.
- **NATS fit and important gaps:** Appropriate for an HTTP gateway or registry API around NATS. Native NATS
  request/reply is not an HTTP API.
- **Maturity and access:** **Established.** Current published specification checked: 3.2.1.

### [JSON Schema](https://json-schema.org/specification)

- **What it describes:** JSON payload structure and validation.
- **NATS fit and important gaps:** Good payload contract foundation. Pin the dialect supported by the chosen AsyncAPI
  parser, registry and validator.
- **Maturity and access:** **Established.** Current published dialect: 2020-12; tool dialect support varies.

### [Protocol Buffers](https://protobuf.dev/overview/)

- **What it describes:** Typed payloads, serialization and generated language models.
- **NATS fit and important gaps:** Appropriate when messages already use Protobuf. A `.proto` does not associate a type
  with a NATS subject or consumer.
- **Maturity and access:** **Established.** Substantial language/tool ecosystem.

### [Apache Avro](https://avro.apache.org/)

- **What it describes:** Payload serialization and schema evolution.
- **NATS fit and important gaps:** Another payload layer, often used with registries. Requires separate subject and
  endpoint associations.
- **Maturity and access:** **Established.** Apache project; not a NATS topology standard.

### [Open Data Contract Standard](https://github.com/bitol-io/open-data-contract-standard)

- **What it describes:** Data-product contracts, schema, quality, ownership and service expectations.
- **NATS fit and important gaps:** Optional governance layer for streams treated as data products. Not a substitute for
  messaging operations or NATS configuration.
- **Maturity and access:** **Specialist.** Released standard maintained through Bitol; assess only if data governance is
  in scope.

### [CloudEvents Subscriptions API](https://github.com/cloudevents/spec/blob/main/subscriptions/spec.md)

- **What it describes:** Subscription-management conventions and APIs around CloudEvents delivery.
- **NATS fit and important gaps:** Recognizes native NATS subscription mechanisms. Does not inventory application
  contracts, streams or server links.
- **Maturity and access:** **Emerging working draft.** Current document identifies itself as 0.1-wip. CloudEvents
  graduation does not make this sub-specification stable.

### [Arazzo](https://spec.openapis.org/arazzo/latest.html)

- **What it describes:** Sequences of API calls and dependencies that achieve an outcome.
- **NATS fit and important gaps:** Useful adjacent workflow-description concept. No native NATS topology model was
  established.
- **Maturity and access:** **Specialist released specification.** Current published version checked: 1.1.0; OpenAPI
  Initiative.

### [Open Workflow Specification](https://github.com/open-workflow-specification/specification)

- **What it describes:** Executable service/event workflows, including CloudEvents integration. Formerly Serverless
  Workflow.
- **NATS fit and important gaps:** Describes orchestration behavior rather than the complete NATS estate. Broker
  integration depends on the chosen runtime.
- **Maturity and access:** **Specialist ecosystem.** Specification, SDKs, runtimes and conformance tooling; not a
  drop-in topology document.

### AsyncAPI and xRegistry are complementary

AsyncAPI's useful organizing unit is the **application API**. An application can declare what it sends and receives,
including request/reply operations. Across services, those descriptions can be assembled into a larger picture. Avoid
assuming that a sender's document also declares every receiver.
[AsyncAPI specification](https://www.asyncapi.com/docs/reference/specification/v3.1.0).

xRegistry's useful organizing unit is **discoverable, versioned metadata**. Its core model can back a local document,
static publication, or registry service. Endpoint, message, and schema registries provide reusable associations without
requiring a particular broker or language.
[xRegistry introduction](https://github.com/xregistry/spec/blob/main/core/primer.md).

For Core NATS, xRegistry's released endpoint model explicitly distinguishes a concrete publish `subject` from a
subscriber `subjectfilter`, with `queuegroup` accompanying a filter. This is a meaningful NATS-specific capability. It
still does not standardize JetStream streams, consumers, acknowledgment policies or physical server links.
[Released endpoint specification](https://github.com/xregistry/spec/blob/v1.0-rc4/endpoint/spec.md#nats-options).

Do not infer that the metadata format's NATS support guarantees a NATS code generator. The current **xrcg** README lists
several protocols and AsyncAPI output, but does **not list NATS** among its supported transport targets. Its AsyncAPI
generation provides a possible integration path, whose preservation of NATS metadata would need verification.
[Code-generation support](https://github.com/xregistry/codegen).

## Catalogs, documentation portals, and API design products

### [EventCatalog](https://www.eventcatalog.dev/integrations)

- **Role and NATS relevance:** Architecture-oriented documentation for domains, services, messages, channels and
  ownership. AsyncAPI imports connect producers and consumers.
- **Maturity evidence and limitations:** **Established product; NATS integration needs evaluation.** Strong candidate
  for human navigation. The checked integration list did not establish a direct NATS broker discovery connector.
  AsyncAPI import and SDK integration are different capabilities.
- **Licensing or operating model:** **v5 core: BSL 1.1, source-available.** Earlier releases MIT; selected
  packages/integrations MIT. See licensing discussion below.

### [Backstage](https://backstage.io/docs/features/software-catalog/descriptor-format/)

- **Role and NATS relevance:** Developer portal with owned APIs, components, resources and dependency relationships.
  Supports AsyncAPI definitions in API entities.
- **Maturity evidence and limitations:** **Established platform.** Attractive if already operated. Modeling NATS
  streams/accounts as resources and importing live state requires conventions or integration work.
- **Licensing or operating model:** Open-source platform; operating and plugin maintenance costs remain.

### [Bump.sh](https://docs.bump.sh/guides/asyncapi/)

- **Role and NATS relevance:** Hosted API reference documentation and change management for AsyncAPI and other API
  formats.
- **Maturity evidence and limitations:** **Established specialist service.** Good for publishing contracts and reviewing
  API changes. Does not supply a NATS deployment graph by itself.
- **Licensing or operating model:** Commercial hosted product; evaluate current plan and private-documentation
  requirements.

### [Swagger Studio / SwaggerHub](https://support.smartbear.com/swagger/studio/docs/en/asyncapi-support.html)

- **Role and NATS relevance:** Collaborative AsyncAPI editing, registry and documentation in the SmartBear ecosystem.
- **Maturity evidence and limitations:** **Established commercial product.** Docs explicitly support AsyncAPI 2.6.x,
  3.0.x and 3.1.x. They explicitly exclude AsyncAPI code generation, mocking and contract testing.
- **Licensing or operating model:** Commercial product. Documentation support must not be interpreted as NATS execution
  support.

### [Solace Event Portal](https://docs.solace.com/Cloud/Event-Portal/event-portal-overview.htm)

- **Role and NATS relevance:** Event catalog, graphical design, runtime discovery, governance and AsyncAPI export.
- **Maturity evidence and limitations:** **Established event platform; unverified NATS fit.** Official external-broker
  setup selects Solace or Kafka. No native NATS discovery connector was established.
- **Licensing or operating model:** Commercial SaaS/platform. Best evaluated for a broader event estate, not assumed to
  be a NATS-native catalog.

### [Gravitee](https://www.gravitee.io/blog/exposing-nats-to-external-consumers)

- **Role and NATS relevance:** API management and external access around event systems. Its NATS gateway integration
  bridges to REST, SSE and WebSockets.
- **Maturity evidence and limitations:** **Established platform; specialist NATS integration.** Useful when exposing
  governed APIs. A gateway connection does not document every internal NATS producer/consumer relationship.
- **Licensing or operating model:** Community/commercial product mix; check the edition containing the required
  connector and portal features.

Solace's broker limitation above is based on its current
[external broker connection guide](https://docs.solace.com/Cloud/Event-Portal/event-portal-setup-ema-connection.htm),
rather than assuming that protocol-agnostic event modeling implies automatic NATS discovery.

### EventCatalog's current licensing matters

The September 2026 v5 announcement changed the comparison. Core v5 is BSL 1.1 and is explicitly described by the
maintainer as source-available rather than OSI open source. Earlier MIT releases remain available. The current grant
includes qualifying free use, commercial licensing for other production use, and separate treatment of hosted offerings.
Its MIT exceptions include SDK, CLI, connectors and other listed packages.
[v5 announcement](https://www.eventcatalog.dev/blog/eventcatalog-v5),
[current license](https://www.eventcatalog.dev/license).

Consequently, evaluate the intended organizational use and exact version before calling EventCatalog “free open source.”
The license page is the authoritative source for terms; an older article about MIT licensing is not evidence about v5.
This report does not assign a subscription price.

## Authoring, validation, rendering, and generation tools

These are components of a documentation workflow. None alone is a complete topology catalog.

### [AsyncAPI Studio](https://github.com/asyncapi/studio)

- **Useful contribution:** Edit and preview AsyncAPI contracts, including referenced documents.
- **Maturity and NATS caveat:** **Established ecosystem tool.** Authoring experience, not runtime NATS discovery.

### [AsyncAPI CLI](https://github.com/asyncapi/cli)

- **Useful contribution:** Validate documents and automate common contract/documentation tasks in CI.
- **Maturity and NATS caveat:** **Established ecosystem tool.** Check the exact CLI/parser combination against the
  selected specification version.

### [AsyncAPI Parser](https://github.com/asyncapi/parser-js)

- **Useful contribution:** Parse, resolve and validate contracts for custom tooling.
- **Maturity and NATS caveat:** **Established library.** Does not validate that a live service obeys its declared
  operations.

### [AsyncAPI Generator](https://github.com/asyncapi/generator)

- **Useful contribution:** Template-driven generation of documentation and other artifacts.
- **Maturity and NATS caveat:** **Established framework; template maturity varies.** Some official transport templates
  are archived. Select templates individually.

### [AsyncAPI HTML template](https://github.com/asyncapi/html-template)

- **Useful contribution:** Generate static reference documentation.
- **Maturity and NATS caveat:** **Established specialist.** Low infrastructure overhead; no global ownership or live
  deployment graph without added structure.

### [AsyncAPI React / Web Component](https://github.com/asyncapi/asyncapi-react)

- **Useful contribution:** Embed contract reference documentation in a portal or existing site.
- **Maturity and NATS caveat:** **Established specialist.** Useful rendering component; not an application catalog or
  NATS client.

### [Modelina](https://github.com/asyncapi/modelina)

- **Useful contribution:** Generate typed payload models from schema and API inputs.
- **Maturity and NATS caveat:** **Established specialist.** Payload generation does not imply complete NATS or JetStream
  client generation.

### [AsyncAPI Diff](https://github.com/asyncapi/diff)

- **Useful contribution:** Compare contracts and classify changes as breaking, non-breaking or unclassified.
- **Maturity and NATS caveat:** **Specialist.** Inputs must be valid and dereferenced. Verify classification for the
  chosen AsyncAPI version and the required direction-specific compatibility policy.

### [Spectral](https://github.com/stoplightio/spectral)

- **Useful contribution:** Lint JSON/YAML and enforce naming, ownership and extension rules. Includes AsyncAPI rulesets.
- **Maturity and NATS caveat:** **Established.** Good place for a NATS documentation profile. Generic linting cannot
  prove wildcard routing, authorization or delivery correctness without additional logic.

### [xRegistry server and `xr` CLI](https://github.com/xregistry/server)

- **Useful contribution:** Reference metadata server and client for publishing and managing registry contents.
- **Maturity and NATS caveat:** **Emerging.** README explicitly identifies the implementation as work in progress. Do
  not treat reference status as an operational support commitment.

### [xRegistry Viewer](https://github.com/xregistry/viewer)

- **Useful contribution:** Browse registry groups, resources, versions and documents through a model-driven UI.
- **Maturity and NATS caveat:** **Emerging.** A useful registry browser. A business service-dependency map or live NATS
  graph was not established.

### [xRegistry Code Generation CLI, `xrcg`](https://github.com/xregistry/codegen)

- **Useful contribution:** Work with registry definitions and generate SDK projects or AsyncAPI/OpenAPI documents.
- **Maturity and NATS caveat:** **Emerging specialist.** Current README lists AsyncAPI 3.0 output. NATS transport
  generation is not advertised in its support list.

### [TypeSpec AsyncAPI emitter](https://tsp-asyncapi.marvinhsu.dev/)

- **Useful contribution:** Author typed API definitions and emit AsyncAPI 3.1, including NATS bindings and payload
  schema outputs.
- **Maturity and NATS caveat:** **Emerging community tooling.** Potentially reduces hand-authored duplication; validate
  emitter version, schema semantics and NATS details. This is a community emitter, not assumed to be an official NATS
  tool.

### Code-first documentation options

#### [FastStream](https://faststream.ag2.ai/)

- **What is available:** Python event-service framework with NATS and automatic AsyncAPI documentation. Its publisher
  API exposes documentation and schema parameters.
- **Fit and maturity:** **Established specialist framework.** Strong option if Python services already use it. Its
  generated API description still needs deployment and ownership context.
  [NATS publisher API](https://faststream.ag2.ai/latest/api/faststream/nats/NatsPublisher/).

#### [nestjs-asyncapi](https://github.com/flamewow/nestjs-asyncapi)

- **What is available:** Decorator-based AsyncAPI 3.0 documentation and rendered output for NestJS services.
- **Fit and maturity:** **Specialist.** Useful for existing NestJS applications. Current explicit channel-binding
  features name Kafka and AMQP; native NATS details should be checked rather than presumed.

#### [Springwolf](https://www.springwolf.dev/)

- **What is available:** Code-first AsyncAPI v3 documentation for Spring Boot applications.
- **Fit and maturity:** **Established specialist in Spring.** No NATS-specific automatic integration was established in
  this survey. Relevant if annotations or custom integration are acceptable.

#### [RustStream NATS](https://docs.rs/ruststream-nats/latest/ruststream_nats/)

- **What is available:** Rust framework integration advertises NATS server/channel/operation/reply contributions to
  generated AsyncAPI through a feature flag.
- **Fit and maturity:** **Emerging.** Interesting Rust-specific lead, not enough evidence here to recommend adopting a
  runtime framework solely for documentation.

#### [Crustagen](https://github.com/Programmierpraktikum-MVA/AsyncAPI)

- **What is available:** Rust code-generation project whose README limits support to one server and NATS.
- **Fit and maturity:** **Emerging/prototype evidence.** An implementation lead, not a proven general
  contract-generation foundation.

For an existing mixed-language system, prefer a common contract format over requiring all services to migrate to one
framework. Code-first generators should derive only what their inputs actually know. Business ownership, delivery
guarantees, import/export boundaries and inactive deployments need authoritative sources of their own.

There is also a schema-dialect boundary: AsyncAPI 3.1's mandatory schema support includes JSON Schema Draft-07, while
JSON Schema's current published dialect is 2020-12. A validator supporting one does not automatically establish support
for the other. Check schema-format declarations and parser/generator support before reusing a schema unchanged.
[AsyncAPI schema formats](https://www.asyncapi.com/docs/reference/specification/v3.1.0),
[JSON Schema versions](https://json-schema.org/specification).

## Schema registries

Schema storage, schema discovery and schema enforcement are different capabilities. A registry is useful even when the
broker transports opaque bytes, but client libraries or another explicit enforcement point must actually apply its
rules.

### [Apicurio Registry](https://www.apicur.io/registry/docs/apicurio-registry/3.1.x/index.html)

- **Relevant capability:** Stores schemas and API designs; offers a UI, API and evolution rules. Supported artifact
  families include AsyncAPI, OpenAPI, JSON Schema, Avro and Protobuf.
- **Maturity and NATS fit:** **Established registry.** Useful broker-independent metadata layer, Apache-2.0. Do not
  assume its Kafka serializers automatically validate NATS traffic.
  [Project](https://github.com/Apicurio/apicurio-registry),
  [supported artifact overview](https://www.cncf.io/projects/apicurio-registry/).

### [Synadia Schema Registry](https://docs.synadia.com/platform/schema-registry)

- **Relevant capability:** NATS-native schema service with Control Plane integration and client-side payload validation.
- **Maturity and NATS fit:** **Specialist commercial-platform component.** Documented architecture uses a NATS
  microservice, KV backing and account isolation. Client documentation currently lists Go libraries; Rust parity was not
  established. [Architecture](https://docs.synadia.com/platform/schema-registry/architecture),
  [clients](https://docs.synadia.com/platform/schema-registry/clients).

### [Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)

- **Relevant capability:** Schema identity, evolution and compatibility in a large streaming ecosystem.
- **Maturity and NATS fit:** **Established.** This can be an existing organization-wide schema source. It does not
  discover NATS topology; serializers, wire conventions and integration require explicit decisions. Licensing differs by
  component/offering.

### [Buf Schema Registry](https://buf.build/docs/bsr/)

- **Relevant capability:** Protobuf module hosting, documentation and schema workflows.
- **Maturity and NATS fit:** **Established specialist.** Especially relevant for Protobuf-heavy systems. Describes
  payload modules rather than NATS subject, account or consumer associations.

### [Redpanda Schema Registry](https://docs.redpanda.com/streaming/current/manage/schema-reg/)

- **Relevant capability:** Schema registry in the Redpanda streaming platform.
- **Maturity and NATS fit:** **Established streaming product; adjacent fit.** Useful if already authoritative for
  schemas. Not a native NATS topology documentation layer.

### [Karapace](https://github.com/Aiven-Open/karapace)

- **Relevant capability:** Kafka-oriented schema registry and REST tooling.
- **Maturity and NATS fit:** **Established specialist.** A registry alternative, not a NATS topology tool; introduces
  Kafka-oriented assumptions to evaluate.

### [AxonOps Schema Registry](https://github.com/axonops/axonops-schema-registry)

- **Relevant capability:** Confluent-compatible registry advertising Avro, Protobuf and JSON Schema with no Kafka
  dependency.
- **Maturity and NATS fit:** **Emerging alternative.** Apache-2.0; broader NATS documentation or client integration was
  not established.

### [NATS ecosystem schemas / `jsm.go`](https://github.com/nats-io/jsm.go)

- **Relevant capability:** JSON Schemas for JetStream management messages, server events and advisories, accessible
  through NATS tooling.
- **Maturity and NATS fit:** **Established native foundation.** These describe NATS's management API and events. They
  are not an automatically populated application-event registry.

xRegistry belongs in this category as a **registry interoperability specification**, while its server and viewer are
implementations. Apicurio, Confluent, Synadia and Buf are products or projects. Supporting schemas does not by itself
make any one of them xRegistry-compatible; that capability must be verified separately.

## NATS runtime discovery and operational visibility

### [NATS CLI](https://github.com/nats-io/natscli)

- **What it can contribute to documentation:** Inspect streams/consumers, query servers, inspect services and collect
  administrative facts for snapshots.
- **Maturity and limits:** **Established, official.** Strong extraction baseline. Does not infer business meaning or all
  possible publishers.

### [Monitoring endpoints](https://docs.nats.io/learn/monitoring/monitoring-endpoints)

- **What it can contribute to documentation:** Server, connection, route and JetStream state; related endpoints cover
  other server-link surfaces.
- **Maturity and limits:** **Established native interface.** Per-server snapshots require appropriate coverage,
  pagination and permissions. Not a contract format.

### [NATS Services / micro framework](https://docs.nats.io/learn/services/)

- **What it can contribute to documentation:** Named/versioned request-reply services with discoverable endpoints and
  statistics.
- **Maturity and limits:** **Established native convention.** Captures participating services, not arbitrary pub/sub
  applications.
  [Implemented Service API ADR](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-32.md).

### [NATS distributed message tracing](https://nats.io/blog/nats-server-2.11-release/)

- **What it can contribute to documentation:** Trace selected messages through routes, gateways, leaf nodes and account
  import/export paths.
- **Maturity and limits:** **Established server feature introduced in 2.11.** Helps verify a path. A successful trace
  does not enumerate every possible path or establish a payload contract.

### [NATS Surveyor](https://github.com/nats-io/nats-surveyor)

- **What it can contribute to documentation:** Collects deployment-wide server statistics over NATS for Prometheus, with
  account and JetStream options.
- **Maturity and limits:** **Established official tool.** README reports extensive Synadia use. Requires a system
  account. Monitoring data needs a separate presentation and contract model.

### [Prometheus NATS Exporter](https://github.com/nats-io/prometheus-nats-exporter)

- **What it can contribute to documentation:** Exports monitoring metrics for dashboards and alerting.
- **Maturity and limits:** **Established official tool.** Operational health rather than application API documentation.

### [Prometheus / Grafana](https://docs.nats.io/learn/monitoring/prometheus-and-dashboards)

- **What it can contribute to documentation:** Operational dashboards around exported metrics.
- **Maturity and limits:** **Established ecosystem.** Retains measurements and helps inspection; a metrics dashboard is
  not an authoritative producer/consumer contract.

### [Synadia Control Plane](https://docs.synadia.com/platform/control-plane)

- **What it can contribute to documentation:** UI/API for accounts, users, connections and JetStream administration.
- **Maturity and limits:** **Established vendor platform.** Strong operational inventory candidate; does not replace
  domain descriptions or API contracts. [Platform FAQ](https://docs.synadia.com/platform/faq).

### [Synadia Insights](https://www.synadia.com/insights)

- **What it can contribute to documentation:** Advertises a time-series graph of connections, streams, consumers and
  accounts, with historical investigation and checks.
- **Maturity and limits:** **Specialist vendor product.** One of the strongest documented runtime-topology fits. Export
  format, automation, retention and contract reconciliation need evaluation.

### [NUI](https://github.com/nats-nui/nui)

- **What it can contribute to documentation:** Open-source desktop/web GUI for Core messaging, request/reply, streams,
  messages and KV. Can decode supplied schemas.
- **Maturity and limits:** **Specialist community tool.** Good hands-on inspection. Its README leaves server metrics
  among future items; do not promise a complete cluster graph. Unlicense.

### [Qaze](https://qaze.app/)

- **What it can contribute to documentation:** Commercial desktop GUI with streams, services, stores, cluster health,
  visual topology and leaf/gateway diagnostics.
- **Maturity and limits:** **Specialist vendor tool.** Directly relevant for physical topology inspection.
  Machine-readable documentation export was not established.

### [Hyerix](https://docs.hyerix.ai/docs/features/topology)

- **What it can contribute to documentation:** Desktop NATS tooling with an interactive graph from
  monitoring/system-account discovery.
- **Maturity and limits:** **Emerging specialist.** Strong documented topology feature, but this survey did not
  establish long-term adoption or export interoperability. Validate discovery prerequisites and exact license/build.

### [NATS Desktop](https://github.com/thedataflows/nats-desktop)

- **What it can contribute to documentation:** Community desktop GUI advertising cluster topology, stream relationships,
  services and management.
- **Maturity and limits:** **Emerging specialist.** MIT. Broad README claims need practical verification; maintainer
  explicitly cautions that responses may be slow and new feature requests may not be accepted.

### [nats-top](https://github.com/nats-io/nats-top)

- **What it can contribute to documentation:** Terminal monitoring for servers and client connections.
- **Maturity and limits:** **Established narrow tool.** Useful diagnostic view, not a durable architecture catalog.

The native tool ecosystem is summarized in the official
[NATS ecosystem reference](https://docs.nats.io/concepts/ecosystem). GUI claims here are taken from the products' own
documentation, not benchmarked against one another.

### Discovery boundaries worth preserving

The NATS Service API supplies names, versions, metadata, endpoint subjects and statistics through discovery conventions.
That is a useful bridge between running services and a catalog. It covers services that implement the convention; it
does not make every raw subscription self-documenting.
[Service API](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-32.md).

Likewise, Hyerix's documented topology view needs monitoring endpoints and system-account access for multi-server
discovery. Missing access reduces the visible picture. Treat the same class of limitation explicitly in any extractor:
which servers/accounts were reachable, which APIs succeeded, and when the view was captured.
[Hyerix topology requirements](https://docs.hyerix.ai/docs/features/topology).

A broker path and an application processing path are different views. NATS message tracing can expose broker routing;
application instrumentation is needed to connect message receipt with later business work or another publication.
[NATS tracing introduction](https://nats.io/blog/nats-server-2.11-release/).

## Declarative configuration as documentation input

These tools describe deployed intent more accurately than prose copies of stream settings. They should feed the
documentation rather than compete with it as manually maintained duplicates.

### Native stream/consumer configurations and JetStream API schemas

- **Coverage:** Exact resource settings exposed through NATS management APIs and tooling.
- **Maturity and constraints:** **Established foundation.** Pair the configuration with the relevant server/schema
  version. Use the [NATS CLI](https://github.com/nats-io/natscli) and
  [jsm.go schemas](https://github.com/nats-io/jsm.go).

### [NACK](https://github.com/nats-io/nack)

- **Coverage:** Kubernetes resources for streams and consumers; control-loop mode adds KV, Object Store and account
  connection resources.
- **Maturity and constraints:** **Established project with experimental controller mode.** README distinguishes
  legacy/default and control-loop behavior. Coverage depends on mode; resources are expected to be managed exclusively
  by NACK.

### [NATS JetStream Terraform provider](https://github.com/nats-io/terraform-provider-jetstream)

- **Coverage:** Streams, consumers, KV buckets/entries and Object Store buckets.
- **Maturity and constraints:** **Specialist official provider.** README says version 0.2.0 onward requires NATS Server
  2.11 or newer. It does not document application payloads or service ownership.

### [Official Helm charts](https://github.com/nats-io/k8s)

- **Coverage:** Deployment configuration for NATS and supporting components.
- **Maturity and constraints:** **Established native ecosystem.** Infrastructure intent, not a message catalog. Confirm
  generated configuration and actual deployment agree.
  [Official ecosystem listing](https://docs.nats.io/concepts/ecosystem).

### [NSC](https://github.com/nats-io/nsc)

- **Coverage:** Operator/account/user access configuration in NATS's decentralized security model.
- **Maturity and constraints:** **Established official tool.** Useful source for documented boundaries. Extract selected
  public metadata and permissions; never copy credential or signing material into a report.

### Server configuration and account claims

- **Coverage:** Routes, gateways, leaf connections, mappings, imports/exports and permissions.
- **Maturity and constraints:** **Established native configuration.** Needs a normalized documentation view and
  references to ownership and environment. [NATS security and topology documentation](https://docs.nats.io/learn/).

NACK's account connection resource should not be confused with a universal operator/account policy model. Similarly, a
Terraform resource graph describes provisioning dependencies, which may differ from message-flow dependencies.

## Testing and keeping contracts honest

### [Microcks](https://microcks.io/documentation/guides/usage/async-protocols/nats-support/)

- **What it verifies:** NATS mock-message publishing and checks that observed messages match AsyncAPI payload schemas.
- **Maturity and boundary:** **Established API testing project with documented NATS support.** The NATS guide uses older
  examples and cites testing against server 2.9.8. Verify current authentication, AsyncAPI version and JetStream
  interaction needs.

### AsyncAPI CLI/parser + Spectral

- **What it verifies:** Contract syntax, references, conventions and required metadata.
- **Maturity and boundary:** **Established workflow components.** A necessary check, but not proof that publishers,
  consumers or permissions match the document. See [CLI](https://github.com/asyncapi/cli) and
  [Spectral](https://github.com/stoplightio/spectral).

### AsyncAPI Diff + schema compatibility tooling

- **What it verifies:** Changes in API descriptions and payload models.
- **Maturity and boundary:** **Specialist combination.** Validate direction-specific breaking-change rules, especially
  producer versus consumer expectations. [AsyncAPI Diff](https://github.com/asyncapi/diff),
  [Buf](https://buf.build/docs/bsr/).

### Configuration reconciliation

- **What it verifies:** Declared resources compared with deployed streams, consumers and account configuration.
- **Maturity and boundary:** **Integration work.** Use native resource semantics; no universal NATS documentation
  reconciler was established here.

### [OpenTelemetry messaging conventions](https://opentelemetry.io/docs/specs/semconv/messaging/)

- **What it verifies:** Consistent application telemetry that can connect sending and processing operations.
- **Maturity and boundary:** **Established observability ecosystem; messaging conventions remain marked Development.**
  Useful evidence, not a topology contract or proof that every edge is instrumented.

A payload-schema test will not prove acknowledgment timing, retry limits, durable consumer reuse, permissions, request
timeouts or persistence behavior. Those need behavioral tests and configuration checks if they become requirements. This
is a limitation of what the test observes, not a reason to discard contract testing.

## Architecture diagrams and visual modeling

### [Mermaid](https://mermaid.js.org/intro/)

- **Useful role:** Compact message-flow, sequence and architecture diagrams embedded in Markdown.
- **Maturity and NATS limit:** **Established.** Good default for generated views and discussion. Needs a separate source
  model and NATS-specific validation.

### [PlantUML](https://plantuml.com/)

- **Useful role:** Sequence, component, deployment and network diagrams.
- **Maturity and NATS limit:** **Established.** Suitable for physical links and interaction narratives; not a messaging
  contract standard.

### [Graphviz](https://graphviz.org/)

- **Useful role:** Graph layout and output from generated node/edge data.
- **Maturity and NATS limit:** **Established.** Strong rendering backend for extracted topology. Semantics, ownership
  and navigation must come from another layer.

### [D2](https://d2lang.com/)

- **Useful role:** Declarative architecture diagrams with containers, imports and programmable generation.
- **Maturity and NATS limit:** **Established specialist.** Good diagram authoring/export option; no native NATS contract
  model established.

### [Structurizr](https://docs.structurizr.com/)

- **Useful role:** Architecture model with C4-style, dynamic and deployment views, documentation and ADRs.
- **Maturity and NATS limit:** **Established.** Useful for logical/physical perspectives; requires explicitly modeled
  NATS relationships. Current tools/offering should be selected individually.

### [LikeC4](https://likec4.dev/)

- **Useful role:** Extensible architecture-as-code with navigable interactive views and exports.
- **Maturity and NATS limit:** **Specialist.** Attractive for a custom topology vocabulary. It validates its model, not
  live NATS semantics without integration.

### [IcePanel](https://icepanel.io/)

- **Useful role:** Collaborative C4 modeling, diagrams and flows.
- **Maturity and NATS limit:** **Established specialist SaaS.** Useful for workshops and architectural context.
  Automatic NATS discovery was not established.

### [Eraser / DiagramGPT](https://www.eraser.io/diagramgpt)

- **Useful role:** Diagram generation and technical-documentation product, including architecture and sequence views.
- **Maturity and NATS limit:** **Established specialist product; unverified NATS automation.** Useful presentation
  option. Generated diagrams still need an authoritative input model and review.

Diagrams are most reliable as projections of the same identifiers and relationships used by contracts and configuration.
A polished manually maintained drawing can still drift.

## Legacy tools and adjacent projects

### [Glee](https://github.com/asyncapi-archived-repos/glee)

- **What the research established:** AsyncAPI framework repository was archived on 2025-08-04.
- **Recommendation:** **Legacy.** Do not choose it as a new maintained foundation.

### Archived AsyncAPI transport templates

- **What the research established:** Generator's current list marks some templates archived, including older Node.js
  service templates. [Template list](https://github.com/asyncapi/generator).
- **Recommendation:** Assess each template independently. Generator health does not establish template health.

### [NATSboard](https://github.com/devfacet/natsboard)

- **What the research established:** Monitoring dashboard; README still documents the old `gnatsd` command and
  routes/connections views.
- **Recommendation:** **Legacy-looking; maintenance not established.** Prefer current native tooling unless an existing
  installation already meets the need. This is not a verified archive claim.

### [DefactoTechnology nats-ui](https://github.com/DefactoTechnology/nats-ui)

- **What the research established:** README targets NATS Streaming and its `/streaming` monitoring endpoint.
- **Recommendation:** **Legacy subsystem fit.** Do not confuse NATS Streaming/STAN with JetStream.

### [SpecMesh](https://github.com/specmesh/specmesh-build)

- **What the research established:** AsyncAPI-based Kafka configuration, governance and export tooling.
- **Recommendation:** **Specialist, adjacent.** Useful precedent for contract-driven provisioning. Native NATS support
  was not established.

### Generic Kafka catalogs and discovery tools

- **What the research established:** Many can describe payloads or import AsyncAPI, but broker discovery is
  Kafka-specific.
- **Recommendation:** Require explicit NATS connector evidence. Schema compatibility or AsyncAPI import alone does not
  establish native topology discovery.

### Generic API documentation brands

- **What the research established:** Familiarity with an OpenAPI product does not establish support for AsyncAPI 3.x,
  NATS execution or architecture graphs.
- **Recommendation:** Evaluate the exact current feature, rather than treating “API documentation” as sufficient.

### Rivitt

- **What the research established:** Surfaced as a lead in NATS documentation discussions, but its public website could
  not be retrieved during research.
- **Recommendation:** **Unverified fit.** No current capability, maturity or availability recommendation is made.

## Capability comparison for the shortlist

This matrix is an assessment of documented scope. **Native** means that layer is a principal documented capability;
**partial** means useful coverage with omissions; **integration** means additional modeling or extraction is required;
**no** means it is outside the tool's purpose. None of these labels certifies runtime correctness.

### AsyncAPI

- **Application contract:** Native
- **Ownership and logical graph:** Partial, assembled across applications
- **JetStream resource detail:** Integration/extensions
- **Physical/runtime topology:** No
- **Standardized metadata discovery:** File/URL interchange; registry integration

### xRegistry domain models

- **Application contract:** Partial, oriented around endpoints and messages
- **Ownership and logical graph:** Integration
- **JetStream resource detail:** Integration/extensions
- **Physical/runtime topology:** No
- **Standardized metadata discovery:** Native registry model and API

### EventCatalog

- **Application contract:** Import/render
- **Ownership and logical graph:** Native
- **JetStream resource detail:** Integration
- **Physical/runtime topology:** Integration
- **Standardized metadata discovery:** Product interfaces and integrations

### Backstage

- **Application contract:** Import/render
- **Ownership and logical graph:** Native at catalog level
- **JetStream resource detail:** Integration
- **Physical/runtime topology:** Integration
- **Standardized metadata discovery:** Native software catalog API

### Apicurio Registry

- **Application contract:** Store contract/schema artifacts
- **Ownership and logical graph:** Partial metadata
- **JetStream resource detail:** No
- **Physical/runtime topology:** No
- **Standardized metadata discovery:** Native product registry API; xRegistry support not established

### Synadia Control Plane

- **Application contract:** No application contract established
- **Ownership and logical graph:** Partial operational relationships
- **JetStream resource detail:** Native
- **Physical/runtime topology:** Native operational visibility
- **Standardized metadata discovery:** Product API

### Synadia Insights

- **Application contract:** No
- **Ownership and logical graph:** Operational graph, not business semantics
- **JetStream resource detail:** Native observed state
- **Physical/runtime topology:** Native observed state/history
- **Standardized metadata discovery:** Product interfaces; export fit to verify

### NATS CLI + management APIs

- **Application contract:** No application contract
- **Ownership and logical graph:** Integration
- **JetStream resource detail:** Native
- **Physical/runtime topology:** Native snapshots
- **Standardized metadata discovery:** Native NATS administrative APIs

### NACK / Terraform provider

- **Application contract:** No
- **Ownership and logical graph:** Provisioning relationships
- **JetStream resource detail:** Native configured subset
- **Physical/runtime topology:** Deployment/configuration subset
- **Standardized metadata discovery:** Configuration/state interfaces

### Microcks

- **Application contract:** Consume and exercise
- **Ownership and logical graph:** No
- **JetStream resource detail:** Behavioral subset only
- **Physical/runtime topology:** No
- **Standardized metadata discovery:** Contract import

The matrix synthesizes the linked product and specification evidence in the corresponding sections. It is deliberately
qualitative: numerical maturity scores would imply measurement this research did not perform.
