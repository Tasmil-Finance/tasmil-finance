import { useState } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { parseUnits } from "viem";
import { waitForTransactionReceipt } from "@/shared/utils/waitForTransactionReceipt";

// Vault ABI - minimal interface for the operations we need
const VAULT_ABI = [
 // ERC4626 View Functions
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'asset',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'convertToAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertToShares',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'previewDeposit',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'previewWithdraw',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'previewRedeem',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Vault-specific View Functions
  {
    name: 'strategies',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'strategy', type: 'address' }],
    outputs: [
      { name: 'active', type: 'bool' },
      { name: 'currentDebt', type: 'uint256' },
      { name: 'maxDebt', type: 'uint256' },
    ],
  },
  {
    name: 'targetWeights',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'strategy', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalTargetWeights',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getWithdrawalQueueLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'withdrawalQueue',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'performanceFeeBps',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'treasury',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  // ERC4626 Write Functions
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  // Vault Management Functions (Admin/Keeper)
  {
    name: 'rebalance',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'setStrategyWeights',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_strategies', type: 'address[]' },
      { name: '_weights', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'setWeightsAndRebalance',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_strategies', type: 'address[]' },
      { name: '_weights', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'pushFunds',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_strategy', type: 'address' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // ERC20 approve (needed for deposits)
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Strategy Interface ABI
 */
export const STRATEGY_ABI = [
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'asset',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'harvest',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'profit', type: 'uint256' }],
  },
  {
    name: 'reportToVault',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [
      { name: 'profit', type: 'uint256' },
      { name: 'loss', type: 'uint256' },
    ],
  },
] as const;

// USDC ABI - for approvals
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Contract addresses on Arbitrum
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const DEFAULT_VAULT_ADDRESS = "0x3f924889717554AF7C6F835dBB08B5f977649804"; // From MCP server

interface TransactionResult {
  hash: string;
  isConfirmed: boolean;
}

export function useVaultDeposit() {
  const [isPending, setIsPending] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  const deposit = async (vaultAddress: string, amountUSDC: string, receiverAddress?: string): Promise<TransactionResult> => {
    setIsPending(true);
    try {
      // Parse USDC amount (6 decimals)
      const amount = parseUnits(amountUSDC, 6);
      
      if (!address) {
        throw new Error("Wallet not connected");
      }

      const receiver = receiverAddress || address;

      const hash = await writeContractAsync({
        address: (vaultAddress || DEFAULT_VAULT_ADDRESS) as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amount, receiver as `0x${string}`],
      });

      // Wait for transaction confirmation
      const { isConfirmed } = await waitForTransactionReceipt(hash);

      return { hash, isConfirmed };
    } finally {
      setIsPending(false);
    }
  };

  return { deposit, isPending };
}

export function useVaultWithdraw() {
  const [isPending, setIsPending] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  const withdraw = async (vaultAddress: string, amountUSDC: string): Promise<TransactionResult> => {
    setIsPending(true);
    try {
      // Parse USDC amount (6 decimals)
      const amount = parseUnits(amountUSDC, 6);
      
      if (!address) {
        throw new Error("Wallet not connected");
      }

      const hash = await writeContractAsync({
        address: (vaultAddress || DEFAULT_VAULT_ADDRESS) as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [amount, address, address],
      });

      return { hash, isConfirmed: false };
    } finally {
      setIsPending(false);
    }
  };

  return { withdraw, isPending };
}

export function useVaultRedeem() {
  const [isPending, setIsPending] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  const redeem = async (vaultAddress: string, sharesAmount: string): Promise<TransactionResult> => {
    setIsPending(true);
    try {
      // Parse shares amount (18 decimals)
      const shares = parseUnits(sharesAmount, 18);
      
      if (!address) {
        throw new Error("Wallet not connected");
      }

      const hash = await writeContractAsync({
        address: (vaultAddress || DEFAULT_VAULT_ADDRESS) as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "redeem",
        args: [shares, address, address],
      });

      return { hash, isConfirmed: false };
    } finally {
      setIsPending(false);
    }
  };

  return { redeem, isPending };
}

export function useVaultApprove() {
  const [isPending, setIsPending] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const approve = async (spender: string, amountUSDC: string): Promise<TransactionResult> => {
    setIsPending(true);
    try {
      // Parse USDC amount (6 decimals)
      const amount = parseUnits(amountUSDC, 6);

      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spender as `0x${string}`, amount],
      });

      return { hash, isConfirmed: false };
    } finally {
      setIsPending(false);
    }
  };

  return { approve, isPending };
}