import { AdrMdxModuleExports } from '@/routes/adrs/types';
import { useMdxModule } from '@/hooks/use-mdx-module';
import { PageTitle } from '@/components/page-title';
import { pageAnchor } from '@/helpers';
import { MdxProvider } from '@/components/mdx/components/mdx-provider';
import { DEFAULT_COMPONENTS } from '@/components/mdx/constants';
import { Badge } from '@/routes/adrs';
import { LegalFooter } from '@/components/legal-footer';
import * as React from 'react';
import { MultiColumnLayout, Panel } from '@/components/layouts/multi-column-layout';
import { Header, MainMenuSideBar } from '@/components/example';

export type RouteQuery = {
  slug: string;
};

export type SlugProps = {
  adrCode: string;
};

export function Slug(props: SlugProps) {
  const Module = useMdxModule<AdrMdxModuleExports>({ source: props.adrCode });

  return (
    <MultiColumnLayout slots={{ MainMenu: MainMenuSideBar, Header: Header }}>
      <Panel className="order-1 xl:flex xl:flex-col flex-shrink-0">
        <LeftPanel />
      </Panel>
      <Panel as="main" className="order-2 flex-1">
        <MdxProvider>
          <PageTitle>{Module.title}</PageTitle>
          <div className="flex justify-center items-stretch px-4 gap-6 flex-1">
            <main className="flex-1 overscroll-visible">
              <header className="mb-4">
                <div className="flex gap-4 items-center">
                  {Module.frontmatter?.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </header>
              <Module.default components={DEFAULT_COMPONENTS} />
              <LegalFooter />
            </main>
            <aside className="hidden xl:text-sm xl:block flex-none w-2/12">
              <div className="flex flex-col justify-between overflow-y-auto sticky max-h-(screen-18) pt-10 pb-6 top-32">
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
      </Panel>
      <Panel className="order-3 xl:flex xl:flex-col flex-shrink-0 w-24">
        <LeftPanel />
      </Panel>
    </MultiColumnLayout>
  );
}

function LeftPanel() {
  return (
    <div className="h-full flex flex-col gap-2 flex-1 py-6 px-4 sm:px-6 lg:px-8 w-96 rounded-lg border-2 border-gray-200 border-dashed">
      {Array(100)
        .fill(0)
        .map((_, index) => (
          <p key={index}>Item {index}</p>
        ))}
    </div>
  );
}
