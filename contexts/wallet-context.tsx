"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWalletStore } from "@/store/use-wallet";
import { useAuthStore } from "@/store/use-auth";
import { toast } from "sonner";
import { authControllerGetWalletNonce, authControllerWalletLogin } from "@/gen/client";
import { withAuth } from "@/lib/kubb-config";

interface WalletContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  address: string | null;
  displayAddress: string | null;
  user: ReturnType<typeof useAuthStore>["user"];
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

  // Perform authentication with wallet
  const authenticateWithWallet = useCallback(
    async (walletAddress: string) => {
      // Prevent duplicate auth attempts
      if (authAttemptedRef.current === walletAddress) {
        return;
      }

      // Prevent if authentication is already in progress
      if (authInProgressRef.current) {
        return;
      }

      // Skip if already authenticated with this address
      if (isAuthenticated && user?.walletAddress?.toLowerCase() === walletAddress.toLowerCase()) {
        return;
      }

      authAttemptedRef.current = walletAddress;
      authInProgressRef.current = true;
      setLoading(true);

      try {
        // Step 1: Get nonce from backend
        setSigning(false);
        const nonceResponse = await authControllerGetWalletNonce(
          { walletAddress },
          withAuth
        );
        const { nonce, message } = nonceResponse as { nonce: string; message?: string };

        // Step 2: Sign the message
        setSigning(true);
        const signature = await signMessageAsync({ 
          message: message || `Tasmil Login Nonce: ${nonce}` 
        });

        // Step 3: Send signature to backend for verification
        const loginResponse = await authControllerWalletLogin(
          { walletAddress, signature },
          withAuth
        ) as { access_token: string; user: unknown };

        // Step 4: Update auth state
        setAuthState({
          accessToken: loginResponse.access_token,
          user: loginResponse.user,
        });

        toast.success("Wallet verified successfully!");
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
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Authentication failed. Please try again.";
        toast.error(errorMessage);
      }
    },
    [signMessageAsync, setAuthState, setLoading, setSigning, isAuthenticated, user]
  );

  // Handle wallet connection changes
  useEffect(() => {
    const currentState = useWalletStore.getState();
    if (
      currentState.connected !== isConnected ||
      currentState.account !== (address ?? null)
    ) {
      setWalletState({
        connected: isConnected,
        account: address ?? null,
      });
    }

    // If wallet is connected, authenticate
    if (isConnected && address) {
      // Check if already authenticated with this address
      if (isAuthenticated && user?.walletAddress?.toLowerCase() === address.toLowerCase()) {
        authAttemptedRef.current = address;
        return;
      }

      // Authenticate with wallet
      authenticateWithWallet(address);
    } else if (!isConnected) {
      // Wallet disconnected
      authAttemptedRef.current = null;
    }
  }, [isConnected, address, isAuthenticated, user, authenticateWithWallet, setWalletState]);

  const connect = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    authLogout();
    resetWallet();
    authAttemptedRef.current = null;
  }, [wagmiDisconnect, authLogout, resetWallet]);

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const value: WalletContextType = {
    isConnected,
    isAuthenticated,
    isAuthenticating: isAuthenticating || signing,
    address: address ?? null,
    displayAddress,
    user,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

