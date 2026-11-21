---
id: '2613749008'
title: Events Keep Provenance in the Envelope and Domain Actors and Times in the Payload
state: Draft
created: 2026-10-11
tags: [events, event-sourcing, provenance, authorization, taxonomy, schema]
category: Platform
---

# Events Keep Provenance in the Envelope and Domain Actors and Times in the Payload

## Context

Every event answers "who?" and "when?", and event contracts keep answering
both in incompatible ways. One contract carries `created_by`, another
`requested_by`, another `author_id`; one copies `recorded_at` into its
payload, another relies on the store's timestamp. Attempts to clean this up
swing between two failures:

- **Everything in the payload.** Each contract reinvents the same fields
  under different names, some events have them and some do not, and a field
  the caller fills in records whoever the caller claimed to be.
- **Everything in the envelope.** Every actor field is treated as
  provenance and removed from the payload, so rules such as "only the author
  may withdraw" or "the reviewer must differ from the author" have nothing in
  the event to read, and rebuilding state has to reach into transport
  metadata.

Both failures come from treating different facts as one. "Who" covers the
principal that caused this event to be recorded, and also the roles a
business rule consults: owner, author, approver, assignee. "When" covers the
moment the platform observed the event, the moment a producer claims the
thing happened, and times that are part of the business fact: a due date, an
effective date, a deadline.

[ADR#8779742261](../8779742261/README.md) already separates these for
resources: fields that drive standing rules name authority, never history,
and `provenance` is reserved for genuinely historical records. Authority can
transfer; history cannot. This ADR applies that rule to events.

## Resolution

Chosen option: "provenance in the envelope, stamped by the platform on every
event; domain actors and domain times in the payload, derived by the
decision; state rebuilt from payloads only", because it is the only
arrangement in which no caller can claim to be someone else, no contract
reinvents provenance, and no business rule depends on metadata that
describes how an event was carried.

### 1. The envelope records provenance, on every event

Provenance is history about the event itself: who caused it to be recorded
and when the platform observed it. The platform **MUST** attach it to the
envelope of every event, for every contract, without the contract asking.
No contract models it and no contract can leave it out.

- The **causing actor** is a value on the
  [ADR#8779742261](../8779742261/README.md) ladder: an authenticated
  principal, or `system` naming the process that acted with no principal
  attached. When a principal acts for another and the platform verified the
  delegation, the envelope **MUST** record both.
- The **recorded time** is when the event was first written to storage. The
  platform **SHOULD** also record when it accepted the request that led to
  the event.
- The **occurrence time** is when the producer says the thing happened, for
  a device that synced late or an outside system reporting its own clock.
  The envelope **MAY** carry it, labeled as the producer's claim and kept
  distinct from times the platform observed.

The platform **MUST** take the causing actor from authentication and the
times from its own clock, never from anything the caller sent. Copying,
restoring, replicating, or rebuilding a stream **MUST** keep the original
provenance; an operation that moves an event records its own actor and time
on its own record, not over the original.

How a given storage system encodes these values is its own concern and
**MUST** be documented alongside it.

### 2. The payload records the actors a business rule consults

A domain actor is a role: owner, author, approver, assignee, the person a
request was made for. Roles drive standing rules, can transfer, and can
differ from whoever caused the event. A role **MUST** live in the payload,
named for the role (`owner_id`, `author_id`, `approver_id`), never with a
history name such as `created_by` or `updated_by`.

A role in the payload **MUST NOT** be a value the caller asserts about
themselves. The decision derives it from the authenticated actor handed to
it alongside the command. A command **MAY** name a different principal only
when naming someone else is itself the action being authorized, such as
reassigning an owner or importing records from another system.

A role that equals the causing actor is not a duplicate of provenance.
`ProjectCreated` names its `owner_id` even when the owner is the principal
that created it: one value is a standing role that can transfer, the other
is a historical record that cannot.

### 3. The payload records the times a business rule consults

A domain time is part of the business fact: when an occurrence was due, when
a change takes effect, when a measurement was taken, when a window closes. A
domain time **MUST** live in the payload, named for what it means (`due_at`,
`effective_at`, `measured_at`, `expires_at`), never with a generic name a
reader would mistake for a provenance time.

A rule that depends on "now" reads it from a trusted clock handed to the
decision alongside the command, never from the caller. When the outcome
matters later, the event records it as a domain fact: a distinct event such
as `ResponseRejectedAsLate`, or a named payload time a later rule reads.

### 4. State is rebuilt from payloads only

Rebuilding state from events **MUST** read only event payloads and their
position in the stream, never envelope provenance. Everything a later rule
needs is a domain fact and is therefore already in a payload. Provenance
serves audit, diagnostics, and attribution in read models; a projection
**MAY** show it, but a rule **MUST NOT** depend on it.

### Applying the rules

Ask of each value: does any business rule, now or later, read this?

| Value                                      | Rule reads it? | Where it lives                             |
| ------------------------------------------ | -------------- | ------------------------------------------ |
| Principal or process that caused the event | No             | Envelope, stamped by the platform          |
| Principal the action was made for          | Only as a role | Envelope; payload too when a rule reads it |
| Owner, author, approver, assignee          | Yes            | Payload, derived by the decision           |
| When the platform accepted or recorded it  | No             | Envelope, stamped by the platform          |
| When the producer claims it happened       | No             | Envelope, as the producer's claim          |
| Due date, effective date, deadline         | Yes            | Payload, named for its meaning             |

## Considered Options

### Provenance in each contract's payload

Rejected. Every contract reinvents the same fields under different names,
some events have them and some do not, and a field the caller fills in
records a claim rather than a fact.

### Everything in the envelope, with state rebuilt from it

Rejected. It treats history as authority, which
[ADR#8779742261](../8779742261/README.md) forbids. It breaks wherever the
causing actor is not the role holder: an agent acting for a person, an
import whose importer is not the author, an ownership transfer. It also ties
rebuilding state to transport metadata.

### Opt-in metadata entries

Rejected. Opt-in metadata exists only where someone remembered it, and a
free-form entry cannot tell a value the platform set from one a caller
supplied.

### A separate audit log instead of envelope provenance

Rejected. An audit log written beside the event can disagree with it or miss
it; provenance on the envelope is written with the event, in the same
operation.

## Consequences

- Fields removed from payloads as "provenance" that a business rule reads are
  domain roles or domain times and return to the payload, derived by the
  decision.
- The decision needs the authenticated actor and a trusted clock alongside
  each command; neither comes from the command's own fields.
- Every process that produces events without a principal is named, so the
  envelope can say which `system` process acted.
- Prior art agrees on the split: CloudEvents carries the producer's
  occurrence `time` as event context and defines no actor; event stores keep
  causation and correlation in metadata, not in the event body.

## Links

- [ADR#8779742261: Actor and Authority Taxonomy for Managed Systems](../8779742261/README.md)
- [CloudEvents specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md)
