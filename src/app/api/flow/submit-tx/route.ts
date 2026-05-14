import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEnv } from "@/lib/env";

const MCP_URL = requireEnv("NEXT_PUBLIC_MCP_STELLAR_URL", "http://localhost:3009");

const submitTxSchema = z.object({
  signedXdr: z.string().min(1, "signedXdr is required"),
  protocol: z.string().optional(),
  stepIndex: z.number().int().min(0).optional(),
});

/**
 * POST /api/flow/submit-tx
 *
 * Submits a signed XDR to the Stellar network via MCP aggregator.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body", retryable: false },
      { status: 400 }
    );
  }

  const parsed = submitTxSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join("; ");
    return NextResponse.json({ success: false, error: message, retryable: false }, { status: 400 });
  }

  const { signedXdr, protocol, stepIndex } = parsed.data;

  try {
    const submitRes = await fetch(`${MCP_URL}/api/aggregator/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedXdr, protocol: protocol ?? "unknown" }),
    });

    const submitData = await submitRes.json();

    if (submitData.success) {
      return NextResponse.json({
        success: true,
        hash: submitData.hash ?? "",
        ...(stepIndex != null && { stepIndex }),
      });
    }

    const rawError =
      submitData.error ?? submitData.detail ?? submitData.message ?? "Submission failed";
    const error = typeof rawError === "string" ? rawError : JSON.stringify(rawError);

    return NextResponse.json(
      {
        success: false,
        error,
        ...(stepIndex != null && { stepIndex }),
        retryable: true,
      },
      { status: 502 }
    );
  } catch (e) {
    const error = e instanceof Error ? e.message : "Failed to reach MCP aggregator";
    return NextResponse.json(
      {
        success: false,
        error,
        ...(stepIndex != null && { stepIndex }),
        retryable: true,
      },
      { status: 502 }
    );
  }
}
