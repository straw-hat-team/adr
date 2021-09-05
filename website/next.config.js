// @ts-check

const withPlugins = require('next-compose-plugins');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = withPlugins([withBundleAnalyzer], {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
});

module.exports = nextConfig;
