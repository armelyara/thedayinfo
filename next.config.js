
// Try to load next-intl plugin, but gracefully handle if not installed yet
let withNextIntl;
try {
  withNextIntl = require('next-intl/plugin')('./src/i18n.ts');
} catch (error) {
  console.warn('next-intl plugin not available yet, using default config');
  withNextIntl = (config) => config;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  async redirects() {
    return [
      {
        source: '/article/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
      {
        source: '/category/:name',
        destination: '/blog/category/:name',
        permanent: true,
      },
    ]
  },

  webpack: (config, { isServer, webpack }) => {
    // Enable WebAssembly
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Add rule to handle wasm modules
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Handle node: schema by stripping the 'node:' prefix
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );

    // Exclude firebase-admin from the client bundle and polyfill process
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'firebase-admin': false,
        'process': require.resolve('process/browser'),
      };
    }
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
