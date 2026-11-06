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
- You **SHOULD** keep the full name to 32 characters or fewer. Kubernetes
  label values, DNS labels and PostgreSQL identifiers all stop at 63, and the
  derived forms append suffixes such as `-server` or `_orders` that need the
  rest. You **MUST** keep every derived form within the limit of the place it
  is used.
- You **MUST NOT** pick a product whose words, joined, are a keyword in a
  language this ADR names, such as `map` or `package`, or start with a digit,
  such as `3d`, because the Go and JVM package forms below would not compile.
- You **MUST** confirm the name is free, or already held by the organization
  for that product, in every registry and on every host the product will
  publish to before adopting it, and **MUST** pick another full name when one
  of them is taken, rather than spell it differently there.
- You **MUST** derive every other name in this ADR from the full name by
  changing only case and separators, and by adding the suffixes, extensions
  and versions a rule below names, such as `-server`, `.go` or `.v1`. You
  **MUST NOT** drop, abbreviate,
  reorder or translate a word: `acme-orderbook`, `acme-ob`, `acme-book` and
  `order-book-acme` are wrong. The only exceptions are the Go, npm and JVM
  packages, where the module path, the scope or the domain already carries
  the brand; the table under [Name forms](#name-forms) fixes each of them.
- You **MUST NOT** pick a product name that, followed by `-`, starts the full
  name of another product, so `acme-order-book-*` matches one product only. A
  product named `acme-order` next to `acme-order-book` is wrong.
- You **MUST NOT** end a product name with a word this ADR reserves for a
  suffix, `server`, `worker`, `operator`, `app`, `cli`, `docs` or `website`,
  and **MUST NOT** name a
  product `docs` or `website`, which belong to the brand's own sites.

### Repositories

- You **MUST** name the product's home repository `<brand>-<product>`. It
  holds the server when there is one, and the docs, the schemas per
  [ADR#4711775939](../4711775939/README.md), and anything else that is not
  imported as a library. You **MUST NOT** put the implementation language in
  its name: a server is run, not imported, and rewriting it in another
  language must not rename it.
- You **SHOULD** keep the server in the home repository, and **MAY** move it to
  `<brand>-<product>-server` only when it needs an owner or a release cadence
  apart from the rest of the product. Either way, what it builds carries the
  `-server` suffix: its package, executable, image and chart, per
  [Executables](#executables). A home repository then looks like this:

  ```text
  acme-order-book/                          home repository, plain name
  ├── rsworkspace/
  │   └── crates/acme-order-book-server/    builds `acme-order-book-server`
  ├── proto/acme/order_book/v1/
  └── docs/
  acme-order-book.go/                       Go library, its own repository
  acme-order-book.ts/                       TypeScript library
  ```

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
  release cadence, and then it takes `<brand>-<product>-cli`. A repository
  that holds only a separately released worker takes `<brand>-<product>-worker`
  and one that holds only the server takes `<brand>-<product>-server`. Any
  other tool **MUST NOT** be named `server`, `worker`, `cli`, `docs` or
  `website`, which this ADR keeps for the server, the worker, the command-line
  tool and the product's sites.
- You **MUST** name an application that end users run, in a browser, on a
  phone or on a desktop, `<brand>-<product>-<platform>-app`, where `<platform>`
  is `web`, `mobile` or `desktop`, such as `acme-order-book-web-app`. You
  **MUST NOT** use a bare `<brand>-<product>-app`, since it does not say what
  the application runs on and the platforms differ in packaging and release
  channel. A product that ships more than one application on a platform
  **MUST** add one word naming the audience before the platform in each of
  them, such as `acme-order-book-admin-web-app` next to
  `acme-order-book-customer-web-app`, and **MUST NOT** add it when it ships
  one application per platform. An application is a client of the product, not an executable of
  it, so the role words under [Executables](#executables) do not apply to it.
  You **MAY** keep it in the home repository, in its language workspace per
  [ADR#5842232571](../5842232571/README.md).
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
- You **SHOULD** keep a product's documentation in the home repository's
  `docs/`, so it changes in the same pull request as the behavior it
  describes, and publish the documentation site from there. You **MAY** move
  the site to `<brand>-<product>-docs` only when it needs its own toolchain
  or owner, and **MUST** still keep the reference pages generated from the
  schemas in the home repository.
- You **MUST** name a site that spans the brand's products after the brand
  alone: `<brand>-docs` for documentation that gathers every product, and
  `<brand>-website` for the marketing site. You **SHOULD** keep a product's
  marketing pages in `<brand>-website`, so the brand reads as one site. You
  **MAY** give a product its own `<brand>-<product>-website` repository, such
  as for a product marketed on a domain of its own, and **MUST** use that name
  when you do.

### Executables

- You **MUST** name the command-line tool `<brand>-<product>`. It is what
  people type most, so it takes the plain name.
- You **MUST** name the product's main executable
  `<brand>-<product>-server`. "Server" means the executable you deploy, as in
  `nats-server` and `temporal-server`: it runs every role of the product by
  default and can be told to run a subset, so it does not have to accept
  connections itself. A product whose only role is background work, with no
  clients to connect, **MUST** name its executable after that role instead,
  such as `acme-order-book-worker`.
- You **MUST** select a role of the main executable with a subcommand or a
  flag, such as `acme-order-book-server start --role worker`, and **MUST NOT**
  ship a second executable for it, except as the next rule allows. You **MAY**
  run the same image as several deployments with different arguments, so each
  role scales on its own.
- You **MAY** ship a separate executable for a role only when it needs its own
  image or release cadence, and **MUST** name it `<brand>-<product>-<role>`.
  The server **MUST NOT** run that role by default once it ships separately,
  so the two never run the same work twice. The role is one of these, and a
  role names a responsibility, not how the process runs:
  - `worker`: nothing calls it. It pulls from a queue or stream, runs on a
    schedule, builds projections or watches for changes, such as
    `acme-order-book-worker`.
  - `operator`: it reconciles the product's resources in Kubernetes, such as
    `acme-order-book-operator`. It is the one named exception, because the
    Kubernetes ecosystem already uses the word and readers search for it.
- You **MUST NOT** name an executable, image or chart with another role word.
  `service` and `daemon` describe how a process runs, and every executable in
  this section is a long-running service and a daemon, so neither tells a
  reader what the process does. `consumer`, `processor`, `projector`,
  `dispatcher` and `scheduler` are `worker`, and `api`, `gateway` and `proxy`
  are `server`: what a process does goes in its documentation, and what a
  reader needs from its name is whether something calls it. A second server
  that is released independently, such as a gateway in front of several
  products, is a separate product with its own full name and its own
  `-server`, not another role of the first.
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

### Configuration and local files

A product's command-line tool, its libraries and its server can all end up on
one machine. They share a user's settings and credentials on purpose, so that
signing in once works everywhere, and keep the server's settings apart.

- You **MUST** name every environment variable after the executable or
  library that reads it, in SCREAMING_SNAKE_CASE. The command-line tool and
  the libraries read `<BRAND>_<PRODUCT>_<KEY>`, such as
  `ACME_ORDER_BOOK_ENDPOINT`. The server reads
  `<BRAND>_<PRODUCT>_SERVER_<KEY>`, and every separate executable its own
  role, such as `ACME_ORDER_BOOK_WORKER_<KEY>`. A role selected inside the
  server reads the server's prefix with the role in the key, such as
  `ACME_ORDER_BOOK_SERVER_WORKER_<KEY>`. A key of the command-line tool or a
  library **MUST NOT** start with a role word, `SERVER_` or `WORKER_`, so the
  prefixes never overlap.
- You **MUST** read the user's files from one directory per product, and
  **MUST NOT** spread them over the home directory as dotfiles:

  | Kind        | Linux and macOS                                      | Windows                                 |
  | ----------- | ---------------------------------------------------- | --------------------------------------- |
  | Config      | `${XDG_CONFIG_HOME:-~/.config}/acme-order-book/`     | `%APPDATA%\acme-order-book\`            |
  | Data        | `${XDG_DATA_HOME:-~/.local/share}/acme-order-book/`  | `%APPDATA%\acme-order-book\data\`       |
  | State, logs | `${XDG_STATE_HOME:-~/.local/state}/acme-order-book/` | `%LOCALAPPDATA%\acme-order-book\state\` |
  | Cache       | `${XDG_CACHE_HOME:-~/.cache}/acme-order-book/`       | `%LOCALAPPDATA%\acme-order-book\cache\` |

  macOS follows the Linux paths, not `~/Library/Application Support`, so a
  user's dotfiles carry the same settings between both.

- You **MUST** let `<BRAND>_<PRODUCT>_CONFIG_DIR` replace the config
  directory, for tests and for users who keep it elsewhere.
- You **MUST** name the files in the config directory by who reads them:

  | File               | Read by                                  | Holds                                            |
  | ------------------ | ---------------------------------------- | ------------------------------------------------ |
  | `config.toml`      | The command-line tool and every library  | Profiles: endpoints, output, defaults            |
  | `credentials.toml` | The command-line tool and every library  | Secrets per profile, when no keychain holds them |
  | `server.toml`      | The server, run from a user account only | The server's settings for local development      |

- You **MUST** keep settings in `config.toml` under `[profiles.<name>]`, with
  `default` used when none is chosen, and select a profile with `--profile` or
  `<BRAND>_<PRODUCT>_PROFILE`.
- You **SHOULD** store secrets in the operating system's credential store,
  under the service name `<brand>-<product>` and the profile name as the
  account. You **MUST** fall back to `credentials.toml` only where no store is
  available, create it readable by its owner only, and refuse to read it when
  anyone else can. You **MUST NOT** put a secret in `config.toml`, so it can
  be shared and kept in dotfiles.
- You **MUST** resolve every setting of the command-line tool from, highest
  first: a flag, an environment variable, the repository's
  `.config/<brand>-<product>/config.toml` per
  [ADR#9316364013](../9316364013/README.md), the user's `config.toml`, the
  built-in default. A library resolves the same way minus the flag, with its
  caller's arguments on top.
- You **MUST NOT** let the repository's `config.toml` set an endpoint, a
  profile's credentials or anything else that decides where credentials are
  sent, since anyone who writes to a repository can then collect the
  credentials of whoever runs the tool in it. Those settings come only from a
  flag, an environment variable or the user's `config.toml`.
- You **MUST NOT** let a library read a file or the credential store just
  because it was constructed. It **MUST** read them only through an explicit
  call, such as `Config::from_profile(...)`, so an application in a container
  never picks up a developer's settings by accident. Environment variables
  are read the same way, only when the caller asks.
- You **MUST NOT** make a deployed server read the user's directories. It
  takes its settings from `<BRAND>_<PRODUCT>_SERVER_*` variables and from a
  file passed with `--config`. A system package **MUST** install that file as
  `/etc/<brand>-<product>/server.toml` and keep the server's data in
  `/var/lib/<brand>-<product>/`, and pass the path in its service unit.

### Name forms

You **MUST** spell each form as the table does for `acme-order-book`, made
from a brand `acme` and a product `order-book`. A language missing from the
table is added here before its first package is published.

| Where                                        | Form                                                 |
| -------------------------------------------- | ---------------------------------------------------- |
| Home repository                              | `acme-order-book`                                    |
| Library repository                           | `acme-order-book.<ext>`                              |
| Framework integration repository             | `acme-order-book-<framework>.<ext>`                  |
| Command-line tool                            | `acme-order-book`                                    |
| Server executable, image and chart           | `acme-order-book-server`                             |
| Rust crate                                   | `acme-order-book`, imported `acme_order_book`        |
| Go module                                    | `github.com/<org>/acme-order-book.go`                |
| Go package                                   | `orderbook`                                          |
| npm package                                  | `@acme/order-book`                                   |
| Hex package and OTP application              | `acme_order_book`                                    |
| Elixir module                                | `Acme.OrderBook`                                     |
| PyPI distribution                            | `acme-order-book`, imported `acme_order_book`        |
| Maven coordinates                            | `<reverse-domain>:acme-order-book`                   |
| Kotlin and Java package                      | `<reverse-domain>.orderbook`                         |
| Swift package and module                     | `acme-order-book`, module `AcmeOrderBook`            |
| Protobuf package                             | `acme.order_book.v1`                                 |
| Environment variables, tool and libraries    | `ACME_ORDER_BOOK_<KEY>`                              |
| Environment variables, server                | `ACME_ORDER_BOOK_SERVER_<KEY>`                       |
| SQL schema                                   | `acme_order_book`                                    |
| User config directory                        | `~/.config/acme-order-book/`                         |
| Credential store service                     | `acme-order-book`                                    |
| System config and data                       | `/etc/acme-order-book/`, `/var/lib/acme-order-book/` |
| Kubernetes `app.kubernetes.io/part-of` label | `acme-order-book`                                    |

- The Go package and the Kotlin and Java package drop the brand and join
  the product words, because those package names are single lowercase words
  and the module path or the reverse domain already holds the brand.
- The npm package drops the brand into the scope, `@<brand>/`, which the
  organization owns on npm. The scope and the name together count as the
  package prefix [ADR#0752163629](../0752163629/README.md) asks of a project,
  so `@acme/order-book-*` belongs to the `acme-order-book` project.
- The Go module path ends with `/v<N>` from major version 2 on, as Go
  requires, such as `github.com/<org>/acme-order-book.go/v2`.
- `<reverse-domain>` is the organization's domain reversed, such as
  `com.acme`.
- A product **MUST** keep its database objects in its own SQL schema, with
  plain names inside it, such as `acme_order_book.orders`, and **MUST NOT**
  prefix them with the full name, which pushes long object names past the
  63-byte limit. A product that cannot own a schema prefixes its objects with
  `acme_order_book_` instead.

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
- An executable named with a role word this ADR does not allow, such as
  `-service`, `-daemon` or `-consumer`, is renamed to `-server`, `-worker` or
  `-operator` when it adopts this ADR, under the same published-path rule.
- A name already published to a global registry cannot be taken back. A
  product that published under a name this ADR forbids keeps that package, and
  marks it deprecated in favor of the new one only once the new one is
  published under the organization's account.

## Links

- [ADR#5842232571](../5842232571/README.md): Language workspaces
- [ADR#0752163629](../0752163629/README.md): Project namespaces
- [ADR#4711775939](../4711775939/README.md): Schema source directories
- [ADR#6497710059](../6497710059/README.md): OCI artifact paths and tags
- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [Go: module paths](https://go.dev/ref/mod#module-path)
- [Go: package names](https://go.dev/blog/package-names)
- [Cargo: the `name` field](https://doc.rust-lang.org/cargo/reference/manifest.html#the-name-field)
- [npm: scopes](https://docs.npmjs.com/cli/using-npm/scope)
- [Python: name normalization](https://packaging.python.org/en/latest/specifications/name-normalization/)
- [Protobuf: package naming](https://protobuf.dev/programming-guides/style/#packages)
- [Kubernetes: recommended labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/)
- [PostgreSQL: identifiers](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [Command Line Interface Guidelines: configuration](https://clig.dev/#configuration)
- [Windows known folders](https://learn.microsoft.com/en-us/windows/win32/shell/knownfolderid)
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/)
