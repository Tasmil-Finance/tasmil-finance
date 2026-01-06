# Custom UI Components - Backend Integration Guide

This guide shows how to emit custom UI components from your LangGraph backend (Python or TypeScript) to render in the Agent Chat UI (React frontend).

## Quick Start

### Python (apps/ai)

```python
from langgraph.graph.ui import push_ui_message

# In your agent node:
push_ui_message(
    "staking-result",  # Component name
    {
        "result": {"success": True, "balance": "1000", "unit": "U2U"},
        "toolType": "tool-getAccountBalance"
    },
    message=ai_message
)
```

### TypeScript (apps/mcp)

```typescript
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";

// In your agent node:
const ui = typedUi<typeof ComponentMap>(config);
ui.push(
  { name: "staking-result", props: { result: {...}, toolType: "..." } },
  { message }
);
```

## Overview

Generative UI allows agents to go beyond text and generate rich user interfaces. This enables creating more interactive and context-aware applications where the UI adapts based on the conversation flow and AI responses.

This implementation uses **Local Components** approach where UI components are registered on the frontend and triggered by messages from your backend. This provides:

- ✅ Type-safe component rendering
- ✅ No network overhead for UI code
- ✅ Fast, responsive UI updates
- ✅ Easy to test and maintain
- ✅ Style isolation via shadow DOM

## Architecture

```
Backend (LangGraph)                 React Frontend (Agent Chat UI)
─────────────────────              ────────────────────────────────
Your Agent Node                    LoadExternalComponent
    ↓                                      ↓
push_ui_message() / ui.push()      ComponentMap (Local Registry)
    ↓                                      ↓
Stream to Frontend    ────────>    Render Component
```

## Available Components

| Component Name | Purpose | Tool Types |
|---|---|---|
| `bridge-result` | Cross-chain bridge operations | `tool-getBridgePairs`, `tool-getBridgeQuote` |
| `yield-result` | Yield farming opportunities | `tool-getYieldPools`, `tool-getStablecoinYields` |
| `research-result` | Crypto research and price data | `tool-getCryptoPrice`, `tool-getTopCoins` |
| `staking-result` | Staking information | `tool-getAccountBalance`, `tool-getCurrentEpoch` |
| `staking-operation-result` | Staking operations | `tool-delegateStake`, `tool-claimRewards` |

## Backend Setup

### Python

#### 1. Install Dependencies

```bash
pip install langgraph langchain-core langchain-openai
```

#### 2. Import Required Modules

```python
import uuid
from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import AIMessage, BaseMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message
```

#### 3. Define State with UI Support

```python
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]
```

#### 4. Create Agent Node with UI Emission

```python
async def my_agent_node(state: AgentState):
    """Agent node that emits custom UI components."""
    
    # Your agent logic here
    response = "Here's the bridge information you requested."
    
    # Create AI message
    message = AIMessage(
        id=str(uuid.uuid4()),
        content=response
    )
    
    # Emit UI elements associated with the message
    push_ui_message(
        "bridge-result",  # Component name from ComponentMap
        {
            "result": {
                "success": True,
                "pairs": [
                    {
                        "tokenName": "USDT",
                        "fromChainName": "Ethereum Mainnet",
                        "toChainName": "BSC Mainnet",
                        "minValue": {"uiValue": "10"},
                        "maxValue": {"uiValue": "100000"}
                    }
                ],
                "totalPairs": 1
            },
            "toolType": "tool-getBridgePairs"
        },
        message=message
    )
    
    return {"messages": [message]}
```

#### 5. Build and Compile Graph

```python
workflow = StateGraph(AgentState)
workflow.add_node("agent", my_agent_node)
workflow.add_edge("__start__", "agent")
app = workflow.compile()
```

### TypeScript

#### 1. Install Dependencies

```bash
npm install @langchain/langgraph @langchain/langgraph-sdk
```

#### 2. Import Required Modules

```typescript
import {
  Annotation,
  MessagesAnnotation,
  StateGraph,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";
import {
  typedUi,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui/server";
import { v4 as uuidv4 } from "uuid";
import type ComponentMap from "./ui.js";
```

#### 3. Define State with UI Support

```typescript
const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  ui: Annotation({ reducer: uiMessageReducer, default: () => [] }),
});
```

