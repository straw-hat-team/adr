import { GetStaticPaths, GetStaticProps } from 'next';
import remarkGfm from 'remark-gfm';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeToc from 'rehype-toc';
import rehypeCodeTitle from 'rehype-code-title';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import rehypePrismPlus from 'rehype-prism-plus';

import readingTime from 'reading-time';

import { readMdxFilesOfRoute, readMdxFile, MdxFileRoute } from '@/helpers/mdx';
import { Slug, RouteParam, SlugProps } from '@/routes/adrs/routes/[slug]';
import { SRC_DIR } from '@/constants';
import { AdrFrontmatter } from '@/routes/adrs/types';

export default Slug;

export const getStaticProps: GetStaticProps<SlugProps, RouteParam> = async (props) => {
  const post = await readMdxFile<AdrFrontmatter>(`@/routes/adrs/routes/[slug]/routes/${props.params!.slug}/index.mdx`, {
    mdxOptions: {
      xdmOptions(options) {
        options.remarkPlugins = [...(options.remarkPlugins ?? []), remarkGfm];
        options.rehypePlugins = [
          ...(options.rehypePlugins ?? []),
          rehypeSlug,
          // TODO: Extract TOC
          // https://github.com/AgustinBrst/personal-site/blob/3dd5607b86eca85b6324a135290fac1374dddf71/lib/articles.ts#L34
          rehypeExtractToc,
          rehypePrismPlus,
          rehypeCodeTitle,
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
        ];
        return options;
      },
    },
  });

  return {
    props: {
      post: {
        code: post.code,
        frontmatter: post.frontmatter,
      },
      readingTime: readingTime(post.matter.content),
    },
  };
};

export const getStaticPaths: GetStaticPaths<RouteParam> = async (_props) => {
  const routes = await readMdxFilesOfRoute('@/routes/adrs/routes/[slug]', {
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
