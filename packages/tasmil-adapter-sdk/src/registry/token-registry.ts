/**
 * CrossChainTokenRegistry — unified cross-chain token & chain registry.
 *
 * Provides token listing, lookup, and filtering for the swap/bridge aggregator.
 * Network-aware: returns mainnet or testnet data based on config.
 *
 * Starts with static Stellar token data, then can be enriched dynamically
 * via loadBridgeTokens() which fetches real bridge data from Allbridge SDK.
 */

import type { StellarNetwork } from "../types/common.js";
import type {
  ChainInfo,
  CrossChainToken,
  FilterTokensParams,
  FilterTokensResult,
} from "./types.js";
import { SUPPORTED_CHAINS } from "./chains.js";
import { TOKEN_REGISTRY_MAINNET } from "./tokens-mainnet.js";
import { TOKEN_REGISTRY_TESTNET } from "./tokens-testnet.js";

// ─── Allbridge ChainSymbol → our chain ID mapping ──────────────

const ALLBRIDGE_CHAIN_MAP: Record<string, { id: string; name: string; logo?: string }> = {
  SRB:  { id: "stellar",   name: "Stellar",   logo: "/chains/stellar.png" },
  ETH:  { id: "ethereum",  name: "Ethereum",  logo: "/chains/ethereum.png" },
  ARB:  { id: "arbitrum",  name: "Arbitrum",  logo: "/chains/arbitrum.png" },
  BAS:  { id: "base",      name: "Base",      logo: "/chains/base.png" },
  POL:  { id: "polygon",   name: "Polygon",   logo: "/chains/polygon.png" },
  SOL:  { id: "solana",    name: "Solana",    logo: "/chains/solana.png" },
  BSC:  { id: "bsc",       name: "BNB Chain", logo: "/chains/bsc.png" },
  AVA:  { id: "avalanche", name: "Avalanche", logo: "/chains/avalanche.png" },
  OPT:  { id: "optimism",  name: "Optimism",  logo: "/chains/optimism.png" },
  TRX:  { id: "tron",      name: "Tron",      logo: "/chains/tron.png" },
  CEL:  { id: "celo",      name: "Celo",      logo: "/chains/celo.png" },
  SNC:  { id: "sonic",     name: "Sonic",     logo: "/chains/sonic.png" },
  UNI:  { id: "unichain",  name: "Unichain",  logo: "/chains/unichain.png" },
  LIN:  { id: "linea",     name: "Linea",     logo: "/chains/linea.png" },
  SUI:  { id: "sui",       name: "Sui",       logo: "/chains/sui.png" },
  ALG:  { id: "algorand",  name: "Algorand",  logo: "/chains/algorand.png" },
  STX:  { id: "stacks",    name: "Stacks",    logo: "/chains/stacks.png" },
  STLR: { id: "stellar",   name: "Stellar",   logo: "/chains/stellar.png" },
};

// ─── Allbridge REST API fallback ────────────────────────────────

const ALLBRIDGE_API = "https://core.api.allbridgecoreapi.net/token-info";

