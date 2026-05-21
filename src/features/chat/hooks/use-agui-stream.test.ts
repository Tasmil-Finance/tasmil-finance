/**
 * Tests for use-agui-stream lifecycle fixes:
 * 1. AbortController ref — aborts previous stream on new submit
 * 2. useEffect cleanup — aborts on unmount, clears flush timers
 * 3. isLoading guard — prevents concurrent streams
 */

import { renderHook, act } from "@testing-library/react";

// Mock HttpAgent
const mockRunAgent = jest.fn().mockImplementation((_params: any, subscriber: any) => {
  // Simulate the agent calling onRunFinalized to reset isLoading
  subscriber?.onRunFinalized?.();
  return Promise.resolve({ newMessages: [] });
});
const mockAbortRun = jest.fn();

jest.mock("@ag-ui/client", () => ({
  EventType: { CUSTOM: "CUSTOM" },
  HttpAgent: jest.fn().mockImplementation(() => ({
    runAgent: mockRunAgent,
    abortRun: mockAbortRun,
  })),
}));

jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

import { useAguiStream } from "./use-agui-stream";

const baseConfig = {
  apiUrl: "http://localhost:8001",
  assistantId: "test-agent",
  threadId: null,
  defaultHeaders: { Authorization: "Bearer test-token" },
};

describe("useAguiStream lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunAgent.mockImplementation((_params: any, subscriber: any) => {
      subscriber?.onRunFinalized?.();
      return Promise.resolve({ newMessages: [] });
    });
  });

  describe("AbortController — aborts previous stream on new submit", () => {
    it("should pass an AbortController to HttpAgent.runAgent", async () => {
      const { result } = renderHook(() => useAguiStream(baseConfig));

      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      // HttpAgent.runAgent should receive an abortController in its first arg
      expect(mockRunAgent).toHaveBeenCalledTimes(1);
      const runAgentArg = mockRunAgent.mock.calls[0][0];
      expect(runAgentArg).toHaveProperty("abortController");
      expect(runAgentArg.abortController).toBeInstanceOf(AbortController);
    });

    it("should abort previous AbortController when a new submit starts", async () => {
      const { result } = renderHook(() => useAguiStream(baseConfig));

      // First submit
      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      const firstAbortController = mockRunAgent.mock.calls[0][0].abortController as AbortController;
      expect(firstAbortController.signal.aborted).toBe(false);

      // Second submit — should abort the previous controller
      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      // First controller should have been aborted by the second submit
      expect(firstAbortController.signal.aborted).toBe(true);
    });
  });

  describe("useEffect cleanup — aborts on unmount", () => {
    it("should abort active stream on unmount", async () => {
      const { result, unmount } = renderHook(() => useAguiStream(baseConfig));

      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      const abortController = mockRunAgent.mock.calls[0][0].abortController as AbortController;
      expect(abortController.signal.aborted).toBe(false);

      unmount();

      expect(abortController.signal.aborted).toBe(true);
    });

    it("should clear flush timers on unmount without errors", () => {
      const { unmount } = renderHook(() => useAguiStream(baseConfig));
      // Should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("isLoading guard — prevents concurrent streams", () => {
    it("should not start a new stream while isLoading is true", async () => {
      // Make runAgent hang (never resolve, never call onRunFinalized) to keep isLoading true
      let resolveAgent: () => void;
      mockRunAgent.mockImplementation(
        () => new Promise<void>((r) => { resolveAgent = r; })
      );

      const { result } = renderHook(() => useAguiStream(baseConfig));

      // Start first stream
      act(() => {
        result.current.submit({ messages: [] });
      });

      // isLoading should be true now
      expect(result.current.isLoading).toBe(true);

      // Try second submit — should be blocked
      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      // runAgent should only have been called once
      expect(mockRunAgent).toHaveBeenCalledTimes(1);

      // Cleanup
      resolveAgent!();
      await act(async () => {});
    });
  });
});
