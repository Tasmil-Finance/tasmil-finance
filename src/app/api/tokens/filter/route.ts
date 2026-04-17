import { NextRequest, NextResponse } from "next/server";
import { getFilteredTokens } from "../../aggregator/_registry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json(getFilteredTokens(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Filter failed" },
      { status: 400 },
    );
  }
}
