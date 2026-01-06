# LangGraph Usage Guide

This guide covers how to effectively use the LangGraph integration to build AI agent chat interfaces, handle different message types, and implement advanced features.

## Basic Usage Patterns

### 1. Simple Chat Interface

```tsx
import { useLangGraphChat } from '@/hooks/use-langgraph-chat';
import { useState } from 'react';

export function SimpleChatInterface({ agentId }: { agentId: string }) {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, error } = useLangGraphChat({
    agentId,
    chatId: "new",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="input-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

### 2. Chat with History Sidebar

```tsx
import { useLangGraphChat } from '@/hooks/use-langgraph-chat';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useState } from 'react';

export function ChatWithHistory({ agentId }: { agentId: string }) {
  const [currentChatId, setCurrentChatId] = useState<string>("new");
  const { chatHistory, isLoading: historyLoading } = useChatHistory(agentId);
  const { messages, isLoading, sendMessage } = useLangGraphChat({
    agentId,
    chatId: currentChatId,
  });

  const startNewChat = () => {
    setCurrentChatId("new");
  };

  const loadChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="chat-with-history">
      {/* History Sidebar */}
      <div className="history-sidebar">
        <div className="sidebar-header">
          <h3>Chat History</h3>
          <button onClick={startNewChat}>New Chat</button>
        </div>
        
        <div className="chat-list">
          {historyLoading ? (
            <div>Loading history...</div>
          ) : (
            chatHistory.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                onClick={() => loadChat(chat.id)}
              >
                <div className="chat-title">{chat.title}</div>
                <div className="chat-preview">{chat.lastMessage}</div>
                <div className="chat-date">
                  {chat.timestamp.toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-chat">
        <SimpleChatInterface agentId={agentId} />
      </div>
    </div>
  );
}
```

## Advanced Message Handling

### 1. Rich Message Rendering

```tsx
import { ChatMessage } from '@/hooks/use-langgraph-chat';
import { MarkdownResponse } from '@/components/chat/markdown-response';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function RichMessage({ message, isStreaming }: MessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message ${message.role}`}>
      <div className="message-header">
        <div className="message-avatar">
          {isUser ? '👤' : '🤖'}
        </div>
        <div className="message-info">
          <span className="message-role">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="message-time">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      <div className="message-content">
        {isUser ? (
          <div className="user-message">{message.content}</div>
        ) : (
          <MarkdownResponse 
            content={message.content}
            isStreaming={isStreaming}
          />
        )}
      </div>
    </div>
  );
}
```

### 2. Tool Call Handling

```tsx
import { useState, useEffect } from 'react';
import { useLangGraph } from '@/providers/langgraph-provider';

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: any;
  status: 'pending' | 'success' | 'error';
}

export function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolIcon = (toolName: string) => {
    const icons: Record<string, string> = {
      'web_search': '🔍',
      'calculator': '🧮',
      'file_read': '📄',
      'api_call': '🌐',
    };
    return icons[toolName] || '🔧';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600',
      success: 'text-green-600',
      error: 'text-red-600',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="tool-call">
      <div 
        className="tool-call-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="tool-info">
          <span className="tool-icon">{getToolIcon(toolCall.name)}</span>
          <span className="tool-name">{toolCall.name}</span>
          <span className={`tool-status ${getStatusColor(toolCall.status)}`}>
            {toolCall.status}
          </span>
        </div>
        <button className="expand-button">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="tool-call-details">
          <div className="tool-args">
            <h4>Arguments:</h4>
            <pre>{JSON.stringify(toolCall.args, null, 2)}</pre>
          </div>
          
          {toolCall.result && (
            <div className="tool-result">
              <h4>Result:</h4>
              <pre>{JSON.stringify(toolCall.result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 3. Streaming Message Updates

```tsx
import { useEffect, useRef } from 'react';
import { useLangGraphChat } from '@/hooks/use-langgraph-chat';

export function StreamingChat({ agentId }: { agentId: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    firstTokenReceived 
  } = useLangGraphChat({
    agentId,
    chatId: "new",
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, firstTokenReceived]);

  const lastMessage = messages[messages.length - 1];
  const isLastMessageStreaming = isLoading && lastMessage?.role === 'assistant';

  return (
    <div className="streaming-chat">
      <div className="messages-container">
        {messages.map((message, index) => (
          <RichMessage
            key={message.id}
            message={message}
            isStreaming={index === messages.length - 1 && isLastMessageStreaming}
          />
        ))}
        
        {/* Show typing indicator when waiting for first token */}
        {isLoading && !firstTokenReceived && (
          <div className="message assistant">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
```

## Multi-Agent Conversations

### 1. Agent Selector

```tsx
import { useState, useEffect } from 'react';
import { useLangGraph } from '@/providers/langgraph-provider';

interface Agent {
  assistant_id: string;
  name: string;
  description: string;
  metadata?: {
    avatar?: string;
    capabilities?: string[];
  };
}

export function AgentSelector({ 
  onAgentSelect 
}: { 
  onAgentSelect: (agentId: string) => void 
}) {
  const { client } = useLangGraph();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  useEffect(() => {
    async function loadAgents() {
      try {
        const assistants = await client.assistants.search();
        setAgents(assistants);
        if (assistants.length > 0) {
          setSelectedAgent(assistants[0].assistant_id);
          onAgentSelect(assistants[0].assistant_id);
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    }
    
    loadAgents();
  }, [client, onAgentSelect]);

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    onAgentSelect(agentId);
  };

  return (
    <div className="agent-selector">
      <h3>Select Agent</h3>
      <div className="agent-grid">
        {agents.map(agent => (
          <div
            key={agent.assistant_id}
            className={`agent-card ${selectedAgent === agent.assistant_id ? 'selected' : ''}`}
            onClick={() => handleAgentChange(agent.assistant_id)}
          >
            <div className="agent-avatar">
              {agent.metadata?.avatar || '🤖'}
            </div>
            <div className="agent-info">
              <h4>{agent.name}</h4>
              <p>{agent.description}</p>
              {agent.metadata?.capabilities && (
                <div className="agent-capabilities">
                  {agent.metadata.capabilities.map(cap => (
                    <span key={cap} className="capability-tag">
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Multi-Agent Chat Interface

```tsx
import { useState } from 'react';
import { AgentSelector } from './AgentSelector';
import { StreamingChat } from './StreamingChat';

export function MultiAgentChat() {
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  return (
    <div className="multi-agent-chat">
      <div className="chat-header">
        <button 
          onClick={() => setShowAgentSelector(!showAgentSelector)}
          className="agent-selector-toggle"
        >
          Switch Agent
        </button>
      </div>

      {showAgentSelector && (
        <div className="agent-selector-modal">
          <AgentSelector 
            onAgentSelect={(agentId) => {
              setCurrentAgent(agentId);
              setShowAgentSelector(false);
            }}
          />
        </div>
      )}

      {currentAgent && (
        <StreamingChat agentId={currentAgent} />
      )}
    </div>
  );
}
```

## Error Handling and Recovery

### 1. Comprehensive Error Handling

```tsx
import { useLangGraphChat } from '@/hooks/use-langgraph-chat';
import { useState } from 'react';

export function RobustChat({ agentId }: { agentId: string }) {
  const [retryCount, setRetryCount] = useState(0);
  const { messages, isLoading, sendMessage, error, retry } = useLangGraphChat({
    agentId,
    chatId: "new",
  });

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    retry();
  };

  const handleSendWithRetry = async (content: string) => {
    try {
      await sendMessage(content);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const getErrorMessage = (error: string) => {
    if (error.includes('network')) {
      return 'Network connection failed. Please check your internet connection.';
    }
    if (error.includes('timeout')) {
      return 'Request timed out. The agent might be busy.';
    }
    if (error.includes('rate limit')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    return `An error occurred: ${error}`;
  };

  return (
    <div className="robust-chat">
      {/* Messages */}
      <div className="messages">
        {messages.map(message => (
          <RichMessage key={message.id} message={message} />
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            {getErrorMessage(error)}
          </div>
          <div className="error-actions">
            <button onClick={handleRetry}>
              Retry {retryCount > 0 && `(${retryCount})`}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput 
        onSend={handleSendWithRetry}
        disabled={isLoading}
      />
    </div>
  );
}
```

### 2. Connection Status Monitoring

```tsx
import { useState, useEffect } from 'react';
import { useLangGraph } from '@/providers/langgraph-provider';

export function ConnectionStatus() {
  const { client } = useLangGraph();
  const [isConnected, setIsConnected] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple health check - try to list assistants
        await client.assistants.search({ limit: 1 });
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
      }
      setLastCheck(new Date());
    };

    // Check immediately
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [client]);

  if (isConnected) {
    return (
      <div className="connection-status connected">
        <span className="status-indicator">🟢</span>
        Connected
      </div>
    );
  }

  return (
    <div className="connection-status disconnected">
      <span className="status-indicator">🔴</span>
      Disconnected
      <small>Last check: {lastCheck.toLocaleTimeString()}</small>
    </div>
  );
}
```

## Performance Optimization

### 1. Message Virtualization

For chats with many messages, implement virtualization:

```tsx
import { FixedSizeList as List } from 'react-window';
import { useLangGraphChat } from '@/hooks/use-langgraph-chat';

export function VirtualizedChat({ agentId }: { agentId: string }) {
  const { messages } = useLangGraphChat({ agentId, chatId: "new" });

  const MessageItem = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <RichMessage message={messages[index]} />
    </div>
  );

  return (
    <div className="virtualized-chat">
      <List
        height={600}
        itemCount={messages.length}
        itemSize={100}
        itemData={messages}
      >
        {MessageItem}
      </List>
    </div>
  );
}
```

### 2. Message Caching

```tsx
import { useMemo } from 'react';
import { ChatMessage } from '@/hooks/use-langgraph-chat';

export function useCachedMessages(messages: ChatMessage[]) {
  // Memoize processed messages to avoid re-rendering
  const processedMessages = useMemo(() => {
    return messages.map(message => ({
      ...message,
      processedContent: processMessageContent(message.content),
      formattedTime: message.timestamp.toLocaleTimeString(),
    }));
  }, [messages]);

  return processedMessages;
}

function processMessageContent(content: string): string {
  // Expensive processing like markdown parsing, syntax highlighting, etc.
  return content; // Simplified
}
```

### 3. Debounced Input

```tsx
import { useState, useCallback } from 'react';
import { debounce } from 'lodash';

export function DebouncedChatInput({ 
  onSend 
}: { 
  onSend: (message: string) => void 
}) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Debounce typing indicator
  const debouncedStopTyping = useCallback(
    debounce(() => setIsTyping(false), 1000),
    []
  );

  const handleInputChange = (value: string) => {
    setInput(value);
    setIsTyping(true);
    debouncedStopTyping();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    onSend(input);
    setInput('');
    setIsTyping(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Type a message..."
      />
      <button type="submit">Send</button>
      {isTyping && <span className="typing-indicator">Typing...</span>}
    </form>
  );
}
```

## Custom Hooks and Utilities

### 1. Custom Chat Hook with Persistence

```tsx
import { useLangGraphChat } from '@/hooks/use-langgraph-chat';
import { useEffect } from 'react';

export function usePersistentChat(agentId: string, chatId: string) {
  const chat = useLangGraphChat({ agentId, chatId });

  // Save messages to localStorage
  useEffect(() => {
    if (chat.messages.length > 0) {
      localStorage.setItem(
        `chat-${chatId}`,
        JSON.stringify(chat.messages)
      );
    }
  }, [chat.messages, chatId]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`chat-${chatId}`);
    if (saved) {
      try {
        const savedMessages = JSON.parse(saved);
        // Merge with current messages if needed
      } catch (error) {
        console.error('Failed to load saved messages:', error);
      }
    }
  }, [chatId]);

  return chat;
}
```

### 2. Message Search Hook

```tsx
import { useState, useMemo } from 'react';
import { ChatMessage } from '@/hooks/use-langgraph-chat';

export function useMessageSearch(messages: ChatMessage[]) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    
    return messages.filter(message =>
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const highlightedMessages = useMemo(() => {
    if (!searchQuery.trim()) return filteredMessages;
    
    return filteredMessages.map(message => ({
      ...message,
      content: message.content.replace(
        new RegExp(`(${searchQuery})`, 'gi'),
        '<mark>$1</mark>'
      ),
    }));
  }, [filteredMessages, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredMessages: highlightedMessages,
    resultCount: filteredMessages.length,
  };
}
```

## Testing

### 1. Mock LangGraph Provider

```tsx
// test-utils/mock-langgraph-provider.tsx
import { ReactNode } from 'react';
import { LangGraphProvider } from '@/providers/langgraph-provider';

const mockClient = {
  assistants: {
    search: jest.fn().mockResolvedValue([]),
  },
  threads: {
    create: jest.fn().mockResolvedValue({ thread_id: 'test-thread' }),
    search: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue({ thread_id: 'test-thread' }),
  },
};

export function MockLangGraphProvider({ children }: { children: ReactNode }) {
  return (
    <LangGraphProvider 
      config={{ 
        apiUrl: 'http://test-server.com',
        apiKey: 'test-key' 
      }}
    >
      {children}
    </LangGraphProvider>
  );
}
```

### 2. Chat Component Tests

```tsx
// __tests__/chat.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SimpleChatInterface } from '@/components/chat/simple-chat-interface';
import { MockLangGraphProvider } from '@/test-utils/mock-langgraph-provider';

describe('SimpleChatInterface', () => {
  it('sends messages correctly', async () => {
    render(
      <MockLangGraphProvider>
        <SimpleChatInterface agentId="test-agent" />
      </MockLangGraphProvider>
    );

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Hello, agent!' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello, agent!')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    // Mock error scenario
    render(
      <MockLangGraphProvider>
        <SimpleChatInterface agentId="error-agent" />
      </MockLangGraphProvider>
    );

    // Test error handling
  });
});
```

## Best Practices

1. **Message Management**: Always handle loading and error states
2. **Performance**: Use virtualization for long chat histories
3. **Accessibility**: Include proper ARIA labels and keyboard navigation
4. **Error Recovery**: Implement retry mechanisms and graceful degradation
5. **Security**: Validate and sanitize all user inputs
6. **Caching**: Cache agent data and thread information appropriately
7. **Testing**: Write comprehensive tests for chat functionality
8. **User Experience**: Provide clear feedback for all user actions

## Common Use Cases

### Customer Support Chat

```tsx
export function CustomerSupportChat() {
  return (
    <div className="support-chat">
      <div className="chat-header">
        <h2>Customer Support</h2>
        <ConnectionStatus />
      </div>
      <StreamingChat agentId="support-agent" />
    </div>
  );
}
```

### Code Assistant

```tsx
export function CodeAssistantChat() {
  return (
    <div className="code-chat">
      <MultiAgentChat />
      <div className="code-tools">
        {/* Code-specific tools */}
      </div>
    </div>
  );
}
```

This comprehensive usage guide should help you build sophisticated chat interfaces with LangGraph integration. Remember to handle edge cases, implement proper error recovery, and optimize for performance in production applications.