#### 4. Create Agent Node with UI Emission

```typescript
async function myAgentNode(
  state: typeof AgentState.State,
  config: LangGraphRunnableConfig
): Promise<typeof AgentState.Update> {
  // Provide the type of the component map to ensure type safety
  const ui = typedUi<typeof ComponentMap>(config);

  const response = {
    id: uuidv4(),
    type: "ai",
    content: "Here's the bridge information you requested.",
  };

  // Emit UI elements associated with the AI message
  ui.push(
    {
      name: "bridge-result",
      props: {
        result: {
          success: true,
          pairs: [
            {
              tokenName: "USDT",
              fromChainName: "Ethereum Mainnet",
              toChainName: "BSC Mainnet",
              minValue: { uiValue: "10" },
              maxValue: { uiValue: "100000" },
            },
          ],
          totalPairs: 1,
        },
        toolType: "tool-getBridgePairs",
      },
    },
    { message: response }
  );

  return { messages: [response] };
}
```

#### 5. Build and Compile Graph

```typescript
export const graph = new StateGraph(AgentState)
  .addNode("agent", myAgentNode)
  .addEdge("__start__", "agent")
  .compile();
```

## Component Usage Examples

### Python Examples

#### 1. Bridge Result

```python
async def show_bridge_pairs(state: AgentState):
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Found available bridge routes."
    )
    
    push_ui_message(
        "bridge-result",
        {
            "result": {
                "success": True,
                "pairs": [
                    {
                        "tokenName": "USDC",
                        "fromChainName": "Ethereum Mainnet",
                        "toChainName": "Polygon Mainnet",
                        "minValue": {"uiValue": "5"},
                        "maxValue": {"uiValue": "50000"}
                    }
                ],
                "totalPairs": 1
            },
            "toolType": "tool-getBridgePairs"
        },
        message=message
    )
    
    return {"messages": [message]}
```

#### 2. Yield Result

```python
async def show_yield_pools(state: AgentState):
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Here are the best yield opportunities."
    )
    
    push_ui_message(
        "yield-result",
        {
            "result": {
                "success": True,
                "pools": [
                    {
                        "symbol": "USDC-USDT",
                        "chain": "Ethereum",
                        "project": "Uniswap V3",
                        "apy": 15.5,
                        "tvlUsd": 125000000,
                        "apyBase": 12.3,
                        "apyReward": 3.2,
                        "ilRisk": "Low",
                        "stablecoin": True
                    }
                ],
                "totalPools": 1
            },
            "toolType": "tool-getYieldPools"
        },
        message=message
    )
    
    return {"messages": [message]}
```

#### 3. Research Result (Crypto Price)

```python
async def show_crypto_price(state: AgentState):
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Here's the current Bitcoin price."
    )
    
    push_ui_message(
        "research-result",
        {
            "result": {
                "success": True,
                "coin": {
                    "name": "Bitcoin",
                    "symbol": "BTC",
                    "currentPrice": 45000,
                    "priceChange24h": 2.5,
                    "priceChange7d": -1.2,
                    "priceChange30d": 8.3,
                    "marketCap": 880000000000,
                    "marketCapRank": 1
                }
            },
            "toolType": "tool-getCryptoPrice"
        },
        message=message
    )
    
    return {"messages": [message]}
```

#### 4. Staking Result

```python
async def show_account_balance(state: AgentState):
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Here's your wallet balance."
    )
    
    push_ui_message(
        "staking-result",
        {
            "result": {
                "success": True,
                "walletAddress": "0x1234...5678",
                "balance": "1250.5678",
                "unit": "U2U"
            },
            "toolType": "tool-getAccountBalance"
        },
        message=message
    )
    
    return {"messages": [message]}
```

#### 5. Staking Operation Result

```python
async def show_staking_operation(state: AgentState):
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Ready to delegate your stake."
    )
    
    push_ui_message(
        "staking-operation-result",
        {
            "result": {
                "success": True,
                "action": "delegate",
                "validatorID": 5,
                "amount": 1000,
                "amountFormatted": "1,000 U2U",
                "message": "Ready to delegate 1,000 U2U to Validator #5",
                "requiresWallet": True,
                "requiresConfirmation": True
            },
            "toolType": "tool-delegateStake"
        },
        message=message
    )
    
    return {"messages": [message]}
```

