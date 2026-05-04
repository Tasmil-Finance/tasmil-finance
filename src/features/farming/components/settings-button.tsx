"use client";

import { Settings } from "lucide-react";
import type { AccountStatus } from "@/features/account/types";
import { Button } from "@/shared/ui/button-v2";

interface SettingsButtonProps {
  status: AccountStatus;
  onOpen: (modal: "security" | "activate") => void;
}

export function SettingsButton({ status, onOpen }: SettingsButtonProps) {
  const target = status === "REVOKED" ? "activate" : "security";
  const label = status === "REVOKED" ? "Activate session key" : "Account settings";
  return (
    <Button
      variant="ghost"
      size="default"
      aria-label={label}
      title={label}
      onClick={() => onOpen(target)}
      className="text-muted-foreground hover:text-foreground"
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
}
