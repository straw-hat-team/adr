import { CompileOptions } from '@mdx-js/mdx/lib/compile';

import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { remarkMdxFrontmatter } from 'remark-mdx-frontmatter';
import remarkReadingTime from 'remark-reading-time';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeCodeTitle from 'rehype-code-title';
import { rehypeMdxTitle } from 'rehype-mdx-title';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import rehypeExtractTocMdx from '@stefanprobst/rehype-extract-toc/mdx';
import rehypePrismPlus from 'rehype-prism-plus';

import { remarkMdxReadingTime } from '@/helpers/remark';

export const AdrCompilerOptions: CompileOptions = {
  remarkPlugins: [
    remarkGfm,
    [remarkMdxFrontmatter, { name: 'frontmatter' }],
    remarkFrontmatter,
    remarkReadingTime,
    remarkMdxReadingTime,
  ],
  rehypePlugins: [
    rehypeSlug,
    rehypePrismPlus,
    rehypeCodeTitle,
    rehypeExtractToc,
    rehypeExtractTocMdx,
    rehypeMdxTitle,
    [
      rehypeAutolinkHeadings,
      {
        behavior: 'wrap',
        properties: {
          className: ['anchor'],
        },
      },
    ],
  ],
};
