import { GetStaticProps } from 'next';
import { MdxFileRoute, readMdxFilesOfRoute } from '@/helpers/mdx';
import { SRC_DIR } from '@/constants';
import { Adrs, AdrsProps } from '@/routes/adrs';
import { AdrFrontmatter } from '@/routes/adrs/types';

export default Adrs;

export const getStaticProps: GetStaticProps<AdrsProps> = async (_props) => {
  const routes = await readMdxFilesOfRoute<AdrFrontmatter>('@/routes/adrs/routes/[slug]', {
    atRootDir: SRC_DIR,
  });

  return { props: { adrs: routes.map(getAdrs) } };
};

function getAdrs(fileRoute: MdxFileRoute<AdrFrontmatter>) {
  return {
    slug: fileRoute.routeDir.dirent.name,
    frontmatter: fileRoute.mdxFile.frontmatter,
  };
}
