import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestTube, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface TestsBarChartProps {
  labTests?: number;
  xrays?: number;
  ultrasounds?: number;
  isLoading?: boolean;
}

const COLORS = {
  lab: "#f59e0b", // orange
  xray: "#8b5cf6", // purple
  ultrasound: "#14b8a6", // teal
};

export function TestsBarChart({ labTests = 0, xrays = 0, ultrasounds = 0, isLoading }: TestsBarChartProps) {
  const data = [
    { name: "Lab Tests", value: labTests, color: COLORS.lab },
    { name: "X-Rays", value: xrays, color: COLORS.xray },
    { name: "Ultrasounds", value: ultrasounds, color: COLORS.ultrasound },
  ];

  const hasNoTests = labTests === 0 && xrays === 0 && ultrasounds === 0;

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-premium transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <span>Tests by Type</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        ) : hasNoTests ? (
          <div className="flex flex-col items-center justify-center py-12">
            <TestTube className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No tests ordered yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center max-w-xs">
              Start ordering lab tests, X-rays, or ultrasounds to see analytics here
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/treatment'}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Order First Test
            </Button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis
                dataKey="name"
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
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].payload.name}</p>
                        <p className="text-sm">
                          <span className="font-bold text-blue-600 dark:text-blue-400">{payload[0].value}</span> tests
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                animationDuration={1200}
                animationBegin={200}
              >
                {data.map((entry, index) => (
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
