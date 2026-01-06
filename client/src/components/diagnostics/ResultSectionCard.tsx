import * as React from "react";

type SectionTone = "neutral" | "info" | "success" | "warning" | "accent-blue" | "accent-purple" | "accent-amber" | "accent-green";

interface ResultSectionCardProps {
  title: string;
  subtitle?: string;
  tone?: SectionTone;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const toneConfig = {
  neutral: {
    border: "border-gray-200 dark:border-gray-700",
    bg: "bg-gray-50 dark:bg-gray-800/50",
    titleColor: "text-gray-900 dark:text-gray-100",
    iconColor: "text-gray-700 dark:text-gray-400"
  },
  info: {
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    titleColor: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-700 dark:text-blue-400"
  },
  success: {
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50 dark:bg-green-950/20",
    titleColor: "text-green-900 dark:text-green-100",
    iconColor: "text-green-700 dark:text-green-400"
  },
  warning: {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    titleColor: "text-amber-900 dark:text-amber-100",
    iconColor: "text-amber-700 dark:text-amber-400"
  },
  "accent-blue": {
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    titleColor: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-700 dark:text-blue-400"
  },
  "accent-purple": {
    border: "border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    titleColor: "text-purple-900 dark:text-purple-100",
    iconColor: "text-purple-700 dark:text-purple-400"
  },
  "accent-amber": {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    titleColor: "text-amber-900 dark:text-amber-100",
    iconColor: "text-amber-700 dark:text-amber-400"
  },
  "accent-green": {
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50 dark:bg-green-950/20",
    titleColor: "text-green-900 dark:text-green-100",
    iconColor: "text-green-700 dark:text-green-400"
  }
};

export function ResultSectionCard({
  title,
  subtitle,
  tone = "neutral",
  children,
  icon
}: ResultSectionCardProps) {
  const config = toneConfig[tone];

  return (
    <div className={`rounded-lg border-2 ${config.border} ${config.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className={config.iconColor}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className={`font-bold ${config.titleColor}`}>{title}</div>
          {subtitle && (
            <div className={`text-xs ${config.iconColor} mt-0.5`}>{subtitle}</div>
          )}
        </div>
      </div>
      <div className={`text-sm ${config.titleColor} leading-relaxed`}>
        {children}
      </div>
    </div>
  );
}
