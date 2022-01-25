# React Component and Hooks Props Naming

* **State:** Approved
* **Created:** 2022-01-24
* **Tags:** react

## Context

When it comes to React, they are two categories of properties:

* Data (Information)
* Callbacks (Events, Control Flow)

Data properties are primarily used for displaying information or transforming
into another set of data.

Callbacks are used to control the flow of data. Functions such
as`onFilterAccount` and `onSortBy` would be used to filter and sort data.
Callbacks can also react to events. The browser already makes a distinction
between data and callback properties by prefixing the event handlers with `on`,
for example: `onClick`, `onChange`, etc. The `on` prefix is used to indicate
that the property is a callback and the component or hook controls the execution
of the callback.

Understanding a React component API allows engineers to focus their attention on
more important manners such as the business requirements.

When it comes to debugging problems in production and minified code where
finding where the problem is a challenge and time critical. Being able to reduce
the cognitive load reading through the code base is crucial.

Inconsistent property naming promotes bikeshedding, which slows down software
development cycles in code review and results in unnecessary disagreements
between developers.

## Resolution

* React Component and Hook `data` properties **MUST** be a noun.
* React Component and Hook `callback` properties **MUST** a verb prefix
  with `on`.
