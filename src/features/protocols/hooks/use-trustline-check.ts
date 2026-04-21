"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { activeNetwork } from "@/shared/config/stellar";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";

interface TrustlineCheckResult {
  /** Whether the asset needs a trustline (false for native XLM) */
  needsTrustline: boolean;
  /** Whether the trustline exists */
  hasTrustline: boolean;
  /** Loading state */
  checking: boolean;
  /** Add trustline and return success */
  addTrustline: () => Promise<boolean>;
  /** Whether trustline is being added */
  adding: boolean;
  /** Re-check trustline status */
  recheck: () => void;
}

/** Native XLM SAC addresses — these don't need trustlines */
const NATIVE_XLM_ADDRESSES = new Set([
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", // mainnet
  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", // soroswap variant
]);

/**
 * Check if a wallet has a trustline for a Soroban token contract.
 * For Soroban tokens (C... addresses), we check the contract's admin/issuer
 * and look for a matching classic trustline.
 */
export function useTrustlineCheck(
  walletAddress: string | undefined,
  assetContract: string | undefined,
  symbol?: string,
): TrustlineCheckResult {
  const [hasTrustline, setHasTrustline] = useState(true); // assume true until checked
  const [checking, setChecking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [checkId, setCheckId] = useState(0);

  const isNative = !assetContract || NATIVE_XLM_ADDRESSES.has(assetContract) || symbol === "XLM";

  useEffect(() => {
    if (!walletAddress || !assetContract || isNative) {
      setHasTrustline(true);
      return;
    }

    let cancelled = false;
    setChecking(true);

    checkTrustlineExists(walletAddress, assetContract)
      .then((exists) => {
        if (!cancelled) {
          setHasTrustline(exists);
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasTrustline(true); // assume true on error to not block user
          setChecking(false);
        }
      });

    return () => { cancelled = true; };
  }, [walletAddress, assetContract, isNative, checkId]);

  const recheck = useCallback(() => setCheckId((id) => id + 1), []);

  const addTrustline = useCallback(async (): Promise<boolean> => {
    if (!walletAddress || !assetContract || isNative) return true;

    setAdding(true);
    try {
      await checkWalletNetwork();

      // Resolve the classic asset info from the Soroban contract
      const assetInfo = await resolveClassicAsset(assetContract);
      if (!assetInfo) {
        toast.error("Cannot resolve asset for trustline");
        return false;
      }

      const { Horizon, TransactionBuilder, Operation, Asset } = await import("@stellar/stellar-sdk");

      const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
        allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
      });
      const account = await horizon.loadAccount(walletAddress);

      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: activeNetwork.networkPassphrase,
      })
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
      if (!signedXdr || typeof signedXdr !== "string") throw new Error("Invalid signed transaction");

      toast.info("Submitting trustline...");
      const signedTx = TransactionBuilder.fromXDR(signedXdr, activeNetwork.networkPassphrase);
      await horizon.submitTransaction(signedTx as any);

      toast.success(`Trustline added for ${symbol ?? assetInfo.code}`);
      setHasTrustline(true);
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
  }, [walletAddress, assetContract, isNative, symbol]);

  return {
    needsTrustline: !isNative,
    hasTrustline: isNative ? true : hasTrustline,
    checking,
    addTrustline,
    adding,
    recheck,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

async function checkTrustlineExists(address: string, assetContract: string): Promise<boolean> {
  try {
    const { Horizon } = await import("@stellar/stellar-sdk");
    const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
      allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
    });
    const account = await horizon.loadAccount(address);

    // For Soroban tokens, resolve to classic CODE:ISSUER and check balances
    const assetInfo = await resolveClassicAsset(assetContract);
    if (!assetInfo) return true; // can't resolve — don't block

    return account.balances.some((b: any) => {
      if (b.asset_type === "native") return false;
      return b.asset_code === assetInfo.code && b.asset_issuer === assetInfo.issuer;
    });
  } catch {
    return true; // on error, don't block
  }
}

/** Map of known Soroban token contract → classic asset {code, issuer} */
const KNOWN_CLASSIC_ASSETS: Record<string, { code: string; issuer: string }> = {
  // Testnet USDC variants
  CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  // Mainnet USDC
  CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75: { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
  // BLND
  CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF: { code: "BLND", issuer: "GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56" },
  // USDT
  CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN: { code: "USDT", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  // AQUA
  CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE: { code: "AQUA", issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA" },
};

async function resolveClassicAsset(contract: string): Promise<{ code: string; issuer: string } | null> {
  if (KNOWN_CLASSIC_ASSETS[contract]) return KNOWN_CLASSIC_ASSETS[contract];

  // Try fetching from Stellar Expert API for unknown tokens
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
  } catch {
    return null;
  }
}
