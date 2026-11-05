---
id: '3545947886'
title: Product names across repositories, packages and tools
state: Draft
created: 2026-11-05
tags: [naming, repository, packages, multi-language, cli, monorepo]
category: Platform
---

# Product names across repositories, packages and tools

## Context

An organization that ships several products ships each of them in many forms:
a server people run, a library or client per language people import, a
command-line tool, framework integrations, container images, charts, Protobuf
packages, environment variables and database identifiers. Every one of those
forms lives in a namespace with its own spelling rules, and most of the
namespaces are global: crates.io, npm, Hex, PyPI and the Go module proxy hold
one name for everyone.

Without a rule each form gets named when it is created, and the names drift:
a word gets dropped in one registry, a client is called a driver in one
language and an SDK in another, a server repository carries the language it
happens to be written in, and a second product picks a name that starts the
first one's names. A reader can then no longer tell from a name which product
it belongs to, what kind of thing it is, or what to type to install it.

Vendors that own their whole stack converge on a few patterns:

- NATS names the server repository `nats-server`, each client `nats.<lang>`
  (`nats.go`, `nats.rs`, `nats.js`), the executable `nats-server` and the
  command-line tool `nats`.
- Temporal names the server `temporal`, its executable `temporal-server` and
  the command-line tool `temporal`.
- MongoDB and Neo4j name clients `<product>-<lang>-driver`, Kurrent names them
  `<Product>-Client-<Lang>`, Temporal names them `sdk-<lang>`, Elastic and
  ClickHouse name them `<product>-<lang>`.
- Every one of them keeps each language's client in its own repository.

The patterns agree on two points: a client's name says which language it is
for, and the server's implementation language never appears in a name, since
nobody imports a server. They disagree on role words, and the role words they
use are not reliable: "driver" means a native wire protocol, "SDK" means a
programming model the library runs for you, and a single organization uses
both for the same kind of thing.

