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
    <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Results Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              HIPAA Compliant • Audit Trail Enabled
            </p>
          </div>
        </div>
        
        {/* Primary Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Quick search: patient name, ID, or test number..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 h-11 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-label="Search results by patient name, ID, or test number"
          />
        </div>
      </div>
    </div>
  );
}
