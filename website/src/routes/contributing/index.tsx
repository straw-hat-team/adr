import { MDX } from '@/components/mdx';
import { MdxFile } from '@/helpers/mdx';

export type Frontmatter = {};

export type ContributingProps = {
  post: MdxFile<Frontmatter>;
};

export function Contributing(props: ContributingProps) {
  return (
    <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto space-y-10 lg:space-y-20 prose lg:prose-xl">
      <MDX source={props.post.code} />
    </main>
  );
}
