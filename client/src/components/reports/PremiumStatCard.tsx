import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PremiumStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

export function PremiumStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
  onClick,
  className,
}: PremiumStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === "number" ? value : 0;

  // Count-up animation effect
  useEffect(() => {
    if (typeof value !== "number") {
      return;
    }

    let start = 0;
    const end = numericValue;
    const duration = 1000; // 1 second
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-2xl",
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
        "border border-white/20 dark:border-gray-700/20",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Gradient background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90 dark:opacity-80",
          gradient
        )}
      />

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm" />

      <CardContent className="relative p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-90">{title}</p>
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {typeof value === "number" ? displayValue.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-sm opacity-80 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs opacity-75 ml-1">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <Icon className="h-12 w-12 opacity-80 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
            {/* Glow effect */}
            <div className="absolute inset-0 blur-xl opacity-50">
              <Icon className="h-12 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
