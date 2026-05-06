"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";
import { activeNetwork } from "@/shared/config/stellar";

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

function isNativeAsset(assetContract: string | undefined, symbol?: string): boolean {
  return !assetContract || NATIVE_XLM_ADDRESSES.has(assetContract) || symbol === "XLM";
}

/** Map of known Soroban token contract → classic asset {code, issuer} */
const KNOWN_CLASSIC_ASSETS: Record<string, { code: string; issuer: string }> = {
  // Testnet USDC variants
  CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU: {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA: {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5: {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  // Mainnet USDC
  CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75: {
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  },
  // BLND
  CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF: {
    code: "BLND",
    issuer: "GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56",
  },
  // USDT
  CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN: {
    code: "USDT",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  // AQUA
  CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE: {
    code: "AQUA",
    issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
  },
};

async function resolveClassicAsset(
  contract: string
): Promise<{ code: string; issuer: string } | null> {
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

/**
 * Check whether `walletAddress` has a trustline for the asset behind `assetContract`.
 *
 * Contract:
 *  - Returns `true` for native XLM (no trustline needed)
 *  - Returns `true` if the wallet holds a matching `(asset_code, asset_issuer)` balance
 *  - Returns `true` if `resolveClassicAsset` cannot resolve the contract (don't block)
 *  - Returns `false` if the wallet does NOT hold the asset
 *  - **Throws** on Horizon network failure — callers decide whether to treat as "has" or "missing"
 */
export async function checkTrustlineExists(
  walletAddress: string,
  assetContract: string,
  symbol?: string
): Promise<boolean> {
  if (isNativeAsset(assetContract, symbol)) return true;

  const { Horizon } = await import("@stellar/stellar-sdk");
  const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
    allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
  });
  const account = await horizon.loadAccount(walletAddress);

  const assetInfo = await resolveClassicAsset(assetContract);
  if (!assetInfo) return true; // can't resolve — don't block

  return account.balances.some(
    (b: { asset_type: string; asset_code?: string; asset_issuer?: string }) => {
      if (b.asset_type === "native") return false;
      return b.asset_code === assetInfo.code && b.asset_issuer === assetInfo.issuer;
    }
  );
}

/**
 * Build, sign, and submit a `ChangeTrust` transaction adding the asset behind `assetContract`
 * to `walletAddress`. Returns `true` on success, `false` on rejection or failure (with toast).
 *
 * Never throws — toasts the error and returns false.
 */
export async function addTrustline(
  walletAddress: string,
  assetContract: string,
  symbol?: string
): Promise<boolean> {
  if (isNativeAsset(assetContract, symbol)) return true;

  try {
    await checkWalletNetwork();

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
    try {
      StellarWalletsKit.setWallet(walletAddress);
    } catch {
      /* ignore */
    }

    const signingResult = await StellarWalletsKit.signTransaction(tx.toXDR(), {
      address: walletAddress,
      networkPassphrase: activeNetwork.networkPassphrase,
    });

    const signedXdr = signingResult.signedTxXdr || signingResult;
    if (!signedXdr || typeof signedXdr !== "string") throw new Error("Invalid signed transaction");

    toast.info("Submitting trustline...");
    const signedTx = TransactionBuilder.fromXDR(signedXdr, activeNetwork.networkPassphrase);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await horizon.submitTransaction(signedTx as any);

    toast.success(`Trustline added for ${symbol ?? assetInfo.code}`);
    return true;
  } catch (err) {
    const msg = parseSigningError(err);
    if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel")) {
      toast.error("Trustline rejected");
    } else {
      toast.error("Trustline failed", { description: msg });
    }
    return false;
  }
}

/**
 * React hook: Check trustline status for a single (wallet, asset) pair.
 * Internally delegates to `checkTrustlineExists` + `addTrustline`.
 *
 * Hook policy: on `checkTrustlineExists` throw, report `hasTrustline: true` so the
 * UI does NOT prompt the user to add a trustline they may already have. Aggregator
 * batch consumers should use `checkTrustlineExists` directly and pick their own policy.
 */
export function useTrustlineCheck(
  walletAddress: string | undefined,
  assetContract: string | undefined,
  symbol?: string
): TrustlineCheckResult {
  const [hasTrustline, setHasTrustline] = useState(true); // assume true until checked
  const [checking, setChecking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [_checkId, setCheckId] = useState(0);

  const isNative = isNativeAsset(assetContract, symbol);

  useEffect(() => {
    if (!walletAddress || !assetContract || isNative) {
      setHasTrustline(true);
      return;
    }

    let cancelled = false;
    setChecking(true);

    checkTrustlineExists(walletAddress, assetContract, symbol)
      .then((exists) => {
        if (!cancelled) {
          setHasTrustline(exists);
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Hook policy: don't block user on Horizon failure
          setHasTrustline(true);
          setChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress, assetContract, isNative, symbol]);

  const recheck = useCallback(() => setCheckId((id) => id + 1), []);

  const addTrustlineHookAction = useCallback(async (): Promise<boolean> => {
    if (!walletAddress || !assetContract || isNative) return true;
    setAdding(true);
    try {
      const ok = await addTrustline(walletAddress, assetContract, symbol);
      if (ok) setHasTrustline(true);
      return ok;
    } finally {
      setAdding(false);
    }
  }, [walletAddress, assetContract, isNative, symbol]);

  return {
    needsTrustline: !isNative,
    hasTrustline: isNative ? true : hasTrustline,
    checking,
    addTrustline: addTrustlineHookAction,
    adding,
    recheck,
  };
}
