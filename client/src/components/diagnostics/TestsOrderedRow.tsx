import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
 * For X-ray/Ultrasound: shows exam type and body part as compact chips.
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
  const getDisplayItems = (): string[] => {
    if (modality === "lab" && tests && tests.length > 0) {
      return tests;
    }
    if (modality === "xray") {
      const parts = [examType, bodyPart, views].filter((x): x is string => Boolean(x));
      return parts;
    }
    if (modality === "ultrasound") {
      const parts = [examType, scanRegion].filter((x): x is string => Boolean(x));
      return parts;
    }
    return [];
  };

  const items = getDisplayItems();
  
  if (items.length === 0) return null;

  const visibleItems = items.slice(0, maxVisible);
  const hiddenItems = items.slice(maxVisible);
  const hasMore = hiddenItems.length > 0;

  return (
    <div className="mb-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {modality === "lab" ? "Tests Ordered:" : "Exam:"}
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
