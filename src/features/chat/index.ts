// Chat feature barrel export

// Components
export { ChatClient } from "./components/chat-client";
export { ChatPageWrapper } from "./components/chat-page-wrapper";
export { Greeting } from "./components/greeting";
export { SuggestedActions } from "./components/suggested-actions";
export { Suggestion } from "./components/suggestion";
export { ToolCall } from "./components/tool-call";
export * from "./constants";
// Thread components (part of chat)
export {
  ArtifactContent,
  ArtifactProvider,
  ArtifactTitle,
  useArtifact,
  useArtifactContext,
  useArtifactOpen,
} from "./thread/components/artifact";
export { ContentBlocksPreview } from "./thread/components/content-blocks-preview";
export { MarkdownText } from "./thread/components/markdown-text";
export { MultimodalPreview } from "./thread/components/multimodal-preview";
export { SyntaxHighlighter } from "./thread/components/syntax-highlighter";
export { TooltipIconButton } from "./thread/components/tooltip-icon-button";
export * from "./thread/utils";
export * from "./types";

// Hooks will be exported here once they are created
// export * from './hooks';

// API functions will be exported here once they are created
// export * from './api';

// Providers will be exported here once they are moved
// export * from './providers';

// Utils will be exported here once they are created
// export * from './utils';
