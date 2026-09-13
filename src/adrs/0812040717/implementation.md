# Implementation guidance for ADR#0812040717

Supporting material for
[ADR#0812040717](./README.md). The ADR is normative; this file is not. It
records how rules 8 and 9 land in the languages we use, and the default each
ecosystem ships that violates rule 10.

## The reframing

An identity field makes a governed document a **discriminated union**, tagged
by `$schema`. Every decoder below is that language's first-class support for
the form, so the two-phase read of rule 9 is the native path rather than a
workaround.

## The gate, restated for implementers

```text
phase 1: read identity only        -> unknown? one error, stop. Never validate the body.
phase 2: decode against that one schema -> report as many field errors as you can.
```

Accumulating across the gate is the failure worth guarding against. Validating
a `v3` document against the `v2` schema yields a page of errors when the true
answer is one sentence about an old binary.

## Go

`encoding/json` stops at the first error and does not accumulate, so the phases
are explicit.

```go
type header struct {
    Schema string `json:"$schema" toml:"$schema" yaml:"$schema"`
}

func Load(data []byte) (Config, error) {
    var h header
    if err := json.Unmarshal(data, &h); err != nil { // phase 1, ignores all other keys
        return nil, fmt.Errorf("cannot read $schema: %w", err)
    }

    s, ok := byURL[h.Schema] // generated, exact match
    if !ok {
        return nil, unknownSchema(h.Schema) // the gate
    }

    return s.Decode(data) // phase 2, same bytes, concrete type
}
```

Notes:

- Decoding the bytes twice is the right trade for a configuration file. Where
  the payload is large, hold the body in a `json.RawMessage` field instead of
  re-parsing.
- **Do not** call `Decoder.DisallowUnknownFields()` on a read path. Rule 10
  requires readers to tolerate unknown keys so that an additive change does not
  break an older binary.
- `errors.Join` accumulates phase-two validation errors.
  `json.UnmarshalTypeError` carries `Struct`, `Field`, and `Offset`, which is
  enough to point a human at a line.

For a marshalled column, the bare-name rendering is a key into machinery that
already exists, which is the practical reason rule 5 stores the name rather
than the URL:

```go
mt, err := protoregistry.GlobalTypes.FindMessageByName(
    protoreflect.FullName(row.Schema), // "trogon.config.v1.Workspace"
)
msg := mt.New().Interface()
proto.Unmarshal(row.Payload, msg)
```

## Rust

serde's internally tagged enum is this pattern directly.

```rust
#[derive(Deserialize)]
#[serde(tag = "$schema")]
enum Config {
    #[serde(rename = "<schema-base>/trogon/config/v1/Workspace.json")]
    V1(WorkspaceV1),
    #[serde(rename = "<schema-base>/trogon/config/v2/Workspace.json")]
    V2(WorkspaceV2),
}
```

The gate is free: an unrecognised tag produces `unknown variant ..., expected
one of ...` and the body is never decoded, which is rule 7 with no code.

Caveats before committing to the declarative form:

- serde **buffers the content** of an internally tagged enum, which rules out
  zero-copy borrowed `&str` fields and streaming. Acceptable for configuration
  files; worth knowing for large payloads.
- The unknown-tag message is serde's, so the diagnostics latitude rule 8 allows
  is unavailable. Where the message matters, use Go's explicit two-phase shape:
  deserialize a header struct or a `Map<String, &RawValue>` first, then
  dispatch.
- `serde_path_to_error` around phase two supplies the field path that serde
  otherwise omits. Accumulating many field errors still needs a validation pass
  after decoding, because serde stops at the first structural error.
- Do **not** put `deny_unknown_fields` on the variant structs, per rule 10.
- prost has no global registry, so for a marshalled column the generated match
  table is the registry. `prost-reflect` offers a descriptor pool queryable by
  name where dynamic lookup is genuinely needed, at the cost of carrying a
  descriptor set at runtime.

## Zod

```ts
const Config = z.discriminatedUnion('$schema', [
  z.looseObject({
    $schema: z.literal('<schema-base>/trogon/config/v1/Workspace.json'),
    // v1 fields
  }),
  z.looseObject({
    $schema: z.literal('<schema-base>/trogon/config/v2/Workspace.json'),
    // v2 fields
  }),
]);

const result = Config.safeParse(doc);
if (!result.success) report(result.error.issues);
```

Notes:

- Use `discriminatedUnion`, never `z.union`. That choice **is** rule 9 expressed
  as a library call: a plain union validates against every branch and returns
  the union of their complaints, while a discriminated union reads the tag,
  selects one branch, and reports only that branch's issues.
- Zod is the one of the three that accumulates natively, so `issues` is already
  the full list with paths.
- The unknown-key default here is not merely strict, it is **lossy**: a plain
  `z.object` silently strips unknown keys. Harmless while loading, and a rule 10
  violation the moment a document is read and written back, which is the exact
  pruning failure the ADR cites Kubernetes for. Use `z.looseObject`
  (`.passthrough()` on Zod 3) on any path that persists what it read.

## Why rule 3 puts `$schema` first

serde and Zod buffer regardless, so neither benefits. The ordering pays off in
two other places: a hand-written streaming reader can dispatch before buffering
the body, and classifying a large tree of files becomes reading one line per
file rather than parsing each one.
