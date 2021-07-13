const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
})
module.exports = withMDX({
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx'],
})
