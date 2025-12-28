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
import { StatCard } from "@/components/ui/stat-card";

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

  // Premium shadow system constants
  const CARD_SHADOW_DEFAULT = '0 1px 3px 0 rgba(15,23,42,0.08), 0 4px 12px -2px rgba(15,23,42,0.12), 0 8px 24px -4px rgba(15,23,42,0.1)';
  const CARD_SHADOW_HOVER = '0 4px 8px 0 rgba(15,23,42,0.1), 0 12px 32px -4px rgba(15,23,42,0.16), 0 20px 48px -8px rgba(15,23,42,0.14)';
  const ACTION_CARD_SHADOW_HOVER = '0 4px 8px 0 rgba(15,23,42,0.1), 0 12px 32px -4px rgba(15,23,42,0.18), 0 20px 48px -8px rgba(15,23,42,0.15), 0 32px 64px -12px rgba(15,23,42,0.12)';


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
        return <Badge className="font-semibold text-sm text-white shadow-sm" style={{ backgroundColor: 'var(--health-green)' }}>Treated</Badge>;
      case 'waiting':
        return <Badge className="font-semibold text-sm text-white shadow-sm" style={{ backgroundColor: 'var(--attention-orange)' }}>Waiting</Badge>;
      case 'urgent':
        return <Badge className="font-semibold text-sm text-white shadow-sm" style={{ backgroundColor: 'var(--alert-red)' }}>Urgent</Badge>;
      default:
        return <Badge variant="outline" className="dark:border-gray-600 shadow-sm">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950 
                    px-2 sm:px-0 
                    transition-colors duration-300
                    space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in duration-500">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href}>
              <Card 
                className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl cursor-pointer transition-all duration-500 ease-out hover:-translate-y-3 hover:scale-[1.02] active:translate-y-0 active:scale-[0.99]"
                style={{ 
                  animation: `slide-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s backwards`,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: CARD_SHADOW_DEFAULT,
                  borderLeft: action.color === 'bg-medical-blue' ? '4px solid #0ea5e9' :
                              action.color === 'bg-health-green' ? '4px solid #22c55e' :
                              action.color === 'bg-attention-orange' ? '4px solid #f97316' :
                              '4px solid #ef4444'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = ACTION_CARD_SHADOW_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = CARD_SHADOW_DEFAULT;
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        background: action.color === 'bg-medical-blue' ? 'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(59,130,246,0.12) 100%)' :
                                    action.color === 'bg-health-green' ? 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(34,197,94,0.12) 100%)' :
                                    action.color === 'bg-attention-orange' ? 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(249,115,22,0.12) 100%)' :
                                    'linear-gradient(135deg, rgba(248,113,113,0.15) 0%, rgba(239,68,68,0.12) 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 1px 6px rgba(0,0,0,0.04)'
                      }}
                    >
                      <Icon 
                        className="w-7 h-7" 
                        style={{ 
                          color: action.color === 'bg-medical-blue' ? '#3b82f6' :
                                 action.color === 'bg-health-green' ? '#10b981' :
                                 action.color === 'bg-attention-orange' ? '#f59e0b' :
                                 '#ef4444'
                        }} 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 tracking-tight">{action.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-0.5">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Statistics */}
        <Card 
          className="md:col-span-1 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]"
          style={{
            boxShadow: CARD_SHADOW_DEFAULT
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_DEFAULT;
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200/70 dark:border-gray-800/70 
                                 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/60 dark:to-gray-900">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              Today's Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 px-5 space-y-1">
            {stats ? (
              <>
                <Link href="/patients?filter=today">
                  <StatCard
                    label="New Patients"
                    value={stats.newPatients}
                    color="var(--medical-blue)"
                    showProgress={true}
                    maxValue={20}
                    icon={<Users className="w-4 h-4" style={{ color: 'var(--medical-blue)' }} />}
                  />
                </Link>
                <Link href="/treatment?filter=today">
                  <StatCard
                    label="Total Visits"
                    value={stats.totalVisits}
                    color="var(--health-green)"
                    showProgress={true}
                    maxValue={50}
                    icon={<Activity className="w-4 h-4" style={{ color: 'var(--health-green)' }} />}
                  />
                </Link>
                <Link href="/laboratory">
                  <StatCard
                    label="Lab Tests"
                    value={stats.labTests}
                    color="var(--attention-orange)"
                    showProgress={true}
                    maxValue={30}
                    icon={<TestTube className="w-4 h-4" style={{ color: 'var(--attention-orange)' }} />}
                  />
                </Link>
                <Link href="/xray">
                  <StatCard
                    label="X-Rays"
                    value={stats.xrays}
                    color="hsl(270, 65%, 55%)"
                    showProgress={true}
                    maxValue={15}
                    icon={<Scan className="w-4 h-4" style={{ color: 'hsl(270, 65%, 55%)' }} />}
                  />
                </Link>
                <Link href="/ultrasound">
                  <StatCard
                    label="Ultrasounds"
                    value={stats.ultrasounds}
                    color="hsl(210, 75%, 55%)"
                    showProgress={true}
                    maxValue={10}
                    icon={<MonitorSpeaker className="w-4 h-4" style={{ color: 'hsl(210, 75%, 55%)' }} />}
                  />
                </Link>
              </>
            ) : (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-shimmer"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Ready for Review Widget */}
        <Card 
          className="md:col-span-1 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]"
          style={{
            boxShadow: CARD_SHADOW_DEFAULT
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_DEFAULT;
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200/70 dark:border-gray-800/70
                                 bg-gradient-to-r from-purple-50/80 to-white dark:from-purple-950/40 dark:to-gray-900">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                Results Ready to Review
              </CardTitle>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Completed results awaiting doctor review
            </p>
          </CardHeader>
          <CardContent className="p-6">
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
                          textColor: 'text-green-800 dark:text-green-300',
                          badgeBg: 'bg-green-100 dark:bg-green-900/50',
                          badgeText: 'text-green-800 dark:text-green-300',
                          icon: CheckCircle2,
                          iconColor: 'text-green-600 dark:text-green-400'
                        }
                      : {
                          bg: 'bg-amber-50 dark:bg-amber-950/30',
                          border: 'border-amber-200 dark:border-amber-800',
                          textColor: 'text-amber-800 dark:text-amber-300',
                          badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
                          badgeText: 'text-amber-800 dark:text-amber-300',
                          icon: Clock,
                          iconColor: 'text-amber-600 dark:text-amber-400'
                        };
                    
                    const StatusIcon = statusStyles.icon;
                    
                    return (
                      <Link key={result.encounterId || index} href={`/treatment?patientId=${result.patientId}`}>
                        <div 
                          className={`p-4 rounded-xl border ${statusStyles.border} ${statusStyles.bg} hover:shadow-md transition-all duration-300 ease-out cursor-pointer group`}
                          data-testid={`result-ready-${result.patientId}`}
                        >
                          {/* Patient Info Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                {result.firstName} {result.lastName}
                              </p>
                              <Badge 
                                variant="outline" 
                                className="text-[10px] px-2 py-0.5 bg-white/50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700"
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
                                  type === 'Lab' ? 'text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700 bg-orange-100/50 dark:bg-orange-900/30' :
                                  type === 'X-Ray' ? 'text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700 bg-purple-100/50 dark:bg-purple-900/30' :
                                  'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 bg-blue-100/50 dark:bg-blue-900/30'
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
                      <div className="text-center pt-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 p-2 rounded-lg transition-all duration-300 ease-out">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          + {resultsReady.length - 5} more patients with results ready
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--health-green)' }} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">All caught up!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">No pending results for today</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-shimmer"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-shimmer"></div>
                    </div>
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card 
          className="md:col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]"
          style={{
            boxShadow: CARD_SHADOW_DEFAULT
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_DEFAULT;
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200/70 dark:border-gray-800/70
                                 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/60 dark:to-gray-900">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              Pending Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {stats ? (
                <>
                  <Link href="/laboratory">
                    <div className={`flex items-center justify-between 
                                     hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                     p-3.5 rounded-xl cursor-pointer 
                                     transition-all duration-300 ease-out
                                     border-l-4 border-transparent hover:border-l-orange-500 dark:hover:border-l-orange-400
                                     hover:shadow-[4px_0_12px_rgba(249,115,22,0.12),2px_0_6px_rgba(249,115,22,0.08)]
                                     hover:translate-x-1
                                     ${stats.pending.labResults >= 10 ? 'bg-orange-50/80 dark:bg-orange-950/30 border-l-orange-500 dark:border-l-orange-400' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <TestTube className="text-attention-orange w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">Lab Results</span>
                      </div>
                      <Badge className={`font-bold text-sm px-3.5 py-1.5 transition-all duration-300
                                        shadow-[0_2px_6px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]
                                        ${stats.pending.labResults >= 10 
                                          ? 'animate-pulse-premium ring-4 ring-orange-400/40 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110 shadow-[0_4px_12px_rgba(249,115,22,0.3),0_2px_6px_rgba(249,115,22,0.2)]' 
                                          : ''}`}
                             style={{ backgroundColor: 'var(--attention-orange)', color: 'white' }}>
                        {stats.pending.labResults}
                      </Badge>
                    </div>
                  </Link>
                  <Link href="/xray">
                    <div className={`flex items-center justify-between 
                                     hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                     p-3.5 rounded-xl cursor-pointer 
                                     transition-all duration-300 ease-out
                                     border-l-4 border-transparent hover:border-l-purple-500 dark:hover:border-l-purple-400
                                     hover:shadow-[4px_0_12px_rgba(147,51,234,0.12),2px_0_6px_rgba(147,51,234,0.08)]
                                     hover:translate-x-1
                                     ${stats.pending.xrayReports >= 10 ? 'bg-purple-50/80 dark:bg-purple-950/30 border-l-purple-500 dark:border-l-purple-400' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Scan className="text-purple-600 w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">X-Ray Reports</span>
                      </div>
                      <Badge className={`font-bold text-sm px-3.5 py-1.5 transition-all duration-300
                                        shadow-[0_2px_6px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]
                                        ${stats.pending.xrayReports >= 10 
                                          ? 'animate-pulse-premium ring-4 ring-purple-400/40 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110 shadow-[0_4px_12px_rgba(147,51,234,0.3),0_2px_6px_rgba(147,51,234,0.2)]' 
                                          : ''}`}
                             style={{ backgroundColor: 'hsl(270, 65%, 55%)', color: 'white' }}>
                        {stats.pending.xrayReports}
                      </Badge>
                    </div>
                  </Link>
                  <Link href="/ultrasound">
                    <div className={`flex items-center justify-between 
                                     hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                     p-3.5 rounded-xl cursor-pointer 
                                     transition-all duration-300 ease-out
                                     border-l-4 border-transparent hover:border-l-blue-500 dark:hover:border-l-blue-400
                                     hover:shadow-[4px_0_12px_rgba(37,99,235,0.12),2px_0_6px_rgba(37,99,235,0.08)]
                                     hover:translate-x-1
                                     ${stats.pending.ultrasoundReports >= 10 ? 'bg-blue-50/80 dark:bg-blue-950/30 border-l-blue-500 dark:border-l-blue-400' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <MonitorSpeaker className="text-blue-600 w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">Ultrasound Reports</span>
                      </div>
                      <Badge className={`font-bold text-sm px-3.5 py-1.5 transition-all duration-300
                                        shadow-[0_2px_6px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]
                                        ${stats.pending.ultrasoundReports >= 10 
                                          ? 'animate-pulse-premium ring-4 ring-blue-400/40 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110 shadow-[0_4px_12px_rgba(37,99,235,0.3),0_2px_6px_rgba(37,99,235,0.2)]' 
                                          : ''}`}
                             style={{ backgroundColor: 'hsl(210, 75%, 55%)', color: 'white' }}>
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
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded mr-3 animate-shimmer"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-shimmer"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Dashboard Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Patient Flow & Queue Widget */}
        <Card 
          className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]"
          style={{
            boxShadow: CARD_SHADOW_DEFAULT
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_DEFAULT;
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200/70 dark:border-gray-800/70
                                 bg-gradient-to-r from-blue-50/80 to-white dark:from-blue-950/40 dark:to-gray-900">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-medical-blue dark:text-blue-400" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                Patient Flow
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {patientFlow ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl 
                                hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                transition-all duration-300 ease-out
                                border-l-3 border-transparent hover:border-l-amber-500 dark:hover:border-l-amber-400
                                hover:shadow-[2px_0_8px_rgba(245,158,11,0.12)]
                                hover:translate-x-1.5" 
                     data-testid="flow-waiting-doctor">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                      <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Waiting for Doctor</span>
                  </div>
                  <Badge className="bg-amber-600 text-white font-semibold shadow-sm px-3 py-1">{patientFlow.waitingForDoctor}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl 
                                hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                transition-all duration-300 ease-out
                                border-l-3 border-transparent hover:border-l-blue-500 dark:hover:border-l-blue-400
                                hover:shadow-[2px_0_8px_rgba(59,130,246,0.12)]
                                hover:translate-x-1.5" 
                     data-testid="flow-in-treatment">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <Stethoscope className="w-4 h-4 text-medical-blue dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">In Treatment</span>
                  </div>
                  <Badge className="text-white font-semibold shadow-sm px-3 py-1" style={{ backgroundColor: 'var(--medical-blue)' }}>{patientFlow.inTreatment}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl 
                                hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                transition-all duration-300 ease-out
                                border-l-3 border-transparent hover:border-l-orange-500 dark:hover:border-l-orange-400
                                hover:shadow-[2px_0_8px_rgba(249,115,22,0.12)]
                                hover:translate-x-1.5" 
                     data-testid="flow-waiting-lab">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                      <FlaskConical className="w-4 h-4 text-attention-orange dark:text-orange-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Waiting for Lab</span>
                  </div>
                  <Badge className="text-white font-semibold shadow-sm px-3 py-1" style={{ backgroundColor: 'var(--attention-orange)' }}>{patientFlow.waitingForLab}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl 
                                hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                transition-all duration-300 ease-out
                                border-l-3 border-transparent hover:border-l-purple-500 dark:hover:border-l-purple-400
                                hover:shadow-[2px_0_8px_rgba(147,51,234,0.12)]
                                hover:translate-x-1.5" 
                     data-testid="flow-waiting-xray">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                      <RadioTower className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Waiting for X-ray</span>
                  </div>
                  <Badge className="bg-purple-600 text-white font-semibold shadow-sm px-3 py-1">{patientFlow.waitingForXray}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl 
                                hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                transition-all duration-300 ease-out
                                border-l-3 border-transparent hover:border-l-blue-500 dark:hover:border-l-blue-400
                                hover:shadow-[2px_0_8px_rgba(59,130,246,0.12)]
                                hover:translate-x-1.5" 
                     data-testid="flow-waiting-ultrasound">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <MonitorSpeaker className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Waiting for Ultrasound</span>
                  </div>
                  <Badge className="bg-blue-600 text-white font-semibold shadow-sm px-3 py-1">{patientFlow.waitingForUltrasound}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl 
                                hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                transition-all duration-300 ease-out
                                border-l-3 border-transparent hover:border-l-green-500 dark:hover:border-l-green-400
                                hover:shadow-[2px_0_8px_rgba(34,197,94,0.12)]
                                hover:translate-x-1.5" 
                     data-testid="flow-waiting-pharmacy">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <Pill className="w-4 h-4 text-health-green dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Waiting for Pharmacy</span>
                  </div>
                  <Badge className="text-white font-semibold shadow-sm px-3 py-1" style={{ backgroundColor: 'var(--health-green)' }}>{patientFlow.waitingForPharmacy}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl 
                                hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                border-t border-gray-100 dark:border-gray-800 mt-2 pt-3 transition-all duration-300 ease-out
                                border-l-3 border-transparent hover:border-l-green-500 dark:hover:border-l-green-400
                                hover:shadow-[2px_0_8px_rgba(34,197,94,0.12)]
                                hover:translate-x-1.5" 
                     data-testid="flow-ready-checkout">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <CheckCircle2 className="w-4 h-4 text-health-green dark:text-green-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Ready for Checkout</span>
                  </div>
                  <Badge className="text-white font-semibold text-base shadow-sm px-3 py-1.5" style={{ backgroundColor: 'var(--health-green)' }}>{patientFlow.readyForCheckout}</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-shimmer"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Payments Widget */}
        <Card 
          className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]"
          style={{
            boxShadow: CARD_SHADOW_DEFAULT
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_DEFAULT;
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200/70 dark:border-gray-800/70
                                 bg-gradient-to-r from-green-50/80 to-white dark:from-green-950/40 dark:to-gray-900">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-health-green dark:text-green-400" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                Outstanding Payments
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
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
                        <div className={`flex items-start justify-between p-3 rounded-xl hover:shadow-md cursor-pointer 
                                         border ${colors.border} ${colors.bg} transition-all duration-300 ease-out`} 
                             data-testid={`payment-${payment.patientId}`}>
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
                            <Badge className={`${colors.badge} text-white font-semibold text-sm px-2.5 py-1 shadow-sm`}>
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
                      <Button variant="outline" size="sm" 
                              className="w-full mt-3 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all duration-300 ease-out" 
                              data-testid="view-all-payments">
                        View All ({outstandingPayments.length}) <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--health-green)' }} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">All payments collected!</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-shimmer"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-shimmer"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card 
          className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]"
          style={{
            boxShadow: CARD_SHADOW_DEFAULT
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = CARD_SHADOW_DEFAULT;
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200/70 dark:border-gray-800/70
                                 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/60 dark:to-gray-900">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              Recent Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentPatients ? (
                recentPatients.map((patient: any) => (
                  <div key={patient.id} 
                       className="flex items-start sm:items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 
                                  last:border-b-0 min-h-[60px] sm:min-h-[56px] hover:bg-gray-50/80 dark:hover:bg-gray-800/60 
                                  rounded-lg px-2 transition-all duration-300 ease-out">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-base text-gray-800 dark:text-gray-200 break-words">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {patient.patientId}</p>
                        {patient.lastVisit && (
                          <>
                            <span className="text-gray-400 dark:text-gray-600 hidden sm:inline">•</span>
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
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-shimmer"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-shimmer"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-shimmer"></div>
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
