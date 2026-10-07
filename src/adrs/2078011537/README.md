---
id: '2078011537'
title: Operational assets
state: Approved
created: 2026-10-07
tags: [directory, devops, docker, compose, helm]
category: Platform
---

# Operational assets

## Context

[ADR#9316364013](../9316364013/README.md) reserves `devops/` for operational
assets. This ADR fixes the layout for the assets that reach nothing live:
container images, the local stack and Helm charts. Anything that creates,
changes or reconciles a live account or cluster is covered by
[ADR#6561361204](../6561361204/README.md).

A survey of our repositories found compose files at the repository root as
`docker-compose.yml`, Dockerfiles next to the code they build, and Helm charts
under `deploy/`, `charts/` or `devops/helm/`. The repositories that had settled
this converged on `devops/` split by tool, with the Docker tree split again by
what a file is for: an image directory holds build input that lands in the
artifact, a compose service directory holds run-time input mounted over it.

## Resolution

- You **MUST** place every operational asset that reaches nothing live under
  `devops/<tool>/`, named after the tool that consumes it (`docker/`, `helm/`,
  `terragrunt/`).
- You **MUST NOT** keep `docker-compose.yml`, `compose.yaml`, a `Dockerfile`
  for a shipped image, or a chart anywhere else, including the repository root
  and `deploy/`.
- You **MUST** drive the stack through mise tasks (`compose:up`,
  `compose:down`, `images:build`), never through scripts inside `devops/`.

### Container images

- You **MUST** give every image that ships its own directory
  `devops/docker/images/<name>/`, where `<name>` is the deployable it produces
  and matches the command or chart that uses it.
- You **MUST** keep only build input beside the `Dockerfile`: files the build
  copies in and nothing else reads. Source that a language workspace owns
  stays in that workspace; the image reaches it through the build context, it
  does not copy it in.
- You **MUST** use the image directory as the build context unless the
  `Dockerfile` needs source from the repository. An image that does **MUST**
  take it through `RUN --mount=type=bind,source=<path>` with `<path>` written
  from the repository root, and **MUST** then use the repository root as the
  context. The build task **MUST** derive the context from that mount, so no
  list of images has to be kept.
- You **MUST** keep ignore rules beside the `Dockerfile` as
  `Dockerfile.dockerignore`, and **MUST NOT** keep a `.dockerignore` at the
  repository root.

### Compose

- You **MUST** keep one `compose.yaml` per environment. A repository with a
  single local stack places it directly under `devops/docker/compose/`; one
  with several environments places each under
  `devops/docker/compose/<environment>/`.
- You **MUST** place what a compose service reads at run time under
  `services/<service>/` next to the `compose.yaml` that mounts it, named by
  the compose service name. A `Dockerfile` **MAY** live there only for an image
  that never ships.
- You **MUST** build a shipped image from `devops/docker/images/<name>/`, and
  nothing under `images/` or `helm/` **MUST** read anything under `compose/`.

  ```txt
  .
  ├── <workspace>/                # source a root-context image bind-mounts
  └── devops/docker
      ├── images
      │   ├── <self-contained>
      │   │   ├── Dockerfile
      │   │   ├── Dockerfile.dockerignore
      │   │   └── <input>/        # copied by this Dockerfile only
      │   └── <from-source>
      │       ├── Dockerfile      # RUN --mount=type=bind,source=<workspace>/...
      │       └── Dockerfile.dockerignore
      └── compose
          ├── compose.yaml            # single stack
          ├── services/<service>/     # run-time mounts
          └── <environment>           # only when there is more than one stack
              ├── compose.yaml
              └── services/<service>/
  ```

### Helm

- You **MUST** place each chart under `devops/helm/charts/<chart>/`, named
  after the deployable it installs.
- You **MUST** keep defaults in `values.yaml` and per-environment overrides in
  `values.<environment>.yaml` beside it.
- You **MUST** compose several charts through an umbrella chart with `file://`
  dependencies in the same directory, never by reaching into another chart's
  templates.

## Links

- [ADR#9316364013](../9316364013/README.md): Reserved repository directories
- [ADR#6561361204](../6561361204/README.md): Live infrastructure
- [Compose file reference](https://docs.docker.com/reference/compose-file/)
- [Helm chart file structure](https://helm.sh/docs/topics/charts/#the-chart-file-structure)
