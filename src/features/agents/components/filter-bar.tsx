'use client';

import { Search, Settings, Sparkles } from 'lucide-react';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableFilters: string[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Execution':
      return Settings;
    case 'Discovery':
      return Sparkles;
    case 'Assistant':
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
  availableFilters,
}: FilterBarProps) {
  // Create dynamic filters based on available categories
  const filters = [
    { label: 'All', icon: null },
    ...availableFilters.map((filter) => ({
      label: filter,
      icon: getTypeIcon(filter),
    })),
  ];

  return (
    <div className="flex flex-col justify-between gap-4 py-8 md:flex-row md:items-center">
      {/* Search Input - On the right in the image but lets keep flexible or match image exactly? 
          Image has filter pills on LEFT and search on RIGHT.
      */}

      <div className="order-2 flex items-center gap-3 md:order-1">
        {filters.map((filter) => (
          <button
            type="button"
            key={filter.label}
            onClick={() => onFilterChange(filter.label)}
            className={`duration-300 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
              activeFilter === filter.label
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'border border-border bg-muted text-muted-foreground hover:border-accent-foreground/10 hover:bg-accent hover:text-foreground'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="order-1 flex w-full items-center justify-end md:order-2 md:w-auto">
        <div className="relative w-full md:w-[300px]">
          <Search
            className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search agent"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-12 w-full rounded-full border border-input bg-background/50 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground transition-all focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
