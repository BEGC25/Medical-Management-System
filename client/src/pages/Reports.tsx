import { useState } from "react";
import { getClinicDayKey } from '@/lib/date-utils';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ReportFilters {
  reportType: string;
  fromDate: string;
  toDate: string;
}

interface DashboardStats {
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
}

interface PatientData {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string | null;
  status?: string;
}

export default function Reports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: "daily",
    fromDate: getClinicDayKey(),
    toDate: getClinicDayKey(),
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        fromDate: filters.fromDate,
        toDate: filters.toDate
      });
      const response = await fetch(`/api/dashboard/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: recentPatients } = useQuery<PatientData[]>({
    queryKey: ["/api/dashboard/recent-patients", 10],
  });

  // Fetch real diagnosis data from treatments
  const { data: diagnosisData = [] } = useQuery<{ diagnosis: string; count: number }[]>({
    queryKey: ["/api/reports/diagnoses", filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        fromDate: filters.fromDate,
        toDate: filters.toDate
      });
      const response = await fetch(`/api/reports/diagnoses?${params}`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch real patient age distribution
  const { data: ageDistributionData = [] } = useQuery<{ ageRange: string; count: number; percentage: number }[]>({
    queryKey: ["/api/reports/age-distribution"],
    queryFn: async () => {
      const response = await fetch('/api/reports/age-distribution');
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch total patient count
  const { data: totalPatients = 0 } = useQuery<number>({
    queryKey: ["/api/patients/count"],
    queryFn: async () => {
      const response = await fetch('/api/patients/count');
      if (!response.ok) return 0;
      const data = await response.json();
      return data.count || 0;
    },
  });

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = async () => {
    console.log("Generating report with filters:", filters);
    setIsGenerating(true);
    
    try {
      // Refresh queries to get latest data
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard/stats"] });
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard/recent-patients"] });
      
      setLastGenerated(new Date().toLocaleString());
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
      ['New Patients', stats.newPatients || 0],
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
                <div class="stat-label">New Patients</div>
                <div class="stat-value">${stats.newPatients || 0}</div>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Clinic Reports & Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Report Filters */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-gray-800 mb-4 dark:text-gray-200">Report Filters</h3>
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
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="bg-medical-blue hover:bg-blue-700 w-full"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
            {lastGenerated && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Last updated: {lastGenerated}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Patients</p>
                <p className="text-3xl font-bold">{totalPatients}</p>
                <p className="text-blue-100 text-sm">
                  Registered in system
                </p>
              </div>
              <Users className="text-blue-200 text-3xl w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Visits</p>
                <p className="text-3xl font-bold">{stats?.totalVisits || 0}</p>
                <p className="text-green-100 text-sm">
                  In selected period
                </p>
              </div>
              <Stethoscope className="text-green-200 text-3xl w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Lab Tests</p>
                <p className="text-3xl font-bold">{stats?.labTests || 0}</p>
                <p className="text-orange-100 text-sm">
                  Tests ordered
                </p>
              </div>
              <TestTube className="text-orange-200 text-3xl w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">X-Ray Exams</p>
                <p className="text-3xl font-bold">{stats?.xrays || 0}</p>
                <p className="text-purple-100 text-sm">
                  Exams performed
                </p>
              </div>
              <Scan className="text-purple-200 text-3xl w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Ultrasounds</p>
                <p className="text-3xl font-bold">{stats?.ultrasounds || 0}</p>
                <p className="text-teal-100 text-sm">
                  Scans performed
                </p>
              </div>
              <Stethoscope className="text-teal-200 text-3xl w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle>Common Diagnoses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnosisData.length > 0 ? (
                diagnosisData.slice(0, 5).map((diagnosis, index) => {
                  const maxCount = diagnosisData[0]?.count || 1;
                  const percentage = (diagnosis.count / maxCount) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">{diagnosis.diagnosis || 'Not specified'}</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {diagnosis.count} {diagnosis.count === 1 ? 'case' : 'cases'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`${getColorForPercentage(percentage)} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No diagnosis data available for selected period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ageDistributionData.length > 0 ? (
                ageDistributionData.map((group, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">{group.ageRange}</span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {group.percentage}% ({group.count} {group.count === 1 ? 'patient' : 'patients'})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${getColorForPercentage(group.percentage)} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${group.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No age distribution data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPatients?.slice(0, 5).map((patient: any) => (
                <div key={patient.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {patient.patientId}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={patient.status === "Treated" ? "default" : "secondary"}>
                      {patient.status}
                    </Badge>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {patient.lastVisit || "No visits"}
                    </p>
                  </div>
                </div>
              ))}
              
              {!recentPatients?.length && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-medical-blue mr-3" />
                  <span className="font-medium">This Month</span>
                </div>
                <Badge className="bg-medical-blue text-white">Active</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg dark:border-gray-700">
                  <p className="text-2xl font-bold text-medical-blue">
                    {stats?.newPatients || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">New Patients</p>
                </div>
                <div className="text-center p-3 border rounded-lg dark:border-gray-700">
                  <p className="text-2xl font-bold text-health-green">
                    {stats?.totalVisits || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Visits</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg dark:border-gray-700">
                  <p className="text-2xl font-bold text-attention-orange">
                    {stats?.pending?.labResults || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Labs</p>
                </div>
                <div className="text-center p-3 border rounded-lg dark:border-gray-700">
                  <p className="text-2xl font-bold text-purple-600">
                    {stats?.pending?.xrayReports || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending X-Rays</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={exportToExcel}
              className="bg-health-green hover:bg-green-700"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
            <Button 
              onClick={exportToPDF}
              className="bg-alert-red hover:bg-red-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export to PDF
            </Button>
            <Button 
              onClick={handlePrint}
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
