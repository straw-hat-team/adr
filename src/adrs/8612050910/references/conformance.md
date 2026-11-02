# Conformance and evidence

Acceptance for proposed v0.2 in Draft [ADR#8612050910](../README.md) is tied to exact profile, bundle and fixture
revisions. Structural validation, generation support and observed execution are separate evidence. None implies the
others.

## Offline artifact check

With Python, jsonschema and PyYAML available, run from the repository root:

```sh
mise exec -- uv run --offline --no-project --with jsonschema --with pyyaml \
  python src/adrs/8612050910/scripts/check-contract-examples.py
```

Offline execution requires those packages to be cached. The checker never fetches schema references. Supply a local
official AsyncAPI 3.1.0 schema with `--asyncapi-schema` to add standard structural validation. The helper checks
selected static properties and pure completion vectors; it is not a compiler, broker runtime or complete compatibility
prover.

`--update-lock` explicitly refreshes native/import digests and exact-byte lock entries, then checks them. Normal
validation never repairs mismatches. Fixtures contain valid/invalid tokens, parse/render outputs, invalid-contract
mutations with named diagnostics, deterministic identity and pure completion cases. Unknown fixture kinds fail. Both
language backends consume the same expected values and diagnostics.

## Required capabilities

### Contract interpretation

Reject duplicate keys, unsafe paths, missing files, wrong identities, hash mismatches and unresolved references.
Validate standard/profile schemas, adapters, directions, cross-app links, domains/overlap, filters, bindings and
required payload fields. Check native authority, features and adapter kinds. Reject generated-name collisions and
unsupported features. No renderer warning, network lookup or validator tolerance may supply missing semantics.

Pipeline operation bindings share subject/payload coverage checks. The helper validates the explicit `stageInput`
pointer form, payload literal types, transform adjacency and known payload source types. It compares resolved schemas
exactly and rejects unsupported dataflow instead of inferring a prior result. Interaction stages pass their declared
argument object through without partial binding overrides or caller-supplied generated identities.

### Rust and TypeScript subjects

Prove identical value acceptance/rejection, byte rendering and parse round trips. Test enum/prefix/length boundaries,
filters versus concrete addresses, unknown addresses, literal/parameter collisions and stable generated names. Carry
contract ID/version/digest and source channel/operation identity. Descriptor-only support advertises no execution
capability.

### Core and replies

Test first checked response, invalid response, timeout, inbox lifetime, receiver ownership, publisher namespace and
response permissions. Show matching-stream capture of Core traffic without claiming storage acknowledgment. Exercise
live and durable views separately.

### Durable delivery and recovery

Test independent obligations, discard-new capacity refusal, retention periods, outcome-before-consumer-ack and stable
delivery identity. Crash before send, after send/before PubAck, after result/before consumer ack and during
reconciliation. Recover without inventing a new attempt. Resource discontinuity becomes indeterminate, not presumed
delivery. Effect evidence is separate.

### State, time and ownership

Test create-if-absent, conflicting invocation input, deterministic operation identity, authoritative admission stamping,
expected-revision writes, immutable manifests/decisions and bounded record admission. Race result/deadline under the
same serialized time guard. Test the exclusive upper bound, expired writes without mutation, clock rollback and stale
reads. Plain KV CAS or a timestamp after an unconditional write does not prove the complete store contract.

Test lease acquire/renew/loss, revocation, stale-owner/fence rejection, stable anycast branch IDs, deterministic
reassignment, retry backoff and attempt/deadline budgets. Prove effect fencing independently against its actual commit
boundary.

### Gathering, cancellation and pipelines

Cover duplicate/conflicting/wrong-peer/stale results, distinct-branch/peer votes, fixed/fractional thresholds,
empty/impossible audiences, all-terminal versus all-successful, timeout and immutable closure. Membership cannot grow a
frozen quorum. Aggregation errors cannot rewrite accepted facts.

Cover stopped/already-completed/unknown cancellation, stale commands, absent replies, grace expiry and indeterminate
survivors. Test waitFor, stage input/output compatibility, transforms and stop-on-partial/failure/indeterminate.
Recovery reuses stage invocation keys rather than repeating an accepted effect under a new identity.

### Workflows

Run Open Workflow 1.0.4 conformance and this profile's interaction/invocation cases. Verify locked source/schema,
authenticated typed HTTP invocation, pending polling, idempotent retries and workflow timeout. Fork/compete does not
imply peer authorization or quorum. Selecting the language does not certify an engine.

## Reports and adoption

Reports record implementation name/version/revision, profile version, contract/bundle/fixture digests, tested binding
and time, and pass/fail/unsupported per capability. Required failures block execution. A subject-only generator can be
adopted for its proven surface without claiming runtime support. Reports are immutable revision-specific evidence, not
permanent product badges.

No surveyed transport generator, executor or workflow engine is certified here. The selected implementation direction is
a profile-owned compiler with Rust/TypeScript subject backends. Building it and testing providers are implementation
work under these acceptance criteria, not unresolved architecture choices.

## Shared fixture data

The checker consumes this exact source. Runtime/broker requirements above remain separate from these offline vectors.

::: details Fixture definitions

<<< ../assets/conformance-cases.json{json}

:::

## Checker CLI regression suite

```sh
mise exec -- uv run --offline --no-project --with jsonschema --with pyyaml \
  python src/adrs/8612050910/scripts/test-contract-examples.py
```

This exercises intact and mutated bundles through the public CLI. It proves rejection of nested referenced payload type
mismatches, symlinked parent paths, unsupported literal alphabets and quorum fractions above one. Fractions equal to or
below one are accepted for peer, group and scope audiences, alongside acceptance of the unchanged fixture bundle.
Pipeline cases cover missing/overlapping bindings, undeclared inputs, wrong payload literal types, incompatible
transform inputs, invalid stage-input pointers, undefined previous output and partial interaction overrides, as well as
successful field-by-field stage-input bindings. Nested required-field coverage has a CLI regression. A focused inferred
token-schema check compares value acceptance with the finite domain, including trailing newlines; the CLI does not
expose the inferred schema as an output artifact.
