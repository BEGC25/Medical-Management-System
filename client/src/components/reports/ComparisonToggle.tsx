import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightLeft } from "lucide-react";

interface ComparisonToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ComparisonToggle({ enabled, onToggle }: ComparisonToggleProps) {
  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <Label htmlFor="comparison-mode" className="cursor-pointer">
              <span className="font-medium">Compare Periods</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Show comparison with previous period
              </p>
            </Label>
          </div>
          <Switch
            id="comparison-mode"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}
