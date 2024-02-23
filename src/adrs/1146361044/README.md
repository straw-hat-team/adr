---
id: '1146361044'
title: Helper vs Util
state: Approved
created: 2022-07-11
tags: [naming]
category: General
---

# Helper vs Util

## Context

At some point in your career you came across the debate of "Utils" vs "Helpers".

Which one should you use in our code?

Giving the opportunity to bikeshedding, and/or creating diverging codebases
across the organization.

We decided that across all the codebases we will be using `Helper`, regardless
of the programming language or ecosystem.

There is no right or wrong answer here, just a matter of preferences and stick
to a single way because it doesn't really matter which one you use except that
it will matter for some at some point in their life, and it is not worth the
debate in the long-term.

## Resolution

- You **MUST** use `Helper(s)` over `Util` across all the codebases.
