---
id: '5541831634'
title: React project files and directories names convention
state: Approved
created: 2020-12-01
tags: [react]
category: JavaScript
---

# React project files and directories names convention

## Context

Across the ecosystem, we can find all sorts of files and directory naming
conventions in React projects. The variety of conventions causes misalignment
and shifts focus away from more important matters.

Although there are no silver bullets for this topic, committing to a convention
will reduce cognitive load by triggering pattern recognition, enabling engineers
to focus their brainpower on their tasks.

### Consistency, Predictability and Familiarity

Consistency and Predictability are key to reducing cognitive load and
facilitating the onboarding process.

More often than not, "familiarity" is what people call "Good Developer
Experience", and we believe that is good thing, imagine if JavaScript
Programming Language Runtimes move around modules and global objects, change the
syntax of the language, or change the meaning and behavior of built-in
functions based on personal preferences, that would be a nightmare. We wouldn't
be productive if we had to pay attention to every single detail
every time we write code.

We also believe that "Familiarity" does not mean "Perfection", and there is
a cost to learning and adapting to a new convention,

But we believe that the cost is worth it in the long run. Although, the ADR may
feel overwhelming at first, we promise that it will become second nature after a
while, and some of the rules will lead you to a codebase that barely changes
over time. They are that many ways to configure i18n

### Strong Cohesion, Controlled Coupling, and Risk Mitigation

When something goes wrong, we need to add, remove, update or fix a use case; we
need to answer the simple question:

- Where do we need to do that?

