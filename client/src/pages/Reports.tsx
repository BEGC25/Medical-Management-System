import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  BarChart3, 
  Users, 
  Stethoscope, 
  TestTube, 
  Scan,
  TrendingUp,
  Calendar,
  Download,
  Activity,
  Filter,
  X,
  Mail,
  Clock,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getClinicDayKey } from "@/lib/date-utils";
import { PremiumStatCard } from "@/components/reports/PremiumStatCard";
import { VisitsTrendChart } from "@/components/reports/VisitsTrendChart";
import { TestsBarChart } from "@/components/reports/TestsBarChart";
import { DiagnosisBarChart } from "@/components/reports/DiagnosisBarChart";
import { InsightsCard } from "@/components/reports/InsightsCard";
import { ComparisonToggle } from "@/components/reports/ComparisonToggle";
import { LoadingSkeleton } from "@/components/reports/LoadingSkeleton";
import { PendingBacklog } from "@/components/reports/PendingBacklog";

interface ReportFilters {
  reportType: string;
  fromDate: string;
  toDate: string;
}

interface ApiInsight {
  icon: string;
  text: string;
  type: 'positive' | 'warning' | 'info';
}

interface UnifiedDashboardData {
  summary: {
    totalPatients: number;
    newPatients: number;
    totalVisits: number;
    labTests: number;
    xrays: number;
    ultrasounds: number;
    pending: {
      labResults: number;
      xrayReports: number;
      ultrasoundReports: number;
    };
    previousPeriod?: {
      totalPatients: number;
      newPatients: number;
      totalVisits: number;
      labTests: number;
      xrays: number;
      ultrasounds: number;
    } | null;
  };
  trends: Array<{ date: string; visits: number }>;
  testsByType: {
    labTests: number;
    xrays: number;
    ultrasounds: number;
  };
  diagnoses: Array<{ diagnosis: string; count: number }>;
  pendingBacklog: {
    total: number;
    labResults: number;
    xrayReports: number;
    ultrasoundReports: number;
  };
  insights: ApiInsight[];
  metadata: {
    fromDate: string;
    toDate: string;
    generatedAt: string;
    hasData: boolean;
  };
}

interface PatientData {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string | null;
  status?: string;
  createdAt?: string;
}

// Helper function to format time ago
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'Unknown';
  
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}

