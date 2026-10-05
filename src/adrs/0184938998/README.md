---
id: '0184938998'
title: Domain Names and DNS-Rooted Identifiers Across Products
state: Reviewing
created: 2026-10-03
tags: [naming, dns, api-design, identity, kubernetes, platform-design]
category: Platform
---

# Domain Names and DNS-Rooted Identifiers Across Products

## Context

A domain name shows up in far more places than a browser address bar. It
is the prefix of an annotation key
([ADR#5177934677](../5177934677/README.md)), the service segment of a
full resource name, the group of a Kubernetes custom resource, the root
of a reverse-DNS identifier, and the issuer of a token. Each of those
positions is an ownership claim, and each is permanent once a record
carrying it has been written. Until now there has been no rule for which
domain goes where. The result is predictable: one product reserves
`trogondb.com/` for its annotations, another would reach for
`api.<product>.com` for its endpoint, and a third would mint a CRD group
on whatever host its documentation happens to live on.

Not every `trogon*` domain is held by the organization, and holding one
today does not guarantee holding it for as long as the records that name
it are read. An identifier minted on a domain the organization does not
hold is an ownership claim anyone can take by registering that domain.
The organization holds `trogonstack.com`, `trogonapis.com`,
`trogoncompany.com`, and `trogoncloud.com`, and only the first two are
domains an identifier is allowed to depend on.

Kubernetes and reverse-DNS naming converge on the same principle:
ownership is a domain you control, rendered in the syntax of the
technology at hand. Kubernetes writes it as `cert-manager.io` or
`monitoring.coreos.com` in an API group and as `prefix/name` in a label
key, and Java writes it backwards. Ownership delegates the way DNS does,
so `*.cnrm.cloud.google.com` names a team under a domain its company
holds. One allocation of names to owners therefore serves every present
and future technology that keys identifiers off DNS, and this ADR makes
that allocation once.

Google answered the hostname half of the question with a split that has
held for over a decade: `google.com` is for people and `googleapis.com`
is for machines. Products do not get their own API hostnames; they get a
subdomain of the umbrella. The resource name convention in AIP-122
depends on that uniformity, since `//pubsub.googleapis.com/projects/p`
only parses because every service shares one suffix.

The protobuf `Any` type URL looks like one of those positions and is
not. The runtime resolves a type by the fully qualified message name
after the last `/` and never fetches the URL, and the protobuf libraries
and the tools built on them, such as gRPC reflection clients, JSON
transcoders, and debuggers, write and expect `type.googleapis.com/` by
default. Envoy publishes its own types under that prefix for this
reason. Ownership of a type is already carried by its package name, so
an organization type host adds no information and costs configuration in
every code generator, hand-built type URLs wherever a library hardcodes
the default, and weaker support in every generic tool.

A registrable domain is also the boundary browsers use for cookies and
for site isolation. Every host under one registrable domain can set a
cookie with a `Domain` attribute that every sibling host receives, and
two hosts under the same registrable domain count as the same site for
cross-site request protections. That is why hosting providers put
customer content on a second domain, `github.io` beside `github.com`,
`vercel.app` beside `vercel.com`, `fly.dev` beside `fly.io`, and list it
in the Public Suffix List so that each customer host becomes its own
site. A domain allocation that ignores this boundary lets a bug in one
application read the session of another, and lets customer content reach
the organization's own console. The allocation below treats the cookie
boundary as a first-class input, not an afterthought.

A protobuf package root such as `trogon.` or `trogondb.` is a
convention, not a DNS name; Google's packages are `google.*` and not
`google.com.*`, and nothing in protobuf or the Buf Schema Registry
checks a registrar. Registry modules are scoped by the organization that
publishes them. DNS enters the picture only at the positions listed
above, and those are exactly the positions this ADR allocates. Package
roots are governed by [ADR#6874603764](../6874603764/README.md).

### Considered options

**Identifiers on product domains** (`trogondb.com/` as an annotation
prefix, `clusters.trogondb.com` as an API group), the shape upstream
projects such as `cert-manager.io` use.

- Good, because the names are short and carry the product's identity.
- Bad, because it is only as safe as the registration behind it. The
  organization does not hold every `trogon*` domain, and an identifier
  on a domain it does not hold, or stops holding, is claimable by
  whoever registers it.
- Bad, because a product or tool without a domain needs a second rule,
  so every reader has to know which owners hold a domain before they can
  name an identifier. Rejected.

**Product APIs on product domains** (`api.trogondb.com`).

- Bad, because full resource names, certificates, and discovery stop
  being uniform. A client that handles two products needs two trust
  roots and two parsing rules for resource names.
- Bad, because `googleapis.com` demonstrates the alternative scaling to
  hundreds of services without a single product needing its own host.

**An organization type URL host** (`type.trogonapis.com/<type>`), so
that `Any` payloads name a host the organization owns.

- Good, because it mirrors the `googleapis.com` split and reads as an
  ownership claim.
- Bad, because the claim is already made by the package name, and the
  host is never resolved. Every protobuf library defaults to
  `type.googleapis.com/`, so a custom prefix needs per-language
  generator configuration, hand-built type URLs where a library hardcodes
  the default, and prefix-aware parsing in every consumer, and generic
  tooling handles it worse. Rejected.

**`trogonstack.com` as the API umbrella.** One domain for the
organization and its machines.

- Bad, because it mixes human content with machine endpoints on a single
  registrable domain, which is precisely the mixture `google.com` and
  `googleapis.com` exist to separate. Cookies, redirects, and
  applications share a cookie jar and a site boundary with authenticated
  API traffic, so a session cookie set by any application becomes an
  ambient credential against the API.

**Separate domains for documentation and for incubation** (`trogon.dev`
for developer documentation, `trogonlab.com` for experiments).

- Good, because a short documentation address reads well.
- Bad, because neither role needs a registrable domain of its own. A
  subdomain of the platform domain serves documentation, and a subdomain
  serves incubation with the same no-stability rule, and neither adds a
  renewal obligation to the permanent set. Rejected.

**Customer content on the organization's domains** (`<app>.trogonstack.com`
or `<app>.cloud.trogonstack.com` for applications that customers of the
managed offering deploy).

- Bad, because customer content is untrusted by definition, and a host
  under the organization's registrable domain shares the cookie boundary
  with the console, the login flow, and every private cluster name. One
  customer application could set a domain cookie that every other host
  receives. Every hosting provider that has faced this moved customer
  content to a separate registrable domain on the Public Suffix List.
  Rejected.

**A separate private zone for private names** (`trogonstack.internal`
or a purchased domain), so that nothing private shares a domain with
anything public.

- Good, because a reader can tell from the top-level domain alone that
  a name is private.
- Bad, because a zone no public certificate authority can issue for
  needs a private root on every browser, phone, and developer tool that
  reaches it, and that trust distribution is the step that fails in
  practice. Rejected for anything a person reaches; retained for
  in-cluster plumbing per [ADR#9147226377](../9147226377/README.md).

**Private names as a subdomain of the public domain.** The variants
differ in what becomes public.

- Bad with per-host certificates and public records, because every
  hostname is published in Certificate Transparency and every address is
  published in DNS. Rejected.
- Good with one wildcard certificate per cluster, no public records, and
  split DNS inside the overlay, because every client trusts the
  certificate with nothing installed, public logs see only the cluster
  label, and public DNS sees nothing. Adopted for private names below;
  [ADR#9147226377](../9147226377/README.md) owns the resolution and
  certificate rules.

**Every owner under the platform domain, machines under the API
umbrella** (chosen). Each product or tool takes one label, `<name>`,
and renders it as `<name>.trogonstack.com` for identifiers and
`trogon<name>.trogonapis.com`, its package root, for its API. Product domains, where held, are
human-facing sites and nothing else.

- Good, because every identifier depends only on domains the
  organization holds, so no identifier can be claimed by registering a
  lapsed or never-held domain.
- Good, because there is one rule for every owner, whether it is a
  product or a tool and whether or not a domain exists for it, so a
  reader can infer the identifier from the name and the name from the
  identifier.
- Good, because each registrable domain is also a cookie and site
  boundary, so the split that keeps people and machines apart is the
  same split that keeps sessions apart.
- Good, because it follows the shape that `googleapis.com` has already
  proven for endpoints, the shape that `github.io` has proven for
  customer content, and the delegated shape of
  `*.cnrm.cloud.google.com` for groups.
- Bad, because API groups are a label longer than upstream projects
  that hold a domain per product, as in `clusters.db.trogonstack.com`
  against `clusters.trogondb.com`.

## Resolution

1. The organization holds these domains, each with one role.
   `trogonstack.com` and `trogonapis.com` are the **identifier
   domains**, the only domains any identifier in this ADR may depend on.

   | Domain              | Role                                                      |
   | ------------------- | --------------------------------------------------------- |
   | `trogonstack.com`   | the platform: identifiers, applications, private networks |
   | `trogonapis.com`    | the machine-facing API umbrella                           |
   | `trogoncompany.com` | corporate content: marketing, careers, legal              |
   | `trogoncloud.com`   | content that customers of the managed offering deploy     |

2. An **owner** is anything that mints identifiers of its own: the
   platform, or a product or tool. Products and tools are not
   distinguished. Each product or tool has one **owner label**,
   `<name>`, and its protobuf package root is `trogon<name>.` per
   [ADR#6874603764](../6874603764/README.md). The current owner labels
   are `db`, `kv`, `stream`, `lang`, `os`, `browser`, `ai`, `cloud` for
   the hosted control plane, and `atlas`.
3. An owner's **identifier namespace** is `<name>.trogonstack.com`. The
   platform's own namespace, for components that belong to no owner, is
   `trogonstack.com` itself. Every DNS-rooted identifier an owner mints
   lives in its namespace:
   - annotation, label, and other key prefixes:
     `<name>.trogonstack.com/`;
   - API groups: `<area>.<name>.trogonstack.com`, or
     `<name>.trogonstack.com` for an owner whose resources form a single
     area;
   - finalizers: `<area>.<name>.trogonstack.com/<finalizer>`;
   - reverse-DNS identifiers: `com.trogonstack.<name>.*`.
4. `trogonapis.com` serves machines only. `trogon<name>.trogonapis.com`
   is an owner's service hostname and the service segment of a full
   resource name, as in `//trogondb.trogonapis.com/...`; the label is
   the owner's package root of rule 2, so a service host and its
   protobuf package read the same. `schemas.trogonapis.com` is reserved for schema
   identifiers that are not protobuf, such as a JSON Schema `$id` or an
   OpenAPI document URL. The apex redirects to `docs.trogonstack.com` and
   serves nothing else. Service hostnames **MUST NOT** live on any other
   domain; `api.<product>.com` is not a valid host.
5. Protobuf `Any` type URLs are not a DNS position and are not allocated
   here. Every `Any` **MUST** use the standard prefix,
   `type.googleapis.com/<type>`, where `<type>` is the fully qualified
   message name. `type.trogonapis.com`, or any other host the
   organization owns, **MUST NOT** be used as a type URL prefix, and code
   that writes an `Any` **MUST NOT** override the library default.
6. Labels directly under `trogonstack.com` are a single namespace, and
   each label has exactly one holder:
   - an owner label of rule 2;
   - a platform area used in a platform group `<area>.trogonstack.com`;
   - a reserved function: `docs`, `lab`, `idp`, and `global`;
   - a cluster label, `<env>-<site>` or a bare site such as `homelab`;
   - a public application of rule 8.

   A new label **MUST NOT** reuse one that is already held. Owner labels
   are recorded in rule 2, platform areas with the platform, and cluster
   labels with the clusters.
7. An owner **MAY** serve its human-facing site at
   `<name>.trogonstack.com`. No other application may use an owner's
   label. `cloud.trogonstack.com` is the hosted control plane's console,
   account, and billing surface, and it is the single console for every
   owner: an owner's management surface is a section of it, such as
   `cloud.trogonstack.com/db`, and **MUST NOT** be a console host of its
   own, so that a customer signs in, is billed, and manages every
   product in one place.
8. An application the organization operates and exposes to the public
   internet, such as a source forge, a dashboard, a homepage, or an
   internal tool opened to the web, is `<app>.trogonstack.com`. That
   name, and an owner site of rule 7, resolves only to the public edge
   proxy and **MUST NOT** resolve to a machine, a pod, or a private
   address; the edge forwards to the application's private name of
   rule 22. The contrast is the label count: a name with no cluster label
   is the public edge, and `<service>.<cluster>.trogonstack.com` is
   private. `trogonapis.com` is not for browser applications.
9. `docs.trogonstack.com` is developer documentation for every owner and
   for the platform. It is for people and **MUST NOT** appear in any
   machine identifier.
10. `lab.trogonstack.com` is incubation and carries no stability
    guarantee. An experiment mints identifiers under it, the prefix
    `lab.trogonstack.com/` and groups `<area>.lab.trogonstack.com`, and
    owners **MUST NOT** depend on an identifier minted there.
    Graduating an experiment means taking an owner label and minting
    fresh identifiers under it; an alias from the lab name is not a
    graduation path.
11. A `trogon*` domain other than those of rule 1, such as a product
    domain like `trogondb.com`, is optional. Where it is held, it
    **MAY** serve that product's human-facing site or redirect to it,
    and it **MUST NOT** appear in any identifier, host any API, or set a
    cookie that any surface under rule 1 reads. Because nothing depends
    on it, it **MAY** be allowed to lapse.
12. The company's corporate content, such as marketing, careers, and
    legal, lives on `trogoncompany.com`. It **MUST NOT** appear in any
    technical identifier, and no application, API, or documentation
    surface **MAY** be served from it.
13. Content that customers of the managed offering deploy lives on
    `trogoncloud.com`, as `<app>.trogoncloud.com` or whatever shape
    under it the offering chooses, following `github.io`, `vercel.app`,
    and `fly.dev`. `trogoncloud.com` **MUST** be submitted to the private
    section of the Public Suffix List, and accepted, before the first
    customer host is served, and it **MUST** stay registered with
    automatic renewal while any customer host is served, because a lapse
    hands every customer host to whoever registers it. It **MUST NOT**
    host any organization-operated surface, whether console, login,
    documentation, or API, and it **MUST NOT** appear in any
    organization identifier. Customer content is expected to include
    phishing and malware sooner or later, and blocklists such as Safe
    Browsing can flag a whole registrable domain; keeping every
    organization surface off it means such a flag never takes down the
    console or the login flow, and a login page on it is never genuine.
14. Cookies and sessions respect the registrable-domain boundary that
    the roles above create.
    - `trogonapis.com` **MUST NOT** set or accept cookies. Authentication
      is bearer tokens only. This is the reason the machine umbrella is
      a registrable domain of its own rather than a host under the
      platform domain.
    - `trogoncloud.com` carries untrusted content and relies
      on its Public Suffix List entry, so a customer host cannot set a
      cookie on the parent and two customer applications are different
      sites. No organization cookie, login flow, or script is ever
      served from it.
    - An application under `trogonstack.com`, whether public
      (`<app>.trogonstack.com` or an owner site) or private
      (`<service>.<cluster>.trogonstack.com`), **MUST** set host-only
      cookies: no `Domain` attribute, the `Secure` attribute, and the
      `__Host-` prefix **SHOULD** be used. A cookie with
      `Domain=trogonstack.com` or any parent label is forbidden, because
      public applications, owner sites, private cluster names,
      documentation, and the console share the registrable domain and a
      domain cookie would reach all of them.
    - Single sign-on **MUST** be done by redirect to the identity
      provider of rule 15 and an authorization code or token exchange,
      never by a shared parent-domain session cookie.
15. The identity provider is `idp.trogonstack.com`. It serves the
    interactive login surface with host-only cookies of its own, and
    `https://idp.trogonstack.com` is the token issuer, so the issuer URL
    and the OpenID Connect discovery document live on the host that
    signs the tokens, as `accounts.google.com` does for Google. Every
    application, console, and command-line tool authenticates people
    through it, and no other host **MAY** serve a login form for
    organization accounts. The issuer URL is an identifier: changing it
    invalidates every token and every relying-party configuration, so it
    is held to rule 21.
16. Kubernetes API groups, whether for custom resource definitions or
    aggregated API servers, are DNS names owned by the author and follow
    rule 3: `<area>.<name>.trogonstack.com` for an owner, for example
    `clusters.db.trogonstack.com`, and `<area>.trogonstack.com` for a
    platform-wide group that belongs to no owner. Groups **MUST NOT** be
    minted under any domain other than `trogonstack.com`.
17. An API group version uses the same version ladder as a protobuf
    package: `v1alpha1`, `v1beta1`, `v1`. The `<area>` segment **MUST**
    be the same word in both renderings, so `clusters.db.trogonstack.com`
    and the package `trogondb.clusters` are recognizably one area. The
    version reports the maturity of its own surface and nothing else: a
    manifest group at `v1alpha1` **MAY** wrap a wire schema already at
    `v1`, as Google's Config Connector groups do over stable `google.*`
    packages, and neither side is bumped to match the other.
    [ADR#6874603764](../6874603764/README.md) owns the package rules;
    this ADR owns the DNS rendering.
18. Every Kubernetes-style key follows the `prefix/name` syntax and the
    ownership rule that [ADR#5177934677](../5177934677/README.md)
    specifies for annotations. This ADR extends that rule to label keys,
    taint keys, finalizers, and field manager names. One owner, one
    namespace, every key under it.
19. Reverse-DNS identifiers (Java packages, including the protobuf
    `java_package` option, Apple bundle identifiers, D-Bus names,
    Android application identifiers) are `com.trogonstack.*` for the
    platform and `com.trogonstack.<name>.*` for an owner. The reverse of
    `trogonapis.com` **MUST NOT** be used, because that domain names
    endpoints, not code.
20. Every identifier kind in the table under Where each identifier lives,
    token issuer URLs, and any position added later where a domain acts
    as an ownership claim **MUST** use an identifier domain of rule 1.
21. An identifier domain of rule 1 is permanent. It **MUST** remain registered with
    automatic renewal enabled for as long as any record carrying an
    identifier under it can be read, because an expired identifier
    domain is a takeover of every identifier under it.
    [ADR#5177934677](../5177934677/README.md) already states that a
    lapsed registration grants no claim over documented prefixes; this
    rule prevents the lapse rather than arguing about it afterwards.
22. A private name that a person or a client configuration references
    is `<service>.<cluster>.trogonstack.com` for a service and
    `<host>.<cluster>.trogonstack.com` for a machine. A cluster label in
    a `trogonstack.com` name means private: the name has no public
    record, resolves only on the overlay, and is covered by that
    cluster's public wildcard certificate, so no person trusts a private
    root. `.internal` and `cluster.local` are in-cluster plumbing and
    **MUST NOT** be referenced outside their cluster. Resolution,
    certificate, and transport rules are owned by
    [ADR#9147226377](../9147226377/README.md). A private name is an
    address, never an identifier, and **MUST NOT** appear in any
    position this ADR allocates.

### Where each identifier lives

| Identifier kind  | Platform                           | Owner `<name>`                              |
| ---------------- | ---------------------------------- | ------------------------------------------- |
| Label/annotation | `trogonstack.com/`                 | `<name>.trogonstack.com/`                   |
| Finalizer        | `<area>.trogonstack.com/<x>`       | `<area>.<name>.trogonstack.com/<x>`         |
| API group        | `<area>.trogonstack.com`           | `<area>.<name>.trogonstack.com`             |
| Service hostname | none                               | `trogon<name>.trogonapis.com`               |
| Reverse-DNS      | `com.trogonstack.*`                | `com.trogonstack.<name>.*`                  |
| Package root     | `trogon.`                          | `trogon<name>.`                             |
| Documentation    | `docs.trogonstack.com`             | `docs.trogonstack.com`                      |
| Public site      | `<app>.trogonstack.com`            | `<name>.trogonstack.com`, or a held domain  |
| Private host     | `<name>.<cluster>.trogonstack.com` | `<service>.<cluster>.trogonstack.com`       |
| Token issuer     | `https://idp.trogonstack.com`      | `https://idp.trogonstack.com`               |
| Type URL         | `type.googleapis.com/<type>`       | `type.googleapis.com/<type>`                |

The package root row is governed by
[ADR#6874603764](../6874603764/README.md) and is listed so that every
rendering of an owner sits in one place. Customer content and cluster
plumbing appear in no column, because neither ever carries an
organization identifier.

## Consequences

- A reader who sees a host, a group, or a key prefix can name its owner,
  and a writer who has an owner can name the identifier, without
  consulting anyone and without knowing which `trogon*` domains are
  held.
- No identifier depends on a domain the organization does not hold, so
  losing, never acquiring, or letting a product domain lapse breaks
  nothing.
- Every full resource name shares one suffix, so a generic client needs
  one trust root and one parser.
- Every `Any` payload carries the standard `type.googleapis.com/`
  prefix, so protobuf libraries, gRPC reflection, JSON transcoding, and
  debuggers handle it with no configuration.
- A Kubernetes operator and a gRPC service for the same owner area share
  a name: `clusters.db.trogonstack.com/v1alpha1` and
  `trogondb.clusters.v1` are recognizably the same area, and each
  version ladder reports the maturity of its own surface.
- Product identity and machine endpoints are decoupled. A product can
  rebrand or move its site without touching a single stored identifier,
  and the API umbrella can change infrastructure without touching a
  product site.
- The permanent set is `trogonstack.com` and `trogonapis.com`. Automatic
  renewal is a correctness requirement for both, not a billing
  preference. `trogoncloud.com` is renewed for as long as customer hosts
  are served, and `trogoncompany.com` for as long as the company
  publishes there. `trogon.dev` and `trogonlab.com` leave the scheme, and
  product domains and their aliases are optional.
- `trogoncloud.com` has to be listed in the Public Suffix List before
  customer content is served from it, and the listing is a one-time
  operational task with a review delay, so it is done before the managed
  offering launches rather than after.
- A person has one login host and a customer has one console, whatever
  products they use. A login form on any other host is not genuine,
  which is a rule a person can be taught.
- A compromised or buggy application on any host cannot read another
  host's session, because every session cookie under `trogonstack.com`
  is host-only. Customer content cannot touch the console, because it
  lives on a different registrable domain that browsers treat as a
  public suffix. The API surface has no ambient credential to steal by
  cross-site request forgery, because it never accepts a cookie.
- Public names resolve to the edge and private names resolve only on the
  overlay, and the cluster label tells a reader which is which. A leaked
  public hostname reveals only the proxy, and a leaked private hostname
  resolves nowhere from outside.
- No person installs a private root. Every name a browser or a client
  configuration reaches under `trogonstack.com` carries a publicly
  trusted certificate, and the private certificate authority is confined
  to workload identity inside clusters.
- The `trogondb.com/` reservation in
  [ADR#5177934677](../5177934677/README.md) moves to
  `db.trogonstack.com/`. No record carries a key under the old prefix,
  so the move needs no migration.
- The companion decision on package roots can refer to hosts without
  redefining them, and the identifier convention of
  [ADR#4860595695](../4860595695/README.md) gains a stable service
  segment to sit under in full resource names.

## Links

- [ADR#5177934677](../5177934677/README.md): Annotations and Transient
  Annotations
- [ADR#4860595695](../4860595695/README.md): Human-Readable IDs
- [ADR#1394819661](../1394819661/README.md): Resource Is the Generic
  Noun, Object Is a Runtime Term
- [ADR#6874603764](../6874603764/README.md): Protobuf Package Namespaces
  Across Products
- [ADR#9147226377](../9147226377/README.md): Private Network Naming,
  Resolution, and Certificate Trust
- [googleapis repository](https://github.com/googleapis/googleapis)
- [Google AIP-122: Resource names](https://google.aip.dev/122)
- [Google AIP-191: File and directory structure](https://google.aip.dev/191)
- [Protocol Buffers: `Any` type URLs](https://protobuf.dev/programming-guides/proto3/#any)
- [Kubernetes: annotation key syntax](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/#syntax-and-character-set)
- [Kubernetes: API groups and versioning](https://kubernetes.io/docs/reference/using-api/#api-groups)
- [Kubernetes: Extend the API with CustomResourceDefinitions](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/)
- [Public Suffix List](https://publicsuffix.org/)
- [MDN: `Set-Cookie`, the `Domain` attribute and the `__Host-` prefix](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [GitHub: New GitHub Pages domain, github.io](https://github.blog/2013-04-05-new-github-pages-domain-github-io/)
- [Fly.io: Public networking and `fly.dev`](https://fly.io/docs/networking/)
- [Vercel: Deployment domains on `vercel.app`](https://vercel.com/docs/deployments/generated-urls)
