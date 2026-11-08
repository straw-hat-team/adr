---
id: '2351330444'
title: Configuration unions use kind and spec
state: Draft
created: 2026-11-07
tags: [configuration, serialization, union-types, validation]
category: General
---

# Configuration unions use kind and spec

## Context

Configuration often offers alternatives with different settings: a storage
backend can use a bucket in one provider or another, and a credential source
can read a file or an environment variable. These are union types: one value
selects one variant and carries that variant's configuration.

Without a shared representation, each configuration file invents its own
discriminator, nesting and inference rules. Alternatives can also overlap: a
`bucket` field alone does not identify its storage provider. Readers and
validators need an explicit selection and a predictable place for its settings.

The names `kind` and `spec` provide that separation. They are familiar from
Kubernetes configuration and remain usable across configuration formats and
implementation languages.

## Decision Drivers

- Make the selected variant visible without inferring it from other fields.
- Give variant-specific configuration a consistent, descriptive home.
- Validate each variant precisely as its options grow.
- Keep the file representation independent of a language's union syntax.

## Resolution

### Representation

A configuration field whose alternatives are distinct variants **MUST** use a
mapping with the keys `kind` and `spec`:

```yaml
storage:
  kind: s3
  spec:
    bucket: example-artifacts
    region: us-east-1
```

- `kind` **MUST** be a string selecting a documented variant.
- `spec` **MUST** contain the configuration defined for that selected variant.
  Variants with named settings use a mapping for `spec`.
- Both keys **MUST** be present in the resolved union value, including when
  documented defaults supply the value.
- Variant-specific fields **MUST** live in `spec`, rather than alongside
  `kind`, under a provider-named key, or under a generic `value` key.
- A variant with no settings **MUST** use an empty mapping for `spec`:

  ```yaml
  storage:
    kind: disabled
    spec: {}
  ```

The rule applies at each union field. An ordinary object, optional field or
scalar enumeration such as `logLevel: info` does not need a union wrapper.
Settings independent of the selected variant **SHOULD** stay in the containing
configuration, outside its `spec`.

The key names and nesting **MUST** remain the same across supported file
formats. For example, the S3 configuration above is represented in JSON as:

```json
{
  "storage": {
    "kind": "s3",
    "spec": {
      "bucket": "example-artifacts",
      "region": "us-east-1"
    }
  }
}
```

And in TOML as:

```toml
[storage]
kind = "s3"

[storage.spec]
bucket = "example-artifacts"
region = "us-east-1"
```

### Validation

Readers **MUST** validate `kind` and `spec` together against the selected
variant's schema. A union is a choice among defined shapes, rather than an
unrestricted settings map.

- Readers **MUST** reject unknown kinds, missing required keys, an incorrectly
  typed `spec`, and fields not allowed by the envelope or selected variant.
- Readers **MUST NOT** infer a different kind from the fields in `spec` or
  silently fall back to another variant when validation fails.
- Configuration schemas **MUST** express the relationship between each kind
  and its allowed `spec`, for example through JSON Schema's `oneOf` and
  `const`, or equivalent validation in the configuration reader.
- Readers **MUST** validate the final resolved pair after applying documented
  defaults or overlays. Stale fields from another variant **MUST NOT** be
  silently discarded to make the result valid.
- Validation errors **SHOULD** identify the failing configuration path and
  expected variant without exposing sensitive configuration values.

For example, if `nats` defines only a `bucket`, this configuration is invalid
because `region` belongs to the S3 variant:

```yaml
storage:
  kind: nats
  spec:
    bucket: example-artifacts
    region: us-east-1
```

### Adoption

New configuration unions **MUST** use this representation. Existing formats
adopting it **MUST** use an explicit migration consistent with their
compatibility policy. Renaming `value` to `spec` or moving flat fields changes
the serialized contract; readers **MUST NOT** guess between old and new shapes.

## Considered Options

### `kind` with a nested `spec`

- Good, because selection and settings have stable, descriptive names.
- Good, because variant fields remain grouped as their schemas grow.
- Bad, because it adds a level of nesting.

### Flat fields alongside `kind`

- Good, because small configurations are shorter and can still be validated.
- Bad, because the boundary between shared fields and variant settings is
  implicit, and the envelope grows with provider-specific options.

### `kind` with a nested `value`

- Good, because it provides the same explicit discriminator and payload split.
- Bad, because `value` says less about the payload's configuration role.

### Provider-named keys or inference from fields

- Good, because simple examples can be compact.
- Bad, because each configuration needs its own selection convention, and
  overlapping field names make inference ambiguous.

## Decision Outcome

Chosen option: `kind` with a nested `spec`, because a consistent, meaningful
boundary makes configuration unions easier to read, document and validate.

### Advantages

- Readers can find the variant and its settings in the same place across files.
- Configuration tooling can validate one selected variant with precise errors.
- Adding a variant preserves the surrounding configuration structure.

### Disadvantages

- Small configurations require additional nesting.
- Existing formats need a deliberate migration when adopting the convention.

## Links

- [ADR#0000000001: ADR Style guide](../0000000001/README.md)
- [Understanding Kubernetes objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/)
- [Serde adjacently tagged enums](https://serde.rs/enum-representations.html#adjacently-tagged)
- [JSON Schema composition](https://json-schema.org/understanding-json-schema/reference/combining#oneOf)
