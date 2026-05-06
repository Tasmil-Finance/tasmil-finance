"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChainInfo, TokenInfo } from "@/features/aggregator/hooks/use-aggregator";
import { getChain, SUPPORTED_CHAINS, TOKEN_LOGOS } from "@/features/aggregator/lib/constants";
import { TokenImage } from "@/shared/components/token-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { ScrollArea } from "@/shared/ui/scroll-area";

/* Colors from globals.css theme */
const C = {
  widgetBg: "var(--card)",
  sectionBg: "var(--secondary)",
  hover: "var(--accent)",
  interactive: "var(--input)",
  mutedText: "var(--muted-foreground)",
  mainText: "var(--foreground)",
  dimText: "var(--ring)",
} as const;

// ─── Legacy RoutePicker (for existing bridge tab) ───────────────

interface RouteOption {
  chainId: string;
  chainName: string;
  chainLogo: string;
  token: string;
  tokenLogo: string;
}

function buildRouteOptions(tokens: string[]): RouteOption[] {
  const options: RouteOption[] = [];
  for (const chain of SUPPORTED_CHAINS) {
    for (const token of tokens) {
      options.push({
        chainId: chain.id,
        chainName: chain.name,
        chainLogo: chain.logo,
        token,
        tokenLogo: TOKEN_LOGOS[token] ?? "",
      });
    }
  }
  return options;
}

interface RoutePickerProps {
  selectedChain: string;
  selectedToken: string;
  tokens: string[];
  onSelect: (chainId: string, token: string) => void;
  placeholder?: string;
  variant?: "pill" | "full-width";
}

