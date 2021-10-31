import { GetStaticPaths, GetStaticProps } from 'next';
import remarkSlug from 'remark-slug';
import remarkAutolinkHeadings from 'remark-autolink-headings';
import remarkGfm from 'remark-gfm';
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
        options.remarkPlugins = [
          ...(options.remarkPlugins ?? []),
          remarkSlug,
          [remarkAutolinkHeadings, { behavior: 'wrap' }],
          remarkGfm,
        ];
        return options;
      },
    },
  });

  console.log(post);

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
