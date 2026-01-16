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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
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

// Featured Strategy Card
function FeaturedStrategyCard({ strategy }: { strategy: FeaturedStrategy }) {
  return (
    <Card className="group relative h-[200px] cursor-pointer overflow-hidden border-0 bg-linear-to-br from-zinc-900 to-zinc-800">
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-4">
        <h3 className="font-semibold text-lg text-white">{strategy.name}</h3>
        <p className="text-sm text-zinc-400">{strategy.description}</p>
      </div>
      {/* Placeholder for chain logo */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="h-12 w-12 rounded-full bg-zinc-700" />
      </div>
    </Card>
  );
}

// Strategy Card for Grid View
function StrategyCard({ strategy, onClick }: { strategy: StrategyListItem; onClick: () => void }) {
  const apyValue = Number.parseFloat(strategy.current_apy.replace("%", ""));
  const isNegative = apyValue < 0;
  const isPositive = apyValue > 0;

  return (
    <Card
      className="cursor-pointer border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900"
      onClick={onClick}
    >
      {/* Header with tags and creator */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex flex-wrap gap-1">
          {strategy.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={cn(
                "border-zinc-700 bg-zinc-800 text-xs text-zinc-400",
                tag === "Looping" && "border-purple-500/30 bg-purple-500/10 text-purple-400",
                tag === "Stablecoins" && "border-blue-500/30 bg-blue-500/10 text-blue-400",
                tag === "Stables" && "border-blue-500/30 bg-blue-500/10 text-blue-400",
                tag === "Delta Neutral" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                tag === "Airdrop" && "border-green-500/30 bg-green-500/10 text-green-400"
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800">
            <span className="text-[10px]">∞</span>
          </div>
          <span>INFINIT</span>
          <span className="text-zinc-600">{strategy.creator.handle}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 font-medium text-sm text-white">{strategy.title}</h3>

      {/* APY */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-zinc-500">APY</span>
        <span
          className={cn(
            "font-semibold text-lg",
            isNegative && "text-red-500",
            isPositive && "text-emerald-400",
            !isNegative && !isPositive && "text-zinc-400"
          )}
        >
          {strategy.current_apy}
        </span>
        {strategy.hasPoints && (
          <Badge className="border-0 bg-emerald-500/20 text-emerald-400 text-xs">Points</Badge>
        )}
      </div>

      {/* Asset / Agent / Chain */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-600">Asset</span>
          <div className="-space-x-1 flex">
            {strategy.assets?.slice(0, 3).map((asset) => (
              <div
                key={asset.alt}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800"
              >
                <span className="text-[8px] text-zinc-400">{asset.alt.charAt(0)}</span>
              </div>
            ))}
            {strategy.assets && strategy.assets.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
                <span className="text-[8px] text-zinc-400">+{strategy.assets.length - 3}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-600">Agent</span>
          <div className="-space-x-1 flex">
            {strategy.agents?.slice(0, 3).map((agent) => (
              <div
                key={agent.alt}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800"
              >
                <span className="text-[8px] text-zinc-400">{agent.alt.charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-600">Chain</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
            <span className="text-[8px] text-zinc-400">{strategy.chain?.alt.charAt(0) || "E"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Strategy Row for List View
function StrategyRow({ strategy, onClick }: { strategy: StrategyListItem; onClick: () => void }) {
  const apyValue = Number.parseFloat(strategy.current_apy.replace("%", ""));
  const isNegative = apyValue < 0;
  const isPositive = apyValue > 0;

  return (
    <Card
      className="cursor-pointer border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title and Tags */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-white">{strategy.title}</h3>
            {strategy.hasPoints && (
              <Badge className="border-0 bg-emerald-500/20 text-emerald-400 text-xs">Points</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {strategy.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "border-zinc-700 bg-zinc-800 text-xs text-zinc-400",
                  tag === "Looping" && "border-purple-500/30 bg-purple-500/10 text-purple-400",
                  tag === "Stablecoins" && "border-blue-500/30 bg-blue-500/10 text-blue-400",
                  tag === "Stables" && "border-blue-500/30 bg-blue-500/10 text-blue-400",
                  tag === "Delta Neutral" &&
                    "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                  tag === "Airdrop" && "border-green-500/30 bg-green-500/10 text-green-400"
                )}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Middle: Assets, Agents, Chain */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-600">Asset</span>
            <div className="-space-x-1 flex">
              {strategy.assets?.slice(0, 3).map((asset) => (
                <div
                  key={asset.alt}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800"
                >
                  <span className="text-[8px] text-zinc-400">{asset.alt.charAt(0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-600">Agent</span>
            <div className="-space-x-1 flex">
              {strategy.agents?.slice(0, 3).map((agent) => (
                <div
                  key={agent.alt}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800"
                >
                  <span className="text-[8px] text-zinc-400">{agent.alt.charAt(0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-600">Chain</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
              <span className="text-[8px] text-zinc-400">
                {strategy.chain?.alt.charAt(0) || "E"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: APY and Creator */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-zinc-500">APY</span>
            <span
              className={cn(
                "font-semibold text-lg",
                isNegative && "text-red-500",
                isPositive && "text-emerald-400",
                !isNegative && !isPositive && "text-zinc-400"
              )}
            >
              {strategy.current_apy}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800">
              <span className="text-[10px]">∞</span>
            </div>
            <span>INFINIT</span>
          </div>
        </div>
      </div>
    </Card>
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
          className="h-9 border-zinc-800 bg-zinc-900 text-zinc-400"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {selectedCategories.length > 0 && (
            <Badge className="ml-2 h-5 border-0 bg-emerald-500/20 px-1.5 text-emerald-400 text-xs">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900 sm:max-w-[425px]">
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
                    "cursor-pointer border-zinc-700 bg-zinc-800 text-xs text-zinc-400 transition-colors hover:border-zinc-600",
                    selectedCategories.includes(category) &&
                      "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
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
      <div className={cn("space-y-8 p-6", className)}>
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`featured-${i.toString()}`} className="h-[200px]" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={`strategy-${i.toString()}`} className="h-[200px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-zinc-950", className)}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-br from-zinc-900 via-zinc-950 to-zinc-900 px-6 py-12">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="text-lg">∞</span> INFINIT
              </span>
              <span>/</span>
              <span className="flex items-center gap-1">
                <LayoutGrid className="h-4 w-4" /> Strategies
              </span>
            </div>
            <h1 className="max-w-md font-bold text-3xl text-white">
              Explore DeFi Strategies Powered by INFINIT AI Agent Swarm
            </h1>
          </div>

          {/* Prompt-to-DeFi Banner */}
          <Card className="w-[320px] border-zinc-800 bg-zinc-900/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                <span className="font-bold text-white">∞</span>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge className="border-0 bg-emerald-500/20 text-emerald-400 text-xs">New</Badge>
                </div>
                <h3 className="font-semibold text-white">
                  <span className="text-emerald-400">Prompt-to-DeFi</span> is now live!
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Be an early adopter to create, test, and execute DeFi strategies with natural
                  language prompts.
                </p>
                <Button className="mt-3 h-8 bg-emerald-500 text-xs hover:bg-emerald-600">
                  Join Now →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-8 p-6">
        {/* Featured Strategies */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white text-xl">Featured Strategies</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => setFeaturedIndex(Math.max(0, featuredIndex - 1))}
                disabled={featuredIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredStrategies?.slice(featuredIndex, featuredIndex + 3).map((strategy) => (
              <FeaturedStrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        </section>

        {/* All Strategies */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white text-xl">All Strategies</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search title, asset, agent or chain"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[280px] border-zinc-800 bg-zinc-900 pl-9 text-sm text-white placeholder:text-zinc-500"
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
                    className="h-9 w-[100px] border-zinc-800 bg-zinc-900 text-white"
                  >
                    {statusLabels[statusFilter]}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border-zinc-800 bg-zinc-900">
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

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-none rounded-l-md",
                    viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-none rounded-r-md",
                    viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500"
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onClick={() => handleStrategyClick(strategy.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
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
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-zinc-500">No strategies found</p>
              {(searchQuery || selectedCategories.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategories([]);
                  }}
                  className="mt-2 text-zinc-400 hover:text-white"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
