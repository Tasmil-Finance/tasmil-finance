import type { ReactNode } from "react";

const useAguiStreamMock = jest.fn();
const invalidateQueriesMock = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
  };
});

jest.mock("../hooks/use-agui-stream", () => ({
  useAguiStream: (...args: unknown[]) => useAguiStreamMock(...args),
}));
jest.mock("../config/agents.config", () => ({
  getAgentConfig: () => ({ name: "Test Agent" }),
}));
jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({ address: "GTEST" }),
}));
jest.mock("@/store/use-auth", () => ({
  useAuthStore: (selector: (s: { accessToken: string }) => unknown) =>
    selector({ accessToken: "tok" }),
}));
jest.mock("@/store/use-wallet", () => ({
  useWalletStore: { getState: () => ({ account: "GTEST" }) },
}));
jest.mock("./chat-state-provider", () => ({
  useChatState: () => ({
    threadId: null,
    setThreadId: jest.fn(),
    setThreadTitle: jest.fn(),
  }),
}));
jest.mock("./thread-provider", () => ({
  useThreads: () => ({ getThreads: jest.fn().mockResolvedValue([]), setThreads: jest.fn() }),
}));
jest.mock("@/lib/ai-auth", () => ({ buildAiIdentityHeaders: () => ({}) }));
jest.mock("@/lib/runtime-urls", () => ({
  getBrowserAiBaseUrl: () => "http://test",
  getBrowserBackendBaseUrl: () => "http://test",
}));
jest.mock("../lib/client", () => ({
  createClient: () => ({ threads: { update: () => Promise.resolve() } }),
}));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("@/shared/icons/langgraph", () => ({ LangGraphLogoSVG: () => null }));
jest.mock("./stream-provider", () => {
  const React = require("react");
  return { StreamContext: React.createContext(null) };
});

global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }) as never;

import { act, render } from "@testing-library/react";
import { StreamProvider } from "./agui-stream-provider";

function makeStreamValue(over: { isLoading?: boolean; error?: Error }) {
  return {
    messages: [],
    values: { messages: [] },
    isLoading: over.isLoading ?? false,
    error: over.error,
    interrupt: undefined,
    submit: jest.fn(),
    stop: jest.fn(),
    getMessagesMetadata: () => undefined,
  };
}

describe("StreamProvider credit invalidation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    invalidateQueriesMock.mockReset();
    useAguiStreamMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function renderWith() {
    const wrapper = ({ children }: { children: ReactNode }) => <>{children}</>;
    return render(
      <StreamProvider agentId="supervisor">
        <div />
      </StreamProvider>,
      { wrapper }
    );
  }

  it("invalidates ['credit'] when isLoading transitions true -> false", () => {
    useAguiStreamMock.mockReturnValue(makeStreamValue({ isLoading: true }));
    const { rerender } = renderWith();

    invalidateQueriesMock.mockClear();

    act(() => {
      useAguiStreamMock.mockReturnValue(makeStreamValue({ isLoading: false }));
      rerender(
        <StreamProvider agentId="supervisor">
          <div />
        </StreamProvider>
      );
    });

    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["credit", "anon"] });
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(1);

    invalidateQueriesMock.mockClear();
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["credit", "anon"] });
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(1);
  });

  it("invalidates ['credit'] when error becomes truthy", () => {
    useAguiStreamMock.mockReturnValue(makeStreamValue({ isLoading: false }));
    const { rerender } = renderWith();

    invalidateQueriesMock.mockClear();

    act(() => {
      useAguiStreamMock.mockReturnValue(
        makeStreamValue({ isLoading: false, error: new Error("boom") })
      );
      rerender(
        <StreamProvider agentId="supervisor">
          <div />
        </StreamProvider>
      );
    });

    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["credit", "anon"] });
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(1);
    invalidateQueriesMock.mockClear();
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["credit", "anon"] });
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(1);
  });
});
