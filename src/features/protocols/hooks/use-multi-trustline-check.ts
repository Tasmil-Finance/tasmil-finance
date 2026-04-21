"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { activeNetwork } from "@/shared/config/stellar";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";

interface TokenToCheck {
  contract: string;
  symbol: string;
}

interface MultiTrustlineResult {
  /** Tokens missing trustlines */
  missing: TokenToCheck[];
  /** Whether any trustline is missing */
  hasMissing: boolean;
  /** Loading state */
  checking: boolean;
  /** Add trustline for specific token */
  addTrustline: (contract: string, symbol: string) => Promise<boolean>;
  /** Whether a trustline is being added */
  adding: boolean;
  /** Re-check all */
  recheck: () => void;
}

const NATIVE_XLM = new Set([
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
]);

const KNOWN_CLASSIC: Record<string, { code: string; issuer: string }> = {
  CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75: { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
  CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF: { code: "BLND", issuer: "GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56" },
  CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN: { code: "USDT", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE: { code: "AQUA", issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA" },
  CCQZWA6GDCNLEMNUYTCMYGIXLX3ECAXW7RICSUZWWXM5AMDWAANC4SZK: { code: "ICE", issuer: "GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER" },
};

/**
 * Check trustlines for multiple tokens at once.
 * Used for deposit/withdraw which need trustlines for ALL pool tokens.
 */
export function useMultiTrustlineCheck(
  walletAddress: string | undefined,
  tokens: TokenToCheck[],
): MultiTrustlineResult {
  const [missing, setMissing] = useState<TokenToCheck[]>([]);
  const [checking, setChecking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [checkId, setCheckId] = useState(0);

  // Filter out native XLM (no trustline needed)
  const nonNative = tokens.filter((t) => !NATIVE_XLM.has(t.contract) && t.symbol !== "XLM");

  useEffect(() => {
    if (!walletAddress || nonNative.length === 0) {
      setMissing([]);
      return;
    }

    let cancelled = false;
    setChecking(true);

    checkAllTrustlines(walletAddress, nonNative)
      .then((missingList) => {
        if (!cancelled) {
          setMissing(missingList);
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMissing([]);
          setChecking(false);
        }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, JSON.stringify(nonNative.map((t) => t.contract)), checkId]);

  const recheck = useCallback(() => setCheckId((id) => id + 1), []);

  const addTrustline = useCallback(async (contract: string, symbol: string): Promise<boolean> => {
    if (!walletAddress) return false;
    setAdding(true);
    try {
      await checkWalletNetwork();

      const assetInfo = KNOWN_CLASSIC[contract] ?? await resolveAsset(contract);
      if (!assetInfo) {
        toast.error(`Cannot resolve asset ${symbol} for trustline`);
        return false;
      }

      const { Horizon, TransactionBuilder, Operation, Asset } = await import("@stellar/stellar-sdk");
      const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
        allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
      });
      const account = await horizon.loadAccount(walletAddress);
      const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: activeNetwork.networkPassphrase })
        .addOperation(Operation.changeTrust({ asset: new Asset(assetInfo.code, assetInfo.issuer) }))
        .setTimeout(180)
        .build();

      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
      try { StellarWalletsKit.setWallet(walletAddress); } catch { /* ignore */ }

      const signingResult = await StellarWalletsKit.signTransaction(tx.toXDR(), {
        address: walletAddress,
        networkPassphrase: activeNetwork.networkPassphrase,
      });
      const signedXdr = signingResult.signedTxXdr || signingResult;
      if (!signedXdr || typeof signedXdr !== "string") throw new Error("Invalid signed TX");

      toast.info(`Submitting ${symbol} trustline...`);
      const signedTx = TransactionBuilder.fromXDR(signedXdr, activeNetwork.networkPassphrase);
      await horizon.submitTransaction(signedTx as any);
      toast.success(`Trustline added for ${symbol}`);

      // Remove from missing list
      setMissing((prev) => prev.filter((t) => t.contract !== contract));
      return true;
    } catch (err) {
      const msg = parseSigningError(err);
      if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel")) {
        toast.error("Trustline rejected");
      } else {
        toast.error("Trustline failed", { description: msg });
      }
      return false;
    } finally {
      setAdding(false);
    }
  }, [walletAddress]);

  return { missing, hasMissing: missing.length > 0, checking, addTrustline, adding, recheck };
}

async function checkAllTrustlines(address: string, tokens: TokenToCheck[]): Promise<TokenToCheck[]> {
  const { Horizon } = await import("@stellar/stellar-sdk");
  const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
    allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
  });
  const account = await horizon.loadAccount(address);
  const balances = account.balances as Array<{ asset_type: string; asset_code?: string; asset_issuer?: string }>;

  const missingTokens: TokenToCheck[] = [];
  for (const token of tokens) {
    const assetInfo = KNOWN_CLASSIC[token.contract] ?? await resolveAsset(token.contract);
    if (!assetInfo) continue; // can't resolve — don't block

    const hasTl = balances.some(
      (b) => b.asset_type !== "native" && b.asset_code === assetInfo.code && b.asset_issuer === assetInfo.issuer,
    );
    if (!hasTl) missingTokens.push(token);
  }
  return missingTokens;
}

async function resolveAsset(contract: string): Promise<{ code: string; issuer: string } | null> {
  if (KNOWN_CLASSIC[contract]) return KNOWN_CLASSIC[contract];
  try {
    const isTestnet = activeNetwork.horizonUrl.includes("testnet");
    const network = isTestnet ? "testnet" : "public";
    const res = await fetch(`https://api.stellar.expert/explorer/${network}/contract/${contract}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.asset) {
      const [code, issuer] = data.asset.split("-");
      if (code && issuer) return { code, issuer };
    }
    return null;
  } catch { return null; }
}
