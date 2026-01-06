import * as React from "react";
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

type Severity = "normal" | "attention" | "critical";

interface FindingItem {
  iconType?: "warning" | "alert" | "info";
  text: string;
}

interface KeyFindingCardProps {
  severity: Severity;
  title?: string;
  summary: string;
  items?: FindingItem[];
}

const defaultTitles = {
  normal: "Clinical Interpretation",
  attention: "Clinical Interpretation",
  critical: "Clinical Interpretation"
};

export function KeyFindingCard({
  severity,
  title,
  summary,
  items = []
}: KeyFindingCardProps) {
  const displayTitle = title || defaultTitles[severity];

  // Normal case: soft green-tinted background with checkmark
  if (severity === "normal") {
    return (
      <div className="mb-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
              {displayTitle}
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Attention case: yellow-tinted background with warning icon
  if (severity === "attention") {
    return (
      <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-300 dark:border-yellow-800 rounded-lg p-4">
        <div className="text-lg font-bold mb-2 text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-yellow-700 dark:text-yellow-400" />
          {displayTitle}
        </div>
        <p className="text-sm text-yellow-900 dark:text-yellow-100 mb-3 leading-relaxed">
          {summary}
        </p>
        {items.length > 0 && (
          <div className="space-y-1">
            {items.map((item, i) => (
              <div key={i} className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-600 dark:border-yellow-500 p-2 text-sm text-yellow-900 dark:text-yellow-100">
                {item.text}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Critical case: yellow background with prominent red-tinted first row for main critical finding
  return (
    <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-300 dark:border-yellow-800 rounded-lg p-4" role="alert" aria-live="assertive">
      <div className="text-lg font-bold mb-2 text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
        <AlertCircle className="h-6 w-6 text-yellow-700 dark:text-yellow-400" />
        {displayTitle}
      </div>
      
      {/* Critical findings requiring attention */}
      <div className="mb-3">
        <p className="font-semibold text-red-800 dark:text-red-300 mb-2 text-sm">
          Critical Findings Requiring Attention:
        </p>
        <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 dark:border-red-500 p-2 text-sm text-red-900 dark:text-red-100 mb-2">
          {summary}
        </div>
      </div>

      {/* Additional warnings */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-600 dark:border-yellow-500 p-2 text-sm text-yellow-900 dark:text-yellow-100">
              {item.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
