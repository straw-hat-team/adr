---
id: '5177934677'
title: Annotations and Transient Annotations
state: Draft
created: 2026-06-28
tags: [annotations, metadata, event-sourcing, eda]
category: Platform
---

# Annotations and Transient Annotations

## Context

Records that move through our systems (events, commands, requests,
projections, resources) need a place to carry caller-attached metadata that the
platform itself does not interpret. Examples of the *shape* of need (not an
enumeration of keys) include: cross-cutting observability context, write-time
plumbing, caller-owned domain tags, and platform cross-cutting concerns that
are not first-class envelope fields.

Two questions have to be answered consistently across every record type:

1. **Who owns which keys**, so callers from different systems and teams can
   attach metadata without colliding.
2. **How long does an attached entry live**, so storage knows what to persist,
   and projections know what to copy onto downstream resources.

Existing precedents were considered:

- Kubernetes splits metadata into `labels` (selectable, indexed) and
  `annotations` (opaque, free-form). The split exists because the API server
  is the selector engine and has to index a bounded namespace cheaply. We do
  not have a platform-level selector engine, and we do not know our query
  patterns up front. Adopting the `labels`/`annotations` split would be
  ceremony without a corresponding system behavior.
- CloudEvents, NATS headers, Kafka headers, AMQP application properties, and
  HTTP headers all use a single flat map with a reserved-prefix convention.
- Event-sourced systems consistently distinguish between metadata that is
  part of the event's permanent record and metadata that is attached only for
  the moment of delivery (tracing context, idempotency, retry plumbing). This
  distinction maps to real, irreversible system behaviors (persistence and
  projection), and is decided by the caller at write time.

The axis that earns its keep in our environment is **lifetime**, not
selectability.

This ADR defines only the **specification** of the annotation namespace. It
does not enumerate which keys exist, where any particular concern (tracing,
idempotency, correlation, etc.) should be placed, or how individual
projections behave. Those are caller and consumer decisions applied using
this specification. First-class envelope fields (record identifiers, types,
timestamps, schema versions, causation, aggregate identity, and similar
platform-interpreted fields) are out of scope and are governed elsewhere.

## Resolution

Records expose two sibling fields with identical shape and identical key
rules, distinguished only by lifetime:

```
annotations:           { <key>: <string>, ... }
transient_annotations: { <key>: <string>, ... }
```

### Shape

- Both fields are maps of string key to string value.
- Values are **opaque to the platform**. The platform does not parse,
  validate, or interpret values. Callers that need structured values
  `MUST` encode them as strings (for example, JSON-encoded).
- Both fields are optional. Absence and an empty map are equivalent.

### Key syntax

Keys follow the Kubernetes label key syntax, by reference:

- A key is either `<name>` or `<prefix>/<name>`.
- `<prefix>`, when present, `MUST` be a DNS subdomain (lowercase
  alphanumerics, `-`, and `.`; segments separated by `.`; total length
  `<= 253` characters).
- `<name>` `MUST` be `1..63` characters, beginning and ending with an
  alphanumeric, with `-`, `_`, and `.` permitted in between.

### Ownership and reservation

- A prefix `MUST` be a DNS subdomain owned by the writer.
- Unprefixed keys belong to the caller's own namespace and `MUST NOT` be
  written by the platform.
- Keys under a platform-owned prefix are reserved for that platform.
  Consumers `MUST NOT` write to a prefix they do not own.
- This ADR does not enumerate reserved keys. Reserved keys live in the
  systems that define them.

### Lifetime contract

- `annotations`
  - `MUST` be persisted as part of the record's permanent representation
    when the record is persisted.
  - `SHOULD` be projected onto downstream resources by default. Projectors
    `MAY` filter on a per-rule basis.
- `transient_annotations`
  - Are attached at write time for the lifetime of the delivery.
  - `MUST NOT` be projected onto downstream resources by default.
  - `MAY` be persisted alongside the record for replay and audit purposes.
    Persistence `MAY` be opted out of per stream or per system when the
    cost is not justified; the default is to persist.
- Resources and projections `MUST NOT` expose a `transient_annotations`
  field.

### Choosing between the two

The writer decides at attach time:

- If the entry is a fact about the record that should remain true forever,
  it belongs in `annotations`.
- If the entry is meaningful only for this delivery or this processing
  moment, it belongs in `transient_annotations`.

This decision is local to the writer and does not require coordination with
consumers.

### Normative rules

- You `MUST` place caller-attached opaque metadata in `annotations` or
  `transient_annotations`. You `MUST NOT` introduce parallel ad-hoc fields
  for the same purpose.
- You `MUST` use a prefix you own, or no prefix at all. You `MUST NOT`
  write to a prefix you do not own.
- You `MUST` encode non-string values as strings.
- You `MUST` choose `annotations` vs `transient_annotations` based on
  lifetime intent, not on the topical category of the entry.
- You `MUST NOT` move platform-interpreted concerns into annotations.
  First-class envelope fields are governed separately.
- Projectors `MUST NOT` copy `transient_annotations` to resources by
  default.
- Storage `MUST` persist `annotations` whenever the underlying record is
  persisted.

## Links

* [Kubernetes: Labels and Selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)
* [Kubernetes: Annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/)
* [CloudEvents specification](https://github.com/cloudevents/spec)
