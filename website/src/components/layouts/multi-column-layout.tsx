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
    <Component tabIndex={-1} className={clsx('relative', props.className)}>
      <div tabIndex={-1} className="flex-1 flex absolute inset-0 top-0 overflow-y-auto">
        {props.children}
      </div>
    </Component>
  );
}
