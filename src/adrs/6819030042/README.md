---
id: '6819030042'
title: Acronyms Usage
state: Approved
created: 2024-09-27
tags: [ naming, acronyms ]
category: Platform
---

# Acronyms Usage

## Context

Inconsistency in the usage of acronyms within codebases leads to debates over
naming conventions, making code reviews and collaboration more
challenging—especially for non-native English speakers. Promoting unnecessary
discussions and detracts from more critical development tasks.

A simple internet search reveals numerous conflicting opinions on how to handle
acronyms in naming conventions. For example, consider XMLHttpRequest from
browser APIs.

- Which naming convention provides the best readability and consistency?
- How should acronyms be integrated into different casing styles like camelCase,
  PascalCase, or snake_case?
- How should acronyms be handled in programming languages with strict naming
  conventions, such as Go?

In Go, for instance, `type HTTPHeader` and `type httpHeader` are not the same,
which can lead to errors. This is because Go uses the visibility of the first
letter to determine whether a variable or function is public or private. This
means that `HTTPHeader` is public, while `httpHeader` is private.

Should it be `type hTTP`?

Familiar acronyms will be understood regardless of their form. Until we
encounter quantifiable and quantifiable evidence that one form is more readable
than another, we are moving forward with the following guidelines.

## Resolution

- You **MUST NOT** use upper case acronyms in names in source code across all
  languages, regardless of their preferred casing style.
  - Except for technical limitations
  - Except for declaring constants in all caps, where the acronym is part of the
    name.
- You **MAY** use proper acronyms spelling in documentation.
- You **MAY** spell out the acronym provided they are defined upon first use
  within the documentation.

## Examples

- Instead of `XMLHttpRequest`, use `XmlHttpRequest`.
- Instead of `HTTPServer`, use `HttpServer`.
- Instead of `URL`, use `Url`.
- Instead of `ID`, use `Id`.
- Instead of `API`, use `Api`.
- Instead of `TCP`, use `Tcp`.
- Instead of `HTTP`, use `Http`.
- Instead of `JSON`, use `Json`.
- Instead of `HTML`, use `Html`.
- Instead of `CSS`, use `Css`.
- Instead of `CLI`, use `Cli`.
