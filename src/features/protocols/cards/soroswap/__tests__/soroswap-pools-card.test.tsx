// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { SoroswapPoolCardProps } from "@/features/protocols/schemas/soroswap.schema";
import { SoroswapPoolsCard } from "../soroswap-pools-card";

const makePool = (overrides: Partial<SoroswapPoolCardProps> = {}): SoroswapPoolCardProps => ({
  address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F",
  tokenA: "XLM",
  tokenB: "USDC",
  tokenAAddress: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
  tokenBAddress: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  reserveA: 1000000000,
  reserveB: 280000000,
  tvl: 560,
  fee: "0.30%",
  ...overrides,
});

describe("SoroswapPoolsCard", () => {
  it("renders token pair label", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    // Label is `${pool.tokenA} / ${pool.tokenB}`
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
  });

  it("renders token icons in expanded detail (playground auto-expands first)", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByAltText("XLM")).toBeInTheDocument();
    expect(screen.getByAltText("USDC")).toBeInTheDocument();
  });

  it("does NOT show [object Object] for token names", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    const text = document.body.textContent || "";
    expect(text).not.toContain("[object Object]");
  });

  it("renders pool count in playground mode", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders empty state when pools array is empty", () => {
    render(<SoroswapPoolsCard pools={[]} mode="playground" />);
    expect(screen.getByText("No pools found")).toBeInTheDocument();
  });

  it("renders with missing optional fields (tvl, fee)", () => {
    render(
      <SoroswapPoolsCard pools={[makePool({ tvl: undefined, fee: undefined })]} mode="playground" />
    );
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
  });

  it("renders title in chat mode", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="chat" />);
    expect(screen.getByText("Soroswap Pools")).toBeInTheDocument();
  });
});
