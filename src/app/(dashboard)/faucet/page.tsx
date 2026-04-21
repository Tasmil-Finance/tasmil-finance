"use client";

import { useState } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import Image from "next/image";
import { ExternalLink, LogOut } from "lucide-react";
import BorderGlow from "@/shared/ui/border-glow";
import { BackgroundRippleEffect } from "@/shared/ui/background-ripple-effect";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { toast } from "sonner";
import { redirect } from "next/navigation";

const isTestnet = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] !== "mainnet";
const FRIENDBOT_URL = "https://friendbot.stellar.org";
const STELLAR_EXPERT = "https://stellar.expert/explorer";

export default function FaucetPage() {
  if (!isTestnet) {
    redirect("/agents");
  }
  const { address, isConnected, displayAddress, disconnect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleClaim() {
    if (!address) return;
    setLoading(true);
    setTxHash(null);
    try {
      const res = await fetch(`${FRIENDBOT_URL}?addr=${address}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail ?? "Request failed");
      const hash = json?.hash ?? null;
      setTxHash(hash);
      toast.success("10,000 XLM sent to your wallet");
    } catch (e: any) {
      toast.error("Request failed", { description: e?.message ?? "Try again later" });
    } finally {
      setLoading(false);
    }
  }

  const network = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] === "mainnet" ? "public" : "testnet";

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-56px)] w-full px-4 py-16 text-center overflow-hidden">
      <BackgroundRippleEffect rows={10} cols={22} cellSize={72} />
      <div className="relative z-10 w-full max-w-lg space-y-8">

        {/* Hero text */}
        <div className="space-y-3">
          <Typography as="h1" variant="h1" weight="bold" className="text-5xl leading-tight tracking-tight text-center">
            Claim test token<br />to your wallet
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-base text-center">
            Fund your wallet with 10,000 XLM on Stellar testnet
          </Typography>
        </div>

        {/* Wallet card */}
        <BorderGlow
          animated
          borderRadius={16}
          glowColor="195 80 70"
          colors={["#00BFFF22", "#B5EAFF11", "#0080FF22"]}
          backgroundColor="var(--secondary, #111)"
          glowIntensity={0.8}
          className="w-full text-left"
        >
          {/* Wallet status row */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isConnected ? `Stellar Connected · ${displayAddress}` : "Wallet not connected"}
              </span>
            </div>
            {isConnected && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => disconnect()}
                className="h-auto gap-1.5 p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect wallet
              </Button>
            )}
          </div>

          {/* Amount row */}
          <div className="flex items-center justify-between px-5 py-5">
            <span className="text-sm text-muted-foreground">You will receive:</span>
            <div className="flex items-center gap-2">
              <Image src="/token/xlm.png" alt="XLM" width={28} height={28} className="rounded-full" />
              <span className="text-lg font-bold">10,000 XLM</span>
            </div>
          </div>
        </BorderGlow>

        {/* CTA */}
        <Button
          type="button"
          onClick={handleClaim}
          disabled={!isConnected || loading}
          className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] px-12 py-4 text-base font-bold text-black transition-all hover:scale-105 hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-[50%] rounded-full bg-white/80 blur-xl" />
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              Sending...
            </span>
          ) : "Claim 10,000 XLM"}
        </Button>

        {/* Tx status */}
        {(loading || txHash) && (
          <div className="rounded-2xl border border-border bg-secondary/30 flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              {loading ? (
                <span className="h-5 w-5 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin" />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              )}
              <span className="text-sm font-medium">
                {loading ? "Sending Transaction..." : "Transaction confirmed"}
              </span>
            </div>
            {txHash && (
              <a
                href={`${STELLAR_EXPERT}/${network}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Track
              </a>
            )}
          </div>
        )}

        {/* Footer note */}
        <Typography variant="small" className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          To ensure a sufficient balance for all users, the Faucet is set to
          dispense 10,000 testnet XLM every 24 hours per address.
        </Typography>
      </div>
    </div>
  );
}
