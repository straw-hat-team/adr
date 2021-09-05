import { GetStaticPaths, GetStaticProps } from 'next';
import { fileNameFromMdxFileRouteToSlugParams, readMdxFilesOfRoute, readMdxFile } from '@/helpers/mdx';
import { RouteParam, SlugProps } from '@/routes/adrs/[slug]';
import { SRC_DIR } from '@/constants';
import { Frontmatter } from '@/routes/contributing';

export { Slug as default } from '@/routes/adrs/[slug]';

export const getStaticProps: GetStaticProps<SlugProps, RouteParam> = async (props) => {
  const post = await readMdxFile<Frontmatter>(`@/routes/adrs/[slug]/routes/${props.params!.slug}/index.mdx`);
  return { props: { post } };
};

export const getStaticPaths: GetStaticPaths<RouteParam> = async (_props) => {
  const routes = await readMdxFilesOfRoute('@/routes/adrs/[slug]', {
    atRootDir: SRC_DIR,
  });

  return {
    paths: routes.map(fileNameFromMdxFileRouteToSlugParams),
    fallback: false,
  };
};
