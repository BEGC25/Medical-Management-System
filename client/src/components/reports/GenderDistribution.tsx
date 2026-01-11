import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface GenderDistributionProps {
  data?: {
    male: number;
    female: number;
    total: number;
  };
  isLoading?: boolean;
}

export function GenderDistribution({ data, isLoading }: GenderDistributionProps) {
  const maleCount = data?.male || 0;
  const femaleCount = data?.female || 0;
  const total = data?.total || 0;
  
  const malePercent = total > 0 ? Math.round((maleCount / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 0;
  
  // Calculate gender ratio - always show as larger:smaller for clarity
  let genderRatio: string;
  if (maleCount === 0 && femaleCount === 0) {
    genderRatio = "No data";
  } else if (maleCount === 0) {
    genderRatio = "All Female";
  } else if (femaleCount === 0) {
    genderRatio = "All Male";
  } else if (maleCount >= femaleCount) {
    genderRatio = `${(maleCount / femaleCount).toFixed(1)}:1 M:F`;
  } else {
    genderRatio = `1:${(femaleCount / maleCount).toFixed(1)} M:F`;
  }

  const hasData = total > 0;

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
            {/* Male */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Male</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {maleCount} ({malePercent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${malePercent}%` }} 
                />
              </div>
            </div>
            
            {/* Female */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Female</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {femaleCount} ({femalePercent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-pink-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${femalePercent}%` }} 
                />
              </div>
            </div>

            {/* Gender Ratio */}
            <div className="pt-4 border-t dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gender ratio: <span className="font-semibold text-gray-900 dark:text-gray-100">{genderRatio}</span>
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
