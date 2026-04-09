'use client';

import { Shield, TrendingUp, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { PresetCardData, RiskPreset } from '../types';

interface PresetCardProps {
  preset: PresetCardData;
  selected: boolean;
  onSelect: () => void;
}

const PRESET_CONFIG: Record<
  RiskPreset,
  {
    icon: typeof Shield;
    accent: string;
    accentText: string;
    glowColor: string;
    ringColor: string;
    badgeBg: string;
    barColor: string;
    description: string;
  }
> = {
  Safe: {
    icon: Shield,
    accent: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    accentText: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    ringColor: 'ring-emerald-500/50 border-emerald-500/40',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    barColor: 'bg-emerald-500',
    description: 'Stablecoin lending with minimal risk exposure',
  },
  Balanced: {
    icon: TrendingUp,
    accent: 'from-blue-500/15 via-blue-500/5 to-transparent',
    accentText: 'text-blue-400',
    glowColor: 'shadow-blue-500/20',
    ringColor: 'ring-blue-500/50 border-blue-500/40',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    barColor: 'bg-blue-500',
    description: 'Diversified lending & liquidity pools',
  },
  Aggressive: {
    icon: Flame,
    accent: 'from-orange-500/15 via-orange-500/5 to-transparent',
    accentText: 'text-orange-400',
    glowColor: 'shadow-orange-500/20',
    ringColor: 'ring-orange-500/50 border-orange-500/40',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    barColor: 'bg-orange-500',
    description: 'High-yield strategies with backstop exposure',
  },
};

export function PresetCard({ preset, selected, onSelect }: PresetCardProps) {
  const config = PRESET_CONFIG[preset.name];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative w-full cursor-pointer rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-left',
        'transition-all duration-300 ease-out',
        'hover:bg-white/[0.05] hover:border-white/[0.12] hover:scale-[1.02]',
        selected &&
          cn('ring-2', config.ringColor, config.glowColor, 'shadow-lg')
      )}
    >
      {/* Top gradient glow */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b opacity-0 transition-opacity duration-300',
          config.accent,
          (selected || undefined) && 'opacity-100',
          'group-hover:opacity-70'
        )}
      />

      <div className="relative">
        {/* Icon + Name row */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]',
              'transition-colors duration-300 group-hover:bg-white/[0.08]'
            )}
          >
            <Icon className={cn('h-5 w-5', config.accentText)} />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] text-foreground tracking-tight">
              {preset.name}
            </h3>
            <p className="text-[11px] text-muted-foreground/70">
              {config.description}
            </p>
          </div>
        </div>

        {/* APY display */}
        <div className="mb-5">
          <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground/50">
            Est. APY
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'font-bold text-3xl tracking-tight',
                config.accentText
              )}
            >
              {preset.estimatedApy.toFixed(1)}
            </span>
            <span className={cn('font-semibold text-lg', config.accentText)}>
              %
            </span>
          </div>
        </div>

        {/* Pool allocation bars */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50">
              Allocation
            </p>
            <p className="text-[11px] text-muted-foreground/50">
              {preset.poolCount} pool{preset.poolCount !== 1 ? 's' : ''}
            </p>
          </div>

          {preset.topPools.slice(0, 3).map((pool) => (
            <div key={pool.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/80">{pool.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground/60">
                    {pool.apy.toFixed(1)}%
                  </span>
                  <span className="w-10 text-right font-mono text-[11px] text-foreground/60">
                    {pool.weight.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    config.barColor
                  )}
                  style={{
                    width: `${Math.min(pool.weight, 100)}%`,
                    opacity: 0.6,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Risk tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {preset.risks.map((risk) => (
            <span
              key={risk}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px]',
                config.badgeBg
              )}
            >
              {risk}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
