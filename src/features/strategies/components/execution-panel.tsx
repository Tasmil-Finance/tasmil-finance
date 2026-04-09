'use client';

import { ChevronDown, ChevronUp, Fuel, Zap } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import type { ExecutionPanel } from '../types';

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
  const [inputAmount, setInputAmount] = useState(
    executionPanel.input_amount.toString()
  );
  const amountInputId = useId();
  const tokenInputId = useId();

  const handleMaxClick = () => {
    setInputAmount(executionPanel.available_balance.toString());
  };

  const handleSimulate = () => {};

  const handlePrepareGas = () => {};

  const handleZap = () => {};

  return (
    <div className={cn('space-y-6', className)}>
      {/* APY Display */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">APY</p>
            <p className="font-bold text-4xl text-primary">{currentApy}</p>
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <h3 className="font-semibold text-lg text-white">Input</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Balance */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Available: {executionPanel.available_balance}{' '}
              {executionPanel.input_token}
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
            <Label htmlFor={tokenInputId} className="text-zinc-400">
              Token
            </Label>
            <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <span className="font-semibold text-primary text-xs">$</span>
              </div>
              <span className="font-medium text-white">
                {executionPanel.input_token}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor={amountInputId} className="text-zinc-400">
              Amount
            </Label>
            <Input
              id={amountInputId}
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0"
              className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600"
            />
          </div>

          {/* Status Message */}
          {executionPanel.status_message && (
            <p className="text-red-400 text-sm">
              {executionPanel.status_message}
            </p>
          )}

          {/* Zap Section */}
          <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="text-sm text-zinc-400">
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
              <Button
                variant="ghost"
                className="w-full justify-between p-0 text-zinc-300 hover:text-white"
              >
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
                  <Fuel className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-zinc-500">
                    Est. Network Cost
                  </span>
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
                  <span className="font-medium text-white">
                    {executionPanel.network_details.est_network_cost}
                  </span>
                </div>
              </div>

              {/* Slippage Tolerance */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  Slippage Tolerance
                </span>
                <span className="font-medium text-white">
                  {executionPanel.network_details.slippage_tolerance}
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={handleSimulate}
            >
              Simulate
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={handlePrepareGas}
            >
              Prepare Gas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
