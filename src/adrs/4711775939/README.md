---
id: '4711775939'
title: Schema source directories
state: Approved
created: 2026-10-07
tags: [directory, protobuf, wit, opentelemetry, weaver]
category: Platform
---

# Schema source directories

## Context

[ADR#9316364013](../9316364013/README.md) reserves `proto/`, `wit/` and `otel/`
for schema sources. This ADR fixes the layout inside each.

Protocol Buffers settled on `proto/` long ago, and the WIT toolchain defaults
to `wit/`. OpenTelemetry registries had no consensus: the upstream repository
uses `model/` because the directory predates Weaver, and our own repositories
used `semconv/`, `telemetry/` and `otel/semconv/`. `semconv` also names a
conventional commit type and `telemetry/` is reserved for observability code
inside packages, so neither can name the directory.

## Resolution

- You **MUST NOT** name a schema directory after the tool that consumes it, and
  you **MUST NOT** use `model/`, `schemas/`, `semconv/` or `telemetry/`.
- You **MUST** keep only schema sources, and the configuration that describes
  them as a module, in the directory. Configuration that drives a tool, such as
  code generation, goes under `.config/<tool>/`. Generated code **MUST** live
  in the language workspace that consumes it.
- You **MAY** place a schema directory next to a single component or service
  when the schema belongs to that component alone. It **MUST** still use the
  same name.

### Protocol Buffers

- You **MUST** keep `buf.yaml` in the v2 format and `buf.lock` inside
  `proto/`, so the module carries its own configuration and lock.
- You **MUST** keep `buf.gen.yaml` under `.config/buf/`, and **MUST** run buf
  from the repository root, passing the directory or template:
  `buf lint proto`, `buf dep update proto`,
  `buf generate --template .config/buf/buf.gen.yaml`.
- You **MUST** mirror the package name in the directory path and end it with
  the version segment, as buf lint requires.

  ```txt
  .
  ├── .config/buf/buf.gen.yaml
  └── proto
      ├── buf.yaml            # version: v2
      ├── buf.lock
      └── <package path>/*.proto   # acme.billing.v1 is acme/billing/v1/
  ```

### WebAssembly Interface Types

- You **MUST** keep one WIT package directly under `wit/`, with fetched
  dependencies in `wit/deps/`.
- You **MUST** use `wit/<package>/` when a repository publishes more than one
  package.

  ```txt
  .
  └── wit
      ├── world.wit
      ├── <interface>.wit
      ├── deps.toml
      ├── deps.lock
      └── deps/
  ```

### OpenTelemetry semantic conventions

- You **MUST** follow Weaver's vocabulary for the second level: `registry/`,
  `templates/` and `policies/`, one per flag that consumes it.
- You **MUST** name the registry manifest `manifest.yaml`.
- You **MAY** omit `templates/` and `policies/` when a shared Weaver package
  already provides them.

  ```txt
  .
  └── otel
      ├── registry            # --registry
      │   ├── manifest.yaml
      │   └── <vendor>/<domain>/*.yaml
      ├── templates           # --templates, Weaver reads templates/registry/<target>/
      └── policies            # --policy
  ```

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [buf configuration, v2 `buf.yaml`](https://buf.build/docs/configuration/v2/buf-yaml/)
- [cargo-component default WIT directory](https://github.com/bytecodealliance/cargo-component/blob/main/src/metadata.rs)
- [wkg `--wit-dir` default](https://github.com/bytecodealliance/wasm-pkg-tools/blob/main/crates/wkg/src/wit.rs)
- [Weaver registry commands](https://github.com/open-telemetry/weaver/blob/main/crates/weaver_cli/README.md)
- [Weaver, define your own telemetry schema](https://github.com/open-telemetry/weaver/blob/main/docs/define-your-own-telemetry-schema.md)
