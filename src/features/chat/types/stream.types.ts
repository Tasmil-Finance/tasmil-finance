import type { Message } from "@langchain/langgraph-sdk";
import type { UIMessage } from "@langchain/langgraph-sdk/react-ui";

// Persisted signed transaction record (stored in LangGraph thread state via PostgreSQL checkpointer)
export interface SignedTxRecord {
  success: boolean;
  hash?: string;
  error?: string;
  operation?: string;
  timestamp: number;
}

// Stream state type
export interface StateType {
  messages: Message[];
  ui?: UIMessage[];
  signed_txs?: Record<string, SignedTxRecord>;
}

// Stream update type
export interface StreamUpdateType {
  messages?: Message[] | Message | string;
  ui?: UIMessage | UIMessage[];
  context?: Record<string, unknown>;
  signed_txs?: Record<string, unknown>;
}
