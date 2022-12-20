# JSX files extension

- **State:** Approved
- **Created:** 2020-12-01
- **Tags:** jsx

## Context

In some cases, people use `.js` extension with files containing JSX syntax.

As of today, JSX syntax is not valid JavaScript, and using `.js` over `.jsx`
breaks many tools that use `.jsx` files in order to switch the parsers to support
JSX.
In the best case, the tools allow you to configure the default parser for
the files, but that is rarely done in services where they do basic parsing or
relying on extensions in order to swap the parsers.

## Resolution

- You **MUST** use `.jsx` file extension when the file contains JSX.
