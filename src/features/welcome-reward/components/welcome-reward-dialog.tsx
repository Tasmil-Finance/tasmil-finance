"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUpRight, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WelcomeRewardStatus } from "../hooks/use-welcome-reward";

interface WelcomeRewardDialogProps {
  open: boolean;
  status: WelcomeRewardStatus;
  onDismiss: () => void;
  onOpen: () => void;
}

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

export function WelcomeRewardDialog({ open, status, onDismiss, onOpen }: WelcomeRewardDialogProps) {
  const pct = Math.min(status.progressPercent, 100);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onDismiss();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=open]:animate-in"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border bg-card p-0 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in"
          )}
        >
          <div className="space-y-4 px-5 pt-5 pb-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <DialogPrimitive.Title className="font-medium text-[13px] text-foreground leading-snug">
                  A reward has been reserved for you
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-[11px] text-muted-foreground">
                  Trade {"\u2265"} {formatUsd(status.targetVolumeUsd)} volume to unlock
                </DialogPrimitive.Description>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[10px] text-muted-foreground/60 uppercase tracking-[0.12em]">
                  Volume
                </span>
                <span className="font-medium text-foreground text-xs tabular-nums">
                  {formatUsd(status.currentVolumeUsd)}{" "}
                  <span className="text-muted-foreground/50">
                    / {formatUsd(status.targetVolumeUsd)}
                  </span>
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={onOpen}
              className="relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] px-4 py-2.5 font-bold text-black text-xs transition-all duration-300 hover:scale-[1.02] hover:from-[#C5F0FF] hover:to-[#1CCFFF]"
            >
              View reward details
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
