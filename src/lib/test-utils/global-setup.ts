export default async function globalSetup(): Promise<void> {
  // Set test environment variables
  (process.env as any)["NODE_ENV"] = "test";

  // Initialize any global test state
  (global as any).__TEST_START_TIME__ = Date.now();
}
