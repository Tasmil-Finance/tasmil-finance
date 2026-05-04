"use client";

import { FundForm } from "@/features/account/components/fund-form";

interface FundModalProps {
  onFund: (amount: number, token: "USDC" | "XLM") => Promise<void> | void;
  isLoading: boolean;
}

export function FundModal({ onFund, isLoading }: FundModalProps) {
  return (
    <div className="space-y-4 pt-3">
      <FundForm onFund={onFund} isLoading={isLoading} />
    </div>
  );
}
