---
id: '1008684393'
title: Service audiences, listeners, health checks and telemetry
state: Approved
created: 2026-10-11
tags: [kubernetes, grpc, connect, http, health, probes, opentelemetry, ingress, networkpolicy, security]
category: Platform
---

# Service audiences, listeners, health checks and telemetry

## Context

A service is called by very different parties: customers over the internet,
other services inside the platform, staff operating the business, and the
platform itself checking whether the service is alive. Each of these expects a
different level of exposure and a different kind of authentication, and most
services serve only some of them. Many services are called by other services
and nobody else.

Without shared names for these parties, every service decided its exposure on
its own. Each protocol a service learned (gRPC, Connect, MCP, plain HTTP)
invited a new port, and each port then needed its own container port, Service
port, probe, ingress rule and NetworkPolicy, so the deployment grew faster than
the service did. Whether a port was reachable from the internet depended on
which ingress rules happened to exist, not on a decision anyone wrote down.

Health checks drifted the same way. Some services probed a TCP socket, some an
HTTP `/healthz`, some the gRPC health service. A few moved probes to a
management port, where a probe can report healthy while the port that carries
traffic is hung, out of capacity or failing TLS. Others checked the database
from the liveness probe, so a single database hiccup restarted every pod at
the same moment and turned a short blip into an outage. Paths drifted too:
some services answer at the root, others under `/~/health`, so every chart,
ingress exclusion and dashboard had to learn each service's spelling.

Telemetry is the last piece. OpenTelemetry is how we observe services: traces,
metrics and logs leave the process over OTLP and an OpenTelemetry Collector
decides where they go. A per-service Prometheus scrape endpoint is a second
metrics path that has to be secured, routed and kept in step with the first.
Probes add noise on top: a probe every few seconds per pod produces more spans
than real traffic on a quiet service.

## Resolution

### Audiences

Every caller of a service belongs to exactly one audience. The audience, not
the protocol, decides where a request enters the service and what it must
prove.

| Audience | Who calls                                   | Reaches the service through                   |
| -------- | ------------------------------------------- | --------------------------------------------- |
| Public   | Clients outside the organization's network  | The edge: an ingress or Gateway API route     |
| Private  | Other workloads inside the platform         | The Service, never the edge                   |
| Admin    | Staff operating the business                | An admin application that calls Private APIs  |
| Internal | The platform running the service            | The pod network or loopback                   |

- Every service **MUST** document which of Public and Private it serves. A
  service that does not serve Public **MUST NOT** be referenced by any edge
  route. Serving only Private is the expected default; Public is the exception
  that has to be argued for.
- Every service serves Internal. Admin is never served by the service directly.

#### Public

- Public traffic **MUST** enter through the edge, which terminates TLS and is
  the only component exposed to the internet. Rate limiting and request size
  limits **SHOULD** be enforced at the edge.
- Every Public request **MUST** be authenticated with credentials issued by
  the identity provider, except for operations explicitly designed to be
  anonymous, which **MUST** be listed as such in the service's API definition.
- The service **MUST NOT** trust forwarding headers such as `X-Forwarded-For`
  from anything other than the edge.

#### Private

- Private traffic **MUST** stay inside the platform network. A caller in another
  cluster reaches it through an internal load balancer or the service mesh,
  never through the public edge.
- Every Private request **MUST** authenticate the calling workload, with mesh
  mTLS or a workload identity token. Being inside the cluster is not an
  identity.
- When a Private call acts on behalf of a user, the caller **MUST** forward
  that user's identity, and the service **MUST** authorize against it rather
  than against the caller's own privileges.
- A NetworkPolicy **SHOULD** admit only the workloads that are documented
  callers.

#### Admin

- Tools for staff, such as dashboards and support consoles, **MUST** be
  separate applications. A service **MUST NOT** host an admin UI or open an
  admin port; every service that grew one would also grow its own login, CSRF
  protection, session handling and UI dependencies.
