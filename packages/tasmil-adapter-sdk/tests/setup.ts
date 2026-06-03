import { readFileSync } from "fs";
import { resolve } from "path";

// Default to testnet for unit tests (no real network calls in unit tests)
process.env["STELLAR_NETWORK"] = "testnet";
process.env["STELLAR_RPC_URL"] = "https://soroban-testnet.stellar.org";
process.env["STELLAR_HORIZON_URL"] = "https://horizon-testnet.stellar.org";

// Load Soroswap API keys from shared keys file (rotation pool)
try {
  const keysFile = resolve(
    __dirname,
    "../../../apps/mcp-stellar/scripts/soroswap-keys.txt",
  );
  const keys = readFileSync(keysFile, "utf-8")
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean)
    .join(",");
  if (keys) {
    process.env["SOROSWAP_API_KEYS"] = keys;
  }
} catch {
  // Keys file not found — Soroswap tests will run without auth (may 403)
}
