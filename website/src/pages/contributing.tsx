import { readMdxFile } from '@/helpers/mdx';
import { GetStaticPropsResult } from 'next';
import { ContributingProps, Frontmatter } from '@/routes/contributing';

export { Contributing as default } from '@/routes/contributing';

export async function getStaticProps(): Promise<GetStaticPropsResult<ContributingProps>> {
  const post = await readMdxFile<Frontmatter>('@/routes/contributing/components/post.mdx');
  return { props: { post } };
}
