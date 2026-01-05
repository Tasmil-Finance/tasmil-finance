"use client";

import { useWallet } from "@/context/wallet-context";
import { useMultiSidebar } from "@/components/ui/multi-sidebar";
import { Button } from "@/components/ui/button-v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, DollarSign, Activity } from "lucide-react";

export default function DashboardPage() {
  const { isConnected, isAuthenticated, displayAddress, user, connect, isAuthenticating } =
    useWallet();

  const { leftSidebarOpen, rightSidebarOpen, isMobile } = useMultiSidebar();

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Wallet className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="font-semibold text-2xl">Connect Your Wallet</h2>
          <p className="max-w-md text-muted-foreground">
            Connect your wallet to access your DeFi dashboard and start managing your portfolio.
          </p>
          <Button onClick={connect} size="lg">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (isAuthenticating) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-primary border-b-2"></div>
          <h2 className="font-semibold text-2xl">Authenticating...</h2>
          <p className="text-muted-foreground">
            Please sign the message in your wallet to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {displayAddress}! Here's your DeFi overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$12,345.67</div>
            <p className="text-muted-foreground text-xs">+2.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$8,901.23</div>
            <p className="text-muted-foreground text-xs">+5.2% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Positions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">7</div>
            <p className="text-muted-foreground text-xs">3 profitable positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Yield Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$234.56</div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Status */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Sidebar Status</CardTitle>
          <CardDescription>Current state of the sidebar system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded border p-3">
              <span>Device Type</span>
              <span className={isMobile ? "text-blue-500" : "text-green-500"}>
                {isMobile ? "Mobile" : "Desktop"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded border p-3">
              <span>Left Sidebar (Navigation)</span>
              <span className={leftSidebarOpen ? "text-green-500" : "text-red-500"}>
                {leftSidebarOpen ? "Open" : "Closed"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded border p-3">
              <span>Right Sidebar (Chat History)</span>
              <span className={rightSidebarOpen ? "text-green-500" : "text-red-500"}>
                {rightSidebarOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your connected wallet details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-sm">Wallet Address:</span>
                <span className="text-muted-foreground text-sm">{displayAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-sm">Account Type:</span>
                <span className="text-muted-foreground text-sm capitalize">{user.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-sm">Connected Since:</span>
                <span className="text-muted-foreground text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
