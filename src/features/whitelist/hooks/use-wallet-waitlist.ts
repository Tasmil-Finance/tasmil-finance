"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://backend.tasmil-finance.xyz";

/** Unwrap TransformInterceptor wrapper {success, data} → data */
function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: T }).data;
  }
  console.warn("[unwrap] No wrapper found, returning raw:", raw);
  return raw as T;
}

// ── API client helpers ──

async function requestChallenge(walletAddress: string) {
  const res = await fetch(`${API_BASE}/api/waitlist/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  const raw = await res.json();
  console.log("[API] POST /challenge", { status: res.status, ok: res.ok, raw });
  if (!res.ok) throw new Error(raw.message ?? "Failed to request challenge");
  return unwrap(raw) as Promise<{ challenge: string; nonce: string; expiresAt: string }>;
}

async function registerWallet(payload: {
  walletAddress: string;
  walletProvider: string;
  signedChallenge: string;
  referredByCode?: string;
  source?: string;
}) {
  const res = await fetch(`${API_BASE}/api/waitlist/register-wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await res.json();
  console.log("[API] POST /register-wallet", { status: res.status, ok: res.ok, raw });
  if (!res.ok) throw new Error(raw.message ?? "Registration failed");
  return unwrap(raw) as Promise<{
    id: string;
    referralCode: string;
    success: boolean;
    alreadyRegistered: boolean;
  }>;
}

async function fetchWalletStatus(walletAddress: string) {
  const res = await fetch(
    `${API_BASE}/api/waitlist/status?walletAddress=${encodeURIComponent(walletAddress)}`,
  );
  const raw = await res.json();
  console.log("[API] GET /status", { status: res.status, ok: res.ok, walletAddress, raw });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch status");
  return unwrap(raw) as Promise<{
    id: string;
    walletAddress: string;
    referralCode: string;
    queueRank: number;
    totalEntries: number;
    successfulReferralCount: number;
    referredByCode: string | null;
    createdAt: string;
    hasEmail: boolean;
    emailDeliveryEligible: boolean;
  }>;
}

async function verifyReferralCode(code: string) {
  const res = await fetch(
    `${API_BASE}/api/waitlist/verify-referral?code=${encodeURIComponent(code)}`,
  );
  if (!res.ok) throw new Error("Failed to verify referral code");
  const raw = await res.json();
  return unwrap(raw) as Promise<{ valid: boolean; inviterWalletAddress: string | null }>;
}

async function attachWaitlistContact(payload: { walletAddress: string; email: string }) {
  const res = await fetch(`${API_BASE}/api/waitlist/contact`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await res.json();
  console.log("[API] PATCH /contact", { status: res.status, ok: res.ok, raw });
  if (!res.ok) throw new Error(raw.message ?? "Failed to attach email");
  return unwrap(raw) as Promise<{
    success: boolean;
    alreadyHasEmail: boolean;
    email: string | null;
  }>;
}

// ── Hooks ──

export function useRequestChallenge() {
  return useMutation({
    mutationFn: ({ walletAddress }: { walletAddress: string }) =>
      requestChallenge(walletAddress),
    onError: () => {
      toast.error("Failed to request wallet challenge. Please try again.");
    },
  });
}

export function useRegisterWallet() {
  return useMutation({
    mutationFn: registerWallet,
    onSuccess: () => {
      toast.success("You're on the list!", {
        description: "Your wallet has been registered on the Tasmil waitlist.",
      });
    },
    onError: (error: Error) => {
      toast.error("Registration failed", {
        description: error.message ?? "Please try again or contact support.",
      });
    },
  });
}

export function useWalletStatus(walletAddress: string | null) {
  return useQuery({
    queryKey: ["waitlist", "status", walletAddress],
    queryFn: () => fetchWalletStatus(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 0,
  });
}

export function useVerifyReferralCode(code: string | null) {
  return useQuery({
    queryKey: ["waitlist", "verify-referral", code],
    queryFn: () => verifyReferralCode(code!),
    enabled: !!code && code.length > 0,
  });
}

export function useAttachWaitlistContact() {
  return useMutation({
    mutationFn: attachWaitlistContact,
    onSuccess: (data) => {
      if (data.alreadyHasEmail) {
        toast.success("Email already attached", {
          description:
            "Your email is already on file for access code delivery.",
        });
      } else {
        toast.success("Email attached", {
          description:
            "You'll receive your access code via email when early access opens.",
        });
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to attach email", {
        description: error.message ?? "Please try again or contact support.",
      });
    },
  });
}
