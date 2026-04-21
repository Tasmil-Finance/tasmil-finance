import { NextResponse } from "next/server";
import { getAquariusClient, getNetwork } from "../_sdk";

export async function GET() {
  const network = getNetwork();

  try {
    const sdk = getAquariusClient();
    const rewards = await sdk.aquarius.fetchRewards();

    const mapped = rewards.map((r) => ({
      pair: `${r.market_key.asset1_code}/${r.market_key.asset2_code}`,
      asset1: `${r.market_key.asset1_code}:${r.market_key.asset1_issuer}`,
      asset2: `${r.market_key.asset2_code}:${r.market_key.asset2_issuer}`,
      dailyAmmReward: r.daily_amm_reward,
      dailySdexReward: r.daily_sdex_reward,
      dailyTotalReward: r.daily_total_reward,
    }));

    const totalDailyReward = mapped.reduce((sum, r) => sum + r.dailyTotalReward, 0);

    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
      rewards: mapped,
      totalDailyReward,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to fetch rewards" },
      { status: 400 },
    );
  }
}
