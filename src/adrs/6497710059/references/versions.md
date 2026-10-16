# Versions and tooling

Verified against primary documentation on 2026-10-16.

## The `v` prefix

The Semantic Versioning FAQ answers "Is v1.2.3 a semantic version?" with "No,
'v1.2.3' is not a semantic version." It adds that prefixing a version with a
"v" is "a common way (in English) to indicate it is a version number"
([Semantic Versioning 2.0.0](https://semver.org/)). The SemVer grammar has no
place for the prefix, so a tag that must be SemVer cannot carry it.

The OCI distribution spec allows it anyway. A tag must match
`[a-zA-Z0-9_][a-zA-Z0-9._-]{0,127}` and be at most 128 characters
([OCI Distribution
Specification](https://github.com/opencontainers/distribution-spec/blob/main/spec.md)).
The grammar admits `v1.4.0` and `1.4.0` equally, so it does not decide the
question. It also excludes `+`, which is why Helm rewrites it (see below).

Go modules are the reason git tags keep the prefix: "Each version starts with
the letter `v`, followed by a semantic version", and a non-canonical version
such as `master` is an error outside the main module's `go.mod`
([Go Modules Reference](https://go.dev/ref/mod)). The `go` command reads
versions from VCS tags, so a Go module published from git needs `v1.4.0` there.

What common projects do, read from the registries on 2026-10-16 with `crane ls`
and the Docker Hub API:

| Artifact                                         | Tag form                  | `v` |
| ------------------------------------------------ | ------------------------- | --- |
| `docker.io/library/postgres`                     | `14.24`, `16.15`          | no  |
| `docker.io/library/nginx`                        | `1.31.7`, `1.30.6`        | no  |
| `docker.io/prom/prometheus`                      | `v3.13.4`, `v3.15.0`      | yes |
| `quay.io/prometheus/prometheus`                  | `v3.9.1`, `v3-busybox`    | yes |
| `registry.k8s.io/kube-apiserver`                 | `v1.9.9`, `v1.9.9-beta.0` | yes |
| `registry.k8s.io/pause`                          | `3.9`                     | no  |
| `ghcr.io/prometheus-community/charts/prometheus` | `29.36.2`, `29.37.0`      | no  |
| `registry-1.docker.io/bitnamicharts/nginx`       | `25.2.5`                  | no  |
| `ghcr.io/webassembly/wasi/http` (Wasm)           | `0.3.0`, `0.3.2`          | no  |

No `v`-prefixed tag exists in the postgres or nginx repositories, and none in
the Prometheus chart repository. The `v` in Prometheus and Kubernetes images
matches their git tags, so those projects publish the git tag name as the
image tag. Charts and Wasm components carry no prefix because Helm and the
`wasm-pkg-tools` registry docs require SemVer tags (see below).

The practice is split, and no registry rule favors either side. The ADR choice
follows from the constraints that do exist: charts and components cannot take
a `v`, so dropping it everywhere gives one tag form for every kind. A git tag
may keep `v1.4.0` for Go and for habit, and the build strips it.

## Helm and OCI

Helm's chart documentation says a chart version "should follow the SemVer 2
standard but it is not strictly enforced", while "non-SemVer names are
explicitly disallowed by the system"
([Charts](https://helm.sh/docs/topics/charts/)). Versions such as `1.2` are
coerced into valid SemVer. The ADR wording that charts require SemVer holds,
with the caveat that Helm's own text calls full SemVer 2 "not strictly
enforced".

On OCI, "the registry reference basename is inferred from the chart's name, and
the tag is inferred from the chart's semantic version". The reference given to
`helm push` "must not contain the basename or tag", so
`helm push api-1.4.0.tgz oci://<registry>/charts` pushes to
`<registry>/charts/api:1.4.0`
([Use OCI-based registries](https://helm.sh/docs/topics/registries/)).

Plus signs in versions are rewritten. The Helm source says "OCI artifact
references (e.g. tags) do not support the plus sign (+)", so Helm changes
"plus (+) to an underscore (_) in chart version tags when pushing to a registry
and back to a plus (+) when pulling"
([`pkg/registry/client.go`](https://github.com/helm/helm/blob/main/pkg/registry/client.go)).
The conversion is `strings.ReplaceAll(tag, "+", "_")` in
[`pkg/registry/reference.go`](https://github.com/helm/helm/blob/main/pkg/registry/reference.go),
and the reverse runs when Helm lists tags. Helm's `helm.sh/docs` pages fetched
for this reference did not show the same sentence, so the source code is the
primary evidence here. Tools that do not follow the convention break on such
tags, which is one more reason the ADR forbids build metadata.

## CalVer `YYYY.MDD.N`

calver.org says "unpadded is the sensible default" and that zero-padding "makes
the most sense when versions will commonly live in filenames". On SemVer it
says "Padding is problematic in a lot of systems, because a padded segment is
invalid" under SemVer, which "MUST NOT contain leading zeroes", and "Cargo and
Go both enforce strict SemVer, so definitely don't pad there"
([Calendar Versioning](https://calver.org/)). It also deprecates the doubled
`MM` and `DD` spellings in favor of `M`, `D`, `0M` and `0D`.

The SemVer rule applies to numeric identifiers: each of the major, minor and
patch parts is `0` or a nonzero digit followed by digits
([Semantic Versioning 2.0.0](https://semver.org/)). The ADR's `MDD` joins the
month and a two-digit day into one number:

- 15 October is `10` and `15`, giving `1015`, which starts with `1`.
  `2026.1015.0` is valid SemVer.
- 5 April is `4` and `05`, giving `405`. The minor part is `405`, valid.
  Padding the month to `0405` makes a leading zero, so `2026.0405.0` is not
  valid SemVer.
- 1 January is `101`, and 31 December is `1231`. No month and day pair joined
  this way starts with `0`, because the month is unpadded.

The ADR's `YYYY.MDD.N` is a SemVer-safe variant of calver.org's padded
`YYYY.0M0D` forms. The calver.org page does not name `MDD` as a scheme, so the
joined form is the ADR's own convention, built from `M` and `0D`.

## docker/metadata-action

The `type=semver` source needs a valid SemVer git tag. Its `pattern`
expressions are `{{version}}` (shorthand for `{{major}}.{{minor}}.{{patch}}`,
pre-release included), `{{raw}}`, `{{major}}`, `{{minor}}` and `{{patch}}`.
The documented example table for the git tag `v1.2.3`:

| Pattern               | Result   |
| --------------------- | -------- |
| `{{raw}}`             | `v1.2.3` |
| `{{version}}`         | `1.2.3`  |
| `{{major}}.{{minor}}` | `1.2`    |
| `v{{major}}`          | `v1`     |

So `{{version}}` drops the `v` and `{{raw}}` keeps it. Literal text in a
pattern is kept, as `v{{major}}` shows, so `{{major}}.x` yields `1.x`. The
README has no `.x` example, so that result is inferred from the template rules
and should be run once before relying on it. A pre-release tag extends
`{{version}}` and `{{raw}}` only: for `v2.0.8-beta.67`, `{{major}}` yields
`2.0.8-beta.67`, not `2`
([docker/metadata-action](https://github.com/docker/metadata-action)).

The `type=sha` source defaults to `format=short` and `prefix=sha-`, giving
`sha-860c190`. The short SHA is 7 characters unless
`DOCKER_METADATA_SHORT_SHA_LENGTH` says otherwise. `format=long` gives the full
commit SHA, and `prefix=` with an empty value removes the `sha-` mark.

```yaml
- id: meta
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/${{ github.repository_owner }}/images/api
    tags: |
      type=semver,pattern={{version}}
      type=semver,pattern={{major}}.x
      type=sha,format=long,prefix=
```

In this ADR a release adds a tag to the image already built for the commit and
never rebuilds it, so metadata-action does not push anything here. It only
computes the tag names, and the push of the version tag is a registry-side
retag. go-containerregistry documents the command as `crane tag IMG TAG`: "Tag
remote image without downloading it", and the tag argument is only the tag, not
the full repository
([crane tag](https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane_tag.md)).
The documented equivalence is `crane cp registry.example.com/library/ubuntu:v0
registry.example.com/library/ubuntu:v1` and `crane tag
registry.example.com/library/ubuntu:v0 v1`. A release then reads:

```sh
crane tag ghcr.io/<owner>/images/api:<commit> "${GITHUB_REF_NAME#v}"
```

For a chart, the version comes from the git tag by the same shell expansion,
which removes a leading `v` and leaves a name without one unchanged:

```sh
helm package devops/helm/charts/api --version "${GITHUB_REF_NAME#v}"
```

## wkg and the Wasm component path

The wasm-pkg-tools registry metadata document describes one `oci` block per
registry, with a `registry` host and a `namespacePrefix`, default empty:

```json
{
  "preferredProtocol": "oci",
  "oci": { "registry": "ghcr.io", "namespacePrefix": "webassembly/" }
}
```

The documented reference is `ghcr.io/webassembly/$NAMESPACE/$PACKAGE:$VERSION`,
for example `wasi:http` at `0.2.1` becoming `ghcr.io/webassembly/wasi/http:0.2.1`
([registry
metadata](https://github.com/bytecodealliance/wasm-pkg-tools/blob/main/docs/registry-metadata.md)).
Older configuration spells the keys `ociRegistry` and `ociNamespacePrefix`, and
they are deprecated. Tags must be valid SemVer, and tooling ignores others when
pulling.

The `ghcr.io/webassembly/wasi/http` repository exists with tags such as `0.3.2`,
which matches the documented shape.

What this supports for the ADR: `registry` holds the host alone, as in the
`ghcr.io` example, so the owner or project belongs in `namespacePrefix`.
`<owner>/wasm-components/` on GitHub Container Registry,
`<project>/wasm-components/` on Artifact Registry and `wasm-components/` on
ECR all yield `<registry>/wasm-components/<namespace>/<package>`. The prefix is joined
directly to the namespace, so the trailing slash in `wasm-components/` matters.
The metadata document describes the prefix in the registry's discovery file
(`/.well-known/wasm-pkg/registry.json`). This reference did not verify how the
`wkg` client's own configuration file maps a namespace to a registry and whether
it accepts the same `namespacePrefix` key for a registry we run ourselves.
Treat the configuration step in the ADR as confirmed for the metadata format
and unconfirmed for the exact `wkg` configuration file syntax, and check it
against `wkg config` before the ADR moves past Draft.

## Signatures

Signatures, attestations and SBOMs live next to the artifact in the same
repository, so a copy that moves only the image manifest leaves them behind.
Cosign stores a signature as a tag named from the digest: the
`registry.k8s.io/pause` repository lists tags of the form `sha256-<digest>.sig`
beside its version tags. A tag listing of any signed repository shows them, and
a tool that copies one tag does not copy them.

`cosign copy` is "Copy the supplied container image and signatures", and its
documented examples copy the image with its signatures, or only parts with
`--only=sig,att,sbom`
([`copy.go`](https://github.com/sigstore/cosign/blob/main/cmd/cosign/cli/copy.go)).
The same source marks the command deprecated and points to alternatives:
"`oras copy -r` will copy images and referring artifacts", `cosign save` and
`cosign load`, or `cosign download` followed by `cosign attach`. The ADR
requires copying signatures with the artifact but names no tool, and that holds.
A deployment guide should name `oras copy -r` first, whose help describes the
recursive flag as copying "the artifact and its referrer artifacts"
([`oras cp`](https://github.com/oras-project/oras/blob/main/cmd/oras/root/cp.go)).
It is marked preview in the source. Signatures stored as OCI 1.1 referrers and
as legacy `.sig` tags are different storage, so check which one the signer
produces before choosing the copy tool.

`crane copy` is described as "Efficiently copy a remote image from src to dst
while retaining the digest value"
([crane copy](https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane_copy.md)).
Its documentation mentions the image only. It makes no claim to copy
signatures or attestations, so the ADR statement that a plain pull and push
leaves them behind is consistent with it.
