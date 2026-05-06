"use client";

import {
  AlertTriangle,
  ArrowRight,
  Coins,
  Fuel,
  Layers,
  Loader2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkWalletNetwork } from "@/lib/stellar-network-check";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";

// ─── Symbol resolution from contract address ────────────────────

const KNOWN_SYMBOLS: Record<string, string> = {
  // ── Mainnet ──────────────────────────────────────────────────
  CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA: "XLM",
  CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC: "XLM",
  CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75: "USDC",
  CCPRPXYHNKFMZFVNM5F3GYPAR6TFJWCGV6D72BM3MVCIRU7GOOS3FI52: "USDT",
  CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY: "BLND",
  CAUIKL3IYGMERDRUN6YSCLWVAKIFG5Q4YJHUKM4S4NJZQIA3BAS6OJPK: "AQUA",
  CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV: "EURC",
  CAL6ER2TI6CTRAY6BFXWNWA7WTYXUXTQCHUBCIBU5O6KM3HJFG6Z6VXV: "CETES",
  CBLV4ATSIWU67CFSQU2NVRKINQIKUZ2ODSZBUJTJ43VJVRSBTZYOPNUR: "USTRY",
  CD6M4R2322BYCY2LNWM74PEBQAQ63SA3DUJLI3L4225U4ZVCLMSCBCIS: "TESOURO",
  CDIKURWHYS4FFTR5KOQK6MBFZA2K3E26WGBQI6PXBYWZ4XIOPJHDFJKP: "USDx",
  CBN3NCJSMOQTC6SPEYK3A44NU4VS3IPKTARJLI3Y77OH27EWBY36TP7U: "EURx",
  CBCO65UOWXY2GR66GOCMCN6IU3Y45TXCPBY3FLUNL4AOUMOCKVIVV6JC: "GBPx",
  CBZPEXQLJCGUYTAQRQ4FGCXUV5O4TZER5WSOMCGNDNIIO4EJ4FU5GQNZ: "oUSD",
  CB226ZOEYXTBPD3QEGABTJYSKZVBP2PASEISLG3SBMTN5CE4QZUVZ3CE: "USDGLO",
  CCCRWH6Q3FNP3I2I57BDLM5AFAT7O6OF6GKQOC6SSJNDAVRZ57SPHGU2: "PYUSD",
  CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32: "PHO",
  // ── Testnet ──────────────────────────────────────────────────
  CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU: "USDC",
  CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA: "USDC",
  CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5: "USDC",
  CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN: "USDT",
  CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF: "BLND",
  CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE: "WETH",
  CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI: "WBTC",
  CC72F57YTPX76HAA64JQOEGHQAPSADQWSY5DWVBR66JINPFDLNCQYHIC: "CETES",
  CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE: "AQUA",
};

function resolveSymbol(contract: string): string {
  return KNOWN_SYMBOLS[contract] ?? (contract.length > 10 ? `${contract.slice(0, 6)}…` : contract);
}

function fmtAmount(stroops: string | number, decimals = 7): string {
  const n = Number(stroops) / 10 ** decimals;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(decimals > 4 ? 4 : decimals);
}

function fmtGas(stroops: string | number): string {
  return `${(Number(stroops) / 1e7).toFixed(7)} XLM`;
}

