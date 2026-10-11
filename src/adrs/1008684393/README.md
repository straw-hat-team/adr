---
id: '1008684393'
title: Service listeners, health checks and telemetry export
state: Draft
created: 2026-10-11
tags: [kubernetes, grpc, connect, http, health, probes, opentelemetry, ingress]
category: Platform
---

# Service listeners, health checks and telemetry export

## Context

Our services answer more than one protocol. A single Rust server can carry
gRPC for SDKs and other services, Connect for browsers, and MCP or plain HTTP
for agents and webhooks. Each addition invited a new port, and each new port
then needed its own container port, Service port, probe, ingress rule and
NetworkPolicy, so the chart grew faster than the service did.

Health checks drifted the same way. Some services probed a TCP socket, some an
HTTP `/healthz`, some the gRPC health service. A few moved probes to a
management port, where a probe can report healthy while the port that carries
traffic is hung, out of capacity or failing TLS. Others checked the database
from the liveness probe, so a single database hiccup restarted every pod at
the same moment and turned a short blip into an outage. Paths drifted too:
some services answer at the root, others under `/~/health`, so every chart,
ingress exclusion and dashboard had to learn each service's spelling.

Telemetry is the third piece. OpenTelemetry is how we observe services: traces,
metrics and logs leave the process over OTLP and an OpenTelemetry Collector
decides where they go. A per-service Prometheus scrape endpoint is a second
metrics path that has to be secured, routed and kept in step with the first.
Probes add noise on top: a probe every few seconds per pod produces more spans
than real traffic on a quiet service.

## Resolution

### Listeners

- You **MUST** choose ports by audience, not by protocol. Everything a client
  outside the pod calls (gRPC, Connect, MCP, plain HTTP) **MUST** share one
  serving port and be told apart by path.
- You **MUST NOT** add a port for a new protocol. A new port is justified only
  by a new trust boundary: an audience that needs different network exposure
  than the existing one, such as a public webhook receiver beside a private
  API.
- The serving port **MUST** accept both HTTP/1.1 and HTTP/2. gRPC requires
  HTTP/2, while health probes and most MCP and browser clients use HTTP/1.1.
- You **MAY** run an admin port for profiling and debugging. It **MUST** bind
  loopback by default, **MUST** require an explicit opt-in to bind any other
  interface, and **MUST NOT** be referenced by an ingress, a route or a probe.

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

### Health checks

- Every service **MUST** answer `GET /-/livez` and `GET /-/readyz` over
  HTTP/1.1 on the serving port, gRPC services included, and **MUST** point
  Kubernetes probes at them with `httpGet`. A service whose initialization
  differs from readiness **MAY** also answer `GET /-/startupz` for the startup
  probe. These follow the names the Kubernetes API server uses; you **MUST
  NOT** add `healthz`, which Kubernetes deprecated. HTTP is
  the one check every platform can run: kubelet, Cloud Run and every load
  balancer speak it, while GKE Ingress cannot build a gRPC health check and
  Cloud Run's HTTP probes require HTTP/1.
- A service that serves gRPC or Connect **MUST** also implement
  `grpc.health.v1` on the serving port, reporting the same readiness as
  `/-/readyz`, for gRPC clients and load balancers that check health
  themselves.
- A probe on the serving port takes the same listener, TLS and concurrency
  limits as real traffic, so a hung or saturated listener fails it. A probe on
  any other port **MUST NOT** stand in for it.

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
- You **MUST NOT** require a scrape endpoint to observe a service. When a
  consumer can only scrape, the Collector exposes Prometheus, not the service.
  A service that must expose metrics itself **MUST** do so at `/-/metrics` on
  the admin port, never on the serving port.
- You **MUST** instrument every protocol on the serving port with the same
  pipeline, following the OpenTelemetry RPC semantic conventions for gRPC and
  Connect and the HTTP semantic conventions for everything else, so one
  dashboard covers every caller.
- Requests under `/-/` **MUST NOT** start spans. Exclude the prefix where the
  instrumentation is installed rather than filtering in the Collector, so
  health checks never consume sampling budget or export bandwidth.

### Kubernetes

- The Service **MUST** expose only the serving port. When the backend speaks
  HTTP/2 without TLS, the port **MUST** set `appProtocol: kubernetes.io/h2c`.
- An ingress or Gateway API route **SHOULD** forward the `/` prefix to the
  serving port and leave path routing to the service. It **MUST NOT** route
  the `/-/` prefix to the outside world.
- A load balancer health check **MUST** target `/-/readyz` on the serving
  port.
  Where the controller does not read it from the readiness probe, such as GKE
  Gateway, you **MUST** declare it explicitly (a `HealthCheckPolicy` on GKE),
  since the default check requests a path the service may not answer.
- A NetworkPolicy **SHOULD** limit the admin port, when one exists, to the
  namespaces that need it.

  ```txt
  pod
  ├── serving port   gRPC, Connect, MCP, HTTP, grpc.health.v1
  │                  /-/livez, /-/readyz, /-/startupz
  │                  ← Service ← ingress or route (prefix /, never /-/)
  │                  ← kubelet probes, load balancer health checks
  ├── admin port     profiling, debug, /-/metrics only when unavoidable
  │                  loopback by default, never routed or probed
  └── OTLP out  ──→  OpenTelemetry Collector  ──→  backends
  ```

## Links

- [ADR#1631648331](../1631648331/README.md): Rust is the language for new
  services and programs
- [Kubernetes API health endpoints](https://kubernetes.io/docs/reference/using-api/health-checks/)
- [Configure liveness, readiness and startup probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Cloud Run container health checks](https://docs.cloud.google.com/run/docs/configuring/healthchecks)
- [GKE Ingress health checks](https://docs.cloud.google.com/kubernetes-engine/docs/troubleshooting/ingress-health-checks)
- [GKE Gateway health check policy](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/configure-gateway-resources)
- [Service application protocol](https://kubernetes.io/docs/concepts/services-networking/service/#application-protocol)
- [gRPC health checking protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
- [GitLab health check endpoints](https://docs.gitlab.com/administration/monitoring/health_check/)
- [Prometheus management API](https://prometheus.io/docs/prometheus/latest/management_api/)
- [Liveness probes are dangerous](https://srcco.de/posts/kubernetes-liveness-probes-are-dangerous.html)
- [OTLP metrics export to Prometheus](https://opentelemetry.io/docs/compatibility/prometheus/otlp-metrics-export/)
- [OpenTelemetry SDK environment variables](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/)
- [OpenTelemetry RPC semantic conventions](https://opentelemetry.io/docs/specs/semconv/rpc/)
- [OpenTelemetry HTTP semantic conventions](https://opentelemetry.io/docs/specs/semconv/http/)
