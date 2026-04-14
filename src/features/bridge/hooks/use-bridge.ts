"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FeePaymentMethod, Messenger } from "@allbridge/bridge-core-sdk";
import type { ChainDetailsWithTokens } from "@allbridge/bridge-core-sdk";
import type {
  RawSorobanTransaction,
  RawEvmTransaction,
} from "@allbridge/bridge-core-sdk/dist/src/services/models";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { solana, solanaTestnet } from "@reown/appkit/networks";
import { useWallet } from "@/shared/context/wallet-context";
import { getBridgeSdk, getTokenFromChain } from "@/features/bridge/lib/sdk";

const EVM_CHAINS = new Set([
  "ethereum",
  "arbitrum",
  "base",
  "polygon",
  "optimism",
  "bsc",
  "avalanche",
]);

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_TESTNET === "true";
const SOLANA_NETWORK = isTestnet ? solanaTestnet : solana;

export interface BridgeQuote {
  amountOut: string;
  fee: string;
  feePercent: string;
  estimatedTime: string;
  error?: string;
}

export interface UseBridgeReturn {
  chains: ChainDetailsWithTokens[];
  sourceChain: string;
  destChain: string;
  token: string;
  amount: string;
  destAddress: string;
  quote: BridgeQuote | null;

  isLoadingChains: boolean;
  isLoadingQuote: boolean;
  isBridging: boolean;
  bridgeError: string | null;
  bridgeSuccess: string | null;

  stellarAddress: string | null;
  evmAddress: string | null;
  isEvmAvailable: boolean;
  sourceAddress: string;
  resolvedDestAddress: string;

  setSourceChain: (chain: string) => void;
  setDestChain: (chain: string) => void;
  setToken: (token: string) => void;
  setAmount: (amount: string) => void;
  setDestAddress: (address: string) => void;
  swapDirection: () => void;
  connectEvm: () => void;
  disconnectEvm: () => void;
  executeBridge: () => Promise<void>;
  isValid: boolean;
}

