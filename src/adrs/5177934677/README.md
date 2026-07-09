---
id: '5177934677'
title: Annotations and Transient Annotations
state: Approved
created: 2026-06-28
tags: [annotations, metadata, event-sourcing, eda]
category: Platform
---

# Annotations and Transient Annotations

## Context

Records that move through our systems (events, commands, requests,
projections, resources) need a place to carry caller-attached metadata that the
platform itself does not interpret. Examples of the _shape_ of need (not an
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
  is the selector engine and has to index a bounded namespace cheaply, and
  because selector values need bounded, matchable syntax. The split earns
  its keep exactly where such an engine exists. This ADR does not assume
  one: it governs the opaque namespace. A system that does operate a
  selector engine (resolving routing or binding selectors against
  metadata) `MAY` add a separate selectable field for those keys as a
  downstream decision; that field is out of this ADR's scope and does not
  change the rules here.
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

Written records (events, commands, requests) expose two sibling fields
with identical shape and identical key rules, distinguished only by
lifetime. Resources and projections expose only the first; they never
carry a `transient_annotations` field (see Lifetime contract):

```
annotations:           { <key>: <string>, ... }
transient_annotations: { <key>: <string>, ... }   # written records only
```

### Shape

- Both fields are maps of string key to string value.
- Values are **opaque to the platform**. The platform does not parse,
  validate, or interpret values. Callers that need structured values
  `MUST` encode them as strings (for example, JSON-encoded).
- Annotation values `MUST NOT` use typed dynamic containers such as
  `map<string, google.protobuf.Value>`, `google.protobuf.Struct`, or
  equivalent open-ended JSON value maps as the platform contract. Typed
  domain data belongs in first-class fields or separately governed schemas.
- Both fields are optional. Absence and an empty map are equivalent.
- Caller-attached opaque metadata `MUST` live in these two fields. Records
  `MUST NOT` grow parallel ad-hoc fields for the same purpose.
- This specification defines no size or count limits. Systems `MAY`
  impose documented limits, and propagating consumers `MAY` filter
  entries to stay within them.

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
- `trogondb.com/` is reserved for TrogonDB platform-written annotations.
  Callers `MUST NOT` write keys under this prefix unless they are acting as
  the platform component that owns the key.
- Additional reserved prefixes `MUST` be documented by the system that owns
  them before they are used.
- Ownership governs authorship: creating, modifying, or removing an
  entry. Carrying an existing entry forward verbatim during propagation
  is not authorship and is permitted for keys the propagator does not
  own.

### Prefix identity and stability

A prefix is an opaque identifier that borrows DNS syntax for
decentralized uniqueness. It is not a live pointer to a DNS record:

- A prefix does not need to resolve. Ownership is established when the
  prefix is first documented, per the reservation rules above, not by
  holding the DNS registration.
- Teams do not need their own domain. Ownership delegates the way DNS
  does: a team `MAY` mint a prefix under a domain its organization owns
  (for example, `payments.example.com/`).
- Once a key under a prefix has been written, the prefix is permanent.
  Renaming, losing, or selling the domain later does not transfer or
  invalidate the prefix, and registering a lapsed domain grants no claim
  over keys already documented by another writer.
- Because persisted records are immutable, writers `SHOULD` mint
  prefixes on the most stable name available, such as a product or
  system name rather than corporate branding. Migrating to a new prefix
  means writing new keys going forward; keys under the old prefix remain
  valid in persisted records forever and `MUST NOT` be rewritten.

### Lifetime contract

An **operation** is a single logical write performed in response to one
processing occasion, such as handling one command, one consumed delivery,
or one API request, regardless of how many records or streams it writes
to.

- `annotations`
  - `MUST` be persisted as part of the record's permanent representation
    when the record is persisted.
  - Follow the mutability of the record they are attached to: immutable
    on immutable records such as events, updatable on mutable records
    such as resources, subject to the ownership rules above.
  - `SHOULD` be projected onto downstream resources by default. Projectors
    `MAY` filter on a per-rule basis.
- `transient_annotations`
  - Are attached at write time for the lifetime of the delivery.
  - Describe the operation, not an individual record: an operation that
    writes multiple records `MUST` attach the same entries to every
    record it writes.
  - `MUST NOT` be projected onto downstream resources. This is absolute,
    not a default: the field does not exist on resources.
  - `MAY` be persisted alongside the record for replay and audit purposes.
    Persistence `MAY` be opted out of per stream or per system when the
    cost is not justified; the default is to persist.
  - Are best-effort context. Because persistence can be opted out and
    propagation can filter, consumers `MUST NOT` depend on an entry
    being present for correctness.
- Resources and projections `MUST NOT` expose a `transient_annotations`
  field.

### Propagation

Projection and propagation are distinct behaviors. Projection copies
metadata from a record onto a downstream resource (a read model), and is
governed by the lifetime contract above. Propagation copies metadata from
an incoming record onto the new records emitted as a result of processing
it, such as a workflow consuming an event and writing the events that
result from it.

The two fields have opposite defaults:

- `annotations` describe the record they are attached to and do not
  propagate by default. The writer of a resulting record `MAY` copy an
  entry forward when the fact it records is also true of the new record.
- `transient_annotations` travel with the write path. A consumer that
  emits records as a result of processing an incoming record `SHOULD`
  propagate the incoming `transient_annotations` onto all of the records
  the resulting operation emits, not a chosen subset, so that context
  spanning a causation chain (for example, correlating the deliveries of
  a workflow end to end) survives every hop without becoming part of any
  record's projected representation. Consumers `MAY` filter or add
  entries when propagating, subject to the ownership rules above;
  filtering is per entry and applies uniformly across the operation's
  resulting records.

Key collisions during propagation resolve as follows:

- When an operation processes multiple incoming records whose
  `transient_annotations` conflict on a key, the consumer `MUST` resolve
  the conflict deterministically. Dropping the conflicting key is the
  safe default; a wrong value is worse than an absent one.
- When a propagated entry collides with an entry the consumer attaches
  itself, the consumer's own entry wins: the author of the operation
  outranks inherited context.
- Propagation carries unprefixed keys across writer boundaries, where
  they can collide with another writer's unprefixed keys. Callers that
  need collision-free keys across a chain `SHOULD` use a prefix.

Propagation terminates where projection begins: resources never expose
transient annotations, regardless of how many hops an entry traveled.

### Choosing between the two

The writer decides at attach time:

- If the entry is a fact about the record that should remain true forever,
  it belongs in `annotations`.
- If the entry is meaningful only for the delivery and processing of the
  record, it belongs in `transient_annotations`. Transient does not mean
  single-hop: an entry can propagate across an entire processing chain
  (see Propagation) and still never surface on a resource.

This decision is local to the writer and does not require coordination with
consumers.

## Consequences

- Every record type answers "where does caller metadata go?" the same
  way, and a reader checks exactly two fields to find it.
- Correlating a causation chain end to end works without polluting any
  resource's projected representation, because propagation and projection
  have opposite defaults.
- Prefix ownership makes cross-team key collisions a naming violation
  rather than a runtime surprise, and lint can enforce the syntax.
- Two doors are deliberately left open for downstream decisions: key
  registries (enumerating well-known keys per system) and a separate
  selectable field for systems that operate a selector engine. Neither
  changes this spec.

## Links

- [Kubernetes: Labels and Selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)
- [Kubernetes: Annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/)
- [CloudEvents specification](https://github.com/cloudevents/spec)
