"use client";

import { BarChart3, Gift, Globe, History, Key, Lock, User, Wallet } from "lucide-react";
import { memo } from "react";
import { MetricBox, Row } from "@/features/protocols/cards/base/indicators";
import { EmptyState, ProtocolCard } from "@/features/protocols/cards/base/protocol-card";
import { TokenImage } from "@/shared/components/token-image";
import { truncateAddress } from "@/shared/config/stellar";
import { useResultData } from "../../hooks/use-result-data";
import { formatNumber, formatPercent, formatPrice } from "../../lib/formatting";
import { ProtocolBadge, ScrollableList } from "../base/indicators";

interface AccountInfoCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function AccountInfoCardComponent({
  type,
  args,
  result,
  toolCallId,
  status,
}: AccountInfoCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData(result, status);
  const query = args?.query ?? type ?? "info";

  const configMap: Record<string, { title: string; icon: typeof User }> = {
    info: { title: "Account Info", icon: User },
    balance: { title: "Token Balance", icon: Wallet },
    assets: { title: "Account Assets", icon: Wallet },
    history: { title: "Transaction History", icon: History },
    locked: { title: "Locked XLM", icon: Lock },
    claimable_balances: { title: "Claimable Balances", icon: Gift },
    offers: { title: "Open Orders", icon: BarChart3 },
    trades: { title: "Recent Trades", icon: BarChart3 },
    price: { title: "Token Price", icon: BarChart3 },
    positions: { title: "DeFi Positions", icon: BarChart3 },
    signers: { title: "Account Signers", icon: Key },
    network: { title: "Network Info", icon: Globe },
    account_info: { title: "Account Info", icon: User },
    price_info: { title: "Price Info", icon: BarChart3 },
    market_discovery: { title: "Market Overview", icon: BarChart3 },
    discovery: { title: "Discovery", icon: BarChart3 },
    blend_user_position: { title: "Blend Position", icon: BarChart3 },
    blend_backstop_balance: { title: "Backstop Balance", icon: Wallet },
    user_positions: { title: "User Positions", icon: BarChart3 },
    liquidity_position: { title: "Liquidity Position", icon: BarChart3 },
    stake_info: { title: "Stake Info", icon: BarChart3 },
    borrow_health: { title: "Borrow Health", icon: BarChart3 },
    pending_interest: { title: "Pending Interest", icon: BarChart3 },
    pending_yield: { title: "Pending Yield", icon: BarChart3 },
    user_portfolio: { title: "Portfolio", icon: BarChart3 },
    user_shares: { title: "Vault Shares", icon: Wallet },
  };

  const cfg = configMap[query] ?? configMap.info!;

  return (
    <ProtocolCard
      data-testid="card-account-info"
      mode="chat"
      title={cfg.title}
      icon={cfg.icon}
      iconColor="text-primary"
      iconBg="bg-primary/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : undefined}
    >
      <QueryContent query={query} data={data} args={args} toolCallId={toolCallId} />
    </ProtocolCard>
  );
}

function QueryContent({
  query,
  data,
  args,
  toolCallId,
}: {
  query: string;
  data: any;
  args?: Record<string, any>;
  toolCallId?: string;
}) {
  if (!data) return <EmptyState icon={Wallet} text="No data available" />;

  switch (query) {
    case "info":
    case "account_info":
      return <AccountInfoView data={data} />;
    case "balance":
      return <BalanceView data={data} />;
    case "assets":
      return <AssetsView data={data} toolCallId={toolCallId} />;
    case "history":
      return <HistoryView data={data} toolCallId={toolCallId} />;
    case "locked":
      return <LockedView data={data} />;
    case "claimable_balances":
      return <ClaimableView data={data} toolCallId={toolCallId} />;
    case "offers":
      return <OffersView data={data} toolCallId={toolCallId} />;
    case "trades":
      return <TradesView data={data} toolCallId={toolCallId} />;
    case "price":
    case "price_info":
      return <PriceView data={data} />;
    case "positions":
      return <PositionsView data={data} toolCallId={toolCallId} />;
    case "signers":
      return <SignersView data={data} />;
    case "network":
      return <NetworkView data={data} />;
    case "blend_user_position":
      return <BlendPositionView data={data} args={args} />;
    case "blend_backstop_balance":
      return <BlendBackstopBalanceView data={data} />;
    default:
      return <GenericView data={data} />;
  }
}