The simplest way to answer that question is to ask which [Route](#route) is
involved, and work your way up or down the Application Tree.

For that reason, we need to have a strong cohesion and controlled coupling of
the files between the routes is critical. The higher your changes are in the
Application Tree, the more risk you are introducing to the application.
The lower your changes are in the Application Tree, the less risk you are
introducing to the application since the changes are more isolated.

Probably the most important part of the ADR is the fact that you can not import
or have circular dependencies between sibling routes, you will require to move
the files to a common root directory that is a parent to the routes. Signaling
that the files are shared between the routes and that the files are increasing
the risk of the application.

### Server vs. Client

We should treat the server-side as the default rendering strategy, we opt-in to
the client-side when we need to. Therefore, we discourage the naming convention
around `*.server`. That means that we should create `*.client` files.

## Resolution

- You **MUST** not import between routes. You **MUST** use colocate the
  files to a common root directory that is a parent to the routes.
- You **MUST** not have circular dependency between sibling directories. You
  **MUST** use a common root directory that is a parent to the sibling
  directories.
- You **MUST** use `<rootDir>/src/@types` to store TypeScript definition files
  (`*.d.ts`).
- You **MUST** use `<rootDir>/src/polyfills` to store polyfills.
- You **MUST** use `_` as a prefix for [Private Directories](#private-directory) under
  `<rootDir>/src/app` to opt-out of the routing system.
- You **SHOULD** avoid re-exporting files, and you **SHOULD** use the file
  directly.
- You **SHOULD** use relative imports when importing sibling files or nested
  to under the same parent directory.
- You **SHOULD** use absolute imports when importing from a different parent
  directory.
- You **MUST NOT** use [Private Directories](#private-directory)
  inside `<rootDir>/src/libs/[lib name]`.
- You **MUST** use `__tests__` for testing support files under `<rootDir>/src`.
- You **MUST** colocate Component's Unit Test sibling to component file by using
  `[component name].test.[extension]`.
- You **MUST** use `*.client.[extension]` to store client-side files.
- You **MUST NOT** use `*.server.[extension]` suffix.

### Libraries Only

- You **MUST** use `<rootDir>/src/libs/[lib name]` to
  store [Libraries](#libraries).
- You **SHOULD** wait until you have at least two consumers with the exact same
  code in production for at least two months, that required the same changes
  to be made in all two consumers before adding anything to
  a `<rootDir>/src/libs/[lib name]`.
- You **SHOULD** wait until you have at least three consumers with the exact
  same
  code in production for at least three months, that required the same changes
  to be made in all two consumers before moving
  a `<rootDir>/src/libs/[lib name]`
  to a separate package.
- You **MUST** not have circular dependencies between [Libraries](#libraries).

### Next.js Only

- You **MUST** use Next.js App Router directory structure.
- You **MUST NOT** use Next.js Pages Router directory structure.
- You **MUST** use `<rootDir>/src/app` directory to store the Next.js Router.
- You **MUST** use `<rootDir>/public` to store static files.
- You **MUST NOT** import Server Action files from another Server Action file.
- You **MUST NOT** call a Server Action function from another Server Action
  function.
- You **MUST** use `*Client` suffix for Component's name to indicate that the
  component is a client-side component when the name overlaps with the
  server-side component.

### React Native Only

- You **MUST** use Expo Router directory structure.
- You **MUST** use `<rootDir>/src/app` directory to store the Expo Router.
- You **MUST** use `<rootDir>/src/assets` to store assets files.
- You **MUST NOT** use `<rootDir>/assets` to store assets files.

### Vite Only

Related to Vite projects only.

- You **MUST** use `<rootDir>/src/app/index.tsx` as the entry point for the Vite
  application.

### Fractal Pattern

A fractal pattern is a pattern that you could repeat over and over again.

- You **MUST** follow the fractal pattern under the `<rootDir>/src`,
  `<rootDir>/src/app`, `<rootDir>/src/components/[component name]`, and
  `<rootDir>/src/libs/[lib name]` directories.
- You **MUST** prefix all directories under `<rootDir>/src/app` with `_` to
  opt-out of the routing system and define the directory as
  a [Private Directory](#private-directory).

- You **MUST** use `<fractalDir>/services` to store anything
  related to any communication with [External Services](#external-services).
- You **MUST** use external service brand name as a file or subdirectory in
  `<fractalDir>/services/[service name]`.

- You **MUST** use `<fractalDir>/storages` to store anything related to the
  device. You **MUST** use `local`, `session`, `cookies`, `websql`, and
  `indexeddb` as subdirectories based on the storage type.
- You **MUST** use `<fractalDir>/schemas` to store anything related to Joi, Yup
  schemas or any similar package.

- You **MUST** use `<fractalDir>/components` to store reusable React components.
- You **MUST** use `<fractalDir>/hooks` to store reusable React hooks.
- You **MUST** use `<fractalDir>/contexts` to store React contexts definitions.
-
- You **MUST** use `<fractalDir>/constants` to store constants variables.
- You **MUST** use `<fractalDir>/types` to store reusable TypeScript types.
-
- You **MUST** use `<fractalDir>/styles` to store components styles such as
  CSS or Stylesheets.
- You **MUST** colocate CSS Module Component's Styles sibling to component file
  with the following naming convention `[component name].module.[extension]`.
- You **MUST** use `<fractalDir>/assets` to store files such as images, fonts,
  and any other files that are no Stylesheets or JavaScript files.

- You **MUST** use `<fractalDir>/i18n` to store anything
  related to Internationalization.
- You **MUST** use `<fractalDir>/i18n/messages` to store the i18n messages.
- You **MUST** use `<fractalDir>/i18n/datetime` to store i18n date
  and time formatting. Read more about the intent
  at [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
- You **MUST** use `<fractalDir>/i18n/list` to store i18n sensitive
  list formatting. Read more about the intent
  at [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat).
- You **MUST** use `<fractalDir>/i18n/numbers` to store i18n number
  formatting. Read more about the intent
  at [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat).
- You **MUST** use `<fractalDir>/i18n/plural` to store i18n
  pluralization formatting. Read more about the intent
  at [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules).
- You **MUST** use `<fractalDir>/i18n/relative-time` to store i18n
  relative-time formatting. Read more about the intent
  at [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat).

- You **MUST** use `<fractalDir>/helpers/datetime` to store anything related
  to Dates or Times. Except formatters, use `<fractalDir>/i18n/datetime`
  instead.
- You **MUST** use `<fractalDir>/helpers/currency` to store anything related
  to currency. Except formatters, use `<fractalDir>/i18n/numbers`
  instead.
- You **MUST** use `<fractalDir>/helpers` to store anything that does not
  fall into any of the other helper directory categories.

#### Next.js Fractal Pattern

Related to Next.js projects only.

- You **MUST** use `<fractalDir>/server` to store anything related to the
  Next.js server-side code.
- You **MUST** add `'use server;'` directive and `import 'server-only';` to the
  top of the files under `<fractalDir>/server`. Example:

    ```typescript
    'use server';
    import 'server-only';
    ```

- You **MUST** use `<fractalDir>/server/actions` to store anything related to
  Next.js Server Actions.

## Terminology

### Libraries

Libraries are a set of shared
code `intended to be moved to a separate package in the future.`

### Route

A Route, in the context of React DOM, Route is a path or segments of URL that
the
user is visiting.

A Route, in the context of React Native, it is a screen.

### External services

Any piece of software external to your application that crosses some network
boundary such as APIs, 3rd party tools (Google Analytics, Sentry), and so on.

### Private Directory

A Private Directory is a directory that should not be considered by the routing
system, thereby opting the directories and all its subdirectories out of
routing system. This is inspired by the Next.js App Router directory structure.
