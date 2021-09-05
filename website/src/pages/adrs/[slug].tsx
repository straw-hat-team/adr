import { GetStaticPaths, GetStaticProps } from 'next';
import { readMdxFilesOfRoute, readMdxFile, MdxFileRoute } from '@/helpers/mdx';
import { Slug, RouteParam, SlugProps } from '@/routes/adrs/routes/[slug]';
import { SRC_DIR } from '@/constants';
import { Frontmatter } from '@/routes/contributing';

export default Slug;

export const getStaticProps: GetStaticProps<SlugProps, RouteParam> = async (props) => {
  const post = await readMdxFile<Frontmatter>(`@/routes/adrs/routes/[slug]/routes/${props.params!.slug}/index.mdx`);
  return { props: { post } };
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
