"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import backendAxios from "@/lib/kubb-backend";
import { activeNetwork } from "@/shared/config/stellar";
import { useAuthStore } from "@/store/use-auth";

export type ClaimProtocol = "aquarius" | "blend";

export class ClaimAuthError extends Error {
  constructor(message = "You're not signed in. Please reconnect your wallet.") {
    super(message);
    this.name = "ClaimAuthError";
  }
}

interface ClaimArgs {
  protocol: ClaimProtocol;
  publicKey: string;
  poolAddress: string;
}

interface BuildClaimResponse {
  xdr: string;
  estimatedFee?: string | number;
}

interface SubmitClaimResponse {
  txHash: string;
}

/**
 * Build → sign (Stellar Wallets Kit) → submit a user-signed reward-claim
 * transaction. Pure on-chain; no backend DB writes.
 *
 * On success, refetches the protocol-specific positions queries so the
 * "Rewards" card immediately reflects the cleared balance.
 */
export function useClaimRewards() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ protocol, publicKey, poolAddress }: ClaimArgs) => {
      // 0. Pre-flight auth guard. The backend AuthGuard will return 401 with
      //    a generic message if the JWT is absent — surfacing this earlier
      //    avoids a confusing silent failure and gives the UI a chance to
      //    prompt re-authentication.
      const auth = useAuthStore.getState();
      if (!auth.accessToken || auth.isTokenExpired()) {
        throw new ClaimAuthError();
      }

      // 1. Build unsigned XDR on the backend.
      const buildPath = `/api/rewards/${protocol}/claim/build`;
      const { data: buildEnvelope } = await backendAxios.post<{
        data: BuildClaimResponse;
      }>(buildPath, { publicKey, poolAddress });
      const xdr = buildEnvelope?.data?.xdr;
      if (!xdr) throw new Error("No claim XDR returned from server");

      // 2. Sign with the connected wallet (Freighter / xBull / etc).
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
      const signed = await StellarWalletsKit.signTransaction(xdr, {
        address: publicKey,
        networkPassphrase: activeNetwork.networkPassphrase,
      });
      const signedTxXdr = signed?.signedTxXdr;
      if (typeof signedTxXdr !== "string" || signedTxXdr.length === 0) {
        const err = new Error("User rejected transaction signing");
        (err as Error & { userRejected?: boolean }).userRejected = true;
        throw err;
      }

      // 3. Submit + confirm on-chain.
      const { data: submitEnvelope } = await backendAxios.post<{
        data: SubmitClaimResponse;
      }>("/api/rewards/submit", { signedXdr: signedTxXdr });
      const txHash = submitEnvelope?.data?.txHash;
      if (!txHash) throw new Error("No txHash returned from claim submit");

      return { txHash, protocol, poolAddress };
    },

    // After a confirmed claim, the position's reward balance just zeroed
    // on-chain — invalidate so the UI shows it immediately.
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey?.[0];
          return (
            k === "profile" || // covers ["profile", "{aquarius,blend}-positions", addr]
            k === "/api/account/position" ||
            k === "/api/account/activity"
          );
        },
      });
    },
  });
}
