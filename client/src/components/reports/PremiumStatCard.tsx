import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "react-countup";

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
  const numericValue = typeof value === "number" ? value : 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.02]",
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

      <CardContent className="relative p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium opacity-90">{title}</p>
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              {typeof value === "number" ? (
                <CountUp
                  end={numericValue}
                  duration={2}
                  separator=","
                />
              ) : (
                value
              )}
            </div>
            {subtitle && (
              <p className="text-xs opacity-80 mt-0.5">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1.5">
                {trend.value > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : trend.value < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                <span className="text-xs font-medium">
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs opacity-75 ml-1">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
              <Icon className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
