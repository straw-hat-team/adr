# Configuration of baseUrl and paths of jsconfig/tsconfig files in applications

* **State:** Draft
* **Created:** 2020-11-18
* **Tags:** tsconfig,jsconfig,application

## Context

First, let's define the meaning of `application` in this context:

**Applications:** a deployable project that is not used as a library of another
project.

Current, most JavaScript tools use `<rootDir>/tsconfig.json`, or
`<rootDir>/jsconfig.json` to help the IDEs or tools to resolve the file locations
use the following two configurations:

* **compilerOptions.baseUrl:** Base directory to resolve non-relative module
  names.
* **compilerOptions.paths:** Specify path mapping to be computed relative to
  baseUrl option.

For example:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Let's assume the following directory structure as a reference for the examples:

```text
tree . -L 2

├── tsconfig.json
├── src
│   ├── components/...
│   ├── design/...
│   └── react-query/...
│   └── http-client.ts
```

There are some caveats configuring such files.

For example, using the following configuration:

```json
{
  "compilerOptions": {
    "baseUrl": "src"
  }
}
```

That means, you could import the code as if those files or directories were
modules:

```tsx
import { httpClient } from 'http-client';
import { useMyQuery } from 'react-query';
```

That configuration brings some critical questions about the application.

How do we know if those imports come from `node_modules` or the imports are
part of our codebase?

Although it may be simply to answer the question by scanning the directories and
files under `./src`.

In other cases like `import { useMyQuery } from 'react-query';` where you
may have `react-query` as a dependency, and you used `./src/react-query`
directory to store your React Query related things as an example, you need to
scan the files to make sure that the imports don't belong to a dependency
package.

Furthermore, how does the module resolve resolution works?

It may not be possible to answer such a question without knowing the underline
tools configurations.

It may be the case that a tool would scan `./src` first, and then `node_modules`,
or vice-versa.

That means that you may be overwriting dependency packages in cases that you
use the same name of a dependency package as name of a directory allocated in
`./src`, introducing potential bugs that are hard to track without knowing
the underline tool.

You may also run into such issues by changing `compilerOptions.paths` instead,
for example:

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "design/*": ["./src/design/*"]
    }
  }
}
```

```tsx
import { goldenRatio } from 'design/golder-ratio';
```

Same questions,

* How do we know if those imports come from `node_modules` or it is part of our
  codebase?
* How does the module resolve resolution works in cases when somebody installs
  `design` package as a dependency?

The underline problem is registering a valid NPM package name as an alias,
that introduce cognitive load, and potentially becoming more error-prune,
relying on engineer maturity to understand how to debug, and outcome the
potential issues.

As the application grows, such practice makes the development harder, and also
make the tools slower since it will require to scan `node_modules` for those
aliases as well since it may be the case that those modules are a dependency
module.

## Resolution

Since `@/` is not a valid NPM package, it is popular among other projects as
well.

* You **must** never change `baseUrl` from the root of the project.
* You **must** use the following configuration to resolve files relative to the
  root of the project:

    ```jsonc
    {
      "compilerOptions": {
        "baseUrl": ".", // The baseUrl is at the root of the project
        "paths": {
          "@/*": ["./src/*"]
        }
      }
    }
    ```

## Links

* [jsconfig.json](https://code.visualstudio.com/docs/languages/jsconfig)
* [tsconfig.json](https://www.typescriptlang.org/tsconfig)
