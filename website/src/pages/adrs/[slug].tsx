import { GetStaticPaths, GetStaticProps } from 'next';
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

import { compileMdxFilesOfRoute, compileMdxFile, MdxFileRoute } from '@/helpers/mdx/mdx.server';
import { Slug, RouteParam, SlugProps } from '@/routes/adrs/routes/[slug]';
import { SRC_DIR } from '@/constants';
import { remarkMdxReadingTime } from '@/helpers/remark';
import { AdrMdxData } from '@/routes/adrs/types';

export default Slug;

export const getStaticProps: GetStaticProps<SlugProps, RouteParam> = async (props) => {
  const post = await compileMdxFile<AdrMdxData>(`@/routes/adrs/routes/[slug]/routes/${props.params!.slug}/index.mdx`, {
    compileOptions: {
      remarkPlugins: [
        remarkGfm,
        [remarkMdxFrontmatter, { name: 'frontmatter' }],
        remarkFrontmatter,
        remarkReadingTime(),
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
    },
  });

  return {
    props: {
      post: post.code,
    },
  };
};

export const getStaticPaths: GetStaticPaths<RouteParam> = async (_props) => {
  const routes = await compileMdxFilesOfRoute('@/routes/adrs/routes/[slug]', {
    atRootDir: SRC_DIR,
  });

  return {
    paths: routes.map(getPaths),
    fallback: true,
  };
};

function getPaths(fileRoute: MdxFileRoute) {
  return { params: { slug: fileRoute.routeDir.dirent.name } };
}
