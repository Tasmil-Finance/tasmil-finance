"use client";

import { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/anim-slider-tab";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/number-utils";
import type { TokenData, TokenType } from "@/types/portfolio";
import { getSortableValue, getSortIcon } from "./helpers";
import { TokenTableRow } from "./token-table-row";

interface SortConfig {
  field: "name" | "price" | "amount";
  direction: "asc" | "desc";
}

interface TableColumn {
  key: SortConfig["field"];
  label: string;
  align: "left" | "right";
  sortable: boolean;
}

const TABLE_COLUMNS: TableColumn[] = [
  { key: "name", label: "Token", align: "left", sortable: true },
  { key: "price", label: "Price / 24h", align: "right", sortable: true },
  { key: "amount", label: "Holdings / Value", align: "right", sortable: true },
];

function TokenBreakdown({ tokens }: { tokens: TokenData[] }) {
  const [isLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TokenType | "all">("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "amount",
    direction: "desc",
  });

  // Group tokens by type
  const tokensByType = useMemo(() => {
    const groups: Record<TokenType | "all", TokenData[]> = {
      all: tokens,
      wallet: [],
      staking: [],
      rewards: [],
      lending: [],
      liquidity: [],
    };

    tokens.forEach((token) => {
      if (token.type && groups[token.type]) {
        groups[token.type].push(token);
      }
    });

    return groups;
  }, [tokens]);

  // Calculate total value per type
  const valuesByType = useMemo(() => {
    const values: Record<TokenType | "all", number> = {
      all: 0,
      wallet: 0,
      staking: 0,
      rewards: 0,
      lending: 0,
      liquidity: 0,
    };

    Object.entries(tokensByType).forEach(([type, typeTokens]) => {
      values[type as TokenType | "all"] = typeTokens.reduce(
        (sum, token) => sum + token.value,
        0
      );
    });

    return values;
  }, [tokensByType]);

  const filteredAndSortedTokens = useMemo(() => {
    const tokensToSort = tokensByType[activeTab] || [];

    return [...tokensToSort].sort((a, b) => {
      const aValue = getSortableValue(a, sortConfig.field);
      const bValue = getSortableValue(b, sortConfig.field);

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const comparison = (aValue as number) - (bValue as number);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [sortConfig, tokensByType, activeTab]);

  const totalValue = useMemo(() => {
    return tokens.reduce((sum, token) => sum + token.value, 0);
  }, [tokens]);

  function handleSort(field: SortConfig["field"]) {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  function renderTableHeader() {
    return (
      <thead className="sticky top-0 z-10 bg-card">
        <tr className="border-border border-b">
          {TABLE_COLUMNS.map((column) => (
            <th
              className={`px-2 py-2 font-medium text-[10px] text-muted-foreground sm:px-3 sm:py-2.5 sm:text-xs ${
                column.align === "right" ? "text-right" : "text-left"
              } ${
                column.sortable
                  ? "cursor-pointer transition-colors hover:text-foreground"
                  : ""
              }`}
              key={column.key}
              onClick={
                column.sortable ? () => handleSort(column.key) : undefined
              }
            >
              <div
                className={`flex items-center gap-0.5 sm:gap-1 ${
                  column.align === "right" ? "justify-end" : ""
                }`}
              >
                {column.label}
                {column.sortable &&
                  getSortIcon(
                    column.key,
                    sortConfig.field,
                    sortConfig.direction
                  )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
    );
  }

  function renderTableBody() {
    if (isLoading) {
      return (
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr className="border-border border-b" key={index}>
              <td className="px-3 py-2" colSpan={TABLE_COLUMNS.length}>
                <Skeleton className="h-12 w-full" />
              </td>
            </tr>
          ))}
        </tbody>
      );
    }

    return (
      <tbody className="divide-y divide-border">
        {filteredAndSortedTokens.map((token) => (
          <TokenTableRow
            key={token.name}
            sortField={sortConfig.field}
            token={token}
            viewMode="comfortable"
          />
        ))}
      </tbody>
    );
  }

  const getTabLabel = (type: TokenType | "all") => {
    const count = tokensByType[type]?.length || 0;
    const value = valuesByType[type] || 0;

    const labels: Record<TokenType | "all", string> = {
      all: "All",
      wallet: "Wallet",
      staking: "Staking",
      rewards: "Rewards",
      lending: "Lending",
      liquidity: "Liquidity",
    };

    return {
      label: labels[type],
      count,
      value,
    };
  };

  const renderTabTrigger = (type: TokenType | "all") => {
    const { label, count, value } = getTabLabel(type);
    const isMobile = useIsMobile();
    // Don't show tab if no tokens of this type
    if (type !== "all" && count === 0) {
      return null;
    }

    return (
      <TabsTrigger className="min-w-0 flex-1" key={type} value={type}>
        <div className="flex flex-col items-center gap-0.5 px-1 py-1 sm:px-2">
          <span className="w-full truncate text-center font-medium text-xs sm:text-sm">
            {label}
          </span>
          {isMobile ? null : (
            <div className="flex flex-col items-center gap-0.5 text-[9px] text-muted-foreground sm:flex-row sm:gap-1.5 sm:text-[10px]">
              <span className="whitespace-nowrap">
                {count} {count === 1 ? "asset" : "assets"}
              </span>
              {value > 0 && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="max-w-[80px] truncate font-mono sm:max-w-none">
                    {formatCurrency(value)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </TabsTrigger>
    );
  };

  const renderTable = () => (
    <div className="relative">
      <div className="max-h-[300px] overflow-x-auto overflow-y-auto rounded-lg border border-border bg-card sm:max-h-[400px]">
        <table className="w-full min-w-[500px] border-collapse sm:min-w-full">
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {!isLoading && filteredAndSortedTokens.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-xs sm:text-sm">
          No tokens found
        </div>
      )}
    </div>
  );

  return (
    <Card className="border-border/50">
      <CardContent className="p-3 sm:p-4 md:p-5">
        {/* Tabs */}
        <Tabs
          onValueChange={(value) => setActiveTab(value as TokenType | "all")}
          value={activeTab}
        >
          <TabsList
            className="mb-8 grid w-full gap-1"
            style={{
              gridTemplateColumns: `repeat(${
                Object.keys(tokensByType).filter(
                  (type) =>
                    type === "all" ||
                    tokensByType[type as TokenType]?.length > 0
                ).length
              }, minmax(0, 1fr))`,
            }}
          >
            {renderTabTrigger("all")}
            {renderTabTrigger("wallet")}
            {renderTabTrigger("staking")}
            {renderTabTrigger("rewards")}
            {renderTabTrigger("lending")}
            {renderTabTrigger("liquidity")}
          </TabsList>

          <TabsContent value="all">{renderTable()}</TabsContent>
          <TabsContent value="wallet">{renderTable()}</TabsContent>
          <TabsContent value="staking">{renderTable()}</TabsContent>
          <TabsContent value="rewards">{renderTable()}</TabsContent>
          <TabsContent value="lending">{renderTable()}</TabsContent>
          <TabsContent value="liquidity">{renderTable()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default TokenBreakdown;
