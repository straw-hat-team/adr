# Tracing limitations

Where the `tracing` path (`tracing`, `tracing-subscriber`,
`tracing-opentelemetry`, `opentelemetry-appender-tracing`) falls short of the
OpenTelemetry data model, what to do about each gap, and the upstream issue
that tracks it. Issue states were read from GitHub on 2026-10-22.

Each entry says where the gap is handled:

- **tracing:** a workaround inside application code is enough.
- **telemetry crate:** the telemetry crate uses the OpenTelemetry API, as
  [ADR#5736580914](../README.md#the-telemetry-crate) requires.

## Versions

Compatible set on 2026-10-22:

| Crate                            | Version |
| -------------------------------- | ------- |
| `tracing`                        | 0.1.44  |
| `tracing-subscriber`             | 0.3.23  |
| `tracing-opentelemetry`          | 0.34.0  |
| `opentelemetry`                  | 0.33.1  |
| `opentelemetry_sdk`              | 0.33.1  |
| `opentelemetry-otlp`             | 0.33.1  |
| `opentelemetry-appender-tracing` | 0.33.1  |

`tracing-opentelemetry` releases one minor per `opentelemetry` minor (0.34
pairs with 0.33), days to weeks after it, and a mismatched pair fails to
compile. `opentelemetry-appender-tracing` 0.33.1 requires
`opentelemetry ^0.33.1`. `tracing` 0.2 has never been published; its tracking
issue ([tracing#922](https://github.com/tokio-rs/tracing/issues/922)) is
open, and a maintainer wrote on 2025-12-08 that breaking changes are not being
merged
([tracing-opentelemetry#242](https://github.com/tokio-rs/tracing-opentelemetry/issues/242)).
No fix that needs a breaking `tracing` change should be planned on.

## Spans

### Explicit timestamps

A span starts when it is created and ends at its last exit; neither can be
set. Spans replayed from recorded data, imported, or backfilled cannot be
expressed.

- **Handle with:** telemetry crate, with `SpanBuilder::with_start_time` and
  `Span::end_with_timestamp`.
- **Evidence:** no upstream request found; derived from the
  `tracing-opentelemetry` layer source.

### Parent after creation

`set_parent` returns `SetParentError::AlreadyStarted` once the span has been
entered, and `#[instrument]` enters automatically. An incoming trace context
cannot be attached to an `#[instrument]` span, so the trace breaks at the
service boundary. The maintainer's stance is that the parent belongs at
creation.

- **Handle with:** telemetry crate. Boundary middleware creates edge spans
  with the remote parent set at creation.
- **Evidence:**
  [tracing-opentelemetry#253](https://github.com/tokio-rs/tracing-opentelemetry/issues/253)
  (open),
  [tracing-opentelemetry#96](https://github.com/tokio-rs/tracing-opentelemetry/issues/96)
  (closed, not planned).

### Span kind and dynamic names

`otel.kind` and `otel.name` only apply when set at creation; recording them
later is silently dropped, and the default kind is internal. Edge spans export
as internal, and route-based names such as `GET /users/{id}` are lost when
they are known only after routing.

- **Handle with:** telemetry crate for edge spans. Elsewhere, declare
  `otel.name` at creation.
- **Evidence:**
  [tracing-opentelemetry#240](https://github.com/tokio-rs/tracing-opentelemetry/issues/240)
  (open),
  [tracing-opentelemetry#82](https://github.com/tokio-rs/tracing-opentelemetry/issues/82)
  (closed).

`otel.name` does not apply to events either, so span events keep their static
name
([tracing-opentelemetry#217](https://github.com/tokio-rs/tracing-opentelemetry/issues/217),
open).

### Links

Links are added after the span starts, so the sampler never sees them.
`follows_from` becomes a link only while both spans are alive, and has
panicked on multithreaded runtimes. Batch and fan-in consumers, where links
are the model, get sampling decisions that ignore them.

- **Handle with:** telemetry crate for consumer spans. `add_link` is
  acceptable on internal spans.
- **Evidence:**
  [tracing-opentelemetry#183](https://github.com/tokio-rs/tracing-opentelemetry/issues/183)
  (open).

### Exceptions

`#[instrument(err)]` records the error as a string, so `exception.type` and
`exception.stacktrace` are missing. Backends that key error views on
`exception.type`, such as Datadog, show broken errors.

- **Handle with:** tracing, by recording `error = &err as &dyn Error` on an
  event; or the telemetry crate, with `record_error` on the span's context.
- **Evidence:**
  [tracing-opentelemetry#242](https://github.com/tokio-rs/tracing-opentelemetry/issues/242),
  [tracing#3560](https://github.com/tokio-rs/tracing/issues/3560),
  [tracing#2648](https://github.com/tokio-rs/tracing/issues/2648) (all open).

### Attribute value types

`u64`, `i128` and `u128` fields fall back to `Debug` and export as strings,
which breaks numeric queries on them. `tracing` fields cannot carry arrays.

- **Handle with:** tracing, by converting to `i64` before recording. Arrays go
  through the telemetry crate with `set_attribute` and `Value::Array`.
- **Evidence:** derived from the `tracing-opentelemetry` layer source, which
  has no `record_u64`.

### Field names known only at runtime

Field names are static, and a field not declared at creation cannot be
recorded later.

- **Handle with:** tracing, by declaring `field::Empty` and recording it
  later. Keys known only at runtime go through `set_attribute` in the
  telemetry crate.
- **Evidence:** [tracing#1343](https://github.com/tokio-rs/tracing/issues/1343)
  (open).

### Span events

Events inside a span become span events with no cap, and the span layer drops
events outside any span. Long-lived spans grow without bound, and
OpenTelemetry is moving from span events to log-based events.

- **Handle with:** tracing. Keep spans short and filter long-lived connection
  spans off the layer.
- **Evidence:** [tracing#2500](https://github.com/tokio-rs/tracing/issues/2500)
  (open).

### Span lifetime

A span ends only when its last handle is dropped, and `spawn_blocking` and
new threads do not inherit the current span. The result is wrong durations,
spans that never end, and orphaned children.

- **Handle with:** tracing, using `.instrument()`, `.in_current_span()`, and
  `Span::current()` with `in_scope` in blocking closures.
- **Evidence:**
  [tracing-opentelemetry#127](https://github.com/tokio-rs/tracing-opentelemetry/issues/127)
  (closed, not planned).

### Sampling cost

Sampling runs when the OpenTelemetry span is built, not when the `tracing`
span is created, and level filters know nothing about it. A sampled-out span
still pays most of its cost on hot paths.

- **Handle with:** tracing, reducing volume with `EnvFilter`. The
  OpenTelemetry API cannot skip the cost either until `Tracer::enabled()`
  lands.
- **Evidence:**
  [tracing-opentelemetry#15](https://github.com/tokio-rs/tracing-opentelemetry/issues/15),
  [opentelemetry-rust#3781](https://github.com/open-telemetry/opentelemetry-rust/issues/3781)
  (both open).

### Baggage

`tracing` has no baggage API; baggage can only arrive through a parent
context.

- **Handle with:** telemetry crate.
- **Evidence:**
  [tracing-opentelemetry#130](https://github.com/tokio-rs/tracing-opentelemetry/issues/130)
  (open).

### Instrumentation scope

Every span the layer exports carries one instrumentation scope, whichever
crate created it, so backends cannot attribute or filter spans by library.

- **Handle with:** accepted. `with_target(true)` adds the target as an
  attribute.
- **Evidence:** derived from the `tracing-opentelemetry` layer source.

### Mixing both APIs

Creating OpenTelemetry API spans and `tracing` spans side by side in the same
code produces traces with the wrong shape.

- **Handle with:** telemetry crate. Its OpenTelemetry API spans become the
  current `Context` for the code below them.
- **Evidence:**
  [opentelemetry-rust#1690](https://github.com/open-telemetry/opentelemetry-rust/issues/1690)
  (open).

## Logs

### Trace correlation

Log records take their trace and span IDs from the current OpenTelemetry
`Context`, which reflects `tracing` spans only with `tracing-opentelemetry`
0.32 or later and context activation on. Older versions, or activation off,
produce logs with no trace ID.

- **Handle with:** keep `with_context_activation(true)`, the default.
- **Evidence:**
  [tracing-opentelemetry#202](https://github.com/tokio-rs/tracing-opentelemetry/pull/202)
  (merged).

### Event names

Events without `name:` export a synthesized `event <file>:<line>` as the event
name, which changes whenever lines move.

- **Handle with:** tracing, by always passing `name:` and `target:`.
- **Evidence:**
  [opentelemetry-rust#3797](https://github.com/open-telemetry/opentelemetry-rust/issues/3797),
  [opentelemetry-rust#3798](https://github.com/open-telemetry/opentelemetry-rust/pull/3798),
  [tracing#3636](https://github.com/tokio-rs/tracing/issues/3636) (all open).

### Structured bodies

The body is the `message` string only, with no map, list or bytes bodies, and
`valuable` is not supported. Structured payloads such as GenAI message content
cannot be emitted as typed data.

- **Handle with:** telemetry crate, through the Logs Bridge API behind a
  function named for the domain.
- **Evidence:**
  [opentelemetry-rust#2819](https://github.com/open-telemetry/opentelemetry-rust/issues/2819),
  [tracing#1570](https://github.com/tokio-rs/tracing/issues/1570) (both open).

### Error fields

Every error field becomes `exception.message`, losing the field name, with no
`exception.type`, so multiple error fields collide.

- **Handle with:** tracing, recording the error as a string field plus
  `error.type`.
- **Evidence:**
  [opentelemetry-rust#3776](https://github.com/open-telemetry/opentelemetry-rust/issues/3776)
  (open).

### Span attributes on logs

Attributes of enclosing spans are copied to log records only with the
`experimental_span_attributes` feature, and duplicate keys are not resolved.

- **Handle with:** tracing, putting the needed attributes on the event, or
  joining on trace ID in the backend.
- **Evidence:**
  [opentelemetry-rust#3498](https://github.com/open-telemetry/opentelemetry-rust/issues/3498)
  (open).

### Log scope

The log record's scope is the event `target`, which must be a literal.

- **Handle with:** tracing, one static `target:` per module.
- **Evidence:**
  [opentelemetry-rust#3440](https://github.com/open-telemetry/opentelemetry-rust/issues/3440)
  (open).

### Exporter feedback

The exporter's transport crates emit `tracing` events that the appender
exports again, and the SDK's own suppression does not cross the threads
`hyper` and `tonic` use. Left alone, telemetry produces telemetry.

- **Handle with:** telemetry crate, filtering `hyper`, `h2`, `tonic` and
  `reqwest` off the OpenTelemetry layers only.
- **Evidence:**
  [opentelemetry-rust#2877](https://github.com/open-telemetry/opentelemetry-rust/issues/2877)
  (open).

## Metrics

The `tracing-opentelemetry` `MetricsLayer` turns events with prefixed fields
(`monotonic_counter.`, `counter.`, `histogram.`, `gauge.`) into metrics.
[ADR#5736580914](../README.md#the-telemetry-crate) rules it out because:

- it takes no units or descriptions from the call site
  ([tracing-opentelemetry#67](https://github.com/tokio-rs/tracing-opentelemetry/issues/67),
  [tracing-opentelemetry#254](https://github.com/tokio-rs/tracing-opentelemetry/issues/254),
  both open);
- metric names must be static
  ([tracing-opentelemetry#160](https://github.com/tokio-rs/tracing-opentelemetry/issues/160),
  open);
- attributes are not inherited from the enclosing span tree
  ([tracing-opentelemetry#88](https://github.com/tokio-rs/tracing-opentelemetry/issues/88),
  open);
- it forces every callsite to `Interest::sometimes()`, which defeats filter
  caching for every layer
  ([tracing-opentelemetry#111](https://github.com/tokio-rs/tracing-opentelemetry/issues/111),
  open);
- it exports under one hardcoded instrumentation scope.

## Reliability

- A per-layer filter can drop contextual events from other layers
  ([tracing-opentelemetry#257](https://github.com/tokio-rs/tracing-opentelemetry/issues/257),
  open).
- `tracing-core` can deadlock when a `Drop` logs during interest rebuilding,
  and the fix is unmerged
  ([tracing#3269](https://github.com/tokio-rs/tracing/issues/3269),
  [tracing#3275](https://github.com/tokio-rs/tracing/pull/3275), both open).
- A deadlock entering spans was fixed in `tracing-opentelemetry` 0.33.0, a
  breaking release
  ([tracing-opentelemetry#250](https://github.com/tokio-rs/tracing-opentelemetry/issues/250),
  closed).
- In a 2025 prototype benchmark the bridge cost several times the direct
  OpenTelemetry API per span; it has not been measured on 0.34
  ([opentelemetry-rust#2420](https://github.com/open-telemetry/opentelemetry-rust/issues/2420#issuecomment-2786782932)).
- The OpenTelemetry Rust Traces API is not yet stable
  ([opentelemetry-rust#977](https://github.com/open-telemetry/opentelemetry-rust/issues/977),
  open).

## Where upstream stands

- OpenTelemetry Rust recommends its Tracing API for custom and edge spans and
  `tracing` for logs and events, and calls `tracing` through the bridge
  "nearly identical" for internal spans
  ([docs/traces.md](https://github.com/open-telemetry/opentelemetry-rust/blob/main/docs/traces.md),
  work in progress, merged 2026-08-10 in
  [opentelemetry-rust#3122](https://github.com/open-telemetry/opentelemetry-rust/pull/3122)).
- The proposal to adopt `tracing` as the OpenTelemetry tracing API was
  rejected
  ([opentelemetry-rust#1689](https://github.com/open-telemetry/opentelemetry-rust/issues/1689)),
  and the project settled on maintaining both APIs
  ([opentelemetry-rust#1571](https://github.com/open-telemetry/opentelemetry-rust/issues/1571)).
- The Logs Bridge API is for appender authors, not application code
  ([docs/logs.md](https://github.com/open-telemetry/opentelemetry-rust/blob/main/docs/logs.md)).
