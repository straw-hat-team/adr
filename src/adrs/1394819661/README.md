---
id: '1394819661'
title: Resource Is the Generic Noun, Object Is a Runtime Term
state: Approved
created: 2026-08-16
tags: [naming, vocabulary, api-design]
category: Platform
---

# Resource Is the Generic Noun, Object Is a Runtime Term

## Context

These ADRs need one noun for the thing the platform governs. Two are in
use, and the split between them is accidental rather than semantic.

[ADR#4860595695](../4860595695/README.md) decided the identifier
convention, and its resolution reads `[resource type]_[resource id]`.
The only occurrence of the word "object" in that ADR is the title of the
article it cites, Stripe's "Designing APIs for humans: Object IDs". The
protobuf package that implements that exact rule is named
`trogon.object_id` and calls the same string `object_type`. One rule,
one prefix, two spellings. The seam is provenance: the identifier
convention came from Stripe, which says object, while the governance
vocabulary came from Google, which says resource.

Nothing in these ADRs treats an object as a different kind of thing from
a resource. The word appears 53 times across 12 ADRs and never once as a
first-party noun for a governed thing. Twenty-nine of those uses mean a
data shape or a language construct: a JSON object
([ADR#6860374633](../6860374633/README.md)), an object preferred over
positional arguments ([ADR#4031218897](../4031218897/README.md)), the
`slots` object ([ADR#1358452048](../1358452048/README.md)), the Absinthe
`object` macro ([ADR#4615273139](../4615273139/README.md)), an
extensible object structure ([ADR#0129349218](../0129349218/README.md)),
and runtime global objects
([ADR#5541831634](../5541831634/README.md)). The remainder are verbatim
quotes from vendor documentation, or links to it.

Industry evidence, verified against primary sources (linked below):

- **Stripe**, the origin of our prefix convention, calls its first-class
  API entities objects: "Stripe Objects have a prefix at the beginning
  of the ID", where those objects are PaymentIntent, Customer,
  PaymentMethod, and Charge. Those are precisely what this repo calls
  resources, and the article draws no line between the two words.
- **Kubernetes** names the type with the word resource, not object: "A
  resource type is the name used in the URL (`pods`, `namespaces`,
  `services`)". At the instance level the two words are nearly
  coextensive: "A single instance of a resource type is called a
  _resource_, and also usually represents an _object_", where objects
  are "persistent entities in the Kubernetes system".
- **Google, AWS, and Azure** use resource as the governed noun
  throughout (AIP-122 resource names, AIP-124 resource association,
  ARM's `managedBy` on resources). Where they also say object, an object
  is a kind of resource rather than an alternative to one: "Resources in
  Amazon S3 are buckets, objects, access points, or jobs", and "Object
  operations are S3 API operations that act upon the object resource
  type".

No vendor draws a boundary where object and resource name different
kinds of thing. The disagreement between them is dialect, so this
decision is a choice of dialect and not a discovery of two concepts.

### Considered options

**Object as the generic noun.** It is Stripe's word, and Stripe is where
our prefix convention came from.

- Bad, because it collides with a meaning this repo already depends on.
  Twenty-nine existing uses mean a data shape or a program construct, so
  adopting object as the governance noun makes "the object must be an
  object" a correct sentence.
- Bad, because it fails the collision test these ADRs already apply.
  `container` was retired for colliding with OCI, `place` and
  `placement` for colliding with workload scheduling, and `scope` and
  `location` were rejected for auth scopes and regions
  ([ADR#6310044131](../6310044131/README.md),
  [ADR#4761776210](../4761776210/README.md)). Object fails the same
  test, and it fails it against our own vocabulary rather than a
  vendor's.
- Bad, because the compound collides too. `ObjectId` is MongoDB's
  12-byte BSON identifier type, "a 4-byte timestamp", "a 5-byte random
  value", and "a 3-byte incrementing counter", generated automatically
  for `_id`. Naming a prefixed, human-readable identifier `object_id`
  invites that reading in any system that also stores documents.
- Bad, because it pulls an architectural discussion toward object
  orientation and runtime semantics: instances, methods, and identity in
  memory, none of which a decision about storage or transport wants to
  raise.

**Resource as the generic noun.**

- Good, because it is already the working noun: 10 ADRs use it, and
  every rule written about governed things is written in it.
- Good, because it stays architectural and layer-neutral. It reads
  correctly for an HTTP endpoint, a database row, a queue, a secret, a
  file, and cloud infrastructure alike.
- Good, because it matches the sources these decisions cite, so a rule
  and its citation stay in one dialect.
- Good, because it carries a claim that object does not: that the
  platform governs the thing. Several ADRs make rules for that set and
  not for everything that has an identifier.
- Bad, because resource also names a consumable commodity (quotas, CPU
  and memory, `RESOURCE_EXHAUSTED`), so one passage can carry two senses
  of the word. Rule 4 below handles that.

**One word for every layer.** Rejected: it loses precision exactly where
a document is discussing the layer, and the layer words are already
understood without explanation.

## Resolution

Chosen option: resource, because it is the only candidate that does not
collide with vocabulary this repo already depends on, and because it is
what the decision governing identifiers already says.

1. **Resource** is the generic architectural noun. ADRs **MUST** use it
   for a governed thing regardless of transport or storage: "the
   resource has a stable identifier", "the resource may have multiple
   representations", "the resource lifecycle is managed by...",
   "metadata is associated with the resource", "the resource is
   persisted in PostgreSQL and referenced by id".
2. A more specific word **SHOULD** be used when the layer is the point:

   | Word          | Meaning                                 |
   | ------------- | --------------------------------------- |
   | resource      | the generic architectural thing         |
   | entity        | a domain thing with identity            |
   | record, row   | its database representation             |
   | object, value | its in-memory or program representation |
   | document      | its document-oriented representation    |

   The last four name representations of one resource rather than
   different things; choosing one states which layer is under
   discussion.

3. Object **MUST NOT** be used as the generic noun. It is reserved for
   the in-memory and program sense and for the serialization sense (a
   JSON object, a GraphQL object). Quoting a source verbatim is not a
   violation of this rule.
4. Resource carries a second and equally legitimate sense: a consumable
   commodity such as disk, memory, or quota. gRPC uses the word
   correctly in that sense in `RESOURCE_EXHAUSTED`, "Some resource has
   been exhausted, perhaps a per-user quota, or perhaps the entire file
   system is out of space". Within these ADRs, say **capacity** or
   **quota** where the commodity is meant, so that no single passage
   carries both senses.
5. A name defined in another system's namespace keeps that system's
   spelling, because matching it is the point: an S3 object, a
   Kubernetes object, a MongoDB `ObjectId`, a JetStream object store. A
   name is not imported merely because the idea behind it came from
   outside. The `object_type` field is our name in our package, and
   nothing external requires that spelling, so rule 3 governs it.
6. Schemas follow the same vocabulary. The identifier prefix of
   [ADR#4860595695](../4860595695/README.md) is a **resource type**
   prefix, and new schemas **MUST** spell it that way.
7. The `trogon.object_id` package and its `object_type` field **MUST
   NOT** be renamed. They predate this decision and are permanently
   exempt from rules 1, 3, and 6. This is not a deferred cleanup and not
   a cost trade to be re-run later: the names are published, stability
   is worth more here than uniformity, and someone who notices the
   inconsistency has found this rule rather than a defect. The exemption
   covers those two identifiers and nothing else. Prose describing what
   they do still says resource type, and the `ObjectId` collision noted
   above is an accepted cost.

## Consequences

- New ADRs have one word to reach for, and a reviewer has a rule to cite
  rather than a preference to argue.
- The layer words in rule 2 give precision where the layer matters
  without reopening the choice of the generic noun.
- Object keeps its 29 existing uses. None of them is affected, because
  this retires one sense of the word rather than the word.
- [ADR#4860595695](../4860595695/README.md) needs no amendment. Its
  resolution already says resource type; this decision makes that
  spelling normative rather than incidental.
- One published identifier keeps a spelling the generic rule would not
  choose today, per rule 7. A reader who meets `object_type` before
  meeting this ADR will read it as the exception it is only if the rule
  is findable, which is the reason the exception is written down rather
  than left to look like drift.
- Prose that says "object id prefix convention" says "resource id prefix
  convention" instead, in [ADR#6310044131](../6310044131/README.md) and
  in the `NodeId` documentation. The package keeps its name; the concept
  it implements is named by rule 6.
- This decision is about vocabulary, not design. It does not change what
  any resource is, where it is attached, or who answers for it.

## Links

- [ADR#4860595695](../4860595695/README.md): Human-Readable IDs
- [ADR#6310044131](../6310044131/README.md): Hierarchy position is
  referenced by a bare parent field
- [ADR#4761776210](../4761776210/README.md): Resource hierarchy via
  untyped recursive nodes
- [ADR#8779742261](../8779742261/README.md): Actor and Authority
  Taxonomy for Managed Systems
- [ADR#0289186035](../0289186035/README.md): Built-In Resources and
  Their Modes
- [Stripe: Designing APIs for humans: Object IDs](https://dev.to/stripe/designing-apis-for-humans-object-ids-3o5a)
- [Kubernetes API concepts (resource type, resource, object)](https://kubernetes.io/docs/reference/using-api/api-concepts/)
- [Understanding Kubernetes objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/)
- [Google AIP-122: Resource names](https://google.aip.dev/122)
- [How Amazon S3 works with IAM ("the object resource type")](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-arn-format.html)
- [MongoDB BSON types (`ObjectId`)](https://www.mongodb.com/docs/manual/reference/bson-types/)
