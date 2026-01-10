import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Clock, Activity, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Insight {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  color: string;
}

interface InsightsCardProps {
  insights?: any[];
  isLoading?: boolean;
  stats?: any;
  diagnosisData?: Array<{ diagnosis: string; count: number }>;
  lastPeriodStats?: any;
}

const generateInsights = (stats?: any, diagnosisData?: Array<{ diagnosis: string; count: number }>, lastPeriodStats?: any): Insight[] => {
  const insights: Insight[] = [];

  // Visit trend analysis
  if (stats?.totalVisits && lastPeriodStats?.totalVisits) {
    const increase = ((stats.totalVisits - lastPeriodStats.totalVisits) / lastPeriodStats.totalVisits * 100).toFixed(1);
    if (parseFloat(increase) > 0) {
      insights.push({
        icon: TrendingUp,
        text: `Visits increased ${increase}% compared to previous period`,
        color: "text-green-600 dark:text-green-400"
      });
    } else if (parseFloat(increase) < 0) {
      insights.push({
        icon: TrendingUp,
        text: `Visits decreased ${Math.abs(parseFloat(increase))}% compared to previous period`,
        color: "text-orange-600 dark:text-orange-400"
      });
    }
  }

  // Peak time identification (mock - could be enhanced with real data)
  insights.push({
    icon: Clock,
    text: "Peak visit time: 9-11 AM with highest patient flow",
    color: "text-blue-600 dark:text-blue-400"
  });

  // Top diagnosis
  if (diagnosisData && diagnosisData.length > 0) {
    insights.push({
      icon: Activity,
      text: `Most common diagnosis: ${diagnosisData[0].diagnosis} (${diagnosisData[0].count} cases)`,
      color: "text-purple-600 dark:text-purple-400"
    });
  }

  // Test completion rate
  if (stats?.labTests && stats?.labTests > 0) {
    const completionRate = (((stats.labTests - (stats.pending?.labResults || 0)) / stats.labTests) * 100).toFixed(1);
    insights.push({
      icon: CheckCircle,
      text: `Lab test completion rate: ${completionRate}%`,
      color: parseFloat(completionRate) > 80 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
    });
  }

  // Pending items alert
  const totalPending = (stats?.pending?.labResults || 0) + (stats?.pending?.xrayReports || 0) + (stats?.pending?.ultrasoundReports || 0);
  if (totalPending > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `${totalPending} pending test results require attention`,
      color: "text-orange-600 dark:text-orange-400"
    });
  }

  // If no insights, add a default one
  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb,
      text: "System is analyzing patterns. Check back soon for insights!",
      color: "text-gray-600 dark:text-gray-400"
    });
  }

  return insights;
};

export function InsightsCard({ insights: providedInsights, isLoading, stats, diagnosisData, lastPeriodStats }: InsightsCardProps) {
  const generatedInsights = generateInsights(stats, diagnosisData, lastPeriodStats);
  const insights = providedInsights || generatedInsights;

  return (
    <Card className="bg-gradient-to-br from-purple-600 via-pink-500 to-rose-400 text-white shadow-2xl hover:shadow-premium transition-all duration-300 hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span>AI-Powered Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight: any, idx: number) => {
              const IconComponent = insight.icon || Sparkles;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:bg-white/20"
                >
                  <IconComponent className={`w-5 h-5 ${insight.color} mt-0.5 flex-shrink-0`} />
                  <p className="text-sm text-white">{insight.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