async function fetchAllbridgeTokenInfo(): Promise<Record<string, unknown>> {
  const res = await fetch(ALLBRIDGE_API);
  if (!res.ok) throw new Error(`Allbridge API failed: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

// ─── Registry ──────────────────────────────────────────────────

export class CrossChainTokenRegistry {
  private readonly registry: CrossChainToken[];
  private supportedChains: ChainInfo[];
  private tokenBySymbol: Map<string, CrossChainToken>;
  private bridgeLoaded = false;

  constructor(private readonly network: StellarNetwork) {
    const source =
      network === "testnet" ? TOKEN_REGISTRY_TESTNET : TOKEN_REGISTRY_MAINNET;
    // Deep copy so loadBridgeTokens() can mutate safely
    this.registry = source.map((t) => ({
      ...t,
      chains: [...t.chains],
      addresses: { ...t.addresses },
      bridgeableVia: [...t.bridgeableVia],
      swappableOn: [...t.swappableOn],
    }));
    this.supportedChains = [...SUPPORTED_CHAINS];
    this.tokenBySymbol = new Map(this.registry.map((t) => [t.symbol, t]));
  }

  /** All supported chains (enriched after loadBridgeTokens). */
  chains(): ChainInfo[] {
    return this.supportedChains;
  }

  /** All tokens for the active network. */
  list(): CrossChainToken[] {
    return this.registry;
  }

  /** Lookup a token by symbol. */
  getBySymbol(symbol: string): CrossChainToken | undefined {
    return this.tokenBySymbol.get(symbol);
  }

  /** Full registry response (chains + tokens). */
  getRegistry(): { chains: ChainInfo[]; tokens: CrossChainToken[] } {
    return { chains: this.supportedChains, tokens: this.registry };
  }

  /** Tokens available on a specific chain. */
  getTokensForChain(chainId: string): CrossChainToken[] {
    return this.registry.filter((t) => t.chains.includes(chainId));
  }

  /** Tokens that can be bridged across chains. */
  getBridgeableTokens(): CrossChainToken[] {
    return this.registry.filter((t) => t.bridgeable);
  }

  /** Whether loadBridgeTokens() has been called. */
  isBridgeLoaded(): boolean {
    return this.bridgeLoaded;
  }

  /**
   * Dynamically load bridgeable tokens and chains from Allbridge.
   *
   * Tries the AllbridgeAdapter SDK first, falls back to Allbridge REST API.
   * Merges the results into the registry:
   * - New chains are added to supportedChains
   * - Existing tokens get new chain addresses and bridgeable flags
   * - New bridge-only tokens are added to the registry
   *
   * @param allbridgeAdapter - The AllbridgeAdapter instance (sdk.allbridge), optional
   */
  async loadBridgeTokens(allbridgeAdapter?: {
    getSupportedChains(): Promise<Record<string, unknown>>;
  }): Promise<{ chainsAdded: number; tokensUpdated: number; tokensAdded: number }> {
    let chainDetailsMap: Record<string, unknown>;

    // Try adapter first, fall back to REST API
    if (allbridgeAdapter) {
      try {
        chainDetailsMap = await allbridgeAdapter.getSupportedChains();
      } catch {
        chainDetailsMap = await fetchAllbridgeTokenInfo();
      }
    } else {
      chainDetailsMap = await fetchAllbridgeTokenInfo();
    }

    let chainsAdded = 0;
    let tokensUpdated = 0;
    let tokensAdded = 0;

    const chainIdSet = new Set(this.supportedChains.map((c) => c.id));

    for (const [chainSymbol, chainDataRaw] of Object.entries(chainDetailsMap)) {
      const meta = ALLBRIDGE_CHAIN_MAP[chainSymbol];
      if (!meta) continue; // unknown chain symbol

      const chainId = meta.id;
      const chainData = chainDataRaw as {
        chainName?: string;
        tokens?: Array<{
          symbol?: string;
          name?: string;
          decimals?: number;
          tokenAddress?: string;
          poolAddress?: string;
        }>;
      };

      // Add chain if not already known
      if (!chainIdSet.has(chainId)) {
        this.supportedChains.push({
          id: chainId,
          name: chainData.chainName || meta.name,
          symbol: chainSymbol,
          logo: meta.logo,
        });
        chainIdSet.add(chainId);
        chainsAdded++;
      }

      // Process tokens on this chain
      for (const tokenData of chainData.tokens ?? []) {
        const symbol = tokenData.symbol?.toUpperCase();
        if (!symbol) continue;

        const address = tokenData.tokenAddress ?? "";
        const existing = this.tokenBySymbol.get(symbol);

        if (existing) {
          // Token already in registry — enrich with this chain
          if (!existing.chains.includes(chainId)) {
            existing.chains.push(chainId);
          }
          if (address && !existing.addresses[chainId]) {
            existing.addresses[chainId] = address;
          }
          // Mark as bridgeable
          if (!existing.bridgeable && existing.chains.length > 1) {
            existing.bridgeable = true;
          }
          if (!existing.bridgeableVia.includes("allbridge")) {
            existing.bridgeableVia.push("allbridge");
          }
          tokensUpdated++;
        } else {
          // New token discovered from Allbridge (e.g. USDe)
          const newToken: CrossChainToken = {
            symbol,
            name: tokenData.name || symbol,
            decimals: tokenData.decimals ?? 7,
            chains: [chainId],
            addresses: address ? { [chainId]: address } : {},
            bridgeable: true,
            bridgeableVia: ["allbridge"],
            swappableOn: [],
          };
          this.registry.push(newToken);
          this.tokenBySymbol.set(symbol, newToken);
          tokensAdded++;
        }
      }
    }

    // Rebuild tokenBySymbol to pick up any token mutations
    this.tokenBySymbol = new Map(this.registry.map((t) => [t.symbol, t]));
    this.bridgeLoaded = true;

    return { chainsAdded, tokensUpdated, tokensAdded };
  }

  /**
   * Filter valid counterparty tokens given a selected token and chain.
   *
   * Logic:
   * - A token is a valid target if user can SWAP to it (same chain) or BRIDGE to it (different chain)
   * - The selected token itself is valid if it exists on a different chain (bridge to itself)
   */
  filter(params: FilterTokensParams): FilterTokensResult {
    const { selectedToken, selectedChain } = params;
    const selected = this.tokenBySymbol.get(selectedToken);
    const chainExists = this.supportedChains.some((c) => c.id === selectedChain);

    if (!selected || !chainExists) {
      return { tokens: [], chains: [] };
    }

    const resultTokens: CrossChainToken[] = [];
    const resultChains = new Set<string>();
    const seen = new Set<string>();

    const add = (token: CrossChainToken) => {
      if (!seen.has(token.symbol)) {
        seen.add(token.symbol);
        resultTokens.push(token);
      }
    };

    for (const token of this.registry) {
      const isSelf = token.symbol === selectedToken;

      // 1. Same-chain swap: any token on the same chain (except self)
      if (!isSelf && token.chains.includes(selectedChain)) {
        add(token);
        resultChains.add(selectedChain);
      }

      // 2. Bridge target: any bridgeable token on a DIFFERENT chain
      if (token.bridgeable) {
        for (const chain of token.chains) {
          if (chain !== selectedChain) {
            resultChains.add(chain);
            add(token);
          }
        }
      }

      // 3. Cross-chain → Stellar: all Stellar tokens are valid
      //    (bridge delivers to Stellar, then swap to any Stellar token)
      if (selectedChain !== "stellar" && !isSelf && token.chains.includes("stellar")) {
        add(token);
        resultChains.add("stellar");
      }
    }

    // 4. The selected token's own chains are valid bridge targets
    if (selected.bridgeable) {
      for (const chain of selected.chains) {
        if (chain !== selectedChain) resultChains.add(chain);
      }
    }

    return {
      tokens: resultTokens,
      chains: Array.from(resultChains).sort((a, b) => {
        if (a === "stellar") return -1;
        if (b === "stellar") return 1;
        return a.localeCompare(b);
      }),
    };
  }
}
