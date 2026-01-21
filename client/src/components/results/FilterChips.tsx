import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Patient, ResultsFilters } from "./types";
import { format } from "date-fns";
import { formatDepartmentName } from "@/lib/display-utils";

interface FilterChipsProps {
  filters: ResultsFilters;
  patients: Patient[];
  onFilterChange: (filters: Partial<ResultsFilters>) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, patients, onFilterChange, onClearAll }: FilterChipsProps) {
  const activeFilters: { key: string; label: string; value: string; onRemove: () => void }[] = [];

  // Search term chip
  if (filters.searchTerm) {
    activeFilters.push({
      key: 'search',
      label: 'Search',
      value: filters.searchTerm,
      onRemove: () => onFilterChange({ searchTerm: '' }),
    });
  }

  // Status filter chip
  if (filters.statusFilter !== 'all') {
    activeFilters.push({
      key: 'status',
      label: 'Status',
      value: filters.statusFilter.charAt(0).toUpperCase() + filters.statusFilter.slice(1),
      onRemove: () => onFilterChange({ statusFilter: 'all' }),
    });
  }

  // Type/Modality filter chip
  if (filters.typeFilter !== 'all') {
    activeFilters.push({
      key: 'type',
      label: 'Type',
      value: formatDepartmentName(filters.typeFilter, false),
      onRemove: () => onFilterChange({ typeFilter: 'all' }),
    });
  }

  // Date filter chips
  if (filters.dateFilter === 'today') {
    activeFilters.push({
      key: 'date',
      label: 'Date',
      value: 'Today',
      onRemove: () => onFilterChange({ dateFilter: 'all' }),
    });
  } else if (filters.dateFilter === 'date' && filters.selectedDate) {
    try {
      const formattedDate = format(new Date(filters.selectedDate), 'MMM dd, yyyy');
      activeFilters.push({
        key: 'date',
        label: 'Date',
        value: formattedDate,
        onRemove: () => onFilterChange({ dateFilter: 'all' }),
      });
    } catch (e) {
      // Invalid date, skip
    }
  }

  // If no active filters, don't render anything
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Active Filters:
      </span>
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="pl-3 pr-2 py-1.5 bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
        >
          <span className="text-xs">
            <span className="font-semibold">{filter.label}:</span> {filter.value}
          </span>
          <button
            onClick={filter.onRemove}
            className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        onClick={onClearAll}
        variant="ghost"
        size="sm"
        className="h-7 px-3 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
      >
        Clear all
      </Button>
    </div>
  );
}
