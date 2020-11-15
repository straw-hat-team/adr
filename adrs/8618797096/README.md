# Usage of JSX Fragment

* **State:** Draft
* **Created:** 2020-11-15
* **Tags:** jsx

## Context

Today we have a way to specify fragments in our React, Preact code base or
any other library that adopts such technology.

1. Using `Fragment` from React import:

    ```tsx
    import { Fragment } from 'react';
    function MyApp() {
      return (
        <Fragment></Fragment>
      )
    }
    ```

2. Or importing everything:

    ```tsx
    import * as React from 'react';
    function MyApp() {
      return (
        <React.Fragment></React.Fragment>
      )
    }
    ```

3. Using JSX fragment short syntax:

    ```tsx
    function MyApp() {
       return (
        <></>
      )
    }
   ```

There is no rules about this introducing inconsistency in the code base, or in
some cases refactoring of the import style is needed.

Also, as mentioned before, since React introduced JSX to our toolkit, multiple
libraries have adopted JSX, for example a really popular alternative to React:
[Preact](https://preactjs.com/).

Even TypeScript [introduced a way to specify the Fragment factory](https://github.com/microsoft/TypeScript/pull/38720)
to allow people to have more control over the compiled JSX code.

Using `React.Fragment` couples the JSX to React, although most of your code will
probably never move to another library like Preact, the usage of
`React.Fragment` introduces more fragmentation in the ecosystem with little
benefits from it.

## Resolution

* You `must` use JSX fragment short syntax `<></>`.
