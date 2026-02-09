
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
  // output: 'standalone', // Required for Firebase App Hosting (Temporarily disabled for build debugging)

  // Extract Firebase client config from FIREBASE_WEBAPP_CONFIG for client-side use
  env: (() => {
    if (process.env.FIREBASE_WEBAPP_CONFIG) {
      try {
        const config = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
        return {
          NEXT_PUBLIC_FIREBASE_API_KEY: config.apiKey,
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.authDomain,
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: config.projectId,
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: config.storageBucket,
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId,
          NEXT_PUBLIC_FIREBASE_APP_ID: config.appId,
        };
      } catch (e) {
        console.error('Failed to parse FIREBASE_WEBAPP_CONFIG:', e);
        return {};
      }
    }
    return {};
  })(),

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Build with proper type checking and linting enabled
  // typescript: { ignoreBuildErrors: true },  // REMOVED - fix type errors instead
  // eslint: { ignoreDuringBuilds: true },     // REMOVED - fix lint errors instead
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
        'stream': require.resolve('stream-browserify'),
      };
    }
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
