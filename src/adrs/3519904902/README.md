---
id: "3519904902"
title: Enforcing Named Bindings in Ecto Queries
state: Approved
created: 2024-08-21
tags: [ ecto, elixir, sql ]
category: Elixir
---

# Enforcing Named Bindings in Ecto Queries

## Context

Ecto allows the use of named bindings when composing queries. We will enforce
named bindings across all queries in our codebase.

### Clarity and Readability

Named bindings indicate what each part of the query references, reducing
confusion and increasing the code's maintainability.

### Avoiding Errors

When queries are combined, positional bindings can lead to operations being
applied to the wrong entities, causing subtle bugs. Named bindings eliminate
this risk by explicitly naming each binding.

### Consistency

Adopting a standard practice across the codebase simplifies onboarding and code
reviews.

## Consequences

- Refactoring Effort: Existing queries using positional bindings will need to be
  refactored to use named bindings.
- Learning Curve: Developers need to get accustomed to consistently using named
  bindings.

## Resolution

- You **MUST** use named bindings in all Ecto queries except when impossible.

## Links

- [Ecto Query Named Bindings](https://hexdocs.pm/ecto/Ecto.Query.html#module-named-bindings)
