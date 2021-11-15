import { PropsWithChildren } from 'react';

import { AdrMdxData } from '@/routes/adrs/types';
import { useMdxModule } from '@/hooks/use-mdx-module';
import { PageTitle } from '@/components/page-title';
import { pageAnchor } from '@/helpers';
import { MdxProvider } from '@/components/mdx/components/mdx-provider';
import { DEFAULT_COMPONENTS } from '@/components/mdx/constants';

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
    <MdxProvider>
      <PageTitle>{Module.title}</PageTitle>
      <div className="flex justify-center items-stretch px-4 py-10 gap-6">
        <main className="flex-1">
          <header className="mb-4">
            <div className="flex gap-4 items-center">
              {Module.frontmatter?.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </header>
          <Module.default components={DEFAULT_COMPONENTS} />
        </main>
        <aside className="hidden xl:text-sm xl:block flex-none w-2/12">
          <div className="flex flex-col justify-between overflow-y-auto sticky max-h-(screen-18) pt-10 pb-6 top-18">
            <div className="mb-8">
              <h5 className="text-gray-900 uppercase tracking-wide font-semibold mb-3 text-sm lg:text-xs">
                On this page
              </h5>
              <nav className="overflow-x-hidden text-gray-500 font-medium">
                {Module.tableOfContents?.[0]?.children?.map((item) => (
                  <a
                    key={item.id}
                    href={pageAnchor(item.id)}
                    className="block transform transition-colors duration-200 py-2 hover:text-gray-900 text-gray-900"
                  >
                    {item.value}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </MdxProvider>
  );
}
