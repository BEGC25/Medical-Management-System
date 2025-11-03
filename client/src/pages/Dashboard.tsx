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
  MonitorSpeaker,
  Activity,
  DollarSign,
  Pill,
  ArrowRight,
  CalendarClock,
  UserCheck,
  FlaskConical,
  RadioTower,
  Package,
  CheckCircle2
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

  const { data: patientFlow } = useQuery({
    queryKey: ["/api/dashboard/patient-flow"],
  });

  const { data: outstandingPayments } = useQuery({
    queryKey: ["/api/dashboard/outstanding-payments"],
  });

  const { data: pharmacyAlerts } = useQuery({
    queryKey: ["/api/dashboard/pharmacy-alerts"],
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
              <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.03] hover:-translate-y-1.5 active:scale-[0.98] border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`${action.color} bg-opacity-15 p-3 sm:p-3.5 rounded-xl transition-all hover:scale-110 hover:rotate-3 flex-shrink-0 shadow-md`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6`} style={{ color: `var(--${action.color.replace('bg-', '')}` }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{action.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm dark:text-gray-400 font-medium">{action.description}</p>
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
        <Card className="md:col-span-1 shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
          <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Today's Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats ? (
              <>
                <Link href="/patients?filter=today">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 h-12">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">New Patients</span>
                    <span className="font-bold text-base sm:text-lg text-medical-blue tabular-nums text-right min-w-[3rem]">{stats.newPatients}</span>
                  </div>
                </Link>
                <Link href="/treatment?filter=today">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 h-12">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Total Visits</span>
                    <span className="font-bold text-base sm:text-lg text-health-green tabular-nums text-right min-w-[3rem]">{stats.totalVisits}</span>
                  </div>
                </Link>
                <Link href="/laboratory">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 h-12">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Lab Tests</span>
                    <span className="font-bold text-base sm:text-lg text-attention-orange tabular-nums text-right min-w-[3rem]">{stats.labTests}</span>
                  </div>
                </Link>
                <Link href="/xray">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 h-12">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">X-Rays</span>
                    <span className="font-bold text-base sm:text-lg text-purple-600 tabular-nums text-right min-w-[3rem]">{stats.xrays}</span>
                  </div>
                </Link>
                <Link href="/ultrasound">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 h-12">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Ultrasounds</span>
                    <span className="font-bold text-base sm:text-lg text-blue-600 tabular-nums text-right min-w-[3rem]">{stats.ultrasounds}</span>
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
        <Card className="md:col-span-1 shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
          <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Recent Patients</CardTitle>
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
        <Card className="md:col-span-2 lg:col-span-1 shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
          <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Pending Items</CardTitle>
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
                      <Badge className={`bg-attention-orange text-white font-bold min-w-[2rem] sm:min-w-[2.5rem] justify-center text-sm flex-shrink-0 shadow-lg ${
                        stats.pending.labResults >= 10 ? 'ring-2 ring-attention-orange ring-offset-1 sm:ring-offset-2 scale-105 sm:scale-110 shadow-xl' : ''
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
                      <Badge className={`bg-purple-600 text-white font-bold min-w-[2rem] sm:min-w-[2.5rem] justify-center text-sm flex-shrink-0 shadow-lg ${
                        stats.pending.xrayReports >= 10 ? 'ring-2 ring-purple-600 ring-offset-1 sm:ring-offset-2 scale-105 sm:scale-110 shadow-xl' : ''
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
                      <Badge className={`bg-blue-600 text-white font-bold min-w-[2rem] sm:min-w-[2.5rem] justify-center text-sm flex-shrink-0 shadow-lg ${
                        stats.pending.ultrasoundReports >= 10 ? 'ring-2 ring-blue-600 ring-offset-1 sm:ring-offset-2 scale-105 sm:scale-110 shadow-xl' : ''
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

      {/* New Dashboard Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        
        {/* Patient Flow & Queue Widget */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
          <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 border-b">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-medical-blue" />
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Patient Flow
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {patientFlow ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800" data-testid="flow-waiting-doctor">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for Doctor</span>
                  </div>
                  <Badge className="bg-amber-600 text-white font-bold">{patientFlow.waitingForDoctor}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800" data-testid="flow-in-treatment">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-medical-blue" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">In Treatment</span>
                  </div>
                  <Badge className="bg-medical-blue text-white font-bold">{patientFlow.inTreatment}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800" data-testid="flow-waiting-lab">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-attention-orange" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for Lab</span>
                  </div>
                  <Badge className="bg-attention-orange text-white font-bold">{patientFlow.waitingForLab}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800" data-testid="flow-waiting-xray">
                  <div className="flex items-center gap-2">
                    <RadioTower className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for X-ray</span>
                  </div>
                  <Badge className="bg-purple-600 text-white font-bold">{patientFlow.waitingForXray}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800" data-testid="flow-waiting-ultrasound">
                  <div className="flex items-center gap-2">
                    <MonitorSpeaker className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for Ultrasound</span>
                  </div>
                  <Badge className="bg-blue-600 text-white font-bold">{patientFlow.waitingForUltrasound}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800" data-testid="flow-waiting-pharmacy">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-health-green" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for Pharmacy</span>
                  </div>
                  <Badge className="bg-health-green text-white font-bold">{patientFlow.waitingForPharmacy}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 border-t mt-2 pt-3" data-testid="flow-ready-checkout">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-health-green" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Ready for Checkout</span>
                  </div>
                  <Badge className="bg-health-green text-white font-bold text-base">{patientFlow.readyForCheckout}</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Payments Widget */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
          <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-green-50 to-white dark:from-green-950 dark:to-gray-900 border-b">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-health-green" />
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Outstanding Payments
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {outstandingPayments ? (
              outstandingPayments.length > 0 ? (
                <div className="space-y-2">
                  {outstandingPayments.slice(0, 6).map((payment: any, idx: number) => (
                    <Link key={idx} href="/payment">
                      <div className="flex items-start justify-between p-2 rounded hover:bg-amber-50 dark:hover:bg-amber-950 cursor-pointer border border-amber-200 dark:border-amber-800 transition-colors" data-testid={`payment-${payment.patientId}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                            {payment.patientName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {payment.serviceDescription}
                          </p>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                          <Badge className="bg-alert-red text-white font-bold">
                            ${payment.amount}
                          </Badge>
                          <Badge variant="outline" className="text-xs mt-1">
                            {payment.orderType}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {outstandingPayments.length > 6 && (
                    <Link href="/payment">
                      <Button variant="outline" size="sm" className="w-full mt-2" data-testid="view-all-payments">
                        View All ({outstandingPayments.length}) <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-health-green mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">All payments collected!</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pharmacy Alerts Widget */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
          <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950 dark:to-gray-900 border-b">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-attention-orange" />
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Pharmacy Alerts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {pharmacyAlerts ? (
              <div className="space-y-3">
                {pharmacyAlerts.lowStock.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-alert-red uppercase mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock ({pharmacyAlerts.lowStock.length})
                    </h4>
                    <div className="space-y-1">
                      {pharmacyAlerts.lowStock.map((drug: any, idx: number) => (
                        <Link key={idx} href="/pharmacy">
                          <div className="flex items-center justify-between p-2 rounded hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer border border-red-200 dark:border-red-800" data-testid={`low-stock-${drug.drugCode}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{drug.brandName}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{drug.drugCode}</p>
                            </div>
                            <Badge className="bg-alert-red text-white font-bold">
                              {drug.stockOnHand} left
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {pharmacyAlerts.expiringSoon.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-attention-orange uppercase mb-2 flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      Expiring Soon ({pharmacyAlerts.expiringSoon.length})
                    </h4>
                    <div className="space-y-1">
                      {pharmacyAlerts.expiringSoon.map((batch: any, idx: number) => (
                        <Link key={idx} href="/pharmacy">
                          <div className="flex items-center justify-between p-2 rounded hover:bg-orange-50 dark:hover:bg-orange-950 cursor-pointer border border-orange-200 dark:border-orange-800" data-testid={`expiring-${batch.batchId}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{batch.drugName}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Batch: {batch.lotNumber || 'N/A'}</p>
                            </div>
                            <Badge className="bg-attention-orange text-white text-xs">
                              {new Date(batch.expiryDate).toLocaleDateString()}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {pharmacyAlerts.lowStock.length === 0 && pharmacyAlerts.expiringSoon.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-health-green mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">All pharmacy stock healthy!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
