"use client";

import { useState } from "react";
import { AIReasoning } from "@/features/chat/components/ai/ai-reasoning";
import { AITask, AITaskItem, AITaskList } from "@/features/chat/components/ai/ai-task";
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
