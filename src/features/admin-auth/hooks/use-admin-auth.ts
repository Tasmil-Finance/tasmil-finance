"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuthStore } from "@/store/use-admin-auth";

interface LoginResult {
  success: boolean;
  accessToken?: string;
  admin?: { id: string; email: string; role: string };
  message?: string;
}

export function useAdminAuth() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string): Promise<LoginResult> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();
      const data = json.data ?? json;

      if (!response.ok) {
        setError(data.message ?? "Login failed");
        return { success: false, message: data.message };
      }

      setAuth(data.accessToken, data.admin);
      return { success: true, accessToken: data.accessToken, admin: data.admin };
    } catch (_err) {
      setError("Network error. Please try again.");
      return { success: false, message: "Network error" };
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    useAdminAuthStore.getState().clearAuth();
    router.push("/admin/login");
  }

  return { login, logout, isLoading, error };
}
