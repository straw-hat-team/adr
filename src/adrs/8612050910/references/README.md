# Supporting research

This material supports the Draft [ADR#8612050910](../README.md), Declarative NATS subject and interaction contracts.

The research snapshot is **2026-11-01**. It preserves the technology survey, the required interaction vocabulary, the
declarative-versus-runtime analysis, and the answers to packaging/generation questions. The ADR states the proposed
direction; these references explain its evidence and alternatives.

## Explanations

- [Resolved decisions](./decisions.md): answers and rationale for the prior open design questions.
- [Profile v0.2 reference](./profile-reference.md): exact vocabulary, authority, bindings and supported surface.
- [Runtime semantics](./runtime-semantics.md): trust, admission, guarded state, recovery, ownership and closure.

- [Proposed application contract](./specification.md): the concrete file format, a worked execution trace, field
  semantics, and validation boundaries. Start here to understand how someone would write and use a contract.
- [Declarative coverage and specification packaging](./declarative-coverage.md): what a contract can define, which facts
  remain dynamic, where checks run, and why a versioned interaction profile may be needed.
- [Subject code generation](./subject-code-generation.md): the intended Rust/TypeScript outputs, subject grammar
  requirements, transport distinctions, generator candidates and standard parameter-model limitations.
- [Interaction patterns and NATS mappings](./interaction-patterns.md): unicast, multicast, scoped broadcast, fan-out,
  anycast, scatter, gather/fan-in, scatter-gather and pub-sub/pipelines, including policy and broker boundaries.
- [Research context and evidence](./research-context.md): the problem boundary, research method, maturity labels and
  limits of automatic discovery.

## References

- [Conformance](./conformance.md): offline checks, shared fixtures and provider acceptance gates.
- [Adapter protocol schemas](./adapter-contracts.md): closed control/context records and typed method data.

- [Complete proposed AsyncAPI file](./example.md) and [profile JSON Schema](./profile-schema.md): draft artifacts for
  reviewing the proposed format.
- [Technology landscape, maturity and licensing](./technology-landscape.md): standards, catalogs, generators,
  registries, native NATS tools, configuration, testing, diagramming and legacy alternatives, with primary-source links.
- [Evaluation approaches and resolved questions](./evaluation.md): candidate approaches, entity relationships and
  representative acceptance scenarios.

## Evidence limits

Public specifications, project repositories and vendor documentation supply the external evidence. Links are kept near
the claims they support. Product versions, licenses, archive states and integrations are dated findings and should be
refreshed before adoption.

No surveyed generator was tested against a NATS deployment. Proposed fields, schemas and protocols are this Draft
contract, not established ecosystem runtime capabilities. Offline fixtures establish their checked static slices. No
candidate has demonstrated complete required interaction execution in this research.

The examples define proposed schemas and protocols, not an already deployed application protocol. No generator or
workflow engine is certified by the presence of an example.

## Approval and implementation

Design questions have proposed answers. Draft remains the approval state. Implementation follows the specified compiler,
adapter and conformance boundaries; it must not silently reopen policy or claim untested provider guarantees.
