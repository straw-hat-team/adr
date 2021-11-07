import { GetStaticPaths, GetStaticProps } from 'next';
import remarkGfm from 'remark-gfm';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeToc from 'rehype-toc';
import rehypeCodeTitle from 'rehype-code-title';
import { rehypeMdxTitle } from 'rehype-mdx-title';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
// @ts-ignore
import rehypeExtractTocMdx from '@stefanprobst/rehype-extract-toc/mdx';
import rehypePrismPlus from 'rehype-prism-plus';

import readingTime from 'reading-time';

import { compileMdxFilesOfRoute, compileMdxFile, MdxFileRoute } from '@/helpers/mdx/mdx.server';
import { Slug, RouteParam, SlugProps, AdrMdxData } from '@/routes/adrs/routes/[slug]';
import { SRC_DIR } from '@/constants';
import remarkFrontmatter from 'remark-frontmatter';
import { remarkMdxFrontmatter } from 'remark-mdx-frontmatter';

export default Slug;

export const getStaticProps: GetStaticProps<SlugProps, RouteParam> = async (props) => {
  // const Pepeganism = await import(`@/routes/adrs/routes/[slug]/routes/${props.params!.slug}/index.mdx`);
  // console.log(Pepeganism);

  const post = await compileMdxFile<AdrMdxData>(`@/routes/adrs/routes/[slug]/routes/${props.params!.slug}/index.mdx`, {
    compileOptions: {
      remarkPlugins: [
        remarkGfm,
        remarkFrontmatter,
        [
          remarkMdxFrontmatter,
          {
            name: 'frontmatter',
          },
        ],
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
        rehypeToc,
      ],
    },
  });

  return {
    props: {
      post: post.code,
      readingTime: readingTime(post.code),
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
