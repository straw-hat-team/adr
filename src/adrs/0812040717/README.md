---
id: '0812040717'
title: Schema Identity Is One Versioned Name With Two Renderings
state: Draft
created: 2026-09-12
tags: [naming, schema, versioning, configuration, serialization, api-design]
category: Platform
---

# Schema Identity Is One Versioned Name With Two Renderings

## Context

Two carriers in our systems hold a value whose shape is not known from the
type system at the point of reading: a configuration file loaded from disk
(TOML, YAML, or JSON) and a value marshalled into a single database column.
Each service currently invents its own answer, so we have `version`,
`schemaVersion`, `apiVersion`, `$schema`, an untagged blob, and nothing at
all, sometimes within one repository. A reader cannot tell whether a file it
was handed is older than the binary reading it, and a migration cannot select
the rows it needs to rewrite.

The phrase "schema version field" hides four separate questions, and most of
the damage in the wild comes from collapsing them:

1. **Identity.** Which shape is this?
2. **Version.** Which revision of that shape?
3. **Encoding.** How are the bytes laid out?
4. **Whose version.** The version of the _format_ is not the version of _the
   document_.

Question 4 is not hypothetical. AWS had to add a disambiguation note to its own
reference: the IAM `Version` element "is used within a policy and defines the
version of the policy language. A policy version, on the other hand, is created
when you make changes to a customer managed policy", and it "specifies the
language syntax rules that are to be used to process a policy". One vendor,
one word, two orthogonal meanings, and a note explaining the collision after
the fact. A bare `version` key is therefore unavailable to us.

### The asymmetry between the two carriers

Question 3 is already answered for a file and unanswered for a column, and this
is what stops one rule from covering both.

A file named `trg.toml` is TOML because the name says so, and the loader chose
a parser before reading a byte. A column is `text` or `bytea`: nothing outside
the string says TOML versus JSON versus protobuf binary, and nothing says which
type it holds. For files, encoding is out of band and settled. For columns, it
has to be recorded, and a protobuf-encoded value cannot record anything inside
itself at all.

### Why an in-band identity field exists

The field is not documentation. It exists to break a bootstrap problem: a
reader has to pick a validator before it knows what it is looking at. That
gives the rule its own boundary.

- A **statically typed protobuf field** gives the reader the type at the call
  site, and protobuf's wire rules make evolution safe without a payload
  version: "Adding new fields is safe... old binaries simply ignore the new
  field when parsing", while "Changing field numbers for any existing field is
  not safe" and a removed field's number "must not [be] used again". Identity
  in the message would be a redundant second source of truth that can disagree
  with the first.
- **`google.protobuf.Any`** has no such context, which is exactly why
  `type_url` exists.
- A **hand-edited config file** never has it. Even where the filename fixes the
  type, it cannot fix the version, because a file on disk is always potentially
  older or newer than the binary reading it.

Kubernetes states the same necessity for its own documents: "All of the JSON
accepted and returned by the server has a schema, identified by the `kind` and
`apiVersion` fields", and those fields "are required for proper decoding of the
object. They may be populated by the server by default from the specified URL
path, but the client likely needs to know the values".

### Identity is a name, not an address

Protobuf's `Any` is the sharpest statement of this. `type_url` "Identifies the
type of the serialized Protobuf message with a URI reference consisting of a
prefix ending in a slash and the fully-qualified type name", and then:

> The prefix is arbitrary and Protobuf implementations are expected to simply
> strip off everything up to and including the last `/` to identify the type.
> `type.googleapis.com/` is a common default prefix... This prefix does not
> indicate the origin of the type, and URIs containing it are not expected to
> respond to any requests.

The same file instructs authors accordingly:

> Do not write a scheme on these URI references so that clients do not attempt
> to contact them.

Two things follow. First, protobuf already ships **one identity with two
renderings**: the bare fully-qualified name inside a descriptor, and a
URL-shaped string on the wire, where the URL half is decoration to be stripped.
That precedent is the shape of this decision. Second, resolvability was never
the contract. JSON Schema says the same of `$id`: "Note that this URI is an
identifier and not necessarily a network locator", and "A schema need not be
downloadable from the address if it is a network-addressable URL".

