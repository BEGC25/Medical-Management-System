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

  const { data: resultsReady } = useQuery({
    queryKey: ["/api/dashboard/results-ready"],
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
    <div className="space-y-8 md:space-y-8 px-2 sm:px-0">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href}>
              <Card className="shadow-premium-md hover:shadow-premium-xl transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] border-gray-100 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-900/50 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`${action.color} bg-opacity-10 p-4 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-6 flex-shrink-0 shadow-premium-sm`}>
                      <Icon className={`w-6 h-6`} style={{ color: `var(--${action.color.replace('bg-', '')}` }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white tracking-tight">{action.title}</h3>
                      <p className="text-gray-600 text-sm dark:text-gray-400 font-medium">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-6">
        {/* Statistics */}
        <Card className="md:col-span-1 shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Today's Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-4">
            {stats ? (
              <>
                <Link href="/patients?filter=today">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out active:bg-gray-100 dark:active:bg-gray-700 h-12 border-l-2 border-transparent hover:border-l-2 hover:border-medical-blue">
                    <span className="text-base text-gray-600 dark:text-gray-400">New Patients</span>
                    <span className="font-semibold text-lg text-medical-blue tabular-nums text-right min-w-[3rem]">{stats.newPatients}</span>
                  </div>
                </Link>
                <Link href="/treatment?filter=today">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out active:bg-gray-100 dark:active:bg-gray-700 h-12 border-l-2 border-transparent hover:border-l-2 hover:border-health-green">
                    <span className="text-base text-gray-600 dark:text-gray-400">Total Visits</span>
                    <span className="font-semibold text-lg text-health-green tabular-nums text-right min-w-[3rem]">{stats.totalVisits}</span>
                  </div>
                </Link>
                <Link href="/laboratory">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out active:bg-gray-100 dark:active:bg-gray-700 h-12 border-l-2 border-transparent hover:border-l-2 hover:border-attention-orange">
                    <span className="text-base text-gray-600 dark:text-gray-400">Lab Tests</span>
                    <span className="font-semibold text-lg text-attention-orange tabular-nums text-right min-w-[3rem]">{stats.labTests}</span>
                  </div>
                </Link>
                <Link href="/xray">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out active:bg-gray-100 dark:active:bg-gray-700 h-12 border-l-2 border-transparent hover:border-l-2 hover:border-purple-600">
                    <span className="text-base text-gray-600 dark:text-gray-400">X-Rays</span>
                    <span className="font-semibold text-lg text-purple-600 tabular-nums text-right min-w-[3rem]">{stats.xrays}</span>
                  </div>
                </Link>
                <Link href="/ultrasound">
                  <div className="flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out active:bg-gray-100 dark:active:bg-gray-700 h-12 border-l-2 border-transparent hover:border-l-2 hover:border-blue-600">
                    <span className="text-base text-gray-600 dark:text-gray-400">Ultrasounds</span>
                    <span className="font-semibold text-lg text-blue-600 tabular-nums text-right min-w-[3rem]">{stats.ultrasounds}</span>
                  </div>
                </Link>
              </>
            ) : (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-shimmer"></div>
                    <div className="h-4 bg-gray-200 rounded w-8 animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Ready for Review Widget */}
        <Card className="md:col-span-1 shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/30 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                Results Ready to Review
              </CardTitle>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Completed results awaiting doctor review
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {resultsReady ? (
              resultsReady.length > 0 ? (
                <div className="space-y-3">
                  {resultsReady.slice(0, 5).map((result: any, index: number) => {
                    // Determine status styling based on completeness
                    const isComplete = result.allComplete;
                    const isPartial = !isComplete;
                    
                    // Status-based styling
                    const statusStyles = isComplete 
                      ? {
                          bg: 'bg-green-50 dark:bg-green-950/30',
                          border: 'border-green-200 dark:border-green-800',
                          textColor: 'text-green-800 dark:text-green-200',
                          badgeBg: 'bg-green-100 dark:bg-green-900',
                          badgeText: 'text-green-800 dark:text-green-200',
                          icon: CheckCircle2,
                          iconColor: 'text-green-600 dark:text-green-400'
                        }
                      : {
                          bg: 'bg-amber-50 dark:bg-amber-950/30',
                          border: 'border-amber-200 dark:border-amber-800',
                          textColor: 'text-amber-800 dark:text-amber-200',
                          badgeBg: 'bg-amber-100 dark:bg-amber-900',
                          badgeText: 'text-amber-800 dark:text-amber-200',
                          icon: Clock,
                          iconColor: 'text-amber-600 dark:text-amber-400'
                        };
                    
                    const StatusIcon = statusStyles.icon;
                    
                    return (
                      <Link key={result.encounterId || index} href={`/treatment?patientId=${result.patientId}`}>
                        <div 
                          className={`p-4 rounded-xl border ${statusStyles.border} ${statusStyles.bg} hover:shadow-premium-md transition-all duration-300 cursor-pointer group`}
                          data-testid={`result-ready-${result.patientId}`}
                        >
                          {/* Patient Info Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-base text-gray-900 dark:text-white">
                                {result.firstName} {result.lastName}
                              </p>
                              <Badge 
                                variant="outline" 
                                className="text-[10px] px-2 py-0.5 bg-white/50 dark:bg-gray-900/50"
                              >
                                {result.patientId}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Test Type Badges */}
                          <div className="flex items-center gap-1 flex-wrap mb-3">
                            {result.resultTypes.map((type: string, idx: number) => (
                              <Badge 
                                key={idx}
                                variant="outline"
                                className={`text-xs px-2 py-1 font-medium ${
                                  type === 'Lab' ? 'text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 bg-orange-100/50 dark:bg-orange-900/30' :
                                  type === 'X-Ray' ? 'text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 bg-purple-100/50 dark:bg-purple-900/30' :
                                  'text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 bg-blue-100/50 dark:bg-blue-900/30'
                                }`}
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* Status Badge and Message */}
                          <div className={`p-3 rounded-lg ${statusStyles.badgeBg} border ${statusStyles.border}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <StatusIcon className={`w-5 h-5 ${statusStyles.iconColor} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`} />
                              <span className={`font-semibold text-sm ${statusStyles.badgeText}`}>
                                {isComplete 
                                  ? `All ${result.totalOrdered} Ready`
                                  : `${result.resultCount} of ${result.totalOrdered} Ready`
                                }
                              </span>
                            </div>
                            
                            {/* Action Message */}
                            <div className={`text-sm font-semibold ${statusStyles.textColor} flex items-center gap-2`}>
                              {isComplete ? (
                                <>
                                  <span>Patient ready for doctor</span>
                                  <ArrowRight className={`w-4 h-4 ${statusStyles.iconColor} transition-transform duration-300 group-hover:translate-x-1`} />
                                </>
                              ) : (
                                <span>Keep patient in waiting area</span>
                              )}
                            </div>
                            
                            {/* Pending Tests (only for partial results) */}
                            {isPartial && result.pendingTestTypes && result.pendingTestTypes.length > 0 && (
                              <div className={`mt-2 pt-2 border-t ${statusStyles.border}`}>
                                <p className={`text-xs font-medium ${statusStyles.textColor}`}>
                                  <span className="font-semibold">Waiting for:</span> {result.pendingTestTypes.join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {resultsReady.length > 5 && (
                    <Link href="/treatment">
                      <div className="text-center pt-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 p-2 rounded-lg transition-all duration-200">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          + {resultsReady.length - 5} more patients with results ready
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-health-green mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">All caught up!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">No pending results for today</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-shimmer"></div>
                      <div className="h-3 bg-gray-200 rounded w-24 animate-shimmer"></div>
                    </div>
                    <div className="h-4 w-4 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card className="md:col-span-2 lg:col-span-1 shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Pending Items</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {stats ? (
                <>
                  <Link href="/laboratory">
                    <div className={`flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg cursor-pointer transition-all duration-200 active:bg-gray-100 dark:active:bg-gray-700 min-h-[52px] border border-transparent hover:border-attention-orange/30 ${
                      stats.pending.labResults >= 10 ? 'bg-orange-50 dark:bg-orange-950/30 border-attention-orange/50' : ''
                    }`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <TestTube className="text-attention-orange w-5 h-5 flex-shrink-0" />
                        <span className="text-base text-gray-700 dark:text-gray-300 truncate">Lab Results</span>
                      </div>
                      <Badge className={`bg-attention-orange text-white font-semibold min-w-[2.5rem] justify-center text-sm flex-shrink-0 shadow-premium-sm ${
                        stats.pending.labResults >= 10 ? 'animate-subtle-pulse ring-2 ring-attention-orange ring-offset-2 scale-110 shadow-premium-md' : ''
                      }`}>
                        {stats.pending.labResults}
                      </Badge>
                    </div>
                  </Link>
                  <Link href="/xray">
                    <div className={`flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg cursor-pointer transition-all duration-200 active:bg-gray-100 dark:active:bg-gray-700 min-h-[52px] border border-transparent hover:border-purple-600/30 ${
                      stats.pending.xrayReports >= 10 ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-600/50' : ''
                    }`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Scan className="text-purple-600 w-5 h-5 flex-shrink-0" />
                        <span className="text-base text-gray-700 dark:text-gray-300 truncate">X-Ray Reports</span>
                      </div>
                      <Badge className={`bg-purple-600 text-white font-semibold min-w-[2.5rem] justify-center text-sm flex-shrink-0 shadow-premium-sm ${
                        stats.pending.xrayReports >= 10 ? 'animate-subtle-pulse ring-2 ring-purple-600 ring-offset-2 scale-110 shadow-premium-md' : ''
                      }`}>
                        {stats.pending.xrayReports}
                      </Badge>
                    </div>
                  </Link>
                  <Link href="/ultrasound">
                    <div className={`flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg cursor-pointer transition-all duration-200 active:bg-gray-100 dark:active:bg-gray-700 min-h-[52px] border border-transparent hover:border-blue-600/30 ${
                      stats.pending.ultrasoundReports >= 10 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-600/50' : ''
                    }`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <MonitorSpeaker className="text-blue-600 w-5 h-5 flex-shrink-0" />
                        <span className="text-base text-gray-700 dark:text-gray-300 truncate">Ultrasound Reports</span>
                      </div>
                      <Badge className={`bg-blue-600 text-white font-semibold min-w-[2.5rem] justify-center text-sm flex-shrink-0 shadow-premium-sm ${
                        stats.pending.ultrasoundReports >= 10 ? 'animate-subtle-pulse ring-2 ring-blue-600 ring-offset-2 scale-110 shadow-premium-md' : ''
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
                        <div className="h-4 w-4 bg-gray-200 rounded mr-3 animate-shimmer"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-shimmer"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-8 animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Dashboard Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-6">
        
        {/* Patient Flow & Queue Widget */}
        <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-medical-blue" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                Patient Flow
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {patientFlow ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-l-2 border-transparent hover:border-amber-600" data-testid="flow-waiting-doctor">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for Doctor</span>
                  </div>
                  <Badge className="bg-amber-600 text-white font-semibold shadow-premium-sm">{patientFlow.waitingForDoctor}</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-l-2 border-transparent hover:border-medical-blue" data-testid="flow-in-treatment">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-medical-blue" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">In Treatment</span>
                  </div>
                  <Badge className="bg-medical-blue text-white font-semibold shadow-premium-sm">{patientFlow.inTreatment}</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-l-2 border-transparent hover:border-attention-orange" data-testid="flow-waiting-lab">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-attention-orange" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for Lab</span>
                  </div>
                  <Badge className="bg-attention-orange text-white font-semibold shadow-premium-sm">{patientFlow.waitingForLab}</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-l-2 border-transparent hover:border-purple-600" data-testid="flow-waiting-xray">
                  <div className="flex items-center gap-2">
                    <RadioTower className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for X-ray</span>
                  </div>
                  <Badge className="bg-purple-600 text-white font-semibold shadow-premium-sm">{patientFlow.waitingForXray}</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-l-2 border-transparent hover:border-blue-600" data-testid="flow-waiting-ultrasound">
                  <div className="flex items-center gap-2">
                    <MonitorSpeaker className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for Ultrasound</span>
                  </div>
                  <Badge className="bg-blue-600 text-white font-semibold shadow-premium-sm">{patientFlow.waitingForUltrasound}</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-l-2 border-transparent hover:border-health-green" data-testid="flow-waiting-pharmacy">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-health-green" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting for Pharmacy</span>
                  </div>
                  <Badge className="bg-health-green text-white font-semibold shadow-premium-sm">{patientFlow.waitingForPharmacy}</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-700 mt-2 pt-3 transition-all duration-200 border-l-2 border-transparent hover:border-health-green" data-testid="flow-ready-checkout">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-health-green" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Ready for Checkout</span>
                  </div>
                  <Badge className="bg-health-green text-white font-semibold text-base shadow-premium-sm">{patientFlow.readyForCheckout}</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-shimmer"></div>
                    <div className="h-6 bg-gray-200 rounded w-8 animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Payments Widget */}
        <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-white dark:from-green-950/30 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-health-green" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                Outstanding Payments
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {outstandingPayments ? (
              outstandingPayments.length > 0 ? (
                <div className="space-y-2.5">
                  {outstandingPayments.slice(0, 6).map((payment: any, idx: number) => {
                    // Get department color based on order type
                    const getDepartmentColor = (type: string) => {
                      switch(type) {
                        case 'lab': return { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-600' };
                        case 'xray': return { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', badge: 'bg-purple-600' };
                        case 'ultrasound': return { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-600' };
                        default: return { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', badge: 'bg-gray-600' };
                      }
                    };
                    
                    const colors = getDepartmentColor(payment.orderType);
                    
                    return (
                      <Link key={idx} href="/payment">
                        <div className={`flex items-start justify-between p-3 rounded-xl hover:shadow-premium-md cursor-pointer border ${colors.border} ${colors.bg} transition-all duration-300`} data-testid={`payment-${payment.patientId}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                              {payment.patientName}
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 line-clamp-1">
                              {payment.serviceDescription}
                            </p>
                            {payment.tests && payment.orderType === 'lab' && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Categories: {payment.tests}
                              </p>
                            )}
                            {payment.services && payment.services.length > 1 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                +{payment.services.length - 1} more services
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end ml-3 gap-1.5">
                            <Badge className={`${colors.badge} text-white font-semibold text-sm px-2.5 py-1 shadow-premium-sm`}>
                              {Number(payment.amount).toLocaleString()} SSP
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize border-gray-300 dark:border-gray-600">
                              {payment.orderType}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {outstandingPayments.length > 6 && (
                    <Link href="/payment">
                      <Button variant="outline" size="sm" className="w-full mt-3 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all duration-200" data-testid="view-all-payments">
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
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-shimmer"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 animate-shimmer"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-12 animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Recent Patients</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {recentPatients ? (
                recentPatients.map((patient: any) => (
                  <div key={patient.id} className="flex items-start sm:items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 min-h-[60px] sm:min-h-[56px] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 transition-all duration-200">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-base text-gray-800 dark:text-gray-200 break-words">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {patient.patientId}</p>
                        {patient.lastVisit && (
                          <>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
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
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-shimmer"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 animate-shimmer"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16 animate-shimmer"></div>
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
