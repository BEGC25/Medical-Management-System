import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  TestTube,
  Users,
  Stethoscope,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Map icon names from API to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  TrendingDown,
  Activity,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  Users,
  Info,
  Clock,
  Lightbulb,
  Sparkles
};

// Threshold for identifying high lab test ratios
const HIGH_LAB_TEST_RATIO = 1.5;

interface Insight {
  icon: string | React.ComponentType<{ className?: string }>;
  text: string;
  color?: string;
  type: 'positive' | 'negative' | 'warning' | 'info';
}

interface InsightsCardProps {
  insights?: Insight[];
  isLoading?: boolean;
  stats?: any;
  diagnosisData?: Array<{ diagnosis: string; count: number }>;
  lastPeriodStats?: any;
}

const generateInsights = (stats?: any, diagnosisData?: Array<{ diagnosis: string; count: number }>, lastPeriodStats?: any): Insight[] => {
  const insights: Insight[] = [];

  if (!stats) return insights;

  // Visit trend analysis
  if (lastPeriodStats?.totalVisits && stats.totalVisits) {
    const increase = stats.totalVisits - lastPeriodStats.totalVisits;
    const percentChange = ((increase / lastPeriodStats.totalVisits) * 100).toFixed(1);
    
    if (increase > 0) {
      insights.push({
        icon: TrendingUp,
        text: `Visit volume increased by ${increase} visits (${percentChange}%) this period`,
        color: "text-green-600 dark:text-green-400",
        type: 'positive'
      });
    } else if (increase < 0) {
      insights.push({
        icon: TrendingDown,
        text: `Visit volume decreased by ${Math.abs(increase)} visits (${Math.abs(parseFloat(percentChange))}%) this period`,
        color: "text-orange-600 dark:text-orange-400",
        type: 'warning'
      });
    }
  }

  // Lab test ratio analysis
  if (stats.labTests > 0 && stats.totalVisits > 0) {
    const ratio = (stats.labTests / stats.totalVisits).toFixed(1);
    if (parseFloat(ratio) > HIGH_LAB_TEST_RATIO) {
      insights.push({
        icon: TestTube,
        text: `High lab test ratio: ${ratio} tests per visit indicates thorough diagnostics`,
        color: "text-blue-600 dark:text-blue-400",
        type: 'info'
      });
    }
  }

  // Pending alerts - prioritize by urgency
  const totalPending = (stats.pending?.labResults || 0) + (stats.pending?.xrayReports || 0) + (stats.pending?.ultrasoundReports || 0);
  
  if (stats.pending?.xrayReports > 2) {
    insights.push({
      icon: AlertTriangle,
      text: `${stats.pending.xrayReports} X-Ray reports pending review - requires attention`,
      color: "text-orange-600 dark:text-orange-400",
      type: 'warning'
    });
  } else if (totalPending > 5) {
    insights.push({
      icon: AlertTriangle,
      text: `${totalPending} diagnostic test results pending review`,
      color: "text-orange-600 dark:text-orange-400",
      type: 'warning'
    });
  }

  // Top diagnosis insight
  if (diagnosisData && diagnosisData.length > 0) {
    const topDiagnosis = diagnosisData[0];
    const totalDiagnoses = diagnosisData.reduce((sum, d) => sum + d.count, 0);
    const percent = totalDiagnoses > 0 ? Math.round((topDiagnosis.count / totalDiagnoses) * 100) : 0;
    
    insights.push({
      icon: Stethoscope,
      text: `${topDiagnosis.diagnosis} is most common diagnosis (${percent}% of cases)`,
      color: "text-purple-600 dark:text-purple-400",
      type: 'info'
    });
  }

  // Service utilization analysis
  const totalTests = (stats.labTests || 0) + (stats.xrays || 0) + (stats.ultrasounds || 0);
  if (totalTests > 0 && stats.totalVisits > 0) {
    const utilizationRate = ((totalTests / stats.totalVisits) * 100).toFixed(0);
    insights.push({
      icon: Activity,
      text: `${totalTests} diagnostic tests performed with ${utilizationRate}% service utilization rate`,
      color: "text-cyan-600 dark:text-cyan-400",
      type: 'info'
    });
  }

  // Patient volume insight
  if (stats.totalVisits > 0) {
    const avgTestsPerVisit = totalTests > 0 ? (totalTests / stats.totalVisits).toFixed(1) : '0';
    insights.push({
      icon: Users,
      text: `${stats.totalVisits} total visits with average ${avgTestsPerVisit} tests per patient`,
      color: "text-blue-600 dark:text-blue-400",
      type: 'info'
    });
  }

  // Test completion rate
  if (stats.labTests && stats.labTests > 0) {
    const completed = stats.labTests - (stats.pending?.labResults || 0);
    const completionRate = ((completed / stats.labTests) * 100).toFixed(0);
    
    if (parseFloat(completionRate) >= 90) {
      insights.push({
        icon: CheckCircle,
        text: `Excellent lab completion rate at ${completionRate}% - tests processed efficiently`,
        color: "text-green-600 dark:text-green-400",
        type: 'positive'
      });
    } else if (parseFloat(completionRate) < 70) {
      insights.push({
        icon: AlertTriangle,
        text: `Lab completion rate at ${completionRate}% - consider improving workflow`,
        color: "text-orange-600 dark:text-orange-400",
        type: 'warning'
      });
    }
  }

  // If we have too many insights, prioritize by type
  if (insights.length > 5) {
    const prioritized = [
      ...insights.filter(i => i.type === 'warning'),
      ...insights.filter(i => i.type === 'positive'),
      ...insights.filter(i => i.type === 'info'),
    ].slice(0, 5);
    return prioritized;
  }

  // If no insights, add a helpful message
  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb,
      text: "No significant insights for this period. Keep collecting data for trend analysis!",
      color: "text-gray-600 dark:text-gray-400",
      type: 'info'
    });
  }

  return insights;
};

export function InsightsCard({ insights: providedInsights, isLoading, stats, diagnosisData, lastPeriodStats }: InsightsCardProps) {
  // Use ONLY provided insights from API (server-side only, no client-side fallback)
  const insights = providedInsights || [];

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
            {insights.length === 0 ? (
              <div className="py-6 text-center">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-white/40" />
                <p className="text-white/80">No activity data for the selected period.</p>
              </div>
            ) : (
              insights.map((insight: Insight, idx: number) => {
                // Get icon component - handle both string names and direct components
                const IconComponent = typeof insight.icon === 'string' 
                  ? (iconMap[insight.icon] || Sparkles)
                  : (insight.icon || Sparkles);
                
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-200 hover:bg-white/20"
                  >
                    <IconComponent className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white leading-relaxed">{insight.text}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