export default function Reports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>("today");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: "daily",
    fromDate: getClinicDayKey(),
    toDate: getClinicDayKey(),
  });

  // Unified dashboard data query - single source of truth
  const { data: dashboardData, isLoading } = useQuery<UnifiedDashboardData>({
    queryKey: ["/api/reports/dashboard", filters.fromDate, filters.toDate, comparisonMode],
    queryFn: async () => {
      const params = new URLSearchParams({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        compareWithPrevious: comparisonMode ? 'true' : 'false'
      });
      const response = await fetch(`/api/reports/dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
  });

  const { data: recentPatients } = useQuery<PatientData[]>({
    queryKey: ["/api/dashboard/recent-patients", 10],
  });

  // Extract data from unified response
  const stats = dashboardData?.summary;
  const trendsData = dashboardData?.trends || [];
  const diagnosisData = dashboardData?.diagnoses || [];
  const pendingBacklog = dashboardData?.pendingBacklog;
  const insights = dashboardData?.insights || [];
  const totalPatients = stats?.totalPatients || 0;

  // Calculate trend percentages for comparison mode
  const calculateTrend = (current: number, previous: number | undefined): { value: number; isPositive: boolean; } | undefined => {
    if (!comparisonMode || previous === undefined) return undefined;
    
    // Handle zero previous value - show as 100% increase if current > 0
    // This represents "new activity" rather than infinity
    if (previous === 0) {
      return current > 0 ? { value: 100, isPositive: true } : undefined;
    }
    
    const percentChange = Math.round(((current - previous) / previous) * 100);
    return {
      value: percentChange,
      isPositive: percentChange >= 0,
    };
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Clear active quick filter when manually changing dates
    if (key === 'fromDate' || key === 'toDate') {
      setActiveQuickFilter(null);
    }
  };

  const setQuickFilter = (preset: string) => {
    const today = new Date();
    let fromDate = getClinicDayKey();
    let toDate = getClinicDayKey();

    switch (preset) {
      case "today":
        // Already set
        break;
      case "this-week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        fromDate = weekStart.toISOString().split('T')[0];
        break;
      case "this-month":
        fromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      case "last-30-days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        fromDate = thirtyDaysAgo.toISOString().split('T')[0];
        break;
    }

    setFilters(prev => ({ ...prev, fromDate, toDate }));
    setActiveQuickFilter(preset);
  };

  const generateReport = async () => {
    console.log("Generating report with filters:", filters);
    setIsGenerating(true);
    
    try {
      // Refresh unified dashboard query to get latest data
      await queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard"] });
      await queryClient.refetchQueries({ queryKey: ["/api/reports/dashboard"] });
      
      setLastGenerated(new Date().toLocaleString());
      setLastUpdated(new Date());
      toast({
        title: "Report Generated",
        description: `${filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)} report updated successfully for ${filters.fromDate} to ${filters.toDate}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setLastUpdated(new Date());
      toast({
        title: "Refreshed",
        description: "Dashboard data has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportToExcel = () => {
    console.log("Exporting to Excel...");
    
    if (!stats || !recentPatients) {
      alert("No data available to export");
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Bahr El Ghazal Clinic - Report'],
      [`Report Type: ${filters.reportType}`],
      [`Date Range: ${filters.fromDate} to ${filters.toDate}`],
      [''],
      ['Summary Statistics'],
      ['Metric', 'Count'],
      ['Total Patients', stats.totalPatients || stats.newPatients || 0],
      ['Total Visits', stats.totalVisits || 0],
      ['Lab Tests', stats.labTests || 0],
      ['X-rays', stats.xrays || 0],
      ['Ultrasounds', stats.ultrasounds || 0],
      ['Pending Lab Results', stats.pending?.labResults || 0],
      ['Pending X-ray Reports', stats.pending?.xrayReports || 0],
      ['Pending Ultrasound Reports', stats.pending?.ultrasoundReports || 0],
      [''],
      ['Recent Patients'],
      ['Patient ID', 'Name', 'Date of Birth', 'Gender', 'Status']
    ];

    // Add patient data
    if (Array.isArray(recentPatients)) {
      recentPatients.forEach(patient => {
        csvContent.push([
          patient.patientId || '',
          `${patient.firstName || ''} ${patient.lastName || ''}`,
          patient.dateOfBirth || '',
          patient.gender || '',
          patient.status || 'New'
        ]);
      });
    }

    // Convert to CSV string
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clinic-report-${filters.fromDate}-${filters.toDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    console.log("Exporting to PDF...");
    
    if (!stats) {
      alert("No data available to export");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinic Report - ${filters.fromDate} to ${filters.toDate}</title>
          <meta charset="utf-8">
          <style>
            @media print { body { margin: 0; } }
            .report-container {
              width: 210mm;
              max-height: 297mm;
              padding: 20mm;
              box-sizing: border-box;
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
            }
            .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .clinic-subtitle { font-size: 14px; color: #666; }
            .report-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
            .info-section { margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .stat-item { background: #f9fafb; padding: 10px; border-radius: 5px; border-left: 4px solid #1e40af; }
            .stat-label { font-size: 12px; color: #666; font-weight: bold; }
            .stat-value { font-size: 18px; font-weight: bold; color: #1e40af; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div class="clinic-name">Bahr El Ghazal Clinic</div>
              <div class="clinic-subtitle">Medical Management System Report</div>
            </div>
            
            <div class="info-section">
              <div><strong>Report Type:</strong> ${filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)} Summary</div>
              <div><strong>Date Range:</strong> ${filters.fromDate} to ${filters.toDate}</div>
              <div><strong>Generated:</strong> ${currentDate}</div>
            </div>

            <div class="report-title">Summary Statistics</div>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total Patients</div>
                <div class="stat-value">${stats.totalPatients || stats.newPatients || 0}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Total Visits</div>
                <div class="stat-value">${stats.totalVisits || 0}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Lab Tests</div>
                <div class="stat-value">${stats.labTests || 0}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">X-rays</div>
                <div class="stat-value">${stats.xrays || 0}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Ultrasounds</div>
                <div class="stat-value">${stats.ultrasounds || 0}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Pending Results</div>
                <div class="stat-value">${(stats.pending?.labResults || 0) + (stats.pending?.xrayReports || 0) + (stats.pending?.ultrasoundReports || 0)}</div>
              </div>
            </div>

            <div class="footer">
              <p>Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handlePrint = () => {
    window.print();
  };

  const getColorForPercentage = (percentage: number) => {
    if (percentage >= 50) return "bg-medical-blue";
    if (percentage >= 30) return "bg-health-green";
    if (percentage >= 20) return "bg-attention-orange";
    return "bg-purple-500";
  };

  return (
    <div className="space-y-6">
      {isLoading && <LoadingSkeleton />}
      
      {!isLoading && (
        <>
          {/* Header Card with Filters */}
          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <span className="text-2xl">Reports & Analytics</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                    Premium Dashboard
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {formatTimeAgo(lastUpdated.toISOString())}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Quick Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={activeQuickFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter("today")}
                  className={activeQuickFilter === "today" ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" : "hover:bg-blue-50 dark:hover:bg-blue-900/20"}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Today
                </Button>
                <Button
                  variant={activeQuickFilter === "this-week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter("this-week")}
                  className={activeQuickFilter === "this-week" ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" : "hover:bg-blue-50 dark:hover:bg-blue-900/20"}
                >
                  This Week
                </Button>
                <Button
                  variant={activeQuickFilter === "this-month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter("this-month")}
                  className={activeQuickFilter === "this-month" ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" : "hover:bg-blue-50 dark:hover:bg-blue-900/20"}
                >
                  This Month
                </Button>
                <Button
                  variant={activeQuickFilter === "last-30-days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter("last-30-days")}
                  className={activeQuickFilter === "last-30-days" ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" : "hover:bg-blue-50 dark:hover:bg-blue-900/20"}
                >
                  Last 30 Days
                </Button>
              </div>

              {/* Detailed Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Type
                  </label>
                  <Select 
                    value={filters.reportType} 
                    onValueChange={(value) => handleFilterChange("reportType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Date
                  </label>
                  <Input 
                    type="date" 
                    value={filters.fromDate}
                    onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Date
                  </label>
                  <Input 
                    type="date" 
                    value={filters.toDate}
                    onChange={(e) => handleFilterChange("toDate", e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 w-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {isGenerating ? "Generating..." : "Update Report"}
                  </Button>
                </div>
              </div>
              
              {lastGenerated && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Last updated: {lastGenerated}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Toggle */}
          <ComparisonToggle 
            enabled={comparisonMode}
            onToggle={setComparisonMode}
          />

          {/* Premium Stat Cards */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0 }}
            >
              <PremiumStatCard
                title="Total Patients"
                value={totalPatients}
                subtitle="Registered in system"
                icon={Users}
                gradient="from-blue-600 via-blue-500 to-cyan-400"
                trend={calculateTrend(totalPatients, stats?.previousPeriod?.totalPatients)}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <PremiumStatCard
                title="Total Visits"
                value={stats?.totalVisits || 0}
                subtitle="In selected period"
                icon={Stethoscope}
                gradient="from-green-600 via-green-500 to-emerald-400"
                trend={calculateTrend(stats?.totalVisits || 0, stats?.previousPeriod?.totalVisits)}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <PremiumStatCard
                title="Lab Tests"
                value={stats?.labTests || 0}
                subtitle="Tests ordered"
                icon={TestTube}
                gradient="from-orange-600 via-orange-500 to-amber-400"
                trend={calculateTrend(stats?.labTests || 0, stats?.previousPeriod?.labTests)}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <PremiumStatCard
                title="X-Ray Exams"
                value={stats?.xrays || 0}
                subtitle="Exams performed"
                icon={Scan}
                gradient="from-purple-600 via-purple-500 to-pink-400"
                trend={calculateTrend(stats?.xrays || 0, stats?.previousPeriod?.xrays)}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <PremiumStatCard
                title="Ultrasounds"
                value={stats?.ultrasounds || 0}
                subtitle="Scans performed"
                icon={Activity}
                gradient="from-teal-600 via-teal-500 to-cyan-400"
                trend={calculateTrend(stats?.ultrasounds || 0, stats?.previousPeriod?.ultrasounds)}
              />
            </motion.div>
          </motion.div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisitsTrendChart data={trendsData} isLoading={isLoading} />
            <TestsBarChart 
              labTests={stats?.labTests}
              xrays={stats?.xrays}
              ultrasounds={stats?.ultrasounds}
              isLoading={isLoading}
            />
            <PendingBacklog 
              data={pendingBacklog}
              isLoading={isLoading}
            />
            <DiagnosisBarChart 
              data={diagnosisData}
              isLoading={isLoading}
            />
          </div>

          {/* AI Insights */}
          <InsightsCard 
            insights={insights} 
            isLoading={isLoading}
          />

          {/* Detailed Reports - Keep existing structure with enhanced styling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Recent Activity (Overall)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentPatients?.slice(0, 5).map((patient: any) => (
                    <div 
                      key={patient.id}
                      className="flex items-center justify-between p-3 rounded-lg 
                                 border border-gray-100 dark:border-gray-700
                                 hover:bg-gray-50 dark:hover:bg-gray-800/50
                                 transition-all duration-200
                                 cursor-pointer
                                 group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar with initials */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 
                                        flex items-center justify-center text-white font-semibold text-sm
                                        group-hover:scale-110 transition-transform shadow-md">
                          {patient.firstName?.[0]}{patient.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {patient.patientId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={patient.status === "Treated" ? "default" : "secondary"}>
                          {patient.status || "New"}
                        </Badge>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTimeAgo(patient.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {!recentPatients?.length && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Performance */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Period Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">Selected Period</span>
                    </div>
                    <Badge className="bg-blue-600 text-white shadow-md">Active</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-xl dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 hover:shadow-lg transition-all duration-200">
                      <div className="flex justify-center mb-2">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        <CountUp 
                          end={stats?.newPatients || 0}
                          duration={2}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">New Patients</p>
                    </div>
                    <div className="text-center p-4 border rounded-xl dark:border-gray-700 bg-green-50 dark:bg-green-900/20 hover:shadow-lg transition-all duration-200">
                      <div className="flex justify-center mb-2">
                        <Stethoscope className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                        <CountUp 
                          end={stats?.totalVisits || 0}
                          duration={2}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Visits</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-xl dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20 hover:shadow-lg transition-all duration-200">
                      <div className="flex justify-center mb-2">
                        <TestTube className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                        <CountUp 
                          end={stats?.labTests || 0}
                          duration={2}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Lab Tests</p>
                    </div>
                    <div className="text-center p-4 border rounded-xl dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20 hover:shadow-lg transition-all duration-200">
                      <div className="flex justify-center mb-2">
                        <Scan className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        <CountUp 
                          end={stats?.xrays || 0}
                          duration={2}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">X-Rays</p>
                    </div>
                    <div className="text-center p-4 border rounded-xl dark:border-gray-700 bg-cyan-50 dark:bg-cyan-900/20 hover:shadow-lg transition-all duration-200">
                      <div className="flex justify-center mb-2">
                        <Activity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                        <CountUp 
                          end={stats?.ultrasounds ?? 0}
                          duration={2}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ultrasounds</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={exportToExcel}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export to Excel
                </Button>
                <Button 
                  onClick={exportToPDF}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export to PDF
                </Button>
                <Button 
                  onClick={handlePrint}
                  variant="outline"
                  className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Report
                </Button>
                <Button 
                  variant="outline"
                  className="gap-2 transition-all duration-200 hover:scale-105"
                >
                  <Mail className="w-4 h-4" />
                  Email Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