export function RoutePicker({
  selectedChain,
  selectedToken,
  tokens,
  onSelect,
  placeholder = "Select token",
  variant = "pill",
}: RoutePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const routes = useMemo(() => buildRouteOptions(tokens), [tokens]);
  const filtered = useMemo(() => {
    if (!search.trim()) return routes;
    const q = search.toLowerCase();
    return routes.filter(
      (r) => r.chainName.toLowerCase().includes(q) || r.token.toLowerCase().includes(q)
    );
  }, [routes, search]);

  const chain = getChain(selectedChain);
  const tokenLogo = TOKEN_LOGOS[selectedToken] ?? "";
  const hasSelection = !!chain && !!selectedToken;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "full-width" ? (
          <button
            type="button"
            className="flex h-13 w-full cursor-pointer items-center gap-3 rounded-2xl p-3 transition-colors"
            style={{ background: C.sectionBg }}
          >
            {hasSelection ? (
              <>
                <span className="relative inline-flex h-9 w-9 shrink-0 items-center">
                  <TokenImage
                    src={tokenLogo}
                    alt={selectedToken}
                    className="h-8 w-8 rounded-full object-contain"
                  />
                  <TokenImage
                    src={chain.logo}
                    alt={chain.name}
                    className="absolute top-[18px] left-[18px] h-[16px] w-[16px] rounded-full object-contain ring-1 ring-white/10"
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="font-medium text-[15px]" style={{ color: C.mainText }}>
                    {selectedToken}
                  </span>
                  <span className="text-xs" style={{ color: C.mutedText }}>
                    {chain.name}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: C.hover }}
                >
                  <span className="h-5 w-5 rounded-full" style={{ background: C.interactive }} />
                </span>
                <span className="flex-1 text-left text-[15px]" style={{ color: C.dimText }}>
                  {placeholder}
                </span>
              </>
            )}
            <ChevronDown className="h-4 w-4 shrink-0" style={{ color: C.mutedText }} />
          </button>
        ) : (
          <button
            type="button"
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 pr-3 transition-colors active:scale-[0.97]"
            style={{ background: C.interactive }}
          >
            {hasSelection ? (
              <>
                <span className="relative inline-flex h-7 w-7 shrink-0 items-center">
                  <TokenImage
                    src={tokenLogo}
                    alt={selectedToken}
                    className="h-6 w-6 rounded-full object-contain"
                  />
                  <TokenImage
                    src={chain.logo}
                    alt={chain.name}
                    className="absolute top-[14px] left-[14px] h-[14px] w-[14px] rounded-full object-contain ring-1 ring-white/10"
                  />
                </span>
                <span className="flex min-w-0 flex-col text-left">
                  <span className="font-medium text-base leading-5" style={{ color: C.mainText }}>
                    {selectedToken}
                  </span>
                  <span
                    className="truncate font-normal text-sm leading-4"
                    style={{ color: C.mutedText }}
                  >
                    {chain.name}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="relative inline-flex h-7 w-7 items-center">
                  <span className="h-6 w-6 rounded-full" style={{ background: C.hover }} />
                </span>
                <span
                  className="whitespace-nowrap font-normal text-base leading-5"
                  style={{ color: C.mutedText }}
                >
                  {placeholder}
                </span>
              </>
            )}
            <ChevronDown className="h-4 w-4 shrink-0" style={{ color: C.mutedText }} />
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[440px]"
        style={{ background: C.widgetBg }}
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-medium text-base" style={{ color: C.mainText }}>
            Select token
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search
              className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4"
              style={{ color: C.mutedText }}
            />
            <input
              type="text"
              placeholder="Search by token and network"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border-0 py-3 pr-3 pl-10 text-sm focus:outline-none"
              style={{ background: C.sectionBg, color: C.mainText }}
            />
          </div>
        </div>

        <ScrollArea className="max-h-[400px] px-3 pb-4">
          <p
            className="px-3 pb-2 font-medium text-xs uppercase tracking-wider"
            style={{ color: C.mutedText }}
          >
            Suggestions
          </p>

          <div className="flex flex-col gap-0.5">
            {filtered.map((route) => {
              const isSelected = route.chainId === selectedChain && route.token === selectedToken;
              return (
                <button
                  key={`${route.chainId}-${route.token}`}
                  type="button"
                  onClick={() => {
                    onSelect(route.chainId, route.token);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                  style={{ background: isSelected ? C.hover : "transparent" }}
                >
                  <span className="relative inline-flex h-11 w-11 shrink-0 items-center">
                    <TokenImage
                      src={route.tokenLogo}
                      alt={route.token}
                      className="h-10 w-10 rounded-full object-contain"
                    />
                    <TokenImage
                      src={route.chainLogo}
                      alt={route.chainName}
                      className="absolute top-[24px] left-[24px] h-4 w-4 rounded-full object-contain ring-1 ring-white/10"
                    />
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold text-[15px]" style={{ color: C.mainText }}>
                      {route.token}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: C.mutedText }}
                    >
                      <TokenImage
                        src={route.chainLogo}
                        alt={route.chainName}
                        className="h-3.5 w-3.5 rounded-full"
                      />
                      {route.chainName}
                    </span>
                  </div>

                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm" style={{ color: C.dimText }}>
                No results found
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Aggregator Token Picker (dynamic token list with logos) ────

interface AggregatorTokenPickerProps {
  selectedToken: TokenInfo | null;
  selectedChain: string;
  tokens: TokenInfo[];
  chains: string[];
  allChains: ChainInfo[];
  onSelect: (token: TokenInfo, chain: string) => void;
  placeholder?: string;
}

export function AggregatorTokenPicker({
  selectedToken,
  selectedChain,
  tokens,
  chains,
  allChains,
  onSelect,
  placeholder = "Select token",
}: AggregatorTokenPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterChain, setFilterChain] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = tokens;
    if (filterChain) {
      list = list.filter((t) => t.chains.includes(filterChain));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tokens, search, filterChain]);

  const chainObj = allChains.find((c) => c.id === selectedChain);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-2.5 py-2 pr-3.5 transition-colors active:scale-[0.97]"
          style={{ background: C.interactive }}
        >
          {selectedToken ? (
            <>
              <span
                className="relative inline-flex shrink-0 items-center"
                style={{ width: 36, height: 36 }}
              >
                <TokenImage
                  src={selectedToken.logo || ""}
                  alt={selectedToken.symbol}
                  className="h-8 w-8 rounded-full object-cover"
                />
                {chainObj && (
                  <TokenImage
                    src={chainObj.logo}
                    alt={chainObj.name}
                    className="absolute top-[20px] left-[20px] h-[18px] w-[18px] rounded-full object-contain ring-2 ring-[var(--input)]"
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className="font-semibold text-base leading-5" style={{ color: C.mainText }}>
                  {selectedToken.symbol}
                </span>
                <span
                  className="truncate font-normal text-sm leading-4"
                  style={{ color: C.mutedText }}
                >
                  {chainObj?.name || selectedChain}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="relative inline-flex items-center" style={{ width: 36, height: 36 }}>
                <span className="h-8 w-8 rounded-full" style={{ background: C.hover }} />
              </span>
              <span
                className="whitespace-nowrap font-normal text-base leading-5"
                style={{ color: C.mutedText }}
              >
                {placeholder}
              </span>
            </>
          )}
          <ChevronDown className="h-4 w-4 shrink-0" style={{ color: C.mutedText }} />
        </button>
      </DialogTrigger>

      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[520px]"
        style={{ background: C.widgetBg }}
      >
        <DialogHeader className="px-7 pt-7 pb-4">
          <DialogTitle className="font-bold text-xl" style={{ color: C.mainText }}>
            Select token
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-7 pb-4">
          <div className="relative">
            <Search
              className="-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5"
              style={{ color: C.mutedText }}
            />
            <input
              type="text"
              placeholder="Search token name or symbol"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-0 py-4 pr-4 pl-12 text-base focus:outline-none"
              style={{ background: C.sectionBg, color: C.mainText }}
            />
          </div>
        </div>

        {/* Chain filter chips */}
        {chains.length > 1 && (
          <div className="flex flex-wrap gap-2 px-7 pb-4">
            <button
              type="button"
              onClick={() => setFilterChain(null)}
              className="rounded-xl px-4 py-2 font-semibold text-sm transition-colors"
              style={{
                background: filterChain === null ? C.hover : C.interactive,
                color: filterChain === null ? C.mainText : C.mutedText,
              }}
            >
              All
            </button>
            {chains.map((chainId) => {
              const ch = allChains.find((c) => c.id === chainId);
              if (!ch) return null;
              return (
                <button
                  key={chainId}
                  type="button"
                  onClick={() => setFilterChain(chainId === filterChain ? null : chainId)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-semibold text-sm transition-colors"
                  style={{
                    background: filterChain === chainId ? C.hover : C.interactive,
                    color: filterChain === chainId ? C.mainText : C.mutedText,
                  }}
                >
                  <TokenImage src={ch.logo} alt={ch.name} className="h-5 w-5 rounded-full" />
                  {ch.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Token list */}
        <ScrollArea className="max-h-[440px] px-5 pb-5">
          <div className="flex flex-col gap-1">
            {filtered.map((token) => {
              const isSelected = selectedToken?.symbol === token.symbol;
              const displayChain =
                filterChain ||
                (token.chains.includes(selectedChain)
                  ? selectedChain
                  : token.chains[0] || "stellar");
              const displayChainObj = allChains.find((c) => c.id === displayChain);

              return (
                <button
                  key={token.symbol}
                  type="button"
                  onClick={() => {
                    onSelect(token, displayChain);
                    setOpen(false);
                    setSearch("");
                    setFilterChain(null);
                  }}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors"
                  style={{ background: isSelected ? C.hover : "transparent" }}
                >
                  <span
                    className="relative inline-flex shrink-0 items-center"
                    style={{ width: 52, height: 52 }}
                  >
                    <TokenImage
                      src={token.logo || ""}
                      alt={token.symbol}
                      className="h-[48px] w-[48px] rounded-full object-cover"
                    />
                    {displayChainObj && (
                      <TokenImage
                        src={displayChainObj.logo}
                        alt={displayChainObj.name}
                        className="absolute top-[32px] left-[32px] h-[22px] w-[22px] rounded-full object-contain ring-2 ring-[var(--card)]"
                      />
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold text-lg" style={{ color: C.mainText }}>
                      {token.symbol}
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-sm"
                      style={{ color: C.mutedText }}
                    >
                      {displayChainObj && (
                        <TokenImage
                          src={displayChainObj.logo}
                          alt={displayChainObj.name}
                          className="h-4 w-4 rounded-full"
                        />
                      )}
                      {token.name}
                    </span>
                  </div>

                  {token.bridgeable && (
                    <span
                      className="rounded-xl px-3 py-1.5 font-semibold text-sm"
                      style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}
                    >
                      Bridge
                    </span>
                  )}

                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm" style={{ color: C.dimText }}>
                No results found
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
