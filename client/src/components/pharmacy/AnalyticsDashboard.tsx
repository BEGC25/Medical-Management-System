import { useMemo } from "react";
import { TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryLedger } from "@shared/schema";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsDashboardProps {
  ledgerEntries: InventoryLedger[];
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number; // Percentage change
  icon: React.ReactNode;
  colorClass: string;
}

function MetricCard({ title, value, trend, icon, colorClass }: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className={`${colorClass} shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:-translate-y-0.5`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-white/20 dark:bg-black/20 rounded-xl shadow-premium-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ ledgerEntries, className = "" }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const dispensed = ledgerEntries.filter((e) => e.transactionType === "dispense");
    const received = ledgerEntries.filter((e) => e.transactionType === "receive");

    const totalDispensedValue = dispensed.reduce((sum, e) => sum + (e.totalValue || 0), 0);
    const totalReceivedValue = received.reduce((sum, e) => sum + (e.totalValue || 0), 0);
    const totalDispensedQty = dispensed.reduce((sum, e) => sum + Math.abs(e.quantity), 0);
    const totalReceivedQty = received.reduce((sum, e) => sum + Math.abs(e.quantity), 0);

    // Group by date for timeline
    const dateMap = new Map<string, { dispensed: number; received: number }>();
    ledgerEntries.forEach((entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      const current = dateMap.get(date) || { dispensed: 0, received: 0 };
      if (entry.transactionType === "dispense") {
        current.dispensed += Math.abs(entry.totalValue || 0);
      } else if (entry.transactionType === "receive") {
        current.received += entry.totalValue || 0;
      }
      dateMap.set(date, current);
    });

    const timelineData = Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date,
        dispensed: Math.round(values.dispensed),
        received: Math.round(values.received),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    // Top dispensed drugs
    const drugDispenseMap = new Map<number, { name: string; quantity: number; value: number }>();
    dispensed.forEach((entry) => {
      const current = drugDispenseMap.get(entry.drugId) || {
        name: `Drug ${entry.drugId}`,
        quantity: 0,
        value: 0,
      };
      current.quantity += Math.abs(entry.quantity);
      current.value += Math.abs(entry.totalValue || 0);
      drugDispenseMap.set(entry.drugId, current);
    });

    const topDrugs = Array.from(drugDispenseMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Transaction type distribution
    const typeMap = new Map<string, number>();
    ledgerEntries.forEach((entry) => {
      typeMap.set(entry.transactionType, (typeMap.get(entry.transactionType) || 0) + 1);
    });

    const distributionData = Array.from(typeMap.entries()).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }));

    return {
      totalDispensedValue,
      totalReceivedValue,
      totalDispensedQty,
      totalReceivedQty,
      timelineData,
      topDrugs,
      distributionData,
    };
  }, [ledgerEntries]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Dispensed"
          value={`${Math.round(analytics.totalDispensedValue).toLocaleString()} SSP`}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          colorClass="border-red-200 dark:border-red-800/50 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 text-red-700 dark:text-red-400"
        />
        <MetricCard
          title="Total Received"
          value={`${Math.round(analytics.totalReceivedValue).toLocaleString()} SSP`}
          icon={<Package className="w-6 h-6 text-white" />}
          colorClass="border-green-200 dark:border-green-800/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 text-green-700 dark:text-green-400"
        />
        <MetricCard
          title="Items Dispensed"
          value={analytics.totalDispensedQty.toLocaleString()}
          icon={<TrendingDown className="w-6 h-6 text-white" />}
          colorClass="border-orange-200 dark:border-orange-800/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 text-orange-700 dark:text-orange-400"
        />
        <MetricCard
          title="Items Received"
          value={analytics.totalReceivedQty.toLocaleString()}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          colorClass="border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 text-blue-700 dark:text-blue-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Timeline */}
        <Card className="shadow-premium-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Transaction Timeline (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="dispensed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Dispensed (SSP)"
                />
                <Line
                  type="monotone"
                  dataKey="received"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Received (SSP)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Distribution */}
        <Card className="shadow-premium-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Transaction Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Most Dispensed Drugs */}
      <Card className="shadow-premium-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Top 10 Most Dispensed Drugs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.topDrugs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#3b82f6" name="Quantity" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