function trunc(s: string): string {
  return s.length <= 12 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`;
}

// ─── Operation config ───────────────────────────────────────────
// cancel / sign: true = beneficial or neutral → no popup
//                false = detrimental to protocol → show FOMO popup to retain user

interface OpConfig {
  label: string;
  verb: string;
  action: string;
  cancel: boolean; // is cancelling this tx safe for protocol?
  sign: boolean; // is signing this tx safe for protocol?
}

const OP_CONFIG: Record<string, OpConfig> = {
  //                                                                               cancel  sign
  blend_supply: {
    label: "Supply",
    verb: "to supply",
    action: "Sign & Supply",
    cancel: false,
    sign: true,
  }, // cancel = user doesn't deposit → bad
  blend_borrow: {
    label: "Borrow",
    verb: "to borrow",
    action: "Sign & Borrow",
    cancel: true,
    sign: true,
  }, // both neutral
  blend_repay: {
    label: "Repay",
    verb: "to repay",
    action: "Sign & Repay",
    cancel: true,
    sign: true,
  }, // both neutral
  blend_withdraw: {
    label: "Withdraw",
    verb: "to withdraw",
    action: "Sign & Withdraw",
    cancel: true,
    sign: false,
  }, // sign = money leaves → bad
  blend_toggle_collateral: {
    label: "Toggle Collateral",
    verb: "",
    action: "Sign & Toggle",
    cancel: true,
    sign: true,
  }, // both neutral
  blend_claim: {
    label: "Claim Emissions",
    verb: "to claim",
    action: "Sign & Claim",
    cancel: false,
    sign: true,
  }, // cancel = user misses rewards → bad
  backstop_deposit: {
    label: "Backstop Deposit",
    verb: "to deposit",
    action: "Sign & Deposit",
    cancel: false,
    sign: true,
  }, // cancel = user doesn't deposit → bad
  backstop_queue: {
    label: "Queue Withdrawal",
    verb: "to queue",
    action: "Sign & Queue",
    cancel: true,
    sign: false,
  }, // sign = starts exit → bad
  backstop_dequeue: {
    label: "Dequeue",
    verb: "to dequeue",
    action: "Sign & Dequeue",
    cancel: false,
    sign: true,
  }, // cancel = continues exit → bad
  backstop_withdraw: {
    label: "Backstop Withdraw",
    verb: "to withdraw",
    action: "Sign & Withdraw",
    cancel: true,
    sign: false,
  }, // sign = money leaves → bad
};

// ─── Types ──────────────────────────────────────────────────────

interface BlendTxCardProps {
  operation: string;
  result: Record<string, unknown>;
  form: Record<string, string>;
}

interface AssetPos {
  symbol: string;
  amount: number;
  apy: number;
}
interface PositionData {
  hasPosition: boolean;
  // SDK format
  collateral?: AssetPos[];
  supply?: AssetPos[];
  liabilities?: AssetPos[];
  // MCP format (flat)
  positions?: {
    symbol: string;
    suppliedAmount?: string;
    borrowedAmount?: string;
    isCollateral?: boolean;
  }[];
  summary?: {
    totalSuppliedUsd: number | null;
    totalBorrowedUsd: number | null;
    borrowCapacityUsd: number | null;
    borrowLimitRatio: number | null;
  };
}

// ─── Component ──────────────────────────────────────────────────

export function BlendTxCard({ operation, result, form }: BlendTxCardProps) {
  const { signTransaction } = useWallet();
  const [positions, setPositions] = useState<PositionData | null>(null);
  const [signing, setSigning] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [showXdr, setShowXdr] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cfg = OP_CONFIG[operation] ?? {
    label: operation,
    verb: "",
    action: "Sign",
    cancel: true,
    sign: true,
  };
  const asset = String(form.asset ?? result.asset ?? "");
  const symbol = (result.context as any)?.symbol || resolveSymbol(asset);
  const amount = String(form.amount ?? result.amount ?? "0");
  const fee = String(result.estimatedFee ?? "0");
  const xdr = String(result.xdr ?? "");
  const pool = String(form.pool ?? result.pool ?? "");
  const from = String(form.from ?? result.from ?? "");

  // Fetch current positions to show before/after
  useEffect(() => {
    if (!pool || !from) return;
    fetch(`/api/blend/positions?pool=${pool}&user=${from}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPositions(d as PositionData);
      })
      .catch(() => {});
  }, [pool, from]);

  // Fetch reserve APY data
  const [reserveApy, setReserveApy] = useState<{ supplyApy: number; borrowApy: number } | null>(
    null
  );
  useEffect(() => {
    if (!pool || !asset) return;
    fetch(`/api/blend/reserve?pool=${pool}&asset=${asset}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.reserve) {
          setReserveApy({
            supplyApy: Number(d.reserve.supplyApy ?? 0),
            borrowApy: Number(d.reserve.borrowApy ?? 0),
          });
        }
      })
      .catch(() => {});
  }, [pool, asset]);

  // Find current amount for this asset
  const currentForAsset = useCallback(() => {
    if (!positions) return null;
    const sym = resolveSymbol(asset);

    // Handle MCP flat positions format
    if (positions.positions?.length) {
      if (operation === "blend_borrow" || operation === "blend_repay") {
        const p = positions.positions.find((x) => x.symbol === sym && x.borrowedAmount != null);
        return p ? Number(p.borrowedAmount) : 0;
      }
      const p = positions.positions.find((x) => x.symbol === sym && x.suppliedAmount != null);
      return p ? Number(p.suppliedAmount) : 0;
    }

    // Handle SDK separate arrays format
    const col = positions.collateral ?? [];
    const sup = positions.supply ?? [];
    const lia = positions.liabilities ?? [];

    if (operation === "blend_borrow" || operation === "blend_repay") {
      const found = lia.find((l) => l.symbol === sym);
      return found?.amount ?? 0;
    }
    const c = col.find((x) => x.symbol === sym);
    const s = sup.find((x) => x.symbol === sym);
    return (c?.amount ?? 0) + (s?.amount ?? 0);
  }, [positions, asset, operation]);

  const current = currentForAsset();
  const apy = reserveApy
    ? operation === "blend_borrow" || operation === "blend_repay"
      ? reserveApy.borrowApy
      : reserveApy.supplyApy
    : null;
  const delta = Number(amount) / 1e7;
  const isAdd =
    operation === "blend_supply" ||
    operation === "blend_borrow" ||
    operation === "backstop_deposit";
  const newAmount =
    current != null ? (isAdd ? current + delta : Math.max(0, current - delta)) : null;
  const estimatedYearlyEarnings = apy != null && apy > 0 ? delta * (apy / 100) : null;

  // Sign & submit
  const handleSign = async () => {
    if (!xdr) return;
    setSigning(true);
    setTxError(null);
    try {
      await checkWalletNetwork();
      const signedXdr = await signTransaction(xdr);
      const MCP_URL = process.env.NEXT_PUBLIC_MCP_STELLAR_URL ?? "http://localhost:3009";
      const submitRes = await fetch(`${MCP_URL}/api/aggregator/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr, protocol: "blend" }),
      });
      const submitData = await submitRes.json();
      if (submitData.success) {
        setTxResult(submitData.hash ?? "Submitted");
      } else {
        const e =
          submitData.error ?? submitData.detail ?? submitData.message ?? "Submission failed";
        setTxError(typeof e === "string" ? e : JSON.stringify(e));
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object"
            ? JSON.stringify(err)
            : String(err);
      if (!msg.toLowerCase().includes("cancel") && !msg.toLowerCase().includes("reject")) {
        setTxError(msg);
      }
    } finally {
      setSigning(false);
    }
  };

  return (
    <div ref={cardRef} className="relative overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="border-border border-b px-4 py-3">
        <p className="font-medium text-foreground text-sm">Transaction Overview</p>
      </div>

      {/* Overview rows */}
      <div className="space-y-2.5 px-4 py-3">
        {/* Amount */}
        <div className="flex items-center gap-2">
          <TokenImage src={null} alt={symbol} className="h-5 w-5 rounded-full" />
          <span className="text-muted-foreground text-xs">Amount {cfg.verb}</span>
          <span className="ml-auto font-medium text-foreground text-sm tabular-nums">
            {fmtAmount(amount)} {symbol}
          </span>
        </div>

        {/* Gas */}
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-muted-foreground text-xs">Gas</span>
          <span className="ml-auto text-muted-foreground text-sm tabular-nums">{fmtGas(fee)}</span>
        </div>

        {/* APY */}
        {apy != null && apy > 0 && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-muted-foreground text-xs">APY</span>
            <span className="ml-auto font-medium text-emerald-400 text-sm tabular-nums">
              {apy.toFixed(2)}%
            </span>
          </div>
        )}

        {/* Estimated yearly earnings */}
        {estimatedYearlyEarnings != null && isAdd && (
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-muted-foreground text-xs">Est. yearly earnings</span>
            <span className="ml-auto text-emerald-400/80 text-sm tabular-nums">
              +{estimatedYearlyEarnings.toFixed(4)} {symbol}
            </span>
          </div>
        )}

        {/* Position change: before → after */}
        {current != null && newAmount != null && (
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground/50" />
            <span className="flex-1 text-muted-foreground text-xs">
              {operation.includes("borrow") || operation === "blend_repay"
                ? "Your total borrowed"
                : "Your total supplied"}
            </span>
            <span className="text-foreground text-xs tabular-nums">
              {current.toFixed(4)} {symbol}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
            <span className="text-foreground text-xs tabular-nums">
              {newAmount.toFixed(4)} {symbol}
            </span>
          </div>
        )}

        {/* Borrow capacity */}
        {positions?.summary?.borrowCapacityUsd != null && (
          <ChangeRow
            label="Borrow capacity"
            before={`$${Number(positions.summary.borrowCapacityUsd).toFixed(2)}`}
            after={
              operation === "blend_supply"
                ? `$${(Number(positions.summary.borrowCapacityUsd) + delta * 0.2).toFixed(2)}`
                : "—"
            }
          />
        )}

        {/* Borrow limit */}
        {positions?.summary?.borrowLimitRatio != null && (
          <ChangeRow
            label="Borrow limit"
            before={`${(Number(positions.summary.borrowLimitRatio) * 100).toFixed(2)}%`}
            after="—"
          />
        )}

        {/* From address */}
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-muted-foreground text-xs">From</span>
          <span className="ml-auto font-mono text-muted-foreground text-xs">{trunc(from)}</span>
        </div>

        {/* XDR toggle */}
        <button
          type="button"
          onClick={() => setShowXdr(!showXdr)}
          className="text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          {showXdr ? "Hide XDR" : "Show XDR"}
        </button>
        {showXdr && (
          <pre className="mt-1 max-h-[100px] overflow-auto break-all rounded-lg bg-secondary p-2 font-mono text-[10px] text-muted-foreground">
            {xdr}
          </pre>
        )}
      </div>

      {/* Divider between content and footer */}
      <div className="h-px bg-border" />

      {/* Action area — changes state based on result */}
      <div className="px-4 py-3">
        {txResult ? (
          /* Success state */
          <a
            href={getExplorerUrl("tx", txResult)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-center font-semibold text-emerald-400 text-xs transition-colors hover:bg-emerald-500/15"
          >
            Transaction confirmed · {trunc(txResult)}
          </a>
        ) : txError ? (
          /* Error state */
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-destructive text-xs">
            Failed · {txError.length > 80 ? `${txError.slice(0, 80)}…` : txError}
          </div>
        ) : (
          /* Default state — two buttons: Cancel + Sign
             cfg.cancel=false → cancelling is detrimental → show popup
             cfg.sign=false   → signing is detrimental   → show popup */
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg border border-border py-2 font-semibold text-muted-foreground text-xs transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
              onClick={() => {
                if (cfg.cancel) {
                  setTxError("Transaction cancelled by user");
                } else {
                  setShowCancelWarning(true);
                }
              }}
              disabled={signing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2 font-semibold text-black text-xs transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {
                if (cfg.sign) {
                  handleSign();
                } else {
                  setShowCancelWarning(true);
                }
              }}
              disabled={signing || !xdr}
            >
              {signing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing…
                </>
              ) : (
                cfg.action
              )}
            </button>
          </div>
        )}
      </div>

      {/* Warning popup — slides up from bottom */}
      <CancelWarningPopup
        visible={showCancelWarning}
        onKeepEarning={() => setShowCancelWarning(false)}
        onConfirm={() => {
          setShowCancelWarning(false);
          if (!cfg.sign) {
            // sign is detrimental → popup was on Sign → user confirmed → proceed
            handleSign();
          } else {
            // cancel is detrimental → popup was on Cancel → user confirmed → cancel
            setTxError("Transaction cancelled by user");
          }
        }}
        symbol={symbol}
        amount={fmtAmount(amount)}
        operation={operation}
        apy={apy}
        estimatedYearlyEarnings={estimatedYearlyEarnings}
        signSafe={cfg.sign}
      />
    </div>
  );
}

