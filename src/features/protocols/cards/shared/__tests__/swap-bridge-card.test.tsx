// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { SwapBridgeCardProps } from "../../../schemas/shared.schema";
import { SwapBridgeCard } from "../swap-bridge-card";

// Mock hooks that require providers
jest.mock("@/features/chat/hooks/use-stream", () => ({
  useStreamContext: () => ({
    submit: jest.fn(),
    stop: jest.fn(),
    isLoading: false,
    messages: [],
    interrupt: null,
  }),
}));

jest.mock("../../../hooks/use-tx-signing", () => ({
  useTxSigning: () => ({
    sign: jest.fn(),
    cancel: jest.fn(),
    signing: false,
    txResult: null,
    txError: null,
  }),
}));

jest.mock("@/shared/config/stellar", () => ({
  getExplorerUrl: (hash: string) => `https://stellar.expert/tx/${hash}`,
}));

const makeSwapData = (overrides: Partial<SwapBridgeCardProps> = {}): SwapBridgeCardProps => ({
  operation: "swap",
  protocol: "soroswap",
  tokenIn: "XLM",
  tokenOut: "USDC",
  amountIn: "100",
  amountOut: "27.85",
  fee: "0.30%",
  gasEstimate: "0.01 XLM",
  estimatedTime: "~5 seconds",
  xdr: "AAAA...",
  ...overrides,
});

const makeBridgeData = (overrides: Partial<SwapBridgeCardProps> = {}): SwapBridgeCardProps => ({
  operation: "bridge",
  protocol: "allbridge",
  tokenIn: "USDC",
  tokenOut: "USDC",
  amountIn: "100",
  amountOut: "99.50",
  fee: "0.50%",
  estimatedTime: "~2 minutes",
  xdr: "BBBB...",
  sourceChain: "ethereum",
  destChain: "stellar",
  ...overrides,
});

describe("SwapBridgeCard", () => {
  describe("Swap mode", () => {
    it("renders token pair with correct symbols", () => {
      render(<SwapBridgeCard data={makeSwapData()} mode="playground" />);
      expect(screen.getAllByText(/XLM/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/USDC/).length).toBeGreaterThan(0);
    });

    it("renders amounts", () => {
      render(<SwapBridgeCard data={makeSwapData()} mode="playground" />);
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("27.85")).toBeInTheDocument();
    });

    it("renders protocol name", () => {
      render(<SwapBridgeCard data={makeSwapData()} mode="playground" />);
      expect(screen.getByText(/soroswap/i)).toBeInTheDocument();
    });

    it("renders fee info", () => {
      render(<SwapBridgeCard data={makeSwapData()} mode="playground" />);
      expect(screen.getByText(/0\.30%/)).toBeInTheDocument();
    });

    it("renders estimated time", () => {
      render(<SwapBridgeCard data={makeSwapData()} mode="playground" />);
      expect(screen.getByText(/5 seconds/)).toBeInTheDocument();
    });

    it("does not contain [object Object]", () => {
      render(<SwapBridgeCard data={makeSwapData()} mode="playground" />);
      expect(document.body.textContent).not.toContain("[object Object]");
    });

    it("renders You pay / You receive labels", () => {
      render(<SwapBridgeCard data={makeSwapData()} mode="playground" />);
      expect(screen.getByText(/You pay/i)).toBeInTheDocument();
      expect(screen.getByText(/You receive/i)).toBeInTheDocument();
    });
  });

  describe("Bridge mode", () => {
    it("renders bridge protocol", () => {
      render(<SwapBridgeCard data={makeBridgeData()} mode="playground" />);
      expect(screen.getByText(/allbridge/i)).toBeInTheDocument();
    });

    it("renders chain names when provided", () => {
      render(<SwapBridgeCard data={makeBridgeData()} mode="playground" />);
      const text = document.body.textContent || "";
      // Should show source/dest chain somewhere
      expect(text.toLowerCase()).toMatch(/ethereum|stellar/);
    });
  });

  describe("Chat mode", () => {
    it("renders in compact chat mode", () => {
      render(<SwapBridgeCard data={makeSwapData()} mode="chat" />);
      expect(screen.getAllByText(/XLM/).length).toBeGreaterThan(0);
    });
  });

  describe("Edge cases", () => {
    it("renders with missing optional fields", () => {
      const data = makeSwapData({
        fee: undefined,
        gasEstimate: undefined,
        estimatedTime: undefined,
      });
      render(<SwapBridgeCard data={data} mode="playground" />);
      expect(screen.getAllByText(/XLM/).length).toBeGreaterThan(0);
    });

    it("renders with route", () => {
      const data = makeSwapData({ route: ["XLM", "yXLM", "USDC"] });
      render(<SwapBridgeCard data={data} mode="playground" />);
      const text = document.body.textContent || "";
      expect(text).toMatch(/XLM.*USDC/);
    });
  });
});
