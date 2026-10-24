# Setup

How the telemetry crate from
[ADR#5736580914](../README.md#the-telemetry-crate) is built, and the
configuration that enforces the boundary. Checked against
`opentelemetry-rust` main and `tracing-opentelemetry` 0.34.0 on 2026-10-22.

## Startup

The telemetry crate exposes one function that `main` calls before anything
else, and returns a guard that `main` holds until exit.

- Build the resource with `Resource::builder()`, not `builder_empty()`. Only
  the former reads `OTEL_SERVICE_NAME` and `OTEL_RESOURCE_ATTRIBUTES`.
- Leave the exporter unconfigured in code. `opentelemetry-otlp` reads
  `OTEL_EXPORTER_OTLP_ENDPOINT`, `_PROTOCOL`, `_HEADERS`, `_TIMEOUT` and
  `_COMPRESSION`, with the per-signal variants taking precedence, and the SDK
  reads `OTEL_TRACES_SAMPLER` and `OTEL_TRACES_SAMPLER_ARG`.
- Read `OTEL_SDK_DISABLED`, `OTEL_PROPAGATORS` and
  `OTEL_TRACES_EXPORTER`, `OTEL_METRICS_EXPORTER`, `OTEL_LOGS_EXPORTER` in the
  telemetry crate. The Rust SDK does not read them; Spin
  ([env.rs](https://github.com/spinframework/spin/blob/main/crates/telemetry/src/env.rs))
  and wasmCloud
  ([otel.rs](https://github.com/wasmCloud/wasmCloud/blob/main/crates/wash-runtime/src/observability/otel.rs))
  implement them the same way.
- Install the W3C Trace Context propagator with
  `global::set_text_map_propagator`, even when export is disabled, so context
  still passes through the service.
- Register `global::set_meter_provider` so the metric instruments resolve.

The subscriber stacks the layers on one registry, each with its own filter:

```text
registry
├── fmt layer                         filter: RUST_LOG
├── tracing-opentelemetry layer       filter: hyper, h2, tonic, reqwest off
└── appender-tracing bridge layer     filter: hyper, h2, tonic, reqwest off
```

Per-layer filters let local output and exported telemetry differ. The
transport filter on the OpenTelemetry layers stops the exporter's own HTTP and
gRPC traffic from being exported in turn
([basic-otlp example](https://github.com/open-telemetry/opentelemetry-rust/blob/main/opentelemetry-otlp/examples/basic-otlp/src/main.rs)).

## Shutdown

The guard calls `force_flush` and then `shutdown` on the tracer, logger and
meter providers when it is dropped. Run the flush under a timeout shorter than
the pod's termination grace period, so a Collector that is down cannot hold
the process past it. A `panic = "abort"` profile skips `Drop`, so a program
built that way flushes from a panic hook instead.

## Boundaries

- **HTTP:** server middleware extracts `traceparent` and creates a server
  span; client middleware creates a client span and injects `traceparent`.
- **gRPC:** the same, as a tower layer on the server and on the channel.
- **NATS:** a consumer span from the message headers on receive; a producer
  span with `traceparent` written to the headers on publish.
- **Async tasks:** `tokio::spawn(fut.in_current_span())`.
- **Threads:** `let span = Span::current();`, then `span.in_scope(...)`
  inside the closure.

`tower-http`'s `TraceLayer` builds a `tracing` span but does not extract or
inject context, so on its own it starts a new trace on every request.
`async-nats` has no built-in propagation; the telemetry crate implements the
OpenTelemetry `Injector` and `Extractor` over the message headers, following
the W3C `traceparent` header NATS uses for message tracing
([NATS ADR-41](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-41.md)).

The middleware creates the edge span with the OpenTelemetry Tracing API and
runs the handler inside it with `FutureExt::with_context`. A `tracing` span
created with no `tracing` parent takes the current OpenTelemetry `Context` as
its parent, so the handler's `#[instrument]` spans and events nest under the
edge span without further work.

## Tests

Install the subscriber with `tracing::subscriber::set_default` scoped to the
test, export to `InMemorySpanExporter` from `opentelemetry_sdk` (feature
`testing`), and assert on the exported spans.

## Enforcement

`cargo-deny` rejects any workspace crate other than the telemetry crate that
depends on an OpenTelemetry crate. The OpenTelemetry crates that depend on each
other are listed as wrappers too, otherwise their own edges fail the check.
Verified with `cargo-deny` 0.20.2 on a workspace using the versions in
[tracing limitations](./limitations.md#versions):

```toml
# deny.toml
[bans]
deny = [
  { crate = "opentelemetry", wrappers = [
    "telemetry",
    "opentelemetry_sdk",
    "opentelemetry-http",
    "opentelemetry-otlp",
    "opentelemetry-proto",
    "opentelemetry-appender-tracing",
    "tracing-opentelemetry",
  ] },
  { crate = "opentelemetry_sdk", wrappers = ["telemetry", "opentelemetry-otlp", "opentelemetry-proto"] },
  { crate = "tracing-opentelemetry", wrappers = ["telemetry"] },
]
```

Replace `telemetry` with the telemetry crate's name. Third-party middleware
that depends on `opentelemetry` has to be added to the first entry's
`wrappers` when the telemetry crate adopts it.

Clippy covers what `cargo-deny` cannot see inside a crate. Clippy has no lint
for span guards held across `.await`; `await-holding-invalid-types` fills the
gap:

```toml
# clippy.toml
disallowed-macros = [
  { path = "log::trace", reason = "use tracing" },
  { path = "log::debug", reason = "use tracing" },
  { path = "log::info", reason = "use tracing" },
  { path = "log::warn", reason = "use tracing" },
  { path = "log::error", reason = "use tracing" },
  { path = "std::println", reason = "use tracing" },
  { path = "std::eprintln", reason = "use tracing" },
  { path = "std::dbg", reason = "use tracing" },
]
await-holding-invalid-types = [
  { path = "tracing::span::Entered", reason = "use .instrument() or in_scope across .await" },
  { path = "tracing::span::EnteredSpan", reason = "use .instrument() or in_scope across .await" },
]
```

A command line tool that writes its output to stdout allows `println!` in the
module that renders that output.
