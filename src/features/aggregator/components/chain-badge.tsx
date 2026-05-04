import Image from "next/image";
import { ArrowRight, Globe } from "lucide-react";
import { getChain } from "@/features/aggregator/lib/constants";
import { cn } from "@/lib/utils";

interface ChainBadgeProps {
  chainIn: string;
  chainOut: string;
  size?: number;
  className?: string;
}

function ChainIcon({ id, size }: { id: string; size: number }) {
  const chain = getChain(id);
  if (!chain) {
    return <Globe className="text-muted-foreground" style={{ width: size, height: size }} aria-hidden />;
  }
  return (
    <Image
      src={chain.logo}
      alt={chain.name}
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}

export function ChainBadge({ chainIn, chainOut, size = 16, className }: ChainBadgeProps) {
  const sameChain = chainIn === chainOut;
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      data-testid="chain-badge"
      data-chain-in={chainIn}
      data-chain-out={chainOut}
    >
      <ChainIcon id={chainIn} size={size} />
      {!sameChain && (
        <>
          <ArrowRight className="text-muted-foreground" style={{ width: 12, height: 12 }} aria-hidden />
          <ChainIcon id={chainOut} size={size} />
        </>
      )}
    </span>
  );
}
