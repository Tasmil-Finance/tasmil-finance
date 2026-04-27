"use client";

import { BarChart3, Coins, ExternalLink, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TourTriggerButton } from "@/features/onboarding/components/tour-trigger-button";
import { AddressAvatar, ConnectWalletButton } from "@/shared/components/connect-wallet-button";
import { useWallet } from "@/shared/context/wallet-context";
import { useStellarBalance } from "@/shared/hooks/use-stellar-balance";
import { useUserStatus } from "@/shared/hooks/use-user-status";
import BorderGlow from "../ui/border-glow";
import { CopyButton } from "../ui/copy-button";
import { useSidebar } from "../ui/sidebar";
import { TooltipProvider } from "../ui/tooltip";
import { Typography } from "../ui/typography";

// Social Links Constants
const SOCIAL_LINKS = {
  DOCS: "https://tasmil.gitbook.io/tasmil-docs",
  X: "https://x.com/tasmilfinance",
  DISCORD: "#", // Discord link not provided
} as const;

export function FooterSidebarSection() {
  const { state } = useSidebar();
  const isOpen = state === "expanded";
  const { isConnected, address, displayAddress, disconnect } = useWallet();
  const { xlm, isLoading } = useStellarBalance(address);
  const { status: userStatus } = useUserStatus();

  return (
    <div>
      {(() => {
        if (!isConnected) {
          return isOpen ? <ConnectWalletButton /> : <ConnectWalletButton compact />;
        }

        return isOpen ? (
          <div data-onborda="wallet-info" className="flex w-full flex-col gap-2 px-2">
            {/* User Status Card */}
            <BorderGlow
              backgroundColor="#18181b"
              borderRadius={12}
              glowColor="195 80 70"
              colors={["#00BFFF22", "#B5EAFF11", "#0080FF22"]}
              glowIntensity={0.6}
              glowRadius={20}
            >
              <div className="flex flex-col gap-2.5 p-4">
                <Link
                  href="/rewards/welcome"
                  className="flex items-center justify-between group/volume"
                >
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
                    <Typography className="text-gray-300 group-hover/volume:text-white transition-colors" size="xs">
                      Volume
                    </Typography>
                    <ExternalLink className="h-3 w-3 text-gray-500 group-hover/volume:text-white transition-colors" />
                  </div>
                  <Typography className="text-white" size="sm" weight="semibold">
                    ${userStatus?.volumeUsd?.toFixed(2) ?? "0.00"}
                  </Typography>
                </Link>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-gray-400" />
                    <Typography className="text-gray-300" size="xs">
                      Points
                    </Typography>
                  </div>
                  <Typography className="text-white" size="sm" weight="semibold">
                    {userStatus?.points ?? 0} PTS
                  </Typography>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-gray-400" />
                    <Typography className="text-gray-300" size="xs">
                      Credits
                    </Typography>
                  </div>
                  <Typography className="text-white" size="sm" weight="semibold">
                    {userStatus?.chatCredits
                      ? `${userStatus.chatCredits.remaining * 10}`
                      : "-"}
                  </Typography>
                </div>
              </div>
            </BorderGlow>

            {/* XLM Balance Display */}
            <BorderGlow
              backgroundColor="#18181b"
              borderRadius={12}
              glowColor="195 80 70"
              colors={["#00BFFF22", "#B5EAFF11", "#0080FF22"]}
              glowIntensity={0.6}
              glowRadius={20}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <Image
                  src="/token/xlm.png"
                  alt="Stellar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <Typography className="text-gray-400" size="xs">
                    Balance
                  </Typography>
                  <Typography className="text-white" size="sm" weight="semibold">
                    {isLoading ? "..." : `${xlm.toFixed(1)} XLM`}
                  </Typography>
                </div>
              </div>
            </BorderGlow>

            {/* Profile Section */}
            <BorderGlow
              backgroundColor="#18181b"
              borderRadius={12}
              glowColor="195 80 70"
              colors={["#00BFFF22", "#B5EAFF11", "#0080FF22"]}
              glowIntensity={0.6}
              glowRadius={20}
            >
              <div className="flex items-center gap-3 py-2 px-3">
                <AddressAvatar address={address || ""} size="size-9" />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <Typography className="font-mono text-white" size="sm" weight="medium">
                      {displayAddress}
                    </Typography>
                    <CopyButton text={address || ""} />
                  </div>
                  <button
                    className="w-fit mt-0.5 text-left text-xs text-red-400 transition-colors hover:text-red-500"
                    onClick={disconnect}
                    type="button"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </BorderGlow>

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
                <Typography className="text-gray-400 hover:text-white" size="xs" weight="bold">
                  DOCS
                </Typography>
              </a>
            </div>

            <TourTriggerButton />
          </div>
        ) : (
          <TooltipProvider>
            <div className="flex w-full flex-col items-center gap-2">
              {/* Quest Card - Collapsed - Commented out */}
              {/* <a
                href="https://quest.tasmil-finance.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <div className="group relative flex h-12 w-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-border bg-zinc-900 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20">
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
                  <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                    <Typography className="text-center text-white uppercase" size="xs" weight="bold">
                      Quest
                    </Typography>
                  </div>
                </div>
              </a> */}

              {/* Status Card - Collapsed */}
              <BorderGlow
                className="w-full"
                backgroundColor="#18181b"
                borderRadius={12}
                glowColor="195 80 70"
                colors={["#00BFFF22", "#B5EAFF11", "#0080FF22"]}
                glowIntensity={0.6}
                glowRadius={15}
              >
                <div className="flex w-full flex-col items-center py-2.5">
                  <Link
                    href="/rewards/welcome"
                    className="flex flex-col items-center group/volume py-1"
                  >
                    <Typography className="text-gray-400 group-hover/volume:text-white transition-colors" size="xs" weight="semibold">
                      ${userStatus?.volumeUsd?.toFixed(0) ?? "0"}
                    </Typography>
                  </Link>
                  <div className="w-3/4 border-t border-zinc-700/50 my-1" />
                  <div className="flex flex-col items-center py-1">
                    <Typography className="text-gray-400" size="xs" weight="semibold">
                      {userStatus?.points ?? 0}
                    </Typography>
                  </div>
                  <div className="w-3/4 border-t border-zinc-700/50 my-1" />
                  <div className="flex flex-col items-center py-1">
                    <Typography className="text-gray-400" size="xs" weight="semibold">
                      {userStatus?.chatCredits ? `${userStatus.chatCredits.remaining * 10}` : "-"}
                    </Typography>
                  </div>
                </div>
              </BorderGlow>

              {/* Balance - Collapsed */}
              <BorderGlow
                className="w-full"
                backgroundColor="#18181b"
                borderRadius={12}
                glowColor="195 80 70"
                colors={["#00BFFF22", "#B5EAFF11", "#0080FF22"]}
                glowIntensity={0.6}
                glowRadius={15}
              >
                <div className="flex h-14 w-full flex-col items-center justify-center gap-1">
                  <Image
                    src="/token/xlm.png"
                    alt="Stellar"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <Typography className="text-center text-white" size="sm" weight="semibold">
                    {isLoading ? "..." : `${xlm.toFixed(1)}`}
                  </Typography>
                </div>
              </BorderGlow>

              {/* Profile - Collapsed */}
              <BorderGlow
                className="w-full"
                backgroundColor="#18181b"
                borderRadius={12}
                glowColor="195 80 70"
                colors={["#00BFFF22", "#B5EAFF11", "#0080FF22"]}
                glowIntensity={0.6}
                glowRadius={15}
              >
                <div className="flex h-12 w-full items-center justify-center">
                  <AddressAvatar address={address || ""} size="size-7" />
                </div>
              </BorderGlow>
            </div>
          </TooltipProvider>
        );
      })()}

      {/* Deposit Dialog */}
      {/* <Dialog onOpenChange={setDepositOpen} open={depositOpen}>
        <DialogContent className="max-w-lg border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-2xl">Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 rounded-xl bg-zinc-800/50 p-4">
              <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-white p-2">
                {address ? (
                  <QRCodeSVG level="H" size={144} value={address} />
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

            <Typography className="text-gray-400" size="xs">
              Only deposit assets on Stellar network for this address.
            </Typography>

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
      </Dialog> */}
    </div>
  );
}