### TypeScript Examples

#### 1. Bridge Result

```typescript
async function showBridgePairs(
  state: typeof AgentState.State,
  config: LangGraphRunnableConfig
): Promise<typeof AgentState.Update> {
  const ui = typedUi<typeof ComponentMap>(config);

  const message = {
    id: uuidv4(),
    type: "ai",
    content: "Found available bridge routes.",
  };

  ui.push(
    {
      name: "bridge-result",
      props: {
        result: {
          success: true,
          pairs: [
            {
              tokenName: "USDC",
              fromChainName: "Ethereum Mainnet",
              toChainName: "Polygon Mainnet",
              minValue: { uiValue: "5" },
              maxValue: { uiValue: "50000" },
            },
          ],
          totalPairs: 1,
        },
        toolType: "tool-getBridgePairs",
      },
    },
    { message }
  );

  return { messages: [message] };
}
```

## Complete Example: DeFi Agent

### Python

```python
import uuid
from typing import Annotated, Literal, Sequence, TypedDict

from langchain_core.messages import AIMessage, BaseMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]


def router(state: AgentState) -> Literal["bridge", "yield", "research", "staking"]:
    """Route to appropriate handler based on user input."""
    last_message = state["messages"][-1].content.lower()
    
    if "bridge" in last_message:
        return "bridge"
    elif "yield" in last_message or "apy" in last_message:
        return "yield"
    elif "price" in last_message or "bitcoin" in last_message:
        return "research"
    elif "stake" in last_message or "validator" in last_message:
        return "staking"
    return "research"


async def bridge_handler(state: AgentState):
    """Handle bridge queries."""
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Here are available bridge routes."
    )
    
    push_ui_message(
        "bridge-result",
        {
            "result": {
                "success": True,
                "pairs": [
                    {
                        "tokenName": "USDT",
                        "fromChainName": "Ethereum Mainnet",
                        "toChainName": "BSC Mainnet",
                        "minValue": {"uiValue": "10"},
                        "maxValue": {"uiValue": "100000"}
                    }
                ],
                "totalPairs": 1
            },
            "toolType": "tool-getBridgePairs"
        },
        message=message
    )
    
    return {"messages": [message]}


async def yield_handler(state: AgentState):
    """Handle yield queries."""
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Here are the best yield opportunities."
    )
    
    push_ui_message(
        "yield-result",
        {
            "result": {
                "success": True,
                "pools": [
                    {
                        "symbol": "USDC-USDT",
                        "chain": "Ethereum",
                        "project": "Uniswap V3",
                        "apy": 15.5,
                        "tvlUsd": 125000000,
                        "apyBase": 12.3,
                        "apyReward": 3.2,
                        "ilRisk": "Low",
                        "stablecoin": True
                    }
                ],
                "totalPools": 1
            },
            "toolType": "tool-getYieldPools"
        },
        message=message
    )
    
    return {"messages": [message]}


async def research_handler(state: AgentState):
    """Handle research queries."""
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Here's the current Bitcoin price."
    )
    
    push_ui_message(
        "research-result",
        {
            "result": {
                "success": True,
                "coin": {
                    "name": "Bitcoin",
                    "symbol": "BTC",
                    "currentPrice": 45000,
                    "priceChange24h": 2.5,
                    "marketCap": 880000000000,
                    "marketCapRank": 1
                }
            },
            "toolType": "tool-getCryptoPrice"
        },
        message=message
    )
    
    return {"messages": [message]}


async def staking_handler(state: AgentState):
    """Handle staking queries."""
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Here's your wallet balance."
    )
    
    push_ui_message(
        "staking-result",
        {
            "result": {
                "success": True,
                "walletAddress": "0x1234...5678",
                "balance": "1250.5678",
                "unit": "U2U"
            },
            "toolType": "tool-getAccountBalance"
        },
        message=message
    )
    
    return {"messages": [message]}


# Build graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("bridge", bridge_handler)
workflow.add_node("yield", yield_handler)
workflow.add_node("research", research_handler)
workflow.add_node("staking", staking_handler)

# Add conditional routing
workflow.add_conditional_edges(
    "__start__",
    router,
    {
        "bridge": "bridge",
        "yield": "yield",
        "research": "research",
        "staking": "staking"
    }
)

# Compile
app = workflow.compile()

# Test
result = await app.ainvoke({
    "messages": [{"role": "user", "content": "Show me bridge options"}],
    "ui": []
})

print("Messages:", result["messages"])
print("UI:", result["ui"])
```

