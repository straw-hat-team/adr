---
name: SOPS
quadrant: tools
history:
  - edition: '2026.2'
    ring: adopt
tags: [secrets, encryption]
---

# SOPS

Secrets that a repository needs are committed as SOPS-encrypted files. Encryption is per value, so a diff still
shows which keys changed and a review of a secrets change is a real review rather than an opaque blob swap.

It sits in Adopt for two reasons. Keys are backed by age or a hosted KMS, which makes revoking a reader an
operation on the key backend instead of a hunt for every copy of a shared private key. And [mise](./mise.md)
reads SOPS files directly as environment, so a decrypted secret exists for the life of a command rather than
sitting on disk waiting to be pasted somewhere it should not go.

Reaching for a different secret format in a repository needs a justification. See [EJSON](./ejson.md) for the one
it replaced.
