import { cookies } from "next/headers";
import Script from "next/script";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { DefiAgentLayout } from "@/components/defi-agent-layout";
import { DefiAgentSidebarProvider } from "@/context/defi-agent-sidebar-context";
import { auth } from "@/lib/auth";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const defaultOpen =
    cookieStore.get("defi-agent-sidebar-open")?.value === "true";

  return (
    <>
      {/* Python's library for code execution in the console */}
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <DefiAgentSidebarProvider defaultOpen={defaultOpen}>
          <DefiAgentLayout user={session?.user ?? undefined}>{children}</DefiAgentLayout>
        </DefiAgentSidebarProvider>
      </DataStreamProvider>
    </>
  );
}
