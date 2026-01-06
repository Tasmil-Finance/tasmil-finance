# Generative UI Guide

This document explains how the Generative UI system works in our application, covering the complete flow from backend to frontend rendering and state persistence.

## Overview

Generative UI allows AI agents to emit rich, interactive UI components instead of just text responses. This enables features like:
- Interactive staking operations with wallet integration
- Real-time data visualization
- Human-in-the-loop confirmations

## Architecture

```
User Request → AI Agent (Python) → Tool Call → UI Message → Frontend Component
```

## Key Concepts

### 1. UI Messages vs Tool Messages

| Type | Purpose | Storage |
|------|---------|---------|
| **UI Message** | Render custom components | `values.ui[]` |
| **Tool Message** | Persist state from frontend | `thread.messages[]` |

### 2. Component Registry

Frontend maintains a `ComponentMap` that maps UI names to React components:

```typescript
// apps/frontend/src/custom-components/index.tsx
const ComponentMap = {
  "staking-operation-result": StakingOperationResult,
  "staking-result": StakingResult,
  "bridge-result": BridgeResult,
  // ...
};
```

### 3. Tool → UI Mapping (Backend)

Backend defines which tool triggers which UI component:

```python
# apps/ai/app/builtin/staking_agent/graph.py
TOOL_UI_MAP = {
    "u2u_staking_delegate": "staking-operation-result",
    "u2u_staking_undelegate": "staking-operation-result",
    "u2u_staking_get_user_stake": "staking-result",
    # ...
}
```

## Data Flow

### Step 1: Backend Emits UI Message

```python
# In agent node after tool execution
push_ui_message(ui_name, {
    "result": parse_mcp_result(str(result)),
    "toolType": f"tool-{tc['name']}"
}, message=response)  # message parameter links UI to AI message
```

The `message=response` parameter is crucial - it automatically sets `metadata.message_id` from `response.id`.

### Step 2: Thread State Structure

```json
{
  "messages": [
    { "id": "msg_1", "type": "human", "content": "Stake 100 U2U to validator 5" },
    { "id": "msg_2", "type": "ai", "tool_calls": [{ "id": "call_abc123", ... }] },
    { "id": "msg_3", "type": "tool", "tool_call_id": "call_abc123", "content": "..." }
  ],
  "ui": [
    {
      "id": "ui_xyz789",
      "name": "staking-operation-result",
      "props": {
        "result": { "action": "delegate", "validatorID": 5, ... },
        "toolType": "tool-u2u_staking_delegate"
      },
      "metadata": {
        "message_id": "msg_2"
      }
    }
  ]
}
```

### Step 3: Frontend Rendering

```typescript
// apps/frontend/src/components/thread/messages/ai.tsx

function CustomComponent({ message, thread }) {
  const { values } = useStreamContext();
  
  // Filter UI components that belong to current message
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id
  );

  return customComponents.map((customComponent) => (
    <LoadExternalComponent
      key={customComponent.id}
      stream={thread}
      message={customComponent}
      components={ComponentMap}
    />
  ));
}
```

`LoadExternalComponent` (from `@langchain/langgraph-sdk/react-ui`):
1. Looks up `ComponentMap[message.name]`
2. Renders the component with `message.props`

## State Persistence Pattern

For interactive components that need to persist state (e.g., transaction results), we use Tool Messages as a storage mechanism.

### Why Tool Messages?

Custom UI components don't have their own persistent state. Tool Messages provide a way to:
- Persist data into thread history
- Restore UI state on page reload
- Link data to the original tool call via `tool_call_id`

### Implementation

```typescript
// apps/frontend/src/custom-components/staking-operation.tsx

const DO_NOT_RENDER_ID_PREFIX = "__do_not_render__";

// Save transaction result
const saveTransactionResult = (result: TransactionResult) => {
  thread.submit({}, {
    command: {
      update: {
        messages: [{
          type: "tool",
          tool_call_id: effectiveToolCallId,  // Links to original tool call
          id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,  // Prefix prevents rendering
          name: "staking-transaction-result",
          content: JSON.stringify(result),
        }]
      }
    }
  });
};

// Restore state on mount
useEffect(() => {
  const toolResponse = thread.messages.findLast(
    (msg) => msg.type === "tool" && msg.tool_call_id === effectiveToolCallId
  );
  
  if (toolResponse?.content) {
    const parsedContent = JSON.parse(toolResponse.content);
    if (parsedContent.hash) {
      setExecutionResult(parsedContent);  // Restore completed state
    }
  }
}, []);
```

