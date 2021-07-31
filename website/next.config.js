const withPlugins = require('next-compose-plugins');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
// const remarkFrontmatter = require('remark-frontmatter');
// const remarkToc = require('remark-toc');

const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    // remarkPlugins: [remarkFrontmatter, remarkToc()],
  },
});

module.exports = withPlugins([withMDX(), withBundleAnalyzer], {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
});
