"use client";

import { Search, Settings, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  promptToDeFi: boolean;
  onPromptToDeFiChange: (enabled: boolean) => void;
}

const filters = [
  { label: "All", icon: null },
  { label: "Strategy", icon: Settings },
  { label: "Intelligence", icon: Sparkles },
];

export function FilterBar({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  promptToDeFi,
  onPromptToDeFiChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-6">
      <div className="flex items-center gap-1 p-1 bg-secondary rounded-full">
        {filters.map((filter) => (
          <Button
            key={filter.label}
            variant={activeFilter === filter.label ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(filter.label)}
            className={`gap-2 rounded-full transition-all ${
              activeFilter === filter.label 
                ? "relative overflow-hidden bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] font-bold text-black hover:scale-105 hover:from-[#C5F0FF] hover:to-[#1CCFFF]" 
                : ""
            }`}
            type="button"
          >
            {activeFilter === filter.label && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-[50%] rounded-full bg-white/80 blur-xl" />
            )}
            {/* {filter.icon && <filter.icon size={14} />} */}
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* <div className="flex items-center gap-3">
          <Label htmlFor="prompt-defi" className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles size={14} />
            Prompt-to-DeFi supported
          </Label>
          <Switch
            id="prompt-defi"
            checked={promptToDeFi}
            onCheckedChange={onPromptToDeFiChange}
          />
        </div> */}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="text"
            placeholder="Search agent"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-64 pl-9 rounded-full"
          />
        </div>

        {/* <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            onFilterChange("All");
            onSearchChange("");
            onPromptToDeFiChange(false);
          }}
          type="button"
        >
          Clear Filters
        </Button> */}
      </div>
    </div>
  );
}

