import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Clock, AlertTriangle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Insight {
  type: "trend" | "peak" | "anomaly" | "recommendation";
  title: string;
  description: string;
  severity?: "info" | "warning" | "success";
}

interface InsightsCardProps {
  insights?: Insight[];
  isLoading?: boolean;
}

const defaultInsights: Insight[] = [
  {
    type: "trend",
    title: "Visits trending upward",
    description: "Patient visits increased by 15% compared to last week",
    severity: "success",
  },
  {
    type: "peak",
    title: "Peak hours identified",
    description: "Busiest time is 10-11 AM with average of 12 patients",
    severity: "info",
  },
  {
    type: "recommendation",
    title: "Inventory suggestion",
    description: "Consider restocking lab supplies based on current usage trends",
    severity: "info",
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case "trend":
      return TrendingUp;
    case "peak":
      return Clock;
    case "anomaly":
      return AlertTriangle;
    case "recommendation":
      return Lightbulb;
    default:
      return Sparkles;
  }
};

const getBadgeVariant = (severity?: string) => {
  switch (severity) {
    case "success":
      return "default";
    case "warning":
      return "destructive";
    default:
      return "secondary";
  }
};

export function InsightsCard({ insights = defaultInsights, isLoading }: InsightsCardProps) {
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
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const IconComponent = getIcon(insight.type);
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 transition-all duration-200 hover:bg-white/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        {insight.severity && (
                          <Badge
                            variant={getBadgeVariant(insight.severity)}
                            className="text-xs"
                          >
                            {insight.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm opacity-90">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
