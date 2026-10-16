# AWS: Amazon ECR

Verified against primary documentation on 2026-10-16.

## Repository names

A private repository name "may be specified on its own (such as
`nginx-web-app`) or it can be prepended with a namespace" such as
`project-a/nginx-web-app`. The API enforces a length of 2 to 256 characters and
this pattern
([CreateRepository](https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_CreateRepository.html)):

```txt
[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*(\/[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*)*
```

So each `/`-separated segment is lowercase letters and digits joined by single
`.`, `_`, `__` or runs of `-`, and it cannot start or end with a separator.
Nesting with `/` has no stated depth limit beyond the total length, and "using
a double forward slash isn't supported"
([Creating a private
repository](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-create.html)).
The same page says the name "must start with a letter", but the API pattern
accepts a leading digit. The two disagree and this file does not settle which
one the service enforces.

The registry host is `<aws_account_id>.dkr.ecr.<region>.amazonaws.com`, and a
push reference is that host followed by the repository name and tag, as in
`docker push aws_account_id.dkr.ecr.region.amazonaws.com/prefix/my-new-repository:tag`
(same page). The repository name is the whole path after the host, so
`images/shop/api` and `wasm-components/acme/greeter` are both valid names.

A Helm chart is pushed with `helm push <chart>.tgz oci://<host>/`, and the
repository must already exist with "the name you used when creating the Helm
chart"
([Pushing a Helm
chart](https://docs.aws.amazon.com/AmazonECR/latest/userguide/push-oci-artifact.html)).
The documented example pushes to the bare host and so names the repository
after the chart alone. Pushing to `oci://<host>/charts/<system>` and letting Helm
append the chart name gives the repository `charts/<system>/<name>`. The ECR page does not
show that form, so it rests on Helm's behavior, not on AWS documentation.

## Creating repositories

Without a matching template, a push to a repository that does not exist fails:
"When there isn't a repository creation template that matches the target
repository for an image push, Amazon ECR will not create a repository with
default settings"
([Repository creation
templates](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-creation-templates.html)).
With a template, a push "will automatically create the repository for you using
the predefined settings of your repository creation template".

A template has an `appliedFor` list of `PULL_THROUGH_CACHE`, `CREATE_ON_PUSH`
and `REPLICATION`, and a `prefix`. Matching works on the namespace:

- A prefix of `prod/team` applies to repositories beginning with `prod/team/`.
  "There is always an assumed `/` applied to the end of the prefix."
- When two templates match, the longer one wins: with `prod` and `prod/team`,
  the `prod/team` template applies to names starting with `prod/team/`.
- `ROOT` as the prefix applies "to all repositories in your registry that don't
  have an associated creation template".
- A template prefix may be up to 256 characters
  ([CreateRepositoryCreationTemplate](https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_CreateRepositoryCreationTemplate.html)).

A template carries tag mutability and its exclusion filters, encryption, a
repository policy, a lifecycle policy (up to 30720 characters) and resource
tags. Its settings "are only applied during repository creation and don't have
any effect on existing repositories". Using resource tags or KMS in a template
also needs a repository creation role.

### Pull through cache rules

A rule maps an ECR repository prefix to an upstream registry. Supported
upstreams are Amazon ECR Public, the Kubernetes registry and Quay without
authentication, Docker Hub, Azure Container Registry, GitHub Container
Registry, GitLab Container Registry and Chainguard with a Secrets Manager
secret, and Amazon ECR with an IAM role
([Pull through
cache](https://docs.aws.amazon.com/AmazonECR/latest/userguide/pull-through-cache.html)).
The API names them `ecr`, `ecr-public`, `quay`, `k8s`, `docker-hub`,
`github-container-registry`, `azure-container-registry`,
`gitlab-container-registry` and `chainguard`
([CreatePullThroughCacheRule](https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_CreatePullThroughCacheRule.html)).

- The `ecrRepositoryPrefix` takes the same grammar as a repository name, so it
  may contain `/`, but its length is 2 to 30 characters, not 256. A prefix such
  as `mirrors/docker-hub` fits.
- A rule yields repositories named `<prefix>/<upstream-repository-name>`, for
  example `docker-hub/<upstream-repository-name>`. The API notes "there is
  always an assumed `/`" at the end of the prefix.
- For Docker Hub official images "the `/library` prefix must be included", so
  the pull is `<host>/docker-hub/library/<image>:<tag>`
  ([Pulling with a pull through
  cache](https://docs.aws.amazon.com/AmazonECR/latest/userguide/pull-through-cache-working-pulling.html)).
- Rules are created per Region. A prefix can be a multi-segment path in the API
  pattern. The documentation's examples use single-segment prefixes only, so a
  multi-segment prefix such as `mirrors/docker-hub` is allowed by the pattern
  and not shown in a worked example.
- The repository is created on first pull. Its settings come from a template
  whose prefix matches, and the page says to use "the repository prefix you
  specify during rule creation" as the template prefix. With no template the
  defaults apply: tag immutability off, `AES-256`, no repository or lifecycle
  policy.

Refresh from upstream follows the tag: "For subsequent pull requests of the
cached image with a given tag, Amazon ECR checks the upstream registry for a
new version of the image with that specific tag and attempts to update the
image in your private registry at least once every 24 hours." A pull inside
the 24-hour window is served from the cache without contacting the upstream,
and if the update fails "the last cached image will still be pulled". Template
and rule pages recommend `MUTABLE` for these repositories, since "turning on
image tag immutability for repositories using a pull through cache rule will
prevent Amazon ECR from updating images using the same tag". Pushing directly
into a cache repository "is not a supported pattern".

## Tag immutability

The repository-level setting accepts `MUTABLE`, `IMMUTABLE`,
`IMMUTABLE_WITH_EXCLUSION` and `MUTABLE_WITH_EXCLUSION`
([PutImageTagMutability](https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_PutImageTagMutability.html)).
With immutability on, a push of an existing tag returns
`ImageTagAlreadyExistsException`
([Image tag
mutability](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-tag-mutability.html)).

The console describes the exclusion fields this way. With **Immutable** chosen,
the exclusion box lets you "enable tag updates for a few immutable tags", and
with **Mutable** chosen it lets you "disable tag updates for a few mutable
tags". Both take tag names "or use wildcards (\*) to match multiple similar
tags". The API form of the first case is `IMMUTABLE_WITH_EXCLUSION` plus
`imageTagMutabilityExclusionFilters`, and the page's own CLI example is:

```sh
aws ecr put-image-tag-mutability --repository-name name \
  --image-tag-mutability IMMUTABLE_WITH_EXCLUSION \
  --image-tag-mutability-exclusion-filters filterType=WILDCARD,filter=latest
```

Filter facts
([ImageTagMutabilityExclusionFilter](https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_ImageTagMutabilityExclusionFilter.html)):

- `filterType` has the single value `WILDCARD`.
- `filter` is 1 to 128 characters matching `^[0-9a-zA-Z._*-]{1,128}$`. Letters,
  digits, `.`, `_`, `-` and `*` are allowed, which covers `latest`, `canary`
  and `*.x`.
- A repository, template or update call takes at most 5 filters.
- Filters apply to the whole repository. The documentation says individual tag
  settings "aren't supported", so exemption is by filter only.

Repository creation templates take the same `imageTagMutability` and filter
fields, so a create-on-push template can create repositories already immutable
with the exemptions in place.

The documentation does not say whether `*` matches across `.` or how many
wildcards a filter may hold, so `*.x` matching `1.x` is the natural reading and
not a stated example. A filter such as `*.x` would also match `1.4.x`. It does
not match `1.4.0`. Variant tags such as `latest-debug` are not covered by
`latest` and need a filter of their own, and a broad filter such as `*-debug`
would also exempt `1.4.0-debug`. These two points are inferences from the
filter syntax.

## Lifecycle policies

A policy is a JSON list of rules, each with a unique `rulePriority`, a
`selection` and an `action`
([Lifecycle policy
properties](https://docs.aws.amazon.com/AmazonECR/latest/userguide/lifecycle_policy_parameters.html)).

- `tagStatus` is `tagged`, `untagged` or `any`. `tagged` requires a
  `tagPrefixList` or a `tagPatternList`.
- `tagPatternList` takes strings that "may contain wildcards (`*`)", with "a
  maximum limit of four wildcards (`*`) per string". The page calls it "best
  practice" for tagged images. `prod*` matches `prod`, `prod1` and
  `production-team1`.
- `tagPrefixList` takes plain prefixes, so `prod` matches `prod`, `prod1` and
  so on. It is only valid when no `tagPatternList` is given, and a rule uses
  either list, "but not both"
  ([How lifecycle policies
  work](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html)).
- With several tags in one list, "only the images with all specified tags are
  selected".
- `countType: sinceImagePushed` with `countUnit: days` and a positive
  `countNumber` expires images older than that many days. `0` is not accepted.
  The `action` is `{"type": "expire"}`.
- Rules are all evaluated, then applied by priority, lowest number first.
  "An image that matches the tagging requirements of a rule cannot be expired
  or archived by a rule with a lower priority." A rule with `tagStatus: any`
  must have the highest `rulePriority` value, so it runs last.
- Expiry happens "within 24 hours after they meet the expiration criteria",
  so a policy is not exact to the hour.

Expiring `pr-` builds after N days, taken from the documented syntax
([Examples](https://docs.aws.amazon.com/AmazonECR/latest/userguide/lifecycle_policy_examples.html),
whose age example expires `prod*` images after 14 days):

```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Expire pull request builds",
      "selection": {
        "tagStatus": "tagged",
        "tagPatternList": ["pr-*"],
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 14
      },
      "action": { "type": "expire" }
    }
  ]
}
```

The rule lists one pattern because "only the images with all specified tags
are selected", so `["pr-*", "0.0.0-pr-*"]` would select only images carrying
both tags. Charts live in their own repository and take the same rule with
`0.0.0-pr-*` instead. The documentation's example with `["alpha*", "beta*"]`
shows the all-patterns behavior.

Keeping release images is by exclusion from the match, not by a "keep" action.
A rule selects only images whose tag matches its list, so a rule on `pr-*`
cannot select an image tagged only `1.4.0` or only `<commit>`. To make the
guarantee explicit, a higher-priority rule can select the release pattern with
an `imageCountMoreThan` count above any realistic value, since an image
matched by a higher-priority rule cannot be expired by a lower one. The
documentation states the priority rule but gives no example of this
protect-by-priority use, so that construction is an inference.

Referrers follow their subject: "When reference artifacts are present in a
repository, Amazon ECR lifecycle policies automatically expire or archive those
artifacts within 24 hours of the deletion or archival of the subject image."
Lifecycle policy can also be set in a repository creation template, so created
repositories start with the `pr-` rule in place.

## Signatures and referrers

ECR supports OCI Image and Distribution specification 1.1, including reference
types, in all commercial and GovCloud Regions and in ECR Public
([announcement](https://aws.amazon.com/about-aws/whats-new/2024/06/amazon-ecr-oci-image-distribution-version-1-1),
27 June 2024). Reference artifacts "can be pulled the same way images are
pulled", and per the AWS Open Source blog they live in the same repository as
the subject, appear in `aws ecr describe-images`, and are replicated with it on
push
([Diving into OCI image and distribution 1.1
support](https://aws.amazon.com/blogs/opensource/diving-into-oci-image-and-distribution-1-1-support-in-amazon-ecr/)).
The `ListImageReferrers` API lists the artifacts for a subject digest, and its
documented example response is a Sigstore bundle, with `artifactType`
`application/vnd.dev.sigstore.bundle.v0.3+json` and a predicate type of
`https://sigstore.dev/cosign/sign/v1`
([ListImageReferrers](https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_ListImageReferrers.html)).
That is AWS documentation showing a cosign-produced artifact stored as a
referrer of an ECR image.

Related facts:

- AWS's own signing path is AWS Signer, either managed signing on push or
  manual signing with the Notation CLI. Both "store both your container images
  and the signatures in your private repositories"
  ([Sign images](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-signing.html)).
- "Each signature counts as 1 artifact against the images per repository
  quota."
- Pull through cache repositories carry the upstream's referrers. The cache
  returns them through `ListImageReferrers` and rechecks them upstream at least
  every 6 hours, a shorter window than the 24 hours for the image itself.
- Replication copies referrers with the image. This ADR's rule to copy
  signatures when an artifact moves to another registry still applies to
  registries outside ECR replication.

## Not verified

- A statement in the AWS documentation that names cosign and says it works
  against ECR. The evidence is the Sigstore bundle in the `ListImageReferrers`
  example. How cosign chooses between the referrers API and the legacy `.sig`
  tag depends on the cosign version and its flags, and that is cosign
  documentation, not AWS documentation.
- Whether the `/library` and multi-segment prefix behavior holds for a pull
  through cache prefix of `mirrors/docker-hub`. The API pattern allows it, and
  no AWS page shows it.
- The exact wildcard semantics of an exclusion filter beyond the allowed
  character set and the 5-filter limit.
- Whether a `charts` namespace works with `helm push oci://<host>/charts`. AWS
  documents only the bare-host form.
- Whether a repository name may start with a digit, given the prose and pattern
  disagree.
