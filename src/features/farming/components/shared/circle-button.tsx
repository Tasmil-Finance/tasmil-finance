"use client";

import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "solid-white" | "radial-cyan" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  "solid-white": "bg-white text-[#111] hover:bg-white/90",
  "radial-cyan":
    "bg-[radial-gradient(circle_at_30%_30%,_#7ed9ff,_#38b6f0_70%)] text-[#001f30]",
  ghost: "bg-transparent border border-[#2a2a2a] text-[#ddd] hover:border-[#444]",
};

const SIZE: Record<Size, string> = {
  sm: "w-[64px] h-[64px] text-[10px]",
  md: "w-[80px] h-[80px] text-[11px]",
  lg: "w-[120px] h-[120px] text-[12px]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const CircleButton = forwardRef<HTMLButtonElement, Props>(
  (
    { variant = "solid-white", size = "md", loading, disabled, className, children, ...rest },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        "rounded-full font-medium flex items-center justify-center transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[.98]",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" /> : children}
    </button>
  )
);
CircleButton.displayName = "CircleButton";
