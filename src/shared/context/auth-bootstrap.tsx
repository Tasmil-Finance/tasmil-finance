"use client";

import { useEffect, useRef } from "react";
import { getBrowserBackendBaseUrl } from "@/lib/runtime-urls";
import { useAuthStore } from "@/store/use-auth";

/**
 * Rehydrates the in-memory `accessToken` from the `tasmil_auth` httpOnly
 * cookie after a page reload.
 *
 * The frontend deliberately does NOT persist `accessToken` in localStorage
 * (XSS hardening). After reload, only `user` and `expiresAt` survive in
 * the persisted Zustand state, while `accessToken` is null. This effect
 * detects that gap and asks the backend to swap the cookie back into a
 * usable Bearer token.
 *
 * Mounted once, near the top of the auth tree (inside `WalletProvider`).
 */
export function AuthBootstrap() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const { accessToken, setAuthState, logout } =
      useAuthStore.getState();

    // Already have a token in memory — nothing to rehydrate.
    if (accessToken) return;

    const url = `${getBrowserBackendBaseUrl()}/api/auth/me`;
    void fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (res.status === 401) {
          logout();
          return;
        }
        if (!res.ok) return; // transient error — leave state alone
        const body = (await res.json()) as {
          success?: boolean;
          data?: {
            accessToken: string;
            user: {
              id: string;
              walletAddress: string;
              createdAt: string;
              updatedAt: string;
            };
          };
        };
        const data = body?.data;
        if (!data?.accessToken || !data?.user) return;
        setAuthState({
          accessToken: data.accessToken,
          user: {
            id: data.user.id,
            walletAddress: data.user.walletAddress,
            type: "regular",
            createdAt: data.user.createdAt,
            updatedAt: data.user.updatedAt,
          },
        });
      })
      .catch(() => {
        // Network error — leave state alone. The user's next protected call
        // will surface its own error via the existing 401 handler.
      });
  }, []);

  return null;
}
