import { Bot, LineChart, MessageSquare, Tractor, Trophy } from "lucide-react";
import type { ComponentType } from "react";

export interface WelcomeSlideData {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  /** Path under /public, e.g. "/onboarding/intro.mp4". Empty/undefined → no video slot. */
  videoSrc?: string;
  /** Path under /public, e.g. "/onboarding/intro-poster.png". Optional. */
  videoPoster?: string;
  /** Path under /public, e.g. "/onboarding/chat.png". Empty/undefined → no image slot. */
  imageSrc?: string;
  /** Alt text for the image slot. Required when imageSrc is set. */
  imageAlt?: string;
}

export const welcomeSlides: WelcomeSlideData[] = [
  {
    icon: Bot,
    title: "Welcome to Tasmil",
    description:
      "Your AI-powered DeFi portfolio manager on Stellar. Manage, optimize, and grow your assets in one place.",
    gradient: "from-sky-500 to-blue-600",
    videoSrc: "/onboarding/intro.mp4",
    videoPoster: "/onboarding/intro-poster.png",
  },
  {
    icon: MessageSquare,
    title: "Chat With Your Agent",
    description:
      "Natural-language DeFi: ask the agent to swap, bridge, or rebalance — it executes and explains.",
    gradient: "from-violet-500 to-purple-600",
    imageSrc: "/onboarding/chat.png",
    imageAlt: "Chat interface preview",
  },
  {
    icon: Tractor,
    title: "Automated Yield Farming",
    description:
      "AI agents find the best yields across Blend, Soroswap, and Aquarius. Set risk; the agent rebalances for you.",
    gradient: "from-emerald-500 to-teal-600",
    imageSrc: "/onboarding/farming.png",
    imageAlt: "Farming dashboard preview",
  },
  {
    icon: LineChart,
    title: "Track Everything, Earn Rewards",
    description:
      "Watch your portfolio in real time. Climb the Quest leaderboard. Earn welcome credits and task bonuses.",
    gradient: "from-amber-500 to-orange-600",
    imageSrc: "/onboarding/portfolio.png",
    imageAlt: "Portfolio overview preview",
  },
  {
    icon: Trophy,
    title: "Ready to Begin?",
    description: "Connect your wallet and start earning. Powered by Stellar Soroban.",
    gradient: "from-yellow-400 to-rose-500",
  },
];
