"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";
import { ChevronDown } from "lucide-react";
import { SUPPORTED_CHAINS, getChain } from "@/features/bridge/lib/constants";

interface ChainTokenSelectorProps {
  label: string;
  selectedChain: string;
  selectedToken: string;
  chains: string[];
  tokens: string[];
  onChainChange: (chain: string) => void;
  onTokenChange: (token: string) => void;
}

export function ChainTokenSelector({
  label,
  selectedChain,
  selectedToken,
  chains,
  tokens,
  onChainChange,
  onTokenChange,
}: ChainTokenSelectorProps) {
  const chainMeta = getChain(selectedChain);
  const chainList = chains.length > 0 ? chains : SUPPORTED_CHAINS.map((c) => c.id);
  const tokenList = tokens.length > 0 ? tokens : ["USDC", "USDT"];

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 justify-between bg-background/50 border-border hover:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                {chainMeta && (
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${chainMeta.color.replace("text-", "bg-")}`}
                  />
                )}
                <span>{chainMeta?.name ?? selectedChain}</span>
              </span>
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {chainList.map((chainId) => {
              const meta = getChain(chainId);
              return (
                <DropdownMenuItem
                  key={chainId}
                  onSelect={() => onChainChange(chainId)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {meta && (
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${meta.color.replace("text-", "bg-")}`}
                    />
                  )}
                  <span>{meta?.name ?? chainId}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-28 justify-between bg-background/50 border-border hover:bg-muted/50"
            >
              <span>{selectedToken}</span>
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-28">
            {tokenList.map((t) => (
              <DropdownMenuItem
                key={t}
                onSelect={() => onTokenChange(t)}
                className="cursor-pointer"
              >
                {t}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
