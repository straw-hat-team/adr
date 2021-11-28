import * as React from 'react';
import clsx from 'clsx';

export function MultiColumnLayout(props: React.PropsWithChildren<{}>) {
  return <div className="flex h-screen">{props.children}</div>;
}

export function Panel(
  props: React.PropsWithChildren<{
    as?: 'aside' | 'main';
    scrollable?: boolean;
    className?: string;
  }>
) {
  const Component = props.as ?? 'aside';
  return (
    <Component className={clsx('focus:outline-none relative', props.className)}>
      <div className="flex-1 flex absolute inset-0 top-0 overflow-y-auto">{props.children}</div>
    </Component>
  );
}
