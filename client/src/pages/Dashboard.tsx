import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  UserPlus, 
  Search, 
  Stethoscope, 
  AlertTriangle, 
  TestTube, 
  Scan, 
  FileText,
  Users,
  BarChart3,
  Clock,
  MonitorSpeaker
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentPatients } = useQuery({
    queryKey: ["/api/dashboard/recent-patients"],
  });

  const quickActions = [
    {
      title: "Register Patient",
      description: "Add new patient",
      icon: UserPlus,
      href: "/patients",
      color: "bg-medical-blue",
    },
    {
      title: "Find Patient",
      description: "Search records",
      icon: Search,
      href: "/patients",
      color: "bg-health-green",
    },
    {
      title: "New Treatment",
      description: "Record visit",
      icon: Stethoscope,
      href: "/treatment",
      color: "bg-attention-orange",
    },
    {
      title: "Urgent Cases",
      description: "Priority patients",
      icon: AlertTriangle,
      href: "/reports",
      color: "bg-alert-red",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'treated':
        return <Badge className="bg-health-green text-white">Treated</Badge>;
      case 'waiting':
        return <Badge className="bg-attention-orange text-white">Waiting</Badge>;
      case 'urgent':
        return <Badge className="bg-alert-red text-white">Urgent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 px-2 sm:px-0">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href}>
              <Card className="shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`${action.color} bg-opacity-10 p-2.5 sm:p-3 rounded-lg transition-transform hover:scale-110 flex-shrink-0`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6`} style={{ color: `var(--${action.color.replace('bg-', '')}` }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200">{action.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm dark:text-gray-400">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Statistics */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Today's Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {stats ? (
              <>
                <Link href="/patients?filter=today">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 p-2.5 sm:p-3 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 min-h-[44px]">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">New Patients</span>
                    <span className="font-semibold text-base sm:text-lg text-medical-blue">{stats.newPatients}</span>
                  </div>
                </Link>
                <Link href="/treatment?filter=today">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 p-2.5 sm:p-3 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 min-h-[44px]">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Total Visits</span>
                    <span className="font-semibold text-base sm:text-lg text-health-green">{stats.totalVisits}</span>
                  </div>
                </Link>
                <Link href="/laboratory">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 p-2.5 sm:p-3 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 min-h-[44px]">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Lab Tests</span>
                    <span className="font-semibold text-base sm:text-lg text-attention-orange">{stats.labTests}</span>
                  </div>
                </Link>
                <Link href="/xray">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 p-2.5 sm:p-3 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 min-h-[44px]">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">X-Rays</span>
                    <span className="font-semibold text-base sm:text-lg text-purple-600">{stats.xrays}</span>
                  </div>
                </Link>
                <Link href="/ultrasound">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 p-2.5 sm:p-3 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 min-h-[44px]">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Ultrasounds</span>
                    <span className="font-semibold text-base sm:text-lg text-blue-600">{stats.ultrasounds}</span>
                  </div>
                </Link>
              </>
            ) : (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {recentPatients ? (
                recentPatients.map((patient: any) => (
                  <div key={patient.id} className="flex items-start sm:items-center justify-between py-2.5 sm:py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 min-h-[60px] sm:min-h-[56px]">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-200 break-words">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">ID: {patient.patientId}</p>
                        {patient.lastVisit && (
                          <>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-0.5 sm:mr-1" />
                              {new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(patient.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Pending Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {stats ? (
                <>
                  <Link href="/laboratory">
                    <div className={`flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 p-2.5 sm:p-3 rounded cursor-pointer transition-all active:bg-gray-100 dark:active:bg-gray-700 min-h-[52px] ${
                      stats.pending.labResults >= 10 ? 'bg-orange-50 dark:bg-orange-950 border border-attention-orange' : ''
                    }`}>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <TestTube className="text-attention-orange w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 truncate">Lab Results</span>
                      </div>
                      <Badge className={`bg-attention-orange text-white font-bold min-w-[2rem] sm:min-w-[2.5rem] justify-center text-sm flex-shrink-0 ${
                        stats.pending.labResults >= 10 ? 'ring-2 ring-attention-orange ring-offset-1 sm:ring-offset-2 scale-105 sm:scale-110' : ''
                      }`}>
                        {stats.pending.labResults}
                      </Badge>
                    </div>
                  </Link>
                  <Link href="/xray">
                    <div className={`flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 p-2.5 sm:p-3 rounded cursor-pointer transition-all active:bg-gray-100 dark:active:bg-gray-700 min-h-[52px] ${
                      stats.pending.xrayReports >= 10 ? 'bg-purple-50 dark:bg-purple-950 border border-purple-600' : ''
                    }`}>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <Scan className="text-purple-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 truncate">X-Ray Reports</span>
                      </div>
                      <Badge className={`bg-purple-600 text-white font-bold min-w-[2rem] sm:min-w-[2.5rem] justify-center text-sm flex-shrink-0 ${
                        stats.pending.xrayReports >= 10 ? 'ring-2 ring-purple-600 ring-offset-1 sm:ring-offset-2 scale-105 sm:scale-110' : ''
                      }`}>
                        {stats.pending.xrayReports}
                      </Badge>
                    </div>
                  </Link>
                  <Link href="/ultrasound">
                    <div className={`flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 p-2.5 sm:p-3 rounded cursor-pointer transition-all active:bg-gray-100 dark:active:bg-gray-700 min-h-[52px] ${
                      stats.pending.ultrasoundReports >= 10 ? 'bg-blue-50 dark:bg-blue-950 border border-blue-600' : ''
                    }`}>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <MonitorSpeaker className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 truncate">Ultrasound Reports</span>
                      </div>
                      <Badge className={`bg-blue-600 text-white font-bold min-w-[2rem] sm:min-w-[2.5rem] justify-center text-sm flex-shrink-0 ${
                        stats.pending.ultrasoundReports >= 10 ? 'ring-2 ring-blue-600 ring-offset-1 sm:ring-offset-2 scale-105 sm:scale-110' : ''
                      }`}>
                        {stats.pending.ultrasoundReports}
                      </Badge>
                    </div>
                  </Link>
                </>
              ) : (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <div className="h-4 w-4 bg-gray-200 rounded mr-3 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
