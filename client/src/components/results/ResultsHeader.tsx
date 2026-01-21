import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, FileText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface ResultsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
}

export function ResultsHeader({ searchTerm, onSearchChange, onRefresh, isRefreshing, lastUpdated }: ResultsHeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-md">
      <div className="container mx-auto px-6 py-4">
        {/* Softened Gradient Header - Matches Billing & Invoices */}
        <div className="bg-gradient-to-r from-slate-500 via-slate-400 to-blue-500 dark:from-slate-700 dark:via-slate-600 dark:to-blue-700 text-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl shadow-md hover:bg-white/20 transition-all duration-200">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Results Command Center</h1>
                <p className="text-slate-200 dark:text-slate-300 mt-1 text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  HIPAA Compliant • Audit Trail Enabled
                </p>
              </div>
            </div>
            
            {/* Refresh Button and Last Updated */}
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <div className="text-sm text-slate-200 dark:text-slate-300">
                  <div className="text-xs opacity-75">Last updated</div>
                  <div className="font-medium">{formatDistanceToNow(lastUpdated, { addSuffix: true })}</div>
                </div>
              )}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white/30 transition-all duration-200 shadow-md"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="ml-2">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Search Section - Moved below header */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Quick search: patient name, ID, or test number..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-11 h-11 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent rounded-lg"
            aria-label="Search results by patient name, ID, or test number"
          />
        </div>
      </div>
    </div>
  );
}
