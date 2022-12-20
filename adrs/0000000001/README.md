# ADR Style guide

- **State:** Approved
- **Created:** 2020-11-8
- **Tags:** genesis

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

ADRs **SHOULD** use the following requirement level keywords: "MUST", "MUST NOT",
"SHOULD", "SHOULD NOT", and "MAY", which are to be interpreted as described in
[RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) and
[RFC 8174](https://datatracker.ietf.org/doc/html/rfc8174).

When using these terms in ADRs, they **MUST** be upper-case and **bold**. These
terms should not be used in other ways.

## Assigning ADR Numbers

The ADR editors are responsible for assigning a number to each ADR when it is
accepted as a draft for review. Importantly, all ADRs have numbers, not just
approved ones. The ADR Index clearly delineates which ADRs are approved and
binding and which are under discussion.

Beyond this, ADR numbers are assigned arbitrarily using `nanoid`
`limited to 10 character` and `only 0123456789 characters`.

In general, the editors will generate the next ADR number to assign to a draft
ADR.

## Referencing ADRs

When ADRs reference other ADRs, the prosaic text must use the format
ADR#XXXXXXXXXX (e.g., [ADR#0000000000](../0000000000/README.md)), and must
link to the relevant ADR. ADR links may point to a particular section of the
ADR if appropriate.

> ADR links must use the relative path to the file in the repository, this
> ensures that the link works both on the ADR site, when viewing the Markdown
> file on GitHub, using the local development server, or a branch.

## File structure

ADRs **MUST** be written in Markdown, and the directory **MUST** be named using
their ten-digit number (example: 3870009043), with a `README.md` file in it, for
example: `adrs/3870009043/README.md`.

ADRs **MAY** have other supporting files in the ADR directory.

## Document structure

ADRs **MUST** begin with a top-level heading with the ADR's title (# Title).
ADRs **SHOULD** then begin with the metadata information about the ADR

- **State:** the estate of the ADR.
- **Replaced by:** the link to the ADR that was replaced by.
- **Created:** when the ADR was created following the **YYYY-MM-DD** format.
- **Tags:** the tags separated by comma, and the tags **MUST** be lowercase.

Followed by the content of the ADR. Below is an example ADR shell that uses
each major section:

```md
# The title of the ADR

- **State:** Replaced
- **Replaced by:** [ADR#0000000000](../ADRs/../adrs/0000000000/README.md)
- **Created:** 2020-11-08
- **Tags:** genesis

<!--
Technical Story: [description | ticket/issue URL]
-->

## Context and Problem Statement

<!--
Describe the context and problem statement, e.g., in free form using two to
three sentences. You may want to articulate the problem in form of a question.
-->

## Decision Drivers

<!--
* [driver 1, e.g., a force, facing concern, …]
* [driver 2, e.g., a force, facing concern, …]
* … numbers of drivers can vary
-->

## Considered Options

### Option [1]

[example | description | pointer to more information | …]

- Good, because [argument a]
- Good, because [argument b]
- Bad, because [argument c]
- … numbers of consequences

## Decision Outcome

Chosen option: "[option 1]", because [justification. e.g., only option, which
meets k.o. criterion decision driver | which resolves force force | … | comes
out best (see below)].

### Advantages

- [e.g., improvement of quality attribute satisfaction, follow-up decisions
  required, …]
- …

### Disadvantages

- [e.g., compromising quality attribute, follow-up decisions required, …]
- …

## Links

<!--
* [link name](the link)
* … numbers of links can vary
-->
```

ADRs **SHOULD** attempt to follow this overall format if possible, but ADRs
**MAY** deviate from it if necessary.
