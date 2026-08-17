import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import path from 'node:path';
import {
  readFrontmatter,
  orderByCreated,
  AdrFrontmatter,
  toSidebarItem,
  groupByCategory,
  hasAnyCategory,
} from './helpers';
import { quadrants, quadrantLink } from './radar';

export default async () => {
  const frontmatters = await readFrontmatter(['adrs/**/*.md'], {
    rootDir: path.join(__dirname, '../src'),
    schema: AdrFrontmatter,
  });
  const categories = frontmatters.sort(orderByCreated).reduce(groupByCategory, {});
  const adrSidebar = ['General', 'Platform', 'Elixir', 'JavaScript']
    .filter(hasAnyCategory(categories))
    .map((category) => ({
      text: category,
      collapsible: true,
      collapsed: false,
      items: categories[category].map(toSidebarItem) ?? [],
    }));

  return withMermaid(
    defineConfig({
      base: '/adr/',
      srcDir: './src',
      lang: 'en-US',
      transformPageData(pageData) {
        const params = pageData.params as { name?: string; description?: string } | undefined;

        if (params?.name === undefined) {
          return;
        }

        return { title: params.name, description: params.description };
      },
      title: "Straw Hat's ADRs",
      description: 'TL;DR: ADRs are lots of documentation on how Straw Hat Team works.',
      themeConfig: {
        footer: {
          message:
            'Except as otherwise noted, the content of this repository is licensed under the Creative Commons Attribution 4.0 License and code samples are licensed under the MIT',
          copyright: 'Copyright © 2020-present Straw Hat, LLC',
        },
        editLink: {
          text: 'Edit this page on GitHub',
          pattern: 'https://github.com/straw-hat-team/adr/tree/main/src/:path',
        },
        nav: [
          { text: 'Tech Radar', link: '/radar/' },
          { text: 'Contributing', link: '/contributing' },
          { text: 'GitHub', link: 'https://github.com/straw-hat-team/adr' },
        ],
        sidebar: {
          '/radar/': [
            {
              text: 'Tech Radar',
              items: [
                { text: 'The radar', link: '/radar/' },
                { text: 'How it works', link: '/radar/how-it-works' },
              ],
            },
            {
              text: 'Quadrants',
              items: quadrants.map((quadrant) => ({
                text: quadrant.name,
                link: quadrantLink(quadrant.id),
              })),
            },
          ],
          '/': adrSidebar,
        },
      },
    }),
  );
};
