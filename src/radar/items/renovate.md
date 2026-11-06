---
name: Renovate
quadrant: tools
history:
  - edition: '2026.3'
    ring: trial
tags: [dependencies, automation]
---

# Renovate

Renovate opens pull requests that update dependencies, and it is the one dependency tool we are converging on,
with [Dependabot](./dependabot.md) on Hold. It is in Trial as the long-term replacement for Dependabot version
updates, for two reasons. Dependabot cannot bump a version that sits in a plain string, such
as the version input of an action step or the default of a composite action, and Renovate can through a regex
manager and a native mise manager. And Renovate is not tied to GitHub, which keeps dependency updates from being
one more thing that only works on one provider.

The move is staged so two bots never open duplicate pull requests. Renovate starts on the versions Dependabot
cannot see. Dependabot stays on the ecosystems it already updates, such as `github-actions`, `cargo`, or `npm`,
until Renovate's pull requests for each of them look right, such as commit-SHA pins and grouping. Only when every
ecosystem a repository configures has been taken over and checked is `dependabot.yml` removed, because removing
it stops the scheduled version updates for any ecosystem Renovate has not picked up.

Dependabot alerts and security updates are a separate GitHub setting from `dependabot.yml` and stay on
throughout. Two cases need care. Security updates reach private registries through the registry configuration
in `dependabot.yml`, so a repository that relies on it keeps that configuration, or gives Renovate equivalent
access, before the file goes. And a security pull request from Dependabot can still arrive before Renovate opens
its own for the same fix, so a duplicate is possible there and the second one is simply closed.

How it runs is still open. The GitHub App has no workflow to pin, but installing it on organization-owned
repositories needs an organization owner, where a personal account can install it itself. A self-hosted action
needs an entry in the actions allowlist and a pin that is kept current.
