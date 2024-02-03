---
id: '5508488323'
title: Lodash Importing
state: Approved
created: 2022-03-21
tags: [javascript]
---

# Lodash Importing

## Context

Lodash could become quite large in the final bundle of your application.

Default or destructuring imports from `lodash` are not tree-shaking friendly,
therefore, you will end up bundling all the functions from the package.

```ts
import _ from 'lodash'; // bad
import { merge } from 'lodash'; // bad
```

[Lodash team mentioned that you could import the submodule, or rely on a Babel plugin](https://lodash.com/per-method-packages)
. Using the Babel plugin requires build-tool knowledge, and it is less explicit
about the intention. Saving little to no time over typing the submodule.

## Resolution

- You **MUST** import from the submodules of the `lodash` package:

  ```ts
  import funcNameExample from 'lodash/func-name-example';
  ```
