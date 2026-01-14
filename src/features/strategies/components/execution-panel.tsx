"use client";

import { ChevronDown, ChevronUp, Fuel, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { ExecutionPanel } from "../types";

interface ExecutionPanelProps {
  executionPanel: ExecutionPanel;
  currentApy: string;
  className?: string;
}

export function ExecutionPanelComponent({
  executionPanel,
  currentApy,
  className,
}: ExecutionPanelProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [inputAmount, setInputAmount] = useState(executionPanel.input_amount.toString());

  const handleMaxClick = () => {
    setInputAmount(executionPanel.available_balance.toString());
  };

  const handleSimulate = () => {
    // TODO: Implement simulate action
    console.log("Simulate clicked");
  };

  const handlePrepareGas = () => {
    // TODO: Implement prepare gas action
    console.log("Prepare Gas clicked");
  };

  const handleZap = () => {
    // TODO: Implement zap action
    console.log("Zap clicked");
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* APY Display */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">APY</p>
            <p className="text-primary font-bold text-4xl">{currentApy}</p>
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Input</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Balance */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Available: {executionPanel.available_balance} {executionPanel.input_token}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaxClick}
              className="h-auto p-0 text-primary hover:text-primary/80"
            >
              MAX
            </Button>
          </div>

          {/* Token Input */}
          <div className="space-y-2">
            <Label htmlFor="token-input">Token</Label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <span className="text-primary text-xs font-semibold">$</span>
              </div>
              <span className="font-medium">{executionPanel.input_token}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount-input">Amount</Label>
            <Input
              id="amount-input"
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Status Message */}
          {executionPanel.status_message && (
            <p className="text-destructive text-sm">{executionPanel.status_message}</p>
          )}

          {/* Zap Section */}
          <div className="flex items-center justify-between rounded-md border border-input bg-muted/30 p-3">
            <p className="text-muted-foreground text-sm">
              Use Zap to convert your other tokens and continue.
            </p>
            <Button variant="default" size="sm" onClick={handleZap}>
              <Zap className="mr-2 h-4 w-4" />
              Zap
            </Button>
          </div>

          {/* Details Section */}
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <span className="font-medium">Details</span>
                {isDetailsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Network Cost */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Est. Network Cost</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary"
                    onClick={handlePrepareGas}
                  >
                    Prepare Gas
                  </Button>
                  <span className="font-medium">
                    {executionPanel.network_details.est_network_cost}
                  </span>
                </div>
              </div>

              {/* Slippage Tolerance */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Slippage Tolerance</span>
                <span className="font-medium">
                  {executionPanel.network_details.slippage_tolerance}
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={handleSimulate}>
              Simulate
            </Button>
            <Button variant="default" className="flex-1" onClick={handlePrepareGas}>
              Prepare Gas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
