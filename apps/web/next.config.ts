import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  transpilePackages: [
    '@lernivox/contracts',
    '@lernivox/database',
    '@lernivox/storage',
    '@lernivox/ai-core',
  ],
};

export default nextConfig;
