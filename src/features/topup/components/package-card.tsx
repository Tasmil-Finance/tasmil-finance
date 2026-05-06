import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { CreditPackage } from "../types";

const PACKAGE_TITLE: Record<string, string> = {
  starter: "Starter",
  plus: "Plus",
  pro: "Pro",
  whale: "Whale",
};

interface PackageCardProps {
  pkg: CreditPackage;
}

function formatUsd(n: number): string {
  return `$${n.toFixed(0)}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function PackageCard({ pkg }: PackageCardProps) {
  const title = PACKAGE_TITLE[pkg.id] ?? pkg.id;
  const cryptoHref = `/topup/${pkg.id}/quote/crypto`;
  const fiatHref = `/topup/${pkg.id}/quote/fiat`;

  return (
    <Card
      className="flex h-full flex-col border-border bg-card shadow-sm"
      data-testid={`package-card-${pkg.id}`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{title}</CardTitle>
          {pkg.bonusPercent > 0 ? (
            <Badge
              variant="secondary"
              className="border border-primary/20 bg-primary/10 text-[11px] text-primary uppercase tracking-[0.16em]"
              data-testid={`package-card-${pkg.id}-bonus`}
            >
              +{pkg.bonusPercent}% bonus
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          <span
            className="font-semibold text-3xl text-foreground"
            data-testid={`package-card-${pkg.id}-usd`}
          >
            {formatUsd(pkg.usd)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-2">
        <div
          className="flex justify-between text-sm"
          data-testid={`package-card-${pkg.id}-credits`}
        >
          <span className="text-muted-foreground">Credits</span>
          <span className="font-medium text-foreground">{formatNumber(pkg.credits)}</span>
        </div>
        <div className="flex justify-between text-sm" data-testid={`package-card-${pkg.id}-points`}>
          <span className="text-muted-foreground">Points</span>
          <span className="font-medium text-foreground">{formatNumber(pkg.points)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0">
        <Link
          href={cryptoHref}
          data-testid={`package-card-${pkg.id}-buy-crypto`}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
        >
          Buy with crypto
        </Link>
        <Link
          href={fiatHref}
          data-testid={`package-card-${pkg.id}-buy-fiat`}
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-transparent px-3 font-medium text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Buy with bank transfer
        </Link>
      </CardFooter>
    </Card>
  );
}
