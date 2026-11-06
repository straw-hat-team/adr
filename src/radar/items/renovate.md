---
name: Renovate
quadrant: tools
history:
  - edition: '2026.3'
    ring: trial
tags: [dependencies, automation]
---

# Renovate

Renovate opens pull requests that update dependencies. It is in Trial as the long-term replacement for
Dependabot version updates, for two reasons. Dependabot cannot bump a version that sits in a plain string, such
as the version input of an action step or the default of a composite action, and Renovate can through a regex
manager and a native mise manager. And Renovate is not tied to GitHub, which keeps dependency updates from being
one more thing that only works on one provider.

The move is staged so two bots never open duplicate pull requests. Renovate starts on the versions Dependabot
cannot see. Dependabot stays on `github-actions` and `cargo` until Renovate's pull requests for them look right,
such as commit-SHA pins and cargo grouping, and then `dependabot.yml` is removed.

Dependabot alerts and security updates are a separate GitHub setting from `dependabot.yml` and stay on
throughout.

How it runs is still open. The GitHub App needs an organization admin and has no workflow to pin. A self-hosted
action needs an entry in the actions allowlist and a pin that is kept current.
