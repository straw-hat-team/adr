---
name: GitHub artifact attestations
quadrant: tools
history:
  - edition: '2026.3'
    ring: adopt
tags: [supply-chain, release, security]
---

# GitHub artifact attestations

Release binaries carry a build provenance attestation, created by `actions/attest-build-provenance` and signed
keyless through Sigstore with the workflow's own OIDC identity. The checksum file is attested as well, so a
download can be checked either directly or through `sha256sums.txt`.

It sits in Adopt because there is no signing key to store, rotate, or leak, and because the check can be strict.
`gh attestation verify` takes the repository and the signing workflow, so an artifact built by any other
workflow fails verification, even one in the same repository. A verifier that only asks "is there a valid
signature" proves much less than one that asks "was this built by the release workflow".

An attestation says where a build came from. It does not say the source was trustworthy, so it complements
review and branch protection instead of replacing them.

Pair it with [GitHub Actions](./github-actions.md) pinned by commit SHA, and see [packslip](./packslip.md) for
the manifest that is published next to it.
