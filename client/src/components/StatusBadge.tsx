import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  variant?: "new" | "count" | "status";
  children: React.ReactNode;
  className?: string;
  color?: "blue" | "orange" | "purple" | "green" | "red";
  size?: "sm" | "md";
  emphasized?: boolean;
}

export function StatusBadge({ 
  variant = "status", 
  children, 
  className,
  color = "blue",
  size = "sm",
  emphasized = false
}: StatusBadgeProps) {
  const colorClasses = {
    blue: "bg-blue-600 text-white",
    orange: "bg-attention-orange text-white",
    purple: "bg-purple-600 text-white",
    green: "bg-health-green text-white",
    red: "bg-alert-red text-white",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  const baseClass = cn(
    "font-semibold",
    colorClasses[color],
    sizeClasses[size],
    emphasized && "ring-2 ring-offset-1 scale-105 shadow-lg",
    !emphasized && variant === "count" && "shadow-md",
    variant === "count" && "min-w-[2rem] justify-center tabular-nums",
    className
  );

  return (
    <Badge className={baseClass}>
      {children}
    </Badge>
  );
}
