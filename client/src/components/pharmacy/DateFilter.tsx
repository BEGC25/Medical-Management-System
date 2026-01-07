import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DateFilterPreset = "all" | "today" | "last7days" | "last30days" | "custom";

interface DateFilterProps {
  onFilterChange: (preset: DateFilterPreset, startDate?: string, endDate?: string) => void;
  defaultPreset?: DateFilterPreset;
}

export function DateFilter({ onFilterChange, defaultPreset = "all" }: DateFilterProps) {
  const [preset, setPreset] = useState<DateFilterPreset>(defaultPreset);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { value: "all" as const, label: "All Time" },
    { value: "today" as const, label: "Today" },
    { value: "last7days" as const, label: "Last 7 Days" },
    { value: "last30days" as const, label: "Last 30 Days" },
    { value: "custom" as const, label: "Custom Range" },
  ];

  const handlePresetChange = (newPreset: DateFilterPreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      onFilterChange(newPreset);
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onFilterChange("custom", startDate, endDate);
      setIsOpen(false);
    }
  };

  const getDisplayLabel = () => {
    if (preset === "custom" && startDate && endDate) {
      return `${startDate} to ${endDate}`;
    }
    return presets.find(p => p.value === preset)?.label || "All Time";
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-900 
                    border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Date:</span>
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="min-w-[180px] justify-between border-gray-300 dark:border-gray-600
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm">{getDisplayLabel()}</span>
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                  Quick Filters
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.filter(p => p.value !== "custom").map((p) => (
                    <Button
                      key={p.value}
                      variant={preset === p.value ? "default" : "outline"}
                      className={`text-sm ${preset === p.value ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      onClick={() => handlePresetChange(p.value)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                  Custom Range
                </Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="start-date" className="text-xs text-gray-600 dark:text-gray-400">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPreset("custom");
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs text-gray-600 dark:text-gray-400">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPreset("custom");
                      }}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleCustomApply}
                    disabled={!startDate || !endDate}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Apply Custom Range
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
