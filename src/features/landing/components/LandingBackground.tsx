"use client";

import dynamic from "next/dynamic";

const Experience = dynamic(
    () => import("./Experience").then((mod) => mod.Experience),
    { ssr: false }
);

export function LandingBackground() {
    return <Experience />;
}
