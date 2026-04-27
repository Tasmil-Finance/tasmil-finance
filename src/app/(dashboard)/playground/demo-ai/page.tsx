"use client";

import { useState } from "react";
import { AIReasoning } from "@/features/chat/components/ai/ai-reasoning";
import { AITask, AITaskItem, AITaskList } from "@/features/chat/components/ai/ai-task";
import { ClarifyCard } from "@/features/chat/components/flow/clarify-card";
import { WelcomeRewardDialog } from "@/features/welcome-reward/components/welcome-reward-dialog";
import { Button } from "@/shared/ui/button";

/**
 * Demo page showing how to use the AI Reasoning and AI Task components.
 *
 * This demonstrates the shadcn.io/ai inspired components for:
 * 1. AI Reasoning - Collapsible thinking blocks
 * 2. AI Task - Todo/task list display
 */
export default function AIDemoPage() {
  const [isThinking, setIsThinking] = useState(false);
  const [taskStatus, setTaskStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [showReward, setShowReward] = useState(true);

  const startThinking = () => {
    setIsThinking(true);
    setTimeout(() => setIsThinking(false), 3000);
  };

  const runTask = () => {
    setTaskStatus("in_progress");
    setTimeout(() => setTaskStatus("completed"), 2000);
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="space-y-4">
        <h1 className="font-bold text-3xl">AI Components Demo</h1>
        <p className="text-muted-foreground">
          Inspired by{" "}
          <a
            href="https://www.shadcn.io/ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            shadcn.io/ai
          </a>
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold text-2xl">Welcome Reward Dialog</h2>
            <p className="text-muted-foreground text-sm">
              Modal dialog shown on first chat visit
            </p>
          </div>

          <div className="space-y-4">
            <Button onClick={() => setShowReward(true)}>
              Open Welcome Reward Dialog
            </Button>

            <WelcomeRewardDialog
              open={showReward}
              status={{
                reserved: true,
                welcomeCardSeen: false,
                currentVolumeUsd: 6.5,
                targetVolumeUsd: 10,
                progressPercent: 65,
                unlocked: false,
                unlockedAt: null,
              }}
              onDismiss={() => setShowReward(false)}
              onOpen={() => console.warn("[WelcomeReward] View details clicked")}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold text-2xl">AI Reasoning</h2>
            <p className="text-muted-foreground text-sm">
              Collapsible thinking blocks that show AI reasoning process
            </p>
          </div>

          <div className="space-y-4">
            <Button onClick={startThinking}>{isThinking ? "Thinking..." : "Start Thinking"}</Button>

            <AIReasoning duration={12} isStreaming={isThinking}>
              Let me analyze this swap opportunity step by step:
              {"\n\n"}
              1. **Current XLM Price**: $0.089 USDC
              {"\n"}
              2. **Swap Amount**: 1000 XLM = $89 USDC
              {"\n"}
              3. **Network Fees**: ~0.00001 XLM
              {"\n\n"}
              **Best Swap Route**: Using Stellar DEX via path payment
              {"\n\n"}
              The most efficient way would be to use the native Stellar DEX which has deep liquidity
              for XLM/USDC pairs. After the swap, we'll stake the USDC in Aqua protocol for 8.5%
              APY.
            </AIReasoning>

            <AIReasoning duration={8} defaultOpen={false}>
              This is a collapsed reasoning block. Click to expand and see the AI's thought process.
            </AIReasoning>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold text-2xl">AI Task</h2>
            <p className="text-muted-foreground text-sm">
              Task progress display with collapsible details
            </p>
          </div>

          <div className="space-y-4">
            <Button onClick={runTask}>
              {taskStatus === "in_progress" ? "Running..." : "Run Task"}
            </Button>

            <AITask title="Swap XLM to USDC then stake" status={taskStatus} defaultOpen={true}>
              <AITaskList title="Steps">
                <AITaskItem
                  status={taskStatus === "completed" ? "completed" : "in_progress"}
                  file="stellar_swap.ts"
                >
                  Execute XLM to USDC swap
                </AITaskItem>
                <AITaskItem
                  status={taskStatus === "completed" ? "completed" : "pending"}
                  file="staking_contract.ts"
                >
                  Stake USDC in Aqua protocol
                </AITaskItem>
                <AITaskItem status={taskStatus === "completed" ? "completed" : "pending"}>
                  Confirm transaction and update balance
                </AITaskItem>
              </AITaskList>
            </AITask>

            <AITask title="Find best yield opportunities" status="completed" defaultOpen={true}>
              <AITaskList>
                <AITaskItem status="completed" file="protocols/aqua.ts">
                  Scanned Aqua protocol: 8.5% APY on USDC
                </AITaskItem>
                <AITaskItem status="completed" file="protocols/yieldblox.ts">
                  Scanned YieldBlox: 7.2% APY on USDC
                </AITaskItem>
                <AITaskItem status="completed">Best option: Aqua protocol (8.5% APY)</AITaskItem>
              </AITaskList>
            </AITask>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold text-2xl">Clarify Card (Single Question)</h2>
            <p className="text-muted-foreground text-sm">
              Single question — tap option to submit immediately, no stepper
            </p>
          </div>

          <div className="space-y-4">
            <ClarifyCard
              questions={[{
                field_name: "pool",
                question: "Which pool would you like to deposit into?",
                input_type: "select",
                suggestions: [
                  {
                    label: "USDC Lending (Fixed Pool) · Blend · 9.3% APY",
                    value: { protocol: "blend", pool: "fixed" },
                    tags: ["recommended"],
                    description: "Low risk lending pool",
                  },
                  {
                    label: "XLM/USDC LP · Aquarius · 12.4% APY",
                    value: { protocol: "aquarius", pool: "xlm-usdc" },
                    tags: ["high_tvl"],
                    description: "AMM liquidity pool",
                  },
                  {
                    label: "XLM/AQUA LP · Aquarius · 18.5% APY",
                    value: { protocol: "aquarius", pool: "xlm-aqua" },
                    tags: ["il_risk"],
                    description: "Higher yield, impermanent loss risk",
                  },
                  {
                    label: "USDC Stable Vault · DeFindex · 8.5% APY",
                    value: { protocol: "defindex", pool: "usdc-vault" },
                  },
                ],
              }]}
              onSubmit={(answers) => console.log("[ClarifyCard single] submitted:", answers)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold text-2xl">Multi-Clarify Card (Multiple Questions)</h2>
            <p className="text-muted-foreground text-sm">
              Multiple questions in one card — used when 2+ fields are missing.
              AI generates questions and options dynamically.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg text-muted-foreground">Select + Select</h3>
            <ClarifyCard
              questions={[
                {
                  field_name: "pool",
                  question: "Which pool?",
                  input_type: "select",
                  suggestions: [
                    {
                      label: "USDC Lending (Fixed Pool) · Blend · 9.3% APY",
                      value: { label: "USDC Lending (Fixed Pool) · Blend · 9.3% APY" },
                      tags: ["recommended"],
                    },
                    {
                      label: "XLM/AQUA LP · Aquarius · 18.5% APY",
                      value: { label: "XLM/AQUA LP · Aquarius · 18.5% APY" },
                      tags: ["il_risk"],
                    },
                    {
                      label: "USDC Stable Vault · DeFindex · 8.5% APY",
                      value: { label: "USDC Stable Vault · DeFindex · 8.5% APY" },
                    },
                  ],
                },
                {
                  field_name: "amount",
                  question: "How much?",
                  input_type: "select",
                  suggestions: [
                    { label: "5 USDC", value: { label: "5 USDC" } },
                    { label: "10 USDC", value: { label: "10 USDC" } },
                    { label: "50 USDC", value: { label: "50 USDC" } },
                    { label: "100 USDC", value: { label: "100 USDC" } },
                  ],
                },
              ]}
              onSubmit={(answers) => console.log("[ClarifyCard select+select] submitted:", answers)}
            />

            <h3 className="font-medium text-lg text-muted-foreground">Select + Text Input</h3>
            <ClarifyCard
              questions={[
                {
                  field_name: "pair",
                  question: "Which pair?",
                  input_type: "select",
                  suggestions: [
                    { label: "XLM → USDC", value: { label: "XLM → USDC" } },
                    { label: "USDC → XLM", value: { label: "USDC → XLM" } },
                    { label: "XLM → AQUA", value: { label: "XLM → AQUA" } },
                  ],
                },
                {
                  field_name: "amount",
                  question: "How much do you want to swap?",
                  input_type: "text",
                  placeholder: "e.g. 100 XLM",
                },
              ]}
              onSubmit={(answers) => console.log("[ClarifyCard select+text] submitted:", answers)}
            />

            <h3 className="font-medium text-lg text-muted-foreground">3 Questions</h3>
            <ClarifyCard
              questions={[
                {
                  field_name: "asset",
                  question: "Which asset to bridge?",
                  input_type: "select",
                  suggestions: [
                    { label: "USDC", value: { label: "USDC" }, description: "Balance: 250" },
                    { label: "XLM", value: { label: "XLM" }, description: "Balance: 1,200" },
                  ],
                },
                {
                  field_name: "destination",
                  question: "Destination chain?",
                  input_type: "select",
                  suggestions: [
                    { label: "Ethereum", value: { label: "Ethereum" } },
                    { label: "Arbitrum", value: { label: "Arbitrum" }, tags: ["recommended"] },
                    { label: "Base", value: { label: "Base" } },
                  ],
                },
                {
                  field_name: "amount",
                  question: "Amount to bridge?",
                  input_type: "text",
                  placeholder: "e.g. 100",
                },
              ]}
              onSubmit={(answers) => console.log("[ClarifyCard 3Q] submitted:", answers)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold text-2xl">Combined Example</h2>
            <p className="text-muted-foreground text-sm">Reasoning + Task working together</p>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="text-sm">
              <strong>User:</strong> Swap XLM to USDC then stake it
            </div>

            <AIReasoning duration={5} defaultOpen={false}>
              I'll help you swap XLM to USDC and stake the resulting USDC. Here's my plan:
              {"\n\n"}
              1. First, I'll check current swap rates for XLM to USDC
              {"\n"}
              2. Execute the swap using the best available route
              {"\n"}
              3. Find the highest yield staking opportunity for USDC
              {"\n"}
              4. Stake the USDC and confirm the transaction
            </AIReasoning>

            <AITask title="Discover Swap Rates" status="completed" defaultOpen={false}>
              <AITaskList>
                <AITaskItem status="completed">
                  Stellar DEX: 1 XLM = 0.089 USDC (0.1% fee)
                </AITaskItem>
                <AITaskItem status="completed">Best rate: Stellar DEX path payment</AITaskItem>
              </AITaskList>
            </AITask>

            <AITask title="Execute the Swap" status="completed">
              <AITaskList>
                <AITaskItem status="completed" file="swap_xlm_usdc.ts">
                  Swapped 1000 XLM → 88.91 USDC
                </AITaskItem>
                <AITaskItem status="completed">Transaction confirmed: ABC123DEF456</AITaskItem>
              </AITaskList>
            </AITask>

            <AITask title="Discover Stake Opportunities" status="completed" defaultOpen={false}>
              <AITaskList>
                <AITaskItem status="completed">Aqua Protocol: 8.5% APY</AITaskItem>
                <AITaskItem status="completed">YieldBlox: 7.2% APY</AITaskItem>
                <AITaskItem status="completed">Selected: Aqua Protocol (highest yield)</AITaskItem>
              </AITaskList>
            </AITask>

            <AITask title="Stake the USDC" status="completed">
              <AITaskList>
                <AITaskItem status="completed" file="stake_usdc.ts">
                  Staked 88.91 USDC in Aqua Protocol
                </AITaskItem>
                <AITaskItem status="completed">Current APY: 8.5%</AITaskItem>
                <AITaskItem status="completed">Estimated yearly earnings: 7.56 USDC</AITaskItem>
              </AITaskList>
            </AITask>

            <div className="text-sm">
              <strong>Assistant:</strong> I've successfully swapped your 1000 XLM to 88.91 USDC and
              staked it in Aqua Protocol at 8.5% APY. You'll earn approximately 7.56 USDC per year!
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
