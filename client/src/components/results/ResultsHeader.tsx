import { Input } from "@/components/ui/input";
import { Search, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ResultsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ResultsHeader({ searchTerm, onSearchChange }: ResultsHeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-md">
      <div className="container mx-auto px-6 py-6">
        {/* Title Section */}
        <div className="flex items-start justify-between mb-4 gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-50 dark:to-slate-200 bg-clip-text text-transparent">
              Results Command Center
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              HIPAA Compliant • Audit Trail Enabled
            </p>
          </div>
        </div>
        
        {/* Search Section */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Quick search: patient name, ID, or test number..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-11 h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent rounded-lg"
            aria-label="Search results by patient name, ID, or test number"
          />
        </div>
      </div>
    </div>
  );
}
