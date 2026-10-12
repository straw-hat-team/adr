# Ports: one per audience

Verified against primary documentation and source on 2026-10-12.

## What a port separates

A port is the finest thing the network can tell apart. Kubernetes
NetworkPolicy controls "traffic flow at the IP address or port level (OSI
layer 3 or 4)" and has no way to match an HTTP path
([Network
Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)).
Services and load balancer target groups also select ports, not paths. Edge
routes do match paths, at layer 7, but only for traffic already admitted to
the port they point at, and the pod cannot tell which route a request came
through.

So a port is where one audience can be admitted and another refused. Two
protocols spoken by the same audience gain nothing from separate ports: every
caller allowed on one is allowed on the other, so the network enforces nothing
new, and each extra port is one more Service port, route, NetworkPolicy rule,
probe and load balancer health check to keep in step.

## gRPC is an HTTP/2 path

gRPC is defined entirely as HTTP/2 framing. A call is an HTTP/2 request whose
path is `"/" Service-Name "/" {method name}`, whose `content-type` is
`application/grpc` with an optional suffix such as `+proto`, and whose result
travels in a `grpc-status` trailer
([gRPC over
HTTP2](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md)).

Connect uses the same procedure paths. "Bidirectional streaming requires
HTTP/2, but the other RPC types also support HTTP/1.1"; unary calls use
`application/proto` or `application/json`, and streaming calls use
`application/connect+proto` or `application/connect+json`
([Connect protocol](https://connectrpc.com/docs/protocol/)). "By default,
connect-go servers support ingress from all three protocols", meaning Connect,
gRPC and gRPC-Web, on the same handler
([Getting started](https://connectrpc.com/docs/go/getting-started)).

A server therefore tells requests on one port apart by path and content type:

| Request              | Path                            | Content type                  | HTTP     |
| -------------------- | ------------------------------- | ----------------------------- | -------- |
| gRPC                 | `/acme.billing.v1.Invoices/Get` | `application/grpc`            | 2        |
| Connect unary        | `/acme.billing.v1.Invoices/Get` | `application/proto` or `json` | 1.1 or 2 |
| gRPC health          | `/grpc.health.v1.Health/Check`  | `application/grpc`            | 2        |
| Kubernetes `httpGet` | `/-/readiness`                  | none                          | 1.1      |
| Other routes         | Anything else, such as `/mcp`   | Defined by the route          | 1.1 or 2 |

Google's own APIs serve gRPC and REST/JSON this way, on one host and port
([Google Cloud research](./gcp.md#one-endpoint-for-grpc-and-rest)).

## HTTP/1.1 and HTTP/2 on one port

Over TLS, the client and server agree on the version through ALPN during the
handshake. Without TLS, HTTP/2 starts "with prior knowledge"
([RFC 9113, section
3.3](https://www.rfc-editor.org/rfc/rfc9113#section-3.3)): the client sends the
HTTP/2 preface at once, which an HTTP/1.1 request never starts with, so one
listener can accept both.

- Go: since 1.24, "the server can accept both HTTP/1 and unencrypted HTTP/2 on
  the same port" when `Server.Protocols` includes `UnencryptedHTTP2`. The
  `Upgrade: h2c` header is not supported
  ([Go 1.24 release notes](https://go.dev/doc/go1.24)). The older
  `golang.org/x/net/http2/h2c` `NewHandler` is deprecated in its favor
  ([h2c](https://pkg.go.dev/golang.org/x/net/http2/h2c)).
- Envoy: an HTTP connection manager with `codec_type: AUTO` picks the codec per
  connection and "supports both ALPN for TLS listeners as well as protocol
  inference for plaintext listeners"
  ([HTTP connection
  manager](https://www.envoyproxy.io/docs/envoy/latest/api-v3/extensions/filters/network/http_connection_manager/v3/http_connection_manager.proto)).
  A route can match gRPC alone with `grpc: {}`, which checks for an
  `application/grpc` content type
  ([Route
  components](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/route/v3/route_components.proto)).
- Kubernetes: a Service port that speaks prior-knowledge HTTP/2 without TLS
  declares `appProtocol: kubernetes.io/h2c`, a standard value since 1.27
  ([KEP-3726](https://www.k8s.dev/resources/keps/3726/)).

## Load balancers and proxies

Every load balancer below can send gRPC and other routes to one port. They
differ in whether one backend definition carries both.

### AWS Application Load Balancer

No single target group protocol version accepts both HTTP/1.1 clients and
gRPC, so the listener forwards to two target groups that point at the same
port. A listener rule with a path condition routes "based on the URL in the
request"
([Condition types for listener
rules](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/rule-condition-types.html)),
so the gRPC service paths go to a gRPC target group and everything else to an
HTTP/1.1 one. For the gRPC protocol version, "the only supported listener
protocol is HTTPS" and "the only supported action type for listener rules is
forward"
([Target groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html)).
The full protocol table and health check defaults are in the
[AWS research](./aws.md#one-port-for-grpc-and-http).

### Google Cloud Application Load Balancer

One backend service carries both: `HTTP2` for a TLS port, or `H2C` for a
plaintext one, which classic Application Load Balancers do not support. The gRPC backend
protocol belongs to Cloud Service Mesh
([Google Cloud research](./gcp.md#one-port-for-grpc-and-http)).

### Gateway API

"gRPC traffic can be routed with either HTTPRoute or GRPCRoute", and "for
basic gRPC load balancing, GRPCRoute is not technically required because
HTTPRoute can do it". GRPCRoute has been in the Standard Channel since v1.1.0.
Implementations "may reject" a GRPCRoute whose hostnames overlap an HTTPRoute
on the same listener
([GRPCRoute](https://gateway-api.sigs.k8s.io/reference/api-types/grpcroute/)),
so a port that serves both on one hostname is safest behind a single
HTTPRoute with a `/` prefix, which is what the ADR prescribes for the edge.

Application Gateway for Containers, Azure's Gateway API implementation,
configures gRPC only through GRPCRoute, with "no support ... for gRPC in
Ingress API"
([gRPC with Application Gateway for
Containers](https://learn.microsoft.com/azure/application-gateway/for-containers/grpc)).
There, gRPC on a shared hostname depends on how that implementation treats the
overlap.

### Istio

Istio reads a port's protocol from `appProtocol` or from a name prefix such as
`http2-` or `grpc-`, and "if both are defined, appProtocol takes precedence
over the port name". Ports named `public` and `private` carry no protocol
prefix, so without `appProtocol` Istio tries to detect HTTP and HTTP/2, and "if
the protocol cannot automatically be determined, traffic will be treated as
plain TCP traffic"
([Protocol
selection](https://istio.io/latest/docs/ops/configuration/traffic-management/protocol-selection/)).

## Probes on a shared port

- `httpGet` probes accept a named port, so they can target `private` or
  `public` directly. With `scheme: HTTPS` "the kubelet sends an HTTPS request
  skipping the certificate verification"
  ([Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)).
- `grpc` probes take a port number only: "you cannot specify the health check
  port by name". They connect in plaintext unless the `GRPCContainerProbeTLS`
  feature gate, alpha and off by default since 1.37, is enabled and `mode` is
  set to `TLS`
  ([Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/);
  [feature
  gates](https://github.com/kubernetes/kubernetes/blob/master/pkg/features/kube_features.go)).

These are why the ADR defaults to `httpGet` against `/-/readiness` and
`/-/liveness` on the shared port, and keeps `grpc` probes for plaintext
gRPC-only ports.
