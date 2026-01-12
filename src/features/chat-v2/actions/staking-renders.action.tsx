"use client";

// 🎨 Staking tool renders
// - Read-only operations: useRenderToolCall (render backend tool calls)
// - Wallet operations: useHumanInTheLoop (HITL pattern)
//   This ensures transaction results are persisted in thread messages
// - followUp: true enables agent to continue after user responds

import { useRenderToolCall, useHumanInTheLoop } from "@copilotkit/react-core";
import { StakingInfoCard } from "./components";
import { StakingOperationCard } from "./components";

// Map CopilotKit status to our component status
type CopilotStatus = "complete" | "executing" | "inProgress";
type ComponentStatus = "pending" | "executing" | "complete" | "error" | "inProgress";

const mapStatus = (status: CopilotStatus): ComponentStatus => {
  if (status === "inProgress") return "executing";
  return status;
};

/**
 * Register all staking-related tool renders
 * - Read-only operations use useRenderToolCall (backend tools)
 * - Wallet operations use useHumanInTheLoop (frontend HITL)
 */
export function useStakingRenders() {
  // ============================================================================
  // READ-ONLY OPERATIONS - Use useRenderToolCall for backend tools
  // ============================================================================

  useRenderToolCall({
    name: "u2u_staking_get_user_stake",
    render: ({ args, result, status }) => (
      <StakingInfoCard
        type="user_stake"
        args={args}
        result={result}
        status={mapStatus(status)}
      />
    ),
  });

  useRenderToolCall({
    name: "u2u_staking_get_pending_rewards",
    render: ({ args, result, status }) => (
      <StakingInfoCard
        type="pending_rewards"
        args={args}
        result={result}
        status={mapStatus(status)}
      />
    ),
  });

  useRenderToolCall({
    name: "u2u_staking_get_unlocked_stake",
    render: ({ args, result, status }) => (
      <StakingInfoCard
        type="unlocked_stake"
        args={args}
        result={result}
        status={mapStatus(status)}
      />
    ),
  });

  useRenderToolCall({
    name: "u2u_staking_get_lockup_info",
    render: ({ args, result, status }) => (
      <StakingInfoCard
        type="lockup_info"
        args={args}
        result={result}
        status={mapStatus(status)}
      />
    ),
  });

  useRenderToolCall({
    name: "u2u_staking_get_rewards_stash",
    render: ({ args, result, status }) => (
      <StakingInfoCard
        type="rewards_stash"
        args={args}
        result={result}
        status={mapStatus(status)}
      />
    ),
  });

  // ============================================================================
  // WALLET OPERATIONS - Use useHumanInTheLoop
  // This creates frontend tools that pause execution until user signs transaction
  // Transaction result is sent back to agent via respond() and persisted
  // Description includes instruction for agent to say appropriate message
  // ============================================================================

  useHumanInTheLoop({
    name: "u2u_staking_delegate",
    description: "Stake tokens to a validator on U2U Network. When calling this tool, first tell the user: 'I've prepared the staking transaction for you. Please review the details and click the button to sign the transaction with your wallet.' User must sign the transaction.",
    parameters: [
      { name: "validatorID", type: "string", description: "Validator ID to stake to", required: true },
      { name: "amount", type: "string", description: "Amount to stake in wei", required: true },
    ],
    followUp: true,
    render: ({ args, status, respond, result }) => (
      <StakingOperationCard
        operation="delegate"
        args={args}
        result={result}
        status={mapStatus(status as CopilotStatus)}
        respond={respond}
      />
    ),
  });

  useHumanInTheLoop({
    name: "u2u_staking_undelegate",
    description: "Unstake tokens from a validator on U2U Network. When calling this tool, first tell the user: 'I've prepared the unstaking transaction. Please review the details and click the button to sign the transaction with your wallet.' User must sign the transaction.",
    parameters: [
      { name: "validatorID", type: "string", description: "Validator ID to unstake from", required: true },
      { name: "amount", type: "string", description: "Amount to unstake in wei", required: true },
      { name: "wrID", type: "string", description: "Withdrawal request ID", required: false },
    ],
    followUp: true,
    render: ({ args, status, respond, result }) => (
      <StakingOperationCard
        operation="undelegate"
        args={args}
        result={result}
        status={mapStatus(status as CopilotStatus)}
        respond={respond}
      />
    ),
  });

  useHumanInTheLoop({
    name: "u2u_staking_claim_rewards",
    description: "Claim pending staking rewards from a validator. When calling this tool, first tell the user: 'I've prepared the claim rewards transaction. Please review and click the button to sign the transaction with your wallet.' User must sign the transaction.",
    parameters: [
      { name: "validatorID", type: "string", description: "Validator ID to claim rewards from", required: true },
    ],
    followUp: true,
    render: ({ args, status, respond, result }) => (
      <StakingOperationCard
        operation="claim_rewards"
        args={args}
        result={result}
        status={mapStatus(status as CopilotStatus)}
        respond={respond}
      />
    ),
  });

  useHumanInTheLoop({
    name: "u2u_staking_restake_rewards",
    description: "Compound/restake rewards back to the validator. When calling this tool, first tell the user: 'I've prepared the restake rewards transaction. Please review and click the button to sign the transaction with your wallet.' User must sign the transaction.",
    parameters: [
      { name: "validatorID", type: "string", description: "Validator ID to restake rewards to", required: true },
    ],
    followUp: true,
    render: ({ args, status, respond, result }) => (
      <StakingOperationCard
        operation="restake_rewards"
        args={args}
        result={result}
        status={mapStatus(status as CopilotStatus)}
        respond={respond}
      />
    ),
  });

  useHumanInTheLoop({
    name: "u2u_staking_lock_stake",
    description: "Lock stake for bonus rewards. When calling this tool, first tell the user: 'I've prepared the lock stake transaction. Please review the lock duration and click the button to sign the transaction with your wallet.' User must sign the transaction.",
    parameters: [
      { name: "validatorID", type: "string", description: "Validator ID", required: true },
      { name: "amount", type: "string", description: "Amount to lock in wei", required: true },
      { name: "lockupDuration", type: "string", description: "Lock duration in seconds", required: true },
    ],
    followUp: true,
    render: ({ args, status, respond, result }) => (
      <StakingOperationCard
        operation="lock_stake"
        args={args}
        result={result}
        status={mapStatus(status as CopilotStatus)}
        respond={respond}
      />
    ),
  });
}
