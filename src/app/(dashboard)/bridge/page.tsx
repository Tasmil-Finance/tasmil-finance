"use client";

import dynamic from "next/dynamic";

const BridgePage = dynamic(
  () =>
    import("@/features/bridge/components/bridge-page").then((m) => ({
      default: m.BridgePage,
    })),
  { ssr: false },
);

export default function BridgeRoute() {
  return <BridgePage />;
}
