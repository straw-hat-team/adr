---
name: EJSON
quadrant: tools
history:
  - edition: '2026.2'
    ring: hold
tags: [secrets, encryption]
---

# EJSON

EJSON encrypts the values of a JSON document with a keypair, so a secrets file can be committed and reviewed
without exposing what it holds. That premise is still right, and it is the premise [SOPS](./sops.md) inherits.

It is on Hold because the surrounding constraints moved. EJSON encrypts JSON and only JSON, against a keypair
whose private half has to reach every machine and CI runner that needs to read it. SOPS covers the same shape
across the formats configuration already uses, backs the key by age or a hosted KMS, and is read directly by
[mise](./mise.md) as environment. That last part is what settled it: decryption stopped being a step each task
had to perform and became a property of entering the project.

Existing EJSON files are not an emergency. New secrets should be SOPS.
