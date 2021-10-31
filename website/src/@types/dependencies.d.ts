declare module 'rehype-code-title' {
  import type { Plugin } from 'unified';

  export type Options = {
    className?: string;
  };

  export default function rehypeCodeTitle(opts?: Options): Plugin;
}
