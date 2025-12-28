import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon?: LucideIcon;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  icon: Icon,
  title,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "bg-[hsl(var(--surface-white))] rounded-xl",
        "border border-[hsl(var(--border-light))]",
        "shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border-light))]">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-[hsl(var(--clinical-teal-100))]">
              <Icon className="w-4 h-4 text-[hsl(var(--clinical-teal-600))]" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">
            {title}
          </h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
