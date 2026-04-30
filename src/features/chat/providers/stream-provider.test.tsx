import { render } from "@testing-library/react";
import { LangGraphStreamProvider } from "./stream-provider";

const useStreamMock = jest.fn((_config?: unknown) => ({
  messages: [],
  values: {},
  isLoading: false,
  error: null,
  submit: jest.fn(),
  stop: jest.fn(),
  interrupt: null,
}));

jest.mock("@langchain/langgraph-sdk/react", () => ({
  useStream: (config: unknown) => useStreamMock(config),
}));

jest.mock("@langchain/langgraph-sdk/react-ui", () => ({
  isRemoveUIMessage: () => false,
  isUIMessage: () => false,
  uiMessageReducer: jest.fn(),
}));

jest.mock("./chat-state-provider", () => ({
  useChatState: () => ({ threadId: null, setThreadId: jest.fn() }),
}));

jest.mock("./thread-provider", () => ({
  useThreads: () => ({
    getThreads: jest.fn().mockResolvedValue([]),
    setThreads: jest.fn(),
  }),
}));

jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({ address: "GABC123" }),
}));

jest.mock("@/store/use-auth", () => ({
  useAuthStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: "jwt-token" }),
}));

jest.mock("@/lib/api-key", () => ({
  getApiKey: () => null,
}));

jest.mock("../lib/client", () => ({
  createClient: () => ({
    threads: {
      get: jest.fn(),
      update: jest.fn(),
    },
  }),
}));

describe("LangGraphStreamProvider", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_AI_URL = "http://ai.local";
    useStreamMock.mockClear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as typeof fetch;
  });

  it("passes JWT and wallet headers into useStream", () => {
    render(
      <LangGraphStreamProvider agentId="supervisor">
        <div>child</div>
      </LangGraphStreamProvider>
    );

    expect(useStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiUrl: window.location.origin,
        defaultHeaders: {
          Authorization: "Bearer jwt-token",
          "X-Chat-Wallet-Address": "GABC123",
        },
      })
    );
  });

  it("checks graph status through the same-origin info route", () => {
    render(
      <LangGraphStreamProvider agentId="supervisor">
        <div>child</div>
      </LangGraphStreamProvider>
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/info",
      expect.objectContaining({})
    );
  });
});
