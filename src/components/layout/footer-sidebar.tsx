"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronRight, Copy, User, Wallet } from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Button } from "@/components/ui/button-v2";
import CountUp from "@/components/ui/count-up";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import Balatro from "../ui/balatro";

// Social Links Constants
const SOCIAL_LINKS = {
  DOCS: "https://tasmil.gitbook.io/tasmil-docs",
  X: "https://x.com/tasmilfinance",
  DISCORD: "#", // Discord link not provided
} as const;

// Component to generate abstract avatar from address
const AddressAvatar = ({ address, size = "size-12" }: { address: string; size?: string }) => {
  // Generate a simple hash from address for consistent colors
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

export function FooterSidebarSection() {
  const { state } = useSidebar();
  const isOpen = state === "expanded";
  const [depositOpen, setDepositOpen] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const account = useAccount();
  const { data: balance } = useBalance({
    address: account.address,
  });

  const formattedBalance = balance
    ? Number.parseFloat(formatUnits(balance.value || BigInt(0), balance.decimals || 0))
    : 0;

  return (
    <ConnectButton.Custom>
      {({
        account: accountData,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          accountData &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return isOpen ? (
                  <Button className="w-full" onClick={openConnectModal} variant="gradient">
                    Connect Wallet
                  </Button>
                ) : (
                  <Button className="h-10 w-10 p-0" onClick={openConnectModal} variant="gradient">
                    <Wallet className="h-5 w-5" />
                  </Button>
                );
              }

              if (chain.unsupported) {
                return isOpen ? (
                  <Button className="min-w-[140px]" onClick={openChainModal} variant="destructive">
                    Wrong Network
                  </Button>
                ) : (
                  <Button className="h-10 w-10 p-0" onClick={openChainModal} variant="destructive">
                    <Wallet className="h-5 w-5" />
                  </Button>
                );
              }

              return isOpen ? (
                <div className="flex w-full flex-col gap-2 px-2">
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

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                      {/* Content */}
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

                  {/* Balance Card */}
                  <Button
                    className="flex h-auto items-center justify-start gap-2 rounded-xl bg-zinc-800/50 p-3 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                    onClick={() => setDepositOpen(true)}
                    variant="ghost"
                  >
                    <Image
                      alt="U2U"
                      className="rounded-full"
                      height={20}
                      src="/token/u2u.png"
                      width={20}
                    />
                    <CountUp
                      abbreviate={false}
                      className="font-medium text-sm text-white"
                      decimals={4}
                      suffix=" U2U"
                      value={formattedBalance}
                    />
                  </Button>

                  <Button
                    className="flex h-auto items-center justify-start gap-2 rounded-xl bg-zinc-800/50 p-3 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                    onClick={openAccountModal}
                    variant="ghost"
                  >
                    <AddressAvatar address={accountData?.address || ""} size="size-8" />
                    <div className="flex flex-1 items-center justify-between">
                      <Typography className="text-white" size="sm" weight="medium">
                        {accountData?.displayName}
                      </Typography>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Button>

                  {/* Social Links */}
                  <div className="flex items-center justify-center gap-4 py-1">
                    <a
                      className="text-gray-400 transition-colors hover:text-white"
                      href={SOCIAL_LINKS.X}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      className="text-gray-400 transition-colors hover:text-white"
                      href={SOCIAL_LINKS.DOCS}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Typography
                        className="text-gray-400 hover:text-white"
                        size="xs"
                        weight="bold"
                      >
                        DOCS
                      </Typography>
                    </a>
                  </div>
                </div>
              ) : (
                <TooltipProvider>
                  <div className="flex w-full flex-col items-center gap-2">
                    {/* Quest Icon */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="https://quest.tasmil.finance"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-xl bg-zinc-800/50 p-1 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-zinc-800/70"
                            variant="ghost"
                          >
                            <Typography
                              className="text-[10px] text-white leading-none"
                              weight="semibold"
                            >
                              QUEST
                            </Typography>
                          </Button>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <Typography size="xs">Complete Quests</Typography>
                      </TooltipContent>
                    </Tooltip>

                    {/* Balance Icon */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 p-0 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                          onClick={() => setDepositOpen(true)}
                          variant="ghost"
                        >
                          <Image
                            alt="U2U"
                            className="rounded-full"
                            height={24}
                            src="/token/u2u.png"
                            width={24}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <CountUp
                          abbreviate={false}
                          className="text-xs"
                          decimals={4}
                          suffix=" U2U"
                          value={formattedBalance}
                        />
                      </TooltipContent>
                    </Tooltip>

                    {/* User Avatar */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 p-0 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                          onClick={openAccountModal}
                          variant="ghost"
                        >
                          <AddressAvatar address={accountData?.address || ""} size="size-8" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <Typography size="xs">{accountData?.displayName}</Typography>
                      </TooltipContent>
                    </Tooltip>

                    {/* More Options - Social Icons */}
                    <Tooltip onOpenChange={setShowSocial} open={showSocial}>
                      <TooltipTrigger asChild>
                        <Button
                          className="mt-2 flex h-8 w-8 items-center justify-center p-0 text-gray-400 transition-colors hover:text-white"
                          variant="ghost"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="p-2" side="right">
                        <div className="flex items-center gap-3">
                          <a
                            className="text-gray-400 transition-colors hover:text-white"
                            href={SOCIAL_LINKS.X}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>
                          <a
                            className="text-gray-400 transition-colors hover:text-white"
                            href={SOCIAL_LINKS.DOCS}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <Typography
                              className="text-gray-400 hover:text-white"
                              size="xs"
                              weight="bold"
                            >
                              DOCS
                            </Typography>
                          </a>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              );
            })()}

            {/* Deposit Dialog */}
            <Dialog onOpenChange={setDepositOpen} open={depositOpen}>
              <DialogContent className="max-w-lg border-zinc-800 bg-zinc-900">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Deposit</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Token Selection */}
                  <div className="flex items-center justify-between rounded-xl bg-zinc-800/50 p-4">
                    <div className="flex items-center gap-2">
                      <Image
                        alt="U2U"
                        className="rounded-full"
                        height={32}
                        src="/token/u2u.png"
                        width={32}
                      />
                      <Typography className="text-white" size="lg" weight="semibold">
                        U2U
                      </Typography>
                    </div>
                    <div className="text-right">
                      <Typography className="text-gray-400" size="xs">
                        Balance:
                      </Typography>
                      <CountUp
                        abbreviate={false}
                        className="font-medium text-sm text-white"
                        decimals={4}
                        suffix=" U2U"
                        value={formattedBalance}
                      />
                    </div>
                  </div>

                  {/* QR Code and Address */}
                  <div className="flex gap-4 rounded-xl bg-zinc-800/50 p-4">
                    <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-white p-2">
                      {accountData?.address ? (
                        <QRCodeSVG level="H" size={144} value={accountData.address} />
                      ) : (
                        <Typography className="text-black" size="sm">
                          No Address
                        </Typography>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Typography className="text-gray-400" size="sm">
                        Your Wallet Address
                      </Typography>
                      <Typography className="break-all font-mono text-white" size="xs">
                        {accountData?.address || "Not connected"}
                      </Typography>
                      <Button
                        className="mt-2 flex items-center gap-2 rounded-md text-gray-400 hover:text-white"
                        onClick={() => {
                          if (accountData?.address) {
                            navigator.clipboard.writeText(accountData.address);
                          }
                        }}
                        variant="secondary"
                      >
                        <Copy className="h-4 w-4" />
                        <Typography size="xs">Copy Address</Typography>
                      </Button>
                    </div>
                  </div>

                  <Typography className="text-gray-400" size="xs">
                    Only deposit assets on {chain?.name || "this network"} for this address.
                  </Typography>

                  <Button
                    className="w-full rounded-full"
                    onClick={() => {
                      if (accountData?.address) {
                        navigator.clipboard.writeText(accountData.address);
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
        );
      }}
    </ConnectButton.Custom>
  );
}
