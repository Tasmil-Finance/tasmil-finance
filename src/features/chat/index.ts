// Main exports for chat feature
export * from './types';
export * from './providers';
export * from './hooks';
export * from './lib';
export * from './constants';

// Components
export { ChatClient } from './components/chat-client';
export { ChatPageWrapper } from './components/chat-page-wrapper';
export { Greeting } from './components/greeting';
export { SuggestedActions } from './components/suggested-actions';
export { Suggestion } from './components/suggestion';

// Messages
export * from './components/messages';

// Thread components
export {
  ArtifactContent,
  ArtifactProvider,
  ArtifactTitle,
  useArtifact,
  useArtifactContext,
  useArtifactOpen,
} from './thread/components/artifact';
export { ContentBlocksPreview } from './thread/components/content-blocks-preview';
export { MarkdownText } from './thread/components/markdown-text';
export { MultimodalPreview } from './thread/components/multimodal-preview';
export { SyntaxHighlighter } from './thread/components/syntax-highlighter';
export { TooltipIconButton } from './thread/components/tooltip-icon-button';
