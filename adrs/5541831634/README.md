# React project files and directories names conversion

* **State:** Draft
* **Created:** 2020-12-01
* **Tags:** react

## Context

Across the ecosystem, we can find all sort of files and directories naming
conversions in React projects.

That has caused misalignment, shifting the focus away from more important
matters.

Although there is no silver bullet for this topic, it helps create some
conventions that aim to reduce cognitive load based on patterns that trigger
pattern recognition. Enabling engineers to perform their tasks.

## Resolution

* You **must** follow [NodeJS files and directories names conversion](./../3122196229/README.md)
* You **must** use `<rootDir>/src/pages` for [NextJS pages](https://nextjs.org/docs/basic-features/pages)
  directory.
* You **must** use `<rootDir>/src/routes` for managing the entry point of a
  particular URL routing, or screen routing.
* You **must** use `<rootDir>/src/services/[service name]/*` to store anything
  related to any communication with [external services](#external-services).
* You **must** use `<rootDir>/src/components/*` to store reusable React
  components.
* You **must** use `<rootDir>/src/hooks/*` to store reusable React
  hooks.
* You **must** use `<rootDir>/src/types/*` to store reusable TypeScript types.
* You **must** use `<rootDir>/src/@types/*` to store reusable TypeScript
  definition files.
* You **must** use `<rootDir>/src/styles/*` to store components styles such as
  CSS or Stylesheets.
* You **must** use `<rootDir>/src/constants/*` to store constants variables.
* You **must** use `<rootDir>/src/helpers/*` to store anything that does not
  fall into any of the other directories.

### Example

```text

```

## Terminology

### External services

Any piece of software external to your application that requires some network
boundary such as APIs, 3rd party tools (Google Analytics, Sentry).

## Links

## NOTES

Add info about fractal patterns for most of these directories

What about adding:

* src/providers/

* src/schemas/
  * yup
  * joi
* src/helpers/dates
  * src/helpers/dates/formatter
* src/helpers/numbers
  * src/helpers/numbers/formatter

* src/helpers/http-client
* src/helpers/socket-client
* src/helpers/apollo-client

* src/helpers/react-router
* src/helpers/react-queries/
* src/helpers/redux/
* src/helpers/localstorage
* src/helpers/i18n
* src/helpers/logger

How should we manage React Context since it contains potential hooks, and
components. (Share pattern used across react admin tool).
