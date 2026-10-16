# Google Cloud: Artifact Registry

Verified against primary documentation on 2026-10-16.

## Names

An image is addressed as
`LOCATION-docker.pkg.dev/PROJECT-ID/REPOSITORY/IMAGE`, with `:TAG` or
`@IMAGE-DIGEST` after it. The location is the first part of the hostname, "the
regional or multi-regional location of the repository"
([Repository and image
names](https://docs.cloud.google.com/artifact-registry/docs/docker/names)).
`IMAGE` is "the name of the image in the repository". The project and the
repository are therefore both fixed before our own path starts, which is why
the ADR treats `<location>-docker.pkg.dev/<project>` as the registry prefix.

Not stated by Google, so not verified:

- The character grammar of a repository name. The create guide says only that
  "For each repository location in a project, repository names must be unique"
  ([Create standard
  repositories](https://docs.cloud.google.com/artifact-registry/docs/repositories/create-repos)),
  and the REST reference describes `repositoryId` as "The repository id to use
  for this repository" with no constraint
  ([repositories.create](https://docs.cloud.google.com/artifact-registry/docs/reference/rest/v1/projects.locations.repositories/create)).
  The lowercase `[a-z0-9-]` rule in the ADR is our own and sits inside any
  plausible grammar, but Google's grammar is not documented in the pages
  checked.
- Length limits for repository, image or tag names. No page checked states
  one, and the quotas page was not reachable.
- Whether a standard repository accepts an image name with `/` in it. The
  only nested example is a remote repository that proxies GitHub Container
  Registry, pulled as `us-west1-docker.pkg.dev/my-project/my-repo/owner-name/test-image:staging`
  ([Push and pull
  images](https://docs.cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling)).
  The ADR's Wasm path `wasm-components/<namespace>/<package>` relies on a
  nested image name in a standard repository, so this stays unverified.

## Repositories

Each repository holds one format: "Each repository can contain artifacts for a
single supported format", and the formats include Docker, Generic, Maven, npm
and Python
([Create standard
repositories](https://docs.cloud.google.com/artifact-registry/docs/repositories/create-repos)).
The Docker quickstart creates the repository first ("Create a Docker
repository to store the sample image"), and the push guide says "If the target
repository does not exist, create a new repository"
([Push and pull
images](https://docs.cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling)).
The one exception is the legacy `gcr.io` domain, whose repositories are
created on first push
([Repository
overview](https://docs.cloud.google.com/artifact-registry/docs/repositories)).
No page checked says outright that a push to a missing repository on
`docker.pkg.dev` fails, so "must be created first" rests on the guides above.

Helm charts and other OCI artifacts live in Docker-format repositories. The
supported formats page says "Store Docker container images and Helm charts
packaged in OCI format" and "You can store artifacts that support the OCI image
format in Artifact Registry Docker repositories"
([Supported
formats](https://docs.cloud.google.com/artifact-registry/docs/supported-formats)).
The Helm guide repeats it: "Artifact Registry lets you store and manage Helm
charts in Docker-format repositories", pushed with
`helm push hello-chart-0.1.0.tgz oci://us-west1-docker.pkg.dev/PROJECT/quickstart-helm-repo`.
"The chart name is the image name" and "The chart version is the image tag"
([Store Helm
charts](https://docs.cloud.google.com/artifact-registry/docs/helm/store-helm-charts)),
which matches the ADR's description of what Helm appends.

Not verified: Wasm components. No page checked mentions Wasm. They are OCI
artifacts, so the general OCI statement above is the only support, and no
Google page promises that a `wkg` push of a Wasm media type is accepted.

One repository per kind (`images`, `charts`, `wasm-components`) is therefore
allowed but not required: a single Docker-format repository could hold all of
them. Separate repositories are our choice, and they are what let cleanup
policies and IAM differ per kind.

## Remote repositories

Remote repositories "act as proxies" and are read-only. On the first request
the repository "downloads and caches" the artifact, and "Artifact Registry
serves the cached copy" for the same version afterwards
([Repository
overview](https://docs.cloud.google.com/artifact-registry/docs/repositories),
[Remote repositories
overview](https://docs.cloud.google.com/artifact-registry/docs/repositories/remote-overview)).

- One upstream per repository. No page states the count in words. The upstream
  is a single setting ("Remote repository upstream source") that "can't be
  changed after the repository is created", the gcloud flag
  `--remote-docker-repo` takes one value, `docker-hub` or one HTTPS URI, and
  the preset for Docker Hub is `DOCKER-HUB` at `https://registry-1.docker.io`
  ([Create remote
  repositories](https://docs.cloud.google.com/artifact-registry/docs/repositories/remote-repo),
  [gcloud
  create](https://docs.cloud.google.com/sdk/gcloud/reference/artifacts/repositories/create)).
  A virtual repository is the product that aggregates several upstreams. So
  `mirrors-docker-hub` and `mirrors-quay` as separate remote repositories
  follows from the design, but it is an inference.
- Tag refresh. Mutable metadata "are updated from the upstream source when they
  become more than the default age", and the listed default for the Docker tag
  list cache is 1 hour
  ([Remote repositories
  overview](https://docs.cloud.google.com/artifact-registry/docs/repositories/remote-overview)).
  The quickstart says "If you pull the same tagged image again, it will be
  pulled from your remote repository"
  ([Docker Hub remote
  quickstart](https://docs.cloud.google.com/artifact-registry/docs/repositories/create-dockerhub-remote-repository)).
  No page says when an already cached tag is moved to a new upstream digest,
  so the ADR's statement that a cache refresh moves a mirrored tag is not
  confirmed, and the 1 hour figure covers the tag list only.
- Path. The quickstart pulls
  `us-central1-docker.pkg.dev/PROJECT/quickstart-docker-hub-remote/busybox:latest`,
  with no `library/` segment. No page checked mentions `library/`. This does
  not confirm the ADR's `mirrors-docker-hub/library/postgres:16`, and it
  suggests the bare `mirrors-docker-hub/postgres:16` may be what Artifact
  Registry expects for Docker Hub official images. It needs a live pull to
  settle.

## Tag immutability

The setting is **Immutable image tags**, for Docker repositories only, and it
is off by default. When on, these actions are not permitted: "Delete a tagged
image", "Remove a tag from an image", "Push an image with a tag that is already
used by another version of the image in the repository", and "Add, remove, or
update labels". The page adds that a tag always points to the same digest,
"including the default `latest` tag"
([Configure repository
settings](https://docs.cloud.google.com/artifact-registry/docs/repositories/update-repo-settings),
[Create standard
repositories](https://docs.cloud.google.com/artifact-registry/docs/repositories/create-repos)).
In gcloud it is `--immutable-tags` ("Tags cannot be deleted or moved to a
different image digest, and tagged images cannot be deleted") and
`--no-immutable-tags`
([gcloud
create](https://docs.cloud.google.com/sdk/gcloud/reference/artifacts/repositories/create)).

No page checked describes any exemption, allowlist or pattern for tags, which
supports the ADR's claim that none can be exempted. This is absence of
documentation, not a stated "cannot".

The setting is also a Docker-repository setting, so it is not documented as
applying to a remote repository. The ADR already exempts mirrors from the tag
rules.

Consequence for cleanup: "If a repository has immutable tags enabled, tagged
artifacts can't be deleted"
([Cleanup
policies](https://docs.cloud.google.com/artifact-registry/docs/repositories/cleanup-policy)).
With immutability on, a cleanup policy cannot expire `pr-` tags. See the
next section.

## Cleanup policies

A policy is a `Delete` or a `Keep` action plus conditions
([Configure cleanup
policies](https://docs.cloud.google.com/artifact-registry/docs/repositories/cleanup-policy)):

| Condition             | Meaning                                                   |
| --------------------- | --------------------------------------------------------- |
| `tagState`            | `tagged`, `untagged` or `any`                             |
| `tagPrefixes`         | tag prefixes, needs `tagState` set to tagged              |
| `versionNamePrefixes` | version name prefixes                                     |
| `packageNamePrefixes` | package name prefixes                                     |
| `olderThan`           | minimum time since the version was created, as a duration |
| `newerThan`           | maximum time since the version was created                |
| `keepCount`           | keep the most recent versions, a keep policy only         |

Prefixes match the start of a tag: "the prefixes `test`, and `staging` would
match images with tags `testenv` and `staging-1.5`". "If an artifact matches
the criteria in both the delete policy and the keep policy, the artifact is
kept", and a keep policy alone has no effect, so at least one delete policy
must exist. The page's example deletes `"tagPrefixes": ["alpha", "v0"]` with
`"olderThan": "30d"` and keeps `release`-prefixed tags. Changes take effect
"within approximately one day", and a dry run is available.

So expiring `pr-` and `0.0.0-pr-` builds is a delete policy with
`tagState: tagged`, the two prefixes and an `olderThan`. Release tags are never
matched by those prefixes, and a keep policy on the version tags is available
as a second guard. This composition is an inference from the documented
conditions. The page has no `pr-` example.

Open points:

- The page says "You can only apply cleanup policies to standard
  repositories", yet the remote repository guide lists cleanup policies as an
  optional setting at creation. The two are not reconciled by the pages
  checked, so cleanup on `mirrors-*` repositories is unverified.
- The commit-tagged image of a pull request carries only `pr-<commit>`, but an
  image that later gets a release tag is a different tag on the same version.
  Whether a version is deleted when any one of its tags matches a delete
  policy and none matches a keep policy is not spelled out.
- Cleanup does not apply to attachments directly (see the next section).
- Because immutable tags block deletion of tagged artifacts, a repository
  cannot both turn on immutability and expire `pr-` tags by cleanup policy.
  This follows from the quoted sentence, but no page shows the two together.

## Signatures and referrers

Artifact Registry "implements version 1.1 of the Open Container Initiative
(OCI) Distribution Specification"
([Support for the Docker Registry
API](https://docs.cloud.google.com/artifact-registry/docs/reference/docker-api)).
That page does not name the referrers endpoint.

Attachments are the documented mechanism: "Artifact Registry attachments let
you store and manage metadata files associated with your artifacts", and an
artifact can have "any number of attachments that refer to it". They can be
listed with Oras and the `v1.1-referrers-api` distribution spec, for Docker
container images, and the page is marked pre-GA. "Cleanup policies don't apply
directly to attachments", and deleting an artifact deletes the attachments that
target its version
([Manage artifact
metadata](https://docs.cloud.google.com/artifact-registry/docs/manage-metadata-with-attachments)).

Binary Authorization's Sigstore check keeps cosign signatures alongside the
image in the same Artifact Registry repository, and supports only Artifact
Registry repositories
([Use the Sigstore signature
check](https://docs.cloud.google.com/binary-authorization/docs/cv-sigstore-check)).
Cosign lists Artifact Registry among the registries it was tested against
([Cosign registry
support](https://docs.sigstore.dev/cosign/system_config/registry_support/)).

Not verified:

- That the `/v2/<name>/referrers/<digest>` endpoint itself is served. The
  attachments page uses it through Oras, which implies it, but no Google page
  states it.
- Whether signatures and referrers survive inside a remote repository, or are
  copied with an image into another registry. The ADR's rule to copy them with
  the artifact is a client concern and is not covered by Google pages.
