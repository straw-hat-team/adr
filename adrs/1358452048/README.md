# Slots reserved React property key

* **State:** Approved
* **Created:** 2020-12-14
* **Tags:** react

## Context

You may have components that you would like the users to have control over
some underline components.

For example, let's assume that we would like to change the container and the
label components for the following component.

```tsx
function Badge(props) {
  const displayValue = '...' // calculate something, does not matter the details

  return (
    <div className="container">
      {props.children}
      <div className="label">
        {displayValue}
      </div>
    </div>
  )
}
```

Also, although some of the implementations are not technically wrong, they may
miss some concern.

For example, using render function over components:

```tsx
function Badge(props) {
  return (
    <div className="container">
      {props.children}
      {props.renderLabel({ className: 'label', children: displayValue })}
    </div>
  )
}
```

In the previous example, React loses the ability to figure out if the component
needs to be re-render since it is no longer a component but a function call.

Also, subjectively speaking, it feels non-React since we lose the JSX syntax.

We have no alignment in how to accomplish the tasks, which means people have to
learn new idioms across codebase even when the intention is the same.

What key should we use for this? Should we pass a function or a component, or
something else? Defining the TypeScript definitions and so on.

## Resolution

* You **must** use `slots` key in React props to pass custom components.
* The `slots` **must** be an object.
* The `slots` object key **must** a valid component name.
* The `slots` object value **must** a React component.

## Example

```tsx
import * as React from 'react';

// You could reuse this across your system
type PropsWithSlots<
  C extends Partial<{ [key: string]: React.ElementType; }>,
  P
> = P & {
  slots?: C;
};

// Define the slots for your component
type BadgeSlots = Partial<{
  Root: React.ElementType<{
    className: string
  }>;
  Label: React.ElementType<{
    className: string;
    counter?: number;
    something: any;
    children: string;
  }>;
}>;

type BadgeProps = React.PropsWithChildren<
  PropsWithSlots<
    BadgeSlots,
    {
      counter?: number;
      something?: any;
    }
  >
>;

export function Badge(props: BadgeProps) {
  const displayValue = '...' // calculate something, does not matter the details
  const Root = props.slots?.Root ?? 'div';
  const Label = props.slots?.Label ?? DefaultLabel;

  return (
    <Root className="container">
      {props.children}
      <Label
        className="label"
        counter={props.counter}
        something={props.something}
      >
        {displayValue}
      </Label>
    </Root>
  )
}
```
