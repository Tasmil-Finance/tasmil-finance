import { http, type Hex, createPublicClient, zeroAddress, type Address, encodeFunctionData, parseAbi } from "viem";
import { sepolia } from "viem/chains";
import { createKernelAccount, createKernelAccountClient } from "@botanary/sdk";
import { KERNEL_V3_3, getEntryPoint } from "@botanary/sdk/constants";
import { signerToEcdsaValidator } from "@botanary/ecdsa-validator";
import type { WalletClient } from "viem";

// Import the correct signer type
// import type { SmartAccount } from "permissionless/accounts";

export interface SmartWalletConfig {
  walletClient: WalletClient & { account: any };
  rpcUrl: string;
  bundlerUrl: string;
  paymasterAddress?: string;
  paymasterType?: 'sponsor' | 'erc20';
}

export interface PaymasterConfig {
  address: string;
  type: 'sponsor' | 'erc20';
  tokenAddress?: string; // Required for ERC20 paymaster
}

export interface SmartWalletResult {
  address: string;
  userOpHash?: string;
  transactionHash?: string;
}

export class SmartWalletService {
  private config: SmartWalletConfig;
  private publicClient: any;
  private kernelClient: any;
  private account: any | null = null;
  private paymasterConfig?: PaymasterConfig;

  // Paymaster addresses for Sepolia testnet
  private static readonly SPONSOR_PAYMASTER_ADDRESS = "0xD8b5D09f00eF3Bd681e7C5F838C63054E73261E9";
  private static readonly TOKEN_ADDRESS = "0xB0EAD1E6B9563b6a9B678fEaC85bc34994a8636F";

