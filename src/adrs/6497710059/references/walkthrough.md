# Walkthrough: one service from pull request to production

This follows the `api` service of the `acme` owner on GitHub Container
Registry, from a pull request to a release. `<commit>` stands for the full
40-character commit SHA, `3f2c…4e3f` here.

## Pull request

Commit `3f2c…4e3f` is pushed to a pull request branch. The build publishes a
multi-platform image and a prerelease chart, both marked `pr-`:

```sh
docker buildx build --platform linux/amd64,linux/arm64 \
  --annotation "index:org.opencontainers.image.source=https://github.com/acme/api" \
  --annotation "index:org.opencontainers.image.revision=3f2c…4e3f" \
  -t ghcr.io/acme/images/api:pr-3f2c…4e3f --push .

helm package devops/helm/charts/api --version 0.0.0-pr-3f2c…4e3f
helm push api-0.0.0-pr-3f2c…4e3f.tgz oci://ghcr.io/acme/charts
```

Helm appends the chart name, so the chart lands at
`ghcr.io/acme/charts/api:0.0.0-pr-3f2c…4e3f`.

## Default branch

The pull request merges with a fast-forward, so `main` builds the same commit
and publishes it without the `pr-` mark, as `images/api:3f2c…4e3f` and
`charts/api:0.0.0-sha-3f2c…4e3f`. A squash or merge commit gets its own SHA
and tags the same way. The pull request tags stay where they are and expire
later.

## Release

The git tag `v1.4.0` is pushed on that commit. The image is not built again;
the release adds the version to the image the default branch built, so the
digest stays the same:

```sh
crane tag ghcr.io/acme/images/api:3f2c…4e3f 1.4.0
```

The chart is packaged with `--version "${GITHUB_REF_NAME#v}"` and pushed as
`charts/api:1.4.0`. Helm requires the tag to equal the chart version, so the
commit is read from its `org.opencontainers.image.revision` annotation.

With `docker/metadata-action`, the same tag names come from:

```yaml
- uses: docker/metadata-action@v5
  with:
    images: ghcr.io/acme/images/api
    tags: |
      type=semver,pattern={{version}}
      type=sha,format=long,prefix=
```

## Deployment

A deployment pins the release by tag and digest:

```yaml
image: ghcr.io/acme/images/api:1.4.0@sha256:9b1e…
```

The cluster pulls the digest. A reader sees the release, and
`crane ls ghcr.io/acme/images/api` lists `3f2c…4e3f` next to `1.4.0`, which
leads back to the commit in git.

## Variant

A debug build of the same release is `images/api:1.4.0-debug`, a suffix on the
tag rather than another image name.

## Moving tags for images others pull

If `api` were an open source image, the release would also move these tags:

```sh
crane tag ghcr.io/acme/images/api:1.4.0 latest
crane tag ghcr.io/acme/images/api:1.4.0 1.x
```

An image only we deploy never gets them.

## Wasm component

The WIT package `acme:greeter` at `0.3.0` publishes to
`ghcr.io/acme/wasm-components/acme/greeter:0.3.0`.

## Mirror

Postgres is copied from Docker Hub with its upstream path and tag:

```sh
crane copy docker.io/library/postgres:16 \
  ghcr.io/acme/mirrors/docker-hub/library/postgres:16
```

The `16` tag follows the upstream on every refresh. In Artifact Registry the
same image is
`<location>-docker.pkg.dev/<project>/mirrors-docker-hub/library/postgres:16`.

## Signatures

`cosign sign ghcr.io/acme/images/api@sha256:9b1e…` stores the signature in
`images/api`, attached to the digest. `oras copy -r` moves it along with the
image to another registry; a plain pull and push leaves it behind.

## Cleanup

A scheduled job deletes `pr-*` and `0.0.0-pr-*` versions after the age the
project sets, since GitHub Container Registry has no cleanup policy. Nothing
tagged `1.4.0` is deleted.

## Result

```txt
ghcr.io/acme
├── images/api                          1.4.0, 1.4.0-debug, 3f2c…4e3f, latest, 1.x
├── charts/api                          1.4.0, 0.0.0-sha-3f2c…4e3f
├── wasm-components/acme/greeter        0.3.0
└── mirrors/docker-hub/library/postgres 16
```
