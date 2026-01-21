import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Clock, AlertCircle, Microscope, Camera, Stethoscope, AlertTriangle, AlertOctagon } from "lucide-react";
import { format } from "date-fns";
import type { AnyResult } from "./types";
import { formatDepartmentName } from "@/lib/display-utils";
import { getAgingInfo, hasAbnormalFindings, hasCriticalFindings, hasAbnormalImagingFindings } from "@/lib/results-analysis";

interface ResultsListProps {
  results: AnyResult[];
  selectedResultId: number | null;
  selectedResultType?: string;
  onSelectResult: (result: AnyResult) => void;
}

export function ResultsList({ results, selectedResultId, selectedResultType, onSelectResult }: ResultsListProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lab':
        return <Microscope className="h-4 w-4 text-blue-500" />;
      case 'xray':
        return <Camera className="h-4 w-4 text-amber-500" />;
      case 'ultrasound':
        return <Stethoscope className="h-4 w-4 text-teal-500" />;
      default:
        return <Microscope className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  const getDepartmentColors = (type: string) => {
    switch (type) {
      case 'lab':
        return {
          border: 'border-l-4 border-l-blue-400 dark:border-l-blue-500',
          bg: 'bg-blue-50/50 dark:bg-blue-950/20',
          badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        };
      case 'xray':
        return {
          border: 'border-l-4 border-l-amber-400 dark:border-l-amber-500',
          bg: 'bg-amber-50/50 dark:bg-amber-950/20',
          badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
        };
      case 'ultrasound':
        return {
          border: 'border-l-4 border-l-teal-400 dark:border-l-teal-500',
          bg: 'bg-teal-50/50 dark:bg-teal-950/20',
          badge: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
        };
      default:
        return {
          border: 'border-l-4 border-l-slate-400',
          bg: 'bg-slate-50/50 dark:bg-slate-900/20',
          badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
  };

  /**
   * Check if a result has abnormal/critical findings
   */
  const checkAbnormal = (result: AnyResult): { hasAbnormal: boolean; isCritical: boolean } => {
    if (result.status !== 'completed') {
      return { hasAbnormal: false, isCritical: false };
    }

    if (result.type === 'lab') {
      const labResult = result as any;
      const critical = hasCriticalFindings(labResult.results);
      const abnormal = hasAbnormalFindings(labResult.results);
      return { hasAbnormal: abnormal, isCritical: critical };
    } else if (result.type === 'xray' || result.type === 'ultrasound') {
      const imagingResult = result as any;
      const abnormal = hasAbnormalImagingFindings(imagingResult.findings, imagingResult.impression);
      return { hasAbnormal: abnormal, isCritical: false };
    }

    return { hasAbnormal: false, isCritical: false };
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-8">
        <AlertCircle className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-600" />
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {results.map((result) => {
          const colors = getDepartmentColors(result.type);
          const isSelected = selectedResultId === result.id && (!selectedResultType || selectedResultType === result.type);
          const agingInfo = getAgingInfo((result as any).requestedDate, result.type as any, result.status);
          const abnormalInfo = checkAbnormal(result);
          
          return (
            <div
              key={`${result.type}-${result.id}`}
              className={`
                rounded-lg p-3 cursor-pointer transition-all duration-200
                border ${colors.border}
                ${agingInfo.isOverdue 
                  ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900' 
                  : isSelected 
                    ? 'bg-white dark:bg-slate-800 shadow-md ring-2 ring-blue-400 dark:ring-blue-500' 
                    : `${colors.bg} hover:bg-white dark:hover:bg-slate-800 hover:shadow-md border-slate-200 dark:border-slate-700`
                }
              `}
              onClick={() => onSelectResult(result)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectResult(result);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${result.patient?.firstName} ${result.patient?.lastName}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                    {getTypeIcon(result.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {result.patient?.firstName && result.patient?.lastName 
                          ? `${result.patient.firstName} ${result.patient.lastName}`
                          : result.patientId || 'Unknown Patient'}
                      </h3>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {result.patient?.patientId || result.patientId}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
                      <Badge variant="outline" className={`${colors.badge} text-xs font-medium`}>
                        {formatDepartmentName(result.type, false)}
                      </Badge>
                      
                      <span className="font-mono">
                        {result.type === 'lab' && `${(result as any).testId}`}
                        {result.type === 'xray' && `${(result as any).examId}`}
                        {result.type === 'ultrasound' && `${(result as any).examId}`}
                      </span>
                      
                      <span>•</span>
                      <span>{format(new Date(result.date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                  {/* Aging Badge for Pending Results */}
                  {result.status === 'pending' && agingInfo.daysOld > 0 && (
                    <Badge 
                      className={`text-xs font-medium ${
                        agingInfo.isOverdue 
                          ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700' 
                          : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                      }`}
                    >
                      {agingInfo.isOverdue ? '🚨' : '⏰'} {agingInfo.daysOld}d
                    </Badge>
                  )}
                  
                  {/* Critical/Abnormal Badge for Completed Results */}
                  {abnormalInfo.hasAbnormal && (
                    <Badge 
                      className={`text-xs font-medium ${
                        abnormalInfo.isCritical 
                          ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700' 
                          : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700'
                      }`}
                    >
                      {abnormalInfo.isCritical ? '🚨 CRITICAL' : '⚠️ Abnormal'}
                    </Badge>
                  )}
                  
                  {/* Status Badge */}
                  {getStatusIcon(result.status)}
                  <Badge className={`text-xs font-medium ${getStatusColor(result.status)}`}>
                    {result.status}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
