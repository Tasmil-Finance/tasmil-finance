"use client";

import { useState } from "react";
import { useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BaseError, parseEther } from "viem";
import type { Address } from "viem";
import SFC_ABI from "@/config/contracts/abi/SFC-json.json";
import { waitForTransactionReceipt } from "@/utils/waitForTransactionReceipt";

// SFC Contract Address on U2U Network
const SFC_CONTRACT_ADDRESS = "0xfc00face00000000000000000000000000000000";

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
  } = useWaitForTransactionReceipt({
    hash,
  });

  const delegateStake = async (validatorID: number, amount: string) => {
    setIsConfirmed(false);
    
    try {
      const amountInWei = parseEther(amount);
      
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "delegate",
        args: [BigInt(validatorID)],
        value: amountInWei,
      });
      
      const { receipt, isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);
      
      return {
        receipt,
        isConfirmed: confirmed,
        hash: txHash,
      };
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
    errorMessage:
      (error as BaseError)?.shortMessage || error?.message || "Unknown error",
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
  } = useWaitForTransactionReceipt({
    hash,
  });

  const undelegateStake = async (validatorID: number, wrID: number, amount: string) => {
    setIsConfirmed(false);
    
    try {
      const amountInWei = parseEther(amount);
      
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "undelegate",
        args: [BigInt(validatorID), BigInt(wrID), amountInWei],
      });
      
      const { receipt, isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);
      
      return {
        receipt,
        isConfirmed: confirmed,
        hash: txHash,
      };
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
    errorMessage:
      (error as BaseError)?.shortMessage || error?.message || "Unknown error",
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
  } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = async (validatorID: number) => {
    setIsConfirmed(false);
    
    try {
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "claimRewards",
        args: [BigInt(validatorID)],
      });
      
      const { receipt, isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);
      
      return {
        receipt,
        isConfirmed: confirmed,
        hash: txHash,
      };
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
    errorMessage:
      (error as BaseError)?.shortMessage || error?.message || "Unknown error",
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
  } = useWaitForTransactionReceipt({
    hash,
  });

  const restakeRewards = async (validatorID: number) => {
    setIsConfirmed(false);
    
    try {
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "restakeRewards",
        args: [BigInt(validatorID)],
      });
      
      const { receipt, isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);
      
      return {
        receipt,
        isConfirmed: confirmed,
        hash: txHash,
      };
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
    errorMessage:
      (error as BaseError)?.shortMessage || error?.message || "Unknown error",
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
  } = useWaitForTransactionReceipt({
    hash,
  });

  const lockStake = async (validatorID: number, lockupDuration: number, amount: string) => {
    setIsConfirmed(false);
    
    try {
      const amountInWei = parseEther(amount);
      
      const txHash = await writeContractAsync({
        ...contract,
        functionName: "lockStake",
        args: [BigInt(validatorID), BigInt(lockupDuration), amountInWei],
      });
      
      const { receipt, isConfirmed: confirmed } = await waitForTransactionReceipt(txHash);
      setIsConfirmed(confirmed);
      
      return {
        receipt,
        isConfirmed: confirmed,
        hash: txHash,
      };
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
    errorMessage:
      (error as BaseError)?.shortMessage || error?.message || "Unknown error",
    isError: isCallError || isExecuteError,
  };
};
