"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TokenData, RiskProfile } from "@/types/portfolio";
import { Shield, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioInsightsProps {
  tokens: TokenData[];
  riskProfile: RiskProfile;
}

export function PortfolioInsights({
  tokens,
  riskProfile,
}: PortfolioInsightsProps) {
  // Calculate diversification score (0-100)
  const calculateDiversificationScore = (): number => {
    if (tokens.length === 0) return 0;
    if (tokens.length === 1) return 20;

    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = tokens.reduce((sum, token) => {
      return sum + Math.pow(token.share, 2);
    }, 0);

    // Convert HHI to score (0-100, where 100 is perfectly diversified)
    // HHI ranges from 1/n (perfect diversification) to 1 (single asset)
    const maxHHI = 1;
    const minHHI = 1 / tokens.length;
    const score = ((maxHHI - hhi) / (maxHHI - minHHI)) * 100;

    return Math.round(Math.max(0, Math.min(100, score)));
  };

  // Calculate risk score based on volatility and distribution
  const calculateRiskScore = (): {
    score: number;
    level: "Low" | "Medium" | "High";
  } => {
    const { largeCap, stablecoins, smallCap, microCap } = riskProfile;

    // Weight each category by risk
    const riskWeightedScore =
      stablecoins * 0.1 + // Stablecoins are low risk
      largeCap * 0.3 + // Large caps are medium-low risk
      smallCap * 0.6 + // Small caps are medium-high risk
      microCap * 0.9; // Micro caps are high risk

    const score = Math.round(riskWeightedScore);

    let level: "Low" | "Medium" | "High";
    if (score < 30) level = "Low";
    else if (score < 60) level = "Medium";
    else level = "High";

    return { score, level };
  };

  // Generate AI-like insights
  const generateInsights = (): string[] => {
    const insights: string[] = [];
    const { largeCap, stablecoins, smallCap } = riskProfile;

    // Diversification insights
    if (tokens.length === 1) {
      insights.push("Consider diversifying into multiple assets to reduce risk");
    } else if (tokens.length < 3) {
      insights.push("Good start! Adding more assets could improve diversification");
    }

    // Risk profile insights
    if (stablecoins > 70) {
      insights.push(
        "Portfolio is very stable but may miss growth opportunities"
      );
    } else if (stablecoins > 40) {
      insights.push("Good balance between stability and growth potential");
    }

    if (smallCap > 60) {
      insights.push("High exposure to volatile assets - consider rebalancing");
    }

    if (largeCap > 60) {
      insights.push("Strong foundation with blue-chip assets");
    }

    // Concentration insights
    const maxShare = Math.max(...tokens.map((t) => t.share));
    if (maxShare > 80) {
      insights.push("Single asset concentration risk - diversify to protect value");
    } else if (maxShare > 50) {
      insights.push("Consider reducing concentration in your largest holding");
    }

    // Performance insights
    const avgChange = tokens.reduce((sum, t) => sum + t.change24h, 0) / tokens.length;
    if (avgChange > 5) {
      insights.push("Portfolio performing well today - consider taking profits");
    } else if (avgChange < -5) {
      insights.push("Market downturn - good opportunity to buy the dip");
    }

    return insights.slice(0, 3); // Return top 3 insights
  };

  const diversificationScore = calculateDiversificationScore();
  const riskAssessment = calculateRiskScore();
  const insights = generateInsights();

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getRiskColor = (level: string) => {
    if (level === "Low") return "text-green-500";
    if (level === "Medium") return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-5">
        <h3 className="font-semibold text-base mb-4">Portfolio Insights</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Diversification Score */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Diversity</span>
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: getScoreColor(diversificationScore).replace('text-', '') }}>
              {diversificationScore}/100
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  diversificationScore >= 70
                    ? "bg-green-500"
                    : diversificationScore >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
                style={{ width: `${diversificationScore}%` }}
              />
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs text-muted-foreground">Risk</span>
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: getRiskColor(riskAssessment.level).replace('text-', '') }}>
              {riskAssessment.level}
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  riskAssessment.level === "Low"
                    ? "bg-green-500"
                    : riskAssessment.level === "Medium"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
                style={{ width: `${riskAssessment.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-border/50">
            {insights.slice(0, 2).map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <AlertTriangle className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
