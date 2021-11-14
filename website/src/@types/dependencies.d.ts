declare module 'rehype-code-title' {
  import type { Plugin } from 'unified';

  export type Options = {
    className?: string;
  };

  export default function rehypeCodeTitle(opts?: Options): Plugin;
}

declare module 'remark-reading-time' {
  import type { Plugin } from 'unified';

  export type Options = {
    name?: string;
  };

  export default function rehypeCodeTitle(opts?: Options): Plugin;
}
