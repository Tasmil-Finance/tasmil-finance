import { type NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  requireEnv("BACKEND_INTERNAL_URL", "http://localhost:6756");

function unwrap<T>(payload: T | { success?: boolean; data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) return payload.data as T;
  return payload as T;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const days = _request.nextUrl.searchParams.get("days") ?? "30";
    const response = await fetch(
      `${BACKEND_URL}/api/portfolio/history/${encodeURIComponent(address)}?days=${days}`
    );
    const data = await response.json();
    return NextResponse.json(unwrap(data), { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
