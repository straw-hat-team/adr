import { PropsWithChildren } from 'react';

import { AdrMdxData } from '@/routes/adrs/types';
import { useMdxModule } from '@/hooks/use-mdx-module';
import { PageTitle } from '@/components/page-title';

export type RouteParam = {
  slug: string;
};

export type SlugProps = {
  post: string;
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
  const Module = useMdxModule<AdrMdxData>({ source: props.post });

  console.log(Module);

  return (
    <>
      <PageTitle>{Module.title}</PageTitle>
      <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto space-y-10 lg:space-y-20 prose lg:prose-xl">
        <header>
          <div className="flex gap-4 items-center">
            {Module.frontmatter?.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </header>
        <Module.default />
      </main>
    </>
  );
}
