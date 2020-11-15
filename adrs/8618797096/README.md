# Usage of JSX Fragment

* **State:** Draft
* **Created:** 2020-11-15
* **Tags:** jsx

## Context

Today we have a way to specify fragments in our React code base.

1. Using `Fragment` from React import:

    ```tsx
    import React from 'react';
    function MyApp() {
      return (
        <React.Fragment></React.Fragment>
      )
    }
    ```

2. Using JSX fragment short syntax:

    ```tsx
    import React from 'react';
    function MyApp() {
       return (
        <></>
      )
    }
   ```

Since React introduced JSX to our toolkit, multiple libraries have adopted JSX,
for example a really popular alternative to React: [Preact](https://preactjs.com/).

Even TypeScript [introduced a way to specify the Fragment factory](https://github.com/microsoft/TypeScript/pull/38720)
to allow people to have more control over the compiled JSX code.

## Resolution

You `must` use JSX fragment short syntax `<></>`.