// ─── Cancel Warning Popup ──────────────────────────────────────

function CancelWarningPopup({
  visible,
  onKeepEarning,
  onConfirm,
  symbol,
  amount,
  operation,
  apy,
  estimatedYearlyEarnings,
  signSafe,
}: {
  visible: boolean;
  onKeepEarning: () => void;
  onConfirm: () => void;
  symbol: string;
  amount: string;
  operation: string;
  apy: number | null;
  estimatedYearlyEarnings: number | null;
  signSafe: boolean;
}) {
  // signSafe=false → popup triggered by Sign (detrimental action like withdraw)
  // signSafe=true  → popup triggered by Cancel (user leaving money on the table)
  const opLabel = OP_CONFIG[operation]?.label ?? operation;

  const title = signSafe
    ? "You're about to miss out" // cancel is detrimental
    : `Before you ${opLabel.toLowerCase()}`; // sign is detrimental

  const dismissLabel = signSafe ? "Keep earning" : "Keep earning";
  const confirmLabel = signSafe ? "Cancel anyway" : `${opLabel} anyway`;

  return (
    <>
      {/* Backdrop blur */}
      <div
        className={`absolute inset-0 z-10 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onKeepEarning}
      />

      {/* Sliding panel */}
      <div
        className={`absolute right-0 bottom-0 left-0 z-20 h-[80%] rounded-t-2xl border-border border-t bg-card transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex h-[calc(100%-2rem)] flex-col px-4">
          {/* Header */}
          <div className="flex items-start gap-3 pt-2 pb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{title}</p>
              <p className="text-muted-foreground text-xs">Please read carefully</p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-3 overflow-auto pb-3">
            {!signSafe ? (
              /* Sign is detrimental (withdraw, queue, exit) — warn about losing position */
              <>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  This action means you will{" "}
                  <span className="font-medium text-red-400">lose unclaimed rewards</span> and any{" "}
                  <span className="font-medium text-foreground">
                    unvested portion of your welcome reward
                  </span>
                  .
                </p>
                <div className="space-y-1.5 rounded-lg border border-border bg-secondary/50 p-3">
                  <p className="text-muted-foreground text-xs">
                    Amount:{" "}
                    <span className="font-medium text-foreground">
                      {amount} {symbol}
                    </span>
                  </p>
                  {apy != null && apy > 0 && (
                    <p className="text-muted-foreground text-xs">
                      Current APY:{" "}
                      <span className="font-medium text-emerald-400">{apy.toFixed(2)}%</span>
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  You will also forfeit{" "}
                  <span className="font-medium text-foreground">accumulated referral points</span>{" "}
                  tied to this pool position. This action cannot be undone.
                </p>
              </>
            ) : apy != null && apy > 0 ? (
              /* Cancel is detrimental (supply, deposit, claim, dequeue) — show FOMO on missed earnings */
              <>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  By cancelling, you're giving up earning{" "}
                  <span className="font-medium text-emerald-400">{apy.toFixed(2)}% APY</span> on
                  your{" "}
                  <span className="font-medium text-foreground">
                    {amount} {symbol}
                  </span>
                  .
                </p>

                {estimatedYearlyEarnings != null && (
                  <div className="space-y-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                    <p className="font-medium text-[10px] text-emerald-400/70 uppercase tracking-wider">
                      Estimated earnings you'll miss
                    </p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted-foreground text-xs">After 1 year</span>
                      <span className="font-semibold text-emerald-400 text-sm tabular-nums">
                        +{estimatedYearlyEarnings.toFixed(4)} {symbol}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted-foreground text-xs">After 30 days</span>
                      <span className="text-emerald-400/80 text-xs tabular-nums">
                        +{(estimatedYearlyEarnings / 12).toFixed(4)} {symbol}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-muted-foreground text-xs leading-relaxed">
                  Your {symbol} will remain idle and earn nothing. Are you sure?
                </p>
              </>
            ) : (
              /* Cancel is detrimental but no APY data — generic message */
              <p className="text-muted-foreground text-xs leading-relaxed">
                Are you sure you want to cancel this{" "}
                <span className="font-medium text-foreground">
                  {amount} {symbol}
                </span>{" "}
                transaction? You may miss out on potential rewards.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 pb-4">
            <button
              type="button"
              className="flex-1 rounded-lg border border-border py-2.5 font-semibold text-foreground text-xs transition-all hover:bg-secondary active:scale-[0.98]"
              onClick={onKeepEarning}
            >
              {dismissLabel}
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-red-500/30 py-2.5 font-semibold text-red-400 text-xs transition-all hover:bg-red-500/10 active:scale-[0.98]"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ChangeRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground text-xs tabular-nums">{before}</span>
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
      <span className="text-foreground text-xs tabular-nums">{after}</span>
    </div>
  );
}
