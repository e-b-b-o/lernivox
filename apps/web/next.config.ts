import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@lernivox/contracts',
    '@lernivox/database',
    '@lernivox/storage',
    '@lernivox/ai-core',
  ],
};

export default nextConfig;
