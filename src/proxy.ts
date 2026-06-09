import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_ADMIN_SECRET = new TextEncoder().encode(process.env.JWT_ADMIN_SECRET!);
const WAITLIST_MODE = process.env.WAITLIST_MODE === "true";

const PUBLIC_PATHS = ["/waitlist", "/api", "/_next", "/favicon.ico", "/robots.txt", "/images"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Waitlist gate ──────────────────────────────────────────────────────────
  if (WAITLIST_MODE) {
    const isExempt =
      PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
      pathname === "/" ||
      pathname.startsWith("/admin");

    if (!isExempt) {
      const accessCookie = request.cookies.get("tasmil_access")?.value;
      if (!accessCookie) {
        return NextResponse.redirect(new URL("/waitlist", request.url));
      }
      try {
        await jwtVerify(accessCookie, JWT_SECRET);
      } catch {
        return NextResponse.redirect(new URL("/waitlist", request.url));
      }
    }
  }

  // Allow public assets and home
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Admin guard
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const adminCookie = request.cookies.get("tasmil_admin")?.value;
    if (!adminCookie) return NextResponse.redirect(new URL("/admin/login", request.url));
    try {
      await jwtVerify(adminCookie, JWT_ADMIN_SECRET);
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Faucet: testnet only
  const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "testnet";
  if ((pathname === "/faucet" || pathname.startsWith("/faucet/")) && !isTestnet) {
    return NextResponse.redirect(new URL("/chat/new", request.url));
  }

  // Playground + dev: development only.
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === "development";
  const isDevOnly =
    pathname === "/playground" ||
    pathname.startsWith("/playground/") ||
    pathname === "/dev" ||
    pathname.startsWith("/dev/");

  if (isDevOnly && !isDev) {
    return NextResponse.redirect(new URL("/chat/new", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