### Where the version belongs in the name

Our ecosystem already answers this, because our protobuf packages carry it:
"All protos specific to an API **must** be within a package with a major
version (e.g., `google.library.v1`)", and the segment is normative rather than
decorative. Alpha means users "**must** have no expectation of stability",
beta "**must** be considered complete and ready to be declared stable", and
stable "**must** be fully-supported over the lifetime of the major API
version", with breaking changes deferred to "the next major version". [ADR#6310044131](../6310044131/README.md)
already writes field types this way (`trogon.hierarchy.v1alpha1.NodeId`).

So the version segment is load-bearing and already in use. Adding a second
field to restate it would create a pair that can disagree.

### What `$schema` actually is, and what it is good for

`$schema` is not a general-purpose identity key. The JSON Schema specification
defines it as "both used as a JSON Schema dialect identifier and as the
identifier of a resource which is itself a JSON Schema", it "MUST be a URI
(containing a scheme)", and it "MUST NOT appear in non-resource root schema
objects". The specification gives it **no meaning in an instance document**.

Its use in instance documents is a tooling convention, and an extremely well
supported one. VS Code: "The association of a JSON file to a schema can be done
either in the JSON file itself using the `$schema` attribute". The
yaml-language-server honours an inline top-level `$schema` key alongside its
modeline form. The devcontainer specification goes furthest and reserves it as
a legal instance property in its own schema, described as "The JSON schema of
the `devcontainer.json` file". Biome's documented example embeds the release in
the path, `https://biomejs.dev/schemas/2.4.13/schema.json`, which is the
folder-per-version pattern JSON Schema itself uses for dialects.

The consequence is a hard constraint rather than a preference: **a `$schema`
key obligates a resolvable URL.** Every tool that reads the key will try to
fetch the value, so putting a bare dotted name there breaks editor validation
outright. `$schema` and a bare name are not two spellings of one choice, they
are mutually exclusive.

