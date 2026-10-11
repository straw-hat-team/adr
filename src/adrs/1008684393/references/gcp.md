# Google Cloud: exposure and health checks

Verified against primary documentation on 2026-10-11.

## Exposure

Load balancers are **external** or **internal**, defined by where the client
is: an external load balancer is for clients that "need to reach your
application from the internet", an internal one for clients "inside of Google
Cloud". Scope (global, regional, cross-region) and layer (Application or
Network) are separate axes, so product names combine all three, such as
"regional internal Application Load Balancer"
([Cloud Load Balancing
overview](https://docs.cloud.google.com/load-balancing/docs/load-balancing-overview)).

Addresses follow the same words. An **internal IP** "cannot be reached from the
internet"; an **external IP** is "reachable by any host on the internet"
([IP addresses](https://docs.cloud.google.com/vpc/docs/ip-addresses)).
"Private" names connectivity products instead: Private Google Access, Private
Service Connect and private services access
([Private access
options](https://docs.cloud.google.com/vpc/docs/private-access-options)).

Cloud Run ingress takes `all`, `internal` or
`internal-and-cloud-load-balancing`. The last one admits internet traffic only
through the external Application Load Balancer, so Cloud Armor, IAP and CDN
apply to every public request
([Restrict network ingress for Cloud
Run](https://docs.cloud.google.com/run/docs/securing/ingress)).

On GKE, a `LoadBalancer` Service becomes internal with the annotation
`networking.gke.io/load-balancer-type: "Internal"`
([About LoadBalancer
Services](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/service-load-balancer)).
Gateway classes carry the same vocabulary: `gke-l7-global-external-managed`,
`gke-l7-regional-external-managed`, `gke-l7-rilb` and
`gke-l7-cross-regional-internal-managed-mc`
([About Gateway
API](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/gateway-api)).
The control plane is the exception: it has a **private endpoint** and an
optional **public endpoint**, which Google advises enabling "only if you
require external administrative access"
([Private cluster
concepts](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/legacy/network-isolation)).

## Identity

Network reach and identity are separate settings. On Cloud Run, "IAM
authentication still applies to requests reaching the service ... from any of
the preceding network ingress paths"
([Restrict network ingress for Cloud
Run](https://docs.cloud.google.com/run/docs/securing/ingress)), and public
access means granting `allUsers` the `roles/run.invoker` role.

Staff tools sit behind Identity-Aware Proxy, which "lets you establish a
central authorization layer for applications accessed by HTTPS, so you can
use an application-level access control model instead of relying on
network-level firewalls"
([Identity-Aware Proxy
overview](https://docs.cloud.google.com/iap/docs/concepts-overview)).

## Health checks

GKE Ingress builds its load balancer health check outside the cluster and
derives the path and port from the Pod's `readinessProbe`
([Troubleshooting Ingress health
checks](https://docs.cloud.google.com/kubernetes-engine/docs/troubleshooting/ingress-health-checks)).
GKE Gateway does not: it requests `/` unless a `HealthCheckPolicy` says
otherwise
([Configure Gateway
resources](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/configure-gateway-resources)).

Load balancer health checks come from `35.191.0.0/16` and `130.211.0.0/22`
([Firewall rules for health
checks](https://docs.cloud.google.com/load-balancing/docs/firewall-rules)).
For backend services that use gRPC, Google says to "use only gRPC or TCP
health checks. Don't use HTTP(S) or HTTP/2 health checks"
([Health checks
overview](https://docs.cloud.google.com/load-balancing/docs/health-check-concepts)).

Cloud Run supports startup probes over HTTP, TCP and gRPC, and liveness probes
over HTTP and gRPC
([Configure container health
checks](https://docs.cloud.google.com/run/docs/configuring/healthchecks)). It
reserves paths starting with `/_ah/` and "some paths ending with `z`", and
recommends "avoiding all paths that end in z"
([Cloud Run known issues](https://docs.cloud.google.com/run/docs/issues)).
