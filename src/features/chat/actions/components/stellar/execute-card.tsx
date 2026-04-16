"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRightLeft, Coins, FileCode, Globe, TrendingUp } from "lucide-react";
import { truncateAddress } from "@/shared/config/stellar";
import { DetailRow } from "../base/indicators";
import { BaseOperationCard } from "../base/operation-card";

interface ExecuteResult {
  success: boolean;
  protocol?: string;
  xdr?: string;
  estimatedFee?: string;
  route?: string[];
  poolAddress?: string;
  error?: string;
}

interface StellarExecuteCardProps {
  operation?: string;
  args?: Record<string, any>;
  result?: unknown;
  toolCallId?: string;
  status?: "pending" | "executing" | "complete" | "error" | "inProgress";
  respond?: (result: Record<string, unknown>) => void;
}

const OPERATION_CONFIG: Record<
  string,
  { title: string; buttonText: string; icon: LucideIcon; iconColor: string; iconBg: string }
> = {
  swap_execute: {
    title: "Sign Swap",
    buttonText: "Sign & Swap",
    icon: ArrowRightLeft,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  bridge_execute: {
    title: "Sign Bridge Transfer",
    buttonText: "Sign & Bridge",
    icon: Globe,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  vault_execute: {
    title: "Sign Vault Operation",
    buttonText: "Sign & Execute",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  staking_execute: {
    title: "Sign Staking Operation",
    buttonText: "Sign & Stake",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  // Blend lending operations
  blend_deposit: {
    title: "Sign Blend Deposit",
    buttonText: "Sign & Deposit",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  blend_borrow: {
    title: "Sign Blend Borrow",
    buttonText: "Sign & Borrow",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  blend_repay: {
    title: "Sign Blend Repay",
    buttonText: "Sign & Repay",
    icon: Coins,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  blend_withdraw: {
    title: "Sign Blend Withdrawal",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  blend_toggle_collateral: {
    title: "Sign Collateral Toggle",
    buttonText: "Sign & Toggle",
    icon: Coins,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-500/10",
  },
  blend_claim_emissions: {
    title: "Sign Emissions Claim",
    buttonText: "Sign & Claim",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  blend_backstop_deposit: {
    title: "Sign Backstop Deposit",
    buttonText: "Sign & Deposit",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  blend_backstop_queue_withdrawal: {
    title: "Sign Backstop Queue",
    buttonText: "Sign & Queue",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  blend_backstop_dequeue_withdrawal: {
    title: "Sign Backstop Dequeue",
    buttonText: "Sign & Dequeue",
    icon: Coins,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  blend_backstop_withdraw: {
    title: "Sign Backstop Withdrawal",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
};

const DEFAULT_CONFIG = {
  title: "Sign Transaction",
  buttonText: "Sign & Submit",
  icon: FileCode,
  iconColor: "text-primary",
  iconBg: "bg-primary/10",
};

export function StellarExecuteCard({
  operation,
  args,
  result,
  status = "executing",
  respond,
}: StellarExecuteCardProps) {
  const config = OPERATION_CONFIG[operation ?? ""] ?? DEFAULT_CONFIG;

  // Parse the execute result for XDR
  // MCP tool results may arrive as an array of content blocks [{type:"text",text:"..."}]
  const normalizedResult = Array.isArray(result)
    ? (() => {
        const block = (result as any[]).find((b) => b?.type === "text" && typeof b?.text === "string");
        if (!block) return result;
        try { return JSON.parse(block.text); } catch { return block.text; }
      })()
    : result;
  let execResult: ExecuteResult | null = null;
  if (normalizedResult && typeof normalizedResult === "object") {
    execResult = normalizedResult as ExecuteResult;
  } else if (typeof normalizedResult === "string") {
    try {
      execResult = JSON.parse(normalizedResult);
    } catch {
      /* ignore */
    }
  }

  const xdr = execResult?.xdr ?? args?.xdr;
  const protocol = execResult?.protocol ?? args?.protocol;
  const estimatedFee = execResult?.estimatedFee ?? args?.estimatedFee;
  const route = execResult?.route ?? args?.route;
  const action = args?.action;

  const handleExecute = async (address: string) => {
    if (!xdr) {
      return { success: false, error: "No transaction XDR available" };
    }

    try {
      // Sign XDR with Stellar wallet
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        address,
        networkPassphrase: undefined,
      });

      // Return signed XDR - the agent will call submit_transaction with it
      return {
        success: true,
        hash: signedTxXdr,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Signing failed";
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancel")) {
        return { success: false, error: "Transaction rejected by user" };
      }
      return { success: false, error: msg };
    }
  };

  const renderDetails = () => (
    <div className="mb-2 space-y-2">
      {action && (
        <DetailRow
          label="Action"
          value={<span className="capitalize">{action.replace(/_/g, " ")}</span>}
        />
      )}
      {protocol && (
        <DetailRow label="Protocol" value={<span className="capitalize">{protocol}</span>} />
      )}
      {estimatedFee && <DetailRow label="Est. Fee" value={estimatedFee} />}
      {route && route.length > 1 && <DetailRow label="Route" value={route.join(" → ")} />}
      {args?.tokenIn && args?.tokenOut && (
        <DetailRow label="Pair" value={`${args.tokenIn} → ${args.tokenOut}`} />
      )}
      {args?.amount && <DetailRow label="Amount" value={args.amount as string} />}
      {args?.from && <DetailRow label="From" value={truncateAddress(String(args.from))} mono />}
      {args?.poolAddress && (
        <DetailRow label="Pool" value={truncateAddress(String(args.poolAddress))} mono />
      )}
      {xdr && (
        <div className="mt-2 border-t pt-2">
          <div className="mb-1 text-muted-foreground text-xs">Transaction XDR</div>
          <div className="max-h-[60px] overflow-y-auto break-all rounded bg-muted/30 p-2 font-mono text-[10px] text-muted-foreground">
            {xdr.slice(0, 200)}
            {xdr.length > 200 ? "..." : ""}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <BaseOperationCard
      title={config.title}
      icon={config.icon}
      iconColor={config.iconColor}
      iconBg={config.iconBg}
      buttonText={config.buttonText}
      status={status}
      result={result}
      respond={respond}
      onExecute={handleExecute}
      renderDetails={renderDetails}
    />
  );
}
