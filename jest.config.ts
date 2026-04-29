import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/lib/test-utils/setup-tests.ts"],

  // Module name mapping for path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/features/(.*)$": "<rootDir>/src/features/$1",
    "^@/shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@/entities/(.*)$": "<rootDir>/src/entities/$1",
  },

  // Test patterns
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "<rootDir>/scripts/**/*.{test,spec}.{js,jsx,ts,tsx}",
  ],

  // Coverage configuration for DeFi features
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/gen-ai/**",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/*.config.{js,jsx,ts,tsx}",
    "!src/app/**/layout.tsx",
    "!src/app/**/loading.tsx",
    "!src/app/**/not-found.tsx",
    "!src/app/**/error.tsx",
  ],

  // Coverage thresholds for DeFi code quality
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
    // Higher thresholds for critical DeFi features
    "src/features/staking/**/*.{js,jsx,ts,tsx}": {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    "src/features/bridge/**/*.{js,jsx,ts,tsx}": {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    "src/entities/**/*.{js,jsx,ts,tsx}": {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },

  // Transform configuration
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: [""],
  },

  // Ignore patterns
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/e2e/"],

  // Transform ignore patterns
  transformIgnorePatterns: ["/node_modules/(?!(.*\\.mjs$|@langchain|@tanstack))"],

  // Global setup for DeFi testing
  globalSetup: "<rootDir>/src/lib/test-utils/global-setup.ts",
  globalTeardown: "<rootDir>/src/lib/test-utils/global-teardown.ts",

  // Verbose output for debugging
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
