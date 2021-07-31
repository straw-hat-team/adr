import { getAllFilesFrontMatter } from "@/helpers/mdx";
export { Contributing as default } from '@/routes/contributing';

export async function getStaticProps() {
  const posts = await getAllFilesFrontMatter('blog');

  return { props: { posts } };
}
