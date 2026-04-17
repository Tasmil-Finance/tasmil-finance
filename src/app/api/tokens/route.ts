import { NextResponse } from "next/server";
import { SUPPORTED_CHAINS, getActiveRegistry } from "../aggregator/_registry";

export async function GET() {
  return NextResponse.json({
    chains: SUPPORTED_CHAINS,
    tokens: getActiveRegistry(),
  });
}
