---
id: '9147226377'
title: Private Network Naming, Resolution, and Certificate Trust
state: Reviewing
created: 2026-10-03
tags: [dns, networking, security, tls, kubernetes, platform-design, naming]
category: Platform
---

# Private Network Naming, Resolution, and Certificate Trust

## Context

[ADR#0184938998](../0184938998/README.md) allocates every public domain
to an owner and a role, and every one of those names is meant to be
seen: a product site, an API endpoint, a type URL, an API group. Private
infrastructure has the opposite requirement. A dashboard reached from a
laptop, a control plane reaching a database, a homelab host reaching a
cloud one, all need names, and none of those names should resolve from
the public internet or appear in anything that leaves the network. Today
each environment improvises: a cluster uses the Kubernetes default
`cluster.local`, a laptop uses its tooling's multicast names, and a cloud
project uses whatever its provider hands out. Nothing links them.

The first draft of this decision answered with a private zone,
`trogonstack.internal`, and a private certificate authority for every
private name. Privacy was a property of the name: ICANN reserved the
`.internal` top-level domain for private use in 2024, following the
Security and Stability Advisory Committee's SAC113 recommendation, so
the zone is never delegated, public resolvers answer NXDOMAIN forever,
and no public certificate authority can validate control of it. Google
Cloud already uses it for VM internal DNS (`<zone>.c.<project>.internal`
and `metadata.google.internal`), which is why a branded second level is
needed to stay clear of provider zones.

That draft fails at the human boundary. Every browser, phone, and
developer tool that reaches a private name has to trust the private
root, and distributing a root reliably needs device management the
organization does not run. In practice the root reaches some devices and
not others, people click through warnings or disable verification in a
client, and a service that was supposed to be protected by TLS ends up
with TLS that nobody checks. A private certificate authority that people
have to trust is worse than none, because it trains them to ignore the
only signal that matters. The decision driver is therefore inverted: a
person, or a client configuration a person writes, **MUST** never need
to trust a private root.

The self-hosting and small-organization community has converged on a
pattern that satisfies that driver, and Tailscale's own documentation
steers toward it. Transport is an overlay network, so no service opens a
port to the internet. Names live in a private subzone of a domain the
organization already owns, and split DNS routes that subzone to a
resolver inside the overlay, so the names resolve for members and for
nobody else. Certificates are real: one Let's Encrypt wildcard per
cluster, obtained through the DNS-01 challenge, which proves control of
the zone without any host being reachable, and served by a reverse proxy
such as Caddy or Traefik, or by cert-manager inside Kubernetes. The same
names, and the same wildcard, cover databases, queues, and other
non-HTTP services, or those services rely on the overlay's own
encryption. Every device already trusts the result, because the trust
root is the public one it shipped with.

Within that pattern `.internal` still has a job. A Kubernetes cluster
needs a cluster domain, workloads inside a mesh need identities that a
platform injects rather than a person installs, and neither of those
names is ever typed by a human. That is in-cluster plumbing, and this
decision keeps `.internal` for exactly that.

### Prior scheme

A personal scheme preceded this decision and shaped the requirements.
Each of its forms maps onto a rule below or onto the companion ADR.

- `<app>.<brand>.dev` for applications behind a public proxy. This is
  superseded. `trogon.dev` is not part of the scheme, developer
  documentation lives at `docs.trogonstack.com`, and a public
  application is now `<app>.trogonstack.com` resolving to the edge, a
  rule that [ADR#0184938998](../0184938998/README.md) carries.
- `<app>.internal`, `<region>.<app>.internal`, and
  `<process>.process.<app>.internal` for app-first private names, in the
  style of Fly.io private networking, resolving to machines over the VPN
  and never through the proxy. The intent carries over whole and the
  shape changes: the app becomes `<service>`, the region becomes the
  `<cluster>` label, the region-less "any instance anywhere" lookup
  becomes the `global` pseudo-cluster, and the zone moves from
  `.internal` to `<cluster>.trogonstack.com` so that the names carry
  publicly trusted certificates. Bare `<app>.internal` is rejected for
  the provider-collision reason given in Considered options.
- `<app>.<brand>cast` as an invented, IPv6-only, VPN-proxied top-level
  domain. This is superseded. An unregistered pseudo-TLD is exactly the
  thing `.internal` was reserved to replace, the VPN-only proxy is just
  another service on the overlay, and the IPv6 requirement survives as
  the unique local address rule below.
- `<service>.<host>.<site>.<brand>.<tld>` on a public domain, with the
  hierarchy service, host, site, organization. This is the closest
  ancestor of the chosen scheme. The site becomes the `<cluster>` label
  and the host label is dropped from service names, because a service
  is addressed by what it is rather than by which machine currently runs
  it; machines keep their own `<host>.<cluster>` names. What the prior
  form lacked, and this decision adds, is the rule that the zone has no
  public records and one wildcard certificate per cluster.

### Considered options

**`.internal` as the primary private zone, private certificate
authority for everything** (the first draft of this ADR).

- Good, because privacy is a property of the name: no delegation, no
  public certificate, no Certificate Transparency entry, no public
  resolution, and a reader knows at once that the name must not leave
  the network.
- Bad, because every person and every client configuration has to trust
  the private root. Without device management the root reaches some
  devices and not others, people route around the failures, and the
  scheme ends up with less verified TLS than a public certificate would
  have given for free. Rejected for everything a person reaches; kept
  for in-cluster plumbing where a platform, not a person, installs the
  trust.

**Public subdomain, per-host public certificates, public records.**

- Good, because every client trusts the certificates and nothing new has
  to be operated.
- Bad, because every hostname that receives a certificate is published
  in Certificate Transparency logs, so the service inventory is public.
  Bad, because a public record for a private address exposes the
  network layout, and one misconfigured record can expose the service
  itself.

**Public subdomain, one wildcard certificate per cluster, no public
records, split DNS** (chosen).

- Good, because every browser, phone, and developer tool trusts the
  certificate with nothing installed.
- Good, because Certificate Transparency sees only `*.<cluster>` and the
  cluster label, never a service name, and public DNS sees nothing at
  all, so the privacy that the first draft got from the top-level domain
  is recovered from the zone's configuration.
- Good, because a database or a queue gets the same name shape and the
  same certificate as a web application, so there is one scheme to
  teach.
- Bad, because the ACME client holds a DNS credential, which becomes the
  secret that protects the scheme. The credential is bounded by
  delegating the challenge zone, as the rules below require.
- Bad, because privacy depends on a resolver configuration rather than
  on the name. That is accepted: the overlay already is the perimeter,
  and a name that leaks still resolves nowhere.

**Overlay vendor names** such as a tailnet's `*.ts.net`.

- Good, because they resolve wherever the overlay reaches and the vendor
  issues certificates for them.
- Bad, because the name belongs to the vendor and changes with the
  vendor, and it cannot name a cluster, a service, or anything the
  vendor does not know about. Usable as an alias target behind a
  canonical name, not as the canonical name.

**`.local`.**

- Bad, because [RFC 6762](https://www.rfc-editor.org/rfc/rfc6762)
  assigns it to multicast DNS. Unicast use fights Bonjour and Avahi on
  every workstation and produces resolution that depends on which
  resolver answers first.

**`.lan`, `.corp`, `.home`.**

- Bad, because ICANN blocks their delegation after name-collision
  studies but has never reserved them. The guarantee is an absence of
  action, not a commitment, and the strings are too common to be
  distinctive.

**`.home.arpa`.**

- Good, because [RFC 8375](https://www.rfc-editor.org/rfc/rfc8375)
  reserves it properly.
- Bad, because its scope is residential networks. One scheme has to
  cover the homelab and the cloud, and a cloud deployment under a home
  network name is misleading.

## Resolution

1. Any name a person or a client configuration references on the private
   network is `<service>.<cluster>.trogonstack.com`. The `<cluster>`
   label is `<env>-<site>`, as in `prod-use1`, or a bare site such as
   `homelab` where one environment is all there is, so environment and
   location are readable from the name. The label space is allocated by
   [ADR#0184938998](../0184938998/README.md), which reserves every
   cluster label under `trogonstack.com`. These are the canonical
   private names for HTTP applications and for databases, queues, and
   every other non-HTTP service alike; a connection string names
   `postgres.homelab.trogonstack.com`, not an address and not an
   in-cluster name. An application on a private name sets host-only
   cookies per [ADR#0184938998](../0184938998/README.md), so a cluster
   application cannot read a public application's session and the
   reverse.
2. A private name **MUST NOT** have an A or AAAA record in public DNS.
   Resolution comes only from resolvers the organization controls,
   reached over the overlay; with Tailscale, split DNS routes each
   `<cluster>.trogonstack.com` zone to that cluster's resolver, and
   other members of the overlay see the same answer the cluster sees.
   The only public records permitted under a cluster zone are the
   `_acme-challenge` delegation of rule 3.
3. Certificates for `*.<cluster>.trogonstack.com` come from a public
   certificate authority through the ACME DNS-01 challenge, one wildcard
   per cluster, renewed unattended by the reverse proxy or by
   cert-manager. The ACME client **MUST** hold a credential scoped to a
   delegated challenge zone, reached through a CNAME from
   `_acme-challenge.<cluster>.trogonstack.com` to a zone that holds
   nothing else, and **MUST NOT** hold a credential that can write the
   `trogonstack.com` apex. Browsers, phones, and developer tooling
   **MUST NOT** be required to trust a private root for any name they
   reach.
4. Transport on the private network is the overlay. A service reachable
   only over the overlay **MAY** run without application-layer TLS,
   because the overlay authenticates and encrypts every hop. That choice
   is recorded with the cluster, next to the cluster-domain decision of
   rule 6 and the IPv6 decision of rule 10. Anything reachable from
   outside the overlay **MUST** use TLS with a publicly trusted
   certificate.
5. A private certificate authority, OpenBao's PKI secrets engine, is
   scoped to workload identity: mutual TLS between workloads inside a
   cluster or a mesh, where the platform injects both the certificate
   and the trust bundle and no person installs anything. It **MUST NOT**
   issue for any DNS name under `trogonstack.com`, and it **MUST NOT**
   issue for any name a person reaches.
6. `.internal`, with the branded root `trogonstack.internal`, is
   in-cluster plumbing. A Kubernetes cluster **MAY** set its cluster
   domain to `<cluster>.trogonstack.internal` or keep `cluster.local`,
   recorded with the cluster. A name under either **MUST NOT** be
   referenced from outside its cluster, in client configuration, or by a
   person; the name of rule 1 is what crosses a cluster boundary, and
   the cluster's ingress or resolver maps it onto the in-cluster name.
   Bare `.internal` without the branded second level is forbidden,
   because providers own zones directly under `.internal`.
7. A machine or virtual machine is `<host>.<cluster>.trogonstack.com`,
   under the same zone and the same rules as a service. Overlay vendor
   names such as MagicDNS `<host>.<tailnet>.ts.net` **MAY** exist and
   **MAY** be alias targets, and **MUST NOT** be the canonical name in
   any configuration.
8. `<service>.global.trogonstack.com` **MAY** be served by the resolver
   as the union of that service's instances across every cluster, which
   is the app-first "any instance anywhere" lookup of the prior scheme.
   `global` is a reserved label and **MUST NOT** name a real cluster.
   Resolver support for it is optional per environment, and where it is
   absent the name **MUST NOT** resolve at all rather than resolve to
   one arbitrary cluster.
9. A private name resolves to a private address, a machine, a pod, or a
   private load balancer, and never to the public edge. Traffic to a
   private name **MUST NOT** traverse the public edge. The inverse rule,
   that a public application name resolves only to the edge, lives in
   [ADR#0184938998](../0184938998/README.md).
10. Records under a cluster zone **MAY** be IPv6-only using unique local
    addresses from `fd00::/8` per
    [RFC 4193](https://www.rfc-editor.org/rfc/rfc4193), which is the
    precedent of both the prior scheme and Fly.io private networking.
    Where a cluster makes that choice, every client inside it **MUST**
    support IPv6, and the choice is recorded with the cluster.
11. Private names are addressing, never identity, whether under
    `<cluster>.trogonstack.com` or under `.internal`. They **MUST NOT**
    appear in any identifier governed by
    [ADR#0184938998](../0184938998/README.md): API groups, annotation or
    label prefixes, reverse-DNS identifiers, token issuer URLs, or `Any`
    type URLs. They **MUST NOT** appear in OpenAPI server lists, in
    CloudEvents source URIs that leave the network, in public
    documentation, or in public repositories. A full resource name keeps
    `trogon<name>.trogonapis.com` as its service segment even when the call
    is routed over the private network.
12. Local developer tooling names, such as OrbStack's `*.orb.local` or
    any multicast DNS name, are laptop-only. They **MUST NOT** be mixed
    into any zone above and **MUST NOT** be referenced by any deployed
    configuration.

## Consequences

- There is one scheme to teach. A `trogonstack.com` name with a cluster
  label is private, resolves only on the overlay, and carries the
  cluster's wildcard; a `trogonstack.com` name without one is the public
  edge. A reader can tell which is which without consulting anyone.
- No person installs a private root, ever. The private certificate
  authority exists only where a platform injects trust into a workload,
  and a browser warning on a private name is a real failure rather than
  an expected one.
- The DNS-01 credential is the residual secret. Delegating the challenge
  to its own zone bounds it: a stolen credential can obtain certificates
  for names under the cluster zones it serves and can do nothing to the
  apex, to public records, or to any other owner's zone.
- Certificate Transparency shows `*.<cluster>.trogonstack.com` and
  therefore the list of cluster labels, and nothing else. Service names,
  machine names, and addresses never appear in a public log or in public
  DNS.
- The homelab and the cloud share one scheme, so a service moving
  between them changes its `<cluster>` label and nothing else, and a
  connection string points at a name that survives the move of the
  machine behind it.
- `.internal` and `cluster.local` are invisible to users. Charts that
  hardcode `cluster.local` keep working, a cluster that wants a branded
  cluster domain can have one, and neither choice is visible outside the
  cluster.
- Overlay network names remain available as alias targets, which keeps
  the canonical name stable across a change of vendor.
- The prior scheme's names are retired. The public-proxy form and the
  invented top-level domain have no successor alias; the host-bound form
  is the direct ancestor of the chosen shape and its sites become
  cluster labels.
- [ADR#0184938998](../0184938998/README.md) carries the cluster-label
  reservation and the private host rows in its identifier table, and the
  public and private namespaces are now both decided on one domain.

## Links

- [ADR#0184938998](../0184938998/README.md): Domain Names and DNS-Rooted
  Identifiers Across Products
- [ADR#6874603764](../6874603764/README.md): Protobuf Package Namespaces
  Across Products
- [ADR#5177934677](../5177934677/README.md): Annotations and Transient
  Annotations
- [Tailscale: Split DNS](https://tailscale.com/kb/1054/dns#split-dns)
- [Tailscale: MagicDNS](https://tailscale.com/kb/1081/magicdns)
- [Tailscale: Enabling HTTPS certificates](https://tailscale.com/kb/1153/enabling-https)
- [Let's Encrypt: Challenge types](https://letsencrypt.org/docs/challenge-types/)
- [Let's Encrypt: ACME v2 wildcard support](https://community.letsencrypt.org/t/acme-v2-production-environment-wildcards/55578)
- [cert-manager: ACME DNS01 and delegated domains](https://cert-manager.io/docs/configuration/acme/dns01/#delegated-domains-for-dns01)
- [acme-dns: limited DNS server for ACME DNS challenges](https://github.com/joohoi/acme-dns)
- [Caddy: Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Fly.io: Private Networking](https://fly.io/docs/networking/private-networking/)
- [ICANN Board resolution reserving `.internal` for private use (2024)](https://www.icann.org/en/board-activities-and-meetings/materials/approved-resolutions-regular-meeting-of-the-icann-board-29-07-2024-en#section2.a)
- [SSAC SAC113: Private-use TLD recommendation](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/sac-113-en.pdf)
- [RFC 4193: Unique Local IPv6 Unicast Addresses](https://www.rfc-editor.org/rfc/rfc4193)
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761)
- [RFC 6762: Multicast DNS](https://www.rfc-editor.org/rfc/rfc6762)
- [RFC 8375: Special-Use Domain `home.arpa.`](https://www.rfc-editor.org/rfc/rfc8375)
- [RFC 6962: Certificate Transparency](https://www.rfc-editor.org/rfc/rfc6962)
- [Google Cloud: Internal DNS](https://cloud.google.com/compute/docs/internal-dns)
- [Kubernetes: DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [OpenBao: PKI secrets engine](https://openbao.org/docs/secrets/pki/)
