import React, { useMemo } from 'react';
import { getMDXComponent } from 'mdx-bundler/client';
import { ComponentMap } from 'mdx-bundler/dist/client';

type MDXProps = {
  source: string;
  slots?: ComponentMap;
};

export function MDX(props: MDXProps) {
  const Component = useMemo(() => getMDXComponent(props.source), [props.source]);
  return <Component components={props.slots} />;
}
