"use client";

import { Bot, Check, ChevronDown, ChevronRight, Globe, Info, Send, Settings, Shield, Zap } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";
import { NetworkIcon, TokenIcon } from "@web3icons/react/dynamic";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { Switch } from "@/shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/lib/utils";

// Mock Data
const STRATEGIES = [
  {
    id: "conservative",
    title: "Conservative",
    subtitle: "Most Risk-Averse Strategy",
    stats: { apy: "5.26%", rewardApy: "2.27%", tvl: "$1.38M" },
    active: true,
  },
  {
    id: "aggressive",
    title: "Aggressive",
    subtitle: "Chase the Highest Yield. More risks.",
    stats: { apy: "7.89%", rewardApy: "2.27%", tvl: "$9.23M" },
    active: false,
  },
];

const CHAINS = [
  { id: "base", name: "Base", network: "base" },
  { id: "arbitrum", name: "Arbitrum", network: "arbitrum-one" },
  { id: "plasma", name: "Plasma", network: "plasma", variant: "mono", className: "text-white" },
  { id: "sonic", name: "Sonic", network: "sonic", variant: "mono", className: "text-white" },
];

const PROTOCOLS = [
  { id: "aave", name: "Aave", symbol: "aave" },
  { id: "compound", name: "Compound", symbol: "comp" },
  { id: "fluid", name: "Fluid", symbol: "instadapp" }, // Fluid is Instadapp's protocol, best guess for icon
  { id: "moonwell", name: "Moonwell", symbol: "well" },
  { id: "morpho", name: "Morpho", symbol: "morpho" },
  { id: "spark", name: "Spark", symbol: "dai" }, // Spark is Maker/DAI related
];

