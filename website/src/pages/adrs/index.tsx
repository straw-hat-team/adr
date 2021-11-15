import { GetStaticProps } from 'next';
import { MdxFileRoute, compileMdxFilesOfRoute } from '@/helpers/mdx/mdx.server';
import { SRC_DIR } from '@/constants';
import { Adrs, AdrsProps } from '@/routes/adrs';
import { getMDXModule } from '@/helpers/mdx';
import { AdrCompilerOptions } from '@/helpers/mdx/adr';

export default Adrs;

export const getStaticProps: GetStaticProps<AdrsProps> = async (_props) => {
  const routes = await compileMdxFilesOfRoute('@/routes/adrs/routes/[slug]', {
    atRootDir: SRC_DIR,
    compileOptions: AdrCompilerOptions,
  });

  return { props: { adrs: routes.map(getAdrs) } };
};

function getAdrs(fileRoute: MdxFileRoute) {
  const Module = getMDXModule(fileRoute.mdxFile.code);

  return {
    slug: fileRoute.routeDir.dirent.name,
    mdxExports: {
      title: Module.title,
      frontmatter: Module.frontmatter,
    },
  };
}
