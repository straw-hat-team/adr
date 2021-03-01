# React project files and directories names convention

* **State:** Approved
* **Created:** 2020-12-01
* **Tags:** react

## Context

Across the ecosystem, we can find all sorts of files and directory naming
conventions in React projects.

The variety of conventions causes misalignment and shifts focus away from more
important matters.

Although there are no silver bullets for this topic, committing to a convention
will reduce cognitive load by triggering pattern recognition, enabling engineers
to focus their brainpower on their tasks.

## Resolution

* You **must** follow [NodeJS files and directories names convention](./../3122196229/README.md)
* You **must** use `<rootDir>/src/@types` to store TypeScript definition files
  (`*.d.ts`).
* You **must** use `<rootDir>/src/app.tsx` to be your application root
  component.
* You **must** use `<rootDir>/src/polyfills` to store polyfills.
* You **must** use `<rootDir>/public` to store static files.

### NextJS

Some resolutions are related to NextJS projects.

* You **must** use `<rootDir>/src/pages` for [NextJS Pages](https://nextjs.org/docs/basic-features/pages)
  directory.
* In NextJS project, you **must** re-export a NextJS app from
  `<rootDir>/src/app.tsx` in `<rootDir>/src/pages/_app.tsx`
* In NextJS project, you **must** re-export a NextJS Documents from
  `<rootDir>/src/document.tsx` in `<rootDir>/src/pages/_document.tsx`
* In NextJS project, you **must** re-export a NextJS Documents from
  `<rootDir>/src/error.tsx` in `<rootDir>/src/pages/_error.tsx`

### Fractal pattern directories and files

A fractal pattern is a pattern that you could repeat in each nested level
directory. The pattern repeated in `<rootDir>/src`, `<rootDir>/src/routes/` or
`<rootDir>/src/components/[component name]` directories.

* You **must** use `<fractalDir>/routes` for managing the entry point of a
  route.
* You **must** use `<fractalDir>/services` to store anything
  related to any communication with [external services](#external-services).
* You **must** use external service brand name as a subdirectory in
  `<fractalDir>/services/[service name]`.
* You **must** use `<fractalDir>/components` to store reusable React
  components. You may create a directory to scope the fractal directories to
  a component, otherwise use a file.
* You **must** use `<fractalDir>/hooks` to store reusable React
  hooks.
* You **must** use `<fractalDir>/types` to store reusable TypeScript types.
* You **may** use `<fractalDir>/styles` to store components styles such as
  CSS or Stylesheets.
* You **may** colocate CSS Module component's styles next to the component
  file by using `[component name].module.[extension]`. We recommend creating
  a directory for the component definition in cases you follow this pattern.
* You **must** use `<fractalDir>/assets` to store files such as images, fonts,
  and any other files that are no stylesheets or JavaScript files.
* You **must** use `<fractalDir>/constants` to store constants variables.
* You **must** use `<fractalDir>/contexts` to store React contexts definitions.
* You **must** use `<fractalDir>/i18n` to store anything
  related to Internationalization.
* You **must** use `<fractalDir>/i18n/datetime` to store i18n date
  and time formatting. Read more about the intent at [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
* You **must** use `<fractalDir>/i18n/list` to store i18n sensitive
  list formatting. Read more about the intent at [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat).
* You **must** use `<fractalDir>/i18n/numbers` to store i18n number
  formatting. Read more about the intent at [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat).
* You **must** use `<fractalDir>/i18n/plural` to store i18n
  pluralization formatting. Read more about the intent at [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules).
* You **must** use `<fractalDir>/i18n/relative-time` to store i18n
  relative-time formatting. Read more about the intent at [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat).
* You **must** use `<fractalDir>/helpers/datetime` to store anything related
  to Dates or Times. Except formatters, use `<fractalDir>/i18n/datetime`
  instead.
* You **must** use `<fractalDir>/helpers/currency` to store anything related
  to currency. Except formatters, use `<fractalDir>/i18n/numbers`
  instead.
* You **must** use `<fractalDir>/helpers` to store anything that does not
  fall into any of the other helper directory categories. You **may** create
  your own files and directories based on your context.
* You **must** use `<fractalDir>/transports/http` to store anything
  related to HTTP transport clients.
* You **must** use `<fractalDir>/transports/web-socket` to store
  anything related to Web Socket transport clients.
* You **must** use `<fractalDir>/transports/graphql` to store
  anything related to GraphQL transport clients.
* You **must** use `<fractalDir>/storages` to store anything related to the
  device. You **may** use `local`, `session`, `cookies`, `websql`, and
  `indexeddb` as subdirectories.
* You **must** use `<fractalDir>/schemas` to store anything related to Joi, Yup
  schemas or any similar package. You **may** use **joi**, **yup** or
  package name as subdirectories.

## Routes directory structure

### Web

* `<rootDir>/src/routes/index.tsx` **must** be used as the root path
  of the URL, or the root path of your micro-frontend mounting path.

  ```text
  URL: http://acme.io/
  <rootDir>
  └── src
      └── routes
          └── index.tsx
  ```

* URL subdirectories **must** must match a subdirectory inside
  `<fractalDir>/routes`.

  ```text
  URL: http://acme.io/authors/articles
  <rootDir>
  └── src
      └── routes
          ├── authors
          │   ├── index.tsx
          │   └── routes
          │       └── articles
          │           └── index.tsx
          └── index.tsx
  ```

* Dynamic URL subdirectories **must** must match a subdirectory inside
  `<fractalDir>/routes` using `[the dynamic section identifier]` syntax. In case
  you use NextJS, you must use the same name as the dynamic NextJS route
  directory.

  ```text
  URL: http://acme.io/authors/articles/:articleId/
  <rootDir>
  └── src
      └── routes
          ├── authors
          │   ├── index.tsx
          │   └── routes
          │       └── articles
          │           ├── index.tsx
          │           └── routes
          │               └── [articleId]
          │                   └── index.tsx
          └── index.tsx
  ```

### Native

* `<rootDir>/src/routes/index.tsx`  **must** be used to define the
  `NavigationContainer` and top-level navigator.

  ```text
  <rootDir>
  └── src
      └── routes
          └── index.tsx
  ```

* Nested navigators and screens **must** must match a subdirectory
  inside `<fractalDir>/routes`. For example, given the following navigators /
  screens:

  ```text
  Stack.Navigator
    Home (Tab.Navigator)
      Feed (Screen)
      Messages (Screen)
    Profile (Screen)
    Settings (Screen)
  ```

  The directory structure **must** be:

  ```text
  <rootDir>
  └── src
      └── routes
          ├── home
          │   └── routes
          │       ├── feed
          │       │   └── index.tsx
          │       └── messages
          │           └── index.tsx
          ├── index.tsx
          ├── profile
          │   └── index.tsx
          └── settings
              └── index.tsx
  ```

## Terminology

### Route

In the context of React DOM, Route is a path or subdirectory of URL that the
user is visiting.

In the context of React Native, it is a screen.

### External services

Any piece of software external to your application that crosses some network
boundary such as APIs, 3rd party tools (Google Analytics, Sentry), and so on.
