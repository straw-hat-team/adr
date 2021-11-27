import * as React from 'react';
import { getMDXModule } from '@/helpers/mdx';
import type { MDXComponents } from 'mdx/types';

type MdxModule<TExports> = {
  default: React.ElementType<{
    components?: MDXComponents;
  }>;
} & TExports;

export function useMdxModule<TExports = unknown>(props: { source: string }) {
  return React.useMemo<MdxModule<TExports>>(() => getMDXModule(props.source), [props.source]);
}
