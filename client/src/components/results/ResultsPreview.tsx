import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  User, 
  Calendar, 
  Microscope, 
  AlertCircle, 
  Eye, 
  Printer, 
  Plus, 
  FileText, 
  Scan, 
  MonitorSpeaker,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import type { AnyResult } from "./types";
import { getResultValueColor } from "./utils";
import { hasCriticalFindings, hasAbnormalFindings, hasAbnormalImagingFindings, getAbnormalFindings } from "@/lib/results-analysis";

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
            <div key={testName} className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <h5 className="font-bold text-base mb-3 text-blue-700 dark:text-blue-300 border-b-2 border-blue-200 dark:border-blue-700 pb-2">
                {testName}
              </h5>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(testData).map(([field, value]: [string, any]) => (
                  <div key={field} className="flex justify-between items-center text-sm py-1.5 px-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {field}:
                    </span>
                    <span className={`font-mono text-right font-bold ${getResultValueColor(value as string)}`}>
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
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border-2 text-sm shadow-sm">
          <pre className="whitespace-pre-wrap font-mono">{results}</pre>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Preview Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              {getTypeIcon()}
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">
                {result.type === 'lab' && `Lab Test: ${(result as any).testId}`}
                {result.type === 'xray' && `X-Ray: ${(result as any).examId}`}
                {result.type === 'ultrasound' && `Ultrasound: ${(result as any).examId}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {format(new Date(result.createdAt), 'MMM dd, yyyy • HH:mm')}
              </p>
            </div>
          </div>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onViewFullDetails(result)}
            className="gap-2 shadow-md"
          >
            <Eye className="h-4 w-4" />
            Full Details
          </Button>
        </div>
        
        {/* Separator Line */}
        <div className="border-t border-slate-300 dark:border-slate-600 my-3"></div>
        
        {/* Patient Information Header - Premium Style */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {result.patient?.firstName && result.patient?.lastName 
                    ? `${result.patient.firstName} ${result.patient.lastName}`
                    : 'Patient Information'}
                </h3>
                <Badge variant="outline" className="text-xs font-mono">
                  {result.patient?.patientId || result.patientId}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>
                  <span className="font-medium">Age:</span> {result.patient?.age || 'N/A'}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span>
                  <span className="font-medium">Gender:</span> {result.patient?.gender || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Critical Findings Alert Banner */}
          {result.status === 'completed' && (() => {
            let hasCritical = false;
            let hasAbnormal = false;
            
            if (result.type === 'lab') {
              hasCritical = hasCriticalFindings((result as any).results);
              hasAbnormal = hasAbnormalFindings((result as any).results);
            } else if (result.type === 'xray' || result.type === 'ultrasound') {
              hasAbnormal = hasAbnormalImagingFindings((result as any).findings, (result as any).impression);
            }
            
            if (hasCritical || hasAbnormal) {
              return (
                <Alert className="border-2 border-red-300 dark:border-red-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 shadow-md">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-900 dark:text-red-100 font-bold text-base">
                    ⚠️ {hasCritical ? 'CRITICAL FINDINGS DETECTED' : 'Abnormal Findings Detected'}
                  </AlertTitle>
                  <AlertDescription className="text-red-800 dark:text-red-200 mt-1">
                    {hasCritical 
                      ? 'This result contains critical abnormal values requiring immediate clinical review and action.'
                      : 'This result contains abnormal values that may require clinical review.'}
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()}
          {/* Lab Test Details */}
          {result.type === 'lab' && (
            <>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Microscope className="h-4 w-4 text-blue-500" />
                  Test Information
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Category:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{(result as any).category}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Priority:</span>
                    <Badge variant="outline" className="font-semibold">{(result as any).priority}</Badge>
                  </div>
                  {(result as any).clinicalInfo && (
                    <div className="pt-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-medium block mb-1">Clinical Info:</span>
                      <p className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                        {(result as any).clinicalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              {result.status === 'completed' && (result as any).results && (
                <div>
                  <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Laboratory Results
                  </h3>
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
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Scan className="h-4 w-4 text-amber-500" />
                  Examination Information
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Exam Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{(result as any).examType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Body Part:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{(result as any).bodyPart}</span>
                  </div>
                  {(result as any).clinicalIndication && (
                    <div className="pt-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-medium block mb-1">Indication:</span>
                      <p className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                        {(result as any).clinicalIndication}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {result.status === 'completed' && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    {(result as any).findings && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                        <h4 className="font-bold text-sm mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Findings
                        </h4>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{(result as any).findings}</p>
                      </div>
                    )}
                    {(result as any).impression && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 p-4 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm">
                        <h4 className="font-bold text-sm mb-2 text-green-900 dark:text-green-100 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Impression
                        </h4>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{(result as any).impression}</p>
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
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MonitorSpeaker className="h-4 w-4 text-teal-500" />
                  Examination Information
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Exam Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{(result as any).examType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Urgency:</span>
                    <Badge variant="outline" className="font-semibold">{(result as any).urgency}</Badge>
                  </div>
                  {(result as any).indication && (
                    <div className="pt-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-medium block mb-1">Indication:</span>
                      <p className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                        {(result as any).indication}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {result.status === 'completed' && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    {(result as any).findings && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                        <h4 className="font-bold text-sm mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Findings
                        </h4>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{(result as any).findings}</p>
                      </div>
                    )}
                    {(result as any).impression && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 p-4 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm">
                        <h4 className="font-bold text-sm mb-2 text-green-900 dark:text-green-100 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Impression
                        </h4>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{(result as any).impression}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <Separator className="my-4" />

          {/* Timeline */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              Timeline
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Requested:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  {format(new Date(result.createdAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              {result.status === 'completed' && (result as any).completedDate && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Completed:</span>
                  <span className="font-semibold text-green-700 dark:text-green-400 font-mono">
                    {format(new Date((result as any).completedDate), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
