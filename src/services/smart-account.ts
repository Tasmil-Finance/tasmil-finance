import { 
  createPublicClient, 
  createWalletClient,
  http, 
  type Hex, 
  type Address, 
  encodeFunctionData, 
  parseAbi, 
  parseEther
} from "viem";
import { sepolia } from "viem/chains";
import { signerToEcdsaValidator } from "@botanary/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient } from "@botanary/sdk";
import { KERNEL_V3_3, getEntryPoint } from "@botanary/sdk/constants";
import { privateKeyToAccount } from "viem/accounts";
import type { WalletClient } from "viem";

// Constants
const SPONSOR_PAYMASTER_ADDRESS = "0xD8b5D09f00eF3Bd681e7C5F838C63054E73261E9";

const entryPoint = getEntryPoint("0.7");

// Clients
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env["NEXT_PUBLIC_RPC_URL"]),
});

// Admin client - only create if private key is available
const createAdminClient = () => {
  const adminPrivateKey = process.env["NEXT_PUBLIC_ADMIN_PRIVATE_KEY"] as Hex;
  
  if (!adminPrivateKey) {
    console.warn("⚠️ Admin private key not found. Some features may not work.");
    return null;
  }

  try {
    const adminAccount = privateKeyToAccount(adminPrivateKey);
    const adminWalletClient = createWalletClient({
      account: adminAccount,
      chain: sepolia,
      transport: http(process.env["NEXT_PUBLIC_RPC_URL"]),
    });
    
    return adminWalletClient;
  } catch (error) {
    console.error("❌ Error creating admin client:", error);
    return null;
  }
};

const adminWalletClient = createAdminClient();

export interface SmartAccountResult {
  address: Address;
  client: any;
  isDeployed: boolean;
  isWhitelisted?: boolean;
}

export interface CreateSmartAccountParams {
  walletClient: WalletClient & { account: any };
}

/**
 * Creates a smart account from a wagmi signer with sponsored gas deployment
 */
export class SmartAccountService {
  
  /**
   * Check if admin client is available for advanced operations
   */
  static isAdminAvailable(): boolean {
    return adminWalletClient !== null;
  }
  
  /**
   * Create a smart account using wagmi wallet client (without deploying)
   */
  static async createSmartAccount({ 
    walletClient
  }: CreateSmartAccountParams): Promise<SmartAccountResult> {
    try {
      if (!walletClient?.account?.address) {
        throw new Error("Wallet account not available");
      }

      // Create ECDSA validator
      // @ts-ignore - Type compatibility issue
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: walletClient as any,
        entryPoint,
        kernelVersion: KERNEL_V3_3,
      });

      // Create kernel account
      const kernelAccount = await createKernelAccount(publicClient, {
        plugins: { sudo: ecdsaValidator },
        entryPoint,
        kernelVersion: KERNEL_V3_3,
      });

      // Check if account is deployed
      const isDeployed = await this.isAccountDeployed(kernelAccount.address);

      // Create sponsored client
      const client = this.createSponsoredClient(kernelAccount);

      return {
        address: kernelAccount.address,
        client,
        isDeployed,
        isWhitelisted: false,
      };

    } catch (error) {
      console.error("❌ Error creating smart account:", error);
      throw error;
    }
  }

  /**
   * Whitelist account for sponsored transactions
   */
  private static async whitelistAccount(accountAddress: Address): Promise<void> {
    if (!adminWalletClient) {
      console.warn("⚠️ Admin client not available. Skipping whitelist step.");
      return;
    }

    try {
      const whitelistHash = await adminWalletClient.sendTransaction({
        to: SPONSOR_PAYMASTER_ADDRESS,
        data: encodeFunctionData({
          abi: parseAbi(["function addAddress(address user) external"]),
          functionName: "addAddress",
          args: [accountAddress],
        }),
      });

      await publicClient.waitForTransactionReceipt({ hash: whitelistHash });
    } catch (error) {
      console.error("❌ Error whitelisting account:", error);
      // Don't throw error, just continue
    }
  }

  /**
   * Create client with sponsored paymaster
   */
  private static createSponsoredClient(account: any) {
    return createKernelAccountClient({
      account,
      chain: sepolia,
      bundlerTransport: http(process.env["NEXT_PUBLIC_ZERODEV_BUNDLER_URL"]),
      paymaster: {
        getPaymasterData: async () => ({
          paymaster: SPONSOR_PAYMASTER_ADDRESS as Address,
          paymasterData: "0x" as Hex,
          paymasterVerificationGasLimit: BigInt(60000),
          paymasterPostOpGasLimit: BigInt(0),
        }),
      },
    });
  }

  /**
   * Send a deployment transaction to activate the smart account
   */
  static async deployAccount(client: any, accountAddress: Address): Promise<string> {
    try {
      // First, whitelist the account for sponsored transactions
      await this.whitelistAccount(accountAddress);
      
      // Deploy with a simple transaction
      const hash = await (client as any).sendTransaction({
        to: "0x0000000000000000000000000000000000000000" as Address,
        data: "0x",
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (error) {
      console.error("❌ Error activating smart account:", error);
      throw error;
    }
  }

  /**
   * Withdraw ETH from Smart Wallet to EOA
   */
  static async withdrawFromSmartWallet(
    smartWalletClient: any,
    eoaAddress: Address,
    amount: string
  ): Promise<string> {
    try {
      const hash = await (smartWalletClient as any).sendTransaction({
        to: eoaAddress,
        value: parseEther(amount),
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (error) {
      console.error("❌ Error withdrawing from smart wallet:", error);
      throw error;
    }
  }

  /**
   * Get ETH balance of an address
   */
  static async getBalance(address: Address): Promise<bigint> {
    try {
      return await publicClient.getBalance({ address });
    } catch (error) {
      console.error("❌ Error getting balance:", error);
      throw error;
    }
  }

  /**
   * Get account deployment status
   */
  static async isAccountDeployed(address: Address): Promise<boolean> {
    const code = await publicClient.getCode({ address });
    return code !== undefined && code !== "0x";
  }
}