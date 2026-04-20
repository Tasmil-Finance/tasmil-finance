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

// Throttle for auto-reauth triggered by 401 events. Prevents sign-prompt storms.
const AUTO_REAUTH_THROTTLE_MS = 30_000;

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

        const requestChallenge = async (publicKey: string) => {
          const res = await fetch(`${API_BASE}/auth/challenge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicKey }),
          });
          if (!res.ok) {
            throw new Error("Failed to get auth challenge");
          }
          const { data } = await res.json();
          return data as { challenge: string; message?: string; expiresAt: number };
        };

        // Step 2: Get current network passphrase for wallet signing
        const { Networks } = await import("@stellar/stellar-sdk");
        const network =
          (process.env["NEXT_PUBLIC_STELLAR_NETWORK"] as string) === "PUBLIC"
            ? Networks.PUBLIC
            : Networks.TESTNET;

        // Step 3: Sign with wallet
        if (!isForced) {
          toast.info("Sign to verify your wallet. This is free — no XLM is charged.", {
            duration: 4000,
          });
        }
        setSigning(true);
        await checkWalletNetwork();
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");

        const withReconnect = async <T,>(
          signFn: (signerAddress: string) => Promise<T>,
        ): Promise<{ value: T; signerAddress: string }> => {
          try {
            const value = await signFn(walletAddress);
            return { value, signerAddress: walletAddress };
          } catch (error) {
            const rawMessage = error instanceof Error ? error.message : String(error);
            const needsReconnect =
              rawMessage.toLowerCase().includes("not currently connected to freighter") ||
              rawMessage.toLowerCase().includes("not connected to freighter");

            if (!needsReconnect) throw error;

            toast.info("Wallet permission expired. Please reconnect to continue.");
            const { address: reconnectedAddress } = await StellarWalletsKit.authModal();

            if (!reconnectedAddress) {
              throw new Error("Wallet reconnection was cancelled.");
            }

            setAddress(reconnectedAddress);
            setIsConnected(true);
            setWalletState({ connected: true, account: reconnectedAddress });

            await checkWalletNetwork();
            const value = await signFn(reconnectedAddress);
            return { value, signerAddress: reconnectedAddress };
          }
        };

        type SignedAuthResult = {
          signed: string;
          signerAddress: string;
        };

        const isMessageSigningUnsupported = (error: unknown): boolean => {
          const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
          return (
            msg.includes('does not support the "signmessage" function') ||
            (msg.includes("signmessage") && msg.includes("not support")) ||
            (msg.includes("signmessage") && msg.includes("not a function"))
          );
        };

        const signAuthMessage = async (
          signerAddress: string,
          activeChallenge: { challenge: string; message?: string }
        ): Promise<SignedAuthResult> => {
          try {
            StellarWalletsKit.setWallet(signerAddress);
          } catch {
            // ignore
          }

          const authMessage =
            typeof activeChallenge.message === "string" && activeChallenge.message.trim().length > 0
              ? activeChallenge.message
              : activeChallenge.challenge;

          const signingResult = await StellarWalletsKit.signMessage(authMessage, {
            address: signerAddress,
            networkPassphrase: network,
          });

          const signed =
            typeof signingResult === "string" ? signingResult : signingResult?.signedMessage;
          const actualSignerAddress =
            (typeof signingResult === "object" && signingResult?.signerAddress) || signerAddress;

          if (!signed || typeof signed !== "string") {
            throw new Error("Wallet returned an invalid signed message");
          }

          return {
            signed,
            signerAddress: actualSignerAddress,
          };
        };

        let verifyPublicKey = walletAddress;
        let verifyPayload: { publicKey: string; signedMessage?: string };
        let activeChallengeData = challengeData;

        try {
          let signedMessageResult = await withReconnect((signerAddress) =>
            signAuthMessage(signerAddress, activeChallengeData)
          );

          const initialSignerAddress = signedMessageResult.value.signerAddress;
          if (initialSignerAddress !== verifyPublicKey) {
            verifyPublicKey = initialSignerAddress;
            activeChallengeData = await requestChallenge(verifyPublicKey);
            signedMessageResult = await withReconnect((signerAddress) =>
              signAuthMessage(signerAddress, activeChallengeData)
            );

            if (signedMessageResult.value.signerAddress !== verifyPublicKey) {
              throw new Error("Wallet account changed during signing. Please reconnect and try again.");
            }
          }

          verifyPublicKey = signedMessageResult.value.signerAddress;
          verifyPayload = {
            publicKey: verifyPublicKey,
            signedMessage: signedMessageResult.value.signed,
          };
        } catch (error) {
          if (isMessageSigningUnsupported(error)) {
            throw new Error("This wallet does not support fee-free message signing. Please use Freighter or another compatible wallet.");
          }
          throw error;
        }

        // Step 4: Verify signature and get JWT
        setSigning(false);

        const extractBackendMessage = async (res: Response): Promise<string> => {
          let backendMessage = "Authentication verification failed";
          try {
            const errorJson = await res.json();
            const message =
              errorJson?.message || errorJson?.error || errorJson?.data?.message || undefined;
            if (typeof message === "string" && message.trim().length > 0) {
              backendMessage = message;
            }
          } catch {
            // ignore
          }
          return backendMessage;
        };

        const verifyWithPayload = async (payload: { publicKey: string; signedMessage?: string }) =>
          fetch(`${API_BASE}/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

        let response = await verifyWithPayload(verifyPayload);
        if (!response.ok) {
          let backendMessage = await extractBackendMessage(response);

          const shouldFallbackToTx =
            !!verifyPayload.signedMessage &&
            /invalid message signature|signed message payload mismatch|unsupported signed message format|missing signature value/i.test(
              backendMessage
            );

          if (shouldFallbackToTx) {
            activeChallengeData = await requestChallenge(verifyPublicKey);
            const signedMessageRetry = await withReconnect((signerAddress) =>
              signAuthMessage(signerAddress, activeChallengeData)
            );

            if (signedMessageRetry.value.signerAddress !== verifyPublicKey) {
              verifyPublicKey = signedMessageRetry.value.signerAddress;
              activeChallengeData = await requestChallenge(verifyPublicKey);
              const signedMessageRetryWithCorrectSigner = await withReconnect((signerAddress) =>
                signAuthMessage(signerAddress, activeChallengeData)
              );

              if (signedMessageRetryWithCorrectSigner.value.signerAddress !== verifyPublicKey) {
                throw new Error("Wallet account changed during signing. Please reconnect and try again.");
              }

              verifyPayload = {
                publicKey: verifyPublicKey,
                signedMessage: signedMessageRetryWithCorrectSigner.value.signed,
              };
            } else {
              verifyPayload = {
                publicKey: verifyPublicKey,
                signedMessage: signedMessageRetry.value.signed,
              };
            }

            response = await verifyWithPayload(verifyPayload);
            if (!response.ok) {
              backendMessage = await extractBackendMessage(response);
              throw new Error(backendMessage);
            }
          } else {
            throw new Error(backendMessage);
          }
        }
        const result = await response.json();
        const { accessToken, user: userData } = result.data;

        setAuthState({
          accessToken,
          user: {
            id: userData.id || `user_${verifyPublicKey.slice(0, 8)}`,
            walletAddress: verifyPublicKey,
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
    [setAuthState, setLoading, setSigning, setWalletState, isAuthValid, isAuthenticated]
  );

  const forceReauth = useCallback(async () => {
    if (address) {
      authAttemptedRef.current = null;
      authInProgressRef.current = false;
      lastAutoReauthRef.current = Date.now();
      await authenticateWithWallet(address, true);
    }
  }, [address, authenticateWithWallet]);

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
      const networkPassphrase =
        process.env["NEXT_PUBLIC_STELLAR_PASSPHRASE"] ?? "Test SDF Network ; September 2015";

      const signWithAddress = async (signerAddress: string) => {
        try {
          StellarWalletsKit.setWallet(signerAddress);
        } catch {
          // ignore
        }

        const result = await StellarWalletsKit.signTransaction(xdr, {
          address: signerAddress,
          networkPassphrase,
        });

        const signedXdr = result?.signedTxXdr;
        if (!signedXdr || typeof signedXdr !== "string") {
          throw new Error("Invalid signed transaction returned by wallet");
        }
        return signedXdr;
      };

      setSigning(true);
      try {
        await checkWalletNetwork();
        return await signWithAddress(address);
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : String(error);
        const needsReconnect =
          rawMessage.toLowerCase().includes("not currently connected to freighter") ||
          rawMessage.toLowerCase().includes("not connected to freighter");

        if (needsReconnect) {
          toast.info("Wallet permission expired. Please reconnect to continue signing.");
          const { address: reconnectedAddress } = await StellarWalletsKit.authModal();

          if (!reconnectedAddress) {
            throw new Error("Wallet reconnection was cancelled.");
          }

          if (reconnectedAddress !== address) {
            setAddress(reconnectedAddress);
            setIsConnected(true);
            setWalletState({ connected: true, account: reconnectedAddress });
          }

          await checkWalletNetwork();
          return await signWithAddress(reconnectedAddress);
        }

        throw new Error(parseSigningError(error));
      } finally {
        setSigning(false);
      }
    },
    [address, setSigning, setWalletState]
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
