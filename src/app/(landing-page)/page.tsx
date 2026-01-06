import type { Metadata } from "next";
import LandingPage from "@/app/(landing-page)/components";

export const metadata: Metadata = {
  title: "Tasmil Finance | AI-Powered DeFi Gateway for U2U Blockchain",
  description:
    "Experience seamless DeFi on U2U blockchain with AI agents, smart swaps, liquidity optimization, and real-time market insights through conversational interactions.",
  keywords: [
    "U2U blockchain",
    "U2U DeFi",
    "AI trading",
    "DeFi platform",
    "U2U ecosystem",
    "crypto trading",
    "yield farming",
    "liquidity pools",
  ],
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900/70 to-black">
      <LandingPage />
    </div>
  );
}
