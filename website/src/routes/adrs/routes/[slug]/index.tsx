import * as React from 'react';
import { AdrMdxModuleExports } from '@/routes/adrs/types';
import { useMdxModule } from '@/hooks/use-mdx-module';
import { PageTitle } from '@/components/page-title';
import { pageAnchor } from '@/helpers';
import { MdxProvider } from '@/components/mdx/components/mdx-provider';
import { DEFAULT_COMPONENTS } from '@/components/mdx/constants';
import { LegalFooter } from '@/components/legal-footer';
import { MultiColumnLayout } from '@/components/layouts';
import { Header, MainMenuSideBar } from '@/components/example';
import MuiDrawer from '@mui/material/Drawer';
import { Badge } from '@/routes/adrs/components/badge';

export type RouteQuery = {
  slug: string;
};

export type SlugProps = {
  adrCode: string;
};

export function Slug(props: SlugProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const Module = useMdxModule<AdrMdxModuleExports>({ source: props.adrCode });
  return (
    <MultiColumnLayout>
      <MuiDrawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <MainMenuSideBar className="flex-1" />
      </MuiDrawer>

      <MainMenuSideBar className="hidden lg:flex" />

      <div className="flex flex-col flex-1">
        <Header onOpen={() => setSidebarOpen(true)} />
        <div className="flex-1 flex overflow-hidden">
          <aside className="xl:flex xl:flex-col flex-shrink-0 overflow-y-auto">
            <LeftPanel />
          </aside>
          <main className="pt-10 flex-1 overflow-y-auto">
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
              </div>
            </MdxProvider>
          </main>
          <aside className="pt-10 xl:flex xl:flex-col flex-shrink-0 overflow-y-auto">
            <div className="flex flex-col justify-between pb-6 px-20">
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
      </div>
    </MultiColumnLayout>
  );
}

function LeftPanel() {
  return (
    <div className="flex flex-col gap-2 flex-1 py-6 px-4 sm:px-6 lg:px-8 w-96">
      {Array(100)
        .fill(0)
        .map((_, index) => (
          <p key={index}>Item {index}</p>
        ))}
    </div>
  );
}
