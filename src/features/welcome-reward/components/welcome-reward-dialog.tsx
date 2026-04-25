"use client";

import { ArrowUpRight, Gift } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Separator } from "@/shared/ui/separator";
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

export function WelcomeRewardDialog({
  open,
  status,
  onDismiss,
  onOpen,
}: WelcomeRewardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
              <Gift className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base">
                  You're one of the earliest users. A reward has been reserved for you.
                </DialogTitle>
                <Badge
                  variant="secondary"
                  className="border border-amber-500/20 bg-amber-500/10 text-[10px] uppercase tracking-[0.16em] text-amber-300"
                >
                  Welcome reward
                </Badge>
              </div>

              <DialogDescription>Trade ≥ $10 volume to unlock</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="mt-4" />

        <div className="space-y-3 px-5 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Tracked volume
              </span>
              <span className="font-medium text-foreground text-sm">
                {formatUsd(status.currentVolumeUsd)} / {formatUsd(status.targetVolumeUsd)}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 transition-all"
                style={{ width: `${Math.max(6, Math.min(status.progressPercent, 100))}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="h-10 flex-1" onClick={onDismiss} variant="outline">
              Got it
            </Button>
            <Button
              className="h-10 flex-1 justify-between"
              onClick={onOpen}
            >
              View reward progress
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