### TypeScript

```typescript
import {
  Annotation,
  MessagesAnnotation,
  StateGraph,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";
import {
  typedUi,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui/server";
import { v4 as uuidv4 } from "uuid";
import type ComponentMap from "./ui.js";

const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  ui: Annotation({ reducer: uiMessageReducer, default: () => [] }),
});

function router(
  state: typeof AgentState.State
): "bridge" | "yield" | "research" | "staking" {
  const lastMessage = state.messages[state.messages.length - 1].content
    .toString()
    .toLowerCase();

  if (lastMessage.includes("bridge")) return "bridge";
  if (lastMessage.includes("yield") || lastMessage.includes("apy"))
    return "yield";
  if (lastMessage.includes("price") || lastMessage.includes("bitcoin"))
    return "research";
  if (lastMessage.includes("stake") || lastMessage.includes("validator"))
    return "staking";
  return "research";
}

async function bridgeHandler(
  state: typeof AgentState.State,
  config: LangGraphRunnableConfig
): Promise<typeof AgentState.Update> {
  const ui = typedUi<typeof ComponentMap>(config);

  const message = {
    id: uuidv4(),
    type: "ai",
    content: "Here are available bridge routes.",
  };

  ui.push(
    {
      name: "bridge-result",
      props: {
        result: {
          success: true,
          pairs: [
            {
              tokenName: "USDT",
              fromChainName: "Ethereum Mainnet",
              toChainName: "BSC Mainnet",
              minValue: { uiValue: "10" },
              maxValue: { uiValue: "100000" },
            },
          ],
          totalPairs: 1,
        },
        toolType: "tool-getBridgePairs",
      },
    },
    { message }
  );

  return { messages: [message] };
}

async function yieldHandler(
  state: typeof AgentState.State,
  config: LangGraphRunnableConfig
): Promise<typeof AgentState.Update> {
  const ui = typedUi<typeof ComponentMap>(config);

  const message = {
    id: uuidv4(),
    type: "ai",
    content: "Here are the best yield opportunities.",
  };

  ui.push(
    {
      name: "yield-result",
      props: {
        result: {
          success: true,
          pools: [
            {
              symbol: "USDC-USDT",
              chain: "Ethereum",
              project: "Uniswap V3",
              apy: 15.5,
              tvlUsd: 125000000,
              apyBase: 12.3,
              apyReward: 3.2,
              ilRisk: "Low",
              stablecoin: true,
            },
          ],
          totalPairs: 1,
        },
        toolType: "tool-getYieldPools",
      },
    },
    { message }
  );

  return { messages: [message] };
}

// Build graph
export const graph = new StateGraph(AgentState)
  .addNode("bridge", bridgeHandler)
  .addNode("yield", yieldHandler)
  .addNode("research", researchHandler)
  .addNode("staking", stakingHandler)
  .addConditionalEdges("__start__", router, {
    bridge: "bridge",
    yield: "yield",
    research: "research",
    staking: "staking",
  })
  .compile();
```

## Advanced Features

### Streaming UI Updates

You can stream UI updates before the node execution is finished. This is useful when updating the UI component as the LLM is generating the response.

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessageChunk

async def writer_node(state: AgentState):
    model = ChatAnthropic(model="claude-sonnet-4-5-20250929")
    
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Creating document..."
    )
    
    # Push initial UI message
    ui_msg = push_ui_message(
        "writer",
        {"title": "Document", "content": ""},
        message=message
    )
    ui_message_id = ui_msg["id"]
    
    # Stream content updates
    content_stream = model.with_config({"tags": ["nostream"]}).astream(
        "Create a document about AI"
    )
    
    content: AIMessageChunk | None = None
    async for chunk in content_stream:
        content = content + chunk if content else chunk
        
        # Update UI message with new content
        push_ui_message(
            "writer",
            {"content": content.text()},
            id=ui_message_id,
            message=message,
            merge=True  # Merge with existing props
        )
    
    return {"messages": [message]}
