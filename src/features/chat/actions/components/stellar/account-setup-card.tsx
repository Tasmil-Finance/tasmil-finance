"use client";

import { CheckCircle2, Circle, Loader2, Rocket, XCircle } from "lucide-react";
import { memo } from "react";
import { MetricBox } from "@/features/protocols/cards/base/indicators";
import { ProtocolCard } from "@/features/protocols/cards/base/protocol-card";
import { useResultData } from "../../hooks/use-result-data";

interface AccountSetupData {
  has_account?: boolean;
  hasAccount?: boolean;
  status?: string;
  preset?: string;
  next_step?: string;
  nextStep?: string;
  total_value_usd?: number;
  totalValueUsd?: number;
  current_apy?: number;
  currentApy?: number;
  message?: string;
  position_count?: number;
  error?: string;
}

interface AccountSetupCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

const STEPS = [
  { key: "deploy", label: "Deploy Smart Account", desc: "Create on-chain keeper wallet" },
  { key: "setup", label: "Configure Session Key", desc: "Authorize bot management" },
  { key: "fund", label: "Fund Account", desc: "Deposit USDC or XLM" },
  { key: "active", label: "Strategy Active", desc: "Auto-rebalancing live" },
];

type StepStatus = "pending" | "in-progress" | "done" | "error";

function getStepStatus(stepKey: string, nextStep: string): StepStatus {
  const stepOrder = ["deploy", "setup", "fund", "active"];
  const currentIdx = stepOrder.indexOf(nextStep);
  const stepIdx = stepOrder.indexOf(stepKey);

  if (currentIdx === -1) return "pending";
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "in-progress";
  return "pending";
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-5 w-5 text-foreground" />;
    case "in-progress":
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    case "error":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/30" />;
  }
}

function AccountSetupCardComponent({ result, status }: AccountSetupCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<AccountSetupData>(
    result,
    status
  );

  const hasAccount = data?.has_account ?? data?.hasAccount ?? false;
  const nextStep = (data?.next_step ?? data?.nextStep ?? "deploy").toLowerCase();
  const accountStatus = data?.status ?? "";
  const accountPreset = data?.preset ?? "";
  const totalValue = data?.total_value_usd ?? data?.totalValueUsd;
  const currentApy = data?.current_apy ?? data?.currentApy;

  // No account — show setup steps
  if (!hasAccount && !isLoading) {
    return (
      <ProtocolCard
        data-testid="card-account-setup"
        mode="chat"
        title="Setting Up Your Smart Account"
        subtitle={`${STEPS.findIndex((s) => s.key === nextStep) + 1} of ${STEPS.length} steps`}
        icon={Rocket}
        iconColor="text-primary"
        iconBg="bg-primary/10"
        isLoading={isLoading}
        error={hasError ? errorMessage : undefined}
      >
        <div className="space-y-0">
          {STEPS.map((step, idx) => {
            const stepStatus = getStepStatus(step.key, nextStep);
            const isLast = idx === STEPS.length - 1;

            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepIcon status={stepStatus} />
                  {!isLast && (
                    <div
                      className={`mt-0.5 min-h-[16px] w-px flex-1 ${
                        stepStatus === "done" ? "bg-primary/30" : "bg-border"
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-3 ${stepStatus === "in-progress" ? "" : "opacity-50"}`}>
                  <div className="font-medium text-xs">
                    {idx + 1}. {step.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{step.desc}</div>
                  {stepStatus === "in-progress" && (
                    <div className="mt-0.5 animate-pulse font-medium text-[10px] text-primary">
                      Waiting for confirmation...
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {data?.message && (
            <div className="mt-2 rounded-lg bg-secondary p-2.5 text-[10px] text-muted-foreground">
              {data.message}
            </div>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // Has account — show current status with metrics
  return (
    <ProtocolCard
      data-testid="card-account-setup"
      mode="chat"
      title="Your Smart Account"
      subtitle={
        totalValue != null
          ? `$${totalValue.toLocaleString()} \u00B7 ${accountPreset}`
          : accountPreset || "Active"
      }
      icon={Rocket}
      iconColor="text-primary"
      iconBg="bg-primary/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : undefined}
    >
      <div className="space-y-3">
        {/* Status metrics */}
        <div className="grid grid-cols-2 gap-1.5">
          <MetricBox label="Status" value={accountStatus || "Unknown"} />
          <MetricBox label="Preset" value={accountPreset || "BALANCED"} />
        </div>

        {(totalValue != null || currentApy != null) && (
          <div className="grid grid-cols-2 gap-1.5">
            {totalValue != null && (
              <MetricBox label="Total Value" value={`$${totalValue.toLocaleString()}`} />
            )}
            {currentApy != null && (
              <MetricBox label="Current APY" value={`${currentApy.toFixed(1)}%`} />
            )}
          </div>
        )}

        {data?.message && (
          <div className="rounded-lg bg-secondary p-2.5 text-[10px] text-muted-foreground">
            {data.message}
          </div>
        )}
      </div>
    </ProtocolCard>
  );
}

export const AccountSetupCard = memo(AccountSetupCardComponent);
