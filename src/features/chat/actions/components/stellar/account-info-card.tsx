"use client";

import { BarChart3, Gift, Globe, History, Key, Lock, User, Wallet } from "lucide-react";
import { memo } from "react";
import { truncateAddress } from "@/shared/config/stellar";
import { useResultData } from "../../hooks/use-result-data";
import { formatNumber, formatPercent, formatPrice } from "../../lib/formatting";
import { DetailRow, ProtocolBadge, ScrollableList } from "../base/indicators";
import { BaseInfoCard } from "../base/info-card";

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
    // Blend-specific
    blend_user_position: { title: "Blend Position", icon: BarChart3 },
    blend_backstop_balance: { title: "Backstop Balance", icon: Wallet },
    // Others
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
    <BaseInfoCard
      title={cfg?.title}
      icon={cfg?.icon}
      iconColor="text-blue-500"
      iconBg="bg-blue-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      <QueryContent query={query} data={data} args={args} toolCallId={toolCallId} />
    </BaseInfoCard>
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
  if (!data) return <div className="text-muted-foreground text-sm">No data available.</div>;

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
        <div className="mt-2 space-y-1 border-t pt-2">
          <div className="mb-1 text-muted-foreground text-xs">Balances ({balances.length})</div>
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
            className="flex items-center justify-between border-border/50 border-b py-1.5 text-sm last:border-0"
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
          <div key={op.id ?? i} className="space-y-1 rounded border p-2 text-xs">
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
        value={<span className="font-semibold text-green-500">{data.available} XLM</span>}
      />
      <div className="mt-2 space-y-1 border-t pt-2">
        <div className="mb-1 text-muted-foreground text-xs">Locked Breakdown</div>
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
          <div key={b.id ?? i} className="space-y-1 rounded border p-2 text-xs">
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
          <div key={o.id ?? i} className="space-y-1 rounded border p-2 text-xs">
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
          <div key={t.id ?? i} className="space-y-1 rounded border p-2 text-xs">
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
        value={<span className="font-bold text-lg">${formatPrice(data.price)}</span>}
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
          <div key={i} className="space-y-1 rounded border p-2 text-xs">
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
          <div className="rounded bg-muted/30 p-2 text-center">
            <div className="text-muted-foreground">Low</div>
            <div className="font-semibold">{data.thresholds.low}</div>
          </div>
          <div className="rounded bg-muted/30 p-2 text-center">
            <div className="text-muted-foreground">Med</div>
            <div className="font-semibold">{data.thresholds.med}</div>
          </div>
          <div className="rounded bg-muted/30 p-2 text-center">
            <div className="text-muted-foreground">High</div>
            <div className="font-semibold">{data.thresholds.high}</div>
          </div>
        </div>
      )}
      <div className="mt-2 space-y-1 border-t pt-2">
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
          <span className="inline-block max-w-[200px] truncate font-mono text-xs">
            {data.rpcUrl}
          </span>
        }
      />
      <DetailRow
        label="Horizon"
        value={
          <span className="inline-block max-w-[200px] truncate font-mono text-xs">
            {data.horizonUrl}
          </span>
        }
      />
    </div>
  );
}

