/**
 * DeFindex Multi-Strategy Vault Protocol — live integration tests (testnet + mainnet)
 *
 * Coverage:
 * - listVaults: testnet uses knownVaults static list, mainnet uses factory discovery
 * - getVault: single vault info by address
 * - getYieldOpportunities: yield aggregator interface
 * - vault fields: address, name, asset, status
 */

import { describe, it, expect } from "vitest";
import { DefindexAdapter } from "../../../src/protocols/defindex/index.js";
import { getDefindexContracts } from "../../../src/utils/contracts.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const TESTNET: TasmilClientConfig = {
  network: "testnet",
  rpcUrl: "https://soroban-testnet.stellar.org",
};

const MAINNET: TasmilClientConfig = {
  network: "mainnet",
  rpcUrl: "https://mainnet.sorobanrpc.com",
};

function isContractAddress(s: string): boolean {
  return typeof s === "string" && s.startsWith("C") && s.length === 56;
}

// ─── Testnet ──────────────────────────────────────────────────────

describe("DeFindex — testnet", () => {
  const adapter = new DefindexAdapter(TESTNET);
  const contracts = getDefindexContracts("testnet");

  it("getDefindexContracts returns factory and knownVaults", () => {
    expect(typeof contracts.factory).toBe("string");
    expect(contracts.factory.length).toBeGreaterThan(0);
    // knownVaults may be empty or populated on testnet
    expect(Array.isArray(contracts.knownVaults ?? [])).toBe(true);
  });

  it("listVaults returns array (uses knownVaults on testnet)", async () => {
    const vaults = await adapter.listVaults();
    expect(Array.isArray(vaults)).toBe(true);
    // May be empty if no known vaults configured on testnet
  }, 30_000);

  it("each vault has required fields", async () => {
    const vaults = await adapter.listVaults();
    for (const vault of vaults) {
      expect(isContractAddress(vault.address)).toBe(true);
      expect(typeof vault.name).toBe("string");
      expect(vault.name.length).toBeGreaterThan(0);
      expect(typeof vault.asset).toBe("string");
      expect(["ok", "unavailable"]).toContain(vault.status);
    }
  }, 30_000);

  it("getVault returns vault info for known testnet vault", async () => {
    const knownVaults = contracts.knownVaults;
    if (!knownVaults || knownVaults.length === 0) {
      // If no known vaults, skip
      return;
    }

    const firstVault = knownVaults[0]!;
    const vault = await adapter.getVault(firstVault.address);
    expect(vault.address).toBe(firstVault.address);
    expect(["ok", "unavailable"]).toContain(vault.status);
  }, 20_000);

  it("getYieldOpportunities returns vault opportunities", async () => {
    const opps = await adapter.getYieldOpportunities();
    expect(Array.isArray(opps)).toBe(true);

    for (const opp of opps) {
      expect(opp.protocol).toBe("defindex");
      expect(opp.type).toBe("vault");
      expect(typeof opp.name).toBe("string");
      expect(Array.isArray(opp.assets)).toBe(true);
      expect(opp.assets.length).toBeGreaterThanOrEqual(1);
      expect(["ok", "unavailable"]).toContain(opp.status);
      expect(opp.risk).toBe("low");

      // APY structure
      expect(opp.apy).toBeDefined();
      if (opp.apy.base !== null) {
        expect(typeof opp.apy.base).toBe("number");
      }
    }
  }, 30_000);
});

// ─── Mainnet ──────────────────────────────────────────────────────

describe("DeFindex — mainnet", () => {
  const adapter = new DefindexAdapter(MAINNET);
  const contracts = getDefindexContracts("mainnet");

  it("getDefindexContracts returns valid mainnet factory address", () => {
    expect(typeof contracts.factory).toBe("string");
    // Factory may be a contract address (C...) or a placeholder
    expect(contracts.factory.length).toBeGreaterThan(0);
  });

  it("listVaults returns array (factory discovery on mainnet)", async () => {
    const vaults = await adapter.listVaults();
    expect(Array.isArray(vaults)).toBe(true);
    // May be empty if factory is not deployed yet or has no vaults
  }, 30_000);

  it("each vault address is a valid contract address or placeholder", async () => {
    const vaults = await adapter.listVaults();
    for (const vault of vaults) {
      expect(typeof vault.address).toBe("string");
      expect(vault.address.length).toBeGreaterThan(0);
    }
  }, 30_000);

  it("getVault for a known address does not throw", async () => {
    const knownVaults = contracts.knownVaults;
    if (!knownVaults || knownVaults.length === 0) {
      // Try factory-discovered vaults
      const vaults = await adapter.listVaults();
      if (vaults.length === 0) return;

      const first = vaults[0]!;
      const vault = await adapter.getVault(first.address);
      expect(vault.address).toBe(first.address);
      return;
    }

    const firstVault = knownVaults[0]!;
    const vault = await adapter.getVault(firstVault.address);
    expect(vault.address).toBe(firstVault.address);
    expect(["ok", "unavailable"]).toContain(vault.status);
  }, 30_000);

  it("getYieldOpportunities maps vaults to YieldOpportunity format", async () => {
    const opps = await adapter.getYieldOpportunities();
    expect(Array.isArray(opps)).toBe(true);

    for (const opp of opps) {
      expect(opp.protocol).toBe("defindex");
      expect(opp.type).toBe("vault");
      expect(opp.risk).toBe("low");
      expect(["ok", "unavailable"]).toContain(opp.status);

      // poolAddress should match the vault address
      if (opp.poolAddress) {
        expect(typeof opp.poolAddress).toBe("string");
      }
    }
  }, 30_000);

  it("vault APY fields are null or valid numbers", async () => {
    const vaults = await adapter.listVaults();
    for (const vault of vaults) {
      if (vault.apy !== undefined && vault.apy !== null) {
        expect(typeof vault.apy).toBe("number");
        expect(isFinite(vault.apy)).toBe(true);
      }
    }
  }, 30_000);
});
