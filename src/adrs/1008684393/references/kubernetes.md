# Kubernetes: exposure and probes

Verified against primary documentation and source on 2026-10-11.

## Exposure

Service types are `ClusterIP`, `NodePort`, `LoadBalancer` and `ExternalName`
([Service](https://kubernetes.io/docs/concepts/services-networking/service/)).
Routing policy is split by where traffic starts: `externalTrafficPolicy` for
traffic from outside the cluster and `internalTrafficPolicy` for traffic from
inside it
([Service internal traffic
policy](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/)).

Gateway API names roles rather than exposure levels: the Infrastructure
Provider owns `GatewayClass`, the Cluster Operator owns `Gateway` and its
listeners, and the Application Developer attaches routes to them
([Roles and
personas](https://gateway-api.sigs.k8s.io/docs/concepts/roles-and-personas/)).

## Probes

The kubelet requests whatever path a probe names. An `httpGet` probe passes on
any status from 200 to 399. The `grpc` probe, generally available since 1.27,
calls `grpc.health.v1` `Check` with an optional service name over HTTP/2
without TLS
([KEP-2727](https://www.kubernetes.dev/resources/keps/2727/)). TLS needs the
`GRPCContainerProbeTLS` feature gate, alpha and off by default since 1.37
([Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)).

The API server serves `/livez` and `/readyz`. `/healthz` has been deprecated
since 1.16 because one endpoint could not say whether the server should be
restarted or only taken out of rotation. Each check also has its own path,
such as `/readyz/etcd`; `?verbose` lists them for people, and `?exclude=`
skips one
([Kubernetes API health
endpoints](https://kubernetes.io/docs/reference/using-api/health-checks/)).

kubeadm writes these probes for the control plane
([controlplane/manifests.go](https://github.com/kubernetes/kubernetes/blob/master/cmd/kubeadm/app/phases/controlplane/manifests.go);
[etcd/local.go](https://github.com/kubernetes/kubernetes/blob/master/cmd/kubeadm/app/phases/etcd/local.go)):

| Component               | Startup    | Liveness   | Readiness |
| ----------------------- | ---------- | ---------- | --------- |
| kube-apiserver          | `/livez`   | `/livez`   | `/readyz` |
| kube-scheduler          | `/livez`   | `/livez`   | `/readyz` |
| kube-controller-manager | `/healthz` | `/healthz` | none      |
| etcd                    | `/readyz`  | `/livez`   | `/readyz` |

No component has a startup endpoint. The startup probe reuses another
endpoint with a longer budget, and liveness uses a higher `failureThreshold`
than readiness.

Components also serve `/statusz` and `/flagz` for debugging
([KEP-4827](https://www.kubernetes.dev/resources/keps/4827/);
[KEP-4828](https://www.kubernetes.dev/resources/keps/4828/)).

## Service meshes

Istio rewrites a Pod's probes to its sidecar agent, on port 15020, because the
kubelet cannot present a mesh client certificate once mutual TLS is strict
([Health checking of Istio
services](https://istio.io/latest/docs/ops/configuration/mesh/app-health-check/)).