function BlendPositionView({ data, args }: { data: any; args?: Record<string, any> }) {
  const poolAddress = args?.poolAddress ?? data?.poolAddress;
  const hasPosition = data?.hasPosition ?? false;
  const positions: any[] = data?.positions ?? [];
  const summary = data?.summary;

  // Legacy fallback: old shape { position: { collateral, liabilities, supply } }
  const legacyPosition = data?.position;
  const legacyHas = legacyPosition
    ? Object.keys(legacyPosition.collateral ?? {}).length +
      Object.keys(legacyPosition.liabilities ?? {}).length +
      Object.keys(legacyPosition.supply ?? {}).length > 0
    : false;

  const showEmpty = !hasPosition && !legacyHas;

  const supplied = positions.filter((p) => p.suppliedAmount != null);
  const borrowed = positions.filter((p) => p.borrowedAmount != null);

  return (
    <div className="space-y-2">
      {poolAddress && (
        <DetailRow label="Pool" value={truncateAddress(String(poolAddress))} mono />
      )}
      
      {/* Summary Section */}
      {summary && (
        <div className="rounded-lg bg-muted/30 p-3 space-y-2 border border-border/50">
          <div className="text-xs font-semibold text-foreground">Position Summary</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {summary.totalSuppliedUsd && (
              <>
                <span className="text-muted-foreground">Total Supplied</span>
                <span className="text-green-400 font-medium">${formatNumber(Number(summary.totalSuppliedUsd))}</span>
              </>
            )}
            {summary.totalBorrowedUsd && (
              <>
                <span className="text-muted-foreground">Total Borrowed</span>
                <span className="text-orange-400 font-medium">${formatNumber(Number(summary.totalBorrowedUsd))}</span>
              </>
            )}
            {summary.availableBorrowUsd && (
              <>
                <span className="text-muted-foreground">Available to Borrow</span>
                <span className="text-blue-400 font-medium">${formatNumber(Number(summary.availableBorrowUsd))}</span>
              </>
            )}
            {summary.healthFactor && (
              <>
                <span className="text-muted-foreground">Health Factor</span>
                <span className={`font-medium ${Number(summary.healthFactor) > 1.5 ? 'text-green-400' : Number(summary.healthFactor) > 1.1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Number(summary.healthFactor).toFixed(2)}
                </span>
              </>
            )}
            {summary.claimableBlnd && Number(summary.claimableBlnd) > 0 && (
              <>
                <span className="text-muted-foreground">Claimable BLND</span>
                <span className="text-purple-400 font-medium">{formatNumber(Number(summary.claimableBlnd))} BLND</span>
              </>
            )}
          </div>
        </div>
      )}

      {showEmpty ? (
        <div className="text-muted-foreground text-xs">No open position in this pool.</div>
      ) : (
        <>
          {supplied.length > 0 && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="text-muted-foreground text-xs font-medium mb-1">Supplied</div>
              {supplied.map((p, i) => (
                <div key={i} className="rounded-lg bg-muted/20 p-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{p.symbol ?? p.asset}</span>
                    {p.isCollateral && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-400 text-[10px]">Collateral</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                    <span>Amount</span>
                    <span className="text-foreground font-medium">{formatNumber(Number(p.suppliedAmount))} {p.symbol}</span>
                    {p.netApy != null && (
                      <>
                        <span>Net APY</span>
                        <span className={`font-semibold ${Number(p.netApy) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {Number(p.netApy) >= 0 ? '+' : ''}{formatPercent(p.netApy)}
                        </span>
                      </>
                    )}
                    {p.supplyApy != null && (
                      <>
                        <span>Supply APY</span>
                        <span className="text-green-400">{formatPercent(p.supplyApy)}</span>
                      </>
                    )}
                    {p.supplyEmissionApy != null && Number(p.supplyEmissionApy) > 0 && (
                      <>
                        <span className="text-[10px]">+ BLND Emission</span>
                        <span className="text-purple-400 text-[10px]">+{Number(p.supplyEmissionApy).toFixed(2)}%</span>
                      </>
                    )}
                    {p.borrowCapacityUsd != null && (
                      <>
                        <span>Borrow Capacity</span>
                        <span className="text-foreground">${formatNumber(Number(p.borrowCapacityUsd))}</span>
                      </>
                    )}
                    {p.suppliedUsd != null && (
                      <>
                        <span>Value</span>
                        <span className="text-foreground">${formatNumber(Number(p.suppliedUsd))}</span>
                      </>
                    )}
                    {p.assetPrice > 0 && (
                      <>
                        <span>Price</span>
                        <span className="text-foreground">${formatPrice(p.assetPrice)}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {borrowed.length > 0 && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="text-muted-foreground text-xs font-medium mb-1">Borrowed</div>
              {borrowed.map((p, i) => (
                <div key={i} className="rounded-lg bg-muted/20 p-2 space-y-1 text-xs">
                  <span className="font-semibold">{p.symbol ?? p.asset}</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                    <span>Amount</span>
                    <span className="text-foreground font-medium">{formatNumber(Number(p.borrowedAmount))} {p.symbol}</span>
                    {p.borrowApy != null && (
                      <>
                        <span>Borrow APY</span>
                        <span className="text-orange-400">{formatPercent(p.borrowApy)}</span>
                      </>
                    )}
                    {p.borrowEmissionApy != null && Number(p.borrowEmissionApy) > 0 && (
                      <>
                        <span className="text-[10px]">- BLND Rewards</span>
                        <span className="text-purple-400 text-[10px]">-{Number(p.borrowEmissionApy).toFixed(2)}%</span>
                      </>
                    )}
                    {p.borrowedUsd != null && (
                      <>
                        <span>Value</span>
                        <span className="text-foreground">${formatNumber(Number(p.borrowedUsd))}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BlendBackstopBalanceView({ data }: { data: any }) {
  const shares = data?.sharesHuman ?? (data?.shares ? (Number(data.shares) / 1e7).toFixed(7) : null);
  const queued: any[] = data?.queuedWithdrawals ?? [];
  return (
    <div className="space-y-2">
      {data?.pool && <DetailRow label="Pool" value={truncateAddress(String(data.pool))} mono />}
      {shares != null && (
        <DetailRow
          label="Backstop Shares"
          value={<span className="font-semibold">{shares}</span>}
        />
      )}
      {data?.hasPosition === false && (
        <div className="text-muted-foreground text-xs">No backstop position in this pool.</div>
      )}
      {queued.length > 0 && (
        <div className="mt-2 space-y-1 border-t pt-2">
          <div className="mb-1 text-muted-foreground text-xs">
            Queued Withdrawals ({queued.length})
          </div>
          {queued.map((q: any, i: number) => (
            <div key={i} className="space-y-1 rounded border p-2 text-xs">
              <DetailRow
                label="Amount"
                value={<span className="font-semibold">{q.amountHuman ?? q.amount}</span>}
              />
              {q.expiration != null && (
                <DetailRow label="Expiration (ledger)" value={String(q.expiration)} />
              )}
            </div>
          ))}
        </div>
      )}
      {queued.length === 0 && data?.hasPosition && (
        <div className="text-muted-foreground text-xs">No queued withdrawals.</div>
      )}
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
        {data.error && <span className="ml-2 text-red-500">{data.error}</span>}
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
