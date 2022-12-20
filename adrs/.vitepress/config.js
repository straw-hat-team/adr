export default {
  title: "Straw Hat's ADRs",
  description: 'TL;DR: ADRs are lots of documentation on how Straw Hat Team works.',
  themeConfig: {
    footer: {
      message: 'Except as otherwise noted, the content of this repository is licensed under the Creative Commons Attribution 4.0 License and code samples are licensed under the MIT',
      copyright: 'Copyright © 2020-present Straw Hat, LLC',
    },
    editLink: {
      text: 'Edit this page on GitHub',
      pattern: 'https://github.com/straw-hat-team/adr/edit/master/adrs/:path',
    },
    nav: [{ text: 'GitHub', link: 'https://github.com/straw-hat-team/adr' }],
    sidebar: [
      {
        text: 'ADRs',
        collapsible: true,
        collapsed: false,
        items: [
          { text: 'Genesis ADR', link: '/0000000000/README.md' },
          { text: 'ADR Style guide', link: '/0000000001/README.md' },
          {
            text: 'NodeJS source code directory structure',
            link: '/0541531435/README.md',
          },
          { text: 'Helper vs Util', link: '/1146361044/README.md' },
          {
            text: 'Slots reserved React property key',
            link: '/1358452048/README.md',
          },
          {
            text: 'Configuration of import aliases in Javascript applications',
            link: '/2068541249/README.md',
          },
          {
            text: 'React Component and Hooks Props Naming',
            link: '/2131725034/README.md',
          },
          {
            text: 'NodeJS files and directories names convention',
            link: '/3122196229/README.md',
          },
          { text: 'Documentation structure', link: '/3223845695/README.md' },
          {
            text: 'JavaScript Modules exports convention',
            link: '/4937890790/README.md',
          },
          { text: 'Lodash Importing', link: '/5508488323/README.md' },
          {
            text: 'React project files and directories names convention',
            link: '/5541831634/README.md',
          },
          { text: 'Error CloudEvents Adapter', link: '/6860374633/README.md' },
          { text: 'JSX files extension', link: '/8042638751/README.md' },
          { text: 'Usage of JSX Fragment', link: '/8618797096/README.md' },
          { text: 'URL Path Design', link: '/8702033095/README.md' },
        ],
      },
    ],
  },
};
