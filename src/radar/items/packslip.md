---
name: packslip
quadrant: tools
history:
  - edition: '2026.3'
    ring: trial
tags: [supply-chain, release]
---

# packslip

packslip signs a manifest of a release's assets, so a tool that installs from the release can verify what it
downloaded against one signed statement instead of trusting each file on its own. It runs as a GitHub Action
after the assets are uploaded and publishes the bundle beside them.

It is in Trial because the producing side works and the consuming side has not been exercised. A release now
publishes its bundle, and the bundle verifies, but nobody has yet installed through `packslip install` or
through mise reading the bundle on a real release. Until that is done we know the manifest is signed, not that
it is useful to the tools it was made for.

The action is allowed by the organization's actions policy like any other, and it is pinned by commit SHA. It
moves to Adopt once an install has been verified end to end through it. It moves to Hold if that check shows
the bundle adds nothing over [GitHub artifact attestations](./github-artifact-attestations.md).
