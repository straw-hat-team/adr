import { MDX } from '@/components/mdx';
import { MdxFile } from "@/helpers/mdx";
import { Frontmatter } from "@/routes/contributing";

export type RouteParam = {
  slug: string;
};

export type SlugProps = {
  post: MdxFile<Frontmatter>;
};

export function Slug(props: SlugProps) {
  return (
    <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto space-y-10 lg:space-y-20 prose lg:prose-xl">
      <MDX source={props.post.code} />
    </main>
  );
}
