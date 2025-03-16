---
id: '1475937194'
title: Pattern matching in function heads and control-flow
state: Approved
created: 2025-03-16
tags: [pattern-matching]
category: Elixir
---

# Pattern matching in function heads and control-flow

## Context

Pattern matching in function heads should be used exclusively for control flow
and not as a convenient way to extract values out of maps or structs.

This helps indicate to the reader of the code that the pattern matching
influences the control-flow of the code and as-such runtime behaviour.

This is also outlined [in the official docs as an anti-pattern](https://hexdocs.pm/elixir/main/code-anti-patterns.html#complex-extractions-in-clauses)

## Resolution

- You **MUST** pattern matching in function heads for control-flow purposes.
- You **MUST NOT** use pattern matching in function heads as a convenience for
  destructuring variables out into the function body.

## Links

- <https://hexdocs.pm/elixir/main/code-anti-patterns.html#complex-extractions-in-clauses>
