'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { getAgentConfig } from '@/features/chat/config';
import { Typography } from '@/shared/ui/typography';

type GreetingContent = {
  title: string;
  subtitle: string;
  bullets: string[];
};

const AGENT_GREETING_CONTENT: Record<string, GreetingContent> = {
  supervisor: {
    title: 'Your Tasmil DeFi Assistant',
    subtitle: 'Plan and execute multi-step DeFi flows in one conversation.',
    bullets: [
      'Route requests to the best protocol agent automatically',
      'Coordinate swap, bridge, lend, and yield workflows',
      'Guide each step before execution',
    ],
  },
  blend_agent: {
    title: 'Your Blend Lending Specialist',
    subtitle: 'Manage lending, borrowing, and backstop actions on Blend.',
    bullets: [
      'Supply collateral and borrow with health checks',
      'Track reserves, positions, and emissions',
      'Handle backstop deposit and withdrawal flows',
    ],
  },
  soroswap_agent: {
    title: 'Your Soroswap Trading Specialist',
    subtitle: 'Execute swaps and LP actions across Soroswap and SDEX.',
    bullets: [
      'Compare routes and price impact before execution',
      'Build swap transactions with safer slippage handling',
      'Add or remove liquidity in selected pools',
    ],
  },
  phoenix_agent: {
    title: 'Your Phoenix DEX Specialist',
    subtitle: 'Trade, provide liquidity, and manage Phoenix staking actions.',
    bullets: [
      'Simulate swaps and inspect pool details',
      'Provide or withdraw liquidity on Phoenix',
      'Bond, unbond, and claim LP staking rewards',
    ],
  },
  aquarius_agent: {
    title: 'Your Aquarius Liquidity Specialist',
    subtitle: 'Work with Aquarius pools, rewards, and AQUA lock actions.',
    bullets: [
      'Explore pools and liquidity opportunities',
      'Execute swaps and LP operations',
      'Claim rewards and lock AQUA for ICE',
    ],
  },
  defindex_agent: {
    title: 'Your DeFindex Vault Specialist',
    subtitle: 'Deploy capital into DeFindex vault strategies with clarity.',
    bullets: [
      'Compare vault status and strategy setup',
      'Deposit and withdraw with share-awareness',
      'Track vault position health over time',
    ],
  },
  templar_agent: {
    title: 'Your Templar Cross-Chain Specialist',
    subtitle: 'Use Templar for lending and cross-chain swap workflows.',
    bullets: [
      'View markets, positions, and borrow health',
      'Quote and execute cross-chain swap intents',
      'Monitor pending interest and yield',
    ],
  },
  allbridge_agent: {
    title: 'Your Allbridge Bridge Specialist',
    subtitle: 'Bridge assets using Allbridge routes only.',
    bullets: [
      'Get Allbridge-only route availability by chain',
      'Compare quote output, fee, and ETA quickly',
      'Build bridge transactions for signing',
    ],
  },
  sdex_agent: {
    title: 'Your Stellar SDEX Specialist',
    subtitle: 'Trade using Stellar Classic DEX path payments.',
    bullets: [
      'Find strict-send and strict-receive paths',
      'Inspect live orderbook depth by pair',
      'Build SDEX swap transaction XDR safely',
    ],
  },
  lumenswap_agent: {
    title: 'Your Lumenswap Routing Assistant',
    subtitle: 'Lumenswap execution is pending integration in this deployment.',
    bullets: [
      'Confirm Lumenswap availability status clearly',
      'Route to Soroswap for AMM execution',
      'Route to SDEX for classic orderbook swaps',
    ],
  },
  bridge_agent: {
    title: 'Your Bridge Execution Specialist',
    subtitle: 'Move assets between Stellar and external chains confidently.',
    bullets: [
      'Compare bridge routes and estimated fees',
      'Select provider paths like Allbridge or NEAR Intents',
      'Build transfer transactions for wallet signing',
    ],
  },
  yield_agent: {
    title: 'Your Yield Discovery Assistant',
    subtitle: 'Find the best risk-adjusted yield opportunities quickly.',
    bullets: [
      'Compare APY and TVL across protocols',
      'Surface opportunities by token and chain',
      'Hand off to execution agents when ready',
    ],
  },
  research_agent: {
    title: 'Your Market Research Assistant',
    subtitle: 'Get concise trend and protocol analysis for decisions.',
    bullets: [
      'Summarize current market narratives',
      'Compare protocols and ecosystem signals',
      'Highlight key risks and opportunities',
    ],
  },
  info_agent: {
    title: 'Your Account Info Assistant',
    subtitle: 'Check balances and account state before taking actions.',
    bullets: [
      'Read wallet balances and trustlines',
      'Inspect reserves and account readiness',
      'Review recent activity and token exposure',
    ],
  },
  default: {
    title: 'Your Intelligent DeFi Assistant',
    subtitle: 'How can I help you today?',
    bullets: [
      'Ask about swaps, yield, lending, or bridging',
      'Get guided steps before execution',
      'Use suggestions below to start quickly',
    ],
  },
};

const DEFAULT_GREETING: GreetingContent = {
  title: 'Your Intelligent DeFi Assistant',
  subtitle: 'How can I help you today?',
  bullets: [
    'Ask about swaps, yield, lending, or bridging',
    'Get guided steps before execution',
    'Use suggestions below to start quickly',
  ],
};

interface GreetingProps {
  agentId: string;
}

export const Greeting = ({ agentId }: GreetingProps) => {
  const config = getAgentConfig(agentId);
  const content =
    AGENT_GREETING_CONTENT[config.id] ??
    AGENT_GREETING_CONTENT['default'] ??
    DEFAULT_GREETING;
  const logo = config.icon || '/agents/supervisor-agent.png';

  return (
    <div
      className="mt-4 flex size-full flex-col justify-center px-4 md:mt-16"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.45 }}
      >
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border/60 bg-muted/30 md:h-24 md:w-24">
          <Image src={logo} alt={config.name} fill className="object-cover" />
        </div>
      </motion.div>

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
        <Typography className="text-lg text-muted-foreground md:text-xl">
          {content.subtitle}
        </Typography>
      </motion.div>

      <motion.ul
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 space-y-2"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        {content.bullets.slice(0, 3).map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-muted-foreground"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
            <span className="text-sm md:text-base">{item}</span>
          </li>
        ))}
      </motion.ul>
    </div>
  );
};
