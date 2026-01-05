"use client";

import type React from "react";
import { createContext, useContext, useEffect, useCallback, useRef } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWalletStore } from "@/store/use-wallet";
import { useAuthStore, type AuthUser } from "@/store/use-auth";
import { toast } from "sonner";

interface WalletContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  address: string | null;
  displayAddress: string | null;
  user: AuthUser | null;
  connect: () => void;
  disconnect: () => void;
  forceReauth: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
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

  // Mock authentication function (replace with your actual API calls)
  const authenticateWithWallet = useCallback(
    async (walletAddress: string, forceReauth = false) => {
      // Prevent if authentication is already in progress
      if (authInProgressRef.current) {
        return;
      }

      // Skip if already authenticated with this address
      if (!forceReauth && authAttemptedRef.current === walletAddress) {
        return;
      }

      authAttemptedRef.current = walletAddress;
      authInProgressRef.current = true;
      setLoading(true);

      try {
        // Step 1: Get nonce (mock implementation)
        setSigning(false);
        const nonce = Math.random().toString(36).substring(7);
        const message = `Tasmil Finance Login Nonce: ${nonce}`;

        // Step 2: Sign the message
        setSigning(true);
        const _signature = await signMessageAsync({ message });

        // Step 3: Mock authentication (replace with actual API call)
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

        // Step 4: Mock successful response
        const mockUser: AuthUser = {
          id: `user_${walletAddress.slice(0, 8)}`,
          walletAddress,
          type: "regular",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const mockToken = `mock_token_${Date.now()}`;

        // Step 5: Update auth state
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

        // Handle user rejection (silent)
        if (
          error instanceof Error &&
          (error.message.includes("User rejected") ||
            error.message.includes("user rejected") ||
            error.message.includes("User denied"))
        ) {
          return;
        }

        // Show error for unexpected failures
        const errorMessage =
          error instanceof Error ? error.message : "Authentication failed. Please try again.";
        toast.error(errorMessage);
      }
    },
    [signMessageAsync, setAuthState, setLoading, setSigning]
  );

  // Handle wallet connection changes
  useEffect(() => {
    const currentState = useWalletStore.getState();
    if (currentState.connected !== isConnected || currentState.account !== (address ?? null)) {
      setWalletState({
        connected: isConnected,
        account: address ?? null,
      });
    }

    // If wallet is connected, authenticate
    if (isConnected && address) {
      authenticateWithWallet(address);
    } else if (!isConnected) {
      // Wallet disconnected - clear auth attempt tracking
      authAttemptedRef.current = null;
      authInProgressRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]); // Chỉ phụ thuộc vào isConnected và address

  const connect = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    authLogout();
    resetWallet();
    authAttemptedRef.current = null;
    authInProgressRef.current = false;
  }, [wagmiDisconnect, authLogout, resetWallet]);

  const forceReauth = useCallback(async () => {
    if (address) {
      authAttemptedRef.current = null;
      authInProgressRef.current = false;
      await authenticateWithWallet(address, true);
    }
  }, [address, authenticateWithWallet]);

  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const value: WalletContextType = {
    isConnected,
    isAuthenticated,
    isAuthenticating: isAuthenticating || signing,
    address: address ?? null,
    displayAddress,
    user,
    connect,
    disconnect,
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
