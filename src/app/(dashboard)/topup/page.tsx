import { TopupPage, fetchCreditPackages } from "@/features/topup";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Top up credits — Tasmil Finance",
  description: "Buy Tasmil credits with crypto or bank transfer.",
};

export default async function TopupRoute() {
  const packages = await fetchCreditPackages();
  return <TopupPage packages={packages} />;
}
