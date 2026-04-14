/**
 * Client-side Allbridge SDK singleton.
 * All bridge operations (chain discovery, quotes, TX building) run in the browser.
 */
import { AllbridgeCoreSdk, ChainSymbol, nodeRpcUrlsDefault } from "@allbridge/bridge-core-sdk";
import type { ChainDetailsWithTokens, TokenWithChainDetails } from "@allbridge/bridge-core-sdk";

export type { ChainDetailsWithTokens, TokenWithChainDetails };

/** Map from our internal chain-id strings → Allbridge ChainSymbol */
export const CHAIN_ID_TO_SYMBOL: Record<string, ChainSymbol> = {
  stellar: ChainSymbol.SRB,
  ethereum: ChainSymbol.ETH,
  bsc: ChainSymbol.BSC,
  polygon: ChainSymbol.POL,
  avalanche: ChainSymbol.AVA,
  solana: ChainSymbol.SOL,
  arbitrum: ChainSymbol.ARB,
  optimism: ChainSymbol.OPT,
  base: ChainSymbol.BAS,
  tron: ChainSymbol.TRX,
  sui: ChainSymbol.SUI,
};

let _sdk: AllbridgeCoreSdk | null = null;

export function getBridgeSdk(): AllbridgeCoreSdk {
  if (!_sdk) {
    const isTestnet = process.env.NEXT_PUBLIC_STELLAR_TESTNET === "true";
    _sdk = new AllbridgeCoreSdk({
      ...nodeRpcUrlsDefault,
      [ChainSymbol.SRB]: isTestnet
        ? "https://soroban-testnet.stellar.org"
        : "https://rpc.ankr.com/stellar_soroban",
    });
  }
  return _sdk;
}

/** Find a token by chain-id + symbol from the loaded chainsMap. */
export function getTokenFromChain(
  chainsMap: Record<string, ChainDetailsWithTokens>,
  chainId: string,
  tokenSymbol: string,
): TokenWithChainDetails | undefined {
  const sym = CHAIN_ID_TO_SYMBOL[chainId];
  if (!sym) return undefined;
  return chainsMap[sym]?.tokens.find(
    (t) => t.symbol.toUpperCase() === tokenSymbol.toUpperCase(),
  );
}
