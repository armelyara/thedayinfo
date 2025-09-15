import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
      }
    ],
  },
  
  // ✅ Configuration Firebase Admin ajoutée
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclure les modules Node.js du bundle client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'firebase-admin': false,
        'firebase-admin/firestore': false,
        'firebase-admin/auth': false,
      };
    }
    return config;
  },
  
  // Packages à exclure du bundling côté serveur
  experimental: {
    serverComponentsExternalPackages: [
      'firebase-admin',
      'firebase-admin/firestore',
      'firebase-admin/auth'
    ],
  },
};

export default nextConfig;