This repository already took the URL side of that trade in
[ADR#6860374633](../6860374633/README.md), which pins a CloudEvents `dataschema` to a versioned path
(`.../6860374633/v1/dataschema.json`).

### Considered options

**Option A: two fields, `apiVersion` plus `kind`.** Kubernetes defines
`apiVersion` as `GROUP/VERSION` and `kind` as "the name of a particular object
schema".

- Good, because it is instantly legible to anyone arriving from Kubernetes, and
  the group axis can carry a stability signal, which Gateway API uses
  deliberately by keeping experimental resources in a separate group.
- Bad, because neither field identifies the schema alone, so every consumer
  concatenates them and we have shipped a compound key without saying so.
- Bad, because it is a second vocabulary. Our protobuf types are already named
  `package.version.Type`, and `apiVersion`/`kind` cannot hold that shape
  without being re-split at every boundary.
- Bad, because the group half attracts long-lived churn. Argo's own tracker
  carries open discussions about promoting `argoproj.io/v1alpha1` and about
  moving the API out of the shared `argoproj.io` group.
- Honest caveat: no primary source states a rationale for the split into two
  fields. The closest documented reason is that API groups "evolve independent
  of other API groups". The argument against the option is therefore about fit
  with our existing naming, not a defect in theirs.

**Option B: a bare `schema` key holding the name.**

- Good, because it is a legal bare key in TOML, YAML, and JSON with no quoting.
- Bad, because `schema` is an ordinary domain word for anything that touches a
  database, so a configuration file that legitimately wants `schema = "public"`
  collides with the reserved key. This is the same collision reasoning
  [ADR#6310044131](../6310044131/README.md) applied against `container`.
- Bad, because it forfeits editor validation, which then has to be reintroduced
  as a second optional `$schema` key. SARIF shows that the pair is workable,
  requiring `version` whose value "SHALL be the string '2.1.0'" while allowing
  an optional `$schema` "whose value SHALL be a URI that uniquely identifies
  the JSON schema corresponding to the version of this document". Workable, but
  two keys where one suffices, and two keys that can disagree.

**Option C: one media type string, OCI style.** `mediaType` values such as
`application/vnd.oci.image.manifest.v1+json` pack vendor tree, type, version,
and encoding into one token, built on the RFC 6838 structured syntax suffix.

- Good, because it answers all three of identity, version, and encoding at
  once, and travels over HTTP unchanged.
- Good, because OCI's separate integer `schemaVersion` demonstrates the failure
  of the alternative: it "MUST be `2`", "The value of this field will not
  change", and it "MAY be removed in a future version of the specification". A
  bare integer schema version decays into a vestigial constant.
- Bad, because it is the least readable form in a hand-edited file and no
  editor will validate against it.
- Retained in part: the encoding half of this option is adopted below for
  columns, where encoding genuinely needs recording.

**Option D: out-of-band identity via a registry.** Confluent frames payloads
with a version byte plus a "4-byte schema ID as returned by Schema Registry".

- Good, because it is the most compact form on the wire.
- Bad, because the value is unreadable without a registry round trip, which is
  unacceptable for a file a human edits and for a database row an operator
  inspects.

**Option E: identity out-of-band per connection.** Stripe pins the version to
the account or request, overridable "by setting the `Stripe-Version` header".

- Bad, because it does not apply. A stored file or row has no request context
  to inherit from, and it outlives any connection that wrote it.

## Resolution

Chosen option: one versioned name, rendered as a URL where a tool will read it
as a URL and as a bare fully-qualified name everywhere else, because it matches
the `Any` precedent of one identity with two renderings, keeps a single
vocabulary shared with our protobuf packages, and buys editor validation
without a second key that can disagree with the first.

1. **One canonical identity.** Every schema governed by this ADR has exactly
   one identity, the fully-qualified name `<package>.<version>.<TypeName>`, for
   example `trogon.config.v1.Workspace`. The version segment is the only place
   a version is recorded, and it follows the stability channels already in use
   (`v1`, `v1beta1`, `v1alpha1`).

2. **Two renderings, mechanically interconvertible.** The name has a canonical
   URL rendering, `<schema-base>/<package-path>/<version>/<TypeName>.json`, for
   example `<schema-base>/trogon/config/v1/Workspace.json`. Package dots become
   slashes, the type name is preserved verbatim including any nesting dots, and
   the version segment is the delimiter between the two halves in both
   renderings, so conversion is unambiguous in either direction. `<schema-base>`
   is one constant per ecosystem, not per service. Generated schemas and the
   loader tables that recognise them are produced from the name, so the two
   renderings cannot drift.

3. **Text configuration files carry the URL rendering under `$schema`.** The
   key is **REQUIRED**, and it **MUST** be the first key in the document. It
   **MUST NOT** be treated as optional on the grounds that the filename implies
   the type, because the filename cannot imply the version. In TOML the key is
   written quoted, `"$schema" = "..."`, because "Bare keys may only contain
   ASCII letters, ASCII digits, underscores, and dashes (A-Za-z0-9_-)". The
   quoting is an accepted cost, paid once per file, in exchange for validation
   and completion in every editor our engineers use.

4. **Protobuf messages MUST NOT carry an identity field.** A statically typed
   field supplies the type, and protobuf's compatibility rules supply the
   evolution. Where the type is genuinely dynamic, the carrier is
   `google.protobuf.Any`, whose `type_url` holds the same name under an
   arbitrary prefix, and whose JSON form is the `@type` member. We write no
   hand-rolled equivalent.

5. **A marshalled column keeps identity and encoding in sibling columns, never
   inside the value.** A row carries `schema` holding the bare name and
   `content_type` holding a media type, alongside the payload column. Two
   reasons make this non-negotiable rather than stylistic. A protobuf binary
   payload cannot hold an in-band key at all, so an inside-the-document rule
   would need a second rule for the binary case. And identity has to be
   queryable without parsing: PostgreSQL's own guidance is that "targeted
   expression indexes are likely to be smaller and faster to search than a
   simple index" over whole documents, which is what selecting rows by schema
   during a migration requires.

6. **`content_type` records encoding only, and the spellings are fixed.** The
   value is a media type in the RFC 9110 sense, indicating "the media type of
   the associated representation". We write `application/json` for JSON and
   `application/protobuf` for protobuf binary, choosing one spelling so the
   several in circulation do not mix. Encoding is never inferred from the
   payload's first byte. Note that a version **MUST NOT** be appended as a
   media type parameter; the version lives in `schema` and nowhere else.

7. **Reading fails closed.** A missing identity, an unrecognised identity, or a
   recognised name whose version is newer than the reader supports is an error,
   never a silent default to the latest known shape. Iceberg states the rule
   plainly for its own `format-version`: "Implementations must throw an
   exception if a table's version is higher than the supported version".
   Kubernetes permits the same refusal, "may reject unrecognized values". This
   matches our fail-closed default for unspecified enum values.

8. **Recognition is an exact-match lookup, never a parse.** Both renderings
   resolve through generated tables, one keyed by name and one keyed by URL,
   and a value that is not a key is unknown. Readers **MUST NOT** normalise the
   value, tolerate a differing trailing slash, case-fold it, split it on
   separators to dispatch, or dereference it. The interconvertibility in rule 2
   exists so the generator can build both tables, not so that runtime code can
   perform string surgery. A reader **MAY** parse an unrecognised value for the
   sole purpose of writing a better error message, which changes the wording of
   the failure and never its outcome.

9. **A governed document is read in two phases, and the identity is a gate.**
   Phase one reads the identity and nothing else. Phase two decodes the body
   against the single schema that identity resolves to. Validation errors
   **MUST NOT** accumulate across the gate: when phase one fails, the reader
   reports that one failure and **MUST NOT** validate the body, because every
   error it would find is an artefact of validating against the wrong schema.
   Within phase two, a reader **SHOULD** report as many errors as it can rather
   than stopping at the first. This makes the identity field a discriminated
   union tag, which is the form the decoders in our languages already take.

10. **A version bump is required only for a breaking change.** Adding an
   optional field, or adding an enum value, is an in-place change and keeps the
   name. Removing or renaming a field, changing its type, changing its meaning,
   or making an optional field required is a new version segment. Readers
   **MUST** ignore unknown keys rather than reject them, so that an in-place
   addition does not break an older reader. Unknown keys **MUST NOT** be
   silently dropped on a write path that persists the document, because
   Kubernetes shows the cost of the alternative: "if you specify a field that
   the API server does not recognize, the unknown field is pruned (removed)
   before being persisted".

11. **A document's own revision is never spelled `version`.** Rules 1 and 2
   describe the shape of the document. A counter, a revision number, or an
   etag describing this particular document's history is a separate field with
   a separate name, and the bare key `version` is reserved out of use in both
   roles to prevent the IAM collision quoted above.

12. **Foreign formats keep their own names at the boundary.** A file whose
    schema is defined by a standard we do not control keeps that standard's
    keys, and adapters translate at the edge. This ADR governs the formats we
    define.

## Consequences

- Rules 8 and 9 land on a decoder each of our languages already ships, since
  an identity field is a discriminated union tag. Per-language guidance,
  including the one unknown-key setting each ecosystem gets wrong by default,
  lives in [implementation.md](./implementation.md).
- One name to learn. The string an engineer reads in a config file, in a
  database column, in a protobuf package, and in a generated schema path is the
  same name in every place, differing only in punctuation.
- Editors validate hand-edited configuration with no per-repository setup,
  because `$schema` is already wired into VS Code and the yaml-language-server.
- Loaders never need the network. Per JSON Schema's own `$id` semantics the URL
  is an identifier, so recognition is a string match against a compiled-in
  table, and air-gapped installations are unaffected. Only the editor
  experience depends on the URL resolving.
- `<schema-base>` becomes infrastructure with an uptime and immutability
  obligation. Once published, a schema URL never changes meaning, and a
  breaking change publishes a new path instead.
- The rule is machine-checkable rather than review-dependent: a linter can
  assert that every governed text file opens with a `$schema` whose value is
  the canonical rendering of a known name, that no protobuf message declares an
  identity field, and that every payload column has its `schema` and
  `content_type` siblings.
- Migrations become ordinary queries. Selecting every row of a superseded
  schema is an indexed predicate on one column, with no payload parsing.
- Rule 5 costs storage per row and needs a consistency check, since a sibling
  column can in principle disagree with a payload that happens to be
  self-describing. The check belongs in the write path that sets both.
- TOML files are marginally uglier, by exactly one pair of quotes.
- The decision is reversible in one direction only. Moving from a bare name to
  `$schema` later would require rewriting every stored document; moving away
  from `$schema` later would only require dropping a key.

## Links

- [Implementation guidance for this ADR](./implementation.md)
- [ADR#6310044131](../6310044131/README.md): Hierarchy position is referenced
  by a bare parent field
- [ADR#6860374633](../6860374633/README.md): Error CloudEvents Adapter
- [ADR#4860595695](../4860595695/README.md): Human-Readable IDs
- [google.protobuf.Any (`type_url` semantics, `@type` in JSON)](https://github.com/protocolbuffers/protobuf/blob/main/src/google/protobuf/any.proto)
- [ProtoJSON mapping](https://protobuf.dev/programming-guides/json/)
- [Protobuf "Updating A Message Type"](https://protobuf.dev/programming-guides/proto3/)
- [AIP-215: versioned packages](https://google.aip.dev/215)
- [AIP-181: stability levels](https://google.aip.dev/181)
- [AIP-180: backwards compatibility](https://google.aip.dev/180)
- [JSON Schema 2020-12 Core: the `$schema` keyword](https://json-schema.org/draft/2020-12/json-schema-core#name-the-schema-keyword)
- [JSON Schema 2020-12 Core: the `$id` keyword](https://json-schema.org/draft/2020-12/json-schema-core#name-the-id-keyword)
- [VS Code: JSON schema association via `$schema`](https://code.visualstudio.com/docs/languages/json)
- [yaml-language-server: schema association](https://github.com/redhat-developer/yaml-language-server)
- [devcontainer base schema (`$schema` reserved as an instance property)](https://github.com/devcontainers/spec/blob/main/schemas/devContainer.base.schema.json)
- [Biome configuration (versioned schema URL)](https://biomejs.dev/guides/configure-biome/)
- [SARIF 2.1.0: `version` and `$schema`](https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/sarif-v2.1.0-os.html)
- [Kubernetes API conventions: `kind` and `apiVersion`](https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md)
- [Kubernetes TypeMeta ("may reject unrecognized values")](https://github.com/kubernetes/apimachinery/blob/master/pkg/apis/meta/v1/types.go)
- [Kubernetes CustomResourceDefinitions (field pruning)](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/)
- [CloudEvents: `specversion`, `type`, `dataschema`, `datacontenttype`](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md)
- [OCI image manifest (`schemaVersion`, `mediaType`)](https://github.com/opencontainers/image-spec/blob/main/manifest.md)
- [RFC 6838: structured syntax name suffixes](https://www.rfc-editor.org/rfc/rfc6838.html)
- [RFC 9110: Content-Type](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-type)
- [Confluent Schema Registry wire format](https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html)
- [AWS IAM policy `Version` element (disambiguation note)](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_version.html)
- [AWS Systems Manager document `schemaVersion`](https://docs.aws.amazon.com/systems-manager/latest/userguide/documents-syntax-data-elements-parameters.html)
- [Apache Iceberg table spec (`format-version`)](https://github.com/apache/iceberg/blob/main/format/spec.md)
- [Apache Avro specification (object container file header, schema resolution)](https://avro.apache.org/docs/1.11.1/specification/)
- [PostgreSQL JSON types (JSONB indexing guidance)](https://www.postgresql.org/docs/current/datatype-json.html)
- [Stripe API versioning (`Stripe-Version` header)](https://docs.stripe.com/api/versioning)
- [TOML v1.0.0 (bare key characters)](https://toml.io/en/v1.0.0)
