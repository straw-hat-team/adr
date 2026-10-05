---
id: '6874603764'
title: Protobuf Package Namespaces Across Products
state: Reviewing
created: 2026-10-03
tags: [naming, protobuf, api-design, versioning, platform-design]
category: Platform
---

# Protobuf Package Namespaces Across Products

## Context

Several products now define protobuf schemas, and
[trogon-proto](https://github.com/TrogonStack/trogon-proto) already holds
the shared ones under the `trogon.` root: `trogon.actor.v1alpha1`,
`trogon.consistency.v1alpha1`, `trogon.content.v1alpha1`,
`trogon.env.v1alpha1`, `trogon.error.v1alpha1`,
`trogon.hierarchy.v1alpha1`, `trogon.nats.micro.v1alpha1`,
`trogon.object_id.v1alpha1`, `trogon.relay.v1alpha1`,
`trogon.stream.v1alpha1`, and `trogon.uuid.v1`. The repository is public
and is published as the Buf module `buf.build/trogonstack/trogon-proto`.
Existing ADRs already depend on that root
([ADR#4761776210](../4761776210/README.md),
[ADR#6310044131](../6310044131/README.md),
[ADR#1394819661](../1394819661/README.md)) without any decision saying
what the root means, who may define a package under it, or where a
product's own schemas go. Each product answers those questions alone
today, and the answers will drift.

A protobuf package is a global namespace. The package path is baked into
every `google.protobuf.Any` type URL, every generated client, and every
descriptor registry, so a package move is a wire-incompatible break. The
decision has to be made once, before product packages exist, because it
cannot be corrected cheaply afterwards.

The obvious precedent is
[googleapis](https://github.com/googleapis/googleapis). It places shared
components (`google.type`, `google.rpc`, `google.api`,
`google.longrunning`) and every product (`google.pubsub.v1`,
`google.cloud.kms.v1`) under one `google.` root in one repository, and
governs the split with
[AIP-213](https://google.aip.dev/213) (common components) and
[AIP-215](https://google.aip.dev/215) (API-specific protos). Parts of it do
not transfer. The single repository is an export of Google's
internal monorepo, and its value to consumers, one dependency, is what the
Buf Schema Registry provides for separate repositories. And the
`google.<product>` versus `google.cloud.<product>` split is a historical
accident Google cannot undo because the packages are published.

Kubernetes solved the same namespace problem for API groups with the
pieces this ADR adopts: a DNS-owned group name, a version ladder of
`v1alpha1`, `v1beta1`, `v1`, and additive-only changes once a version is
stable. Products that expose both protobuf schemas and Kubernetes-style
API groups will otherwise grow two taxonomies for one product, with one
word for an area in proto and another in Kubernetes.

A package root is not a DNS name. Nothing in protobuf or in the Buf
Schema Registry checks domain ownership, and Google's root is `google.`,
not `google.com.`. Owning trogon.com is irrelevant to this decision.
Where DNS does enter, in service names, the domains are allocated by
[ADR#0184938998](../0184938998/README.md). `Any` type URLs are not a DNS
position and keep the standard `type.googleapis.com/` prefix.

### Considered options

**One repository, products under the shared root** (the googleapis
shape: `trogon.trogondb.v1`, or `trogon.cloud.trogondb.v1`).

- Good, because a consumer depends on one module and one root.
- Bad, because trogon-proto is public while products may be private and
  release on their own cadence. One repository forces one visibility and
  one release train.
- Bad, because the root then means two things, the organization and the
  shared library, and a product-specific type is indistinguishable from
  a shared one by its name. googleapis shows the second-segment split
  that results and shows that it becomes permanent.

**Separate repositories, products under `trogon.<product>.`.**

- Good, because products release independently.
- Bad, for the same reason as above: the root loses its meaning, and the
  only thing that distinguishes `trogon.hierarchy` from `trogon.trogondb`
  is knowing which second segments are products.

**One root, a reserved list of shared names** (`trogon.<name>` for
products and tools, the googleapis shape across separate repositories).

- Good, because there is a single root and product names stay plain.
- Bad, because shared packages and products compete for the same second
  segment forever. The collision already exists: the shared
  `trogon.stream.v1alpha1` occupies the name the trogonstream product
  would need, and `actor`, `content`, `relay`, and `env` are equally
  plausible product names. Google can live with this because one
  organization allocates every name from one monorepo; without a central
  registry nothing prevents the next collision.

**One root, a container segment for products** (`trogon.apis.<name>`,
the shape of `google.cloud.<product>`).

- Good, because it cannot collide with a shared package and keeps one
  root.
- Bad, because every type name, generated module, and `Any` type URL
  carries a segment that names nothing, and ownership is enforced per
  module anyway, so the single root buys no practical guarantee.

**Unversioned shared leaf packages** (`google.type` and `google.rpc`
carry no version suffix).

- Good, because value types rarely need an incompatible change.
- Bad, because it forecloses the one escape hatch that exists when they
  do, and the repository already runs the version ladder on every
  package today.

**Shared root for shared packages only; each owner under its own
root, in its own repository, versioned.** Chosen, below. Tools and
products are not distinguished: an owner is anything that publishes
schemas of its own.

## Resolution

1. `trogon.` is the shared root. A package under it **MUST** be
   product-agnostic, and every such package **MUST** live in trogon-proto
   and ship in the `buf.build/trogonstack/trogon-proto` module. Products
   **MUST NOT** define packages under `trogon.`, and `trogon.<product>.`
   is forbidden for any product name.
2. Every product or tool that publishes its own schemas, called an
   owner here, has the package root `trogon<name>.`, whether or not it
   owns a domain. Tools and products follow the same rule. The current
   roots are `trogondb.`, `trogonkv.`, `trogonstream.`, `trogonlang.`,
   `trogonos.`, `trogonbrowser.`, `trogonai.`, `trogoncloud.` for the
   hosted control plane, and `trogonatlas.` for Atlas. Every owner
   renders its DNS identifiers under `<name>.trogonstack.com` per
   [ADR#0184938998](../0184938998/README.md), whether or not a
   `trogon<name>` domain exists, so `trogondb.` pairs with
   `db.trogonstack.com` and never with `trogondb.com`.
   An owner's packages **MUST** live in its own repository, **MUST** be
   published as its own module under `buf.build/trogonstack`, and
   **MUST NOT** be added to trogon-proto. A module **MUST NOT** publish
   a package outside its own root. Consumers that need several depend on
   several modules; the registry organization, not a monorepo, provides
   the single place to find them.
3. This ADR is the record of which root belongs to which owner. A new
   owner adds its root to rule 2 before publishing any package under it.
   A dedicated registry that enforces the allocation is deferred until
   the number of owners makes a document insufficient.
4. A package qualifies for `trogon.` only when all of the following
   hold: it is used or clearly reusable by two or more products, or it
   implements a platform-wide decision (annotations per
   [ADR#5177934677](../5177934677/README.md), identifiers per
   [ADR#4860595695](../4860595695/README.md), hierarchy per
   [ADR#4761776210](../4761776210/README.md), errors per
   [ADR#0129349218](../0129349218/README.md)); it carries no product
   noun and no product-specific enum value; and no equivalent exists in
   the protobuf well-known types or in googleapis `google.type`,
   `google.rpc`, or `google.api`. This is the AIP-213 and AIP-215 line
   drawn for our roots.
5. Promotion is a new package in trogon-proto plus deprecation of the
   product package. A package **MUST NOT** be renamed or moved across
   roots, because the path is part of the wire format for `Any` and part
   of every generated client. The product package keeps serving until
   its consumers have migrated, then is marked deprecated and left in
   place.
6. Every package, shared or product, **MUST** carry a version suffix
   following [AIP-185](https://google.aip.dev/185):
   `v1alpha1`, `v1beta1`, `v1`. Stability follows
   [AIP-180](https://google.aip.dev/180) and
   [AIP-181](https://google.aip.dev/181): once `v1` ships, changes are
   additive only, and an incompatible change is a new major version in a
   new package. We deliberately do not copy the unversioned
   `google.type` and `google.rpc` shape. The exemption in rule 7 of
   [ADR#1394819661](../1394819661/README.md) concerns the spelling of
   `object_id` and `object_type`, not versioning; the package is
   `trogon.object_id.v1alpha1` and climbs the ladder like any other.
7. Reuse before definition. Packages **MUST** import the protobuf
   well-known types and googleapis (`buf.build/googleapis/googleapis`)
   for money, dates, intervals, status, error details, field behavior,
   and resource annotations, and **MUST NOT** vendor, copy, or redefine
   them. A local type is justified only when the semantics differ and
   the difference is documented in the package: `trogon.error.v1alpha1.Code`
   is the existing case, an error-only mirror of `google.rpc.Code` that
   omits `OK` by design and whose options describe how a runtime emits
   `google.rpc.Status` and `google.rpc.ErrorInfo` rather than replacing
   them.
8. Directory path **MUST** equal package path
   ([AIP-191](https://google.aip.dev/191)), as in
   `proto/trogon/hierarchy/v1alpha1/node.proto`. `buf lint` with the
   `STANDARD` category, which enforces both the version suffix and the
   directory match, and `buf breaking` against the module's `main`
   branch **MUST** pass in CI for every repository that publishes
   protobuf. Google's
   [api-linter](https://linter.aip.dev/) **SHOULD** run as well, so the
   schemas stay conformant with the googleapis conventions they import.
9. A protobuf package `<root>.<area>.<version>` and a Kubernetes API
   group `<area>.<root-domain>/<version>` are two renderings of one
   namespace identity. The `<area>` segment **MUST** be the same word in
   both and both use the same version ladder, so `trogondb.clusters.v1`
   and `clusters.db.trogonstack.com/v1alpha1` are recognizably one area. The
   two versions are not coupled: each reports the maturity of its own
   surface, and a `v1alpha1` manifest group **MAY** wrap a `v1` package,
   as Google's Config Connector groups do over stable `google.*`
   packages. `<root-domain>` is the owner's identifier namespace from
   [ADR#0184938998](../0184938998/README.md), `<name>.trogonstack.com`
   for every owner, so `trogonatlas.<area>.<version>` pairs with
   `<area>.atlas.trogonstack.com/<version>`. An owner whose schemas form
   a single area **MAY** omit `<area>` on both sides, pairing
   `trogonatlas.<version>` with `atlas.trogonstack.com/<version>`. For
   shared packages the pair is `trogon.<area>.<version>` and
   `<area>.trogonstack.com/<version>`. A message that is the spec or
   status of a Kind **SHOULD** carry the Kind's name. Which DNS domain
   renders which root is owned by
   [ADR#0184938998](../0184938998/README.md); this ADR owns the package
   side and the alignment constraint only.
10. `Any` type URLs **MUST** be
    `type.googleapis.com/<package>.<Message>`, the prefix every protobuf
    library writes by default, and an organization host such as
    `type.trogonapis.com` **MUST NOT** be used. An owner's service host
    is its package root under the API umbrella,
    `trogon<name>.trogonapis.com`, per the allocation in
    [ADR#0184938998](../0184938998/README.md). Package roots stay
    DNS-free.
11. Language options derive from the package and from the owner's
    identifier namespace, never the reverse. `java_package` **MUST**
    begin with the owner's reversed identifier namespace,
    `com.trogonstack.` for a shared package and `com.trogonstack.<name>.`
    for an owner, such as `com.trogonstack.db.` and
    `com.trogonstack.atlas.`, per the
    reverse-DNS rule of [ADR#0184938998](../0184938998/README.md).
    `csharp_namespace` is the package in PascalCase, and `go_package` is
    the import path of the generated module. These options **SHOULD** be
    produced by the generator configuration rather than written into
    each file. A domain **MUST NOT** appear in the protobuf package
    itself: `com.trogonstack.hierarchy.v1alpha1` is a Java package, not
    a protobuf package, because a domain-shaped package lengthens every
    generated type name and matches neither googleapis nor Buf style.

## Consequences

- A reader can tell from the first segment whether a type is shared or
  belongs to an owner, and a reviewer has a rule to cite when a product
  noun appears under `trogon.`.
- A shared name and an owner name can never collide, because they live
  under different roots. No existing shared package has to move.
- Every package already in trogon-proto satisfies rules 1, 6, and 8
  today, so the decision records current practice rather than requiring
  a migration. `trogon.uuid.v1` is the one package already at `v1`, and
  is therefore already under the additive-only rule.
- trogon-proto does not yet depend on `buf.build/googleapis/googleapis`;
  the first shared package that needs a `google.type` or `google.api`
  symbol adds the dependency rather than a local copy, per rule 7.
- Promotion costs a deprecation cycle. That is the price of never
  breaking a published path, and it is paid rarely because rule 4 keeps
  product-specific types out of the shared root in the first place.
- Products choosing an `<area>` name choose it once for proto and
  Kubernetes together, and each surface's version ladder is read on
  both sides.
- [ADR#1394819661](../1394819661/README.md),
  [ADR#4761776210](../4761776210/README.md), and
  [ADR#6310044131](../6310044131/README.md) need no amendment; the root
  they assume is now defined.

## Links

- [ADR#0184938998](../0184938998/README.md): Domain Names and DNS-Rooted
  Identifiers Across Products
- [ADR#1394819661](../1394819661/README.md): Resource Is the Generic
  Noun, Object Is a Runtime Term
- [ADR#4761776210](../4761776210/README.md): Resource hierarchy via
  untyped recursive nodes
- [ADR#6310044131](../6310044131/README.md): Hierarchy position is
  referenced by a bare parent field
- [ADR#5177934677](../5177934677/README.md): Annotations and Transient
  Annotations
- [ADR#4860595695](../4860595695/README.md): Human-Readable IDs
- [ADR#0129349218](../0129349218/README.md): Error Specification
- [trogon-proto](https://github.com/TrogonStack/trogon-proto)
- [googleapis](https://github.com/googleapis/googleapis) and its
  [Buf Schema Registry module](https://buf.build/googleapis/googleapis)
- [AIP-180: Backwards compatibility](https://google.aip.dev/180)
- [AIP-181: Stability levels](https://google.aip.dev/181)
- [AIP-185: API versioning](https://google.aip.dev/185)
- [AIP-191: File and directory structure](https://google.aip.dev/191)
- [AIP-213: Common components](https://google.aip.dev/213)
- [AIP-215: API-specific protos](https://google.aip.dev/215)
- [Buf lint rules and categories](https://buf.build/docs/lint/rules/)
- [Buf breaking change detection](https://buf.build/docs/breaking/overview/)
- [Protocol Buffers: `Any` type URLs](https://protobuf.dev/programming-guides/proto3/#any)
- [Kubernetes API groups and versioning](https://kubernetes.io/docs/reference/using-api/#api-groups)
