---
name: release-please
quadrant: tools
history:
  - edition: '2026.3'
    ring: adopt
tags: [release, automation]
---

# release-please

Releases are cut by merging the release pull request that release-please keeps open, and nothing else. The merge
creates the tag, the tag starts the artifact workflow, and the workflow builds, attests, and publishes. There is
no manual step to forget and no second way to release.

That is why it sits in Adopt. Manual republishing is still possible through the workflow's manual trigger, but it
is the exception, and it waits for an approval in a protected environment. A release that needs the exception
more than rarely is a bug in the workflow, not a habit to keep.

release-please creates tags with a personal access token on purpose. A tag created with the default workflow
token does not trigger other workflows, so the artifact workflow would never start.
