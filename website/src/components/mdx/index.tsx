import * as React from 'react';
import { getMDXComponent } from 'mdx-bundler/client';

type MDXProps = {
  source: string;
  slots?: {
    a?: React.ComponentType<React.PropsWithChildren<{ href: string }>>;
  };
};

export function MDX(props: MDXProps) {
  const Component = React.useMemo(() => getMDXComponent(props.source), [props.source]);
  // @ts-ignore TODO: https://github.com/kentcdodds/mdx-bundler/issues/91
  return <Component components={props.slots} />;
}
