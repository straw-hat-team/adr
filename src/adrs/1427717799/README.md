---
id: '1427717799'
title: OpenAPI and AsyncAPI documents live in openapi/ and asyncapi/
state: Draft
created: 2026-11-01
tags: [directory, openapi, asyncapi, documentation]
category: Platform
---

# OpenAPI and AsyncAPI documents live in openapi/ and asyncapi/

## Context

[ADR#9316364013](../9316364013/README.md) reserves `proto/`, `wit/` and `otel/`
for schema sources, and [ADR#4711775939](../4711775939/README.md) fixes the
layout inside each. OpenAPI and AsyncAPI documents describe HTTP and
message-driven interfaces the same way, but neither ADR names a place for them.
Repositories place them under `docs/`, `api/`, `spec/` or the repository root,
so tooling paths drift and the layout is learned again on every clone.

Unlike buf or Weaver, neither specification dictates a directory layout, so the
second level has to be decided here.

## Resolution

- You **MUST** add `openapi/` and `asyncapi/` to the schema source directories
  reserved by [ADR#9316364013](../9316364013/README.md), one directory per
  specification, named after the specification and not after a tool.
- You **MUST NOT** place these documents in `docs/`, `api/`, `spec/` or any
  other directory.
- You **MUST** keep only hand-written specification documents, and the files
  they reference, in the directory. Configuration that drives a tool, such as
  linting or code generation, goes under `.config/<tool>/`. Generated code
  **MUST** live in the language workspace that consumes it.
- You **MUST NOT** commit a document generated from another schema source, such
  as `proto/`, or from code. Generate it at build time instead.
- You **MUST** write documents in YAML.
- You **MUST** name the document `openapi.yaml` or `asyncapi.yaml`, and place
  it directly in the directory when the repository describes one interface.
  When it describes more than one, you **MUST** use `<service>/` per interface,
  where `<service>` is the name of the component that owns it.
- You **MAY** place the directory next to a single component or service when
  the document belongs to that component alone. It **MUST** still use the same
  name.
- You **MUST** keep prose about the interface, such as guides and explanations,
  out of these directories. It follows
  [ADR#3223845695](../3223845695/README.md).

  ```txt
  .
  ├── openapi
  │   ├── openapi.yaml            # one interface
  │   └── <service>/openapi.yaml  # more than one interface
  └── asyncapi
      ├── asyncapi.yaml
      └── <service>/asyncapi.yaml
  ```

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [ADR#4711775939](../4711775939/README.md): Schema source directories
- [ADR#3223845695](../3223845695/README.md): Documentation structure
- [OpenAPI Specification, document structure](https://spec.openapis.org/oas/latest.html#document-structure)
- [AsyncAPI specification](https://www.asyncapi.com/docs/reference/specification/latest)
