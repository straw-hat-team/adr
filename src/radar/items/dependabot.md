---
name: Dependabot
quadrant: tools
history:
  - edition: '2026.3'
    ring: hold
tags: [dependencies, automation]
---

# Dependabot

Dependabot version updates open pull requests for outdated dependencies, and for actions pinned by commit SHA it
does that well. It is on Hold because we want one dependency tool, and [Renovate](./renovate.md) covers what
Dependabot does plus what it cannot: a version that sits in a plain string, such as the version input of an
action step or the default of a composite action, or a `mise.toml`. Running both means two bots, two
configurations, and duplicate pull requests for the same bump.

Hold is not a removal order. A repository with a `dependabot.yml` keeps it until Renovate's pull requests for the
same dependencies look right, and then the file goes. New repositories should not add one.

Only the version updates are on Hold. Dependabot alerts and security updates are a separate GitHub setting from
`dependabot.yml`, they stay on, and removing the file does not turn them off.
