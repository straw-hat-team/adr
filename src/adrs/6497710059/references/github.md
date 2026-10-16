# GitHub: Container Registry

Verified against primary documentation on 2026-10-16.

Where the documentation is silent, the fact below was observed with read-only,
anonymous calls to `ghcr.io` and is marked as observed, not documented.

## Names

The documented push form is `docker push ghcr.io/NAMESPACE/IMAGE_NAME:latest`,
where `NAMESPACE` is "the name of the personal account or organization to which
you want the image to be scoped"
([Working with the Container
registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)).
The owner is the only part of the path GitHub imposes.

Nested names are not discussed in the documentation. The pull example there
only shows `ghcr.io/NAMESPACE/IMAGE_NAME/release:1.14.1`. Observed, anonymous
`tags/list` calls succeed for names with four segments after the owner, so the
depth of `mirrors/docker-hub/library/postgres` is confirmed:

| Name                                                 | Segments after the owner |
| ---------------------------------------------------- | ------------------------ |
| `tektoncd/catalog/upstream/tasks/git-clone`          | 4                        |
| `defenseunicorns/packages/uds/bundles/k3d-core-demo` | 4                        |
| `homebrew/core/openssl/3`                            | 3                        |
| `stefanprodan/charts/podinfo`                        | 2                        |

No maximum depth is documented, so a deeper limit is not known.

