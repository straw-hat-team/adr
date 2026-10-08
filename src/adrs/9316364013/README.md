---
id: '9316364013'
title: Reserved repository directories
state: Approved
created: 2026-10-07
tags: [directory, mise, github-actions, devops, protobuf, wit, opentelemetry]
category: Platform
---

# Reserved repository directories

## Context

Every repository carries files that belong to no single language workspace:
task scripts, scripts run by GitHub Actions, operational assets and schema
sources. Without a reserved place for each, every repository invents its own,
tooling paths drift, and the layout has to be learned again on every clone.

Two rules settle the names. A directory is named after what it holds, never
after the tool that processes it. Inside a reserved directory the layout is
whatever the consuming tool dictates, so no second naming decision exists.

This ADR fixes the set of reserved directories. The layout inside each one is
decided by the ADR that owns it, linked from the table.

## Resolution

- You **MUST** reserve the following directories at the repository root, with
  the meaning given, in every repository regardless of language or shape:

  | Directory                 | Holds                                      | Layout                                    |
  | ------------------------- | ------------------------------------------ | ----------------------------------------- |
  | `.config/<tool>/`         | configuration that drives a tool           | the tool's own layout                     |
  | `.config/mise/`           | mise tasks and code they share             | [ADR#6647967335](../6647967335/README.md) |
  | `devops/`                 | operational assets that reach nothing live | [ADR#2078011537](../2078011537/README.md) |
  | `devops/infra/`           | the live estate: Terragrunt and GitOps     | [ADR#6561361204](../6561361204/README.md) |
  | `proto/`, `wit/`, `otel/` | schema sources, one directory per language | [ADR#4711775939](../4711775939/README.md) |

- You **MUST NOT** reuse a reserved directory name for another purpose at the
  repository root, and you **MUST NOT** place these files anywhere else unless
  the ADR that owns the directory allows it.
- You **MUST NOT** name a reserved directory after the tool that processes it.
  `.config/<tool>/` and `devops/<tool>/` are the exceptions, because each holds
  nothing but what that one tool reads.
- You **MUST** follow the consuming tool's own layout inside a reserved
  directory and **MUST NOT** add a naming layer of your own.

## Links

- [ADR#6647967335](../6647967335/README.md): mise tasks and shared code
- [ADR#2078011537](../2078011537/README.md): Operational assets
- [ADR#6561361204](../6561361204/README.md): Live infrastructure
- [ADR#4711775939](../4711775939/README.md): Schema source directories
