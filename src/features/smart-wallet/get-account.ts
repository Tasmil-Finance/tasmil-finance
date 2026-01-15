import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { signerToEcdsaValidator } from '@botanary/ecdsa-validator';
import { createKernelAccount,type CreateKernelAccountReturnType } from '@botanary/sdk/accounts';
import { entryPoint, kernelVersion } from '@/features/smart-wallet/wallet-config';

export const getSmartAccount = async (): Promise<CreateKernelAccountReturnType> => {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found');
  }

  const [address] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(sepolia.rpcUrls.default.http[0]),
  });

  const walletClient = createWalletClient({
    account: address as `0x${string}`,
    chain: sepolia,
    transport: http(sepolia.rpcUrls.default.http[0]),
  });

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: walletClient,
    entryPoint,
    kernelVersion,
  });

  const smartAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
    kernelVersion,
  });
  
  return smartAccount;
};