### DO_NOT_RENDER Prefix

Messages with `id` starting with `__do_not_render__` (or `do-not-render-`) are:
- Stored in thread history for persistence
- NOT rendered as chat messages in the UI
- Used purely for state storage

### Thread State After User Action

```json
{
  "messages": [
    { "type": "human", "content": "Stake 100 U2U..." },
    { "type": "ai", "tool_calls": [{ "id": "call_abc123" }] },
    { "type": "tool", "tool_call_id": "call_abc123", "content": "..." },
    // ↓ Added by frontend after transaction success
    {
      "type": "tool",
      "id": "__do_not_render__uuid-xyz-789",
      "tool_call_id": "call_abc123",
      "name": "staking-transaction-result",
      "content": "{\"success\":true,\"hash\":\"0xabc...\",\"message\":\"Transaction successful!\"}"
    }
  ]
}
```

## Complete Example: Staking Flow

### 1. User Request
```
"Stake 100 U2U to validator 5"
```

### 2. Backend Processing
```python
# AI calls tool
response = await model.bind_tools(tools).invoke(messages)
# response.tool_calls = [{ id: "call_abc123", name: "u2u_staking_delegate", args: {...} }]

# Execute tool
result = await tool.ainvoke(tc["args"])

# Emit UI
push_ui_message("staking-operation-result", {
    "result": {
        "action": "delegate",
        "validatorID": 5,
        "amount": "100",
        "requiresWallet": True
    },
    "toolType": "tool-u2u_staking_delegate"
}, message=response)
```

### 3. Frontend Renders StakingOperation
```
┌─────────────────────────────────────┐
│  🪙 Delegate Stake                  │
│  Ready to stake 100 U2U...          │
│                                     │
│  Validator ID:        5             │
│  Amount:              100 U2U       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       [ Stake U2U ]         │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 4. User Clicks "Stake U2U"
- Component calls wallet hook
- Transaction executes on blockchain
- Result saved to thread via Tool Message

### 5. UI Updates to Completed State
```
┌─────────────────────────────────────┐
│  ✅ Transaction Completed           │
│  Delegate Stake was successful      │
│                                     │
│  Validator ID:        5             │
│  Amount:              100 U2U       │
│  Transaction Hash:    0xabc...def   │
│                       [↗ Explorer]  │
└─────────────────────────────────────┘
```

### 6. Page Reload
- Component mounts
- Reads Tool Message from `thread.messages`
- Restores completed state automatically

## Creating New Custom Components

### 1. Create Component File

```typescript
// apps/frontend/src/custom-components/my-component.tsx
export default function MyComponent({ result, toolType }: Props) {
  const thread = useStreamContext();
  // ... component logic
}
```

### 2. Register in ComponentMap

```typescript
// apps/frontend/src/custom-components/index.tsx
import MyComponent from "./my-component";

const ComponentMap = {
  "my-component": MyComponent,
  // ...
};
```

### 3. Add Backend Mapping

```python
# In your agent's graph.py
TOOL_UI_MAP = {
    "my_tool_name": "my-component",
}
```

### 4. Emit UI in Agent

```python
push_ui_message("my-component", {
    "result": {...},
    "toolType": "tool-my_tool_name"
}, message=response)
```

## References

- [LangGraph Generative UI Docs](https://langchain-ai.github.io/langgraph/cloud/how-tos/generative_ui_react/)
- [Example: langgraphjs-gen-ui-examples](../../example/langgraphjs-gen-ui-examples/)
- [assistant-ui Stockbroker Tutorial](https://www.assistant-ui.com/docs/runtimes/langgraph/tutorial/introduction)
