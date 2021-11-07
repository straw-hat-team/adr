// @ts-check

const withPlugins = require('next-compose-plugins');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx', 'md'],
  swcMinify: true,
  experimental: {
    esmExternals: true,
  },
  webpack(config, options) {
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          /** @type {import('@mdx-js/loader').Options} */
          options: {},
        },
      ],
    });

    return config;
  },
};

module.exports = withPlugins([withBundleAnalyzer], nextConfig);