function resolveAssetName(token: any): string {
  if (token.asset_type === "native" || token.assetType === "native") return "XLM";
  return (
    token.assetCode ?? token.asset_code ?? token.code ?? token.symbol ?? token.asset ?? "Unknown"
  );
}

// ─── Account Info View ────────────────────────────────────────────

function AccountInfoView({ data }: { data: any }) {
  const account = data.account ?? data;
  const balances = account.balances ?? [];
  const accountId = account.id ?? account.address;
  const subentries = account.subentry_count ?? account.subentryCount;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        <MetricBox label="Address" value={accountId ? truncateAddress(accountId) : "\u2014"} />
        <MetricBox label="Subentries" value={String(subentries ?? 0)} />
      </div>

      {account.sequence && <Row label="Sequence" value={account.sequence} />}

      {balances.length > 0 && (
        <div className="border-border border-t pt-2">
          <p className="mb-1.5 px-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
            Balances ({balances.length})
          </p>
          <div className="space-y-0.5">
            {balances.slice(0, 10).map((b: any, i: number) => {
              const name = resolveAssetName(b);
              return (
                <div
                  key={i}
                  className="flex items-center rounded px-0.5 py-1 transition-colors hover:bg-muted/20"
                >
                  <TokenImage src={null} alt={name} className="mr-2 h-5 w-5 rounded-full" />
                  <span className="flex-1 font-medium text-foreground text-xs">{name}</span>
                  <span className="text-foreground text-xs tabular-nums">
                    {Number.parseFloat(b.balance).toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Balance View ─────────────────────────────────────────────────

function BalanceView({ data }: { data: any }) {
  const token = data.token ?? data;
  const assetName = resolveAssetName(token);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <TokenImage src={null} alt={assetName} className="h-8 w-8 rounded-full" />
        <div>
          <p className="font-semibold text-sm">{assetName}</p>
          <p className="text-[10px] text-muted-foreground">
            {token.asset_type === "native" || token.assetType === "native" ? "Native" : "Trustline"}
          </p>
        </div>
      </div>
      <MetricBox label="Balance" value={token.balance ?? "0"} />
      {token.limit && <Row label="Trust Limit" value={token.limit} />}
    </div>
  );
}

// ─── Assets View ──────────────────────────────────────────────────

function AssetsView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const account = data.account ?? data;
  const assets = account.assets ?? account.balances ?? [];
  const address = data.address ?? account.id ?? account.address;
  const count = data.count ?? account.count ?? assets.length;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        <MetricBox label="Account" value={address ? truncateAddress(address) : "\u2014"} />
        <MetricBox label="Total Assets" value={String(count)} />
      </div>
      <ScrollableList id={`assets-${toolCallId}`} maxHeight={250}>
        {assets.map((a: any, i: number) => {
          const name = resolveAssetName(a);
          return (
            <div
              key={i}
              className="flex items-center rounded px-0.5 py-1.5 transition-colors hover:bg-muted/20"
            >
              <TokenImage src={null} alt={name} className="mr-2 h-5 w-5 rounded-full" />
              <span className="flex-1 font-medium text-xs">{name}</span>
              <span className="text-xs tabular-nums">
                {Number.parseFloat(a.balance).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}
              </span>
            </div>
          );
        })}
      </ScrollableList>
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────

function HistoryView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const ops = data.operations ?? [];
  return (
    <div className="space-y-2">
      <MetricBox label="Operations" value={String(data.count ?? ops.length)} />
      <ScrollableList id={`history-${toolCallId}`} maxHeight={280}>
        {ops.map((op: any, i: number) => (
          <div
            key={op.id ?? i}
            className="space-y-1 rounded-lg border border-border p-2.5 text-xs transition-colors hover:bg-muted/20"
          >
            <div className="flex justify-between">
              <span className="font-medium capitalize">{op.type?.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground">
                {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : ""}
              </span>
            </div>
            {op.amount && <Row label="Amount" value={`${op.amount} ${op.assetCode ?? "XLM"}`} />}
            {op.to && <Row label="To" value={truncateAddress(op.to)} />}
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

// ─── Locked View ──────────────────────────────────────────────────

function LockedView({ data }: { data: any }) {
  const locked = data.locked ?? {};
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        <MetricBox label="Total XLM" value={`${data.totalXlm ?? "\u2014"} XLM`} />
        <MetricBox label="Available" value={`${data.available ?? "\u2014"} XLM`} />
      </div>
      <div className="space-y-1 border-border border-t pt-2">
        <p className="mb-1 px-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          Locked Breakdown
        </p>
        <Row label="Base Reserve" value={`${locked.baseReserve ?? 0} XLM`} />
        <Row label="Subentry Reserve" value={`${locked.subentryReserve ?? 0} XLM`} />
        {locked.sellingLiabilities !== "0" && locked.sellingLiabilities && (
          <Row label="Selling Liabilities" value={`${locked.sellingLiabilities} XLM`} />
        )}
        <Row label="Total Locked" value={`${locked.totalLocked ?? 0} XLM`} />
      </div>
    </div>
  );
}

// ─── Claimable View ───────────────────────────────────────────────

function ClaimableView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const balances = data.claimableBalances ?? [];
  return (
    <div className="space-y-2">
      <MetricBox label="Claimable" value={String(data.count ?? balances.length)} />
      <ScrollableList id={`claimable-${toolCallId}`} maxHeight={250}>
        {balances.map((b: any, i: number) => (
          <div
            key={b.id ?? i}
            className="space-y-1 rounded-lg border border-border p-2.5 text-xs transition-colors hover:bg-muted/20"
          >
            <Row label="Asset" value={b.asset} />
            <Row label="Amount" value={b.amount} />
            <Row label="Sponsor" value={truncateAddress(b.sponsor ?? "")} />
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

// ─── Offers View ──────────────────────────────────────────────────

function OffersView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const offers = data.offers ?? [];
  return (
    <div className="space-y-2">
      <MetricBox label="Open Orders" value={String(data.count ?? offers.length)} />
      <ScrollableList id={`offers-${toolCallId}`} maxHeight={250}>
        {offers.map((o: any, i: number) => (
          <div
            key={o.id ?? i}
            className="space-y-1 rounded-lg border border-border p-2.5 text-xs transition-colors hover:bg-muted/20"
          >
            <div className="flex justify-between">
              <span>
                Sell <span className="font-medium">{o.selling}</span>
              </span>
              <span>
                Buy <span className="font-medium">{o.buying}</span>
              </span>
            </div>
            <Row label="Amount" value={o.amount} />
            <Row label="Price" value={o.price} />
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

// ─── Trades View ──────────────────────────────────────────────────

function TradesView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const trades = data.trades ?? [];
  return (
    <div className="space-y-2">
      <MetricBox label="Trades" value={String(data.count ?? trades.length)} />
      <ScrollableList id={`trades-${toolCallId}`} maxHeight={250}>
        {trades.map((t: any, i: number) => (
          <div
            key={t.id ?? i}
            className="space-y-1 rounded-lg border border-border p-2.5 text-xs transition-colors hover:bg-muted/20"
          >
            <div className="flex justify-between">
              <span>
                {t.baseAmount} {t.baseAsset}
              </span>
              <span className="text-muted-foreground">{"\u2194"}</span>
              <span>
                {t.counterAmount} {t.counterAsset}
              </span>
            </div>
            {t.price && <Row label="Price" value={t.price} />}
            {t.createdAt && (
              <div className="text-[10px] text-muted-foreground">
                {new Date(t.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

// ─── Price View ───────────────────────────────────────────────────

function PriceView({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <TokenImage src={null} alt={data.asset ?? "?"} className="h-8 w-8 rounded-full" />
        <div>
          <p className="font-semibold text-sm">{data.asset ?? "?"}</p>
          <p className="text-[10px] text-muted-foreground">{data.currency ?? "USD"}</p>
        </div>
      </div>
      <MetricBox label="Price" value={`$${formatPrice(data.price)}`} />
      <Row label="Source" value={data.source ?? "\u2014"} />
    </div>
  );
}

// ─── Positions View ───────────────────────────────────────────────

function PositionsView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const positions = data.positions ?? [];
  return (
    <div className="space-y-2">
      <MetricBox label="Positions" value={String(data.count ?? positions.length)} />
      <ScrollableList id={`positions-${toolCallId}`} maxHeight={250}>
        {positions.map((p: any, i: number) => (
          <div
            key={i}
            className="space-y-1 rounded-lg border border-border p-2.5 text-xs transition-colors hover:bg-muted/20"
          >
            <div className="flex items-center gap-2">
              <ProtocolBadge name={p.protocol} />
              <span className="text-muted-foreground">{p.type}</span>
            </div>
            <Row label="Pool" value={truncateAddress(p.pool ?? "")} />
            <Row label="Shares" value={p.shares} />
            {p.value && <Row label="Value" value={`$${formatNumber(p.value)}`} />}
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

// ─── Signers View ─────────────────────────────────────────────────

function SignersView({ data }: { data: any }) {
  const signers = data.signers ?? [];
  return (
    <div className="space-y-3">
      {data.isMultisig != null && (
        <MetricBox label="Multisig" value={data.isMultisig ? "Yes" : "No"} />
      )}
      {data.thresholds && (
        <div className="grid grid-cols-3 gap-1.5">
          <MetricBox label="Low" value={String(data.thresholds.low)} />
          <MetricBox label="Med" value={String(data.thresholds.med)} />
          <MetricBox label="High" value={String(data.thresholds.high)} />
        </div>
      )}
      <div className="space-y-1 border-border border-t pt-2">
        <p className="mb-1 px-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          Master Weight: {data.masterWeight}
        </p>
        {signers.map((s: any, i: number) => (
          <div
            key={i}
            className="flex justify-between rounded px-0.5 py-0.5 text-xs transition-colors hover:bg-muted/20"
          >
            <span className="font-mono">{truncateAddress(s.key)}</span>
            <span className="text-muted-foreground">weight: {s.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Network View ─────────────────────────────────────────────────

function NetworkView({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <MetricBox label="Network" value={data.network ?? "\u2014"} />
      <Row label="RPC URL" value={data.rpcUrl ?? "\u2014"} />
      <Row label="Horizon" value={data.horizonUrl ?? "\u2014"} />
    </div>
  );
}

// ─── Blend Position View ──────────────────────────────────────────

function BlendPositionView({ data, args }: { data: any; args?: Record<string, any> }) {
  const poolAddress = args?.poolAddress ?? data?.poolAddress;
  const hasPosition = data?.hasPosition ?? false;
  const positions: any[] = data?.positions ?? [];
  const summary = data?.summary;

  const legacyPosition = data?.position;
  const legacyHas = legacyPosition
    ? Object.keys(legacyPosition.collateral ?? {}).length +
        Object.keys(legacyPosition.liabilities ?? {}).length +
        Object.keys(legacyPosition.supply ?? {}).length >
      0
    : false;

  const showEmpty = !hasPosition && !legacyHas;
  const supplied = positions.filter((p) => p.suppliedAmount != null);
  const borrowed = positions.filter((p) => p.borrowedAmount != null);

  if (showEmpty) {
    return (
      <div className="space-y-2">
        {poolAddress && <Row label="Pool" value={truncateAddress(String(poolAddress))} />}
        <EmptyState icon={Wallet} text="No open position in this pool" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {poolAddress && <Row label="Pool" value={truncateAddress(String(poolAddress))} />}

      {summary && (
        <div className="grid grid-cols-2 gap-1.5">
          {summary.totalSuppliedUsd && (
            <MetricBox
              label="Supplied"
              value={`$${formatNumber(Number(summary.totalSuppliedUsd))}`}
            />
          )}
          {summary.totalBorrowedUsd && (
            <MetricBox
              label="Borrowed"
              value={`$${formatNumber(Number(summary.totalBorrowedUsd))}`}
            />
          )}
          {summary.availableBorrowUsd && (
            <MetricBox
              label="Available"
              value={`$${formatNumber(Number(summary.availableBorrowUsd))}`}
            />
          )}
          {summary.healthFactor && (
            <MetricBox label="Health" value={Number(summary.healthFactor).toFixed(2)} />
          )}
        </div>
      )}

      {supplied.length > 0 && (
        <div className="border-border border-t pt-2">
          <p className="mb-1 px-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
            Supplied
          </p>
          {supplied.map((p, i) => (
            <div
              key={i}
              className="flex items-center rounded px-0.5 py-1.5 transition-colors hover:bg-muted/20"
            >
              <TokenImage
                src={null}
                alt={p.symbol ?? p.asset}
                className="mr-2 h-5 w-5 rounded-full"
              />
              <span className="flex-1 font-medium text-xs">{p.symbol ?? p.asset}</span>
              {p.isCollateral && (
                <span className="mr-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
                  Collateral
                </span>
              )}
              <span className="text-xs tabular-nums">{formatNumber(Number(p.suppliedAmount))}</span>
              {p.netApy != null && (
                <span className="ml-2 text-[10px] text-muted-foreground tabular-nums">
                  {formatPercent(p.netApy)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {borrowed.length > 0 && (
        <div className="border-border border-t pt-2">
          <p className="mb-1 px-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
            Borrowed
          </p>
          {borrowed.map((p, i) => (
            <div
              key={i}
              className="flex items-center rounded px-0.5 py-1.5 transition-colors hover:bg-muted/20"
            >
              <TokenImage
                src={null}
                alt={p.symbol ?? p.asset}
                className="mr-2 h-5 w-5 rounded-full"
              />
              <span className="flex-1 font-medium text-xs">{p.symbol ?? p.asset}</span>
              <span className="text-xs tabular-nums">{formatNumber(Number(p.borrowedAmount))}</span>
              {p.borrowApy != null && (
                <span className="ml-2 text-[10px] text-muted-foreground tabular-nums">
                  {formatPercent(p.borrowApy)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Backstop Balance View ────────────────────────────────────────

function BlendBackstopBalanceView({ data }: { data: any }) {
  const shares =
    data?.sharesHuman ?? (data?.shares ? (Number(data.shares) / 1e7).toFixed(7) : null);
  const queued: any[] = data?.queuedWithdrawals ?? [];

  if (data?.hasPosition === false) {
    return <EmptyState icon={Wallet} text="No backstop position in this pool" />;
  }

  return (
    <div className="space-y-3">
      {data?.pool && <Row label="Pool" value={truncateAddress(String(data.pool))} />}
      {shares != null && <MetricBox label="Backstop Shares" value={String(shares)} />}
      {queued.length > 0 && (
        <div className="border-border border-t pt-2">
          <p className="mb-1 px-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
            Queued Withdrawals ({queued.length})
          </p>
          {queued.map((q: any, i: number) => (
            <div key={i} className="space-y-1 rounded-lg bg-secondary p-2.5 text-xs">
              <Row label="Amount" value={q.amountHuman ?? q.amount} />
              {q.expiration != null && <Row label="Expiration" value={String(q.expiration)} />}
            </div>
          ))}
        </div>
      )}
      {queued.length === 0 && (
        <div className="px-0.5 text-[10px] text-muted-foreground">No queued withdrawals.</div>
      )}
    </div>
  );
}

// ─── Generic View ─────────────────────────────────────────────────

function GenericView({ data }: { data: any }) {
  if (data?.success !== undefined) {
    return (
      <div className="text-sm">
        <span className={data.success ? "text-foreground" : "text-destructive"}>
          {data.success ? "Success" : "Failed"}
        </span>
        {data.error && <span className="ml-2 text-destructive">{data.error}</span>}
      </div>
    );
  }
  return (
    <div className="text-muted-foreground text-xs">
      Data received. Check AI response for details.
    </div>
  );
}

export const AccountInfoCard = memo(AccountInfoCardComponent);
