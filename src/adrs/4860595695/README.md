---
id: 4860595695
title: Object IDs
state: Draft
created: 2024-03-24
tags: [ platform ]
---

# Object IDs

## Context

Choosing the right type of IDs for APIs affects usability, security, and
developer experience.

More often than not, working with UUIDs, integers or any random characters can
be cumbersome and error-prone. It can be hard to remember, debug, and integrate
with other systems; since those IDs, most likely, do not carry any context about
the object type.
It is even harder for Business Analysts that deal with massive amounts of data
from different sources, and they need to understand the data structure and
relationships between objects.

Polymorphic values are a common pattern in APIs, where you need to fetch an
object by its ID, but you do not know the type of the object. Some APIs use
a hash map to store the type and the ID, but this approach does not add much
value, also it is not very human-readable, it requires to print the type and ID
together to be useful.

## Resolution

- You **MUST** use a human-readable ID for objects in APIs.

## Links

- [Designing APIs for humans: Object IDs](https://dev.to/stripe/designing-apis-for-humans-object-ids-3o5a)
