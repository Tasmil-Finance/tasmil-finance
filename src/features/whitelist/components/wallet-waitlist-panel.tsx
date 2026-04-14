"use client";

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import {
  useRequestChallenge,
  useRegisterWallet,
  useWalletStatus,
} from "@/features/whitelist/hooks/use-wallet-waitlist";
import { WalletWaitlistStatusWithLoading } from "./wallet-waitlist-status";
import { Button } from "@/shared/ui/button-v2";
import { Typography } from "@/shared/ui/typography";
import { Wallet } from "lucide-react";

interface WalletWaitlistPanelProps {
  referredByCode?: string | null;
}

export function WalletWaitlistPanel({ referredByCode }: WalletWaitlistPanelProps) {
  const { isConnected, address, connect, displayAddress, isAuthenticating } = useWallet();
  const queryClient = useQueryClient();
  const requestChallenge = useRequestChallenge();
  const registerWallet = useRegisterWallet();
  const { data: walletStatus, isLoading: isWalletStatusLoading } = useWalletStatus(address);

  // Reset mutation state when address changes (e.g., user switches wallet)
  useEffect(() => {
    registerWallet.reset();
  }, [address, registerWallet]);

  const handleRegister = useCallback(async () => {
    if (!address) return;
    const challengeResult = await requestChallenge.mutateAsync({ walletAddress: address });

    const payload: Parameters<typeof registerWallet.mutateAsync>[0] = {
      walletAddress: address,
      walletProvider: "FREIGHTER",
      signedChallenge: challengeResult.challenge,
      source: "whitelist_page",
    };
    if (referredByCode) payload.referredByCode = referredByCode;

    const result = await registerWallet.mutateAsync(payload);

    // Prefill status cache with data we already have so the form shows instantly.
    // invalidateQueries then fetches the full status (queue rank etc.) in the background.
    queryClient.setQueryData(["waitlist", "status", address], {
      id: result.id,
      walletAddress: address,
      referralCode: result.referralCode,
      queueRank: null,
      totalEntries: null,
      successfulReferralCount: 0,
      referredByCode: referredByCode ?? null,
      createdAt: new Date().toISOString(),
      hasEmail: false,
      emailDeliveryEligible: false,
    });
    queryClient.invalidateQueries({ queryKey: ["waitlist", "status", address] });
  }, [address, requestChallenge, registerWallet, referredByCode, queryClient]);

  const showRegisteredState = !!walletStatus || registerWallet.isSuccess;
  const showStatusLoading =
    requestChallenge.isPending ||
    registerWallet.isPending ||
    (showRegisteredState && isWalletStatusLoading);

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Typography variant="p" className="text-sm font-medium text-foreground">
              Wallet connected
            </Typography>
            <Typography variant="small" className="text-muted-foreground">
              {displayAddress}
            </Typography>
          </div>
        </div>

        {showStatusLoading ? (
          <Button variant="gradient" size="lg" disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {requestChallenge.isPending ? "Preparing..." : "Registering..."}
          </Button>
        ) : showRegisteredState ? (
          <WalletWaitlistStatusWithLoading />
        ) : (
          <Button
            variant="gradient"
            size="lg"
            onClick={handleRegister}
            disabled={isAuthenticating}
            className="w-full"
          >
            {registerWallet.isError ? "Try again — Join waitlist" : "Join waitlist with this wallet"}
          </Button>
        )}

        {registerWallet.isError && (
          <p className="text-center text-xs text-red-500">
            {registerWallet.error?.message ?? "Registration failed. Please try again."}
          </p>
        )}

        {referredByCode && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2">
            <Typography variant="small" className="text-muted-foreground">
              You&apos;ll be credited to your referrer after registration.
            </Typography>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card/80 p-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <Typography variant="h4" className="mb-2 font-semibold tracking-tight">
          Connect your Stellar wallet
        </Typography>
        <Typography variant="p" className="text-sm leading-6 text-muted-foreground">
          The Tasmil waitlist uses wallet-based verification. Connect a Stellar wallet to
          secure your spot and get a referral link immediately. We&apos;ll ask for your email
          after registration to deliver your access code.
        </Typography>
      </div>

      <Button
        variant="gradient"
        size="lg"
        onClick={connect}
        disabled={isAuthenticating}
        className="w-full"
      >
        {isAuthenticating ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting...
          </span>
        ) : (
          "Connect Stellar wallet"
        )}
      </Button>

      <Typography variant="small" className="text-center text-muted-foreground">
        Powered by Freighter, Albedo, or any Stellar-compatible wallet.
      </Typography>
    </div>
  );
}
