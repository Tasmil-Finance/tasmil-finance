# AI Chat Components

Inspired by [shadcn.io/ai](https://www.shadcn.io/ai), these components provide production-ready UI for AI chat interfaces with thinking flows and task management.

## Components

### AIReasoning

Collapsible thinking blocks that show AI reasoning process.

**Features:**

- Auto-opens when streaming starts
- Shows shimmer effect while streaming
- Tracks thinking duration
- Auto-collapses when streaming finishes
- Manual expand/collapse support
- Markdown rendering via MarkdownText

**Usage:**

```tsx
import { AIReasoning } from "@/features/chat/components/ai/ai-reasoning";

// Basic usage
<AIReasoning duration={12} isStreaming={false}>
  Let me analyze this step by step...
</AIReasoning>

// Streaming mode (auto-opens)
<AIReasoning duration={5} isStreaming={true}>
  Thinking about the best approach...
</AIReasoning>

// Controlled state
<AIReasoning duration={8} defaultOpen={false}>
  This starts collapsed. Click to expand.
</AIReasoning>
```

**Props:**

| Prop        | Type      | Default  | Description                                       |
| ----------- | --------- | -------- | ------------------------------------------------- |
| children    | ReactNode | required | Content to display (supports markdown strings)    |
| duration    | number    | -        | Duration in seconds                               |
| isStreaming | boolean   | false    | Whether content is still streaming                |
| defaultOpen | boolean   | auto     | Default open state (auto-managed if not provided) |
| className   | string    | -        | Additional CSS classes                            |

---

### AITask

Task progress display with collapsible details and status tracking.

**Features:**

- Collapsible task blocks
- Status indicators (pending, in_progress, completed, failed)
- Left border accent for activity log feel
- File references and metadata support
- Customizable icons

**Usage:**

```tsx
import { AITask, AITaskItem, AITaskList } from "@/features/chat/components/ai/ai-task";

// Simple task
<AITask title="Searching documentation" status="completed" defaultOpen>
  Found 5 relevant sections in docs/api.md
</AITask>

// Task with list
<AITask title="Execute swap" status="in_progress" defaultOpen={true}>
  <AITaskList title="Steps">
    <AITaskItem status="completed" file="swap_xlm_usdc.ts">
      Swapped 1000 XLM → 88.91 USDC
    </AITaskItem>
    <AITaskItem status="in_progress">
      Confirming transaction...
    </AITaskItem>
    <AITaskItem status="pending">
      Update balance
    </AITaskItem>
  </AITaskList>
</AITask>
```

**Props:**

#### AITask

| Prop        | Type       | Default     | Description                                        |
| ----------- | ---------- | ----------- | -------------------------------------------------- |
| title       | string     | required    | Task title/description                             |
| status      | TaskStatus | "pending"   | Task status (pending/in_progress/completed/failed) |
| defaultOpen | boolean    | true        | Default open state                                 |
| children    | ReactNode  | -           | Task details content                               |
| className   | string     | -           | Additional CSS classes                             |
| icon        | ReactNode  | Search icon | Custom icon component                              |

#### AITaskItem

| Prop      | Type       | Default   | Description             |
| --------- | ---------- | --------- | ----------------------- |
| children  | ReactNode  | required  | Task item description   |
| status    | TaskStatus | "pending" | Item status             |
| file      | string     | -         | Optional file reference |
| className | string     | -         | Additional CSS classes  |

#### AITaskList

| Prop      | Type      | Default  | Description            |
| --------- | --------- | -------- | ---------------------- |
| title     | string    | -        | List title             |
| children  | ReactNode | required | AITaskItem components  |
| className | string    | -        | Additional CSS classes |

---

## Examples

### Complete Chat Flow

```tsx
// User message
<div>Swap XLM to USDC then stake it</div>

// AI reasoning
<AIReasoning duration={5} defaultOpen={false}>
  I'll help you swap XLM to USDC and stake the resulting USDC. Here's my plan:

  1. Check current swap rates for XLM to USDC
  2. Execute the swap using the best available route
  3. Find the highest yield staking opportunity for USDC
  4. Stake the USDC and confirm the transaction
</AIReasoning>

// Task 1: Discovery
<AITask title="Discover Swap Rates" status="completed" defaultOpen={false}>
  <AITaskList>
    <AITaskItem status="completed">
      Stellar DEX: 1 XLM = 0.089 USDC (0.1% fee)
    </AITaskItem>
    <AITaskItem status="completed">
      Best rate: Stellar DEX path payment
    </AITaskItem>
  </AITaskList>
</AITask>

// Task 2: Execute
<AITask title="Execute the Swap" status="completed">
  <AITaskList>
    <AITaskItem status="completed" file="swap_xlm_usdc.ts">
      Swapped 1000 XLM → 88.91 USDC
    </AITaskItem>
    <AITaskItem status="completed">
      Transaction confirmed: ABC123DEF456
    </AITaskItem>
  </AITaskList>
</AITask>

// Task 3: Stake
<AITask title="Stake the USDC" status="completed">
  <AITaskList>
    <AITaskItem status="completed" file="stake_usdc.ts">
      Staked 88.91 USDC in Aqua Protocol
    </AITaskItem>
    <AITaskItem status="completed">
      Current APY: 8.5%
    </AITaskItem>
  </AITaskList>
</AITask>
```

### Integration with LangGraph

```tsx
import type { Message } from '@langchain/langgraph-sdk';
import { AIReasoning } from '@/features/chat/components/ai/ai-reasoning';

function MessageRenderer({ message }: { message: Message }) {
  // Check if message has reasoning/thinking content
  const reasoningContent = message.content?.find(
    (c) => c.type === 'reasoning' || c.type === 'thinking'
  );

  if (reasoningContent) {
    return (
      <AIReasoning
        duration={reasoningContent.duration}
        isStreaming={message.isStreaming}
      >
        {reasoningContent.text}
      </AIReasoning>
    );
  }

  // Regular message rendering...
}
```

---

## Demo

Visit `/demo-ai` to see interactive examples of all components.

---

## Design Philosophy

These components follow the shadcn/ui approach:

1. **Own the code** - Components are copied into your project, not installed as dependencies
2. **Composable** - Use components independently or together
3. **Accessible** - Built with Radix UI primitives
4. **Customizable** - Styled with Tailwind CSS classes
5. **Type-safe** - Full TypeScript support

---

## Credits

Inspired by [shadcn.io/ai](https://www.shadcn.io/ai) components.
