import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

export default function Reports() {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: "daily",
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentPatients } = useQuery({
    queryKey: ["/api/dashboard/recent-patients", 10],
  });

  // Mock data for common diagnoses and age distribution
  const commonDiagnoses = [
    { name: "Malaria", cases: 234, percentage: 60 },
    { name: "Respiratory Infections", cases: 189, percentage: 48 },
    { name: "Hypertension", cases: 156, percentage: 40 },
    { name: "Diabetes", cases: 98, percentage: 25 },
    { name: "Tuberculosis", cases: 67, percentage: 17 },
  ];

  const ageDistribution = [
    { range: "0-5 years", percentage: 18 },
    { range: "6-17 years", percentage: 22 },
    { range: "18-64 years", percentage: 45 },
    { range: "65+ years", percentage: 15 },
  ];

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = () => {
    // Logic to generate report based on filters
    console.log("Generating report with filters:", filters);
  };

  const exportToExcel = () => {
    // Logic to export data to Excel
    console.log("Exporting to Excel...");
  };

  const exportToPDF = () => {
    // Logic to export data to PDF
    console.log("Exporting to PDF...");
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
                  className="bg-medical-blue hover:bg-blue-700 w-full"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Patients</p>
                <p className="text-3xl font-bold">1,247</p>
                <p className="text-blue-100 text-sm flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
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
                <p className="text-green-100 text-sm flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% from last month
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
                <p className="text-orange-100 text-sm flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15% from last month
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
                <p className="text-purple-100 text-sm flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3% from last month
                </p>
              </div>
              <Scan className="text-purple-200 text-3xl w-8 h-8" />
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
              {commonDiagnoses.map((diagnosis, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">{diagnosis.name}</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {diagnosis.cases} cases
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`${getColorForPercentage(diagnosis.percentage)} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${diagnosis.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
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
              {ageDistribution.map((group, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">{group.range}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {group.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`${getColorForPercentage(group.percentage)} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
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
