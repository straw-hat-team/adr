---
name: Elixir
quadrant: languages-and-frameworks
history:
  - edition: '2026.2'
    ring: adopt
  - edition: '2026.3'
    ring: hold
adr: '1631648331'
tags: [elixir, backend]
---

# Elixir

Elixir was a first-class language here, with its own body of conventions covering pattern matching in function
heads and named bindings in Ecto queries. Those conventions still apply to every Elixir codebase we maintain.

It is on Hold because [Rust](./rust.md) became the single language for new services and programs, and that
consolidation is the point: one way to build, maintain, and observe everything we run.

Hold is not a removal order. Existing Elixir services are not an emergency and can keep being maintained and
extended. New services and programs should start in Rust.

See [ADR#1631648331](../../adrs/1631648331/README.md).
