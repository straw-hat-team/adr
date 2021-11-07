import { GetStaticProps } from 'next';
import { MdxFileRoute, compileMdxFilesOfRoute } from '@/helpers/mdx/mdx.server';
import { SRC_DIR } from '@/constants';
import { Adrs, AdrsProps } from '@/routes/adrs';

export default Adrs;

export const getStaticProps: GetStaticProps<AdrsProps> = async (_props) => {
  const routes = await compileMdxFilesOfRoute('@/routes/adrs/routes/[slug]', {
    atRootDir: SRC_DIR,
  });

  return { props: { adrs: routes.map(getAdrs) } };
};

function getAdrs(fileRoute: MdxFileRoute) {
  return {
    slug: fileRoute.routeDir.dirent.name,
  };
}
