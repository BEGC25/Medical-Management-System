import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { shortenViewDescription, formatExamLabel } from "./diagnostic-utils";

type Modality = "lab" | "xray" | "ultrasound";

interface TestsOrderedRowProps {
  modality: Modality;
  // Lab-specific: array of test names
  tests?: string[];
  // X-Ray/Ultrasound-specific: exam info as chips/inline
  examType?: string | null;
  bodyPart?: string | null;
  views?: string | null;
  scanRegion?: string | null;
  // How many tests to show before "+N more" (default: 3)
  maxVisible?: number;
}

/**
 * TestsOrderedRow - Compact row showing what tests/exams are ordered.
 * 
 * For Lab: shows first 3 chips then "+N more" popover when many tests exist.
 * For X-ray/Ultrasound: shows exam type and body part as ONE unified request,
 * with separate "Views:" chip if applicable.
 * 
 * Design principle: Information should read as ONE exam request, not multiple exams.
 */
export function TestsOrderedRow({
  modality,
  tests,
  examType,
  bodyPart,
  views,
  scanRegion,
  maxVisible = 3
}: TestsOrderedRowProps) {
  // Build items to display based on modality
  const getDisplayItems = (): { label: string; items: string[]; viewsChip?: string } => {
    if (modality === "lab" && tests && tests.length > 0) {
      return { label: "Tests Ordered:", items: tests };
    }
    if (modality === "xray") {
      // Combine exam type and body part into one chip
      const examLabel = formatExamLabel(examType, bodyPart, null, views);
      const items = examLabel ? [examLabel] : [];
      
      // Views shown as separate chip with "Views:" prefix
      const shortenedViews = views ? shortenViewDescription(views) : null;
      return { 
        label: "Exam requested:", 
        items, 
        viewsChip: shortenedViews ? `Views: ${shortenedViews}` : undefined 
      };
    }
    if (modality === "ultrasound") {
      // Combine exam type and scan region into one unified label
      const examLabel = formatExamLabel(examType, null, scanRegion, null);
      const items = examLabel ? [examLabel] : [];
      return { label: "Exam requested:", items };
    }
    return { label: "Tests:", items: [] };
  };

  const { label, items, viewsChip } = getDisplayItems();
  
  if (items.length === 0 && !viewsChip) return null;

  const visibleItems = items.slice(0, maxVisible);
  const hiddenItems = items.slice(maxVisible);
  const hasMore = hiddenItems.length > 0;

  return (
    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        
        {visibleItems.map((item, idx) => (
          <Badge
            key={idx}
            variant="outline"
            className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 text-xs font-medium px-2.5 py-1"
          >
            {item}
          </Badge>
        ))}
        
        {/* Views chip for X-ray - shown separately with consistent styling */}
        {viewsChip && (
          <Badge
            variant="outline"
            className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 text-xs font-medium px-2.5 py-1"
          >
            {viewsChip}
          </Badge>
        )}
        
        {hasMore && (
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                aria-label={`Show ${hiddenItems.length} additional ${modality === "lab" ? "tests" : "exam details"}`}
              >
                +{hiddenItems.length} more
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-xs p-3" align="start">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Additional Tests
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hiddenItems.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 text-xs font-medium px-2 py-0.5"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