  constructor(config: SmartWalletConfig) {
    this.config = config;
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
      chain: sepolia,
    });

    // Set default paymaster config
    if (config.paymasterAddress || config.paymasterType) {
      this.paymasterConfig = {
        address: config.paymasterAddress || SmartWalletService.SPONSOR_PAYMASTER_ADDRESS,
        type: config.paymasterType || 'sponsor',
        tokenAddress: SmartWalletService.TOKEN_ADDRESS,
      };
    }
  }

  async createSmartWallet(): Promise<SmartWalletResult> {
    try {
      const entryPoint = getEntryPoint("0.7");
      const kernelVersion = KERNEL_V3_3;

      // Check if wallet client has account
      if (!this.config.walletClient.account) {
        throw new Error("Wallet client must have an account");
      }

      console.log("Creating smart wallet with signer:", this.config.walletClient.account.address);

      // Create ECDSA validator plugin using user's wallet client
      const ecdsaValidator = await signerToEcdsaValidator(this.publicClient, {
        signer: this.config.walletClient as any,
        entryPoint,
        kernelVersion,
      });

      console.log("ECDSA validator created successfully");

      // Create kernel account
      this.account = await createKernelAccount(this.publicClient, {
        plugins: {
          sudo: ecdsaValidator,
        },
        entryPoint,
        kernelVersion,
      });

      console.log("Kernel account created:", this.account.address);

      // Create kernel client with paymaster support
      const clientConfig: any = {
        account: this.account,
        chain: sepolia,
        bundlerTransport: http(this.config.bundlerUrl),
        client: this.publicClient,
      };

      // Add paymaster configuration if available
      if (this.paymasterConfig) {
        console.log("Adding paymaster config:", this.paymasterConfig.type);
        clientConfig.paymaster = {
          getPaymasterData: async (_userOp: any) => {
            if (this.paymasterConfig?.type === 'sponsor') {
              return {
                paymaster: this.paymasterConfig.address as Address,
                paymasterData: "0x" as Hex,
                paymasterVerificationGasLimit: 60000n,
                paymasterPostOpGasLimit: 0n,
              };
            } else if (this.paymasterConfig?.type === 'erc20') {
              return {
                paymaster: this.paymasterConfig.address as Address,
                paymasterData: "0x" as Hex,
                paymasterVerificationGasLimit: 100000n,
                paymasterPostOpGasLimit: 100000n,
              };
            }
            return {};
          },
        };
      }

      this.kernelClient = createKernelAccountClient(clientConfig);

      return {
        address: this.account.address,
      };
    } catch (error) {
      console.error("Error creating smart wallet:", error);
      throw new Error(`Failed to create smart wallet: ${error}`);
    }
  }

  async sendInitialTransaction(): Promise<SmartWalletResult> {
    if (!this.account || !this.kernelClient) {
      throw new Error("Smart wallet not initialized. Call createSmartWallet first.");
    }

    try {
      // Send a UserOperation
      const userOpHash = await this.kernelClient.sendUserOperation({
        callData: await this.account.encodeCalls([
          {
            to: zeroAddress,
            value: BigInt(0),
            data: "0x",
          },
        ]),
      });

      // Wait for receipt
      const receipt = await this.kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      return {
        address: this.account.address,
        userOpHash,
        transactionHash: receipt.receipt.transactionHash,
      };
    } catch (error) {
      console.error("Error sending initial transaction:", error);
      throw new Error(`Failed to send initial transaction: ${error}`);
    }
  }

  async approveTokenForPaymaster(amount: bigint = BigInt("1000000000000000000000")): Promise<string> {
    if (!this.kernelClient || !this.paymasterConfig) {
      throw new Error("Smart wallet or paymaster not initialized");
    }

    if (this.paymasterConfig.type !== 'erc20' || !this.paymasterConfig.tokenAddress) {
      throw new Error("Token approval only needed for ERC20 paymaster");
    }

    try {
      const txHash = await this.kernelClient.sendTransaction({
        to: this.paymasterConfig.tokenAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: parseAbi(["function approve(address spender, uint256 amount) external returns (bool)"]),
          functionName: "approve",
          args: [this.paymasterConfig.address as Address, amount],
        }),
        value: 0n,
      });

      return txHash;
    } catch (error) {
      console.error("Error approving token for paymaster:", error);
      throw new Error(`Failed to approve token: ${error}`);
    }
  }

  async sendGaslessTransaction(to: `0x${string}`, value: bigint = BigInt(0), data: Hex = "0x"): Promise<string> {
    if (!this.kernelClient) {
      throw new Error("Smart wallet not initialized. Call createSmartWallet first.");
    }

    try {
      const txHash = await this.kernelClient.sendTransaction({
        to,
        value,
        data,
      });

      return txHash;
    } catch (error) {
      console.error("Error sending gasless transaction:", error);
      throw new Error(`Failed to send gasless transaction: ${error}`);
    }
  }

  getAddress(): string {
    if (!this.account) {
      throw new Error("Smart wallet not initialized. Call createSmartWallet first.");
    }
    return this.account.address;
  }

  getPaymasterConfig(): PaymasterConfig | undefined {
    return this.paymasterConfig;
  }

  // Legacy method for backward compatibility
  async sendTransaction(to: `0x${string}`, value: bigint = BigInt(0), data: Hex = "0x"): Promise<string> {
    return this.sendGaslessTransaction(to, value, data);
  }
}

// Utility function to create smart wallet with wallet client and paymaster
export async function createSmartWalletFromWallet(
  walletClient: WalletClient & { account: any },
  paymasterType: 'sponsor' | 'erc20' | 'none' = 'sponsor'
): Promise<SmartWalletService> {
  const rpcUrl = process.env["NEXT_PUBLIC_RPC_URL"] || "";
  const bundlerUrl = process.env["NEXT_PUBLIC_ZERODEV_BUNDLER_URL"] || "";

  if (!rpcUrl || !bundlerUrl) {
    throw new Error("Missing required environment variables for smart wallet");
  }

  const config: SmartWalletConfig = {
    walletClient,
    rpcUrl,
    bundlerUrl,
  };

  // Add paymaster configuration if not 'none'
  if (paymasterType !== 'none') {
    config.paymasterType = paymasterType;
  }

  return new SmartWalletService(config);
}