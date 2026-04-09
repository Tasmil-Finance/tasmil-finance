"use client";

import { Search, Settings, Sparkles } from "lucide-react";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableTypes: string[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Execution":
      return Settings;
    case "Discovery":
      return Sparkles;
    case "Assistant":
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
    ...availableTypes.map((type) => ({
      label: type,
      icon: getTypeIcon(type),
    })),
  ];

  return (
    <div className="flex flex-col justify-between gap-4 py-8 md:flex-row md:items-center">
      {/* Search Input - On the right in the image but lets keep flexible or match image exactly? 
          Image has filter pills on LEFT and search on RIGHT.
      */}

      <div className="order-2 md:order-1 flex items-center gap-3">
        {filters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => onFilterChange(filter.label)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeFilter === filter.label
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-foreground hover:border-accent-foreground/10"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="order-1 md:order-2 flex items-center justify-end w-full md:w-auto">
        <div className="relative w-full md:w-[300px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search agent"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-12 rounded-full border border-input bg-background/50 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>
    </div>
  );
}
