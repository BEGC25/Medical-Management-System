import { Card, CardContent } from "@/components/ui/card";
import { FileText, Microscope, Scan, MonitorSpeaker, AlertTriangle, AlertOctagon } from "lucide-react";
import type { ResultsKPI, ResultType } from "./types";

interface ResultsKPICardsProps {
  kpi: ResultsKPI;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function ResultsKPICards({ kpi, typeFilter, onTypeFilterChange, statusFilter, onStatusFilterChange }: ResultsKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">{/* Changed to 6 columns */}
      {/* Total Results */}
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2 ${
          typeFilter === 'all' 
            ? 'ring-2 ring-slate-400 dark:ring-slate-500 shadow-lg scale-[1.02]' 
            : 'border-slate-200 dark:border-slate-700 hover:scale-[1.01]'
        }`}
        onClick={() => onTypeFilterChange('all')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTypeFilterChange('all');
          }
        }}
        aria-label="Filter to show all results"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Results</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {kpi.total}
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 shadow-md">
              <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab Tests */}
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-800 border-2 ${
          typeFilter === 'lab' 
            ? 'ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg scale-[1.02]' 
            : 'border-blue-200 dark:border-blue-800 hover:scale-[1.01]'
        }`}
        onClick={() => onTypeFilterChange('lab')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTypeFilterChange('lab');
          }
        }}
        aria-label="Filter to show lab tests only"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lab Tests</p>
              <p className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {kpi.lab}
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900 p-2 shadow-md">
              <Microscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* X-Rays */}
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-slate-800 border-2 ${
          typeFilter === 'xray' 
            ? 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg scale-[1.02]' 
            : 'border-amber-200 dark:border-amber-800 hover:scale-[1.01]'
        }`}
        onClick={() => onTypeFilterChange('xray')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTypeFilterChange('xray');
          }
        }}
        aria-label="Filter to show X-rays only"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">X-Rays</p>
              <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {kpi.xray}
              </p>
            </div>
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900 p-2 shadow-md">
              <Scan className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ultrasounds */}
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-teal-50 to-white dark:from-teal-950 dark:to-slate-800 border-2 ${
          typeFilter === 'ultrasound' 
            ? 'ring-2 ring-teal-400 dark:ring-teal-500 shadow-lg scale-[1.02]' 
            : 'border-teal-200 dark:border-teal-800 hover:scale-[1.01]'
        }`}
        onClick={() => onTypeFilterChange('ultrasound')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTypeFilterChange('ultrasound');
          }
        }}
        aria-label="Filter to show ultrasounds only"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ultrasounds</p>
              <p className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
                {kpi.ultrasound}
              </p>
            </div>
            <div className="rounded-lg bg-teal-100 dark:bg-teal-900 p-2 shadow-md">
              <MonitorSpeaker className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Results - Clickable */}
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-slate-800 border-2 ${
          statusFilter === 'overdue' 
            ? 'ring-2 ring-orange-400 dark:ring-orange-500 shadow-lg scale-[1.02]' 
            : 'border-orange-200 dark:border-orange-800 hover:scale-[1.01]'
        }`}
        onClick={() => onStatusFilterChange?.('overdue')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onStatusFilterChange?.('overdue');
          }
        }}
        aria-label="Filter to show overdue results only"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">⚠️ Overdue</p>
              <p className="text-2xl font-bold tabular-nums text-orange-600 dark:text-orange-400">
                {kpi.overdue}
              </p>
            </div>
            <div className="rounded-lg bg-orange-100 dark:bg-orange-900 p-2 shadow-md">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Findings - Clickable */}
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-xl bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-800 border-2 ${
          statusFilter === 'abnormal' 
            ? 'ring-2 ring-red-400 dark:ring-red-500 shadow-lg scale-[1.02]' 
            : 'border-red-200 dark:border-red-800 hover:scale-[1.01]'
        }`}
        onClick={() => onStatusFilterChange?.('abnormal')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onStatusFilterChange?.('abnormal');
          }
        }}
        aria-label="Filter to show results with critical findings only"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">⚠️ Critical Findings</p>
              <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
                {kpi.critical}
              </p>
            </div>
            <div className="rounded-lg bg-red-100 dark:bg-red-900 p-2 shadow-md">
              <AlertOctagon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
