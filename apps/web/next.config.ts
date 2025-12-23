import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {},
  // Webpack fallback for backwards compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        'fs/promises': false,
      };
    }
    return config;
  },
  // Transpile workspace packages
  transpilePackages: ['@contech/gantt'],
};

export default nextConfig;
