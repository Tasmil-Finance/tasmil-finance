"use client";

import { Copy, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ConnectWalletButton } from "@/shared/components/connect-wallet-button";
import { useWallet } from "@/shared/context/wallet-context";
import { sidebarData } from "@/shared/layout/sidebar-data";
import { Badge } from "@/shared/ui/badge";
import Balatro from "@/shared/ui/balatro";
import { Button } from "@/shared/ui/button-v2";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Typography } from "@/shared/ui/typography";

// Component to generate abstract avatar from address
const AddressAvatar = ({ address, size = "size-12" }: { address: string; size?: string }) => {
  const hash = address.split("").reduce((acc, char) => {
    const newAcc = (acc << 5) - acc + char.charCodeAt(0);
    return newAcc & newAcc;
  }, 0);

  const colors = [
    "bg-gradient-to-br from-blue-500 to-purple-600",
    "bg-gradient-to-br from-green-500 to-blue-600",
    "bg-gradient-to-br from-purple-500 to-pink-600",
    "bg-gradient-to-br from-orange-500 to-red-600",
    "bg-gradient-to-br from-cyan-500 to-blue-600",
    "bg-gradient-to-br from-pink-500 to-purple-600",
    "bg-gradient-to-br from-yellow-500 to-orange-600",
    "bg-gradient-to-br from-indigo-500 to-purple-600",
  ];

  const colorIndex = Math.abs(hash) % colors.length;
  const gradientClass = colors[colorIndex];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-white/20 font-bold text-sm text-white",
        size,
        gradientClass
      )}
    >
      <User className="size-5" />
    </div>
  );
};

export function MobileSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [depositOpen, setDepositOpen] = useState(false);
  const { isConnected, address, displayAddress, disconnect } = useWallet();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Header */}
      <div className="flex-shrink-0 p-4">
        <Link
          href="/chat/new"
          className="flex items-center gap-2"
          {...(onClose && { onClick: onClose })}
        >
          <Image
            alt={sidebarData.header.brand_name}
            height={45}
            src={sidebarData.header.logo_url}
            width={45}
          />
          <div className="ml-1 grid flex-1 gap-1 text-left leading-tight">
            <div className="flex items-center gap-2">
              <span className="animate-shimmer-text bg-[length:200%_100%] bg-gradient-to-r from-[#b5eaff] via-white to-[#00bfff] bg-clip-text font-semibold text-transparent text-xl">
                {sidebarData.header.brand_name}
              </span>
              <Badge
                className="h-4 rounded-full border-0 bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] px-1.5 py-0 font-bold text-[8px] text-black"
                variant="outline"
              >
                {process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "MAINNET" : "TESTNET"}
              </Badge>
            </div>
            <Typography className="text-sm">{sidebarData.header.tagline}</Typography>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <nav className="space-y-2">
          {sidebarData.navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              {group.items.map((item) => {
                // Check if active - also highlight Agents for /chat/* routes
                const isActive =
                  pathname === item.url ||
                  pathname.startsWith(`${item.url}/`) ||
                  (item.url === "/chat/new" && pathname.startsWith("/chat/"));
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    {...(onClose && { onClick: onClose })}
                    className={cn(
                      "flex items-center gap-3 rounded-full px-4 py-3 font-medium text-sm transition-colors",
                      isActive
                        ? "bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black shadow-md"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-black" : "text-sidebar-foreground"
                        )}
                      />
                    )}
                    <span
                      className={isActive ? "font-semibold text-black" : "text-sidebar-foreground"}
                    >
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer - Wallet functionality */}
      <div className="flex-shrink-0 p-2">
        <div>
          {(() => {
            if (!isConnected) {
              return <ConnectWalletButton />;
            }

            return (
              <div className="flex w-full flex-col gap-2">
                {/* Quest Card */}
                <a
                  href="https://quest.tasmil-finance.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="group relative h-32 cursor-pointer overflow-hidden rounded-xl border border-border bg-zinc-900 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20">
                    <div className="absolute inset-0">
                      <Balatro
                        isRotate={false}
                        mouseInteraction={true}
                        pixelFilter={700}
                        color3="#4b555902"
                        color2="#516d72ff"
                        color1="#56c8eeff"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="relative z-10 flex h-full flex-col justify-end p-4">
                      <Typography className="mb-1 text-white" size="lg" weight="bold">
                        Complete Quests
                      </Typography>
                      <Typography className="mb-2 text-gray-300" size="xs">
                        Earn rewards by completing tasks
                      </Typography>
                      <div className="flex items-center gap-1 text-primary transition-all group-hover:gap-2">
                        <Typography className="text-primary" size="sm" weight="semibold">
                          Start Now
                        </Typography>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </a>

                {/* User Info */}
                <Button
                  className="flex h-auto items-center justify-start gap-2 rounded-xl bg-zinc-800/50 p-3 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                  onClick={disconnect}
                  variant="ghost"
                >
                  <AddressAvatar address={address || ""} size="size-8" />
                  <div className="flex flex-1 items-center justify-between">
                    <Typography className="text-white" size="sm" weight="medium">
                      {displayAddress}
                    </Typography>
                    <Typography className="text-gray-400" size="xs">
                      Disconnect
                    </Typography>
                  </div>
                </Button>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-4 py-1">
                  <a
                    className="text-gray-400 transition-colors hover:text-white"
                    href="https://x.com/tasmilfinance"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    className="text-gray-400 transition-colors hover:text-white"
                    href="https://tasmil.gitbook.io/tasmil-docs"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Typography className="text-gray-400 hover:text-white" size="xs" weight="bold">
                      DOCS
                    </Typography>
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Deposit Dialog */}
          <Dialog onOpenChange={setDepositOpen} open={depositOpen}>
            <DialogContent className="max-w-lg border-zinc-800 bg-zinc-900">
              <DialogHeader>
                <DialogTitle className="text-2xl">Deposit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-4 rounded-xl bg-zinc-800/50 p-4">
                  <div className="flex-1 space-y-2">
                    <Typography className="text-gray-400" size="sm">
                      Your Wallet Address
                    </Typography>
                    <Typography className="break-all font-mono text-white" size="xs">
                      {address || "Not connected"}
                    </Typography>
                    <Button
                      className="mt-2 flex items-center gap-2 rounded-md text-gray-400 hover:text-white"
                      onClick={() => {
                        if (address) {
                          navigator.clipboard.writeText(address);
                        }
                      }}
                      variant="secondary"
                    >
                      <Copy className="h-4 w-4" />
                      <Typography size="xs">Copy Address</Typography>
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full rounded-full"
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address);
                    }
                  }}
                  variant="gradient"
                >
                  Copy Address
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
