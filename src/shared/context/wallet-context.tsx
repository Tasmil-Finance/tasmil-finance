"use client";

import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getBrowserBackendBaseUrl } from "@/lib/runtime-urls";
import { type AuthUser, useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";
import { activeNetwork } from "@/shared/config/stellar";

interface WalletContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  address: string | null;
  displayAddress: string | null;
  user: AuthUser | null;
  connect: () => Promise<void>;
  connectWalletOnly: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  forceReauth: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Throttle for auto-reauth triggered by 401 events. Prevents sign-prompt storms.
const AUTO_REAUTH_THROTTLE_MS = 30_000;

// sessionStorage key set by connect() before opening the wallet modal.
// Signals "user intends to log in fully (sign included), recover the auth
// step if the connect()'s sign popup is lost to a redirect or popup-blocker."
// Cleared after the auto-auth effect fires (success OR rejection).
const AUTH_INTENT_KEY = "tasmil.wallet.auth-intent";

function readAuthIntent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(AUTH_INTENT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAuthIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUTH_INTENT_KEY, "1");
  } catch {
    /* ignore quota / privacy mode */
  }
}

function clearAuthIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(AUTH_INTENT_KEY);
  } catch {
    /* ignore */
  }
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [kitReady, setKitReady] = useState(false);

  const { setWalletState, reset: resetWallet, setSigning, signing } = useWalletStore();
  const {
    isAuthenticated,
    user,
    setAuthState,
    logout: authLogout,
    setLoading,
    isLoading: isAuthenticating,
  } = useAuthStore();

  // Track if we've already attempted auth for this address
  const authAttemptedRef = useRef<string | null>(null);
  // Track if authentication is currently in progress
  const authInProgressRef = useRef(false);
  // Timestamp of the most recent auto-reauth attempt (for throttling).
  const lastAutoReauthRef = useRef<number>(0);
  // Set once per address after we've auto-fired the post-restore auth check.
  // Prevents loops if the user rejects the sign and the catch block resets
  // authAttemptedRef to null (which would otherwise re-fire the effect).
  const autoAuthFiredForRef = useRef<string | null>(null);

  // Initialize StellarWalletsKit on mount (client-side only)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
        const { Networks, KitEventType } = await import("@creit.tech/stellar-wallets-kit/types");

        const network = activeNetwork.networkPassphrase as typeof Networks[keyof typeof Networks];

        const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

        const darkTheme = {
          "background": "#18181b",
          "background-secondary": "#27272a",
          "foreground-strong": "#fafafa",
          "foreground": "#fafafa",
          "foreground-secondary": "#a1a1aa",
          "primary": "hsl(203, 100%, 73%)",
          "primary-foreground": "#18181b",
          "transparent": "rgba(0,0,0,0)",
          "lighter": "#3f3f46",
          "light": "#27272a",
          "light-gray": "#71717a",
          "gray": "#a1a1aa",
          "danger": "#ef4444",
          "border": "#27272a",
          "shadow": "0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.4)",
          "border-radius": "0.5rem",
          "font-family": "var(--font-outfit), sans-serif",
        };

        const lightTheme = {
          "background": "#ffffff",
          "background-secondary": "#ffffff",
          "foreground-strong": "hsl(222.2, 84%, 4.9%)",
          "foreground": "hsl(222.2, 84%, 4.9%)",
          "foreground-secondary": "hsl(215.4, 16.3%, 46.9%)",
          "primary": "hsl(203, 100%, 61%)",
          "primary-foreground": "hsl(210, 40%, 98%)",
          "transparent": "rgba(0,0,0,0)",
          "lighter": "hsl(214.3, 31.8%, 91.4%)",
          "light": "hsl(210, 40%, 96.1%)",
          "light-gray": "hsl(215.4, 16.3%, 46.9%)",
          "gray": "hsl(215.4, 16.3%, 46.9%)",
          "danger": "hsl(0, 84.2%, 60.2%)",
          "border": "hsl(214.3, 31.8%, 91.4%)",
          "shadow": "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.06)",
          "border-radius": "0.5rem",
          "font-family": "var(--font-outfit), sans-serif",
        };

        StellarWalletsKit.init({
          network,
          modules: defaultModules({
            filterBy: (mod) => mod.productId !== "xbull",
          }),
          theme: isDark ? darkTheme : lightTheme,
        });

        // Listen for address / state changes
        unsubscribe = StellarWalletsKit.on(KitEventType.STATE_UPDATED, async () => {
          try {
            const { address: addr } = await StellarWalletsKit.getAddress();
            if (addr) {
              setAddress(addr);
              setIsConnected(true);
              setWalletState({ connected: true, account: addr });
            }
          } catch {
            // Kit may fire state updates before a wallet is selected — ignore
          }
        });

        setKitReady(true);
      } catch (err) {
        console.error("Failed to initialise StellarWalletsKit:", err);
      }
    })();

    return () => {
      unsubscribe?.();
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setWalletState]);

  // Auto-restore session after kit is ready
  useEffect(() => {
    if (!kitReady) return;

    const walletState = useWalletStore.getState();
    if (!walletState.connected || !walletState.account) return;

    (async () => {
      try {
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        const { address: addr } = await StellarWalletsKit.getAddress();
        if (addr) {
          setAddress(addr);
          setIsConnected(true);
          setWalletState({ connected: true, account: addr });
        } else {
          resetWallet();
        }
      } catch {
        resetWallet();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitReady, resetWallet, setWalletState]);

  // Check if current auth state is valid (token exists and user matches address)
  const isAuthValid = useCallback((walletAddress: string) => {
    const { accessToken, user } = useAuthStore.getState();
    if (!accessToken || !user) return false;
    return user.walletAddress === walletAddress;
  }, []);

  // Mock authentication function (replace with your actual API calls)
  const authenticateWithWallet = useCallback(
    async (walletAddress: string, isForced = false) => {
      if (authInProgressRef.current) {
        return;
      }

      if (!isForced) {
        if (isAuthValid(walletAddress)) {
          authAttemptedRef.current = walletAddress;
          return;
        }
        if (authAttemptedRef.current === walletAddress && isAuthenticated) {
          return;
        }
      }

      authAttemptedRef.current = walletAddress;
      authInProgressRef.current = true;
      setLoading(true);

      try {
        const apiBaseUrl = getBrowserBackendBaseUrl();

        // Step 1: Request a challenge nonce from the server
        const challengeRes = await fetch(`${apiBaseUrl}/api/auth/challenge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey: walletAddress }),
        });
        if (!challengeRes.ok) {
          throw new Error("Failed to get auth challenge");
        }
        const { data: challengeData } = await challengeRes.json();

        // Step 2: Build a TX for the user to sign (proves private key ownership)
        const { TransactionBuilder, Operation, Account } = await import(
          "@stellar/stellar-sdk"
        );
        const network = activeNetwork.networkPassphrase;
        const account = new Account(walletAddress, "0");
        const tx = new TransactionBuilder(account, {
          fee: "100",
          networkPassphrase: network,
        })
          .addOperation(
            Operation.manageData({ name: "tasmil auth", value: challengeData.challenge })
          )
          .setTimeout(300)
          .build();

        // Step 3: Sign with wallet
        if (!isForced) {
          toast.info("Sign to verify your wallet. This is free — no XLM is charged.", {
            duration: 4000,
          });
        }
        setSigning(true);
        await checkWalletNetwork();
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
          address: walletAddress,
          networkPassphrase: network,
        });

        // Step 4: Verify signature and get JWT
        setSigning(false);
        const response = await fetch(`${apiBaseUrl}/api/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey: walletAddress, signedXdr: signedTxXdr }),
        });
        if (!response.ok) {
          throw new Error("Authentication verification failed");
        }
        const result = await response.json();
        const { accessToken, user: userData } = result.data;

        setAuthState({
          accessToken,
          user: {
            id: userData.id || `user_${walletAddress.slice(0, 8)}`,
            walletAddress,
            type: "regular",
            createdAt: userData.createdAt || new Date().toISOString(),
            updatedAt: userData.updatedAt || new Date().toISOString(),
          },
        });

        toast.success("Wallet connected successfully!");
        authInProgressRef.current = false;
        setLoading(false);
        setSigning(false);
      } catch (error: unknown) {
        console.error("Authentication failed:", error);
        authAttemptedRef.current = null;
        authInProgressRef.current = false;
        setLoading(false);
        setSigning(false);

        if (
          error instanceof Error &&
          (error.message.includes("User rejected") ||
            error.message.includes("user rejected") ||
            error.message.includes("User denied"))
        ) {
          return;
        }

        const errorMessage = parseSigningError(error) || "Authentication failed. Please try again.";
        toast.error(errorMessage);
      }
    },
    [setAuthState, setLoading, setSigning, isAuthValid, isAuthenticated]
  );

  const forceReauth = useCallback(async () => {
    if (address) {
      authAttemptedRef.current = null;
      authInProgressRef.current = false;
      lastAutoReauthRef.current = Date.now();
      await authenticateWithWallet(address, true);
    }
  }, [address, authenticateWithWallet]);

  const openWalletModal = useCallback(async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const { address: addr } = await StellarWalletsKit.authModal();
    setAddress(addr);
    setIsConnected(true);
    setWalletState({ connected: true, account: addr });
    return addr;
  }, [setWalletState]);

  // Listen for 401s and react based on whether the JWT is actually expired.
  // - Fresh JWT + 401: server-side problem. Clear auth, show reconnect toast.
  //   DO NOT force a signature — that causes surprise sign prompts on every page nav.
  // - Expired JWT + 401: legitimate re-auth. Sign silently, throttled to 1/30s.
  useEffect(() => {
    const handler = (e: Event) => {
      if (!address) return;
      const detail = (e as CustomEvent<{ fresh: boolean; url: string } | undefined>).detail;
      const now = Date.now();

      if (detail?.fresh) {
        authLogout();
        authAttemptedRef.current = null;
        toast.error("Session issue. Please reconnect.", {
          action: {
            label: "Reconnect",
            onClick: () => {
              void forceReauth();
            },
          },
          duration: 8000,
        });
        return;
      }

      if (now - lastAutoReauthRef.current < AUTO_REAUTH_THROTTLE_MS) {
        return;
      }
      lastAutoReauthRef.current = now;
      authAttemptedRef.current = null;
      void authenticateWithWallet(address, true);
    };

    window.addEventListener("auth:session-invalid", handler);
    return () => window.removeEventListener("auth:session-invalid", handler);
  }, [address, authenticateWithWallet, authLogout, forceReauth]);

  // Connect via StellarWalletsKit built-in modal
  const connectWalletOnly = useCallback(async () => {
    try {
      await openWalletModal();
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      toast.error("Failed to connect wallet.", {
        description: parseSigningError(err),
      });
    }
  }, [openWalletModal]);

  const connect = useCallback(async () => {
    // Mark that the user explicitly wants the full sign-in flow. If the sign
    // step is interrupted (redirect-based wallet, popup-blocker, etc.) the
    // recovery effect below picks it up after the page settles.
    writeAuthIntent();
    try {
      const addr = await openWalletModal();
      await authenticateWithWallet(addr);
      clearAuthIntent();
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      toast.error("Failed to connect wallet.", {
        description: parseSigningError(err),
      });
      clearAuthIntent();
    }
  }, [authenticateWithWallet, openWalletModal]);

  // Recover auth when the wallet was connected via connect() but no valid JWT
  // exists. Only fires when the user explicitly intended to log in (intent
  // flag in sessionStorage), so plain wallet-only flows and persisted-wallet
  // page reloads don't surprise the user with a sign prompt.
  //
  // The bug this fixes: redirect-or-popup-based wallets (Albedo, web flows)
  // can complete the address-pick step (walletStore is `connected: true`)
  // but the subsequent sign popup inside connect()'s authenticateWithWallet
  // gets dropped — typically because the multi-await chain between the user
  // gesture and the sign popup loses the gesture context. The user ends up
  // with a connected wallet but no JWT, gets 401s on protected calls, and
  // only recovers via the 401-driven re-auth handler. With the intent flag
  // we can recover proactively.
  useEffect(() => {
    if (!kitReady) return;
    if (!address || !isConnected) return;
    if (authInProgressRef.current) return;
    if (autoAuthFiredForRef.current === address) return;
    if (isAuthValid(address)) {
      autoAuthFiredForRef.current = address;
      clearAuthIntent();
      return;
    }
    if (!readAuthIntent()) return;
    autoAuthFiredForRef.current = address;
    clearAuthIntent();
    void authenticateWithWallet(address);
  }, [kitReady, address, isConnected, isAuthValid, authenticateWithWallet]);

  const disconnect = useCallback(async () => {
    try {
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
      await StellarWalletsKit.disconnect();
    } catch {
      // ignore disconnect errors
    }
    setAddress(null);
    setIsConnected(false);
    resetWallet();
    authLogout();
    authAttemptedRef.current = null;
    authInProgressRef.current = false;
    autoAuthFiredForRef.current = null;
  }, [authLogout, resetWallet]);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!address) throw new Error("Wallet not connected");
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
      const { activeNetwork } = await import("@/shared/config/stellar");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        address,
        networkPassphrase: activeNetwork.networkPassphrase,
      });
      return signedTxXdr;
    },
    [address]
  );

  // Format display address: GABC...WXYZ
  const displayAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null;

  const value: WalletContextType = {
    isConnected,
    isAuthenticated,
    isAuthenticating: isAuthenticating || signing,
    address,
    displayAddress,
    user,
    connect,
    connectWalletOnly,
    disconnect,
    signTransaction,
    forceReauth,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
