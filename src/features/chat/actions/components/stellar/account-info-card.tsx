"use client";

import { User, Wallet, History, Lock, Gift, BarChart3, Globe, Key } from "lucide-react";
import { memo } from "react";
import { BaseInfoCard } from "../base/info-card";
import { useResultData } from "../../hooks/use-result-data";
import { ScrollableList, DetailRow, ProtocolBadge } from "../base/indicators";
import { formatNumber, formatPrice } from "../../lib/formatting";
import { truncateAddress } from "@/shared/config/stellar";

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
  const query = args?.["query"] ?? type ?? "info";

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
  };

  const cfg = configMap[query] ?? configMap["info"]!;

  return (
    <BaseInfoCard
      title={cfg!.title}
      icon={cfg!.icon}
      iconColor="text-blue-500"
      iconBg="bg-blue-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      <QueryContent query={query} data={data} toolCallId={toolCallId} />
    </BaseInfoCard>
  );
}

function QueryContent({
  query,
  data,
  toolCallId,
}: {
  query: string;
  data: any;
  toolCallId?: string;
}) {
  if (!data) return <div className="text-sm text-muted-foreground">No data available.</div>;

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
    default:
      return <GenericView data={data} />;
  }
}

function AccountInfoView({ data }: { data: any }) {
  const account = data.account ?? data;
  const balances = account.balances ?? [];
  return (
    <div className="space-y-2">
      {account.id && <DetailRow label="Address" value={truncateAddress(account.id)} mono />}
      {account.sequence && <DetailRow label="Sequence" value={account.sequence} mono />}
      {account.subentry_count != null && (
        <DetailRow label="Subentries" value={account.subentry_count} />
      )}
      {balances.length > 0 && (
        <div className="border-t pt-2 mt-2 space-y-1">
          <div className="text-xs text-muted-foreground mb-1">Balances ({balances.length})</div>
          {balances.slice(0, 10).map((b: any, i: number) => (
            <DetailRow
              key={i}
              label={b.asset_type === "native" ? "XLM" : (b.code ?? b.asset_code ?? "?")}
              value={Number.parseFloat(b.balance).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BalanceView({ data }: { data: any }) {
  const token = data.token ?? data;
  return (
    <div className="space-y-2">
      <DetailRow label="Asset" value={token.asset ?? "?"} />
      <DetailRow label="Balance" value={<span className="font-semibold">{token.balance}</span>} />
      {token.limit && <DetailRow label="Trust Limit" value={token.limit} />}
    </div>
  );
}

function AssetsView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const assets = data.assets ?? [];
  return (
    <div className="space-y-2">
      {data.address && <DetailRow label="Account" value={truncateAddress(data.address)} mono />}
      <DetailRow label="Total Assets" value={data.count ?? assets.length} />
      <ScrollableList id={`assets-${toolCallId}`} maxHeight={250}>
        {assets.map((a: any, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-sm"
          >
            <span className="font-medium">{a.type === "native" ? "XLM" : (a.code ?? "?")}</span>
            <span>
              {Number.parseFloat(a.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

function HistoryView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const ops = data.operations ?? [];
  return (
    <div className="space-y-2">
      <DetailRow label="Operations" value={data.count ?? ops.length} />
      <ScrollableList id={`history-${toolCallId}`} maxHeight={280}>
        {ops.map((op: any, i: number) => (
          <div key={op.id ?? i} className="rounded border p-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-medium capitalize">{op.type?.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground">
                {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : ""}
              </span>
            </div>
            {op.amount && (
              <DetailRow label="Amount" value={`${op.amount} ${op.assetCode ?? "XLM"}`} />
            )}
            {op.to && <DetailRow label="To" value={truncateAddress(op.to)} mono />}
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

function LockedView({ data }: { data: any }) {
  const locked = data.locked ?? {};
  return (
    <div className="space-y-2">
      <DetailRow
        label="Total XLM"
        value={<span className="font-semibold">{data.totalXlm} XLM</span>}
      />
      <DetailRow
        label="Available"
        value={<span className="text-green-500 font-semibold">{data.available} XLM</span>}
      />
      <div className="border-t pt-2 mt-2 space-y-1">
        <div className="text-xs text-muted-foreground mb-1">Locked Breakdown</div>
        <DetailRow label="Base Reserve" value={`${locked.baseReserve} XLM`} />
        <DetailRow
          label="Subentry Reserve"
          value={`${locked.subentryReserve} XLM (${locked.subentryCount} entries)`}
        />
        {locked.sellingLiabilities !== "0" && (
          <DetailRow label="Selling Liabilities" value={`${locked.sellingLiabilities} XLM`} />
        )}
        <DetailRow
          label="Total Locked"
          value={<span className="font-semibold">{locked.totalLocked} XLM</span>}
        />
      </div>
    </div>
  );
}

function ClaimableView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const balances = data.claimableBalances ?? [];
  return (
    <div className="space-y-2">
      <DetailRow label="Claimable" value={data.count ?? balances.length} />
      <ScrollableList id={`claimable-${toolCallId}`} maxHeight={250}>
        {balances.map((b: any, i: number) => (
          <div key={b.id ?? i} className="rounded border p-2 space-y-1 text-xs">
            <DetailRow label="Asset" value={b.asset} />
            <DetailRow label="Amount" value={<span className="font-semibold">{b.amount}</span>} />
            <DetailRow label="Sponsor" value={truncateAddress(b.sponsor ?? "")} mono />
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

function OffersView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const offers = data.offers ?? [];
  return (
    <div className="space-y-2">
      <DetailRow label="Open Orders" value={data.count ?? offers.length} />
      <ScrollableList id={`offers-${toolCallId}`} maxHeight={250}>
        {offers.map((o: any, i: number) => (
          <div key={o.id ?? i} className="rounded border p-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>
                Sell <span className="font-medium">{o.selling}</span>
              </span>
              <span>
                Buy <span className="font-medium">{o.buying}</span>
              </span>
            </div>
            <DetailRow label="Amount" value={o.amount} />
            <DetailRow label="Price" value={o.price} />
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

function TradesView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const trades = data.trades ?? [];
  return (
    <div className="space-y-2">
      <DetailRow label="Trades" value={data.count ?? trades.length} />
      <ScrollableList id={`trades-${toolCallId}`} maxHeight={250}>
        {trades.map((t: any, i: number) => (
          <div key={t.id ?? i} className="rounded border p-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>
                {t.baseAmount} {t.baseAsset}
              </span>
              <span className="text-muted-foreground">↔</span>
              <span>
                {t.counterAmount} {t.counterAsset}
              </span>
            </div>
            {t.price && <DetailRow label="Price" value={t.price} />}
            {t.createdAt && (
              <div className="text-muted-foreground">
                {new Date(t.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

function PriceView({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Asset" value={<span className="font-semibold">{data.asset ?? "?"}</span>} />
      <DetailRow
        label="Price"
        value={<span className="text-lg font-bold">${formatPrice(data.price)}</span>}
      />
      <DetailRow label="Currency" value={data.currency ?? "USD"} />
      <DetailRow label="Source" value={<ProtocolBadge name={data.source} />} />
    </div>
  );
}

function PositionsView({ data, toolCallId }: { data: any; toolCallId?: string }) {
  const positions = data.positions ?? [];
  return (
    <div className="space-y-2">
      <DetailRow label="Positions" value={data.count ?? positions.length} />
      <ScrollableList id={`positions-${toolCallId}`} maxHeight={250}>
        {positions.map((p: any, i: number) => (
          <div key={i} className="rounded border p-2 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <ProtocolBadge name={p.protocol} />
              <span className="text-muted-foreground">{p.type}</span>
            </div>
            <DetailRow label="Pool" value={truncateAddress(p.pool ?? "")} mono />
            <DetailRow label="Shares" value={p.shares} />
            {p.value && <DetailRow label="Value" value={`$${formatNumber(p.value)}`} />}
          </div>
        ))}
      </ScrollableList>
    </div>
  );
}

function SignersView({ data }: { data: any }) {
  const signers = data.signers ?? [];
  return (
    <div className="space-y-2">
      {data.isMultisig != null && (
        <DetailRow label="Multisig" value={data.isMultisig ? "Yes" : "No"} />
      )}
      <DetailRow label="Master Weight" value={data.masterWeight} />
      {data.thresholds && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-muted/30 rounded p-2 text-center">
            <div className="text-muted-foreground">Low</div>
            <div className="font-semibold">{data.thresholds.low}</div>
          </div>
          <div className="bg-muted/30 rounded p-2 text-center">
            <div className="text-muted-foreground">Med</div>
            <div className="font-semibold">{data.thresholds.med}</div>
          </div>
          <div className="bg-muted/30 rounded p-2 text-center">
            <div className="text-muted-foreground">High</div>
            <div className="font-semibold">{data.thresholds.high}</div>
          </div>
        </div>
      )}
      <div className="space-y-1 border-t pt-2 mt-2">
        {signers.map((s: any, i: number) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="font-mono">{truncateAddress(s.key)}</span>
            <span>weight: {s.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkView({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <DetailRow
        label="Network"
        value={<span className="font-semibold capitalize">{data.network}</span>}
      />
      <DetailRow
        label="RPC URL"
        value={
          <span className="font-mono text-xs truncate max-w-[200px] inline-block">
            {data.rpcUrl}
          </span>
        }
      />
      <DetailRow
        label="Horizon"
        value={
          <span className="font-mono text-xs truncate max-w-[200px] inline-block">
            {data.horizonUrl}
          </span>
        }
      />
    </div>
  );
}

function GenericView({ data }: { data: any }) {
  if (data?.success !== undefined) {
    return (
      <div className="text-sm">
        <span className={data.success ? "text-green-500" : "text-red-500"}>
          {data.success ? "Success" : "Failed"}
        </span>
        {data.error && <span className="text-red-500 ml-2">{data.error}</span>}
      </div>
    );
  }
  return (
    <div className="text-xs text-muted-foreground">
      Data received. Check AI response for details.
    </div>
  );
}

export const AccountInfoCard = memo(AccountInfoCardComponent);
