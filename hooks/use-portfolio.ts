"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { ethers } from "ethers";
import type { TokenData, PortfolioStats, RiskProfile } from "@/types/portfolio";
import SFC_ABI from "@/config/contracts/abi/SFC-json.json";
import { fetchTokenPrices } from "@/lib/price-service";
import {
  calculateTokenValue,
  calculatePercentage,
  sanitizeNumber,
  preciseMultiply,
} from "@/lib/number-utils";

// Constants
const U2U_SOLARIS_RPC_URL = "https://rpc-mainnet.u2u.xyz";
const SFC_CONTRACT_ADDRESS = "0xfc00face00000000000000000000000000000000";

/**
 * Calculate portfolio statistics with precision
 */
const calculatePortfolioStats = (tokens: TokenData[]): PortfolioStats => {
  // Calculate total assets with precise addition
  const totalAssets = tokens.reduce((sum, token) => {
    const sanitizedValue = sanitizeNumber(token.value);
    return sum + sanitizedValue;
  }, 0);

  // Calculate net worth change with precision
  const netWorthChange = tokens.reduce((sum, token) => {
    const sanitizedValue = sanitizeNumber(token.value);
    const sanitizedChange = sanitizeNumber(token.change24h);
    const change = preciseMultiply(sanitizedValue, sanitizedChange / 100);
    return sum + change;
  }, 0);

  // Calculate percentage change
  const netWorthChangePercent = calculatePercentage(netWorthChange, totalAssets);

  return {
    netWorth: totalAssets,
    netWorthChange,
    netWorthChangePercent,
    claimable: 0, // Will be fetched from staking contract
    totalAssets,
    totalLiabilities: 0,
  };
};

/**
 * Calculate risk profile based on token market caps with precision
 */
const calculateRiskProfile = (tokens: TokenData[]): RiskProfile => {
  const total = tokens.reduce((sum, token) => {
    const sanitizedValue = sanitizeNumber(token.value);
    return sum + sanitizedValue;
  }, 0);

  if (total === 0) {
    return {
      largeCap: 0,
      stablecoins: 0,
      midCap: 0,
      smallCap: 0,
      microCap: 0,
    };
  }

  // Simplified risk categorization based on token symbols
  const largeCap = tokens
    .filter((t) => ["ETH", "BTC", "BNB"].includes(t.symbol))
    .reduce((sum, t) => sum + sanitizeNumber(t.value), 0);

  const stablecoins = tokens
    .filter((t) => ["USDC", "USDT", "DAI", "BUSD"].includes(t.symbol))
    .reduce((sum, t) => sum + sanitizeNumber(t.value), 0);

  const smallCap = tokens
    .filter((t) => ["U2U"].includes(t.symbol))
    .reduce((sum, t) => sum + sanitizeNumber(t.value), 0);

  return {
    largeCap: calculatePercentage(largeCap, total),
    stablecoins: calculatePercentage(stablecoins, total),
    midCap: 0,
    smallCap: calculatePercentage(smallCap, total),
    microCap: 0,
  };
};

/**
 * Hook to fetch and manage portfolio data from EVM
 */
