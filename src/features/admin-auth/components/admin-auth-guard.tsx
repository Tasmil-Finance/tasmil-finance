"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function isAdminAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem("admin-auth-storage");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.state?.isAuthenticated === true && !!parsed.state?.token;
  } catch {
    return false;
  }
}

function AdminLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Read auth state directly from localStorage to avoid Zustand hydration timing issues
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return <AdminLoadingState />;
  }

  return <>{children}</>;
}
