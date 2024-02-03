import { defineConfig } from 'vitepress';
import path from 'node:path';
import { readFrontmatter, orderByCreated, AdrFrontmatter, toSidebarItem } from './helpers';

export default async () => {
  const frontmatters = await readFrontmatter(['adrs/**/*.md'], {
    rootDir: path.join(__dirname, '../src'),
    schema: AdrFrontmatter,
  });

  return defineConfig({
    base: '/adr/',
    srcDir: './src',
    lang: 'en-US',
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
        pattern: 'https://github.com/straw-hat-team/adr/edit/master/adrs/:path',
      },
      nav: [
        { text: 'Contributing', link: '/contributing' },
        { text: 'GitHub', link: 'https://github.com/straw-hat-team/adr' },
      ],
      sidebar: [
        {
          text: 'ADRs',
          collapsible: true,
          collapsed: false,
          items: frontmatters.sort(orderByCreated).map(toSidebarItem),
        },
      ],
    },
  });
};
