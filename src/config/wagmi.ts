import { getDefaultConfig, type WalletList } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, okxWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { defineChain } from "viem";
import { http } from "wagmi";
import { mainnet } from "wagmi/chains";

// U2U Solaris Mainnet
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

// U2U Nebulas Testnet (commented out, uncomment if needed)
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

const wallets: WalletList = [
  {
    groupName: "Popular",
    wallets: [metaMaskWallet, okxWallet, walletConnectWallet],
  },
];

const chains = [u2uSolaris, mainnet] as const;

const metadata = {
  name: "Tasmil Finance",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
};

export const wagmiConfig = getDefaultConfig({
  appName: metadata.name,
  projectId: metadata.projectId,
  chains,
  transports: {
    [u2uSolaris.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
  wallets,
});

export const defaultNetwork = u2uSolaris;
export { chains };
