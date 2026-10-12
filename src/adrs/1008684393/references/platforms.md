# Platforms and frameworks: exposure and health endpoints

Verified against primary documentation on 2026-10-11.

## Exposure

Platforms aimed at application developers call the inside level **private**:

- Render: a **Private Service** has no public URL and is meant "for internal
  APIs and microservices that should only be accessible to your own
  infrastructure"
  ([Private services](https://render.com/docs/private-services)).
- Railway: **Private Networking** gives every service a `*.railway.internal`
  name, apart from **Public Networking**
  ([Private networking](https://docs.railway.com/reference/private-networking)).
- Fly.io: **private networking** over 6PN addresses and `<app>.internal` names
  ([Private networking](https://fly.io/docs/networking/private-networking/)).
- Knative: the `networking.knative.dev/visibility: cluster-local` label keeps
  a service off the external gateway
  ([Private services](https://knative.dev/docs/serving/services/private-services/)).
- DigitalOcean App Platform: `internal_ports` without an `http_port` keeps a
  component on the private network
  ([Internal routing](https://docs.digitalocean.com/products/app-platform/how-to/manage-internal-routing/)).

Heroku is the exception, with **Internal Routing** for apps in Private Spaces
([Internal routing](https://devcenter.heroku.com/articles/internal-routing)).
OpenShift sets an ingress controller's load balancer `scope` to `External` or
`Internal`
([IngressController
API](https://github.com/openshift/api/blob/master/operator/v1/types_ingresscontroller.go)).

Cloudflare puts staff tools behind Access, enforcing identity at its edge, and
Tunnel, which connects the origin outward so it opens no inbound port
([Secure private web
apps](https://developers.cloudflare.com/cloudflare-one/setup/secure-private-apps/private-web-app)).

## Health endpoints

- GitLab serves `/-/health`, `/-/readiness` and `/-/liveness` on its main port
  ([Health check](https://docs.gitlab.com/administration/monitoring/health_check/)).
- Prometheus serves `/-/healthy` and `/-/ready`, plus `/-/reload` and
  `/-/quit` once `--web.enable-lifecycle` is set
  ([Management API](https://prometheus.io/docs/prometheus/latest/management_api/)).
- Spring Boot Actuator serves `/actuator/health/liveness` and
  `/actuator/health/readiness`, optionally on a separate management port
  ([Kubernetes
  probes](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.kubernetes-probes)).
- Quarkus serves `/q/health/live`, `/q/health/ready` and `/q/health/started`
  ([SmallRye Health](https://quarkus.io/guides/smallrye-health)).

GitLab and Prometheus both reserve `/-/` for operational endpoints, so they
cannot collide with application routes.

## gRPC health protocol

`grpc.health.v1.Health` defines `Check`, `Watch` and `List`. The empty service
name means the health of the whole server; other names are matched exactly,
and the protocol does not mandate a naming scheme
([gRPC health
checking](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)).
`grpc-health-probe` checks it from the command line and predates the
Kubernetes `grpc` probe
([grpc-health-probe](https://github.com/grpc-ecosystem/grpc-health-probe)).
