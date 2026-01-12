"use client";

import { useState } from "react";
import { useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BaseError, formatEther } from "viem";
import type { Address } from "viem";
import { waitForTransactionReceipt } from "@/shared/utils/waitForTransactionReceipt";

// SFC Contract Address on U2U Network
const SFC_CONTRACT_ADDRESS = "0xfc00face00000000000000000000000000000000";

// SFC ABI (minimal for staking operations)
const SFC_ABI = [
  {
    type: "function",
    name: "delegate",
    inputs: [{ name: "toValidatorID", type: "uint256" }],
    stateMutability: "payable",
    outputs: [],
  },
  {
    type: "function",
    name: "undelegate",
    inputs: [
      { name: "toValidatorID", type: "uint256" },
      { name: "wrID", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    outputs: [],
  },
  {
    type: "function",
    name: "claimRewards",
    inputs: [{ name: "toValidatorID", type: "uint256" }],
    stateMutability: "nonpayable",
    outputs: [],
  },
  {
    type: "function",
    name: "restakeRewards",
    inputs: [{ name: "toValidatorID", type: "uint256" }],
    stateMutability: "nonpayable",
    outputs: [],
  },
  {
    type: "function",
    name: "lockStake",
    inputs: [
      { name: "toValidatorID", type: "uint256" },
      { name: "lockupDuration", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    outputs: [],
  },
] as const;

/**
 * Get SFC contract configuration
 */
function getSFCContract(chainId: number) {
  return {
    address: SFC_CONTRACT_ADDRESS as Address,
    abi: SFC_ABI,
    chainId: chainId,
  };
}

/**
 * Format wei to U2U with proper decimals
 */
export function formatU2U(weiAmount: string | bigint): string {
  try {
    const wei = typeof weiAmount === "string" ? BigInt(weiAmount) : weiAmount;
    return formatEther(wei);
  } catch {
    return "0";
  }
}

/**
 * Hook for delegate/stake U2U tokens
 */
export const useDelegateStake = () => {
  const chainId = useChainId();
  const contract = getSFCContract(chainId);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const {
    data: hash,
    isPending,
    error: executeError,
    isError: isExecuteError,
    writeContractAsync,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    error: callError,
    isError: isCallError,
  } = useWaitForTransactionReceipt({ hash });

  const delegateStake = async (validatorID: number, amountWei: string) => {
    setIsConfirmed(false);

    try {
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "delegate",
        args: [BigInt(validatorID)],
        value: BigInt(amountWei),
      });

      const { isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);

      return { hash: txHash, isConfirmed: confirmed };
    } catch (error) {
      console.error("Delegate stake error:", error);
      throw error;
    }
  };

  const error = callError || executeError;
  return {
    isConfirmed,
    delegateStake,
    isPending: isConfirming || isPending,
    hash,
    errorMessage: (error as BaseError)?.shortMessage || error?.message || "Unknown error",
    isError: isCallError || isExecuteError,
  };
};

/**
 * Hook for undelegate/unstake U2U tokens
 */
export const useUndelegateStake = () => {
  const chainId = useChainId();
  const contract = getSFCContract(chainId);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const {
    data: hash,
    isPending,
    error: executeError,
    isError: isExecuteError,
    writeContractAsync,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    error: callError,
    isError: isCallError,
  } = useWaitForTransactionReceipt({ hash });

  const undelegateStake = async (validatorID: number, wrID: number, amountWei: string) => {
    setIsConfirmed(false);

    try {
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "undelegate",
        args: [BigInt(validatorID), BigInt(wrID), BigInt(amountWei)],
      });

      const { isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);

      return { hash: txHash, isConfirmed: confirmed };
    } catch (error) {
      console.error("Undelegate stake error:", error);
      throw error;
    }
  };

  const error = callError || executeError;
  return {
    isConfirmed,
    undelegateStake,
    isPending: isConfirming || isPending,
    hash,
    errorMessage: (error as BaseError)?.shortMessage || error?.message || "Unknown error",
    isError: isCallError || isExecuteError,
  };
};

/**
 * Hook for claim rewards
 */
export const useClaimRewards = () => {
  const chainId = useChainId();
  const contract = getSFCContract(chainId);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const {
    data: hash,
    isPending,
    error: executeError,
    isError: isExecuteError,
    writeContractAsync,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    error: callError,
    isError: isCallError,
  } = useWaitForTransactionReceipt({ hash });

  const claimRewards = async (validatorID: number) => {
    setIsConfirmed(false);

    try {
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "claimRewards",
        args: [BigInt(validatorID)],
      });

      const { isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);

      return { hash: txHash, isConfirmed: confirmed };
    } catch (error) {
      console.error("Claim rewards error:", error);
      throw error;
    }
  };

  const error = callError || executeError;
  return {
    isConfirmed,
    claimRewards,
    isPending: isConfirming || isPending,
    hash,
    errorMessage: (error as BaseError)?.shortMessage || error?.message || "Unknown error",
    isError: isCallError || isExecuteError,
  };
};

/**
 * Hook for restake rewards (compound)
 */
export const useRestakeRewards = () => {
  const chainId = useChainId();
  const contract = getSFCContract(chainId);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const {
    data: hash,
    isPending,
    error: executeError,
    isError: isExecuteError,
    writeContractAsync,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    error: callError,
    isError: isCallError,
  } = useWaitForTransactionReceipt({ hash });

  const restakeRewards = async (validatorID: number) => {
    setIsConfirmed(false);

    try {
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "restakeRewards",
        args: [BigInt(validatorID)],
      });

      const { isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);

      return { hash: txHash, isConfirmed: confirmed };
    } catch (error) {
      console.error("Restake rewards error:", error);
      throw error;
    }
  };

  const error = callError || executeError;
  return {
    isConfirmed,
    restakeRewards,
    isPending: isConfirming || isPending,
    hash,
    errorMessage: (error as BaseError)?.shortMessage || error?.message || "Unknown error",
    isError: isCallError || isExecuteError,
  };
};

/**
 * Hook for lock stake
 */
export const useLockStake = () => {
  const chainId = useChainId();
  const contract = getSFCContract(chainId);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const {
    data: hash,
    isPending,
    error: executeError,
    isError: isExecuteError,
    writeContractAsync,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    error: callError,
    isError: isCallError,
  } = useWaitForTransactionReceipt({ hash });

  const lockStake = async (validatorID: number, lockupDuration: number, amountWei: string) => {
    setIsConfirmed(false);

    try {
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "lockStake",
        args: [BigInt(validatorID), BigInt(lockupDuration), BigInt(amountWei)],
      });

      const { isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);

      return { hash: txHash, isConfirmed: confirmed };
    } catch (error) {
      console.error("Lock stake error:", error);
      throw error;
    }
  };

  const error = callError || executeError;
  return {
    isConfirmed,
    lockStake,
    isPending: isConfirming || isPending,
    hash,
    errorMessage: (error as BaseError)?.shortMessage || error?.message || "Unknown error",
    isError: isCallError || isExecuteError,
  };
};
