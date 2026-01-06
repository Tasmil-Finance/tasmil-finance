# LangGraph Integration Setup Guide

This guide covers the complete setup and configuration of LangGraph SDK integration for building AI agent chat interfaces in your Next.js frontend.

## Prerequisites

- Node.js 18+ and pnpm
- LangGraph Cloud or self-hosted LangGraph server
- Next.js 14+ project with TypeScript
- Basic understanding of React hooks and context

## Installation

### 1. Core Dependencies

The following LangGraph packages are already installed in this project:

```json
{
  "@langchain/core": "^1.1.8",
  "@langchain/langgraph-sdk": "^1.3.1"
}
```

### 2. Supporting Libraries

Required for the LangGraph integration to work:

```json
{
  "@tanstack/react-query": "^5.85.5",
  "axios": "^1.7.9",
  "framer-motion": "^12.23.26"
}
```

## File Structure

After setup, your project will have the following LangGraph-related structure:

```
frontend/
├── src/
│   ├── providers/
│   │   └── langgraph-provider.tsx    # LangGraph client provider
│   ├── hooks/
│   │   ├── use-langgraph-chat.ts     # Chat functionality hook
│   │   └── use-chat-history.ts       # Chat history management
│   └── components/
│       └── chat/                     # Chat UI components
│           ├── chat-client.tsx       # Main chat interface
│           ├── chat-page-wrapper.tsx # Chat page layout
│           ├── greeting.tsx          # Welcome message
│           ├── markdown-response.tsx # Message rendering
│           ├── suggested-actions.tsx # Action suggestions
│           ├── suggestion.tsx        # Individual suggestions
│           └── tool-call.tsx         # Tool call display
└── docs/
    └── langraph/                     # Documentation
```

## Configuration Files

### 1. LangGraph Provider (`src/providers/langgraph-provider.tsx`)

The main provider that manages the LangGraph client connection:

```typescript
export interface LangGraphConfig {
  apiUrl: string;
  apiKey?: string;
}

interface LangGraphContextType {
  client: Client;
  config: LangGraphConfig;
}
```

Key features:
- **Client Management**: Memoized LangGraph SDK client
- **Configuration**: Centralized API URL and key management
- **Context Provider**: React context for accessing client throughout app

### 2. Chat Hook (`src/hooks/use-langgraph-chat.ts`)

Provides chat functionality with the LangGraph SDK:

```typescript
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
```

Features:
- **Message Streaming**: Real-time message streaming from agents
- **State Management**: Loading states and error handling
- **Message Formatting**: Converts LangGraph messages to UI format
- **Send Functionality**: Handles message sending to agents

### 3. Chat History Hook (`src/hooks/use-chat-history.ts`)

Manages chat thread history and persistence:

Features:
- **Thread Management**: Lists and manages chat threads
- **Message Extraction**: Extracts last messages for previews
- **Sorting**: Orders chats by timestamp
- **Error Handling**: Graceful error handling for failed loads

## Environment Setup

### 1. Environment Variables

Create `.env.local`:

```bash
# LangGraph Configuration
NEXT_PUBLIC_LANGGRAPH_API_URL=https://your-langgraph-server.com
NEXT_PUBLIC_LANGGRAPH_API_KEY=your-api-key

# Optional: Custom endpoints
NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=your-default-assistant-id
```

### 2. LangGraph Server Requirements

Your LangGraph server must:

1. **Expose REST API** with proper CORS configuration
2. **Support streaming** for real-time chat responses
3. **Implement thread management** for chat persistence
4. **Provide assistant/agent endpoints** for agent discovery
5. **Handle authentication** if using API keys

Example LangGraph server configuration:

```python
# In your LangGraph server setup
from langgraph_sdk import get_client

app = get_client(
    url="https://your-langgraph-server.com",
    api_key="your-api-key"
)

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Integration Process

### 1. Provider Setup

Wrap your app with the LangGraph provider:

```tsx
// In your app root or layout
import { LangGraphProvider } from '@/providers/langgraph-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const langGraphConfig = {
    apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL!,
    apiKey: process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY,
  };

  return (
    <html>
      <body>
        <LangGraphProvider config={langGraphConfig}>
          {children}
        </LangGraphProvider>
      </body>
    </html>
  );
}
```

### 2. Chat Component Integration

```tsx
// Example chat page
import { useLangGraphChat } from '@/hooks/use-langgraph-chat';

export default function ChatPage({ agentId }: { agentId: string }) {
  const { messages, isLoading, sendMessage, error } = useLangGraphChat({
    agentId,
    chatId: "new", // or existing chat ID
  });

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
        sendMessage(input.value);
        input.value = '';
      }}>
        <input name="message" placeholder="Type a message..." />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

### 3. Chat History Integration

