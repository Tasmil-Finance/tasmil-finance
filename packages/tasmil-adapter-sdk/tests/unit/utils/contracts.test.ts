import { describe, it, expect } from "vitest";
import {
  NETWORK_CONTRACTS,
  getContracts,
  getBlendContracts,
  getSoroswapContracts,
  getAquariusContracts,
  getPhoenixContracts,
  getDefindexContracts,
  getTokenContracts,
  KNOWN_ASSETS,
  KNOWN_CONTRACTS,
} from "../../../src/utils/contracts.js";

describe("contracts — typed accessors", () => {
  describe("getContracts()", () => {
    it("returns full NetworkContracts for mainnet", () => {
      const c = getContracts("mainnet");
      expect(c.tokens).toBeDefined();
      expect(c.blend).toBeDefined();
      expect(c.soroswap).toBeDefined();
      expect(c.aquarius).toBeDefined();
      expect(c.phoenix).toBeDefined();
      expect(c.defindex).toBeDefined();
    });

    it("returns full NetworkContracts for testnet", () => {
      const c = getContracts("testnet");
      expect(c.tokens).toBeDefined();
      expect(c.blend).toBeDefined();
    });
  });

  describe("getTokenContracts()", () => {
    it("mainnet USDC is a 56-char C-address", () => {
      const { usdc } = getTokenContracts("mainnet");
      expect(usdc).toMatch(/^C[A-Z2-7]{55}$/);
    });

    it("mainnet XLM SAC differs from Soroswap XLM SAC", () => {
      const { xlmSac, xlmSacSoroswap } = getTokenContracts("mainnet");
      expect(xlmSac).not.toBe(xlmSacSoroswap);
    });

    it("testnet USDC matches KNOWN_ASSETS[testnet].USDC.contract", () => {
      const { usdc } = getTokenContracts("testnet");
      expect(usdc).toBe(KNOWN_ASSETS["testnet"]?.["USDC"]?.contract);
    });
  });

  describe("getBlendContracts()", () => {
    it("mainnet backstop is a C-address", () => {
      const { backstop } = getBlendContracts("mainnet");
      expect(backstop).toMatch(/^C/);
      expect(backstop).toHaveLength(56);
    });

    it("has at least 1 known pool on mainnet", () => {
      const { knownPools } = getBlendContracts("mainnet");
      expect(knownPools.length).toBeGreaterThanOrEqual(1);
      for (const pool of knownPools) {
        expect(pool.name).toBeTruthy();
        expect(pool.address).toMatch(/^C/);
      }
    });

    it("testnet pool list is non-empty", () => {
      const { knownPools } = getBlendContracts("testnet");
      expect(knownPools.length).toBeGreaterThanOrEqual(1);
    });

    it("cometLpPool and cometFactory are different addresses on mainnet", () => {
      const { cometLpPool, cometFactory } = getBlendContracts("mainnet");
      expect(cometLpPool).not.toBe(cometFactory);
    });
  });

  describe("getSoroswapContracts()", () => {
    it("mainnet router is a C-address", () => {
      const { router } = getSoroswapContracts("mainnet");
      expect(router).toMatch(/^C/);
    });

    it("testnet has both router and factory", () => {
      const c = getSoroswapContracts("testnet");
      expect(c.router).toBeTruthy();
      expect(c.factory).toBeTruthy();
    });
  });

  describe("getAquariusContracts()", () => {
    it("aquaToken is the same on mainnet and testnet", () => {
      const mainnet = getAquariusContracts("mainnet");
      const testnet = getAquariusContracts("testnet");
      expect(mainnet.aquaToken).toBe(testnet.aquaToken);
    });
  });

  describe("getPhoenixContracts()", () => {
    it("mainnet has 4 known pools", () => {
      const { knownPools } = getPhoenixContracts("mainnet");
      expect(knownPools.length).toBe(4);
    });

    it("each known pool has 2 tokens", () => {
      const { knownPools } = getPhoenixContracts("mainnet");
      for (const pool of knownPools) {
        expect(pool.tokens).toHaveLength(2);
        expect(pool.address).toMatch(/^C/);
        expect(pool.stake).toMatch(/^C/);
      }
    });
  });

  describe("getDefindexContracts()", () => {
    it("testnet has knownVaults (factory is broken on testnet)", () => {
      const { knownVaults } = getDefindexContracts("testnet");
      expect(knownVaults).toBeDefined();
      expect(knownVaults!.length).toBeGreaterThanOrEqual(1);
    });

    it("testnet knownVaults have valid structure", () => {
      const { knownVaults } = getDefindexContracts("testnet");
      for (const vault of knownVaults!) {
        expect(vault.name).toBeTruthy();
        expect(vault.address).toMatch(/^C/);
        expect(vault.asset).toBeTruthy();
      }
    });
  });

  describe("KNOWN_CONTRACTS backward compat", () => {
    it("mainnet BLEND_V2_BACKSTOP matches typed accessor", () => {
      const flat = KNOWN_CONTRACTS["mainnet"]["BLEND_V2_BACKSTOP"] as string;
      const typed = getBlendContracts("mainnet").backstop;
      expect(flat).toBe(typed);
    });

    it("testnet AQUARIUS_ROUTER matches typed accessor", () => {
      const flat = KNOWN_CONTRACTS["testnet"]["AQUARIUS_ROUTER"] as string;
      const typed = getAquariusContracts("testnet").router;
      expect(flat).toBe(typed);
    });
  });

  describe("KNOWN_ASSETS", () => {
    it("mainnet XLM contract is a C-address", () => {
      const xlm = KNOWN_ASSETS["mainnet"]?.["XLM"];
      expect(xlm?.contract).toMatch(/^C/);
      expect(xlm?.classic).toBe("XLM");
    });

    it("all mainnet assets have both classic and contract", () => {
      const assets = KNOWN_ASSETS["mainnet"] ?? {};
      for (const [sym, val] of Object.entries(assets)) {
        expect(val.classic).toBeTruthy();
        expect(val.contract).toMatch(/^C/);
      }
    });
  });
});
