"use client";

import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type AuthUser, useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";

interface WalletContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  address: string | null;
  displayAddress: string | null;
  user: AuthUser | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  forceReauth: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

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

  // Initialize StellarWalletsKit on mount (client-side only)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
        const { Networks, KitEventType } = await import("@creit.tech/stellar-wallets-kit/types");

        const network =
          (process.env["NEXT_PUBLIC_STELLAR_NETWORK"] as string) === "PUBLIC"
            ? Networks.PUBLIC
            : Networks.TESTNET;

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
          "font-family": "Outfit, sans-serif",
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
          "font-family": "Outfit, sans-serif",
        };

        StellarWalletsKit.init({
          network,
          modules: defaultModules(),
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
          await authenticateWithWallet(addr);
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
    async (walletAddress: string, forceReauth = false) => {
      if (authInProgressRef.current) {
        return;
      }

      if (!forceReauth) {
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
        // Auth endpoints live on the NestJS backend, not the AI server
        const API_BASE =
          process.env["NEXT_PUBLIC_BACKEND_URL"]
            ? `${process.env["NEXT_PUBLIC_BACKEND_URL"]}/api`
            : "http://localhost:6756/api";

        // Step 1: Request a challenge nonce from the server
        const challengeRes = await fetch(`${API_BASE}/auth/challenge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey: walletAddress }),
        });
        if (!challengeRes.ok) {
          throw new Error("Failed to get auth challenge");
        }
        const { data: challengeData } = await challengeRes.json();

        // Step 2: Build a TX for the user to sign (proves private key ownership)
        const { TransactionBuilder, Operation, Account, Networks } = await import(
          "@stellar/stellar-sdk"
        );
        const network =
          (process.env["NEXT_PUBLIC_STELLAR_NETWORK"] as string) === "PUBLIC"
            ? Networks.PUBLIC
            : Networks.TESTNET;
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
        setSigning(true);
        await checkWalletNetwork();
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
          address: walletAddress,
          networkPassphrase: network,
        });

        // Step 4: Verify signature and get JWT
        setSigning(false);
        const response = await fetch(`${API_BASE}/auth/verify`, {
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

  // Listen for auth token expiration and trigger re-authentication
  useEffect(() => {
    const handler = () => {
      if (address) {
        authAttemptedRef.current = null;
        authenticateWithWallet(address, true);
      }
    };
    window.addEventListener("auth-token-expired", handler);
    return () => window.removeEventListener("auth-token-expired", handler);
  }, [address, authenticateWithWallet]);

  // Connect via StellarWalletsKit built-in modal
  const connect = useCallback(async () => {
    try {
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
      const { address: addr } = await StellarWalletsKit.authModal();
      setAddress(addr);
      setIsConnected(true);
      setWalletState({ connected: true, account: addr });
      await authenticateWithWallet(addr);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      toast.error("Failed to connect wallet.");
    }
  }, [setWalletState, authenticateWithWallet]);

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
  }, [authLogout, resetWallet]);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!address) throw new Error("Wallet not connected");
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        address,
      });
      return signedTxXdr;
    },
    [address]
  );

  const forceReauth = useCallback(async () => {
    if (address) {
      authAttemptedRef.current = null;
      authInProgressRef.current = false;
      await authenticateWithWallet(address, true);
    }
  }, [address, authenticateWithWallet]);

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
