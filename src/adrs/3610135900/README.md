---
id: '3610135900'
title: Secret Value Syntax
state: Approved
created: 2023-08-13
tags: [secret]
---

# Secret Value Syntax

## Context

The current ecosystem lacks a standardized format for secret values. This
decentralization of secret format decisions leads to a situation where
developers often define the format themselves. Such a disparate approach results
in many developers either forgetting to set up scanning tools or being unable to
utilize preconfigured scanning tools.

The lack of a consistent secret format hinders tools that would otherwise help
guard against vulnerabilities and potential security risks. The changes in
GitHub Authentication Token Formats, among other companies adding more
meaningful prefixes to their secrets, highlight the need for a more standardized
approach.

### Decision Drivers:

**Security:** A standard format would enable more effective use of secret
scanning tools, reducing the chances of leaks or unauthorized access.

**Consistency:** A consistent secret format can streamline processes and reduce
the chance of human error.

**Usability:** Developers can more easily take advantage of preconfigured
scanning tools with a standardized format.

## Resolution

The agreed-upon structure will be similar to the URN syntax:

```txt
SECRET = "secret:[NID]:[NSS]:[secret value]
```

- "secret:" is the required case-sensitive scheme at the beginning.
- NID (Namespace Identifier) defines the specific context or namespace.
  It is an optional case-sensitive and consist of only lower case alphanumeric
  characters and dashes value. Regex: `[a-z0-9-]`.
- NSS (Namespace-Specific String) is unique within the specific namespace.
  It is an optional case-sensitive and consist of only lower case alphanumeric
  characters and dashes value. Regex: `[a-z0-9-]`.

The secret regex value is:

```txt
^secret:(?:[a-z0-9-]*):(?:[a-z0-9-]*):(.+)$
```

For example, a Personal Access Token for GitHub could be in the format:

```txt
secret:github:ghp:ghp_000000000000000000000000000000000000
```

## Links

- <https://docs.github.com/en/enterprise-cloud@latest/code-security/secret-scanning/defining-custom-patterns-for-secret-scanning>
- <https://github.blog/changelog/2021-03-31-authentication-token-format-updates-are-generally-available/>
- <https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning>
- <https://support.discord.com/hc/en-us/articles/10069840290711>
