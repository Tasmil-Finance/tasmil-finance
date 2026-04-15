import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://backend.tasmil-finance.xyz";

function getAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getAdminToken(request);
  if (!token) return NextResponse.json({ message: "No admin token" }, { status: 401 });

  const days = new URL(request.url).searchParams.get("days") ?? "30";

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/stats/registrations?days=${days}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