export function useBridge(): UseBridgeReturn {
  const { address: stellarAddress, signTransaction } = useWallet();

  // ── Wagmi / Reown wallet state ────────────────────────────────────
  const { address: evmAddressRaw, isConnected: isEvmConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const { open: openReownModal } = useAppKit();
  // useAppKitAccount covers both EVM (wagmi) and Solana adapters
  const { address: reownAddress, isConnected: isReownConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();

  const evmAddress = isEvmConnected && evmAddressRaw ? evmAddressRaw : null;
  // Solana address comes from reownAddress when connected via Solana adapter
  const solanaAddress =
    isReownConnected && !isEvmConnected && reownAddress ? reownAddress : null;

  // ── Bridge state ──────────────────────────────────────────────────
  const [chainsMap, setChainsMap] = useState<Record<string, ChainDetailsWithTokens>>({});
  const [isLoadingChains, setIsLoadingChains] = useState(true);

  const [sourceChain, setSourceChain] = useState("stellar");
  const [destChain, setDestChain] = useState("ethereum");
  const [token, setToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [destAddress, setDestAddress] = useState("");

  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeSuccess, setBridgeSuccess] = useState<string | null>(null);

  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load chains from Allbridge SDK on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoadingChains(true);

    getBridgeSdk()
      .chainDetailsMap()
      .then((map) => {
        if (!cancelled) setChainsMap(map as Record<string, ChainDetailsWithTokens>);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingChains(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced quote from SDK
  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    setQuote(null);

    const numAmount = Number.parseFloat(amount);
    if (
      !sourceChain ||
      !destChain ||
      !token ||
      !amount ||
      Number.isNaN(numAmount) ||
      numAmount <= 0 ||
      !Object.keys(chainsMap).length
    ) {
      return;
    }

    setIsLoadingQuote(true);

    quoteTimerRef.current = setTimeout(async () => {
      try {
        const sdk = getBridgeSdk();
        const srcToken = getTokenFromChain(chainsMap, sourceChain, token);
        const dstToken = getTokenFromChain(chainsMap, destChain, token);

        if (!srcToken || !dstToken) {
          setQuote({
            amountOut: "0",
            fee: "0",
            feePercent: "N/A",
            estimatedTime: "N/A",
            error: `Token ${token} not available on selected chains`,
          });
          return;
        }

        const [amountOut, gasFeeOptions, transferTime] = await Promise.all([
          sdk.getAmountToBeReceived(amount, srcToken, dstToken, Messenger.ALLBRIDGE),
          sdk.getGasFeeOptions(srcToken, dstToken, Messenger.ALLBRIDGE),
          sdk.getAverageTransferTime(srcToken, dstToken, Messenger.ALLBRIDGE),
        ]);

        const nativeFee =
          gasFeeOptions?.[FeePaymentMethod.WITH_NATIVE_CURRENCY]?.float ?? "0";
        const bridgeFee = (Number.parseFloat(amount) - Number.parseFloat(amountOut)).toFixed(6);
        const feePercent =
          ((Number.parseFloat(bridgeFee) / Number.parseFloat(amount)) * 100).toFixed(2) + "%";
        const estimatedTime = transferTime
          ? `${Math.round(transferTime / 60000)} min`
          : "3-5 min";

        setQuote({
          amountOut,
          fee: nativeFee !== "0" ? `${bridgeFee} + ${nativeFee} native` : bridgeFee,
          feePercent,
          estimatedTime,
        });
      } catch (err) {
        setQuote({
          amountOut: "0",
          fee: "0",
          feePercent: "N/A",
          estimatedTime: "N/A",
          error: err instanceof Error ? err.message : "Failed to get quote",
        });
      } finally {
        setIsLoadingQuote(false);
      }
    }, 800);

    return () => {
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    };
  }, [amount, sourceChain, destChain, token, chainsMap]);

  // Derived addresses
  const sourceAddress =
    sourceChain === "stellar"
      ? (stellarAddress ?? "")
      : EVM_CHAINS.has(sourceChain)
        ? (evmAddress ?? "")
        : sourceChain === "solana"
          ? (solanaAddress ?? "")
          : "";

  const resolvedDestAddress =
    destChain === "stellar"
      ? (stellarAddress ?? "")
      : EVM_CHAINS.has(destChain)
        ? destAddress || evmAddress || ""
        : destChain === "solana"
          ? destAddress || solanaAddress || ""
          : destAddress;

  const isValid =
    !!sourceChain &&
    !!destChain &&
    sourceChain !== destChain &&
    !!token &&
    Number.parseFloat(amount) > 0 &&
    !!sourceAddress &&
    !!resolvedDestAddress;

  const swapDirection = useCallback(() => {
    const prev = sourceChain;
    setSourceChain(destChain);
    setDestChain(prev);
    setBridgeError(null);
    setBridgeSuccess(null);
  }, [sourceChain, destChain]);

  // Open Reown AppKit modal — switch to correct network context first
  const connectEvm = useCallback(async () => {
    if (sourceChain === "solana") {
      // Switch Reown context to Solana so modal shows Solana wallets
      await switchNetwork(SOLANA_NETWORK);
    }
    openReownModal({ view: "Connect" });
  }, [openReownModal, switchNetwork, sourceChain]);

  const disconnectEvm = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const executeBridge = useCallback(async () => {
    if (!isValid) return;

    setIsBridging(true);
    setBridgeError(null);
    setBridgeSuccess(null);

    try {
      const sdk = getBridgeSdk();
      const srcToken = getTokenFromChain(chainsMap, sourceChain, token);
      const dstToken = getTokenFromChain(chainsMap, destChain, token);

      if (!srcToken || !dstToken) {
        throw new Error("Token not found for selected chains");
      }

      const sendParams = {
        amount,
        fromAccountAddress: sourceAddress,
        toAccountAddress: resolvedDestAddress,
        sourceToken: srcToken,
        destinationToken: dstToken,
        messenger: Messenger.ALLBRIDGE,
      };

      if (sourceChain === "stellar") {
        // ── Stellar ───────────────────────────────────────────────
        const rawXdr = (await sdk.bridge.rawTxBuilder.send(sendParams)) as RawSorobanTransaction;
        const signedXdr = await signTransaction(rawXdr);
        const txRes = await sdk.utils.srb.sendTransactionSoroban(signedXdr);

        if (txRes.status !== "PENDING" && txRes.status !== "DUPLICATE") {
          throw new Error(`Transaction failed: ${txRes.status}`);
        }
        setBridgeSuccess(`Transaction submitted! Hash: ${txRes.hash}`);
      } else if (EVM_CHAINS.has(sourceChain)) {
        // ── EVM via wagmi walletClient ────────────────────────────
        if (!walletClient) throw new Error("EVM wallet not connected");

        // Build raw TX using web3 backed by the wagmi wallet transport
        const { Web3 } = await import("web3");
        // walletClient.transport is EIP-1193 compatible
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const web3 = new Web3(walletClient.transport as any);

        const rawTx = (await sdk.bridge.rawTxBuilder.send(
          sendParams,
          web3,
        )) as RawEvmTransaction;

        // Send via viem walletClient for proper UX (shows wallet name, etc.)
        const txHash = await walletClient.sendTransaction({
          account: sourceAddress as `0x${string}`,
          to: rawTx.to as `0x${string}`,
          data: rawTx.data as `0x${string}`,
          value: rawTx.value ? BigInt(rawTx.value as string) : 0n,
          chain: walletClient.chain,
        });

        setBridgeSuccess(`Transaction sent! Hash: ${txHash}`);
      } else if (sourceChain === "solana") {
        // ── Solana via window.solana (Phantom / Backpack / etc.) ──
        if (!solanaAddress) throw new Error("Solana wallet not connected");

        type SolanaProvider = {
          signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
        };
        const provider = (window as unknown as { solana?: SolanaProvider }).solana;
        if (!provider) throw new Error("Solana wallet provider not found");

        // Build raw VersionedTransaction (no extra provider needed for Solana)
        const rawTx = await sdk.bridge.rawTxBuilder.send(sendParams);

        const { signature } = await provider.signAndSendTransaction(rawTx);
        setBridgeSuccess(`Transaction sent! Signature: ${signature}`);
      } else {
        throw new Error(`Chain "${sourceChain}" is not yet supported`);
      }
    } catch (err) {
      setBridgeError(err instanceof Error ? err.message : "Bridge transaction failed");
    } finally {
      setIsBridging(false);
    }
  }, [
    isValid,
    sourceChain,
    destChain,
    token,
    amount,
    sourceAddress,
    resolvedDestAddress,
    chainsMap,
    signTransaction,
    walletClient,
    solanaAddress,
  ]);

  return {
    chains: Object.values(chainsMap),
    sourceChain,
    destChain,
    token,
    amount,
    destAddress,
    quote,
    isLoadingChains,
    isLoadingQuote,
    isBridging,
    bridgeError,
    bridgeSuccess,
    stellarAddress: stellarAddress ?? null,
    evmAddress,
    isEvmAvailable: true, // Reown supports all wallets
    sourceAddress,
    resolvedDestAddress,
    setSourceChain,
    setDestChain,
    setToken,
    setAmount,
    setDestAddress,
    swapDirection,
    connectEvm,
    disconnectEvm,
    executeBridge,
    isValid,
  };
}