- Operations that only staff may perform **MUST** be ordinary Private API
  operations guarded by authorization, so they share the service's validation,
  audit trail and telemetry with every other call.
- The admin application **MUST** authenticate staff through single sign-on with
  multi-factor authentication, **MUST** call services with the operator's own
  identity rather than a shared privileged account, and **MUST** be reachable
  only through an identity-aware proxy or the private network.
- Every state-changing admin operation **MUST** be audit logged with the
  operator's identity.

#### Internal

- Internal callers are the kubelet, load balancer health checks, the service
  mesh and engineers debugging a single pod. They reach the service only
  through operational paths and the debug port.
- Internal endpoints **MUST NOT** carry business data and **MUST NOT** change
  business state.

### Listeners

- A service **MUST** open one serving port per audience it serves, and no more:
  a `private` port, a `public` port, or both. Everything one audience calls
  (gRPC, Connect, MCP, plain HTTP) **MUST** share that audience's port and be
  told apart by path.
- You **MUST NOT** add a port for a new protocol. A port exists only to put a
  trust boundary between audiences, so the network can expose one without the
  other.
- Container ports and Service ports **MUST** be named after their audience:
  `public`, `private` and `debug`. Callers, routes and policies then refer to
  the audience by name instead of to a number.
- Every serving port **MUST** accept both HTTP/1.1 and HTTP/2. gRPC requires
  HTTP/2, while health probes and most MCP and browser clients use HTTP/1.1.
- You **MAY** run a `debug` port for profiling and debugging. It **MUST** bind
  loopback by default, **MUST** require an explicit opt-in to bind any other
  interface, and **MUST NOT** be referenced by a Service, a route or a probe.

### Path layout

- gRPC **MUST** be served at its canonical root paths,
  `/{package}.{Service}/{Method}`, and **MUST NOT** be mounted under a prefix
  such as `/rpc/`. gRPC clients, grpcurl, reflection, gRPC probes, load
  balancer health checks and service meshes all expect it there, and gRPC
  servers put it there by default.
- Every other route **MUST NOT** start with a fully qualified proto service
  name or with `/-/`. `/mcp` is fine; `/acme.billing.v1.Invoices` is not.

### Operational paths

- The `/-/` prefix **MUST** be reserved for operational endpoints on every
  listener, and application routes **MUST NOT** live under it. A `-` segment
  cannot collide with a username, a resource ID or an API version, and GitLab
  and Prometheus already use the same prefix, so operators recognize it.
- You **MUST NOT** use `/~/` or other prefixes for operational endpoints. `~`
  conventionally names a user's home directory in URLs, and a single prefix
  lets every proxy, route and instrumentation filter match one pattern.
- Operational endpoints **MUST** be mounted ahead of application routing and
  authentication, so a broken router or auth backend cannot hide them.
- The `grpc.health.v1` methods are the one exception to the prefix. Their
  paths, such as `/grpc.health.v1.Health/Check` and
  `/grpc.health.v1.Health/Watch`, are fixed by the gRPC protocol and **MUST**
  be treated as operational paths wherever this ADR says `/-/`.

| Path          | Port               | Purpose                                   | Required                   |
| ------------- | ------------------ | ----------------------------------------- | -------------------------- |
| `/-/readyz`   | every serving port | Readiness and load balancer health checks | always                     |
| `/-/startupz` | every serving port | Startup                                   | with a startup probe       |
| `/-/livez`    | every serving port | Liveness                                  | with a liveness probe      |

### Health checks

- Every service **MUST** have a readiness probe. It is the only probe that
  protects callers: without it, a pod gets traffic before it can serve and
  keeps getting it while it cannot.
- A service **SHOULD** have a startup probe when initialization can outlast a
  few readiness periods, such as loading data or warming caches, and **MAY**
  omit it otherwise.
