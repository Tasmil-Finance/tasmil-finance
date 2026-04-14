"use client";

import { Check } from "lucide-react";

interface SuccessBannerProps {
  email: string;
  className?: string;
}

// Mask: u***@gmail.com
export function maskEmail(email: string): string {
  return email.replace(/(.{2}).*(@.*)/, "$1***$2");
}

export function SuccessBanner({ email, className }: SuccessBannerProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 animate-banner-fade-in ${className ?? ""}`}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
        <Check className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-medium text-green-600 dark:text-green-400">
        {email ? `Email confirmed: ${maskEmail(email)}` : "Email confirmed \u2014 you're all set!"}
      </span>
    </div>
  );
}
