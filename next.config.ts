import type { NextConfig } from "next";
import { getAiProxyRewrites, getBackendProxyRewrites } from "./src/lib/runtime-urls";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@copilotkit/runtime",
    "@blend-capital/blend-sdk",
    "@stellar/stellar-sdk",
  ],
  compress: false,
  reactStrictMode: false,
  // Disable built-in compression — SSE (text/event-stream) responses get
  // gzip'd which forces the browser to buffer the entire response before
  // decompressing, killing real-time streaming.  In production, nginx/CDN
  // handles compression and knows to skip SSE.
  compress: false,
  images: {
    qualities: [75, 80, 85, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tasmil-assets.sgp1.cdn.digitaloceanspaces.com",
        pathname: "/static/**",
      },
    ],
  },
  async rewrites() {
    return [...getBackendProxyRewrites(), ...getAiProxyRewrites()];
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "./tsconfig.json",
  },
  turbopack: {
    // Polyfills for web3 / Allbridge SDK in Turbopack dev mode
    resolveAlias: {
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      buffer: "buffer",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify/browser",
      vm: "vm-browserify",
    },
  },
  // Webpack polyfills for production builds
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify/browser"),
        assert: require.resolve("assert"),
        url: require.resolve("url"),
        vm: require.resolve("vm-browserify"),
      };
    }
    return config;
  },
};

export default nextConfig;