- A service **MAY** have a liveness probe, and **SHOULD** add one only when its
  process can hang without exiting, such as a deadlocked event loop. A process
  that crashes is restarted without one, and a liveness probe that checks the
  wrong thing restarts healthy pods.
- Probes **MUST** use the operational paths with `httpGet`, and a service
  **MUST** answer the path of every probe it declares. These follow the names
  the Kubernetes API server uses since it deprecated its own `/healthz`
  endpoint, and you **MUST NOT** add a `/-/healthz` beside them, so every
  service has one spelling per probe. HTTP is the one check every platform can
  run: kubelet, Cloud Run and every load balancer speak it, while GKE Ingress
  cannot build a gRPC health check and Cloud Run's HTTP probes require HTTP/1.
- A service whose probed port serves only gRPC over plaintext **MAY** use
  Kubernetes `grpc` probes against `grpc.health.v1` instead, naming the
  `readiness`, `startup` and `liveness` services for each probe. The empty
  service name **MUST** report readiness, since load balancers and clients
  check it. The kubelet gRPC probe cannot use TLS, so a TLS port **MUST** use
  `httpGet` with `scheme: HTTPS`.
- Kubernetes probes **MUST** target the `private` port when the service has
  one, and the `public` port otherwise.
- A service that serves gRPC or Connect **MUST** also implement
  `grpc.health.v1` on its serving ports, its empty service name reporting the
  same readiness as `/-/readyz`, for gRPC clients and load balancers that check
  health themselves.
- A probe on a serving port takes the same listener, TLS and concurrency
  limits as real traffic, so a hung or saturated listener fails it. A probe on
  the `debug` port **MUST NOT** stand in for it.

#### What each probe may check

| Probe     | Answers                       | Failing it               | May check                                 |
| --------- | ----------------------------- | ------------------------ | ----------------------------------------- |
| Startup   | has initialization finished   | kills the container      | the service's own initialization          |
| Liveness  | can the process make progress | restarts the container   | nothing outside the process               |
| Readiness | should requests reach the pod | removes it from rotation | its own connections to required services  |

- Startup **SHOULD** be used instead of a long initial delay on liveness. It
  **MUST** cover only the service's own initialization; a dependency that is
  down at boot is a readiness concern, not a reason to kill the container.
- Liveness **MUST NOT** depend on a database, broker or any other service,
  directly or through a shared check. A restart cannot fix a dependency, and
  every pod would restart at the same moment and reconnect to a dependency
  that is already struggling.
- Readiness **MAY** reflect dependencies that every request needs, so traffic
  avoids a pod that can only answer with errors. It **MUST** read the state
  the process already holds, such as whether its connection to the broker is
  up, and **MUST NOT** call out to a dependency or another pod on each probe.
  It **MUST NOT** include optional dependencies, and **SHOULD** fail only after
  that state has been bad for longer than a transient blip, since a shared
  dependency takes every pod out of rotation together.
- Readiness **MUST** go not ready as soon as shutdown begins, before in-flight
  requests drain, while liveness keeps passing until the process exits.
- Liveness **SHOULD** use a higher `failureThreshold` than readiness, so a pod
  is out of rotation for a while before it is killed.
- Health checks **MUST NOT** require authentication and **MUST NOT** return
  anything beyond status.

### Telemetry

