# Supporting research

This material supports the Draft [ADR#8612050910](../README.md), Declarative NATS subject and interaction contracts.

The research snapshot is **2026-11-01**. It preserves the technology survey, the required interaction vocabulary, the
declarative-versus-runtime analysis, and the open packaging/generation questions. The ADR states the proposed direction;
these references explain its evidence and alternatives.

## Explanations

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

- [Complete proposed AsyncAPI file](./example.md) and [profile JSON Schema](./profile-schema.md): draft artifacts for
  reviewing the proposed format.
- [Technology landscape, maturity and licensing](./technology-landscape.md): standards, catalogs, generators,
  registries, native NATS tools, configuration, testing, diagramming and legacy alternatives, with primary-source links.
- [Evaluation approaches and open questions](./evaluation.md): candidate approaches, entity relationships and
  representative acceptance scenarios.

## Evidence limits

Public specifications, project repositories and vendor documentation supply the external evidence. Links are kept near
the claims they support. Product versions, licenses, archive states and integrations are dated findings and should be
refreshed before adoption.

No surveyed generator was installed or tested against a NATS deployment. Proposed policy fields and examples are design
requirements, not an implemented or standardized schema. No candidate has demonstrated the complete required interaction
coverage in this research.

The examples define intended semantics. They do not establish an existing application protocol, a new wire envelope, or
a selected workflow engine.

## Continuing the draft

Review the proposed file and its worked example, refine adapter and validation contracts, and compare existing workflow
definitions against the remaining composition requirements. Cross-application packaging remains open. Optional
generation follows that contract; it does not replace the documentation.
