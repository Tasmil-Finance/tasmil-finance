import type { Metadata } from "next";
import { LandingPage, LandingBackground } from "@/features/landing";

export const metadata: Metadata = {
  title: "Tasmil Finance | AI-Powered DeFi Gateway for Stellar Blockchain",
  description:
    "Experience seamless DeFi on Stellar — trade on Soroswap, lend on Blend, earn Aquarius rewards, and bridge via Allbridge with AI-powered conversational agents.",
  keywords: [
    "Stellar blockchain",
    "Stellar DeFi",
    "Soroswap",
    "Blend Protocol",
    "Aquarius",
    "Phoenix DeFi",
    "Allbridge",
    "Soroban",
    "XLM",
    "AI trading",
    "yield farming",
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
      <div className="pointer-events-none relative z-10">
        <div className="pointer-events-auto">
          <LandingPage />
        </div>
      </div>
    </div>
  );
}
