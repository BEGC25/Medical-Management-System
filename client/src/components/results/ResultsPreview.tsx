import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User, Calendar, Microscope, Camera, Stethoscope, 
  AlertCircle, Eye, Printer, Plus, FileText, Scan, MonitorSpeaker
} from "lucide-react";
import { format } from "date-fns";
import type { AnyResult } from "./types";
import { getResultValueColor } from "./utils";

interface ResultsPreviewProps {
  result: AnyResult | null;
  onViewFullDetails: (result: AnyResult) => void;
}

export function ResultsPreview({ result, onViewFullDetails }: ResultsPreviewProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-8">
        <FileText className="h-20 w-20 mb-4 text-slate-300 dark:text-slate-600" />
        <p className="text-lg font-medium">No Result Selected</p>
        <p className="text-sm mt-1 text-center">Select a result from the list to view details</p>
      </div>
    );
  }

  const getTypeIcon = () => {
    switch (result.type) {
      case 'lab':
        return <Microscope className="h-5 w-5 text-blue-500" />;
      case 'xray':
        return <Scan className="h-5 w-5 text-amber-500" />;
      case 'ultrasound':
        return <MonitorSpeaker className="h-5 w-5 text-teal-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  const formatLabResults = (results: string) => {
    if (!results) return null;
    
    try {
      const parsed = JSON.parse(results);
      
      return (
        <div className="space-y-3">
          {Object.entries(parsed).map(([testName, testData]: [string, any]) => (
            <div key={testName} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
              <h5 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-700 pb-2">
                {testName}
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(testData).map(([field, value]: [string, any]) => (
                  <div key={field} className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {field}:
                    </span>
                    <span className={`font-mono text-right ${getResultValueColor(value as string)}`}>
                      {value as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return (
        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border text-xs">
          <pre className="whitespace-pre-wrap font-mono">{results}</pre>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Preview Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              {result.type === 'lab' && `Lab Test: ${(result as any).testId}`}
              {result.type === 'xray' && `X-Ray: ${(result as any).examId}`}
              {result.type === 'ultrasound' && `Ultrasound: ${(result as any).examId}`}
            </h2>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewFullDetails(result)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Full Details
          </Button>
        </div>
        
        {/* Patient Info Quick View */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {result.patient?.firstName} {result.patient?.lastName}
            </span>
            <Badge variant="outline" className="text-xs">{result.patient?.patientId}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
            <div>Age: {result.patient?.age || 'N/A'}</div>
            <div>Gender: {result.patient?.gender || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Lab Test Details */}
          {result.type === 'lab' && (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-2 text-slate-900 dark:text-slate-100">Test Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Category:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{(result as any).category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Priority:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{(result as any).priority}</span>
                  </div>
                  {(result as any).clinicalInfo && (
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Clinical Info:</span>
                      <p className="mt-1 text-slate-900 dark:text-slate-100">{(result as any).clinicalInfo}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {result.status === 'completed' && (result as any).results && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-slate-900 dark:text-slate-100">Laboratory Results</h3>
                  {formatLabResults((result as any).results)}
                </div>
              )}

              {result.status === 'pending' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Results Pending</span>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Test is currently being processed
                  </p>
                </div>
              )}
            </>
          )}

          {/* X-Ray Details */}
          {result.type === 'xray' && (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-2 text-slate-900 dark:text-slate-100">Examination Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Exam Type:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{(result as any).examType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Body Part:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{(result as any).bodyPart}</span>
                  </div>
                  {(result as any).clinicalIndication && (
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Indication:</span>
                      <p className="mt-1 text-slate-900 dark:text-slate-100">{(result as any).clinicalIndication}</p>
                    </div>
                  )}
                </div>
              </div>

              {result.status === 'completed' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {(result as any).findings && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <h4 className="font-medium text-xs mb-1 text-slate-900 dark:text-slate-100">Findings:</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{(result as any).findings}</p>
                      </div>
                    )}
                    {(result as any).impression && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <h4 className="font-medium text-xs mb-1 text-slate-900 dark:text-slate-100">Impression:</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{(result as any).impression}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* Ultrasound Details */}
          {result.type === 'ultrasound' && (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-2 text-slate-900 dark:text-slate-100">Examination Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Exam Type:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{(result as any).examType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Urgency:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{(result as any).urgency}</span>
                  </div>
                  {(result as any).indication && (
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Indication:</span>
                      <p className="mt-1 text-slate-900 dark:text-slate-100">{(result as any).indication}</p>
                    </div>
                  )}
                </div>
              </div>

              {result.status === 'completed' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {(result as any).findings && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <h4 className="font-medium text-xs mb-1 text-slate-900 dark:text-slate-100">Findings:</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{(result as any).findings}</p>
                      </div>
                    )}
                    {(result as any).impression && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <h4 className="font-medium text-xs mb-1 text-slate-900 dark:text-slate-100">Impression:</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{(result as any).impression}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Requested:</span>
                <span>{format(new Date(result.createdAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              {result.status === 'completed' && (result as any).completedDate && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Completed:</span>
                  <span>{format(new Date((result as any).completedDate), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
