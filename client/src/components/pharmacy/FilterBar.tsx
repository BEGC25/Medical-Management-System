import { useState } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterConfig {
  id: string;
  label: string;
  type: "select" | "multiselect" | "range" | "text";
  options?: { value: string; label: string; count?: number }[];
  placeholder?: string;
}

export interface ActiveFilter {
  id: string;
  label: string;
  value: string | string[] | { min?: string; max?: string };
  display: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filterId: string, value: any) => void;
  onClearAll: () => void;
  onClearFilter: (filterId: string) => void;
  className?: string;
}

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  onClearFilter,
  className = "",
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderFilter = (filter: FilterConfig) => {
    const activeFilter = activeFilters.find((f) => f.id === filter.id);

    switch (filter.type) {
      case "select":
        return (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id} className="text-sm font-medium">
              {filter.label}
            </Label>
            <Select
              value={activeFilter?.value as string || ""}
              onValueChange={(value) => onFilterChange(filter.id, value)}
            >
              <SelectTrigger id={filter.id} className="w-full">
                <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    {option.count !== undefined && ` (${option.count})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "range":
        const rangeValue = activeFilter?.value as { min?: string; max?: string } || {};
        return (
          <div key={filter.id} className="space-y-2">
            <Label className="text-sm font-medium">{filter.label}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={rangeValue.min || ""}
                onChange={(e) =>
                  onFilterChange(filter.id, {
                    ...rangeValue,
                    min: e.target.value,
                  })
                }
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={rangeValue.max || ""}
                onChange={(e) =>
                  onFilterChange(filter.id, {
                    ...rangeValue,
                    max: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id} className="text-sm font-medium">
              {filter.label}
            </Label>
            <Input
              id={filter.id}
              type="text"
              placeholder={filter.placeholder || `Enter ${filter.label}`}
              value={activeFilter?.value as string || ""}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                ({activeFilters.length} active)
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden"
          >
            {isExpanded ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </div>

      {/* Active Filters as Badges */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="gap-1 pr-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
            >
              <span className="text-xs">
                <span className="font-medium">{filter.label}:</span> {filter.display}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClearFilter(filter.id)}
                className="h-4 w-4 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter Controls */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 
                   ${isExpanded ? "block" : "hidden lg:grid"}`}
      >
        {filters.map(renderFilter)}
      </div>
    </div>
  );
}
