"use client";
"use client";

import { useEffect } from "react";
import { ComingSoonOverlay } from "@/components/coming-soon-overlay";
import { useNavigation } from "@/context/nav-context";
import { MarketOverview } from "./components/market-overview";

export default function DashboardPage() {
  const { setNavItems } = useNavigation();
  useEffect(() => {
    setNavItems({
      title: "MarketOverview",
      icon: "/images/dashboard.png",
    });
  }, []);

  return (
    <div className="relative">
      <MarketOverview />
      <ComingSoonOverlay />
    </div>
  );
}
