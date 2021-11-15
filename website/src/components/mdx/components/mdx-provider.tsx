import { PropsWithChildren } from 'react';
// @ts-ignore
import { MDXProvider as MDXProviderBase } from '@mdx-js/react';
import { DEFAULT_COMPONENTS } from '@/components/mdx/constants';

export function MdxProvider(props: PropsWithChildren<{}>) {
  return <MDXProviderBase components={DEFAULT_COMPONENTS}>{props.children}</MDXProviderBase>;
}
