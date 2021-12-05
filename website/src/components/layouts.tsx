import * as React from 'react';

export function MultiColumnLayout(props: React.PropsWithChildren<{}>) {
  return <div className="flex h-screen">{props.children}</div>;
}
