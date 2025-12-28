import * as React from "react";
import { cn } from "@/lib/utils";

type FilterOption = "today" | "yesterday" | "last7days" | "last30days" | "custom";

interface FilterChipsProps {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
  onCustomClick?: () => void;
  className?: string;
}

const filters: Array<{ value: FilterOption; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

export function FilterChips({
  value,
  onChange,
  onCustomClick,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => {
        const isActive = value === filter.value;
        return (
          <button
            key={filter.value}
            onClick={() => {
              onChange(filter.value);
              if (filter.value === "custom" && onCustomClick) {
                onCustomClick();
              }
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "border transition-all duration-[var(--transition-base)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))]",
              isActive
                ? [
                    "bg-[hsl(var(--clinical-teal-500))]",
                    "text-[hsl(var(--text-on-brand))]",
                    "border-[hsl(var(--clinical-teal-600))]",
                    "shadow-sm",
                  ]
                : [
                    "bg-[hsl(var(--surface-white))]",
                    "text-[hsl(var(--text-secondary))]",
                    "border-[hsl(var(--border-default))]",
                    "hover:border-[hsl(var(--border-medium))]",
                    "hover:bg-[hsl(var(--surface-50))]",
                  ]
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
