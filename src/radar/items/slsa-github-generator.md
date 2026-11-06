---
name: SLSA GitHub generator
quadrant: tools
history:
  - edition: '2026.3'
    ring: hold
tags: [supply-chain, release]
---

# SLSA GitHub generator

The SLSA generic generator produces SLSA provenance from a reusable workflow. It is on Hold because it has to
be referenced by tag, not by commit SHA, which is the opposite of what the organization requires for every
action. A job that references it makes the whole workflow refuse to start, and the failure shows up as a run
that never begins rather than a step that fails.

Allowing it would mean weakening SHA pinning for everything to accommodate one reference, which is a bad trade
when [GitHub artifact attestations](./github-artifact-attestations.md) already give signed provenance.

Revisit it only if the generator can be referenced by commit SHA.
