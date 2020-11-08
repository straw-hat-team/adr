# ADR Style guide

ADRs are most useful when they are clear and concise, and cover a single topic
or inquiry well. In the same way that ADRs describe consistent patterns and
style for use in APIs, they also follow consistent patterns and style.

## Guidance

ADRs must cover a single, discrete topic, and should fundamentally answer the
question, "What do I do?" with actionable guidance. ADRs may also cover what not
to do.

While the length of ADRs will necessarily vary based on the complexity of the
question, most ADRs should be able to cover their content in roughly two
printed pages.

## Requirement keywords

ADRs **should** use the following requirement level keywords: "MUST", "MUST NOT",
"SHOULD", "SHOULD NOT", and "MAY", which are to be interpreted as described in
[RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

When using these terms in ADRs, they **must** be lower-case and **bold**. These
terms should not be used in other ways.

## Referencing ADRs

When ADRs reference other ADRs, the prosaic text must use the format
ADR#XXXXXXXXXX (e.g., [ADR#0000000000](../0000000000/README.md)), and must
link to the relevant ADR. ADR links may point to a particular section of the
ADR if appropriate.

> ADR links must use the relative path to the file in the repository, this
> ensures that the link works both on the ADR site, when viewing the Markdown
> file on GitHub, using the local development server, or a branch.
