"use client";

import { Search, Settings, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableTypes: string[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Strategy":
      return Settings;
    case "Intelligence":
      return Sparkles;
    default:
      return null;
  }
};

export function FilterBar({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  availableTypes,
}: FilterBarProps) {
  // Create dynamic filters based on available types
  const filters = [
    { label: "All", icon: null },
    ...availableTypes.map(type => ({
      label: type,
      icon: getTypeIcon(type),
    })),
  ];

  return (
    <div className="flex flex-col justify-between gap-4 py-6 lg:flex-row lg:items-center">
      <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
        {filters.map((filter) => (
          <Button
            key={filter.label}
            variant={activeFilter === filter.label ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(filter.label)}
            className={`gap-2 rounded-full transition-all ${
              activeFilter === filter.label ? "bg-primary text-primary-foreground" : ""
            }`}
            type="button"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground"
            size={16}
          />
          <Input
            type="text"
            placeholder="Search agent"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full pl-9 sm:w-64"
          />
        </div>
      </div>
    </div>
  );
}
