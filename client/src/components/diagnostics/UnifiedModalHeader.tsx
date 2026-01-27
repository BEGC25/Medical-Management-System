import * as React from "react";
import { X, Beaker, FileText, Waves, Printer, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnifiedModalHeaderProps {
  modality: 'lab' | 'xray' | 'ultrasound';
  title: string;
  subtitle?: string;
  // Action callbacks for Edit/Print buttons (shown in header when applicable)
  onEdit?: () => void;
  onPrint?: () => void;
  showEditButton?: boolean;
  showPrintButton?: boolean;
  onClose?: () => void;
}

const modalityConfig = {
  lab: {
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    icon: Beaker,
  },
  xray: {
    iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    icon: FileText,
  },
  ultrasound: {
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    icon: Waves,
  },
};

/**
 * UnifiedModalHeader - Compact header chrome for diagnostic modals.
 * 
 * Key design principles per spec:
 * - Header = chrome only: modality icon + title (left), Edit/Print buttons when applicable (right), Close
 * - Do NOT show patient pill / patient identity in the header
 * - Keep header compact (no tall saturated gradient bar)
 * - Patient info is now in SummaryCard directly under header
 */
export function UnifiedModalHeader({
  modality,
  title,
  subtitle,
  onEdit,
  onPrint,
  showEditButton = false,
  showPrintButton = false,
  onClose,
}: UnifiedModalHeaderProps) {
  const config = modalityConfig[modality];
  const Icon = config.icon;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 md:px-6 py-3 -mx-6 -mt-6 mb-4 rounded-t-xl">
      <div className="flex items-center justify-between gap-3">
        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden md:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Edit/Print buttons + Close Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showEditButton && onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          )}
          
          {showPrintButton && onPrint && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrint}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print
            </Button>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md p-1.5 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
