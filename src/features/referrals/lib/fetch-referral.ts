"use client";

import backendAxios from "@/lib/kubb-backend";

export interface ReferralEvent {
  kind: "JOIN" | "X_SHARE";
  creditsAwarded: number;
  occurredAt: string;
}

export interface ReferralSnapshot {
  referralCode: string | null;
  totalEarnedCredits: number;
  joinClaimedAt: string | null;
  xLinked: boolean;
  recentEvents: ReferralEvent[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "success" in payload) {
    const env = payload as ApiEnvelope<T>;
    if (!env.success) throw new Error("backend reported success=false");
    return env.data;
  }
  return payload as T;
}

export async function fetchReferralSnapshot(): Promise<ReferralSnapshot> {
  const res = await backendAxios.get<ApiEnvelope<ReferralSnapshot> | ReferralSnapshot>(
    "/api/referral/me"
  );
  return unwrap(res.data);
}
