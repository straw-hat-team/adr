# JSX files extension

* **State:** Draft
* **Created:** 2020-12-01
* **Tags:** jsx

## Context

In some cases, people use `.js` extension with files containing JSX syntax.

As of today, JSX syntax is not valid JavaScript, and using `.js` over `.jsx`
breaks many tools that use `.jsx` files in order to switch the parsers to support
JSX. In the best case, the tools allow you to configure the default parser for
the files, but this is rarely done in services where they do basic parsing or
relying on extensions in order to swap the parsers.

## Resolution

* You **must** use `.jsx` file extension when the file contains JSX.
