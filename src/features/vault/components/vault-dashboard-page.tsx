"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/shared/ui/button-v2";
import { Skeleton } from "@/shared/ui/skeleton";
import { useWalletStore } from "@/store/use-wallet";

import {
  useVaultActivity,
  useVaultPosition,
  useWithdraw,
} from "../hooks/use-vault-api";
import { ActivityList } from "./activity-list";
import { AllocationBar } from "./allocation-bar";
import { PositionCard } from "./position-card";
import { WithdrawCard } from "./withdraw-card";

export function VaultDashboardPage() {
  const router = useRouter();
  const { account } = useWalletStore();
  const publicKey = account ?? null;

  const { data: position, isLoading: positionLoading } = useVaultPosition(publicKey);
  const { data: activities } = useVaultActivity(publicKey);
  const withdraw = useWithdraw();

  // Redirect to deposit page if no position (and not loading)
  useEffect(() => {
    if (!positionLoading && !position && publicKey) {
      router.replace("/vault");
    }
  }, [positionLoading, position, publicKey, router]);

  // No wallet connected
  if (!publicKey) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <p className="text-muted-foreground">Connect your wallet to view your vault position.</p>
      </div>
    );
  }

  // Loading
  if (positionLoading || !position) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  // Withdrawal success
  if (withdraw.status === "success") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Withdrawal Complete</h2>
        <p className="mb-6 text-muted-foreground">
          Funds have been sent to your wallet.
        </p>
        <Button variant="outline" asChild>
          <Link href="/vault">Back to Vault</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      {/* Position */}
      <PositionCard position={position} />

      {/* Withdraw */}
      <WithdrawCard
        position={position}
        status={withdraw.status}
        lastData={withdraw.data}
        onWithdraw={(token, shares) => {
          if (!publicKey) return;
          withdraw.mutate({ publicKey, token, shares });
        }}
      />

      {/* Allocations */}
      {position.allocations.length > 0 && (
        <AllocationBar allocations={position.allocations} />
      )}

      {/* Activity */}
      {activities && <ActivityList activities={activities} />}

      {/* Deposit more link */}
      <div className="text-center">
        <Button variant="outline" asChild>
          <Link href="/vault">Deposit More</Link>
        </Button>
      </div>
    </div>
  );
}
