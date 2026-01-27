import * as React from "react";
import { Calendar, CheckCircle2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Modality = "lab" | "xray" | "ultrasound";
type OrderStatus = "completed" | "pending" | "preliminary";

interface PremiumOrderCardProps {
  modality: Modality;
  title: string;
  subtitle?: string;
  testCount?: number;
  status: OrderStatus;
  requestedAt?: string | Date;
  completedAt?: string | Date;
}

const modalityConfig = {
  lab: {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    gradient: "from-blue-600 to-indigo-500",
    bgGradient: "from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40",
    textColor: "text-blue-900 dark:text-blue-100",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
  xray: {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: "from-cyan-600 to-blue-600",
    bgGradient: "from-cyan-50/80 via-blue-50/60 to-cyan-50/80 dark:from-cyan-950/40 dark:via-blue-950/30 dark:to-cyan-950/40",
    textColor: "text-cyan-900 dark:text-cyan-100",
    borderColor: "border-cyan-200 dark:border-cyan-800"
  },
  ultrasound: {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    gradient: "from-violet-600 to-indigo-500",
    bgGradient: "from-violet-50/80 via-purple-50/60 to-violet-50/80 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-violet-950/40",
    textColor: "text-violet-900 dark:text-violet-100",
    borderColor: "border-violet-200 dark:border-violet-800"
  }
};

const statusConfig = {
  completed: {
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    label: "Completed"
  },
  pending: {
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    label: "Pending"
  },
  preliminary: {
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    label: "Preliminary"
  }
};

function formatDate(date?: string | Date): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PremiumOrderCard({
  modality,
  title,
  subtitle,
  testCount,
  status,
  requestedAt,
  completedAt
}: PremiumOrderCardProps) {
  const config = modalityConfig[modality];
  const statusConf = statusConfig[status];
  
  // Get modality-specific glow color class
  const glowClass = modality === "lab" 
    ? "bg-blue-500/20" 
    : modality === "xray" 
    ? "bg-cyan-500/20" 
    : "bg-violet-500/20";

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgGradient} p-6 shadow-lg`}>
      {/* Glow effect */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${glowClass} rounded-full blur-3xl`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Icon and Title Section */}
          <div className="flex items-center gap-4 flex-1">
            {/* Gradient Icon with Glow */}
            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-xl flex-shrink-0`}>
              {/* Icon glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-2xl blur opacity-50`}></div>
              <div className="relative z-10">
                {config.icon}
              </div>
            </div>
            
            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-xl font-bold ${config.textColor} truncate`}>
                {title}
              </h3>
              {subtitle && (
                <p className={`text-sm font-medium ${config.textColor} opacity-75 mt-0.5 truncate`}>
                  {subtitle}
                </p>
              )}
              {testCount !== undefined && (
                <p className={`text-sm font-medium ${config.textColor} opacity-75 mt-0.5`}>
                  {testCount} {testCount === 1 ? "test" : "tests"} ordered
                </p>
              )}
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge
            variant="outline"
            className={`${statusConf.className} text-xs font-semibold px-3 py-1.5 flex-shrink-0`}
          >
            {statusConf.label}
          </Badge>
        </div>
        
        {/* Timeline Section */}
        {(requestedAt || completedAt) && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {requestedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className={`w-4 h-4 ${config.textColor} opacity-70`} />
                <div>
                  <div className={`text-xs font-medium ${config.textColor} opacity-60`}>Requested</div>
                  <div className={`font-semibold ${config.textColor}`}>{formatDate(requestedAt)}</div>
                </div>
              </div>
            )}
            
            {requestedAt && completedAt && (
              <div className="flex items-center">
                <div className={`h-px w-6 bg-gradient-to-r ${config.gradient} opacity-40`}></div>
                <Zap className={`w-3 h-3 ${config.textColor} opacity-40 mx-1`} />
                <div className={`h-px w-6 bg-gradient-to-r ${config.gradient} opacity-40`}></div>
              </div>
            )}
            
            {completedAt && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className={`w-4 h-4 ${config.textColor} opacity-70`} />
                <div>
                  <div className={`text-xs font-medium ${config.textColor} opacity-60`}>Completed</div>
                  <div className={`font-semibold ${config.textColor}`}>{formatDate(completedAt)}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
