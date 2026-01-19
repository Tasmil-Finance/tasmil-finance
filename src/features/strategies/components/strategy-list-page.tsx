"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { GlassCard, GlassCardContent, GlassCardFooter } from "@/shared/ui/glass-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { useFeaturedStrategies, useStrategies } from "../hooks";
import type { FeaturedStrategy, StrategyListItem } from "../types";

// Helper for gradients based on index
const getGradient = (index: number) => {
  const gradients = [
    "from-cyan-500/10 to-blue-600/10",
    "from-purple-500/10 to-pink-600/10",
    "from-emerald-500/10 to-teal-600/10",
    "from-amber-500/10 to-orange-600/10",
  ];
  return gradients[index % gradients.length];
};



// Featured Strategy Card
function FeaturedStrategyCard({ strategy, index }: { strategy: FeaturedStrategy, index: number }) {
  return (
    <GlassCard className="group relative h-[240px] cursor-pointer overflow-hidden border-white/5 bg-zinc-900/40 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10">
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(index)} opacity-30 group-hover:opacity-50 transition-opacity`} />
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20" />

      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <Badge className="bg-white/10 text-white hover:bg-white/20 border-white/10 backdrop-blur-md">Featured</Badge>
          {/* Chain Logo Placeholder */}
          <div className="h-10 w-10 rounded-full bg-zinc-800/80 ring-1 ring-white/10 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-bold text-zinc-400">ETH</span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-2xl text-white mb-2 group-hover:text-cyan-400 transition-colors">{strategy.name}</h3>
          <p className="text-sm text-zinc-400 line-clamp-2">{strategy.description}</p>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl group-hover:bg-cyan-500/30 transition-all duration-500" />
    </GlassCard>
  );
}

// Strategy Card for Grid View
function StrategyCard({ strategy, onClick, index }: { strategy: StrategyListItem; onClick: () => void; index: number }) {
  const apyValue = Number.parseFloat(strategy.current_apy.replace("%", ""));
  const isNegative = apyValue < 0;
  const isPositive = apyValue > 0;

  return (
    <GlassCard
      className="group cursor-pointer border-white/5 bg-zinc-900/40 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-zinc-800/60 hover:shadow-xl"
      onClick={onClick}
    >
      <div className={`h-24 relative overflow-hidden bg-gradient-to-br ${getGradient(index)}`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="flex -space-x-2">
            {strategy.assets?.slice(0, 3).map((asset, i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold z-10">
                {asset.alt.charAt(0)}
              </div>
            ))}
          </div>
          {strategy.hasPoints && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/20 backdrop-blur-md">
              <Zap className="w-3 h-3 mr-1 fill-current" /> Points
            </Badge>
          )}
        </div>
      </div>

      <GlassCardContent className="pt-4 pb-2 px-5">
        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-mono text-cyan-500/80">Strategy</span>
          <span>•</span>
          <span>{strategy.chain?.alt || "Ethereum"}</span>
        </div>
        <h3 className="font-bold text-lg text-white mb-1 group-hover:text-cyan-400 transition-colors">{strategy.title}</h3>

        <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
          {strategy.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-white/5 bg-white/5 text-[10px] text-zinc-400 font-normal py-0.5 px-2"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </GlassCardContent>

      <GlassCardFooter className="px-5 py-4 border-t border-white/5 bg-black/20 flex justify-between rounded-b-xl">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Net APY</p>
          <p className={cn(
            "font-bold text-lg",
            isNegative && "text-rose-400",
            isPositive && "text-emerald-400",
            !isNegative && !isPositive && "text-zinc-400"
          )}>
            {strategy.current_apy}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1 justify-end">
            Risk Level
          </p>
          <div className="flex items-center gap-1 justify-end mt-1">
            <div className="h-1.5 w-8 rounded-full bg-emerald-500/80" />
            <div className="h-1.5 w-8 rounded-full bg-emerald-500/30" />
            <div className="h-1.5 w-8 rounded-full bg-emerald-500/30" />
          </div>
        </div>
      </GlassCardFooter>
    </GlassCard>
  );
}

// Strategy Row for List View
function StrategyRow({ strategy, onClick }: { strategy: StrategyListItem; onClick: () => void }) {
  const apyValue = Number.parseFloat(strategy.current_apy.replace("%", ""));
  const isNegative = apyValue < 0;
  const isPositive = apyValue > 0;

  return (
    <GlassCard
      className="group cursor-pointer border-white/5 bg-zinc-900/40 p-4 transition-all hover:border-white/10 hover:bg-zinc-800/60 hover:translate-x-1"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title and Tags */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {strategy.assets?.slice(0, 2).map((asset, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold z-10">
                  {asset.alt.charAt(0)}
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{strategy.title}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{strategy.chain?.alt || "Ethereum"}</span>
                {strategy.hasPoints && (
                  <span className="text-amber-400 flex items-center gap-0.5"><Zap className="w-3 h-3 fill-current" /> Points</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Stats */}
        <div className="flex items-center gap-12">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Pool Type</p>
            <div className="flex gap-1">
              {strategy.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="border-white/5 bg-white/5 text-[10px] text-zinc-400">{tag}</Badge>
              ))}
            </div>
          </div>

          <div className="text-right min-w-[80px]">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">APY</p>
            <span
              className={cn(
                "font-bold text-base",
                isNegative && "text-rose-400",
                isPositive && "text-emerald-400",
                !isNegative && !isPositive && "text-zinc-400"
              )}
            >
              {strategy.current_apy}
            </span>
          </div>
        </div>

        <div className="pl-4 border-l border-white/5">
          <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-white transition-colors" />
        </div>
      </div>
    </GlassCard>
  );
}

// Filter Dialog Component
function FilterDialog({
  categories,
  selectedCategories,
  onCategoriesChange,
}: {
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}) {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {selectedCategories.length > 0 && (
            <Badge className="ml-2 h-5 border-0 bg-cyan-500/20 px-1.5 text-cyan-400 text-xs">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-zinc-900/95 backdrop-blur-xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Filter Strategies</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Select categories to filter strategies
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-white">Categories</h4>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategoriesChange([])}
                  className="h-auto p-0 text-xs text-zinc-400 hover:text-white"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className={cn(
                    "cursor-pointer border-white/10 bg-white/5 text-xs text-zinc-400 transition-all hover:border-white/20 select-none py-1.5 px-3",
                    selectedCategories.includes(category) &&
                    "border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                  )}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                  {selectedCategories.includes(category) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StrategyListPageProps {
  className?: string;
}

export function StrategyListPage({ className }: StrategyListPageProps) {
  const router = useRouter();
  const { data: strategies, isLoading: strategiesLoading } = useStrategies();
  const { data: featuredStrategies, isLoading: featuredLoading } = useFeaturedStrategies();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const handleStrategyClick = (strategyId: string) => {
    router.push(`/strategies/${strategyId}`);
  };

  // Get unique categories from strategies
  const categories = Array.from(
    new Set(strategies?.map((s) => s.category).filter(Boolean) as string[])
  ).sort();

  const filteredStrategies = strategies?.filter((strategy) => {
    const matchesSearch =
      strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      strategy.assets?.some((asset) =>
        asset.alt.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      strategy.agents?.some((agent) =>
        agent.alt.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      strategy.chain?.alt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && strategy.status === "Active") ||
      (statusFilter === "inactive" && strategy.status === "Inactive") ||
      (statusFilter === "paused" && strategy.status === "Paused");

    const matchesCategory =
      selectedCategories.length === 0 ||
      (strategy.category && selectedCategories.includes(strategy.category));

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const isLoading = strategiesLoading || featuredLoading;

  const statusLabels: Record<string, string> = {
    all: "All",
    active: "Active",
    inactive: "Inactive",
    paused: "Paused",
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto", className)}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[240px] rounded-xl bg-zinc-900/50" />)}
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64 bg-zinc-900/50" />
            <Skeleton className="h-10 w-32 bg-zinc-900/50" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[200px] rounded-xl bg-zinc-900/50" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-zinc-950", className)}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-zinc-900 to-zinc-950 px-6 py-12 lg:px-10">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 max-w-[1600px] mx-auto">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 pl-2 pr-4 py-1 backdrop-blur-md">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-0 hover:bg-cyan-500/30">New</Badge>
              <span className="text-xs font-medium text-zinc-300">Prompt-to-DeFi is now live</span>
            </div>
            <h1 className="font-bold text-4xl md:text-6xl text-white tracking-tight leading-[1.1]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Intelligent</span> DeFi Strategies
            </h1>
            <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
              Deploy capital into automated yield strategies powered by the <span className="text-white font-medium">INFINIT AI Agent Swarm</span>.
            </p>
          </div>

          {/* Stats / CTA */}
          <div className="flex gap-4">
            <GlassCard className="p-6 text-center bg-zinc-900/40 border-white/5 min-w-[160px]">
              <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Total TVL</p>
              <p className="text-3xl font-bold text-white mt-1">$42.8M</p>
            </GlassCard>
            <GlassCard className="p-6 text-center bg-zinc-900/40 border-white/5 min-w-[160px]">
              <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Active Agents</p>
              <p className="text-3xl font-bold text-white mt-1">128</p>
            </GlassCard>
          </div>
        </div>
      </div>

      <div className="space-y-12 p-6 lg:p-10 max-w-[1600px] mx-auto">
        {/* Featured Strategies */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold text-2xl text-white">Featured Opportunities</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={() => setFeaturedIndex(Math.max(0, featuredIndex - 1))}
                disabled={featuredIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={() =>
                  setFeaturedIndex(
                    Math.min((featuredStrategies?.length || 1) - 3, featuredIndex + 1)
                  )
                }
                disabled={featuredIndex >= (featuredStrategies?.length || 1) - 3}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredStrategies?.slice(featuredIndex, featuredIndex + 3).map((strategy, idx) => (
              <FeaturedStrategyCard key={strategy.id} strategy={strategy} index={idx} />
            ))}
          </div>
        </section>

        {/* All Strategies */}
        <section>
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="font-bold text-2xl text-white">Explore Strategies</h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" />
                <Input
                  placeholder="Search assets, agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-[240px] md:w-[320px] rounded-full border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-cyan-500/50"
                />
              </div>

              {/* Filters */}
              <FilterDialog
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
              />

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 min-w-[100px] border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
                  >
                    {statusLabels[statusFilter]}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border-white/10 bg-zinc-900/95 backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("paused")}>
                    Paused
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block" />

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-md transition-all",
                    viewMode === "grid" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-md transition-all",
                    viewMode === "list" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Strategies Grid or List */}
          {filteredStrategies && filteredStrategies.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredStrategies.map((strategy, idx) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    index={idx}
                    onClick={() => handleStrategyClick(strategy.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStrategies.map((strategy) => (
                  <StrategyRow
                    key={strategy.id}
                    strategy={strategy}
                    onClick={() => handleStrategyClick(strategy.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
                <Search className="h-8 w-8 text-zinc-700" />
              </div>
              <p className="text-lg font-medium text-white">No strategies found</p>
              <p className="text-zinc-500 mt-1 mb-4">Try adjusting your filters or search terms</p>
              {(searchQuery || selectedCategories.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategories([]);
                  }}
                  className="text-zinc-400 hover:text-white border-white/10 bg-white/5"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
