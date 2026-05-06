"use client";

import { XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ActivateModal } from "./modals/activate-modal";
import { FundModal } from "./modals/fund-modal";
import { SecurityModal } from "./modals/security-modal";
import { WithdrawModal } from "./modals/withdraw-modal";

export type FarmingModalTab = "fund" | "withdraw" | "security" | "activate";

interface FarmingModalsProps {
  open: boolean;
  tab: FarmingModalTab;
  onOpenChange: (open: boolean) => void;
  actionError: string | null;
  isPending: boolean;
  // Fund
  onFund: (amount: number, token: "USDC" | "XLM") => Promise<void> | void;
  // Withdraw
  availableUsd: number;
  lockedUsd: number;
  withdrawAmount: string;
  onWithdrawAmountChange: (next: string) => void;
  onWithdraw: () => void;
  // Security
  onRevoke: () => void;
  // Activate / Security shared
  onReactivate: () => void;
}

const TITLES: Record<FarmingModalTab, { title: string; description: string }> = {
  fund: {
    title: "Deposit More",
    description: "Add funds to your farming agent.",
  },
  withdraw: {
    title: "Withdraw",
    description: "Withdraw from available positions.",
  },
  security: {
    title: "Revoke Session Key",
    description: "Pause bot automation — reversible any time.",
  },
  activate: {
    title: "Activate Session Key",
    description: "Re-register a session key so the agent can resume automation.",
  },
};

export function FarmingModals(props: FarmingModalsProps) {
  const { open, tab, onOpenChange, actionError, isPending } = props;
  const titleConfig = TITLES[tab];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titleConfig.title}</DialogTitle>
          <DialogDescription>{titleConfig.description}</DialogDescription>
        </DialogHeader>

        {actionError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {tab === "fund" && <FundModal onFund={props.onFund} isLoading={isPending} />}
        {tab === "withdraw" && (
          <WithdrawModal
            availableUsd={props.availableUsd}
            lockedUsd={props.lockedUsd}
            amount={props.withdrawAmount}
            onAmountChange={props.onWithdrawAmountChange}
            onSubmit={props.onWithdraw}
            isPending={isPending}
          />
        )}
        {tab === "security" && (
          <SecurityModal
            onRefresh={props.onReactivate}
            onRevoke={props.onRevoke}
            isPending={isPending}
          />
        )}
        {tab === "activate" && (
          <ActivateModal onActivate={props.onReactivate} isPending={isPending} />
        )}
      </DialogContent>
    </Dialog>
  );
}
