import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <Suspense fallback={<div className="flex h-dvh" />}>
          <SidebarWrapper>{children}</SidebarWrapper>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";
  
  // Get user from backend API using token from cookie
  let user = null;
  const authToken = cookieStore.get("auth_token");
  
  if (authToken?.value) {
    try {
      // Create a server-side API client to get session
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        headers: {
          Authorization: `Bearer ${authToken.value}`,
        },
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        user = data.user;
      }
    } catch (error) {
      // If session fetch fails, user remains null
      console.error("Failed to fetch session:", error);
    }
  }

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

