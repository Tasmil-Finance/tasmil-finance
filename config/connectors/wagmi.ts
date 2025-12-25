import { getDefaultConfig, type WalletList } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, okxWallet } from "@rainbow-me/rainbowkit/wallets";
import { defineChain } from "viem";
import { http } from "wagmi";
import { mainnet } from "wagmi/chains";

// u2u nebulas testnet define
// const u2uNebulas = defineChain({
//   id: 2484,
//   name: "U2U Network Nebulas",
//   nativeCurrency: {
//     decimals: 18,
//     name: "U2U",
//     symbol: "U2U",
//   },
//   rpcUrls: {
//     default: {
//       http: ["https://rpc-nebulas-testnet.u2u.xyz"],
//       webSocket: ["wss://ws-nebulas-testnet.u2u.xyz"],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: "U2U Explorer",
//       url: "https://testnet.u2uscan.xyz",
//     },
//   },
//   testnet: true,
//   iconUrl: "https://s2.coinmarketcap.com/static/img/coins/128x128/27369.png",
//   iconBackground: "#1e293b",
// });

// u2u mainnet define
const u2uSolaris = defineChain({
  id: 39,
  name: "U2U Network Solaris",
  nativeCurrency: {
    decimals: 18,
    name: "U2U",
    symbol: "U2U",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-mainnet.u2u.xyz"],
      webSocket: ["wss://ws-mainnet.u2u.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "U2U Explorer",
      url: "https://u2uscan.xyz",
    },
  },
  testnet: false,
  iconUrl: "https://s2.coinmarketcap.com/static/img/coins/128x128/27369.png",
  iconBackground: "#1e293b",
});

const wallets: WalletList = [
  {
    groupName: "Wallets",
    wallets: [okxWallet, metaMaskWallet],
  },
];
const chains = [mainnet, u2uSolaris] as const;

const metadata = {
  name: "Tasmil Finance",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
};
const config = getDefaultConfig({
  appName: metadata.name,
  projectId: metadata.projectId,
  chains,
  transports: {
    [chains[0].id]: http(),
    [chains[1].id]: http(),
  },
  ssr: true,
  wallets,
});

export const wagmiConfig = config;

export const defaultNetwork = chains[1];
