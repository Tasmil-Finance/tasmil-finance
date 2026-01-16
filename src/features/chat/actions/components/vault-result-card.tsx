"use client";

/**
 * Vault Result Card Component
 * 
 * Renders vault operation results (deposit, withdraw, balance check, etc.)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ArrowDownToLine, ArrowUpFromLine, Coins, TrendingUp, Wallet } from "lucide-react";

interface VaultResultProps {
  type: "status" | "rebalance" | "harvest" | "read";
  args: Record<string, unknown>;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
  };
  toolName: string;
  toolCallId?: string;
  status?: "pending" | "executing" | "complete" | "error";
}

const TITLE_MAP = {
  status: "Vault Status",
  rebalance: "Vault Rebalance",
  harvest: "Vault Harvest",
  read: "Vault Data",
};

const ICON_MAP = {
  status: Wallet,
  rebalance: TrendingUp,
  harvest: Coins,
  read: Wallet,
};

export function VaultResultCard({ type, args, result, status = "complete" }: VaultResultProps) {
  const title = TITLE_MAP[type] || "Vault Info";
  const Icon = ICON_MAP[type] || Coins;
  const isLoading = !result || status === "pending" || status === "executing";
  const hasError = result && !result.success;

  // Extract data from result
  const data = result?.data || result;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {hasError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{result.error || "Failed to load data"}</p>
          </div>
        )}

        {result && result.success && (
          <div className="space-y-3">
            {/* Vault Address */}
            {(data.address || args["vaultAddress"]) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vault:</span>
                <span className="font-mono text-xs">
                  {String(data.address || args["vaultAddress"]).slice(0, 6)}...
                  {String(data.address || args["vaultAddress"]).slice(-4)}
                </span>
              </div>
            )}

            {/* Status Result */}
            {type === "status" && data && (
              <>
                {data.tvl && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value Locked:</span>
                    <span className="font-semibold text-green-600">${data.tvl}</span>
                  </div>
                )}
                {data.strategyCount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Strategies:</span>
                    <span className="font-medium">{data.strategyCount}</span>
                  </div>
                )}
                {data.strategies && Array.isArray(data.strategies) && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Strategies:</div>
                    {data.strategies.map((strategy: any, idx: number) => (
                      <div key={idx} className="text-xs bg-muted/30 rounded p-2 mb-1">
                        <div className="font-mono">{strategy.address?.slice(0, 10)}...</div>
                        <div>Debt: {strategy.currentDebt}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Rebalance Result */}
            {type === "rebalance" && data && (
              <>
                {data.transactions && Array.isArray(data.transactions) && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {data.transactions.length} transactions prepared
                    </div>
                    {data.transactions.map((tx: any, idx: number) => (
                      <div key={idx} className="bg-muted/30 rounded p-2 text-xs">
                        <div className="font-medium">{tx.method}</div>
                        <div className="text-muted-foreground">To: {tx.to?.slice(0, 10)}...</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Harvest Result */}
            {type === "harvest" && data && (
              <>
                {data.message && (
                  <div className="text-sm">{data.message}</div>
                )}
                {data.estimatedRewards && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Rewards:</span>
                    <span className="font-semibold text-green-600">{data.estimatedRewards}</span>
                  </div>
                )}
              </>
            )}

            {/* Read Result */}
            {type === "read" && data && (
              <>
                {data.result !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Result:</span>
                    <span className="font-medium">{String(data.result)}</span>
                  </div>
                )}
              </>
            )}

            {/* Raw data fallback */}
            {!["status", "rebalance", "harvest", "read"].includes(type) && data && (
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
