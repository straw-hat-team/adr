import { PropsWithChildren } from 'react';
import type { ReadingTimeResult } from 'reading-time';

import { MDX } from '@/components/mdx';
import { MdxFile } from '@/helpers/mdx';
import { AdrFrontmatter } from '@/routes/adrs/types';

export type RouteParam = {
  slug: string;
};

export type SlugProps = {
  readingTime: ReadingTimeResult;
  post: MdxFile<AdrFrontmatter>;
};

function Badge(props: PropsWithChildren<{}>) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-base font-medium bg-indigo-100 text-indigo-800">
      <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3" />
      </svg>
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
