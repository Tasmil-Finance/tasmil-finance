"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button-v2";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export interface AquariusPoolReward {
  /** Stable identity (pool name or address). */
  key: string;
  /** Display name like "XLM / USDC". */
  name: string;
  /** "Volatile" | "Stable" | "Concentrated" | … */
  poolType?: string;
  /** "0.10%" — already formatted. */
  fee?: string;
  /** Reward amount (human units). */
  amount: number;
  /** Reward token symbol (typically "AQUA"). */
  token: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pools: AquariusPoolReward[];
}

const MAX_CLAIM = 5;

export function AquariusClaimDialog({ open, onOpenChange, pools }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Reset selection on open: default-select all up to MAX_CLAIM
  useEffect(() => {
    if (!open) return;
    const next = new Set<string>();
    for (const p of pools.slice(0, MAX_CLAIM)) next.add(p.key);
    setSelected(next);
  }, [open, pools]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < MAX_CLAIM) next.add(key);
      else {
        toast.warning(`You can claim up to ${MAX_CLAIM} pools at a time`);
        return prev;
      }
      return next;
    });
  };

  const count = selected.size;

  const handleClaim = () => {
    const picked = pools.filter((p) => selected.has(p.key));
    toast.info(`Claim ${count} reward${count !== 1 ? "s" : ""} — coming soon`, {
      description: picked
        .map((p) => `${p.name} +${p.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${p.token}`)
        .join(" · "),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-popover text-popover-foreground">
        <DialogHeader>
          <DialogTitle>Claim Rewards</DialogTitle>
          <DialogDescription>Claim up to {MAX_CLAIM} pools at a time</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1 py-2">
          <div className="grid grid-cols-[1fr_100px_140px_28px] items-center gap-3 border-b border-border px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Pool</span>
            <span>Type</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          {pools.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No claimable Aquarius rewards.
            </div>
          ) : (
            pools.map((p) => {
              const isOn = selected.has(p.key);
              return (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => toggle(p.key)}
                  className="grid grid-cols-[1fr_100px_140px_28px] items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-foreground">{p.name}</span>
                    {p.fee && (
                      <span className="rounded bg-muted/40 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                        {p.fee}
                      </span>
                    )}
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {p.poolType ?? "—"}
                  </span>
                  <span className="text-right text-sm font-medium tabular-nums text-foreground">
                    {p.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {p.token}
                  </span>
                  <Checkbox checked={isOn} />
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleClaim}
            disabled={count === 0}
            className="w-full"
          >
            Claim {count} Reward{count !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
