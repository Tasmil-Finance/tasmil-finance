"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet } from "lucide-react";
import { useCallback, useEffect } from "react";
import {
  useRegisterWallet,
  useRequestChallenge,
  useWalletStatus,
} from "@/features/whitelist/hooks/use-wallet-waitlist";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { Typography } from "@/shared/ui/typography";
import { ProgressStepper, type Step } from "./ui/stepper";

interface WaitlistScreen1Props {
  referredByCode?: string | null;
  onJoined?: () => void;
}

const STEPS: Step[] = [
  { id: "wallet", label: "Connect", state: "active" },
  { id: "email", label: "Email", state: "inactive" },
  { id: "done", label: "Done", state: "inactive" },
];

export function WaitlistScreen1({ referredByCode, onJoined }: WaitlistScreen1Props) {
  const { isConnected, address, connect, displayAddress, isAuthenticating } = useWallet();
  const queryClient = useQueryClient();
  const requestChallenge = useRequestChallenge();
  const registerWallet = useRegisterWallet();
  const { data: walletStatus } = useWalletStatus(address);

  // Reset mutation state when address changes
  useEffect(() => {
    registerWallet.reset();
  }, [registerWallet]);

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

    // Prefill status cache so the next screen shows instantly
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
    // Notify parent so it marks this session as joined (prevents loop-back
    // to Screen 1 if the background status refetch later fails).
    onJoined?.();
    // Background refetch to get real queue rank — fire-and-forget, no await.
    queryClient.invalidateQueries({ queryKey: ["waitlist", "status", address] });
  }, [
    address,
    requestChallenge,
    registerWallet,
    referredByCode,
    queryClient, // Notify parent so it marks this session as joined (prevents loop-back
    // to Screen 1 if the background status refetch later fails).
    onJoined,
  ]);

  const isPending = requestChallenge.isPending || registerWallet.isPending;

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col gap-4">
        <ProgressStepper steps={STEPS} />

        <div className="text-center">
          <Typography variant="h4" className="text-center font-bold uppercase tracking-wide">
            Join the Waitlist
          </Typography>
          <Typography variant="small" className="mt-1 text-center text-muted-foreground">
            Connect your Stellar wallet to secure your spot.
          </Typography>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <Typography variant="p" className="text-center font-medium text-foreground text-sm">
            Connect your Stellar wallet
          </Typography>
          <Typography variant="small" className="mt-1 text-center text-muted-foreground">
            Wallet-based verification. We&apos;ll ask for your email after registration.
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
            "Connect Stellar Wallet"
          )}
        </Button>

        <Typography variant="small" className="text-center text-muted-foreground">
          Powered by Freighter, Albedo, or any Stellar-compatible wallet.
        </Typography>
      </div>
    );
  }

  // Wallet connected u2014 show join button
  return (
    <div className="flex flex-col gap-4">
      <ProgressStepper steps={STEPS} />

      <div className="text-center">
        <Typography variant="h4" className="text-center font-bold uppercase tracking-wide">
          Join the Waitlist
        </Typography>
        <Typography variant="small" className="mt-1 text-center text-muted-foreground">
          Your wallet is connected. Confirm to register.
        </Typography>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <Typography variant="p" className="font-medium text-foreground text-sm">
            Wallet connected
          </Typography>
          <Typography variant="small" className="text-muted-foreground">
            {displayAddress}
          </Typography>
        </div>
      </div>

      {referredByCode && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2">
          <Typography variant="small" className="text-muted-foreground">
            You&apos;ll be credited to your referrer after registration.
          </Typography>
        </div>
      )}

      {isPending ? (
        <Button variant="gradient" size="lg" disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {requestChallenge.isPending ? "Preparing..." : "Registering..."}
        </Button>
      ) : (
        <Button
          variant="gradient"
          size="lg"
          onClick={handleRegister}
          disabled={isAuthenticating || !!walletStatus}
          className="w-full"
        >
          {registerWallet.isError
            ? "Try again u2014 Join waitlist"
            : "Join waitlist with this wallet"}
        </Button>
      )}

      {registerWallet.isError && (
        <p className="text-center text-red-500 text-xs">
          {registerWallet.error?.message ?? "Registration failed. Please try again."}
        </p>
      )}
    </div>
  );
}
