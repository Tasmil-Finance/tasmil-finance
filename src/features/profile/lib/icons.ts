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
}

const STYLES: Record<OpKind, IconStyle> = {
  send: { icon: ArrowUpRight, bg: "bg-destructive/10", fg: "text-destructive", label: "Sent" },
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
    label: "Swapped",
  },
  "lp-deposit": {
    icon: Droplets,
    bg: "bg-violet-500/10",
    fg: "text-violet-400",
    label: "Added Liquidity",
  },
  "lp-withdraw": {
    icon: Droplets,
    bg: "bg-amber-500/10",
    fg: "text-amber-400",
    label: "Removed Liquidity",
  },
  "lend-deposit": {
    icon: PiggyBank,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    label: "Deposited",
  },
  "lend-withdraw": {
    icon: Wallet,
    bg: "bg-amber-500/10",
    fg: "text-amber-400",
    label: "Withdrew",
  },
  harvest: { icon: Zap, bg: "bg-emerald-500/10", fg: "text-emerald-400", label: "Harvested" },
  "trustline-add": {
    icon: Shield,
    bg: "bg-blue-500/10",
    fg: "text-blue-400",
    label: "Added Trustline",
  },
  "trustline-remove": {
    icon: ShieldOff,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
    label: "Removed Trustline",
  },
  "create-account": {
    icon: UserPlus,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    label: "Created Account",
  },
  "merge-account": {
    icon: Link2,
    bg: "bg-muted/30",
    fg: "text-muted-foreground",
    label: "Merged Account",
  },
  "claim-balance": {
    icon: Coins,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    label: "Claimed Balance",
  },
  "lock-balance": {
    icon: Lock,
    bg: "bg-amber-500/10",
    fg: "text-amber-400",
    label: "Locked Balance",
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
    label: "Contract Call",
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
};

export function getIconStyle(kind: OpKind, successful: boolean): IconStyle {
  return successful ? STYLES[kind] : FAILED_STYLE;
}
