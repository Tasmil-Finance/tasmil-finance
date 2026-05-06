"use client";

import { ArrowUpRight, Gift } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import type { WelcomeRewardStatus } from "../hooks/use-welcome-reward";

interface WelcomeRewardCardProps {
  status: WelcomeRewardStatus;
  onOpen: () => void;
}

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

export function WelcomeRewardCard({ status, onOpen }: WelcomeRewardCardProps) {
  return (
    <Card className="mb-4 border-border bg-card shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Gift className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-base text-foreground">
                You're one of the earliest users. A reward has been reserved for you.
              </p>
              <Badge
                variant="secondary"
                className="border border-primary/20 bg-primary/10 text-[10px] text-primary uppercase tracking-[0.16em]"
              >
                Welcome reward
              </Badge>
            </div>

            <p className="text-muted-foreground text-sm">Trade ≥ $10 volume to unlock</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3 px-5 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
                Tracked volume
              </span>
              <span className="font-medium text-foreground text-sm">
                {formatUsd(status.currentVolumeUsd)} / {formatUsd(status.targetVolumeUsd)}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] transition-all"
                style={{ width: `${Math.min(status.progressPercent, 100)}%` }}
              />
            </div>
          </div>

          <Button
            className="h-10 w-full justify-between rounded-lg"
            onClick={onOpen}
            variant="gradient"
          >
            View reward progress
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
