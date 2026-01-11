import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface VisitsTrendChartProps {
  data?: Array<{ date: string; visits: number }>;
  isLoading?: boolean;
}

export function VisitsTrendChart({ data = [], isLoading }: VisitsTrendChartProps) {
  // Generate sample data if none provided
  const rawData = data.length > 0 ? data : generateSampleData();
  
  // Format ISO dates (YYYY-MM-DD) to display format (MMM DD)
  const chartData = rawData.map(item => ({
    ...item,
    displayDate: formatISODate(item.date),
    date: item.date, // Keep original for tooltip
  }));

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-premium transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Visits Trend</span>
          </div>
          <TrendingUp className="h-4 w-4 text-green-600 animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].payload.date}</p>
                        <p className="text-blue-600 dark:text-blue-400 font-bold">{payload[0].value} visits</p>
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
                animationBegin={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to format ISO date (YYYY-MM-DD) to display format (MMM DD)
function formatISODate(isoDate: string): string {
  try {
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return isoDate; // Fallback to original if parsing fails
  }
}

function generateSampleData() {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visits: Math.floor(Math.random() * 30) + 10,
    });
  }
  return data;
}
