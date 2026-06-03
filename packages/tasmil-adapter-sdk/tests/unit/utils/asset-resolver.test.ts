import { describe, it, expect } from "vitest";
import {
  detectAssetFormat,
  resolveAsset,
  getAssetSymbol,
} from "../../../src/utils/asset-resolver.js";
import { getTokenContracts } from "../../../src/utils/contracts.js";

const MAINNET_USDC = getTokenContracts("mainnet").usdc;
const TESTNET_USDC = getTokenContracts("testnet").usdc;

describe("detectAssetFormat", () => {
  it('detects "XLM" as symbol', () => {
    expect(detectAssetFormat("XLM", "mainnet")).toBe("symbol");
  });

  it('detects "native" as symbol', () => {
    expect(detectAssetFormat("native", "mainnet")).toBe("symbol");
  });

  it("detects 56-char C-address as contract", () => {
    expect(detectAssetFormat(MAINNET_USDC, "mainnet")).toBe("contract");
  });

  it('detects "USDC:GA5Z..." as classic', () => {
    expect(
      detectAssetFormat(
        "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        "mainnet",
      ),
    ).toBe("classic");
  });

  it('detects "USDC" as symbol on mainnet (known asset)', () => {
    expect(detectAssetFormat("USDC", "mainnet")).toBe("symbol");
  });
});

describe("resolveAsset", () => {
  describe("symbol → contract", () => {
    it("resolves XLM to mainnet Soroswap XLM SAC", () => {
      const resolved = resolveAsset("XLM", "contract", "mainnet");
      expect(resolved).toMatch(/^C/);
      expect(resolved).toHaveLength(56);
    });

    it("resolves USDC symbol to mainnet USDC contract", () => {
      const resolved = resolveAsset("USDC", "contract", "mainnet");
      expect(resolved).toBe(MAINNET_USDC);
    });

    it("resolves USDC symbol to testnet USDC contract", () => {
      const resolved = resolveAsset("USDC", "contract", "testnet");
      expect(resolved).toBe(TESTNET_USDC);
    });
  });

  describe("contract → symbol", () => {
    it("resolves mainnet USDC contract to symbol", () => {
      expect(resolveAsset(MAINNET_USDC, "symbol", "mainnet")).toBe("USDC");
    });

    it("resolves testnet USDC contract to symbol", () => {
      expect(resolveAsset(TESTNET_USDC, "symbol", "testnet")).toBe("USDC");
    });
  });

  describe("classic → symbol", () => {
    it('resolves "USDC:GA5Z..." to "USDC"', () => {
      const resolved = resolveAsset(
        "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        "symbol",
        "mainnet",
      );
      expect(resolved).toBe("USDC");
    });
  });

  describe("unknown assets", () => {
    it("returns original if symbol not in KNOWN_ASSETS", () => {
      const unknown = "UNKNOWN_TOKEN";
      expect(resolveAsset(unknown, "contract", "mainnet")).toBe(unknown);
    });

    it("returns original if contract not in KNOWN_ASSETS", () => {
      const unknownContract = "C" + "A".repeat(55); // fake contract
      expect(resolveAsset(unknownContract, "symbol", "mainnet")).toBe(
        unknownContract,
      );
    });
  });
});

describe("getAssetSymbol", () => {
  it("returns XLM for native", () => {
    expect(getAssetSymbol("native", "mainnet")).toBe("XLM");
  });

  it("returns USDC for mainnet USDC contract", () => {
    expect(getAssetSymbol(MAINNET_USDC, "mainnet")).toBe("USDC");
  });

  it("returns USDC for testnet USDC contract", () => {
    expect(getAssetSymbol(TESTNET_USDC, "testnet")).toBe("USDC");
  });

  it("returns truncated for unknown contract", () => {
    const fakeContract = "C" + "X".repeat(55);
    const result = getAssetSymbol(fakeContract, "mainnet");
    expect(result).toContain("...");
  });

  it("returns symbol for classic format", () => {
    expect(
      getAssetSymbol(
        "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        "mainnet",
      ),
    ).toBe("USDC");
  });
});
