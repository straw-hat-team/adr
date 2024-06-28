---
id: 6463438533
title: Standard fields
state: Reviewing
created: 2024-06-28
tags: [api, standard-field]
category: Platform
---

# Annotations Standard Field

## Context

Certain concepts are common throughout any corpus of APIs. In these situations,
it is useful to have a standard field name and behavior that is used
consistently to communicate that concept.

Annotations are a common concept in APIs. They are used to store arbitrary data
that is not part of the core API definition. This data is typically used by
client tools to store their own state information without requiring a database.

You can find this pattern across multiple APIs, such as Kubernetes, Stripe
Metadata.

The `annotations` field **MUST** use the [Kubernetes limits][0] to maintain wire
compatibility, and **SHOULD** require dot-namespaced annotation keys to prevent
tools from trampling over one another.

Examples of information that might be valuable to store in annotations include:

- For CI/CD, an identifier of the pipeline run or version control identifier
  used to propagate.

**Note:** Annotations are distinct from various forms of labels. Labels can be
used by server-side policies, such as IAM conditions. Annotations exist to
allow client tools to store their own state information without requiring a
database.

## Resolution

- You **MUST** use the `annotations` field to store arbitrary data, a `map<string, string> annotations`
  field **MAY** be added.
- You **MUST** use the [Kubernetes limits][0] to maintain wire compatibility.
- You **SHOULD** require dot-namespaced annotation keys to prevent tools from
  trampling over one another.
- You **MUST NOT** use annotations for information that is used by server-side
  policies.

## Links

- [Kubernetes limits][0]

[0]: https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/#syntax-and-character-set
[1]: https://docs.stripe.com/metadata