- You **MUST** export traces, metrics and logs over OTLP to an OpenTelemetry
  Collector, configured through the standard `OTEL_*` environment variables
  (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`,
  `OTEL_RESOURCE_ATTRIBUTES`).
- A service **MUST NOT** expose a metrics endpoint for scraping. Metrics leave
  only over OTLP. A backend that wants to scrape reads from the Collector's
  Prometheus exporter, and Prometheus itself can receive OTLP directly, so no
  consumer needs the service to be scrapeable.
- You **MUST** instrument every protocol on every serving port with the same
  pipeline, following the OpenTelemetry RPC semantic conventions for gRPC and
  Connect and the HTTP semantic conventions for everything else, so one
  dashboard covers every caller.
- Requests to operational paths, both under `/-/` and to `grpc.health.v1`,
  **MUST NOT** start spans. Exclude them where the instrumentation is
  installed rather than filtering in the Collector, so health checks never
  consume sampling budget or export bandwidth.

### Kubernetes

- The Service **MUST** expose only serving ports, never `debug`. When a
  serving port speaks HTTP/2 without TLS, it **MUST** set
  `appProtocol: kubernetes.io/h2c`.
- An edge route **MUST** reference only the `public` port. It **SHOULD**
  forward the `/` prefix and leave path routing to the service.
- A `/` prefix also matches every operational path, so the edge **MUST** carry
  a more specific rule for `/-/` and `/grpc.health.v1.Health/` that answers
  without forwarding to the service. Both Ingress and Gateway API pick the
  longest matching prefix, so that rule takes precedence over `/`: on Gateway
  API it is an `HTTPRoute` rule with a `PathPrefix` match and no
  `backendRefs`, and on Ingress it is a `Prefix` path pointing at a backend
  that answers 404. Load balancer health checks are unaffected, since they
  reach the pod directly rather than through the route.
- A load balancer health check **MUST** target `/-/readyz` on the port it
  routes to. Where the controller does not read it from the readiness probe,
  such as GKE Gateway, you **MUST** declare it explicitly (a
  `HealthCheckPolicy` on GKE), since the default check requests a path the
  service may not answer.
- A NetworkPolicy **SHOULD** admit the edge to the `public` port only, and
  documented callers to the `private` port only.

  ```txt
  pod
  ├── public port    Public audience: gRPC, Connect, MCP, HTTP
  │                  /-/livez, /-/readyz, /-/startupz, grpc.health.v1
  │                  ← edge (prefix /, never /-/) ← internet
  ├── private port   Private audience: gRPC, Connect, MCP, HTTP
  │                  /-/livez, /-/readyz, /-/startupz, grpc.health.v1
  │                  ← Service ← other workloads, admin applications
  │                  ← kubelet probes
  ├── debug port     profiling and debugging
  │                  loopback by default, never in a Service, route or probe
  └── OTLP out  ──→  OpenTelemetry Collector  ──→  backends
  ```

## Links

- [ADR#1631648331](../1631648331/README.md): Rust is the language for new
  services and programs
- [Kubernetes API health endpoints](https://kubernetes.io/docs/reference/using-api/health-checks/)
- [Configure liveness, readiness and startup probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Service application protocol](https://kubernetes.io/docs/concepts/services-networking/service/#application-protocol)
- [Network policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Cloud Run container health checks](https://docs.cloud.google.com/run/docs/configuring/healthchecks)
- [GKE Ingress health checks](https://docs.cloud.google.com/kubernetes-engine/docs/troubleshooting/ingress-health-checks)
- [GKE Gateway health check policy](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/configure-gateway-resources)
- [gRPC health checking protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
- [GitLab health check endpoints](https://docs.gitlab.com/administration/monitoring/health_check/)
- [Prometheus management API](https://prometheus.io/docs/prometheus/latest/management_api/)
- [Liveness probes are dangerous](https://srcco.de/posts/kubernetes-liveness-probes-are-dangerous.html)
- [OTLP metrics export to Prometheus](https://opentelemetry.io/docs/compatibility/prometheus/otlp-metrics-export/)
- [Using Prometheus as an OpenTelemetry backend](https://prometheus.io/docs/guides/opentelemetry/)
- [OpenTelemetry SDK environment variables](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/)
- [OpenTelemetry RPC semantic conventions](https://opentelemetry.io/docs/specs/semconv/rpc/)
- [OpenTelemetry HTTP semantic conventions](https://opentelemetry.io/docs/specs/semconv/http/)
