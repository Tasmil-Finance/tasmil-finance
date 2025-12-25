/**
 * Mock Data Service for TX Credit System
 * This service simulates backend API calls for TX Credit operations
 */

export interface TxCreditData {
  paid: number;
  paidMax: number;
  free: number;
  freeMax: number;
}

export interface RechargeOption {
  amount: number;
  price: number;
  popular: boolean;
}

export interface RechargeResponse {
  success: boolean;
  message: string;
  newCredits: TxCreditData;
  transactionId?: string;
}

// In-memory storage for demo purposes
let currentTxCredit: TxCreditData = {
  paid: 0,
  paidMax: 0,
  free: 76,
  freeMax: 500,
};

// Available recharge options
export const RECHARGE_OPTIONS: RechargeOption[] = [
  { amount: 5000, price: 5, popular: false },
  { amount: 20_000, price: 20, popular: true },
  { amount: 35_000, price: 35, popular: false },
  { amount: 60_000, price: 60, popular: false },
];

/**
 * Simulates fetching TX Credit data from backend
 * @param delay - Optional delay in milliseconds (default: 1200ms)
 */
export const fetchTxCredit = async (
  delay: number = 1200
): Promise<TxCreditData> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Return current credit state
  return { ...currentTxCredit };
};

/**
 * Simulates processing a credit recharge payment
 * @param amount - Number of credits to purchase
 * @param price - Price in USDT
 */
export const processRecharge = async (
  amount: number,
  price: number
): Promise<RechargeResponse> => {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate random payment failures (10% chance)
  const shouldFail = Math.random() < 0.1;

  if (shouldFail) {
    return {
      success: false,
      message: "Payment processing failed. Please try again.",
      newCredits: { ...currentTxCredit },
    };
  }

  // Update paid credits
  currentTxCredit.paid += amount;
  currentTxCredit.paidMax += amount;

  // Generate mock transaction ID
  const transactionId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  return {
    success: true,
    message: `Successfully added ${amount.toLocaleString()} TX Credits!`,
    newCredits: { ...currentTxCredit },
    transactionId,
  };
};

/**
 * Simulates using TX credits (for future implementation)
 * @param amount - Number of credits to consume
 * @param usePaid - Whether to use paid credits first
 */
export const consumeCredits = async (
  amount: number,
  usePaid: boolean = true
): Promise<{ success: boolean; remaining: TxCreditData }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (usePaid && currentTxCredit.paid >= amount) {
    currentTxCredit.paid -= amount;
    return {
      success: true,
      remaining: { ...currentTxCredit },
    };
  }

  if (currentTxCredit.free >= amount) {
    currentTxCredit.free -= amount;
    return {
      success: true,
      remaining: { ...currentTxCredit },
    };
  }

  return {
    success: false,
    remaining: { ...currentTxCredit },
  };
};

/**
 * Resets credits to initial state (for testing)
 */
export const resetCredits = (): void => {
  currentTxCredit = {
    paid: 0,
    paidMax: 0,
    free: 76,
    freeMax: 500,
  };
};

/**
 * Manually set credit values (for testing different scenarios)
 */
export const setCredits = (credits: Partial<TxCreditData>): void => {
  currentTxCredit = {
    ...currentTxCredit,
    ...credits,
  };
};
