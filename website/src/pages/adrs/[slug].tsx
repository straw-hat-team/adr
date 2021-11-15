import { GetStaticPaths, GetStaticProps } from 'next';

import { compileMdxFilesOfRoute, compileMdxFile, MdxFileRoute } from '@/helpers/mdx/mdx.server';
import { Slug, RouteQuery, SlugProps } from '@/routes/adrs/routes/[slug]';
import { SRC_DIR } from '@/constants';
import { AdrMdxModuleExports } from '@/routes/adrs/types';
import { AdrCompilerOptions } from '@/helpers/mdx/adr';

export default Slug;

export const getStaticProps: GetStaticProps<SlugProps, RouteQuery> = async (props) => {
  const adr = await compileMdxFile<AdrMdxModuleExports>(
    `@/routes/adrs/routes/[slug]/routes/${props.params!.slug}/index.mdx`,
    {
      compileOptions: AdrCompilerOptions,
    }
  );

  return {
    props: {
      adrCode: adr.code,
    },
  };
};

export const getStaticPaths: GetStaticPaths<RouteQuery> = async (_props) => {
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
