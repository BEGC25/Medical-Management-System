import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TestTube, Scan, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PendingBacklogProps {
  data?: {
    total: number;
    labResults: number;
    xrayReports: number;
    ultrasoundReports: number;
  };
  isLoading?: boolean;
}

export function PendingBacklog({ data, isLoading }: PendingBacklogProps) {
  const total = data?.total || 0;
  const labResults = data?.labResults || 0;
  const xrayReports = data?.xrayReports || 0;
  const ultrasoundReports = data?.ultrasoundReports || 0;
  
  const hasData = total > 0;
  const isHighPriority = total > 5;

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-premium transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${isHighPriority ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`} />
          Pending Backlog (Current)
        </CardTitle>
        <CardDescription>All pending items right now</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        ) : !hasData ? (
          <div className="py-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600 opacity-50" />
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              No pending items
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All test results have been reviewed
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Badge */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pending</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{total}</p>
              </div>
              {isHighPriority && (
                <Badge variant="destructive" className="text-sm">
                  High Priority
                </Badge>
              )}
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {labResults > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <TestTube className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lab Results
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                    {labResults}
                  </Badge>
                </div>
              )}

              {xrayReports > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <Scan className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      X-Ray Reports
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100">
                    {xrayReports}
                  </Badge>
                </div>
              )}

              {ultrasoundReports > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ultrasound Reports
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-cyan-100 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-100">
                    {ultrasoundReports}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
