import { sepolia } from "wagmi/chains";

export const ContractAddresses: Record<
  string,
  Record<number, `0x${string}` | "">
> = {
  TestToken: {
    [sepolia.id]: "0xD86462bF8dC1c3769071F3bD81B1EDf2de000bb7", // USDC on Sepolia
    39: "0xD86462bF8dC1c3769071F3bD81B1EDf2de000bb7", // Placeholder - need real ERC20 contract
    // add more chains
    // [mainnet.id]: "0x0000000000000000000000000000000000000000",
  },
} as const;
