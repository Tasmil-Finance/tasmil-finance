import type { Metadata } from "next";
import LandingPage from "@/app/(landing-page)/components";
import { LandingBackground } from "@/features/landing/components/LandingBackground";

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
    <div className="relative min-h-screen bg-black" id="landing-scroll-container">
      {/* 3D Background - Fixed */}
      <div className="fixed inset-0 z-0">
        <LandingBackground />
      </div>

      {/* Content Scroll Layer */}
      <div className="relative z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <LandingPage />
        </div>
      </div>
    </div>
  );
}
