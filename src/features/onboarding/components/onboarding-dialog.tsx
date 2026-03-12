"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, X, DollarSign } from "lucide-react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { SimpleSmartWallet } from "@/components/simple-smart-wallet";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    id: "setup-smart-wallet",
    title: "Smart Wallet Setup",
    component: "SmartWalletSetup"
  },
  {
    id: "deposit-funds",
    title: "Deposit Funds",
    component: "DepositFunds"
  }
];

const CHAINS = [
  { id: "base", name: "Base", icon: "/token/base.png", selected: true },
  { id: "arbitrum", name: "Arbitrum", icon: "/token/arb.png", selected: false },
  { id: "plasma", name: "Plasma", icon: "/token/plasma.svg", selected: false }
];

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChains, setSelectedChains] = useState(["base"]);
  const [depositAmount, setDepositAmount] = useState("10.00");
  const [smartWalletDeployed, setSmartWalletDeployed] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleFinish = () => {
    onOpenChange(false);
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    const currentStepData = STEPS[currentStep];
    if (!currentStepData) return null;

    switch (currentStepData.component) {
      case "SmartWalletSetup":
        return (
          <SmartWalletSetupStep 
            onComplete={() => {
              setSmartWalletDeployed(true);
              handleNext();
            }}
          />
        );
      case "DepositFunds":
        return (
          <DepositFundsStep
            selectedChains={selectedChains}
            onChainsChange={setSelectedChains}
            depositAmount={depositAmount}
            onAmountChange={setDepositAmount}
            onFinish={handleFinish}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[85vh] p-0 bg-card border border-border/50 overflow-hidden rounded-2xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between p-4 h-16">
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="h-8 w-8 p-0 rounded-full hover:bg-accent/50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-lg font-semibold text-foreground">
                {STEPS[currentStep]?.title || ""}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {currentStep < STEPS.length - 1 && smartWalletDeployed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="h-8 w-8 p-0 rounded-full hover:bg-accent/50"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-1 bg-muted/30 mx-4 mb-4 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step Components
function SmartWalletSetupStep({ 
  onComplete 
}: { 
  onComplete: () => void;
}) {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-2">Set up your Smart Wallet</h3>
          <p className="text-muted-foreground">
            Create and activate your smart wallet to get started with gasless transactions.
          </p>
        </div>

        <SimpleSmartWallet />

        <div className="mt-6 text-center">
          <Button
            onClick={onComplete}
            size="lg"
            className="w-full max-w-md h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base font-semibold"
          >
            Continue to Deposit
          </Button>
        </div>
      </div>
    </div>
  );
}

function DepositFundsStep({
  selectedChains,
  onChainsChange,
  depositAmount,
  onAmountChange,
  onFinish
}: {
  selectedChains: string[];
  onChainsChange: (chains: string[]) => void;
  depositAmount: string;
  onAmountChange: (amount: string) => void;
  onFinish: () => void;
}) {
  const toggleChain = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      onChainsChange(selectedChains.filter(id => id !== chainId));
    } else {
      onChainsChange([...selectedChains, chainId]);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">Deposit Funds</h3>
        <p className="text-muted-foreground">
          Make your first deposit to start earning yield with your smart wallet.
        </p>
      </div>

      <div className="space-y-6">
        {/* Initial Deposit Notice */}
        <div className="flex items-center gap-2 text-sm text-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">!</span>
          </div>
          <span className="font-medium text-base">Initial Deposit of 10 USDC required</span>
        </div>

        {/* Chain Selection */}
        <div>
          <p className="text-base font-semibold text-foreground mb-4">Select the chain from which you want to deposit:</p>
          <div className="flex gap-4">
            {CHAINS.map((chain) => (
              <div
                key={chain.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 min-w-[120px]",
                  selectedChains.includes(chain.id)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                )}
                onClick={() => toggleChain(chain.id)}
              >
                <Image 
                  src={chain.icon} 
                  alt={chain.name} 
                  width={24} 
                  height={24} 
                  className="rounded-full" 
                />
                <div className="flex-1">
                  <span className="text-base font-medium block">{chain.name}</span>
                </div>
                <Checkbox
                  checked={selectedChains.includes(chain.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <p className="text-muted-foreground mb-2 text-base">Available USDC Balance</p>
          <div className="relative">
            <Input
              type="number"
              placeholder="10.00"
              value={depositAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="text-right pr-24 h-12 bg-muted/30 border-border/50 rounded-xl text-base"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-muted-foreground text-base">0.00 USDC</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full">
                <DollarSign className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Deposit Button */}
        <Button
          onClick={onFinish}
          size="lg"
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base font-semibold"
        >
          Complete Setup
        </Button>

        {/* Smart Wallet Notice */}
        <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
          <p className="text-muted-foreground text-base">
            Your smart wallet is ready for deposits. You can now start earning yield on your funds.
          </p>
        </div>
      </div>
    </div>
  );
}