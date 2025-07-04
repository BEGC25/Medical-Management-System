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
  Clock
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
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`${action.color} bg-opacity-10 p-3 rounded-lg`}>
                      <Icon className={`text-xl w-6 h-6`} style={{ color: `var(--${action.color.replace('bg-', '')}` }} />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{action.title}</h3>
                      <p className="text-gray-600 text-sm dark:text-gray-400">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">New Patients</span>
                  <span className="font-semibold text-medical-blue">{stats.newPatients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Visits</span>
                  <span className="font-semibold text-health-green">{stats.totalVisits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Lab Tests</span>
                  <span className="font-semibold text-attention-orange">{stats.labTests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">X-Rays</span>
                  <span className="font-semibold text-purple-600">{stats.xrays}</span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPatients ? (
                recentPatients.map((patient: any) => (
                  <div key={patient.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ID: {patient.patientId}</p>
                    </div>
                    {getStatusBadge(patient.status)}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats ? (
                <>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <TestTube className="text-attention-orange mr-3 w-4 h-4" />
                      <span className="text-gray-700 dark:text-gray-300">Lab Results</span>
                    </div>
                    <Badge className="bg-attention-orange text-white">
                      {stats.pending.labResults}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Scan className="text-purple-600 mr-3 w-4 h-4" />
                      <span className="text-gray-700 dark:text-gray-300">X-Ray Reports</span>
                    </div>
                    <Badge className="bg-purple-600 text-white">
                      {stats.pending.xrayReports}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <FileText className="text-health-green mr-3 w-4 h-4" />
                      <span className="text-gray-700 dark:text-gray-300">Prescriptions</span>
                    </div>
                    <Badge className="bg-health-green text-white">
                      {stats.pending.prescriptions}
                    </Badge>
                  </div>
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
