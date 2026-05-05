"use client";

/**
 * Layout for the setup wizard route group. Bypasses the dashboard's
 * MultiSidebarLayout so StepFrame's fullscreen `min-h-screen bg-black`
 * lays out without chrome fighting it.
 */
export default function SetupGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
