import "server-only";
import { requireEnv } from "@/lib/env";
import type { CreditPackage } from "../types";

interface BackendEnvelope<T> {
  success: true;
  data: T;
}

function resolveBackendBaseUrl(): string {
  const internal = process.env.BACKEND_INTERNAL_URL;
  if (internal && internal.length > 0) return internal.replace(/\/$/, "");
  const publicUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (publicUrl && publicUrl.length > 0) return publicUrl.replace(/\/$/, "");
  return requireEnv("BACKEND_INTERNAL_URL", "http://localhost:6756");
}

export async function fetchCreditPackages(): Promise<CreditPackage[]> {
  const url = `${resolveBackendBaseUrl()}/api/credit/packages`;
  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`fetchCreditPackages: backend responded ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as BackendEnvelope<CreditPackage[]>;
  return json.data;
}
