import { type NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";

// Server-side: use internal Docker URL if available, fallback to public URL
const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  requireEnv("BACKEND_INTERNAL_URL", "http://localhost:6756");

function unwrapBackendResponse<T>(payload: T | { success?: boolean; data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/waitlist/contact`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(unwrapBackendResponse(data), {
      status: response.status,
    });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
