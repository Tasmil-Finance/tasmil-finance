import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Exclude kubb config from build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Exclude files from compilation
  experimental: {
    serverComponentsExternalPackages: ['@kubb/core', '@kubb/cli', '@kubb/plugin-oas', '@kubb/plugin-ts', '@kubb/plugin-react-query'],
  },
};

export default nextConfig;
