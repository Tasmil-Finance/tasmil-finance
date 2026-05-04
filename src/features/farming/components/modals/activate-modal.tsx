"use client";

import { Loader2, Shield } from "lucide-react";
import { Button } from "@/shared/ui/button-v2";

interface ActivateModalProps {
  onActivate: () => void;
  isPending: boolean;
}

export function ActivateModal({ onActivate, isPending }: ActivateModalProps) {
  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-xs">
          <p className="font-medium text-foreground">Sign to register a new session key.</p>
          <p className="text-muted-foreground">
            This allows the bot to rebalance on your behalf. Your funds remain in the keeper wallet
            — the session key only grants scoped permissions.
          </p>
        </div>
      </div>
      <Button
        variant="gradient"
        size="lg"
        className="h-12 w-full"
        onClick={onActivate}
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Shield className="mr-2 h-4 w-4" />
        Activate Session Key
      </Button>
    </div>
  );
}
