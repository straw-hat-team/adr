---
id: '4860595695'
title: Human-Readable IDs
state: Approved
created: 2024-03-24
category: Platform
tags: [id]
---

# Human-Readable IDs

## Context

Choosing the right type of IDs for APIs affects usability, security, and
developer experience. Working with just UUIDs, integers, or random characters
can be cumbersome and error-prone. These IDs are often hard to remember, debug,
and integrate with other systems because they lack context about the resource
type.

That difficulty is exacerbated for Business Analysts dealing with massive
amounts of data from different sources, needing to understand the data structure
and relationships between resources. Or for developers without much experience
working with the system or domain.

Polymorphic values are a common pattern where you need to fetch a resource by
its ID without knowing the resource's type. Some APIs use a hash map to store
the type and ID, but this approach lacks human readability, requiring the type
and ID to be printed together for usefulness.

In distributed systems, simplifying data understanding is critical. Whether
using ETL software, data warehouses, or freelancers who don't have time to learn
all the data combinations, it's important to keep data self-sufficient and
easily understandable.

### Positive Consequences

- Usability: Easier for humans to read, remember, and use.
- Debugging: Simplifies identifying and understanding issues.
- Integration: Eases integration with other systems by providing context.

### Negative Consequences

- Potential Length: Human-readable IDs might be longer.

## Resolution

- You **MUST** use a human-readable ID as a single value to identify a resource.
- You **MUST** include the resource type as a prefix in the ID.
- You **MUST** `[resource type]_[resource id]` as the format for human-readable
  IDs.

## Links

- [Designing APIs for humans: Object IDs](https://dev.to/stripe/designing-apis-for-humans-object-ids-3o5a)
- [About Data vs. Information](https://strawhatllc.notion.site/Data-Information-Knowledge-and-Wisdom-142b2220e11d8004a842fd982fde319c)
