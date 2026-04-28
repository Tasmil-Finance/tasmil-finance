"use client";

import backendAxios from "@/lib/kubb-backend";

export interface CreateQuoteResponse {
  topupId: string;
  rail: "CRYPTO" | "FIAT";
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/**
 * Creates a topup quote on the backend. Auth is attached automatically by
 * `backendAxios` (Bearer token from zustand store). Throws on 4xx/5xx so
 * the caller can route to /login or show an error.
 */
export async function createQuote(
  packageId: string,
  rail: "CRYPTO" | "FIAT"
): Promise<CreateQuoteResponse> {
  const res = await backendAxios.post<ApiEnvelope<CreateQuoteResponse> | CreateQuoteResponse>(
    "/api/topup/quote",
    { packageId, rail }
  );

  const body = res.data as ApiEnvelope<CreateQuoteResponse> | CreateQuoteResponse;
  if ("success" in body) {
    if (!body.success) throw new Error("backend reported success=false");
    return body.data;
  }
  return body as CreateQuoteResponse;
}
