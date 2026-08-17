---
id: '1358452048'
title: Slots reserved React property key
state: Approved
created: 2020-12-14
tags: [react]
category: JavaScript
---

# Slots reserved React property key

## Context

You may have components that you would like the users to have control over
some underline components.

For example, let's assume that we would like to change the container and the
label components for the following component.

```tsx
function Badge(props) {
  const displayValue = '...'; // calculate something, does not matter the details

  return (
    <div className="container">
      {props.children}
      <div className="label">{displayValue}</div>
    </div>
  );
}
```

Also, although some implementations are not technically wrong, they may miss
some concern.

For example, using render function over components:

```tsx
function Badge(props) {
  const displayValue = '...'; // calculate something, does not matter the details

  return (
    <div className="container">
      {props.children}
      {props.renderLabel({ className: 'label', children: displayValue })}
    </div>
  );
}
```

In the previous example, React loses the ability to figure out if the component
needs to be re-rendered since it is no longer a component but a function call.

Also, subjectively speaking, it feels non-React since we lose the JSX syntax.

We have no alignment in how to accomplish the tasks, which means people have to
learn new idioms across codebase even when the intention is the same.

What key should we use for this? Should we pass a function or a component, or
something else? Defining the TypeScript definitions and so on.

## Resolution

- You **MUST** use `slots` key in React props to pass custom components.
- The `slots` **MUST** be an object.
- The `slots` object key **MUST** in pascalCase.
- The `slots` object value **MUST** a React component.

## Example

You could reuse the helper across your system. The mapped type constraint keeps
every slot value a component, and it accepts slot maps declared as either a type
alias or an `interface`.

```tsx
import * as React from 'react';

type PropsWithSlots<P, S extends { [K in keyof S]: React.ElementType }> = P & {
  slots?: Partial<S>;
};
```

Each slot declares the props the component hands down to it, which is the reason
to reach for a slot in the first place: the replacement renders state only the
component can compute.

Pick the slot type by what the slot receives. A structural slot passing nothing
but `className` and `children` is a `React.ElementType`, so an intrinsic element
fills it. A slot receiving computed state is a `React.ComponentType`, because an
intrinsic element would forward that state to the DOM as unknown attributes.

```tsx
type BadgeSlots = {
  root: React.ElementType<{
    className: string;
    children: React.ReactNode;
  }>;
  label: React.ComponentType<{
    className: string;
    counter?: number;
    overflowed: boolean;
    children: string;
  }>;
};

type BadgeProps = React.PropsWithChildren<
  PropsWithSlots<
    {
      counter?: number;
    },
    BadgeSlots
  >
>;

function BadgeLabel(props: { className: string; children: string }) {
  return <span className={props.className}>{props.children}</span>;
}

export function Badge(props: BadgeProps) {
  const overflowed = (props.counter ?? 0) > 99;
  const displayValue = overflowed ? '99+' : String(props.counter ?? 0);
  const Root = props.slots?.root ?? 'div';
  const Label = props.slots?.label ?? BadgeLabel;

  return (
    <Root className="container">
      {props.children}
      <Label className="label" counter={props.counter} overflowed={overflowed}>
        {displayValue}
      </Label>
    </Root>
  );
}
```

A slot reads whichever passed down props it cares about and ignores the rest,
the way `BadgeLabel` ignores `counter` and `overflowed`.

```tsx
function TonedLabel(props: { className: string; overflowed: boolean; children: string }) {
  return <span className={props.overflowed ? `${props.className} warn` : props.className}>{props.children}</span>;
}

function Inbox() {
  return (
    <>
      <Badge counter={2}>Inbox</Badge>
      <Badge slots={{ root: 'section' }} counter={2}>
        Inbox
      </Badge>
      <Badge slots={{ label: TonedLabel }} counter={140}>
        Inbox
      </Badge>
    </>
  );
}
```

The contract rejects the slots the component cannot render.

```tsx
// @ts-expect-error a slot receiving computed state cannot be an intrinsic element
const a = <Badge slots={{ label: 'span' }} />;
// @ts-expect-error the slot cannot demand props the component does not pass
const b = <Badge slots={{ label: (props: { className: string; children: string; tone: string }) => null }} />;
// @ts-expect-error unknown slot key
const c = <Badge slots={{ header: 'div' }} />;
```
