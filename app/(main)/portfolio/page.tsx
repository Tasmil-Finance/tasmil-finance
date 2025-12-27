"use client";

import { useEffect } from "react";
import { ComingSoonOverlay } from "@/components/coming-soon-overlay";
import { useNavigation } from "@/context/nav-context";
import Portfolio from "./components";

const PortfolioPage = () => {
  const { setNavItems } = useNavigation();
  useEffect(() => {
    setNavItems({
      title: "Portfolio",
      // icon: "/images/dashboard.png", // relevant aptos
    });
  }, [setNavItems]);

  return (
    <div className="relative px-4 py-6">
      <Portfolio />
      <ComingSoonOverlay />
    </div>
  );
};

export default PortfolioPage;
