import type { NextConfig } from "next";
import { getAiProxyRewrites, getBackendProxyRewrites } from "./src/lib/runtime-urls";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@blend-capital/blend-sdk", "@stellar/stellar-sdk"],
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
  async headers() {
    return [
      {
        // Tell reverse proxies (dev tunnels, CDN) not to compress —
        // Next.js compress:false handles this, but tunnel proxies may
        // add their own gzip layer that corrupts SSE streams.
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-transform" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-XSS-Protection", value: "0" },
        ],
      },
    ];
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
      // Stub for @wagmi/core Tempo Wallet dependency (not used by this app)
      accounts: "./src/lib/stubs/accounts.ts",
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
      // Stub for @wagmi/core Tempo Wallet dependency (not used by this app)
      config.resolve.alias = {
        ...config.resolve.alias,
        accounts: require.resolve("./src/lib/stubs/accounts.ts"),
      };
    }
    // Exclude E2E test output from file watcher — Playwright writes screenshots
    // and videos to e2e/test-results/ which triggers HMR recompiles mid-test.
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : config.watchOptions?.ignored ? [config.watchOptions.ignored] : []),
        '**/e2e/test-results/**',
        '**/node_modules/**',
      ],
    };

    return config;
  },
};

export default nextConfig;
