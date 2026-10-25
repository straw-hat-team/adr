---
id: '4689777057'
title: Base64 prefix for secret values
state: Approved
created: 2026-10-25
tags: [secret, encoding, configuration]
category: Platform
---

# Base64 prefix for secret values

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

### Writing a value

- You **MAY** write any secret value as `base64:` followed by the standard
  base64 encoding of the value, as defined in
  [RFC 4648 section 4](https://datatracker.ietf.org/doc/html/rfc4648#section-4),
  with padding.
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

### Combining with other formats

The prefix is the outermost layer. A value in the
[ADR#3610135900](../3610135900/README.md) syntax, or a provider format such as
`whsec_`, is encoded as a whole and comes back unchanged after decoding:

```txt
base64:c2VjcmV0OmdpdGh1YjpnaHA6Z2hwXzAwMDA=
```

decodes to `secret:github:ghp:ghp_0000`.

A scanner sees only the encoded text, so encoding a value hides its
[ADR#3610135900](../3610135900/README.md) marker and any provider prefix. A
value that already fits on one line gains nothing from being encoded.

## Links

- [RFC 4648: The Base16, Base32, and Base64 Data Encodings](https://datatracker.ietf.org/doc/html/rfc4648)
- [Laravel encryption configuration](https://laravel.com/docs/encryption#configuration)
