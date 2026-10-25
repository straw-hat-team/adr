---
id: '5736580914'
title: Rust telemetry is written with tracing and exported through OpenTelemetry
state: Draft
created: 2026-10-22
tags: [rust, tracing, opentelemetry, otel, observability, logging, metrics, telemetry]
category: General
---

# Rust telemetry is written with tracing and exported through OpenTelemetry

## Context

[ADR#1008684393](../1008684393/README.md#telemetry) sends traces, metrics and
logs over OTLP to an OpenTelemetry Collector, and
[ADR#1631648331](../1631648331/README.md) makes Rust the language for new
services and programs. Rust offers two APIs to write that telemetry against:
the `tracing` crate, bridged to OpenTelemetry by `tracing-opentelemetry` and
`opentelemetry-appender-tracing`, or the `opentelemetry` crate directly. Each
codebase picking its own leads to broken traces, because the two APIs keep
separate ideas of the current span.

Every Rust program depends on `tracing` whichever way it goes. tokio, hyper,
tower and tonic, among most of the async ecosystem, already emit `tracing`
spans and events, and seeing them in a trace takes `tracing-subscriber` with
the `tracing-opentelemetry` layer. So the question is not which one to use,
but what application code is allowed to touch.

Going OpenTelemetry-direct everywhere does not remove `tracing`. It adds a
second system next to it:

- `tracing` tracks its own current span and OpenTelemetry tracks its own
  `Context`. `tracing-opentelemetry` bridges them in both directions since
  0.32: a root `tracing` span takes its parent from the current OpenTelemetry
  `Context`, and entering a `tracing` span activates a matching `Context`.
  Mixing both APIs freely in the same code still produces traces with the
  wrong shape
  ([opentelemetry-rust#1690](https://github.com/open-telemetry/opentelemetry-rust/issues/1690)),
  and the OpenTelemetry Rust maintainers closed the unification discussion
  calling a single context unrealistic
  ([opentelemetry-rust#1571](https://github.com/open-telemetry/opentelemetry-rust/issues/1571)).
- OpenTelemetry's `Context` does not follow a future across `.await`; every
  future has to be wrapped with `FutureExt::with_context`. `tracing` does this
  with `.instrument()`, which the ecosystem already uses.
- OpenTelemetry Rust has no logging API for application code. Its Logs Bridge
  API "is not intended to be called by application developers directly", and
  `opentelemetry-appender-tracing` is the appender that takes `tracing` events
  ([docs/logs.md](https://github.com/open-telemetry/opentelemetry-rust/blob/main/docs/logs.md)).

The two sides are not equally stable. `tracing` has been at 0.1 for years and
only defines an interface; it exports nothing. The `opentelemetry` API crate
lists breaking changes in five of its eight minor releases from 0.26 to 0.33,
and again in the 0.33.1 patch
([CHANGELOG](https://github.com/open-telemetry/opentelemetry-rust/blob/main/opentelemetry/CHANGELOG.md)).
Its Traces API and SDK are still Beta, and 1.0 has no date
([project status](https://github.com/open-telemetry/opentelemetry-rust#project-status)).
`tracing-opentelemetry` has to move in lockstep with every OpenTelemetry minor.
Code that touches OpenTelemetry pays for each of those releases; code that
touches `tracing` does not. This is the split `log` and SLF4J made familiar:
code writes to a stable facade, and the backend is chosen once at startup.

`tracing` still cannot express everything in the OpenTelemetry data model.
The OpenTelemetry Rust project's own guidance says to use `tracing` for logs
and events, the OpenTelemetry Metrics API for metrics, and the OpenTelemetry
Tracing API for spans
([docs/traces.md](https://github.com/open-telemetry/opentelemetry-rust/blob/main/docs/traces.md),
work in progress). It also narrows where that matters: for internal spans,
in-process work that never crosses a process boundary, `tracing` through the
bridge gives a result "nearly identical" to the OpenTelemetry API. The gaps
sit at the edges and in a few kinds of data:

- **Edge spans:** span kind, a remote parent and links matter most on the
  server, client, producer and consumer spans at a process boundary. Through
  `tracing` they depend on extension calls that must happen before the span is
  entered, which `#[instrument]` makes impossible
  ([tracing-opentelemetry#253](https://github.com/tokio-rs/tracing-opentelemetry/issues/253)),
  and `otel.name` or `otel.kind` recorded later are silently dropped
  ([tracing-opentelemetry#240](https://github.com/tokio-rs/tracing-opentelemetry/issues/240)).
- **Metrics:** the `MetricsLayer` has no units or descriptions, takes only
  static names, and degrades filtering for every layer.
- **Recorded spans:** `tracing` has no explicit start or end timestamps, so a
  span replayed from recorded data cannot be expressed.
- **Structured values:** array attributes, structured log bodies such as
  GenAI message content, and `valuable` are not carried; the appender
  stringifies field values.
- **Baggage:** `tracing` has no notion of it.

Every limitation, with its workaround and the upstream issue, is in
[tracing limitations](./references/limitations.md).

The costs are not the same size. Those gaps cover the boundary middleware,
metric instruments and a handful of call sites, and all of them can live in
one crate. Going OpenTelemetry-direct everywhere touches every instrumented
function, adds manual context passing across `.await`, and puts every call
site on OpenTelemetry's breaking releases. The trade flips only for a program
whose telemetry is mostly in the gaps, such as one that mostly emits GenAI
events with structured bodies or mostly replays spans.

## Resolution

Chosen option: application code writes logs and spans with `tracing`, and
everything that needs the OpenTelemetry API lives in one telemetry crate,
because it keeps OpenTelemetry's release churn and context handling out of
domain code while using the OpenTelemetry API exactly where `tracing` falls
short.

### Application code

- Application and library code **MUST** write logs as `tracing` events and
  internal spans as `tracing` spans, through `#[instrument]`,
  `.instrument()` or `tracing::span!`.
- Events **SHOULD** set `name:` and `target:` explicitly. Without `name:`, the
  appender exports a synthesized `event <file>:<line>` as the event name
  ([opentelemetry-rust#3797](https://github.com/open-telemetry/opentelemetry-rust/issues/3797)).
- Attribute and event names **MUST** follow the OpenTelemetry semantic
  conventions, written as dotted `tracing` field names such as
  `"http.request.method"`.
- Code **MUST NOT** hold a `Span::enter` guard across `.await`. Use
  `.instrument()` or `in_scope`, and propagate into spawned tasks with
  `.in_current_span()`.
- Code **MUST NOT** use the `log` crate macros, `println!`, `eprintln!` or
  `dbg!` for diagnostics.
- Code outside the telemetry crate **MUST NOT** depend on `opentelemetry`,
  `opentelemetry_sdk`, `tracing-opentelemetry` or any other OpenTelemetry
  crate.

### The telemetry crate

- A program **MUST** keep all OpenTelemetry code in a single telemetry crate
  of its workspace. It is the only place that installs the providers and the
  only crate allowed to use the OpenTelemetry API.
- It **MUST** install the providers once, at startup, from the standard
  `OTEL_*` environment variables
  ([ADR#1008684393](../1008684393/README.md#telemetry)): `tracing-subscriber`
  with the `tracing-opentelemetry` layer for spans, the
  `opentelemetry-appender-tracing` layer for logs, the W3C Trace Context
  propagator, and the OTLP exporters.
- It **MUST** filter the exporter's own transport crates (`hyper`, `h2`,
  `tonic`, `reqwest`) out of the OpenTelemetry layers, so exporting telemetry
  does not produce telemetry
  ([opentelemetry-rust#2877](https://github.com/open-telemetry/opentelemetry-rust/issues/2877)).
- It **MUST** flush and shut the providers down on exit, with a bounded
  timeout.
- Edge spans (server, client, producer and consumer) **MUST** be created by
  boundary middleware in the telemetry crate, which extracts or injects the
  W3C `traceparent` and sets the span kind when the span is created. It
  **SHOULD** use the OpenTelemetry Tracing API for them, and **MUST** make
  the span the current `Context` for the handler, so the handler's `tracing`
  spans and events nest under it.
- Metrics **MUST** use the OpenTelemetry Metrics API, with instruments
  declared in the telemetry crate and exposed to application code as
  functions or types named for the domain. Metrics **MUST NOT** go through the
  `tracing-opentelemetry` `MetricsLayer`.
- Recorded spans with explicit timestamps, array attributes, structured log
  bodies and baggage **MUST** be emitted through functions in the telemetry
  crate that use the OpenTelemetry API, parented on the current `tracing` span.
- All OpenTelemetry crates **MUST** stay on one minor version across the
  workspace, upgraded together with the matching `tracing-opentelemetry`.

### Enforcement

- The dependency boundary **MUST** be enforced in CI with `cargo-deny`, using
  `bans.deny` with `wrappers` that names the telemetry crate and the
  OpenTelemetry crates that depend on each other.
- Clippy **SHOULD** deny the `log` macros, `println!`, `eprintln!`, `dbg!`,
  and span guards held across `.await`, with `disallowed-macros` and
  `await-holding-invalid-types`.

The configuration for both is in [setup](./references/setup.md#enforcement).

### Exceptions

- A program whose telemetry is mostly in the gaps above **MAY** use the
  OpenTelemetry API throughout, and **MUST** record that in its own ADR that
  links here.
- This ADR **SHOULD** be revisited when OpenTelemetry Rust reaches 1.0 for
  traces, or when the share of code that needs the OpenTelemetry API stops
  being an exception.

## Links

- [Tracing limitations](./references/limitations.md)
- [Setup](./references/setup.md)
- [ADR#1008684393](../1008684393/README.md)
- [ADR#1631648331](../1631648331/README.md)
- [Tech Radar: OpenTelemetry](../../radar/items/opentelemetry.md)
- [Tech Radar: Rust](../../radar/items/rust.md)
- [OpenTelemetry Rust traces guidance](https://github.com/open-telemetry/opentelemetry-rust/blob/main/docs/traces.md)
- [OpenTelemetry Rust logs guidance](https://github.com/open-telemetry/opentelemetry-rust/blob/main/docs/logs.md)
- [tracing-opentelemetry](https://github.com/tokio-rs/tracing-opentelemetry)
