import * as React from 'react';
import { getMDXModule } from '@/helpers/mdx';
import type { MDXComponents } from 'mdx/types';

type MdxModule<TExports> = {
  default: React.ComponentType<{
    components?: MDXComponents;
  }>;
} & TExports;

export function useMdxModule<TExports = unknown>(props: { source: string; globals?: Record<string, any> }) {
  return React.useMemo<MdxModule<TExports>>(() => getMDXModule(props.source, props.globals), [props.source]);
}
