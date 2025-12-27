import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  showProgress?: boolean;
  maxValue?: number;
}

export function StatCard({
  label,
  value,
  color = "var(--medical-blue)",
  icon,
  trend,
  showProgress = false,
  maxValue = 100,
  className,
  ...props
}: StatCardProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const circumference = 2 * Math.PI * 18; // radius = 18
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300",
        "hover:bg-gray-50/80 dark:hover:bg-gray-800/60",
        "border-l-4 border-transparent",
        "hover:shadow-[2px_0_8px_rgba(15,23,42,0.06)]",
        "hover:translate-x-1",
        className
      )}
      style={{
        borderLeftColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderLeftColor = "transparent";
      }}
      {...props}
    >
      <div className="flex items-center gap-3">
        {showProgress && (
          <div className="relative">
            <svg className="w-12 h-12 -rotate-90">
              {/* Background circle */}
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                strokeWidth="3"
                className="text-gray-200 dark:text-gray-700"
                style={{ stroke: 'currentColor' }}
              />
              {/* Progress circle */}
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
                style={{ stroke: color }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {icon || (
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color }}
                >
                  {value}
                </span>
              )}
            </div>
          </div>
        )}
        {icon && !showProgress && (
          <div
            className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
            style={{ 
              backgroundColor: color.startsWith('hsl') || color.startsWith('var(') 
                ? `${color.replace(')', ', 0.1)')}` 
                : `${color}15` 
            }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          {trend && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={cn(
                  "text-xs font-semibold",
                  trend.isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs yesterday
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <span
          className="font-bold text-2xl tabular-nums tracking-tight transition-all duration-300 group-hover:scale-105 inline-block"
          style={{ color }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
