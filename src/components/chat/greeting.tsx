"use client";

import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";

// Agent-specific content
const agentContent = {
  "staking-agent": {
    title: "Your Staking Assistant",
    subtitle: "Ready to help you stake, delegate, and manage your U2U rewards?"
  },
  "research-agent": {
    title: "Your Crypto Research Analyst", 
    subtitle: "What cryptocurrency would you like to analyze today?"
  },
  "yield-agent": {
    title: "Your DeFi Yield Hunter",
    subtitle: "Ready to find the best yield opportunities across all chains?"
  },
  "bridge-agent": {
    title: "Your Cross-Chain Bridge Assistant",
    subtitle: "Ready to help you bridge tokens between U2U and other chains?"
  },
  default: {
    title: "Your Intelligent DeFi Assistant",
    subtitle: "How can I help you today?"
  }
};

interface GreetingProps {
  agentId: string;
}

export const Greeting = ({ agentId }: GreetingProps) => {
  // Get content based on current agent
  const getContentForAgent = (agentId: string) => {
    if (!agentId) return agentContent.default;
    
    // Handle both formats: "staking-agent" and "staking"
    const normalizedAgentId = agentId.includes("-") ? agentId : `${agentId}-agent`;
    
    switch (normalizedAgentId) {
      case "staking-agent":
        return agentContent["staking-agent"];
      case "research-agent":
        return agentContent["research-agent"];
      case "yield-agent":
        return agentContent["yield-agent"];
      case "bridge-agent":
        return agentContent["bridge-agent"];
      default:
        return agentContent.default;
    }
  };
  
  const content = getContentForAgent(agentId);
  
  return (
    <div
      className="mt-4 flex size-full flex-col justify-center px-4 md:mt-16"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className=""
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <Typography className="font-semibold text-[30px]">
          {content.title}
        </Typography>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className=""
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        <Typography className="text-2xl text-muted-foreground md:text-3xl">
          {content.subtitle}
        </Typography>
      </motion.div>
    </div>
  );
};