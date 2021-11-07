import { compileMdxFile } from '@/helpers/mdx/mdx.server';
import { GetStaticPropsResult } from 'next';
import { ContributingProps } from '@/routes/contributing';
import { Contributing } from '@/routes/contributing';

export default Contributing;

export async function getStaticProps(): Promise<GetStaticPropsResult<ContributingProps>> {
  const post = await compileMdxFile('@/routes/contributing/components/post.mdx');
  return { props: { post: post.code } };
}
