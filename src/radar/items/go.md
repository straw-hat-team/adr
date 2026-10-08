---
name: Go
quadrant: languages-and-frameworks
history:
  - edition: '2026.3'
    ring: hold
adr: '1631648331'
tags: [go, backend, cli]
---

# Go

Go is simple to read, quick to compile, and good at network services and command line tools. None of that changed.

It is on Hold because [Rust](./rust.md) became the single language for new services and programs, and that
consolidation is the point: one way to build, maintain, and observe everything we run.

Hold is not a removal order. Existing Go codebases are not broken and can keep being maintained. New services and
programs should start in Rust.

See [ADR#1631648331](../../adrs/1631648331/README.md).
