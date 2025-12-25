"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Copy,
  CreditCard,
  Loader2,
  User,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Button } from "@/components/ui/button-v2";
import { Calendar } from "@/components/ui/calendar";
import CountUp from "@/components/ui/count-up";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import {
  fetchTxCredit,
  processRecharge,
  RECHARGE_OPTIONS,
  type RechargeOption,
  type TxCreditData,
} from "@/lib/mock-data/tx-credit";
import { cn } from "@/lib/utils";

// Social Links Constants
const SOCIAL_LINKS = {
  DOCS: "https://tasmil.gitbook.io/tasmil-docs",
  X: "https://x.com/tasmilfinance",
  DISCORD: "#", // Discord link not provided
} as const;

// Component to generate abstract avatar from address
const AddressAvatar = ({
  address,
  size = "size-12",
}: {
  address: string;
  size?: string;
}) => {
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
  const { open: isOpen } = useSidebar();
  const [dailyCheckInOpen, setDailyCheckInOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const account = useAccount();
  const { data: balance } = useBalance({
    address: account.address,
  });

  const formattedBalance = balance
    ? Number.parseFloat(formatUnits(balance.value || 0n, balance.decimals || 0))
    : 0;

  const [txCredit, setTxCredit] = useState<TxCreditData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedRechargeOption, setSelectedRechargeOption] =
    useState<RechargeOption | null>(null);

  // Daily Check-in mockdata state
  const [checkedInDates, setCheckedInDates] = useState<Set<string>>(
    new Set([
      // Mock some previous check-ins (last 7 days with some gaps)
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toDateString(), // Yesterday
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toDateString(), // 2 days ago
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toDateString(), // 3 days ago
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toDateString(), // 5 days ago
    ])
  );
  const [totalPoints, setTotalPoints] = useState(420);
  const [currentStreak, setCurrentStreak] = useState(3);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Loading states
  const [txCreditLoading, setTxCreditLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [txCreditData] = await Promise.all([fetchTxCredit()]);
        setTxCredit(txCreditData);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load TX Credit data. Please refresh the page.");
      } finally {
        setTxCreditLoading(false);
      }
    };
    loadData();
  }, []);

  // Handle recharge option selection
  const handleRechargeOptionClick = (option: RechargeOption) => {
    setSelectedRechargeOption(option);
    toast.info(
      `Selected ${option.amount.toLocaleString()} TX Credits for ${
        option.price
      } USDT`
    );
  };

  // Handle payment processing
  const handleProceedToPayment = async () => {
    if (!selectedRechargeOption) {
      toast.error("Please select a recharge option first.");
      return;
    }

    setProcessingPayment(true);

    try {
      const response = await processRecharge(
        selectedRechargeOption.amount,
        selectedRechargeOption.price
      );

      if (response.success) {
        // Update local state with new credits
        setTxCredit(response.newCredits);

        // Show success message
        toast.success(response.message);

        // Show transaction ID if available
        if (response.transactionId) {
          setTimeout(() => {
            toast.info(`Transaction ID: ${response.transactionId}`);
          }, 1500);
        }

        // Reset selection and close dialog
        setSelectedRechargeOption(null);
        setTimeout(() => {
          setRechargeOpen(false);
        }, 2000);
      } else {
        // Show error message
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle daily check-in
  const handleCheckIn = async () => {
    const today = new Date().toDateString();

    // Check if already checked in today
    if (checkedInDates.has(today)) {
      return;
    }

    setCheckInLoading(true);
    setCheckInSuccess(false);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add today to checked-in dates
    setCheckedInDates((prev) => new Set([...prev, today]));

    // Award points (base 10 points + bonus for streak)
    const pointsEarned = 10 + currentStreak * 2;
    setTotalPoints((prev) => prev + pointsEarned);

    // Increment streak
    setCurrentStreak((prev) => prev + 1);

    setCheckInLoading(false);
    setCheckInSuccess(true);

    // Reset success message after 3 seconds
    setTimeout(() => setCheckInSuccess(false), 3000);
  };

  // Check if a date has been checked in
  const isDateCheckedIn = (date: Date) => {
    return checkedInDates.has(date.toDateString());
  };

  // Check if today is checked in
  const isTodayCheckedIn = checkedInDates.has(new Date().toDateString());

  const txCreditPercentage = txCredit
    ? ((txCredit.free / txCredit.freeMax) * 100).toFixed(1)
    : "0";

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
                  <Button
                    className="w-full"
                    onClick={openConnectModal}
                    variant="gradient"
                  >
                    Connect Wallet
                  </Button>
                ) : (
                  <Button
                    className="h-10 w-10 p-0"
                    onClick={openConnectModal}
                    variant="gradient"
                  >
                    <Wallet className="h-5 w-5" />
                  </Button>
                );
              }

              if (chain.unsupported) {
                return isOpen ? (
                  <Button
                    className="min-w-[140px]"
                    onClick={openChainModal}
                    variant="destructive"
                  >
                    Wrong Network
                  </Button>
                ) : (
                  <Button
                    className="h-10 w-10 p-0"
                    onClick={openChainModal}
                    variant="destructive"
                  >
                    <Wallet className="h-5 w-5" />
                  </Button>
                );
              }

              return isOpen ? (
                <div className="flex w-full flex-col gap-2 px-2">
                  {/* Daily Check In Card */}
                  <Button
                    className="flex h-auto items-center justify-start gap-2 rounded-xl bg-zinc-800/50 p-3 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                    onClick={() => setDailyCheckInOpen(true)}
                    variant="ghost"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    <Typography
                      className="text-white"
                      size="sm"
                      weight="medium"
                    >
                      Daily Check In
                    </Typography>
                  </Button>

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

                  {/* TX Credit Card */}
                  <div className="flex flex-col gap-2 rounded-xl bg-zinc-800/50 p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-white" />
                      <Typography
                        className="text-white"
                        size="sm"
                        weight="semibold"
                      >
                        TX Credit
                      </Typography>
                    </div>

                    {txCreditLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <Typography className="text-gray-300" size="xs">
                              Paid: {txCredit?.paid}/{txCredit?.paidMax}
                            </Typography>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                            <Typography className="text-gray-300" size="xs">
                              Free: {txCredit?.free}/{txCredit?.freeMax}
                            </Typography>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF]"
                            style={{ width: `${txCreditPercentage}%` }}
                          />
                        </div>
                      </>
                    )}

                    {/* Recharge Button */}
                    <Button
                      className="my-2 h-7 rounded-full border-primary"
                      onClick={() => setRechargeOpen(true)}
                      variant="outline"
                    >
                      Recharge
                    </Button>
                  </div>

                  {/* User Profile Card */}
                  <Button
                    className="flex h-auto items-center justify-start gap-2 rounded-xl bg-zinc-800/50 p-3 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                    onClick={openAccountModal}
                    variant="ghost"
                  >
                    <AddressAvatar
                      address={accountData?.address || ""}
                      size="size-8"
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <Typography
                        className="text-white"
                        size="sm"
                        weight="medium"
                      >
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
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    {/* <a
                      className="text-gray-400 transition-colors hover:text-white"
                      href={SOCIAL_LINKS.DISCORD}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    </a> */}
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
                    {/* Daily Check In Icon */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 p-0 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                          onClick={() => setDailyCheckInOpen(true)}
                          variant="ghost"
                        >
                          <CalendarIcon className="h-5 w-5 text-white" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <Typography size="xs">Daily Check In</Typography>
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

                    {/* TX Credit Icon */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 p-0 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
                          variant="ghost"
                        >
                          {txCreditLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <>
                              <Typography
                                className="text-white"
                                size="sm"
                                weight="bold"
                              >
                                TX
                              </Typography>
                              {/* Small progress indicator */}
                              <div className="absolute bottom-1 left-1 h-1 w-10 overflow-hidden rounded-full bg-zinc-700">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF]"
                                  style={{ width: `${txCreditPercentage}%` }}
                                />
                              </div>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <Typography size="xs">
                          {txCreditLoading
                            ? "Loading..."
                            : `TX Credit: ${txCredit?.free}/${txCredit?.freeMax}`}
                        </Typography>
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
                          <AddressAvatar
                            address={accountData?.address || ""}
                            size="size-8"
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <Typography size="xs">
                          {accountData?.displayName}
                        </Typography>
                      </TooltipContent>
                    </Tooltip>

                    {/* More Options - Social Icons */}
                    <Tooltip onOpenChange={setShowSocial} open={showSocial}>
                      <TooltipTrigger asChild>
                        <Button
                          className="mt-2 flex h-8 w-8 items-center justify-center p-0 text-gray-400 transition-colors hover:text-white"
                          variant="ghost"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>
                          {/* <a
                            className="text-gray-400 transition-colors hover:text-white"
                            href={SOCIAL_LINKS.DISCORD}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                          </a> */}
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

            {/* Daily Check-in Dialog */}
            <Dialog onOpenChange={setDailyCheckInOpen} open={dailyCheckInOpen}>
              <DialogContent className="max-w-md border-zinc-800 bg-zinc-900">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <CalendarIcon className="h-6 w-6" />
                    Daily Check-in
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-4">
                  {/* Stats Section */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center rounded-lg bg-zinc-800/50 p-3">
                      <Typography className="text-gray-400" size="xs">
                        Total Points
                      </Typography>
                      <Typography
                        className="text-primary"
                        size="xl"
                        weight="bold"
                      >
                        {totalPoints}
                      </Typography>
                    </div>
                    <div className="flex flex-col items-center rounded-lg bg-zinc-800/50 p-3">
                      <Typography className="text-gray-400" size="xs">
                        Current Streak
                      </Typography>
                      <Typography
                        className="text-orange-400"
                        size="xl"
                        weight="bold"
                      >
                        {currentStreak}
                      </Typography>
                    </div>
                    <div className="flex flex-col items-center rounded-lg bg-zinc-800/50 p-3">
                      <Typography className="text-gray-400" size="xs">
                        Total Days
                      </Typography>
                      <Typography
                        className="text-green-400"
                        size="xl"
                        weight="bold"
                      >
                        {checkedInDates.size}
                      </Typography>
                    </div>
                  </div>

                  {/* Success Message */}
                  {checkInSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-500/20 p-3 text-green-400">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          clipRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          fillRule="evenodd"
                        />
                      </svg>
                      <Typography size="sm" weight="medium">
                        Check-in successful! +{10 + (currentStreak - 1) * 2}{" "}
                        points
                      </Typography>
                    </div>
                  )}

                  {/* Calendar */}
                  <Calendar
                    captionLayout="dropdown"
                    className="w-full rounded-md border border-zinc-800 shadow-sm"
                    mode="single"
                    modifiers={{
                      checkedIn: (date) => isDateCheckedIn(date),
                    }}
                    modifiersStyles={{
                      checkedIn: {
                        backgroundColor: "rgba(59, 130, 246, 0.3)",
                        color: "white",
                        fontWeight: "bold",
                        border: "2px solid rgb(59, 130, 246)",
                      },
                    }}
                    onSelect={setSelectedDate}
                    selected={selectedDate}
                  />

                  {/* Check-in Button */}
                  <Button
                    className="w-full rounded-full"
                    disabled={isTodayCheckedIn || checkInLoading}
                    onClick={handleCheckIn}
                    variant="gradient"
                  >
                    {checkInLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking in...
                      </div>
                    ) : isTodayCheckedIn ? (
                      "Already Checked In Today"
                    ) : (
                      `Check In Today (+${10 + currentStreak * 2} points)`
                    )}
                  </Button>

                  {/* Info Text */}
                  <Typography className="text-center text-gray-400" size="xs">
                    {isTodayCheckedIn
                      ? "Come back tomorrow for your next check-in!"
                      : "Check in daily to earn points and maintain your streak!"}
                  </Typography>
                </div>
              </DialogContent>
            </Dialog>

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
                      <Typography
                        className="text-white"
                        size="lg"
                        weight="semibold"
                      >
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
                        <QRCodeSVG
                          level="H"
                          size={144}
                          value={accountData.address}
                        />
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
                      <Typography
                        className="break-all font-mono text-white"
                        size="xs"
                      >
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
                    Only deposit assets on {chain?.name || "this network"} for
                    this address.
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

            {/* Recharge Dialog */}
            <Dialog onOpenChange={setRechargeOpen} open={rechargeOpen}>
              <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-900">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Recharge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Current TX Credit */}
                  <div className="space-y-2">
                    <Typography
                      className="text-white"
                      size="lg"
                      weight="semibold"
                    >
                      Current TX Credit
                    </Typography>
                    {txCreditLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <Typography className="text-white" size="sm">
                              Paid: {txCredit?.paid}/{txCredit?.paidMax}
                            </Typography>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary/70" />
                            <Typography className="text-white" size="sm">
                              Free: {txCredit?.free}/{txCredit?.freeMax}
                            </Typography>
                          </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF]"
                            style={{ width: `${txCreditPercentage}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Recharge Options */}
                  <div className="grid grid-cols-4 gap-3">
                    {RECHARGE_OPTIONS.map((option) => (
                      <Button
                        className={cn(
                          "relative flex h-auto flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary",
                          selectedRechargeOption?.amount === option.amount
                            ? "border-primary bg-primary/10 ring-2 ring-primary"
                            : option.popular
                            ? "border-primary/50 bg-zinc-800/50"
                            : "border-zinc-700 bg-zinc-800/30"
                        )}
                        disabled={processingPayment}
                        key={option.amount}
                        onClick={() => handleRechargeOptionClick(option)}
                        variant="ghost"
                      >
                        {option.popular && (
                          <span className="-top-2 absolute rounded-full bg-primary px-2 py-0.5 font-bold text-black text-xs">
                            Popular
                          </span>
                        )}
                        <Typography
                          className="text-white"
                          size="xl"
                          weight="bold"
                        >
                          {option.amount.toLocaleString()}
                        </Typography>
                        <Typography className="text-gray-400" size="xs">
                          Tx Credit
                        </Typography>
                        <Typography
                          className="text-primary"
                          size="sm"
                          weight="semibold"
                        >
                          {option.price} USDT
                        </Typography>
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full rounded-full"
                    disabled={!selectedRechargeOption || processingPayment}
                    onClick={handleProceedToPayment}
                    variant="gradient"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      "Proceed to Crypto Payment"
                    )}
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