Lowercase is not stated on the pages above. The only primary source found is
the `docker/build-push-action` troubleshooting guide, which says an image name
built from `github.repository` fails when the repository contains uppercase
letters, and fixes it by lowercasing the whole path
([Troubleshooting](https://github.com/docker/build-push-action/blob/master/TROUBLESHOOTING.md)).
Observed, a request for `stefanprodan/charts/Podinfo` returns `404`, while one
with the owner written `Stefanprodan` resolves, so the owner is matched without
regard to case and the name is not. Whether a push of an uppercase name is
rejected was not tested, because that needs authentication.

The pages above do not say outright that a push creates the package. They say "When you first publish a package, the default
visibility is private", which implies the first publish creates it. Visibility
is then a setting of each package, not of the owner. A package pushed from the
command line is not linked to a repository: "When you push a container image
from the command line, the image is not linked to a repository by default."
A workflow that publishes it links the repository that contains the workflow
automatically.

To link a repository from the command line, add the label
`org.opencontainers.image.source` to the image, as in
`LABEL org.opencontainers.image.source=https://github.com/OWNER/REPO`
([Connecting a repository to a
package](https://docs.github.com/en/packages/learn-github-packages/connecting-a-repository-to-a-package)).
A linked package shows the repository's README on its landing page, and
"automatically inherits the access permissions of the linked repository" unless
the organization has turned that inheritance off.

## Tag immutability

No setting exists. The Container registry documentation and the Packages
overview are silent on immutability, and no page describing such a setting was
found. The only related source found is an open feature request in the GitHub
community, [Immutable image tags in container
registry](https://github.com/orgs/community/discussions/181783). Absence of a
documented setting is the evidence here, so the ADR's statement that
`ghcr.io` has none is consistent with the documentation but cannot be proven
from it.

## Retention

The documentation describes no cleanup policy and no automatic retention. The
only time-based rule is for restoring: a deleted package or version can be
restored "within 30 days of its deletion", if the namespace and version are not
reused
([Deleting and restoring a
package](https://docs.github.com/en/packages/learn-github-packages/deleting-and-restoring-a-package)).

Deletion is manual or scripted:

- The REST API lists versions with
  `GET /orgs/{org}/packages/{package_type}/{package_name}/versions` and deletes
  one with
  `DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}`.
  The delete call needs the `read:packages` and `delete:packages` scopes for
  tokens that use scopes
  ([REST API for packages](https://docs.github.com/en/rest/packages/packages)).
- A workflow can delete with its `GITHUB_TOKEN`, "The token must have `admin`
  permission to the package."
- A public package version with more than 5,000 downloads cannot be deleted
  through the API, and GitHub support must be contacted.
- The package type for container images is `container`. The
  [`actions/delete-package-versions`](https://github.com/actions/delete-package-versions)
  action takes `package-type` as `docker` (v4 or older) or `container` (v5 or
  newer), keeps the latest versions with `min-versions-to-keep`, and has
  `delete-only-untagged-versions` for container packages. Its README says "we
  are not taking contributions to this repository at this time."

The list response carries `metadata.container.tags`, an array of the tags on
each version. Targeting `pr-` and `0.0.0-pr-` tags is therefore done by listing
versions, selecting those whose tags all start with one of the prefixes, and
deleting them by `package_version_id`. The action has no tag-prefix filter. Its
`ignore-versions` input is documented as "Takes regex for the version name",
and a container version is named by its digest, so selecting on tags is a
script over the REST API, not a setting of the action (the action's matching
against container tags was not tested). A version that carries both a `pr-` tag and a release tag must be left
alone, which the selection above handles by requiring every tag to match.

The REST documentation does not say how a package name that contains `/` is
written in the path, and a search found nothing either. Standard URL encoding
would write `%2F`, but this was not verified because it needs a token.

## Mirrors

`ghcr.io` has no pull-through cache or remote repository feature in the pages
above, and none was found elsewhere in the GitHub documentation. A mirror is a
copy pushed by us. `crane copy SRC DST` does it, described as "Efficiently copy
a remote image from src to dst while retaining the digest value", with
`--all-tags` to copy every tag and `--platform` to restrict a multi-platform
image
([crane copy](https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane_copy.md)).
Keeping the digest is what lets a deployment pin a mirror by digest. The
documentation of `crane copy` mentions no flag for referrers, so signatures and
attestations are not copied by it, and a tool that copies them is needed where
they matter. That tool was not tested here.

## Signatures and referrers

Observed, the repository `stefanprodan/charts/podinfo` holds, next to each
version tag such as `6.3.4`, a tag of the form `sha256-<digest>.sig`. The digest
is that of the signed manifest: the manifest tagged `6.3.4` has digest
`sha256:8f513021...` and the repository has a tag `sha256-8f513021....sig`
whose manifest is an OCI manifest with a layer of media type
`application/vnd.dev.cosign.simplesigning.v1+json` and the annotation
`dev.cosignproject.cosign/signature`. So cosign signatures live in the same
repository as the artifact, under a tag, and they are not separate packages.
The same `.sig` tags appear in `cloudnative-pg/charts/cloudnative-pg`,
`home-operations/charts-mirror/cilium` and `sigstore/cosign/cosign`.

A tag listing of such a repository therefore mixes release tags with signature
tags. A cleanup script that deletes by tag must not treat `.sig` tags as
releases, and must delete a signature with the version it describes.

The documentation says nothing about the OCI referrers API. Observed, `GET
/v2/<name>/referrers/<digest>` on `stefanprodan/charts/podinfo` returns `404`
with `MANIFEST_UNKNOWN`, both for a made-up digest and for the real digest of
`6.3.4`. The OCI Distribution Specification expects a registry that implements
the API to answer `200` with an empty index when nothing refers to the digest,
and tells clients to fall back to a tag derived from the digest when the
response is `404`
([OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/main/spec.md)).
So `ghcr.io` was observed not to serve the referrers API on 2026-10-16, and
signatures there are found by tag, not by referrers. This is a snapshot of
behavior GitHub does not document and may change.

## Helm charts

`helm push` takes a reference that "must be prefixed with `oci://` and must not
contain the basename or tag". The basename "is inferred from the chart's name"
and the tag "is inferred from the chart's semantic version", which Helm calls
"a strict requirement"
([Helm: Use OCI-based registries](https://helm.sh/docs/topics/registries/)).
So `helm push api-1.4.0.tgz oci://ghcr.io/<owner>/charts/shop` publishes
`ghcr.io/<owner>/charts/shop/api:1.4.0`. Helm's page has no `ghcr.io` push example,
and says of `helm registry login` that the host is given without a scheme or a
path. The same layout is observed in public use at
`ghcr.io/stefanprodan/charts/podinfo` and
`ghcr.io/cloudnative-pg/charts/cloudnative-pg`.

The Container registry documentation does not mention Helm charts. It lists
"Open Container Initiative (OCI) Specifications" as a supported format
([Working with the Container
registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)).
