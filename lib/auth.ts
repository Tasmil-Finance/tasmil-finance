import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export type UserType = "guest" | "regular" | "wallet";

export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  type: UserType;
}

export interface AuthResult {
  user: User | null;
}

export interface Session {
  user: User | null;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "secret"
);

/**
 * Get current authenticated user from JWT token in cookies
 * This replaces the old next-auth based auth() function
 * Returns format compatible with next-auth: { user: User | null }
 */
export async function auth(): Promise<Session> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { user: null };
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const jwtPayload = payload as {
        id: string;
        email?: string;
        walletAddress?: string;
        type: UserType;
        [key: string]: unknown;
      };

      // Extract wallet address from email if it's a wallet user
      let walletAddress: string | undefined;
      if (jwtPayload.type === "wallet" && jwtPayload.email?.startsWith("wallet:")) {
        walletAddress = jwtPayload.email?.replace("wallet:", "");
      }

      return {
        user: {
          id: jwtPayload.id,
          email: jwtPayload.email,
          walletAddress: walletAddress || jwtPayload.walletAddress,
          type: jwtPayload.type || "regular",
        },
      };
    } catch (error) {
      // Token is invalid or expired
      return { user: null };
    }
  } catch (error) {
    return { user: null };
  }
}

/**
 * Sign out user by clearing auth token cookie
 */
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

