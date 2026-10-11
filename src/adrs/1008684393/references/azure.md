# Azure: exposure and health checks

Verified against primary documentation on 2026-10-11.

## Exposure

Azure Load Balancer is **public** or **internal**, decided by whether its
frontend IP is public or private; an internal load balancer "can't accept
incoming traffic from the internet"
([How Azure Load Balancer
works](https://learn.microsoft.com/training/modules/intro-to-azure-load-balancer/3-how-azure-load-balancer-works)).
Application Gateway has a public frontend IP, a private one or both; Microsoft
describes the private frontend as "useful for internal line-of-business
applications that aren't exposed to the internet"
([Frontend IP
configuration](https://learn.microsoft.com/azure/application-gateway/configuration-frontend-ip)).

On AKS, a `LoadBalancer` Service becomes internal with
`service.beta.kubernetes.io/azure-load-balancer-internal: "true"`
([Internal load
balancer](https://learn.microsoft.com/azure/aks/internal-lb)), and a **private
cluster** keeps the API server on Private Link
([Private
clusters](https://learn.microsoft.com/azure/aks/private-clusters)).

Container Apps ingress is **external**, shown as "Accepting traffic from
anywhere", or **internal**, shown as "Limited to Container Apps Environment".
Both are relative to the environment: an **internal environment** has no
public endpoint, so an app with external ingress inside it is still not on the
internet
([Ingress](https://learn.microsoft.com/azure/container-apps/ingress-overview);
[Networking](https://learn.microsoft.com/azure/container-apps/networking)).
The app declares its audience and the environment decides whether that
audience includes the internet.

Azure is not consistent between the words: "internal" usually labels who can
reach something, "private" usually labels an IP or Private Link, and no page
defines them as distinct levels.

## Identity

Microsoft's Zero Trust guidance moves access control "away from the perimeter
and closer to applications and resources", based on identity and device
rather than network location
([Zero Trust
overview](https://learn.microsoft.com/security/zero-trust/zero-trust-overview)).
App Service authentication and managed identities provide that identity to
users and workloads
([Authentication and
authorization](https://learn.microsoft.com/azure/app-service/overview-authentication-authorization);
[Managed
identities](https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview)).

Staff tools sit behind Entra Application Proxy, whose connector only makes
outbound connections
([Application
Proxy](https://learn.microsoft.com/entra/identity/app-proxy/overview-what-is-app-proxy)),
with Privileged Identity Management for just-in-time elevation
([PIM](https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-getting-started)).

## Health checks

Container Apps supports startup, liveness and readiness probes over HTTP or
TCP, and adds default probes when ingress is enabled and none are defined
([Health
probes](https://learn.microsoft.com/azure/container-apps/health-probes)).

App Service health check requests one configured path on every instance each
minute and removes an instance from the load balancer after repeated failures
([Health
check](https://learn.microsoft.com/azure/app-service/monitor-instances-health-check)).

Load Balancer probes come from `168.63.129.16`, which network security groups
must not block
([Manage health
probes](https://learn.microsoft.com/azure/load-balancer/manage-probes-how-to)).
The Application Gateway Ingress Controller derives its probe from the Pod's
`readinessProbe` or `livenessProbe` and falls back to `/`
([Health probes with
AGIC](https://learn.microsoft.com/azure/application-gateway/ingress-controller-add-health-probes)).

Microsoft documents the Health Endpoint Monitoring pattern but prescribes no
path names
([Health Endpoint
Monitoring](https://learn.microsoft.com/azure/architecture/patterns/health-endpoint-monitoring)).
