# React Hook Arguments Convention

- **State:** Approved
- **Created:** 2022-12-30
- **Tags:** react, react-hooks

## Context

### Positioned Arguments vs. Single Argument

Positioned arguments, meaning `function (arg1, arg2, arg3)`, suffer from the
problem that they don’t have names when you use them as a caller, working only
for simple situations with one or maybe two arguments.

Having one or two arguments is rarely the case, and even that, needs
clarification. For example, given the following hook
calling `useFetchPerson(arg1, arg2)`, you can not tell what is what by just
looking at the shape vs. `useFetchPerson({firstName: "", lastName: ""})` having
an object brings more clarity because the keys have names.

Objects allow you to avoid breaking changes since you can always add new keys
without removing or renaming the old ones in the worst case and without having
to refactor so much all over the place.

When you are inside the hook (unless you have a destructuring assignment due to
default values), having a single variable that lets you know what values are
static is beneficial since the cognitive load to figure out what are computed
values and what is pass-thru is lower if you see `props.[name of something]` you
can assume it is a static value, which is passed to your hook. Knowing that you
will need to look up outside the hook if you have an issue or want to see where
the value comes from is straightforward.

### Naming the argument

Since, by convention, in a React Component, you call the single argument
`props`, and in a React codebase, you will enter and leave the React context,
it is better to keep the single argument named `props` in a hook as well. The
`props` name is generic enough that it still makes sense, and it keeps the
clarity around the React codebase, which is the static value that comes from a
single argument.

## Resolution

- You **MUST** use a single argument in React Hooks.
- You **MUST** call the single argument `props`.
