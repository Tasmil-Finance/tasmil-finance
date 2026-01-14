"use client";

import { ExternalLink, Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/lib/utils";
import type { StrategyPrompt } from "../types";

interface StrategyPromptTabProps {
  strategyPrompt: StrategyPrompt;
  creatorName: string;
  creatorHandle: string;
  createdAt: string;
  className?: string;
}

export function StrategyPromptTab({
  strategyPrompt,
  creatorName,
  creatorHandle,
  createdAt,
  className,
}: StrategyPromptTabProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Info Section */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Info</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Executed by Agents */}
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Executed by Agents:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                Sushi
                <ExternalLink className="ml-1 h-3 w-3" />
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                Spectra
                <ExternalLink className="ml-1 h-3 w-3" />
              </Badge>
            </div>
          </div>

          {/* Assets */}
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Assets:</p>
            <div className="flex flex-wrap gap-2">
              {strategyPrompt.info.assets_involved.map((asset) => (
                <Badge
                  key={asset}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                >
                  {asset}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Chains */}
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Chains:</p>
            <div className="flex flex-wrap gap-2">
              {strategyPrompt.info.chains.map((chain) => (
                <Badge key={chain} variant="secondary">
                  {chain}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Description */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">
            This strategy is created by AI Agents on INFINIT by using the prompt below from a Strategy
            Creator to coordinate the AI Agents and build this strategy.
          </p>
        </CardContent>
      </Card>

      {/* Strategy Section */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Strategy</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-input">
                  <th className="px-4 py-2 text-left text-muted-foreground text-sm font-medium">
                    Step Number
                  </th>
                  <th className="px-4 py-2 text-left text-muted-foreground text-sm font-medium">
                    Chain
                  </th>
                  <th className="px-4 py-2 text-left text-muted-foreground text-sm font-medium">
                    Protocol
                  </th>
                  <th className="px-4 py-2 text-left text-muted-foreground text-sm font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {strategyPrompt.execution_steps.map((step) => (
                  <tr key={step.step} className="border-b border-input/50">
                    <td className="px-4 py-3">{step.step}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{step.chain}</Badge>
                    </td>
                    <td className="px-4 py-3">{step.protocol}</td>
                    <td className="px-4 py-3">{step.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Constants Section */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Constants</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-sm">Token Addresses (Katana):</p>
          <ul className="space-y-2">
            {Object.entries(strategyPrompt.constants).map(([key, value]) => (
              <li key={key} className="flex items-center gap-2">
                <span className="font-medium">{key}:</span>
                <a
                  href={`https://explorer.katana.roninchain.com/address/${value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {value}
                </a>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Prompt Footer */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">
            Prompted by {creatorName} {creatorHandle} • {createdAt}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
