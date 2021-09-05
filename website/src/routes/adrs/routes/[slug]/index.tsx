import { MDX } from '@/components/mdx';
import { MdxFile } from '@/helpers/mdx';
import { AdrFrontmatter } from '@/routes/adrs/types';
import { PropsWithChildren } from 'react';

export type RouteParam = {
  slug: string;
};

export type SlugProps = {
  post: MdxFile<AdrFrontmatter>;
};

function Badge(props: PropsWithChildren<{}>) {
  return (
    <span className="items-center px-3 py-0.5 rounded-full text-base font-medium bg-yellow-100 text-yellow-800">
      {props.children}
    </span>
  );
}

export function Slug(props: SlugProps) {
  return (
    <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto space-y-10 lg:space-y-20 prose lg:prose-xl">
      <header>
        <div className="flex gap-4 items-center">
          {props.post.frontmatter.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </header>
      <MDX source={props.post.code} />
    </main>
  );
}
