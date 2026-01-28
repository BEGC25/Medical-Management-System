import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatClinicDay } from "@/lib/date-utils";

interface VisitsTrendChartProps {
  data?: Array<{ date: string; visits: number }>;
  isLoading?: boolean;
}

export function VisitsTrendChart({ data = [], isLoading }: VisitsTrendChartProps) {
  // Check if there's any actual visit data (not just zero-visit days)
  const hasVisitData = data.some(d => d.visits > 0);
  
  // Format dates for display
  const chartData = data.map(item => ({
    ...item,
    displayDate: formatDate(item.date),
  }));

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-premium transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Visits Trend</span>
          </div>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        ) : !hasVisitData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Activity className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">No visit data available</p>
            <p className="text-sm">for the selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis
                dataKey="displayDate"
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {payload[0].payload.displayDate}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-bold">
                          {payload[0].value} visit{payload[0].value !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#visitGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// Format ISO date string (YYYY-MM-DD) to display format (e.g., "Jan 10")
function formatDate(dateStr: string): string {
  try {
    return formatClinicDay(dateStr, 'MMM d');
  } catch {
    return dateStr;
  }
}
