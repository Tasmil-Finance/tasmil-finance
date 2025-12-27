import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { TOKENS } from "@/constants/token";
import type { TokenData, TokenType } from "@/types/portfolio";
import { formatPrice, formatAmount, formatPercentage } from "@/lib/number-utils";
import { Badge } from "@/components/ui/badge";

export interface TokenTableRowProps {
  token: TokenData;
  sortField: string;
  viewMode?: "comfortable" | "compact";
}

export function TokenTableRow({ token, viewMode = "compact" }: TokenTableRowProps) {
  const tokenInfo = TOKENS[token.symbol];
  const isCompact = viewMode === "compact";

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-[#10b981]";
    if (change < 0) return "text-[#ef4444]";
    return "text-muted-foreground";
  };

  const getTypeBadgeConfig = (type: TokenType) => {
    switch (type) {
      case "wallet":
        return {
          label: "Wallet",
          variant: "default" as const,
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "staking":
        return {
          label: "Staked",
          variant: "default" as const,
          className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
      case "rewards":
        return {
          label: "Rewards",
          variant: "default" as const,
          className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        };
      case "lending":
        return {
          label: "Lending",
          variant: "default" as const,
          className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        };
      case "liquidity":
        return {
          label: "Liquidity",
          variant: "default" as const,
          className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        };
      default:
        return {
          label: "Unknown",
          variant: "default" as const,
          className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
        };
    }
  };

  const formatValue = (value: number): string => {
    if (!Number.isFinite(value) || value === 0) return "N/A";
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleRowClick = () => {
    // Navigate to U2U Explorer for the token
    if (token.symbol === "U2U") {
      window.open("https://u2uscan.xyz", "_blank");
    } else {
      window.open(`https://etherscan.io/token/${token.symbol}`, "_blank");
    }
  };

  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-muted/50"
      onClick={handleRowClick}
    >
      <td className={`px-2 sm:px-3 ${isCompact ? "py-2" : "py-3"}`}>
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* {tokenInfo?.image && (
            <Image
              alt={token.symbol}
              className={`${isCompact ? "h-6 w-6" : "h-8 w-8"} rounded-full`}
              height={isCompact ? 24 : 32}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              src={tokenInfo?.image || ""}
              width={isCompact ? 24 : 32}
            />
          )} */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span
                className={`font-medium text-foreground ${isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}
              >
                {token.symbol}
              </span>
              {token.type &&
                (() => {
                  const badgeConfig = getTypeBadgeConfig(token.type);
                  return (
                    <Badge
                      variant={badgeConfig.variant}
                      className={`${badgeConfig.className} text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-3.5 sm:h-4`}
                    >
                      {badgeConfig.label}
                    </Badge>
                  );
                })()}
              <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            {!isCompact && (
              <span className="text-muted-foreground text-[10px] sm:text-xs truncate">{tokenInfo?.name || token.name}</span>
            )}
          </div>
        </div>
      </td>
      <td className={`px-2 sm:px-3 ${isCompact ? "py-2" : "py-3"} text-right`}>
        <div className="flex flex-col items-end">
          <span className={`font-mono text-foreground ${isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
            {formatPrice(token.price)}
          </span>
          <span
            className={`${isCompact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"} font-medium ${getChangeColor(
              token.change24h
            )}`}
          >
            {formatPercentage(token.change24h)}
          </span>
        </div>
      </td>
      <td className={`px-2 sm:px-3 ${isCompact ? "py-2" : "py-3"} text-right`}>
        <div className="flex flex-col items-end">
          <span className={`text-foreground ${isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
            {formatAmount(token.amount)}
          </span>
          <span
            className={`font-mono text-muted-foreground ${isCompact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"}`}
          >
            {formatValue(token.value)}
          </span>
        </div>
      </td>
    </tr>
  );
}
