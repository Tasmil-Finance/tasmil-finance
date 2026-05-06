"use client";

import { Bot, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/features/admin-auth/hooks/use-admin-auth";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, isLoading, error } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result?.success) {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Background with subtle gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8">
        {/* Logo/Brand */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Bot className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="mb-8 text-center">
          <Typography variant="h2" className="mb-2 font-bold text-2xl tracking-tight">
            Admin Portal
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-sm">
            Sign in to manage the whitelist and campaigns
          </Typography>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block font-medium text-sm">
              Email
            </label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zyf.ai"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1.5 block font-medium text-sm">
              Password
            </label>
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <Typography variant="p" className="text-destructive text-sm">
                {error}
              </Typography>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="h-11 w-full" variant="gradient">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
