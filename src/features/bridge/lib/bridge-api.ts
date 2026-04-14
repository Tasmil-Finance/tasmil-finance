/**
 * Bridge type definitions.
 * TX building has moved to client-side (use-bridge.ts via Allbridge SDK).
 */

export interface BridgeChain {
  id: string;
  name: string;
  tokens: string[];
}
