---
id: '8702033095'
title: URL Path Design
state: Approved
created: 2021-12-13
tags: [seo, url, openapi]
category: General
---

# URL Path Design

## Context

The lack of alignment in URL design across products causes multiple issues in
software development.

Suboptimal SEO where some Search Engines don't recognize underscores in URLs. A
URL containing "my_page" will be indexed as "my page" (as one term) while a URL
containing "my-page" will be indexed as "my" "page" (as two terms).

Worth saying that this is primarily how Google Search Engine does things,
regardless, it is safe to say that it is prudent following Google Search
optimizations.

Suboptimal user-experience since camelCase and underscore also require the user
to use the shift key, whereas hyphenated does not on desktop keywords; and
characters like underscore are hidden behind special symbols in mobile phones
keywords.

Lack of shared tooling, forcing developers to reimplement tools or promoting
bikeshedding.

## Resolution

> These rules apply to URL Paths. URL Query Params have their own rules.

Creating "perfect software" is close to impossible. The following suggestions
may feel like suggestions because we don't have the full scope of the situation.

Therefore, you **MAY** follow the following resolutions unless you have a
technical limitation. You **MUST** assumed such rules de facto in conversations.

You **MUST** use the following characters anywhere in the path:

- U+0061 to U+007A ("a-z")
- U+0030 to U+0039 ("0-9")
- U+007E ("~")
- U+002E (".")
- U+0080 and above (non-ASCII Unicode characters; not recommended, not URL safe)

You **MAY** use the following characters are allowed in path, except as the
first or last character:

- U+002D HYPHEN-MINUS, "-"
- U+005F LOW LINE, "\_”

- You **MUST** separate terms using hyphen character
- You **MUST** use underscore for new compound words or composed terms
- You **MUST** use non-reserved characters, URL safe characters specified in
  [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986#page-13)

## Links

- [Underscores vs. dashes in URLs](https://www.youtube.com/watch?v=AQcSFsQyct8&ab_channel=GoogleSearchCentral)
- [Keep a simple URL structure](https://developers.google.com/search/docs/advanced/guidelines/url-structure)
