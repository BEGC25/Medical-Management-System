import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Clock, AlertCircle, Microscope, Camera, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import type { AnyResult } from "./types";
import { formatDepartmentName } from "@/lib/display-utils";

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
          
          return (
            <div
              key={`${result.type}-${result.id}`}
              className={`
                rounded-lg p-3.5 cursor-pointer transition-all duration-200
                border ${colors.border}
                ${isSelected 
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
                        {result.patient?.firstName} {result.patient?.lastName}
                      </h3>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {result.patient?.patientId}
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
                
                <div className="flex items-center gap-1 flex-shrink-0">
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
