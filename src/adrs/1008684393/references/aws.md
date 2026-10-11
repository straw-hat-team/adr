# AWS: exposure and health checks

Verified against primary documentation on 2026-10-11.

## Exposure

Load balancers have a **scheme** of `internet-facing` or `internal`. The nodes
of an internet-facing load balancer have public IP addresses; the nodes of an
internal one "have only private IP addresses" and "can only route requests
from clients with access to the VPC". AWS gives multi-tier applications as the
reason: web servers face the internet, database servers only the web servers
([Internal load
balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/elb-internal-load-balancers.html)).

Subnets are **public** when their route table sends internet traffic to an
internet gateway and **private** when it does not
([Internet
gateways](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)).

On EKS, the AWS Load Balancer Controller takes the same values through
`alb.ingress.kubernetes.io/scheme` and
`service.beta.kubernetes.io/aws-load-balancer-scheme`
([Load Balancer Controller
annotations](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/service/annotations/)).
The cluster API server endpoint is **public**, **private** or both
([Cluster API server
endpoint](https://docs.aws.amazon.com/eks/latest/userguide/cluster-endpoint.html)).

API Gateway endpoints are edge-optimized, Regional or private, chosen by
"where the majority of your API traffic originates from"
([API endpoint
types](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-endpoint-types.html)).
App Runner services have a **public endpoint** or a **private endpoint**
reached through a VPC Ingress Connection
([Enabling private
endpoints](https://docs.aws.amazon.com/apprunner/latest/dg/network-pl.html)).

## Identity

Network reach and identity are separate settings. Lambda function URLs take an
auth type of `AWS_IAM` or `NONE`
([Function URL
auth](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html)). VPC
Lattice groups services into a **service network** for reach and attaches
**auth policies** for identity, denying all traffic once auth is on and no
policy allows it
([Auth
policies](https://docs.aws.amazon.com/vpc-lattice/latest/ug/auth-policies.html)).

Staff tools sit behind AWS Verified Access, whose controls "do not depend on
traditional network controls or network perimeters"
([How Verified Access
works](https://docs.aws.amazon.com/verified-access/latest/ug/how-it-works.html)).

## Health checks

Target group health checks request `/` and expect `200` by default. For gRPC
targets the default success code is `12`, `UNIMPLEMENTED`, so a service that
does not implement the gRPC health protocol still passes; a service that does
should expect `0`
([Target group health
checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)).

The load balancer runs its own check and does not read the Pod's
`readinessProbe`. Pod readiness gates, enabled with the
`elbv2.k8s.aws/pod-readiness-gate-inject` namespace label, hold a Pod not ready
until the load balancer reports it healthy, so a rollout does not remove old
Pods before new ones receive traffic. AWS recommends load balancer health
checks alongside Kubernetes probes, not in place of them
([EKS best practices: load
balancing](https://docs.aws.amazon.com/eks/latest/best-practices/load-balancing.html)).

The same guide says not to make liveness depend on anything outside the Pod,
and warns that "readiness probes that depend on external factors, such as
connectivity to a database, can cause all pods to fail the probe", leading to
an outage or a cascading failure. AWS also advises against giving liveness and
readiness the same specification
([Probes and
checks](https://docs.aws.amazon.com/prescriptive-guidance/latest/ha-resiliency-amazon-eks-apps/probes-checks.html)).
