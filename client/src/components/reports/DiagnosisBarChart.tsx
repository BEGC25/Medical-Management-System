import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";
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

interface DiagnosisBarChartProps {
  data?: Array<{ diagnosis: string; count: number }>;
  isLoading?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export function DiagnosisBarChart({ data = [], isLoading }: DiagnosisBarChartProps) {
  // Take top 5 diagnoses
  const topDiagnoses = data.slice(0, 5);
  const totalCases = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = topDiagnoses.map((item, index) => ({
    diagnosis: item.diagnosis || "Not specified",
    count: item.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-premium transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>Top Diagnoses</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No diagnosis data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis
                type="number"
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                type="category"
                dataKey="diagnosis"
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
                width={100}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const percentage = totalCases > 0 ? ((payload[0].value as number / totalCases) * 100).toFixed(1) : 0;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].payload.diagnosis}</p>
                        <p className="text-sm">
                          <span className="font-bold text-blue-600 dark:text-blue-400">{payload[0].value}</span> cases
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            ({percentage}%)
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 8, 8, 0]}
                animationDuration={1200}
                animationBegin={300}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
