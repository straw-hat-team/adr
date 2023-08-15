# JavaScript Modules exports convention

- **State:** Approved
- **Created:** 2021-02-17
- **Tags:** js,ts

## Context

We don't have a consistent way to export a module's functions and variables
across the JavaScript ecosystem. Teams that don't choose a camp are inflicting
an unnecessary cognitive load on themselves.

What is one of the most challenging things in computer science? Naming.

Using default-exports over named-exports forces the user to think about the name
of the import.

Let's use the following example:

```ts
import [name here] from 'base-button'
```

What should be the right name for the import?

- `Button`
- `baseButton`
- `BaseButton`
- `MyButton` or any other name you would like it to be

For a simple default import, you already have at least three different
variations to think about and combinations of any name for that matter.

Besides that, in some cases, you even have to think about the context of the
file.

For example, if the `base-button` is in React components, probably the right
import name would be either `Button` or `BaseButton` or anything that it uses
`PascalCase.` That is a limitation of React itself. You can not be "100% sure"
unless you inspect the file and understand the context of such default-export.

It is not a simple task; therefore, people rely on linters and code reviewers to
improve the source code's quality.

Naming is hard. When you are authoring code, do not make the consumers of your
code -- the importers of your exports -- figure out what names to use. As an
author, you have the advantage of having thought about its intent and purpose;
you are aware of its context and limitations and most likely gave it a name
inside your module. That name is good enough, and by using named exports, you
are doing your consumers a favor, by freeing them from having to rediscover that
name.

Also, using default-exports makes it harder to understand the context of things
across the codebase.

For example, take the following files:

File #1:

```ts
// Notice the import name
import Button from '...';

export function Something() {
  return (
    <>
      ...
      <Button />
    </>
  );
}
```

File #2:

```ts
// Notice the import name, it is different from the previous example
import Btn from '...';

export function SomethingElse() {
  return (
    <>
      ...
      <Btn />
    </>
  );
}
```

How confident could you be that those two imports are part of the same context
without the cognitive load of reading the imports to create such mapping in your
brain?

Answer: probably close to none.

- You may argue, How is this any different from named-exports?

Take the following files:

File #1:

```ts
import { Button } from '...';

export function Something() {
  return (
    <>
      ...
      <Button />
    </>
  );
}
```

File #2:

```ts
import { Button as Btn } from '...';

export function SomethingElse() {
  return (
    <>
      ...
      <Btn />
    </>
  );
}
```

How confident could you be that those two imports are part of the same context?

Answer: somewhat confident.

Because in the worst case, you can see the mapping from `Button` to `Btn`
happening in the code, although you are not 100% confident that `Btn` is the same
`Button` context, because you still need to know the import, you are somehow
optimistic that it may be.
There is an explicit remapping happening, helping the reader to understand that
in this file, for whatever reason, `Button` must become `Btn`.

Also, having explicit names allows IDEs to figure out what you are trying to
accomplish and give you much better autocomplete refactoring and automation.
Since those named-exports are static and don't require a runtime to figure out
the names, they can index the source code and algorithms
can take advantage of the explicitness and static nature of the names.

## Resolution

- You **MUST** use named-exports over default-exports unless some limitation
  is imposed.
- You **MUST** provide named-export and default-export for any case that
  requires default-export due a limitation, for example, React lazy
  loadable components.

## Links

- <https://esbuild.github.io/content-types/#default-interop>
