import * as React from "react";
import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Modality = "lab" | "xray" | "ultrasound";

interface PremiumTestsOrderedProps {
  modality: Modality;
  tests: string[];
  title?: string;
}

const modalityConfig = {
  lab: {
    color: "blue",
    badgeClass: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors",
    iconColor: "text-blue-600 dark:text-blue-400",
    countBadge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
  },
  xray: {
    color: "cyan",
    badgeClass: "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-950/50 transition-colors",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    countBadge: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700"
  },
  ultrasound: {
    color: "violet",
    badgeClass: "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors",
    iconColor: "text-violet-600 dark:text-violet-400",
    countBadge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700"
  }
};

export function PremiumTestsOrdered({
  modality,
  tests,
  title = "Tests Ordered"
}: PremiumTestsOrderedProps) {
  const config = modalityConfig[modality];

  return (
    <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className={`w-5 h-5 ${config.iconColor}`} />
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <Badge 
          variant="outline" 
          className={`${config.countBadge} text-xs font-semibold px-2 py-0.5 ml-auto`}
        >
          {tests.length}
        </Badge>
      </div>
      
      {/* Tests Grid */}
      <div className="flex flex-wrap gap-2">
        {tests.map((test, idx) => (
          <Badge
            key={idx}
            variant="outline"
            className={`${config.badgeClass} text-sm font-medium px-3 py-1.5 cursor-default`}
          >
            {test}
          </Badge>
        ))}
      </div>
    </div>
  );
}
