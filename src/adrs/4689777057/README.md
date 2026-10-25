---
id: '4689777057'
title: Base64-encoded configuration values
state: Approved
created: 2026-10-25
tags: [secret, encoding, configuration, environment-variables]
category: Platform
---

# Base64-encoded configuration values

## Context

Secrets travel through carriers that only hold a single line of text:
environment variables, `.env` files, CI secret stores, container orchestrator
manifests and secret managers. Some secrets do not fit. A Google service
account key is a multi-line JSON document with an embedded PEM key, and TLS
keys and certificates are multi-line PEM. Each carrier mangles newlines,
quotes and backslashes differently, so the same value pasted into two
carriers can reach the program in two different shapes.

Encoding the value as base64 makes it a single line of safe characters, but
the program reading it has to know it was encoded. Putting that knowledge in
the reader's configuration, such as an `encoding` field next to the variable
name, does not travel: the operator who stores the value often cannot change
the reader's configuration, and a value shared by programs in different
languages would need the same field in every one of them. The value has to
describe itself.

Other ecosystems already do this, such as the `base64:` prefix Laravel uses
for `APP_KEY`.

[ADR#3610135900](../3610135900/README.md) defines a syntax that marks a value
as a secret so scanners can find it. This ADR does not replace it; it defines
how a value is carried, not what it is.

## Resolution

### When to encode

Encoding is a last resort for a value its carrier cannot hold unchanged. It
costs readability: people, diffs and scanners can no longer see what the value
is.

- You **SHOULD NOT** encode a value that already fits on one line of
  printable ASCII, such as an API token or a `whsec_` signing secret.
- You **SHOULD NOT** encode a value when the carrier already preserves it,
  such as a Kubernetes Secret, whose `data` field is already base64 and is
  decoded before the program sees it, or a secret manager that returns the
  exact bytes.
- You **MAY** encode a value only when its carrier cannot hold it unchanged,
  such as a multi-line PEM key in a `.env` file or a CI store that strips
  newlines.

### Writing a value

- You **MUST** write an encoded value as `base64:` followed by the standard
  base64 encoding of the value's bytes, as defined in
  [RFC 4648 section 4](https://datatracker.ietf.org/doc/html/rfc4648#section-4),
  with padding.
- You **MUST** encode a text value as its UTF-8 bytes.
- You **MUST NOT** change the bytes before encoding, such as by normalizing
  newlines or trimming whitespace, so the decoded value is the original one.
- You **MUST** write the prefix in lowercase.
- You **SHOULD** write the encoded part as a single line, such as the output
  of `base64 -w0` or of `base64` on macOS.
- You **MUST** encode a value that itself begins with `base64:`, so it is not
  mistaken for an encoded one.
- You **MUST NOT** use the URL-safe alphabet or drop the padding.

### Reading a value

- You **MUST** decode a value that begins with `base64:` and use the decoded
  value in its place.
- You **MUST** use a value that does not begin with `base64:` as is. You
  **MUST NOT** guess an encoding from the content of a value.
- You **MUST** decode exactly once. A decoded value that begins with
  `base64:` is the secret, not another layer to decode.
- You **MUST** ignore ASCII whitespace inside the encoded part, so wrapped
  output of `base64` is accepted. Base64 contains no whitespace, so this
  cannot change the result.
- You **MUST** fail when the encoded part is not valid standard base64. When
  the reader needs text, it **MUST** also fail when the decoded bytes are not
  valid UTF-8.
- You **MUST NOT** include the value, encoded or decoded, in an error or a
  log. Name where the value came from instead, such as the variable or field.
- You **SHOULD** decode when the configuration is loaded and fail at startup,
  not each time the secret is used.

### Combining with the secret value syntax

The [ADR#3610135900](../3610135900/README.md) marker is what tells scanners,
logs and people that a value is sensitive, so it has to stay readable.

- You **MUST** keep the [ADR#3610135900](../3610135900/README.md) marker
  outside the encoding: put `base64:` at the start of the secret value part,
  after the namespace identifiers.

  ```txt
  secret:gcp:service-account:base64:eyJ0eXBlIjoic2VydmljZV9hY2NvdW50In0=
  ```

- You **MUST NOT** encode a marked value as a whole, such as
  `base64:c2VjcmV0Oi4uLg==`, since that hides the marker.
- You **MUST** mark every encoded value with the
  [ADR#3610135900](../3610135900/README.md) syntax. Encoding hides the
  content from scanners, and the marker keeps every encoded value detectable
  without decoding it:

  ```txt
  secret:tls:private-key:base64:LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUUKLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=
  ```

- When reading, you **MUST** parse the
  [ADR#3610135900](../3610135900/README.md) syntax first, then apply
  [Reading a value](#reading-a-value) to its secret value part.

## Links

- [RFC 4648: The Base16, Base32, and Base64 Data Encodings](https://datatracker.ietf.org/doc/html/rfc4648)
- [Laravel encryption configuration](https://laravel.com/docs/encryption#configuration)