export const usePortfolio = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimableRewards, setClaimableRewards] = useState(0);

  // Fetch native token balance (U2U or ETH)
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address: address,
  });

  /**
   * Fetch staking data including pending rewards
   */
  const fetchStakingData = useCallback(async (walletAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(U2U_SOLARIS_RPC_URL);
      const contract = new ethers.Contract(SFC_CONTRACT_ADDRESS, SFC_ABI, provider);

      // Get total staked amount and pending rewards across all validators
      // Note: In a real implementation, you'd need to track which validators the user has delegated to
      // For now, we'll try to query the first few validators
      let totalStaked = BigInt(0);
      let totalRewards = BigInt(0);

      // Try validators 1-10 (common validator IDs)
      for (let validatorID = 1; validatorID <= 10; validatorID++) {
        try {
          const stake = await contract.getStake(walletAddress, BigInt(validatorID));
          const rewards = await contract.pendingRewards(walletAddress, BigInt(validatorID));

          if (stake > 0) {
            totalStaked += stake;
            totalRewards += rewards;
          }
        } catch (err) {
          // Validator doesn't exist or user has no stake, continue
          continue;
        }
      }

      return {
        stakedAmount: ethers.formatEther(totalStaked),
        pendingRewards: ethers.formatEther(totalRewards),
      };
    } catch (error) {
      console.error("Error fetching staking data:", error);
      return {
        stakedAmount: "0",
        pendingRewards: "0",
      };
    }
  }, []);

  /**
   * Fetch all portfolio data
   */
  const fetchPortfolioData = useCallback(async () => {
    if (!address || !isConnected) {
      setError("No wallet connected");
      setHasData(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine which token symbols we need to fetch prices for
      const nativeSymbol = nativeBalance?.symbol || "ETH";
      const symbolsToFetch = [nativeSymbol];

      // Fetch real-time prices from CoinGecko
      setIsFetchingPrices(true);
      const prices = await fetchTokenPrices(symbolsToFetch);
      setIsFetchingPrices(false);

      const tokensList: TokenData[] = [];

      // 1. Fetch native token balance with precise calculation
      if (nativeBalance) {
        const nativeAmount = sanitizeNumber(nativeBalance.formatted);
        const priceData = prices[nativeSymbol] || { price: 0, change24h: 0 };
        const sanitizedPrice = sanitizeNumber(priceData.price);
        const sanitizedChange = sanitizeNumber(priceData.change24h);

        // Calculate value with precision
        const nativeValue = calculateTokenValue(nativeAmount, sanitizedPrice);

        console.log(`[Portfolio] Native Token:`, {
          symbol: nativeSymbol,
          amount: nativeAmount,
          price: sanitizedPrice,
          value: nativeValue,
          change24h: sanitizedChange,
        });

        tokensList.push({
          symbol: nativeSymbol,
          name: nativeBalance.symbol === "U2U" ? "U2U Network" : "Ethereum",
          price: sanitizedPrice,
          change24h: sanitizedChange,
          amount: nativeAmount,
          value: nativeValue,
          share: 0, // Will be calculated after all tokens are fetched
          type: "wallet", // Native token in wallet
        });
      }

      // 2. Fetch staking data (only on U2U network) with precise calculation
      if (chainId === 39) {
        const stakingData = await fetchStakingData(address);
        const stakedAmount = sanitizeNumber(stakingData.stakedAmount);
        const rewards = sanitizeNumber(stakingData.pendingRewards);

        if (stakedAmount > 0) {
          const priceData = prices.U2U || { price: 0, change24h: 0 };
          const sanitizedPrice = sanitizeNumber(priceData.price);
          const sanitizedChange = sanitizeNumber(priceData.change24h);

          // Calculate staked value with precision
          const stakedValue = calculateTokenValue(stakedAmount, sanitizedPrice);

          console.log(`[Portfolio] Staked Token:`, {
            symbol: "U2U",
            amount: stakedAmount,
            price: sanitizedPrice,
            value: stakedValue,
            change24h: sanitizedChange,
          });

          tokensList.push({
            symbol: "U2U",
            name: "U2U Staked",
            price: sanitizedPrice,
            change24h: sanitizedChange,
            amount: stakedAmount,
            value: stakedValue,
            share: 0,
            type: "staking", // Staked tokens
          });
        }

        // Calculate claimable rewards with precision
        const claimableValue = calculateTokenValue(rewards, sanitizeNumber(prices.U2U?.price || 0));
        setClaimableRewards(claimableValue);

        console.log(`[Portfolio] Claimable Rewards:`, {
          rewardsAmount: rewards,
          price: prices.U2U?.price || 0,
          claimableValue,
        });

        // Add rewards as a separate token if there are any
        if (rewards > 0) {
          const priceData = prices.U2U || { price: 0, change24h: 0 };
          const sanitizedPrice = sanitizeNumber(priceData.price);
          const sanitizedChange = sanitizeNumber(priceData.change24h);

          tokensList.push({
            symbol: "U2U",
            name: "U2U Rewards",
            price: sanitizedPrice,
            change24h: sanitizedChange,
            amount: rewards,
            value: claimableValue,
            share: 0,
            type: "rewards", // Claimable rewards
          });
        }
      }

      // 3. Calculate share percentages with precision
      const totalValue = tokensList.reduce((sum, token) => {
        return sum + sanitizeNumber(token.value);
      }, 0);

      if (totalValue > 0) {
        tokensList.forEach((token) => {
          token.share = calculatePercentage(token.value, totalValue);
        });
      }

      console.log(`[Portfolio] Total Summary:`, {
        totalValue,
        tokensCount: tokensList.length,
        tokens: tokensList.map((t) => ({
          symbol: t.symbol,
          amount: t.amount,
          price: t.price,
          value: t.value,
          share: t.share,
        })),
      });

      setTokens(tokensList);
      setHasData(tokensList.length > 0);
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
      setError("Failed to fetch portfolio data");
      setHasData(false);
      setTokens([]);
      setIsFetchingPrices(false);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, nativeBalance, chainId, fetchStakingData]);

  // Fetch prices periodically (every 60 seconds)
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchPortfolioData();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [isConnected, address, fetchPortfolioData]);

  // Auto-fetch on wallet connection or balance change
  useEffect(() => {
    if (isConnected && address) {
      fetchPortfolioData();
    } else {
      setTokens([]);
      setHasData(false);
      setError(null);
    }
  }, [isConnected, address, fetchPortfolioData]);

  // Calculate derived data
  const portfolioStats = calculatePortfolioStats(tokens);
  const riskProfile = calculateRiskProfile(tokens);

  // Update claimable rewards in portfolio stats
  const updatedPortfolioStats: PortfolioStats = {
    ...portfolioStats,
    claimable: claimableRewards,
  };

  return {
    tokens,
    portfolioStats: updatedPortfolioStats,
    riskProfile,
    isLoading,
    isFetchingPrices,
    hasData,
    error,
    refetch: fetchPortfolioData,
    refetchNativeBalance,
  };
};