[ADR#5842232571](../5842232571/README.md) already gives every language a short
code, its source file extension, so a name can carry the language without a
new decision.

## Resolution

### The full name

- You **MUST** give every product one full name, `<brand>-<product>`, in
  lowercase kebab-case, such as `acme-order-book`. `<brand>` is the prefix the
  organization uses for all of its products, and `<product>` is one or more
  words.
- You **MUST** derive every other name in this ADR from the full name by
  changing only case and separators. You **MUST NOT** drop, abbreviate,
  reorder or translate a word: `acme-orderbook`, `acme-ob`, `acme-book` and
  `order-book-acme` are wrong. The only exceptions are the Go, npm and JVM
  packages, where the module path, the scope or the domain already carries
  the brand; the table under [Name forms](#name-forms) fixes each of them.
- You **MUST NOT** pick a product name that, followed by `-`, starts the full
  name of another product, so `acme-order-book-*` matches one product only. A
  product named `acme-order` next to `acme-order-book` is wrong.
- You **MUST NOT** end a product name with a word this ADR reserves for a
  suffix, `server` or `cli`.

### Repositories

- You **MUST** name the product's home repository `<brand>-<product>`. It
  holds the server when there is one, and the docs, the schemas per
  [ADR#4711775939](../4711775939/README.md), and anything else that is not
  imported as a library. You **MUST NOT** put the implementation language in
  its name: a server is run, not imported, and rewriting it in another
  language must not rename it.
- You **MUST** name a repository that holds a library for one language
  `<brand>-<product>.<ext>`, where `<ext>` is the extension
  [ADR#5842232571](../5842232571/README.md) fixes for that language, such as
  `acme-order-book.go`, `acme-order-book.rs` or `acme-order-book.ts`. A
  `.<ext>` name always means "what you import in that language to use the
  product":
  - For a product that is a service, it is the client of that service.
  - For a product that is itself a library, it is the product, and its port to
    another language is a sibling repository with that language's extension.
    Such a product needs no home repository until it has something to put in
    it, such as a specification or shared conformance tests.
- You **MUST NOT** add a role word such as `client`, `driver` or `sdk` to a
  library's name. The extension already says it is a library, and the role
  words mean different things to different readers. A higher-level library
  that runs code for the user, such as workers or a framework, is a separate
  product with its own full name, built on top of the client.
- You **MUST** name a repository that integrates the product into a framework
  `<brand>-<product>-<framework>.<ext>`, such as
  `acme-order-book-commanded.ex`, and **MUST** use the name the framework's
  own documentation uses for itself, in kebab-case.
- You **MUST** name a repository that holds only a tool people run,
  `<brand>-<product>-<tool>`, such as `acme-order-book-operator`, and **MUST
  NOT** add an extension, since a tool is run and not imported. The
  command-line tool lives in the home repository unless it needs its own
  release cadence, and then it takes `<brand>-<product>-cli`.
- You **MAY** keep libraries in the home repository, each in its language
  workspace per [ADR#5842232571](../5842232571/README.md), and publish them
  from there under the package names below. You **SHOULD** move the Go library
  to its own `<brand>-<product>.go` repository before its first release,
  because a Go import path names the repository and the directory, and a
  module under the home repository is imported as
  `github.com/<org>/<brand>-<product>/goworkspace/<module>`.
- You **MUST** follow the pattern a host imposes on a repository it consumes,
  such as `terraform-provider-<name>` or `homebrew-<tap>`, and **MUST** fill
  its name slot with the full name, or with the closest form the host
  accepts.

### Executables

- You **MUST** name the command-line tool `<brand>-<product>`. It is what
  people type most, so it takes the plain name.
- You **MUST** name the server executable `<brand>-<product>-server`, and
  every other long-running process `<brand>-<product>-<role>`, such as
  `acme-order-book-worker`.
- You **MUST** name each container image and Helm chart after the executable
  it runs, such as `acme-order-book-server`, and **MUST** use the full name as
  its `<namespace>` per [ADR#6497710059](../6497710059/README.md).

### Packages

- You **MUST** give the plain package name in each registry to the library,
  since a registry is already specific to one language. You **MUST** suffix
  anything else published there, such as a server crate published for
  `cargo install`, with its role: `acme-order-book-server`.
- You **MUST** name a package that is internal to a workspace, such as a
  crate the server is split into, `<brand>-<product>-<part>`, such as
  `acme-order-book-storage`, so it never takes a name a library needs later.
- You **MUST** name framework integration packages
  `<brand>-<product>-<framework>` in the registry's form, unless the framework
  documents a naming convention for its integrations, which then wins.

### Name forms

You **MUST** spell each form as the table does for `acme-order-book`, made
from a brand `acme` and a product `order-book`. A language missing from the
table is added here before its first package is published.

| Where                                        | Form                                          |
| -------------------------------------------- | --------------------------------------------- |
| Home repository                              | `acme-order-book`                             |
| Library repository                           | `acme-order-book.<ext>`                       |
| Framework integration repository             | `acme-order-book-<framework>.<ext>`           |
| Command-line tool                            | `acme-order-book`                             |
| Server executable, image and chart           | `acme-order-book-server`                      |
| Rust crate                                   | `acme-order-book`, imported `acme_order_book` |
| Go module                                    | `github.com/<org>/acme-order-book.go`         |
| Go package                                   | `orderbook`                                   |
| npm package                                  | `@acme/order-book`                            |
| Hex package and OTP application              | `acme_order_book`                             |
| Elixir module                                | `Acme.OrderBook`                              |
| PyPI distribution                            | `acme-order-book`, imported `acme_order_book` |
| Maven coordinates                            | `<reverse-domain>:acme-order-book`            |
| Kotlin and Java package                      | `<reverse-domain>.orderbook`                  |
| Swift package and module                     | `acme-order-book`, module `AcmeOrderBook`     |
| Protobuf package                             | `acme.order_book.v1`                          |
| Environment variable prefix                  | `ACME_ORDER_BOOK_`                            |
| SQL schema and identifier prefix             | `acme_order_book`                             |
| Configuration directory                      | `$XDG_CONFIG_HOME/acme-order-book/`           |
| Kubernetes `app.kubernetes.io/part-of` label | `acme-order-book`                             |

- The Go package and the Kotlin and Java package drop the brand and join
  the product words, because those package names are single lowercase words
  and the module path or the reverse domain already holds the brand.
- The npm package drops the brand into the scope, `@<brand>/`, which the
  organization owns on npm.
- `<reverse-domain>` is the organization's domain reversed, such as
  `com.acme`.

## Consequences

- A name tells a reader its product, its kind and its language: a
  `.<ext>` suffix is imported, a `-server` suffix runs, and the plain name is
  the home repository and the command-line tool.
- A server keeps its name when it is rewritten in another language, and a
  library product gains a language by adding a repository, never by renaming
  one.
- Existing products whose server executable, image or chart lacks the
  `-server` suffix are renamed when they adopt this ADR. A published image or
  chart keeps its old path until its consumers move, since
  [ADR#6497710059](../6497710059/README.md) does not let a published path
  change in place.
- A name already published to a global registry cannot be taken back. A
  product that published under a name this ADR forbids keeps that package, and
  marks it deprecated in favor of the new one at its next release.

## Links

- [ADR#5842232571](../5842232571/README.md): Language workspaces
- [ADR#0752163629](../0752163629/README.md): Project namespaces
- [ADR#4711775939](../4711775939/README.md): Schema source directories
- [ADR#6497710059](../6497710059/README.md): OCI artifact paths and tags
- [Go: module paths](https://go.dev/ref/mod#module-path)
- [Go: package names](https://go.dev/blog/package-names)
- [Cargo: the `name` field](https://doc.rust-lang.org/cargo/reference/manifest.html#the-name-field)
- [npm: scopes](https://docs.npmjs.com/cli/using-npm/scope)
- [Python: name normalization](https://packaging.python.org/en/latest/specifications/name-normalization/)
- [Protobuf: package naming](https://protobuf.dev/programming-guides/style/#packages)
- [Kubernetes: recommended labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/)
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/)
