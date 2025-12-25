import { wagmiConfig } from "@/config/connectors/wagmi";
import { waitForTransactionReceipt as waitForTransactionReceiptWagmi } from "wagmi/actions";

export const waitForTransactionReceipt = async (hash: `0x${string}`) => {
  const receipt = await waitForTransactionReceiptWagmi(wagmiConfig, { hash });
  return {
    receipt,
    isConfirmed: receipt.status === "success",
  };
};