export default function VaultPage() {
  const [selectedStrategy, setSelectedStrategy] = useState("conservative");
  const [selectedChains, setSelectedChains] = useState<string[]>(["base"]);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(["aave", "morpho", "spark"]);
  const [agentName, setAgentName] = useState("");

  // Settings
  const [omniAccount, setOmniAccount] = useState(false);
  const [autoCompounding, setAutoCompounding] = useState(true);
  const [splitting, setSplitting] = useState(false);

  const toggleChain = (id: string) => {
    setSelectedChains(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleProtocol = (id: string) => {
    setSelectedProtocols(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Tasmil Vault">
      <div className="min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
        <Tabs defaultValue="markets" className="w-full">
          <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 mb-8 gap-8">
            <TabsTrigger
              value="markets"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none px-0 py-3 text-lg text-zinc-500 data-[state=active]:text-white font-medium"
            >
              Markets
            </TabsTrigger>
            <TabsTrigger
              value="execution"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none px-0 py-3 text-lg text-zinc-500 data-[state=active]:text-white font-medium"
            >
              Execution
            </TabsTrigger>
          </TabsList>

          {/* MARKETS TAB */}
          <TabsContent value="markets" className="space-y-10 focus-visible:outline-none">

            {/* 1. Strategy Selection */}
            <section>
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-1">Strategy Selection</h3>
                <p className="text-zinc-500 text-sm">These strategies gives access to more or less protocols according to the strategy type.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {STRATEGIES.map((strategy) => (
                  <div
                    key={strategy.id}
                    onClick={() => setSelectedStrategy(strategy.id)}
                    className={cn(
                      "relative p-[1px] rounded-2xl cursor-pointer transition-all duration-300 group",
                      selectedStrategy === strategy.id
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    )}
                  >
                    <div className="bg-[#0f0f11] rounded-2xl p-6 h-full flex flex-col items-center text-center relative z-10">
                      <h4 className="text-xl font-bold text-white mb-1">{strategy.title}</h4>
                      <p className="text-zinc-500 text-xs mb-6">{strategy.subtitle}</p>

                      <div className="grid grid-cols-3 w-full gap-4 pt-4 border-t border-white/5">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Last 30d APY</p>
                          <p className="font-mono font-bold text-cyan-100 tracking-tight text-lg">{strategy.stats.apy}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Reward APY</p>
                          <p className="font-mono font-bold text-cyan-100 tracking-tight text-lg">{strategy.stats.rewardApy}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">TVL</p>
                          <p className="font-mono font-bold text-cyan-100 tracking-tight text-lg">{strategy.stats.tvl}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Chain Selection */}
            <section>
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-1">Chain Selection</h3>
                <p className="text-zinc-500 text-sm mb-3">Select the chain you allow agent to interact with:</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-4 w-4 rounded border border-zinc-700 bg-transparent" />
                  <span className="text-xs text-white">Select All</span>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                {/* @ts-ignore */}
                {CHAINS.map((chain) => (
                  <div
                    key={chain.id}
                    onClick={() => toggleChain(chain.id)}
                    className={cn(
                      "h-14 w-20 rounded-xl border flex items-center justify-center relative cursor-pointer transition-all",
                      selectedChains.includes(chain.id)
                        ? "bg-cyan-500/10 border-cyan-500"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <NetworkIcon
                      id={chain.network}
                      // @ts-ignore
                      variant={chain.variant || "branded"}
                      // @ts-ignore
                      className={chain.className}
                      size={32}
                    />

                    {/* Checkmark for active */}
                    {selectedChains.includes(chain.id) && (
                      <div className="absolute bottom-1 right-1 h-3 w-3 bg-cyan-500 rounded-full flex items-center justify-center">
                        <Check className="h-2 w-2 text-black" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Protocols Selection */}
            <section>
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-1">Protocols Selection</h3>
                <p className="text-zinc-500 text-sm mb-3">Select the protocols you allow agent to interact with:</p>
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border border-zinc-700 bg-transparent flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-white">Unselect All</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border border-zinc-700 bg-transparent" />
                    <span className="text-zinc-400">Auto-approve future protocols</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROTOCOLS.map((protocol) => (
                  <div
                    key={protocol.id}
                    onClick={() => toggleProtocol(protocol.id)}
                    className={cn(
                      "p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden group",
                      selectedProtocols.includes(protocol.id)
                        ? "bg-zinc-900 border-zinc-700"
                        : "bg-zinc-900/50 border-zinc-800 opacity-60 hover:opacity-100"
                    )}
                  >
                    {/* Gradient BG active */}
                    {selectedProtocols.includes(protocol.id) && (
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                    )}

                    <div className="shrink-0">
                      <TokenIcon symbol={protocol.symbol} variant="branded" size={32} />
                    </div>
                    <span className="font-semibold text-white">{protocol.name}</span>

                    {/* Checkbox visual */}
                    <div className={cn(
                      "ml-auto h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      selectedProtocols.includes(protocol.id)
                        ? "bg-cyan-500 border-cyan-500"
                        : "border-zinc-700 bg-transparent"
                    )}>
                      {selectedProtocols.includes(protocol.id) && <Check className="h-3 w-3 text-black" />}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Button className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl text-lg mt-8">
              Deploy my smart account on Base
            </Button>

          </TabsContent>

          {/* EXECUTION TAB */}
          <TabsContent value="execution" className="space-y-10 focus-visible:outline-none">

            <div className="mb-6">
              <p className="text-zinc-400 text-sm">Your Agent, your rules — adjust how it manages your funds.</p>
            </div>

            <div className="max-w-2xl space-y-10">

              {/* Name */}
              <div className="space-y-3">
                <label className="text-white font-semibold">Name Your Agent</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter the name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                  <Button className="bg-white text-black hover:bg-zinc-200">Save</Button>
                </div>
              </div>

              {/* Omni Account */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-white font-semibold text-sm">Omni Account</h4>
                    <p className="text-zinc-500 text-xs mt-1 max-w-sm">
                      Omni Account makes your funds work as one balance across all networks.
                      Only for <span className="text-cyan-400 underline">whitelisted</span> users.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={omniAccount} onCheckedChange={setOmniAccount} />
                  <span className="text-sm text-zinc-300">Bridge tokens</span>
                </div>
              </div>

              {/* Auto Compounding */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-white font-semibold text-sm">Auto-compounding</h4>
                  <p className="text-zinc-500 text-xs mt-1">
                    Decide if you want your earnings to be automatically reinvested to maximize returns over time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={autoCompounding} onCheckedChange={setAutoCompounding} />
                  <span className="text-sm text-zinc-300">Auto-compounding</span>
                </div>
              </div>

              {/* Splitting */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-white font-semibold text-sm">Splitting</h4>
                  <p className="text-zinc-500 text-xs mt-1">
                    Splits your funds across multiple pools for higher yields and improved risk diversification.
                    Available when you deposit more than $100k.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={splitting} onCheckedChange={setSplitting} />
                  <span className="text-sm text-zinc-300">Allow splitting</span>
                </div>
              </div>

              {/* Telegram */}
              <div className="pt-8 opacity-50 pointer-events-none">
                <h4 className="text-white font-semibold text-sm mb-2">Telegram Agent Notifications</h4>
                <p className="text-zinc-500 text-xs mb-4">Link your Telegram account to receive notifications about your agent rebalancing and updates.</p>

                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 flex flex-col items-center justify-center gap-4">
                  <Send className="h-8 w-8 text-zinc-600" />
                  <Button variant="outline" className="w-full max-w-xs border-white/10 text-zinc-400">Link Telegram</Button>
                </div>
              </div>

            </div>

          </TabsContent>
        </Tabs>
      </div>
    </MultiSidebarLayout>
  );
}
