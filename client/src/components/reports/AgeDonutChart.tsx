import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AgeDistributionChartProps {
  data?: Array<{ ageRange: string; count: number; percentage: number }>;
  totalPatients?: number;
  isLoading?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#6b7280"];

export function AgeDonutChart({ data = [], totalPatients = 0, isLoading }: AgeDistributionChartProps) {
  // Filter to only show ranges with patients
  const chartData = data.filter(d => d.count > 0);
  
  const hasData = chartData.length > 0;

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-premium transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Age Distribution</span>
          </div>
          <span className="text-sm font-normal text-gray-500">
            {totalPatients} total patients
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        ) : !hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
            <Users className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">No age data available</p>
            <p className="text-sm">Patient ages have not been recorded</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis 
                dataKey="ageRange" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={50}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {data.ageRange} years
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-bold">
                          {data.count} patient{data.count !== 1 ? 's' : ''} ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={1000}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
