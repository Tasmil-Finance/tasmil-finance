import { NextResponse } from "next/server";

const SOLANA_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? "https://solana-rpc.publicnode.com"
    : "https://api.devnet.solana.com");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const mint = searchParams.get("mint");

  if (!wallet || !mint) {
    return NextResponse.json({ balance: 0, error: "Missing wallet or mint" }, { status: 400 });
  }

  try {
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [wallet, { mint }, { encoding: "jsonParsed" }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ balance: 0, error: `RPC error: ${res.status}` });
    }

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ balance: 0, error: data.error.message });
    }

    const accounts = data.result?.value ?? [];
    let total = 0;
    for (const account of accounts) {
      const amount = account.account?.data?.parsed?.info?.tokenAmount;
      if (amount?.uiAmount != null) {
        total += amount.uiAmount;
      }
    }

    return NextResponse.json({ balance: total });
  } catch (err) {
    return NextResponse.json({ balance: 0, error: String(err) });
  }
}
