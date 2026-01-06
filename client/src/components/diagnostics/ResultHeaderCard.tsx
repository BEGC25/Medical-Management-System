import * as React from "react";
import { Calendar } from "lucide-react";

type Modality = "lab" | "xray" | "ultrasound" | "other";

interface ResultHeaderCardProps {
  modality: Modality;
  title: string;
  subtitle?: string;
  requestedAt?: string | Date;
  completedAt?: string | Date;
  reportedAt?: string | Date;
  accent?: string;
}

const modalityConfig = {
  lab: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    gradient: "from-blue-500 to-indigo-500",
    bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
    border: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    textColorSecondary: "text-blue-700 dark:text-blue-300"
  },
  xray: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    border: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    textColorSecondary: "text-blue-700 dark:text-blue-300"
  },
  ultrasound: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    gradient: "from-teal-500 to-emerald-500",
    bgGradient: "from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20",
    border: "border-teal-200 dark:border-teal-800",
    textColor: "text-teal-900 dark:text-teal-100",
    textColorSecondary: "text-teal-700 dark:text-teal-300"
  },
  other: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: "from-gray-500 to-slate-500",
    bgGradient: "from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20",
    border: "border-gray-200 dark:border-gray-800",
    textColor: "text-gray-900 dark:text-gray-100",
    textColorSecondary: "text-gray-700 dark:text-gray-300"
  }
};

function formatDate(date?: string | Date): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function ResultHeaderCard({
  modality,
  title,
  subtitle,
  requestedAt,
  completedAt,
  reportedAt
}: ResultHeaderCardProps) {
  const config = modalityConfig[modality];

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${config.bgGradient} border-2 ${config.border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${config.textColor}`}>{title}</h3>
          {subtitle && (
            <p className={`text-sm ${config.textColorSecondary}`}>{subtitle}</p>
          )}
        </div>
      </div>
      
      {(requestedAt || completedAt || reportedAt) && (
        <div className="flex flex-wrap gap-2 mt-3 text-sm">
          {requestedAt && (
            <div className={`flex items-center gap-1 ${config.textColorSecondary}`}>
              <Calendar className="w-4 h-4" />
              <span>Requested: {formatDate(requestedAt)}</span>
            </div>
          )}
          {completedAt && (
            <div className={`flex items-center gap-1 ${config.textColorSecondary}`}>
              <Calendar className="w-4 h-4" />
              <span>Completed: {formatDate(completedAt)}</span>
            </div>
          )}
          {reportedAt && (
            <div className={`flex items-center gap-1 ${config.textColorSecondary}`}>
              <Calendar className="w-4 h-4" />
              <span>Reported: {formatDate(reportedAt)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
