import * as React from "react";
import { X, Beaker, FileText, Waves } from "lucide-react";

interface UnifiedModalHeaderProps {
  modality: 'lab' | 'xray' | 'ultrasound';
  title: string;
  subtitle?: string;
  testId?: string;
  examInfo?: string;
  patient?: {
    name: string;
    age?: string | null;
    gender?: string | null;
    patientId: string;
  };
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
 * UnifiedModalHeader - A single source of truth for patient identity in diagnostic modals.
 * 
 * Key design principles:
 * - Patient identity (name + age/gender formatted 30/M + patient ID) appears ONLY here
 * - Reduced height with restrained styling (no tall saturated gradients)
 * - Clean white/light surface with subtle border
 * - Same layout across Lab/X-ray/Ultrasound
 */
export function UnifiedModalHeader({
  modality,
  title,
  subtitle,
  testId,
  examInfo,
  patient,
  onClose,
}: UnifiedModalHeaderProps) {
  const config = modalityConfig[modality];
  const Icon = config.icon;

  // Format patient demographics as "30/M" style
  const formatDemographics = () => {
    if (!patient) return null;
    const parts: string[] = [];
    if (patient.age) parts.push(`${patient.age}`);
    if (patient.gender) {
      const g = patient.gender.charAt(0).toUpperCase();
      parts.push(g);
    }
    return parts.length > 0 ? parts.join('/') : null;
  };

  const demographics = formatDemographics();

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 md:px-6 py-3 md:py-4 -mx-6 -mt-6 mb-4 rounded-t-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${config.iconColor}`} />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h2>
              {(testId || examInfo) && (
                <>
                  <span className="text-gray-400 hidden md:inline">•</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    {testId || examInfo}
                  </span>
                </>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Patient Info (single source of truth) + Close Button */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Patient Demographics - Single source of truth */}
          {patient && (
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm bg-white dark:bg-gray-800 rounded-md px-2 md:px-3 py-1 md:py-1.5 border border-gray-200 dark:border-gray-600 shadow-sm">
              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] md:max-w-none">{patient.name}</span>
              {demographics && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400">{demographics}</span>
                </>
              )}
              <span className="text-gray-400">•</span>
              <span className="font-mono text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{patient.patientId}</span>
            </div>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md p-1 md:p-1.5 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