```tsx
// Example chat history sidebar
import { useChatHistory } from '@/hooks/use-chat-history';

export function ChatHistorySidebar({ agentId }: { agentId: string }) {
  const { chatHistory, isLoading, error, refresh } = useChatHistory(agentId);

  if (isLoading) return <div>Loading chat history...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="chat-history">
      <h3>Chat History</h3>
      <button onClick={refresh}>Refresh</button>
      
      {chatHistory.map(chat => (
        <div key={chat.id} className="chat-item">
          <h4>{chat.title}</h4>
          <p>{chat.lastMessage}</p>
          <small>{chat.timestamp.toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
}
```

## Message Types and Handling

### 1. Message Structure

LangGraph messages are converted to a standardized format:

```typescript
interface ChatMessage {
  id: string;              // Unique message identifier
  role: "user" | "assistant"; // Message sender
  content: string;         // Message text content
  timestamp: Date;         // When message was sent
}
```

### 2. Content Extraction

The system handles various LangGraph message content formats:

- **String content**: Direct text messages
- **Array content**: Multiple content blocks (text, images, etc.)
- **Object content**: Structured content with text fields

### 3. Streaming Support

Messages are streamed in real-time using the LangGraph SDK's `useStream` hook:

- **Progressive loading**: Messages appear as they're generated
- **First token detection**: Loading states update when first content arrives
- **Error handling**: Network and generation errors are caught and displayed

## Agent Configuration

### 1. Agent Discovery

```typescript
// Example agent listing
import { useLangGraph } from '@/providers/langgraph-provider';

export function useAgents() {
  const { client } = useLangGraph();
  
  const [agents, setAgents] = useState([]);
  
  useEffect(() => {
    async function loadAgents() {
      try {
        const assistants = await client.assistants.search();
        setAgents(assistants);
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    }
    
    loadAgents();
  }, [client]);
  
  return agents;
}
```

### 2. Agent Metadata

Agents can include metadata for UI customization:

```typescript
interface Agent {
  assistant_id: string;
  name: string;
  description?: string;
  metadata?: {
    avatar?: string;
    color?: string;
    capabilities?: string[];
  };
}
```

## Troubleshooting

### Common Issues

1. **Connection failures**
   - Check LangGraph server is running and accessible
   - Verify API URL and key in environment variables
   - Check CORS configuration on server

2. **Streaming issues**
   - Ensure server supports Server-Sent Events (SSE)
   - Check network connectivity and firewall settings
   - Verify WebSocket support if using WebSocket transport

3. **Message formatting errors**
   - Check message content structure from server
   - Verify content extraction logic handles your message types
   - Test with simple text messages first

4. **Thread management issues**
   - Ensure thread IDs are properly generated and stored
   - Check thread metadata is correctly set
   - Verify thread search parameters

### Debug Commands

```bash
# Test LangGraph server connection
curl -X GET "https://your-langgraph-server.com/assistants" \
  -H "Authorization: Bearer your-api-key"

# Check thread creation
curl -X POST "https://your-langgraph-server.com/threads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"metadata": {"assistant_id": "your-agent-id"}}'

# Test message sending
curl -X POST "https://your-langgraph-server.com/threads/{thread_id}/runs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"assistant_id": "your-agent-id", "input": {"messages": [{"type": "human", "content": "Hello"}]}}'
```

## Performance Optimization

### 1. Client Memoization

The LangGraph client is memoized to prevent unnecessary re-creation:

```typescript
const client = useMemo(() => new Client({
  apiUrl: config.apiUrl,
  apiKey: config.apiKey,
}), [config.apiUrl, config.apiKey]);
```

### 2. Message Batching

For high-frequency updates, consider batching message updates:

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const messageBuffer = useRef<ChatMessage[]>([]);

// Batch updates every 100ms
useEffect(() => {
  const interval = setInterval(() => {
    if (messageBuffer.current.length > 0) {
      setMessages(prev => [...prev, ...messageBuffer.current]);
      messageBuffer.current = [];
    }
  }, 100);
  
  return () => clearInterval(interval);
}, []);
```

### 3. Thread Caching

Cache thread data to reduce API calls:

```typescript
const threadCache = useRef<Map<string, Thread>>(new Map());

const getCachedThread = useCallback(async (threadId: string) => {
  if (threadCache.current.has(threadId)) {
    return threadCache.current.get(threadId);
  }
  
  const thread = await client.threads.get(threadId);
  threadCache.current.set(threadId, thread);
  return thread;
}, [client]);
```

## Security Considerations

1. **API Key Management**: Store API keys securely, never expose in client code
2. **Input Validation**: Validate user inputs before sending to agents
3. **Rate Limiting**: Implement client-side rate limiting for message sending
4. **Content Filtering**: Filter sensitive content in messages
5. **Thread Access**: Ensure users can only access their own threads

## Best Practices

1. **Error Boundaries**: Wrap LangGraph components in error boundaries
2. **Loading States**: Always show loading indicators during operations
3. **Offline Handling**: Handle network disconnections gracefully
4. **Message Persistence**: Store important messages locally as backup
5. **User Feedback**: Provide clear feedback for all user actions

## Next Steps

Once setup is complete, see the [Usage Guide](./usage.md) for detailed examples of how to build chat interfaces, handle different message types, and implement advanced features like tool calls and multi-agent conversations.