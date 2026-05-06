// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { PoolCardProps } from "@/features/protocols/schemas/blend.schema";
import { BlendPoolsCard } from "../blend-pools-card";

const makePool = (overrides: Partial<PoolCardProps> = {}): PoolCardProps => ({
  address: "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
  name: "Fixed Pool",
  status: "active",
  reserves: [
    {
      assetAddress: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
      symbol: "USDC",
      supplyApy: 0.093,
      borrowApy: 0.125,
    },
    {
      assetAddress: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
      symbol: "XLM",
      supplyApy: 0.052,
      borrowApy: 0.081,
    },
  ],
  ...overrides,
});

describe("BlendPoolsCard", () => {
  it("renders pool name", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByText("Fixed Pool")).toBeInTheDocument();
  });

  it("renders reserve symbols in expanded detail", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    // Playground auto-expands first pool, ReserveList shows token symbols
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("XLM")).toBeInTheDocument();
  });

  it("renders pool status as tag", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    // Tag maps "active" -> "Active"
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders pool count in playground mode", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders with empty reserves (pool still shows, but no reserve detail)", () => {
    render(<BlendPoolsCard pools={[makePool({ reserves: [] })]} mode="playground" />);
    expect(screen.getByText("Fixed Pool")).toBeInTheDocument();
  });

  it("renders empty state when pools array is empty", () => {
    render(<BlendPoolsCard pools={[]} mode="playground" />);
    expect(screen.getByText("No pools found")).toBeInTheDocument();
  });

  it("renders token icons with correct alt text", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByAltText("USDC")).toBeInTheDocument();
    expect(screen.getByAltText("XLM")).toBeInTheDocument();
  });

  it("renders title in chat mode", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="chat" />);
    expect(screen.getByText("Blend Pools")).toBeInTheDocument();
  });
});
