import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "lucide-react";
import { calculateTAT } from "@/lib/results-analysis";
import type { AnyResult } from "./types";

interface TATStatsProps {
  results: AnyResult[];
}

export function TATStats({ results }: TATStatsProps) {
  // Calculate TAT statistics for completed results
  const completedResults = results.filter(r => r.status === 'completed');
  
  const labTATs: number[] = [];
  const xrayTATs: number[] = [];
  const ultrasoundTATs: number[] = [];
  
  completedResults.forEach(result => {
    const tat = calculateTAT((result as any).requestedDate, (result as any).completedDate);
    if (tat !== null) {
      if (result.type === 'lab') {
        labTATs.push(tat);
      } else if (result.type === 'xray') {
        xrayTATs.push(tat);
      } else if (result.type === 'ultrasound') {
        ultrasoundTATs.push(tat);
      }
    }
  });
  
  const avgTAT = (nums: number[]) => 
    nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 'N/A';
  
  const labAvg = avgTAT(labTATs);
  const xrayAvg = avgTAT(xrayTATs);
  const ultrasoundAvg = avgTAT(ultrasoundTATs);
  
  // Don't show if no completed results
  if (completedResults.length === 0) {
    return null;
  }
  
  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
            <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              ⏱️ Average Turnaround Time
            </h3>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Lab Tests</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                  {labAvg} {labAvg !== 'N/A' && 'days'}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">X-Rays</p>
                <p className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {xrayAvg} {xrayAvg !== 'N/A' && 'days'}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Ultrasounds</p>
                <p className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                  {ultrasoundAvg} {ultrasoundAvg !== 'N/A' && 'days'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
