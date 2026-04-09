"use client";

import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type AuthUser, useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";

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
        const { StellarWalletsKit } = await import(
          "@creit.tech/stellar-wallets-kit/sdk"
        );
        const { defaultModules } = await import(
          "@creit.tech/stellar-wallets-kit/modules/utils"
        );
        const { Networks, KitEventType } = await import(
          "@creit.tech/stellar-wallets-kit/types"
        );

        const network =
          (process.env["NEXT_PUBLIC_STELLAR_NETWORK"] as string) === "PUBLIC"
            ? Networks.PUBLIC
            : Networks.TESTNET;

        StellarWalletsKit.init({
          network,
          modules: defaultModules(),
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
  }, []);

  // Auto-restore session after kit is ready
  useEffect(() => {
    if (!kitReady) return;

    const walletState = useWalletStore.getState();
    if (!walletState.connected || !walletState.account) return;

    (async () => {
      try {
        const { StellarWalletsKit } = await import(
          "@creit.tech/stellar-wallets-kit/sdk"
        );
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
  }, [kitReady]);

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
        setSigning(false);

        // Mock authentication (replace with actual API call)
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockUser: AuthUser = {
          id: `user_${walletAddress.slice(0, 8)}`,
          walletAddress,
          type: "regular",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const mockToken = `mock_token_${Date.now()}`;

        setAuthState({
          accessToken: mockToken,
          user: mockUser,
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

        const errorMessage =
          error instanceof Error ? error.message : "Authentication failed. Please try again.";
        toast.error(errorMessage);
      }
    },
    [setAuthState, setLoading, setSigning, isAuthValid, isAuthenticated]
  );

  // Connect via StellarWalletsKit built-in modal
  const connect = useCallback(async () => {
    try {
      const { StellarWalletsKit } = await import(
        "@creit.tech/stellar-wallets-kit/sdk"
      );
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
      const { StellarWalletsKit } = await import(
        "@creit.tech/stellar-wallets-kit/sdk"
      );
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
      const { StellarWalletsKit } = await import(
        "@creit.tech/stellar-wallets-kit/sdk"
      );
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
