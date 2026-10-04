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
([ADR#5177934677](../5177934677/README.md)), the host in a protobuf
`Any` type URL, the service segment of a full resource name, the group of
a Kubernetes custom resource, the root of a reverse-DNS identifier, and
the issuer of a token. Each of those positions is an ownership claim, and
each is permanent once a record carrying it has been written. The
organization holds a dozen `trogon*` domains and, until now, no rule for
which one goes where. The result is predictable: one product reserves
`trogondb.com/` for its annotations, another would reach for
`api.<product>.com` for its endpoint, and a third would mint a CRD group
on whatever host its documentation happens to live on.

Kubernetes, protobuf `Any`, and reverse-DNS naming all converge on the
same principle: ownership is the canonical domain you control, rendered
in the syntax of the technology at hand. Kubernetes writes it as
`cert-manager.io` or `monitoring.coreos.com` in an API group and as
`prefix/name` in a label key, protobuf writes it as a type URL host, and
Java writes it backwards. One allocation of domains to owners therefore
serves every present and future technology that keys identifiers off
DNS, and this ADR makes that allocation once.

Google answered the hostname half of the question with a split that has
held for over a decade: `google.com` is for people, `googleapis.com` is
for machines, and `type.googleapis.com` is the one host every `Any`
payload names. Products do not get their own API hostnames; they get a
subdomain of the umbrella. The resource name convention in AIP-122
depends on that uniformity, since `//pubsub.googleapis.com/projects/p`
only parses because every service shares one suffix.

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

Each domain costs a renewal forever once an identifier depends on it, so
the set is kept to the domains that carry a role no subdomain can carry.
`trogon.com` is not owned, and this does not matter. A protobuf package
root such as `trogon.` is a convention, not a DNS name; Google's packages
are `google.*` and not `google.com.*`, and nothing in protobuf or the Buf
Schema Registry checks a registrar. Registry modules are scoped by the
organization that publishes them. DNS enters the picture only at the
positions listed above, and those are exactly the positions this ADR
allocates. Package roots are governed by
[ADR#6874603764](../6874603764/README.md).

### Considered options

**Product APIs on product domains** (`api.trogondb.com`). Each product
already owns its domain, so this is the path of least coordination.

- Bad, because type URLs, full resource names, certificates, and
  discovery stop being uniform. A client that handles two products
  needs two trust roots and two parsing rules for resource names.
- Bad, because `googleapis.com` demonstrates the alternative scaling to
  hundreds of services without a single product needing its own host.

**`trogonstack.com` as the API umbrella.** One domain for the
organization and its machines.

- Bad, because it mixes human content with machine endpoints on a single
  registrable domain, which is precisely the mixture `google.com` and
  `googleapis.com` exist to separate. Cookies, redirects, and
  applications share a cookie jar and a site boundary with authenticated
  API traffic, so a session cookie set by any application becomes an
  ambient credential against the API.

**Products as subdomains of `trogonstack.com`.** No product domains at
all; `trogondb.trogonstack.com` for everything, and
`clusters.trogondb.trogonstack.com` as a CRD group.

- Bad, because the products already own their domains, and the
  writer-owns-prefix rule in [ADR#5177934677](../5177934677/README.md)
  wants each writer minting keys on a domain it controls rather than
  under a parent it does not. It also surrenders the product identity
  that the domains were registered to carry, and produces API groups
  longer than any upstream project uses.

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

**Private names as a subdomain of the public domain.** Two variants
exist and they differ in what becomes public.

- Bad with per-host certificates and public records, because every
  hostname is published in Certificate Transparency and every address is
  published in DNS. Rejected.
- Good with one wildcard certificate per cluster, no public records, and
  split DNS inside the overlay, because every client trusts the
  certificate with nothing installed, public logs see only the cluster
  label, and public DNS sees nothing. Adopted for private names below;
  [ADR#9147226377](../9147226377/README.md) owns the resolution and
  certificate rules.

**A role per domain, and only the roles a subdomain cannot carry**
(chosen). The company, the platform, the machines, and customer content
each get one registrable domain, products keep theirs for identity while
sharing the machine umbrella, and documentation, incubation, and the
console live as subdomains of the platform.

- Good, because every identifier position has one answer and every
  domain has one job, so a reader can infer the role from the name and
  the name from the role.
- Good, because each registrable domain is also a cookie and site
  boundary, so the split that keeps roles apart is the same split that
  keeps sessions apart.
- Good, because it follows the shape that `googleapis.com` has already
  proven for endpoints, the shape that `github.io` has proven for
  customer content, and the shape that upstream Kubernetes projects use
  for groups, while respecting the product-level ownership that the
  annotation rule already relies on.
- Bad, because it adds a hop: a product's site and its API live on
  different apexes, and the distinction has to be taught once.

## Resolution

1. Every owner, whether the company, the platform, a product, or the
   managed offering's customers, has exactly one **canonical domain**,
   and its canonical form is the `.com`. Every other domain held for
   that owner is an **alias**.
2. The roles are fixed as follows.

   | Domain              | Role                                                      |
   | ------------------- | --------------------------------------------------------- |
   | `trogoncompany.com` | the company: marketing, careers, legal, corporate content |
   | `trogonstack.com`   | the platform: identifiers, applications, private networks |
   | `trogonapis.com`    | the machine-facing API umbrella                           |
   | `trogoncloud.com`   | content that customers of the managed offering deploy     |
   | `trogon<name>.com`  | the product named `<name>`                                |

3. `trogonapis.com` serves machines only. `<service>.trogonapis.com` is
   the service hostname and the service segment of a full resource name,
   as in `//trogondb.trogonapis.com/...`. `type.trogonapis.com/<type>` is
   the type URL prefix for every protobuf `Any`, where `<type>` is the
   fully qualified message name. `schemas.trogonapis.com` is reserved for
   schema identifiers that are not protobuf, such as a JSON Schema `$id`
   or an OpenAPI document URL. The apex redirects to
   `docs.trogonstack.com` and serves nothing else. Service hostnames
   **MUST NOT** live on a product domain; `api.<product>.com` is not a
   valid host.
4. A product's canonical domain is its human-facing site and its
   identifier namespace. The current product domains are `trogondb.com`,
   `trogonkv.com`, `trogonstream.com`, `trogonlang.com`, `trogonos.com`,
   `trogonbrowser.com`, and `trogonai.com`. A product's API hostname is
   `<name>.trogonapis.com`, never a host under its own domain.
5. `trogonstack.com` is the identifier namespace for platform components
   that are not a product. The annotation key prefix `trogonstack.com/`
   is reserved for them, extending the reservation rule of
   [ADR#5177934677](../5177934677/README.md).
6. An application the organization operates and exposes to the public
   internet, such as a source forge, a dashboard, a homepage, or an
   internal tool opened to the web, is `<app>.trogonstack.com`. That
   name resolves only to the public edge proxy and **MUST NOT** resolve
   to a machine, a pod, or a private address; the edge forwards to the
   application's private name of rule 23. The contrast is the label
   count: `<app>.trogonstack.com` with no cluster label is the public
   edge, and `<service>.<cluster>.trogonstack.com` with one is private.
   `trogoncompany.com` is the company's site and `trogoncloud.com` is
   customer content, so neither is a valid host for organization
   tooling, and `trogonapis.com` is not for browser applications.
   Products keep their own sites on `<product>.com`; this rule covers
   the organization's own tooling.
7. The labels `docs`, `lab`, `cloud`, `auth`, and `global`, together with
   every cluster label, `<env>-<site>` or a bare site such as `homelab`,
   are reserved directly under `trogonstack.com` and **MUST NOT** be
   used as a public application name. A new cluster label **MUST NOT**
   reuse an existing public application name, so the public form of
   rule 6 and the private form of rule 23 cannot collide. The list of
   cluster labels is recorded with the clusters.
8. `docs.trogonstack.com` is developer documentation for every product
   and for the platform. It is for people and **MUST NOT** appear in any
   machine identifier.
9. `cloud.trogonstack.com` hosts the console, account, and billing
   surfaces of the managed offering. Its APIs live under
   `trogonapis.com` like every other service. The hosted control plane,
   when it writes as itself, mints identifiers under
   `cloud.trogonstack.com`: the prefix `cloud.trogonstack.com/` and
   groups `<area>.cloud.trogonstack.com`.
10. `lab.trogonstack.com` is incubation and carries no stability
    guarantee. An experiment mints identifiers under it, the prefix
    `lab.trogonstack.com/` and groups `<area>.lab.trogonstack.com`, and
    products **MUST NOT** depend on an identifier minted there.
    Graduating an experiment into a product means registering
    `trogon<name>.com` and minting fresh identifiers under it; an alias
    from the lab name is not a graduation path.
11. `trogoncompany.com` is the company: marketing, careers, legal, and
    corporate content. It **MUST NOT** appear in any technical
    identifier and **MUST NOT** host any application, API, or
    documentation surface.
12. `trogoncloud.com` carries only content that customers of the managed
    offering deploy, as `<app>.trogoncloud.com` or whatever shape the
    offering chooses, following `github.io`, `vercel.app`, and `fly.dev`.
    It **MUST** be submitted to the private section of the Public Suffix
    List before the first customer host is served. It **MUST NOT** host
    any organization-operated surface, whether console, login,
    documentation, or API, and it **MUST NOT** appear in any
    organization identifier.
13. Aliases **MUST** answer with a permanent redirect to their canonical
    domain, **MUST NOT** serve content, and **MUST NOT** appear in any
    identifier. `trogondb.io` redirects to `trogondb.com`, and
    `trogonstreams.com` redirects to `trogonstream.com`, while they are
    held. Because no identifier may reference an alias, an alias **MAY**
    be allowed to lapse.
14. Cookies and sessions respect the registrable-domain boundary that
    the roles above create.
    - `trogonapis.com` **MUST NOT** set or accept cookies. Authentication
      is bearer tokens only. This is the reason the machine umbrella is
      a registrable domain of its own rather than a host under the
      platform domain.
    - `trogoncloud.com` carries untrusted content and relies on its
      Public Suffix List entry, so `<app>.trogoncloud.com` cannot set a
      cookie on the parent and two customer applications are different
      sites. No organization cookie, login flow, or script is ever
      served from it.
    - An application under `trogonstack.com`, whether public
      (`<app>.trogonstack.com`) or private
      (`<service>.<cluster>.trogonstack.com`), **MUST** set host-only
      cookies: no `Domain` attribute, the `Secure` attribute, and the
      `__Host-` prefix **SHOULD** be used. A cookie with
      `Domain=trogonstack.com` or any parent label is forbidden, because
      public applications, private cluster names, documentation, and
      the console share the registrable domain and a domain cookie would
      reach all of them.
    - Single sign-on **MUST** be done by redirect to a dedicated login
      host and an authorization code or token exchange, never by a
      shared parent-domain session cookie. The interactive login surface
      is a host under `trogonstack.com`, such as `auth.trogonstack.com`,
      with host-only cookies of its own; the issuer URL that appears
      inside tokens is an identifier and lives under `trogonapis.com`.
      The concrete host names are chosen when the identity service
      exists; this rule fixes only their placement.
15. Kubernetes API groups, whether for custom resource definitions or
    aggregated API servers, are DNS names owned by the author, following
    the upstream convention of `cert-manager.io`, `monitoring.coreos.com`,
    and `*.cnrm.cloud.google.com`. A product group is
    `<area>.<product>.com`, for example `clusters.trogondb.com`. A
    platform-wide group that belongs to no product is
    `<area>.trogonstack.com`; the hosted control plane uses
    `<area>.cloud.trogonstack.com` and an experiment uses
    `<area>.lab.trogonstack.com`. Groups **MUST NOT** be minted under
    `trogonapis.com`, `trogoncompany.com`, `trogoncloud.com`, or any
    alias.
16. An API group version uses the same version ladder as a protobuf
    package: `v1alpha1`, `v1beta1`, `v1`. The `<area>` segment **MUST**
    be the same word in both renderings, so `clusters.trogondb.com` and
    the package root `trogondb.clusters` are recognizably one area. The
    version reports the maturity of its own surface and nothing else: a
    manifest group at `v1alpha1` **MAY** wrap a wire schema already at
    `v1`, as Google's Config Connector groups do over stable `google.*`
    packages, and neither side is bumped to match the other.
    [ADR#6874603764](../6874603764/README.md) owns the package rules;
    this ADR owns the DNS rendering.
17. Every Kubernetes-style key follows the `prefix/name` syntax and the
    ownership rule that [ADR#5177934677](../5177934677/README.md)
    specifies for annotations. This ADR extends that rule to label keys,
    taint keys, finalizers (`<area>.<product>.com/<name>`), and field
    manager names. One owner, one canonical domain, every key under it.
18. Reverse-DNS identifiers (Java packages, including the protobuf
    `java_package` option, Apple bundle identifiers,
    D-Bus names, Android application identifiers) are the reversed
    canonical domain: `com.trogonstack.*` for the platform,
    `com.trogonstack.cloud.*` for the hosted control plane, and
    `com.<product>.*` for a product. The reverse of `trogonapis.com`
    **MUST NOT** be used, because that domain names endpoints and type
    URLs, not code, and the reverse of `trogoncloud.com` **MUST NOT** be
    used, because that domain carries no organization identifier.
19. Identifiers use canonical domains only. This covers the kinds in the
    table under Where each identifier lives, token issuer URLs, and any
    position added later where a domain acts as an ownership claim.
20. A new product registers `trogon<name>.com` before any identifier is
    minted for it, and takes `<name>.trogonapis.com` as its API hostname
    at the same time. The name under `trogonapis.com` and the name in
    the product domain **MUST** match.
21. A domain that appears in an identifier is permanent. It **MUST**
    remain registered with automatic renewal enabled for as long as any
    record carrying the identifier can be read, because an expired
    identifier domain is a takeover of every identifier under it.
    [ADR#5177934677](../5177934677/README.md) already states that a
    lapsed registration grants no claim over documented prefixes; this
    rule prevents the lapse rather than arguing about it afterwards.
22. Protobuf package roots are not domains and are not allocated here.
    `trogon.` is the root for shared packages and the product name is
    the root for product packages, per
    [ADR#6874603764](../6874603764/README.md).
23. A private name that a person or a client configuration references
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

| Identifier kind  | Platform                           | Product                       | Shared API surface           |
| ---------------- | ---------------------------------- | ----------------------------- | ---------------------------- |
| Label/annotation | `trogonstack.com/`                 | `<product>.com/`              | none                         |
| Finalizer        | `<area>.trogonstack.com/<name>`    | `<area>.<product>.com/<name>` | none                         |
| API group        | `<area>.trogonstack.com`           | `<area>.<product>.com`        | none                         |
| Type URL         | none                               | none                          | `type.trogonapis.com/<type>` |
| Service hostname | none                               | none                          | `<service>.trogonapis.com`   |
| Reverse-DNS      | `com.trogonstack.*`                | `com.<product>.*`             | none                         |
| Documentation    | `docs.trogonstack.com`             | `<product>.com`               | none                         |
| Public app host  | `<app>.trogonstack.com`            | `<product>.com`               | none                         |
| Private host     | `<name>.<cluster>.trogonstack.com` | none                          | none                         |
| Customer content | never                              | never                         | never                        |
| Cluster plumbing | never                              | never                         | never                        |

`trogoncompany.com` and `trogoncloud.com` have no column by design: the
company domain carries no technical identifier, and the customer-content
domain belongs to customers, not to the organization.

## Consequences

- A reader who sees a host, a group, or a key prefix can name its owner,
  and a writer who has an owner can name the identifier, without
  consulting anyone.
- Every `Any` payload across every product resolves against one type
  host, and every full resource name shares one suffix, so a generic
  client needs one trust root and one parser.
- A Kubernetes operator and a gRPC service for the same product area
  share a name: `clusters.trogondb.com/v1alpha1` and
  `trogondb.clusters.v1` are recognizably the same area, and each
  version ladder reports the maturity of its own surface.
- Product identity and machine endpoints are decoupled. A product can
  rebrand its site without touching a single stored identifier, and the
  API umbrella can change infrastructure without touching a product
  site.
- The permanent set is `trogoncompany.com`, `trogonstack.com`,
  `trogonapis.com`, `trogoncloud.com`, and the product domains. Nothing
  new has to be registered. `trogon.dev` and `trogonlab.com` leave the
  scheme, and `trogondb.io` and `trogonstreams.com` redirect while held
  and may lapse. Automatic renewal becomes a correctness requirement
  rather than a billing preference for every domain in rule 2.
- `trogoncloud.com` has to be listed in the Public Suffix List before
  customer content is served from it, and the listing is a one-time
  operational task with a review delay, so it is done before the
  managed offering launches rather than after.
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
- Existing reservations stay valid. `trogondb.com/` as reserved by
  [ADR#5177934677](../5177934677/README.md) is a rule 4 prefix and
  needs no change.
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
