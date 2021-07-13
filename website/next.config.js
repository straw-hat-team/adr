const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
})

module.exports = withMDX({
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
})