```

### Remove UI Messages

You can remove UI messages from state similar to how messages can be removed:

```python
from langgraph.graph.ui import remove_ui_message

async def cleanup_node(state: AgentState):
    # Remove a specific UI message by ID
    remove_ui_message(ui_message_id)
    return {}
```

## Error Handling

Always include error handling in your UI messages:

```python
async def safe_ui_emission(state: AgentState):
    try:
        # Your logic here
        data = await fetch_some_data()
        
        message = AIMessage(
            id=str(uuid.uuid4()),
            content="Success!"
        )
        
        push_ui_message(
            "bridge-result",
            {
                "result": {
                    "success": True,
                    "pairs": data
                },
                "toolType": "tool-getBridgePairs"
            },
            message=message
        )
        
    except Exception as e:
        message = AIMessage(
            id=str(uuid.uuid4()),
            content=f"Error: {str(e)}"
        )
        
        push_ui_message(
            "bridge-result",
            {
                "result": {
                    "success": False,
                    "error": str(e)
                },
                "toolType": "tool-getBridgePairs"
            },
            message=message
        )
    
    return {"messages": [message]}
```

## Best Practices

### 1. Always Link UI to Messages

Use the `message` parameter in `push_ui_message()` to link UI components to AI messages:

```python
push_ui_message("component-name", props, message=message)
```

### 2. Use Proper Tool Types

Each component expects specific `toolType` values. Check the component documentation for supported types.

### 3. Validate Data Structure

Ensure your data matches the expected props interface:

```python
# Good ✅
push_ui_message(
    "research-result",
    {
        "result": {
            "success": True,
            "coin": {
                "name": "Bitcoin",
                "symbol": "BTC",
                "currentPrice": 45000
            }
        },
        "toolType": "tool-getCryptoPrice"
    },
    message=message
)

# Bad ❌ - Missing required fields
push_ui_message(
    "research-result",
    {"result": {"price": 45000}},  # Incomplete data
    message=message
)
```

### 4. Handle Success and Error States

```python
if operation_successful:
    result = {"success": True, "data": data}
else:
    result = {"success": False, "error": error_message}
```

### 5. Use Async Functions

Always use `async def` for agent nodes to support streaming and async operations:

```python
async def my_node(state: AgentState):
    # Your async code here
    return {"messages": [message]}
```

## Testing

### Test Locally

1. Start your backend:
```bash
# Python
python your_agent.py

# TypeScript
npm run dev
```

2. Start Agent Chat UI:
```bash
cd example/agent-chat-ui
pnpm dev
```

3. Configure connection in `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ASSISTANT_ID=your-agent-id
```

4. Test in browser at `http://localhost:3000`

### Test UI Components

Visit `http://localhost:3000/test-ui` to see all components with mock data.

## Troubleshooting

### UI Not Rendering?

1. **Check component name**: Must match exactly in ComponentMap
2. **Verify data structure**: Ensure props match component interface
3. **Check message linking**: `message` parameter must be provided
4. **Browser console**: Look for errors in DevTools

### Data Not Displaying?

1. **Validate JSON structure**: Use proper Python dicts/lists
2. **Check field names**: Must match component props exactly
3. **Verify data types**: Numbers should be numbers, not strings (unless formatted)

### Component Shows Error?

1. **Check `success` field**: Should be `True` for success, `False` for errors
2. **Include `error` field**: When `success=False`, include error message
3. **Validate required fields**: Each component has required fields

## Component Props Reference

See individual component files for detailed props interfaces:

- `bridge-result.tsx` - Bridge result props
- `yield-result.tsx` - Yield result props
- `research-result.tsx` - Research result props
- `staking-result.tsx` - Staking result props
- `staking-operation-result.tsx` - Staking operation props

## Additional Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangSmith Generative UI](https://docs.langchain.com/langsmith/generative-ui-react)
- [Agent Chat UI Repository](https://github.com/langchain-ai/agent-chat-ui)

## Support

For issues or questions:
1. Check component test page at `/test-ui`
2. Review browser console for errors
3. Verify backend logs
4. Check data structure matches component props

---

**Happy building!** 🚀
