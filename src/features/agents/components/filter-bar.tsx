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
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilter === filter.label
              ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
              : "bg-[#1A1A1A] text-zinc-400 border border-white/5 hover:bg-zinc-800 hover:text-white hover:border-white/10"
              }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="order-1 md:order-2 flex items-center justify-end w-full md:w-auto">
        <div className="relative w-full md:w-[300px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search agent"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-12 rounded-full border border-white/10 bg-zinc-900/50 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
