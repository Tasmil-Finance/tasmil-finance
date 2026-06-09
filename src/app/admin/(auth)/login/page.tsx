"use client";

import { Bot, Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/features/admin-auth/hooks/use-admin-auth";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";
import { useAdminAuthStore } from "@/store/use-admin-auth";

type Tab = "email" | "wallet";
type WalletStep = "connect" | "pin";

export default function AdminLoginPage() {
  const [tab, setTab] = useState<Tab>("wallet");
  const router = useRouter();

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAdminAuth();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result?.success) router.push("/admin/dashboard");
  };

  // Wallet+PIN state
  const [walletStep, setWalletStep] = useState<WalletStep>("connect");
  const [walletAddress, setWalletAddress] = useState("");
  const [nonce, setNonce] = useState("");
  const [pin, setPin] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  const { setAuth } = useAdminAuthStore();

  async function connectWallet() {
    setWalletLoading(true);
    setWalletError("");
    try {
      // @ts-expect-error — freighter-api injected globally
      const { isConnected, getPublicKey } = await import("@stellar/freighter-api");
      const connected = await isConnected();
      if (!connected) throw new Error("Freighter not found. Install the extension.");

      const address = await getPublicKey();
      if (!address) throw new Error("Could not get wallet address.");
      setWalletAddress(address);

      const res = await fetch("/api/admin-auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to get challenge");
      setNonce(data.nonce);
      setWalletStep("pin");
    } catch (e: unknown) {
      setWalletError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setWalletLoading(false);
    }
  }

  async function submitWalletPin() {
    setWalletLoading(true);
    setWalletError("");
    try {
      const { signMessage } = await import("@stellar/freighter-api");
      // @ts-ignore
      const result = await signMessage(nonce, { address: walletAddress });
      const signedChallenge = result?.signedMessage ?? result;

      const res = await fetch("/api/admin-auth/wallet-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signedChallenge, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Login failed");

      setAuth(data.accessToken, {
        id: data.admin?.id ?? walletAddress,
        email: data.admin?.email ?? walletAddress,
        role: data.admin?.role ?? "SUPER_ADMIN",
      });
      router.push("/admin/dashboard");
    } catch (e: unknown) {
      setWalletError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Bot className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="mb-6 text-center">
          <Typography variant="h2" className="mb-2 font-bold text-2xl tracking-tight">
            Admin Portal
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-sm">
            Sign in to manage the whitelist and campaigns
          </Typography>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setTab("wallet")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "wallet"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Wallet + PIN
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "email"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email
          </button>
        </div>

        {/* Wallet+PIN tab */}
        {tab === "wallet" && (
          <div className="space-y-4">
            {walletStep === "connect" ? (
              <Button
                onClick={connectWallet}
                disabled={walletLoading}
                className="h-11 w-full"
                variant="gradient"
              >
                {walletLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Connect Freighter Wallet
                  </span>
                )}
              </Button>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-xs text-muted-foreground">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </div>
                <div>
                  <label className="mb-1.5 block font-medium text-sm">PIN</label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitWalletPin()}
                    placeholder="Enter your PIN"
                    disabled={walletLoading}
                    autoFocus
                  />
                </div>
                <Button
                  onClick={submitWalletPin}
                  disabled={!pin || walletLoading}
                  className="h-11 w-full"
                  variant="gradient"
                >
                  {walletLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Sign In →"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setWalletStep("connect");
                    setPin("");
                    setWalletError("");
                  }}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  ← Use a different wallet
                </button>
              </>
            )}
            {walletError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <Typography variant="p" className="text-destructive text-sm">
                  {walletError}
                </Typography>
              </div>
            )}
          </div>
        )}

        {/* Email/password tab */}
        {tab === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block font-medium text-sm">
                Email
              </label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tasmil.xyz"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block font-medium text-sm">
                Password
              </label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <Typography variant="p" className="text-destructive text-sm">
                  {error}
                </Typography>
              </div>
            )}
            <Button type="submit" disabled={isLoading} className="h-11 w-full" variant="gradient">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
