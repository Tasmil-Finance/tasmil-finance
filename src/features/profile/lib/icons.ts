import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Coins,
  Droplets,
  Layers,
  Link2,
  Lock,
  type LucideIcon,
  PiggyBank,
  Shield,
  ShieldOff,
  TrendingUp,
  UserPlus,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import type { OpKind } from "./types";

export interface IconStyle {
  icon: LucideIcon;
  bg: string;
  fg: string;
  label: string;
  /** Secondary action verb shown beneath the primary label (Freighter UX). */
  sublabel?: string;
}

const STYLES: Record<OpKind, IconStyle> = {
  send: {
    icon: ArrowUpRight,
    bg: "bg-destructive/10",
    fg: "text-destructive",
    label: "Sent",
  },
  receive: {
    icon: ArrowDownLeft,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    label: "Received",
  },
  swap: {
    icon: ArrowLeftRight,
    bg: "bg-violet-500/10",
    fg: "text-violet-400",
    label: "Swap",
    sublabel: "Swapped",
  },
  "lp-deposit": {
    icon: Droplets,
    bg: "bg-violet-500/10",
    fg: "text-violet-400",
    label: "Added Liquidity",
    sublabel: "Sent",
  },
  "lp-withdraw": {
    icon: Droplets,
    bg: "bg-amber-500/10",
    fg: "text-amber-400",
    label: "Removed Liquidity",
    sublabel: "Received",
  },
  "lend-deposit": {
    icon: PiggyBank,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    label: "Deposit",
    sublabel: "Sent",
  },
  "lend-withdraw": {
    icon: Wallet,
    bg: "bg-amber-500/10",
    fg: "text-amber-400",
    label: "Withdraw",
    sublabel: "Received",
  },
  harvest: {
    icon: Zap,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    label: "Harvest",
    sublabel: "Received",
  },
  "trustline-add": {
    icon: Shield,
    bg: "bg-blue-500/10",
    fg: "text-blue-400",
    label: "Add trustline",
    sublabel: "Added",
  },
  "trustline-remove": {
    icon: ShieldOff,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
    label: "Remove trustline",
    sublabel: "Removed",
  },
  "create-account": {
    icon: UserPlus,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    label: "Create Account",
    sublabel: "Sent",
  },
  "merge-account": {
    icon: Link2,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
    label: "Merge Account",
  },
  "claim-balance": {
    icon: Coins,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    label: "Claim Balance",
    sublabel: "Received",
  },
  "lock-balance": {
    icon: Lock,
    bg: "bg-amber-500/10",
    fg: "text-amber-400",
    label: "Lock Balance",
    sublabel: "Sent",
  },
  "dex-offer": {
    icon: TrendingUp,
    bg: "bg-amber-500/10",
    fg: "text-amber-400",
    label: "Order",
  },
  "contract-other": {
    icon: Layers,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
    label: "Contract Function",
    sublabel: "Interacted",
  },
  "classic-other": {
    icon: Layers,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
    label: "Operation",
  },
};

export const FAILED_STYLE: IconStyle = {
  icon: XCircle,
  bg: "bg-destructive/10",
  fg: "text-destructive",
  label: "Transaction Failed",
  sublabel: "Failed",
};

export function getIconStyle(kind: OpKind, successful: boolean): IconStyle {
  return successful ? STYLES[kind] : FAILED_STYLE;
}
