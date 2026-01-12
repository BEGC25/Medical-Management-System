import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface GenderDistributionProps {
  data?: {
    distribution: Array<{ gender: string; count: number; percentage: number }>;
    total: number;
    ratio: string;
  };
  isLoading?: boolean;
}

export function GenderDistribution({ data, isLoading }: GenderDistributionProps) {
  const distribution = data?.distribution || [];
  const total = data?.total || 0;
  const ratio = data?.ratio || 'No data';
  
  const hasData = distribution.length > 0 && total > 0;

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-premium transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Gender Distribution
        </CardTitle>
        <CardDescription>Of active patients in selected period</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        ) : !hasData ? (
          <div className="py-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600 opacity-50" />
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              No patient data
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No patients visited in this period
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {distribution.map((item) => (
              <div key={item.gender}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.gender === 'Male' ? 'bg-blue-500' : 
                      item.gender === 'Female' ? 'bg-pink-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.gender}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.gender === 'Male' ? 'bg-blue-500' : 
                      item.gender === 'Female' ? 'bg-pink-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${item.percentage}%` }} 
                  />
                </div>
              </div>
            ))}

            {/* Gender Ratio */}
            <div className="pt-4 border-t dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gender ratio: <span className="font-semibold text-gray-900 dark:text-gray-100">{ratio}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Total: {total} patient{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
