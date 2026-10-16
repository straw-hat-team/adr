---
id: '6497710059'
title: OCI artifact paths and tags
state: Approved
created: 2026-10-15
tags: [oci, registry, docker, helm, wasm, sigstore, naming]
category: Platform
---

# OCI artifact paths and tags

## Context

[ADR#2078011537](../2078011537/README.md) fixes where container images and
Helm charts live in a repository. This ADR fixes where they, and the Wasm
components and signatures we also publish, live in a registry and how they are
tagged.

We publish to Amazon ECR, GitHub Container Registry and Google Artifact
Registry, and each one takes a different part of the path before we get to
name anything:

- ECR takes only the host, `<account>.dkr.ecr.<region>.amazonaws.com`, and
  needs a repository to exist before a push unless a create-on-push template
  matches its name prefix.
- GitHub Container Registry takes the owner, `ghcr.io/<owner>`, and creates
  packages on push.
- Artifact Registry takes the project and a repository resource,
  `<location>-docker.pkg.dev/<project>/<repository>`, and that repository must
  be created first.

Two artifacts with the same name, such as the `api` image and the `api` chart,
land in the same OCI repository unless something else in the path separates
them. Their tags then collide, since both publish `1.2.0`. Helm also decides
part of the path itself: `helm push` appends the chart name to the reference it
is given, and uses the chart version as the tag.

Tags are the other source of drift. Charts and Wasm components only accept
SemVer, while images had been tagged with SemVer, short SHAs, branch names and
`latest`. ECR and Artifact Registry can both reject a push that moves an
existing tag, and Artifact Registry cannot exempt `latest` from that rule.

## Resolution

### Paths

- You **MUST** publish every image and chart to
  `<registry>/<kind>/<namespace>/<name>`, where `<registry>` is the prefix the
  registry imposes (the ECR host, `ghcr.io/<owner>`, or
  `<location>-docker.pkg.dev/<project>`). Wasm components and mirrors take
  their own path, below.
- You **MUST** use one of these kinds as the first segment after the prefix:

  | Kind              | Artifact                            |
  | ----------------- | ----------------------------------- |
  | `images`          | Container images                    |
  | `charts`          | Helm charts                         |
  | `wasm-components` | Wasm components                     |
  | `mirrors`         | Third-party images we copy or cache |

  In Artifact Registry each kind is a Docker-format repository of that name,
  except `mirrors`, which is a remote repository per upstream named
  `mirrors-<upstream>`. In ECR each kind is the prefix of a create-on-push or
  pull-through cache rule.

- You **MUST** keep a mirrored image under `mirrors/<upstream>/<path>`, where
  `<upstream>` names the source registry (`docker-hub`, `quay`) and `<path>`
  and the tags are the upstream ones, unchanged, such as
  `mirrors/docker-hub/library/postgres:16`. It is not ours to rename, and
  keeping it out of `images/` keeps our builds apart from copies. In Artifact
  Registry the remote repository name takes the place of both segments, so
  the same image is `mirrors-docker-hub/library/postgres:16`.
- A mirror is exempt from the [Tags](#tags) rules. It has no build commit of
  ours, and its tags follow the upstream, so a refresh can move a mirrored
  tag when the upstream moves it
  ([ECR](./references/aws.md#creating-repositories)). Deployments still pin
  it by digest.
- You **MUST** set `<namespace>` to the logical group that builds and ships
  the image or chart together, usually named after the source repository
  that holds them, such as `atlas`. Every image and chart of that group
  shares it, and a registry rule, such as an ECR lifecycle policy or an IAM
  resource pattern, can target the group by prefix. You **MUST NOT** change
  it once published, so a renamed or split repository keeps publishing under
  the namespace it started with. It is not a Kubernetes namespace.
- You **MUST** name an image or chart after the deployable it produces, the
  same `<name>` as its directory under `devops/docker/images/` or
  `devops/helm/charts/`. Push a chart to `oci://<registry>/charts/<namespace>`
  and let Helm append the name.
- You **MUST** publish a Wasm component at
  `<registry>/wasm-components/<namespace>/<package>`, from its WIT package
  `<namespace>:<package>`. In `wkg`, set `oci.registry` to the registry host
  alone and put the rest of the prefix in `oci.namespacePrefix`:
  `wasm-components/` on ECR, `<owner>/wasm-components/` on GitHub Container
  Registry, and `<project>/wasm-components/` on Artifact Registry
  ([wkg metadata](./references/versions.md#wkg-and-the-wasm-component-path)).
  On GitHub Container Registry that turns `acme:greeter` into
  `ghcr.io/<owner>/wasm-components/acme/greeter`.
- You **MUST** keep every name unique within its kind and namespace, because
  nothing else in the path tells two deployables apart.
- You **MUST** write every path segment we name in lowercase `[a-z0-9-]`,
  and **MUST NOT** use `.`, `_` or `__` even where the OCI grammar allows
  them. The upstream path of a mirror is not ours, so it stays as it is.
- You **MUST NOT** put an environment or a team in the path. Every
  environment pulls the same artifact, and the exact source repository is
  linked through `org.opencontainers.image.source`, whatever the namespace.

### Tags

- You **MUST** tag a release with its full version, in one of these schemes,
  picked once per project and kept:

  | Scheme | Form                | Example       |
  | ------ | ------------------- | ------------- |
  | SemVer | `MAJOR.MINOR.PATCH` | `1.4.0`       |
  | CalVer | `YYYY.MDD.N`        | `2026.1015.0` |

  In CalVer, `MDD` is the month followed by the day padded to two digits,
  so 5 April is `405`, and `N` counts the releases of that day from `0`.

- You **MUST NOT** pad the month (`2026.0405.0`), add a `v` prefix, or add
  `+` build metadata. A leading zero, a prefix and build metadata all break
  SemVer, which charts and components require, and Helm rewrites `+` to `_`,
  which turns one version into two different tags. A git tag **MAY** keep
  the `v`, as in `v1.4.0`, and the build drops it from the artifact tag.
- You **MUST NOT** count releases within a day with a prerelease such as
  `2026.1015.0-1`, because SemVer sorts a prerelease below its release.
- You **MUST** tag every published artifact with the full commit SHA it was
  built from, marked by where the build came from, except a released chart or
  component. A digest identifies the bytes but cannot be looked up in git;
  the commit can.

  | Build          | Image tag            | Chart or component tag |
  | -------------- | -------------------- | ---------------------- |
  | Release        | version + `<commit>` | version                |
  | Default branch | `<commit>`           | `0.0.0-sha-<commit>`   |
  | Pull request   | `pr-<commit>`        | `0.0.0-pr-<commit>`    |

  Charts and components only accept SemVer, so their builds that are not a
  release use a prerelease, which sorts below every release. Helm requires a
  chart's tag to equal its version, so a released chart or component carries
  only the version tag and its commit is read from
  `org.opencontainers.image.revision`. The `pr-` mark
  keeps a pull request build from taking the tag of the same commit built
  later on the default branch.

- You **MUST** release an image by adding the version tag to the artifact
  already built for that commit, never by building it again. A rebuild
  produces a new digest, which would either move the commit tag or leave two
  artifacts claiming the same commit.
- You **SHOULD** expire pull request builds after an age the project sets,
  through the registry's cleanup policy matched on the `pr-` and `0.0.0-pr-`
  prefixes, or a scheduled job where the registry has none, as on GitHub
  Container Registry. Artifact Registry cannot delete a tagged artifact from
  a repository with immutable tags, so there immutability wins and pull
  request builds are kept
  ([Artifact Registry](./references/gcp.md#tag-immutability)). You **MUST
  NOT** delete an artifact that carries a release tag.
- You **MUST NOT** move a version or commit tag once it is published.
- You **MUST NOT** publish a tag that moves, such as `latest`, `main`, a
  branch name or a partial version like `1.4`, for an artifact only we deploy.
- You **MAY** add moving tags to an image that others pull, such as an open
  source release, since they expect a pull without a version to work. Only
  these are allowed:

  | Tag         | Points at                               |
  | ----------- | --------------------------------------- |
  | `latest`    | The newest release                      |
  | `<MAJOR>.x` | The newest release of that major, `1.x` |
  | `canary`    | The newest build of the default branch  |

  You **MUST NOT** publish any other moving tag, such as `1`, `1.4` or a
  branch name. Charts and components **MUST NOT** get moving tags at all,
  because their clients resolve version ranges from the SemVer tags
  themselves.

- You **MUST** publish every image as a multi-platform image index, and
  **MUST NOT** put an architecture or operating system in a tag or path. The
  client picks its platform from the index.
- You **MUST** name an image variant, such as a debug or FIPS build, with a
  `-<variant>` suffix on any allowed tag, such as `1.4.0-debug` or
  `latest-debug`, and **MUST NOT** publish it under another name.
- You **MUST** turn on tag immutability wherever the registry offers it. An
  image repository that carries moving tags **MUST** exempt exactly those
  tags and their variants, such as `latest-debug`, which rules out Artifact
  Registry, since it cannot exempt any. On ECR the exemptions are `latest*`,
  `canary*` and `*.x*` ([ECR](./references/aws.md#tag-immutability)).
  GitHub Container Registry has no tag immutability, so there the tag rules
  hold only by convention.
- You **MUST** reference an artifact from a deployment by tag and digest,
  `<name>:<tag>@sha256:<digest>`. The digest is what gets pulled; the tag
  tells a reader which release or commit it is.
- You **MUST** set the `org.opencontainers.image.source` and
  `org.opencontainers.image.revision` annotations, so the artifact itself
  leads back to its repository and commit.

### Signatures, attestations and SBOMs

- You **MUST** store signatures, attestations and SBOMs in the same
  repository as the artifact they describe, attached to its digest. You
  **MUST NOT** publish them under another path or kind.
- You **MUST** copy them with the artifact whenever it moves to another
  registry, with a tool that follows referrers such as `oras copy -r`. A
  plain pull and push copies the artifact and leaves them behind, and
  `cosign copy` is deprecated
  ([signatures](./references/versions.md#signatures)).

  ```txt
  ghcr.io/<owner>
  ├── images/shop/api                     1.4.0, <commit>, pr-<commit>
  ├── charts/shop/api                     1.4.0, 0.0.0-sha-<commit>
  ├── wasm-components/acme/greeter        0.3.0
  └── mirrors/docker-hub/library/postgres 16
  ```

## Links

- [Walkthrough: one service from pull request to production](./references/walkthrough.md)
- [Amazon ECR research](./references/aws.md)
- [Artifact Registry research](./references/gcp.md)
- [GitHub Container Registry research](./references/github.md)
- [Versions and tooling research](./references/versions.md)
- [ADR#2078011537](../2078011537/README.md): Operational assets
- [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/main/spec.md)
- [OCI pre-defined annotation keys](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
- [Helm: Use OCI-based registries](https://helm.sh/docs/topics/registries/)
- [Amazon ECR repository creation templates](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-creation-templates.html)
- [Amazon ECR image tag mutability](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-tag-mutability.html)
- [Artifact Registry repository and image names](https://cloud.google.com/artifact-registry/docs/docker/names)
- [Working with the GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [wasm-pkg-tools registry metadata](https://github.com/bytecodealliance/wasm-pkg-tools/blob/main/docs/registry-metadata.md)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [Calendar Versioning](https://calver.org/)
- [OCI image index](https://github.com/opencontainers/image-spec/blob/main/image-index.md)
