// client/src/pages/Dashboard.tsx
import { useMemo } from "react";
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
  Clock,
  MonitorSpeaker,
  Activity,
  DollarSign,
  Pill,
  ArrowRight,
  UserCheck,
  FlaskConical,
  RadioTower,
  CheckCircle2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

type DashboardStats = {
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
};

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function clampNumber(n: any): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconColorClass,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  iconColorClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div
          className={`
            h-9 w-9 rounded-xl border border-gray-200/70 dark:border-gray-700/60
            bg-white dark:bg-gray-900
            flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
          `}
        >
          <Icon className={`h-5 w-5 ${iconColorClass ?? "text-gray-700 dark:text-gray-200"}`} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SkeletonLines({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-xl border border-gray-200/70 dark:border-gray-800 bg-gray-100/70 dark:bg-gray-900/40 animate-pulse"
        />
      ))}
    </div>
  );
}

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
      accent: "border-l-sky-500",
      iconTint: "text-sky-600",
      iconBg: "bg-sky-50 dark:bg-sky-950/30",
    },
    {
      title: "Find Patient",
      description: "Search records",
      icon: Search,
      href: "/patients",
      accent: "border-l-green-500",
      iconTint: "text-green-600",
      iconBg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "New Treatment",
      description: "Record visit",
      icon: Stethoscope,
      href: "/treatment",
      accent: "border-l-orange-500",
      iconTint: "text-orange-600",
      iconBg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      title: "Urgent Cases",
      description: "Priority patients",
      icon: AlertTriangle,
      href: "/reports",
      accent: "border-l-red-500",
      iconTint: "text-red-600",
      iconBg: "bg-red-50 dark:bg-red-950/30",
    },
  ];

  const attention = useMemo(() => {
    const s = stats as DashboardStats | undefined;
    const pendingLab = clampNumber(s?.pending?.labResults);
    const pendingXray = clampNumber(s?.pending?.xrayReports);
    const pendingUs = clampNumber(s?.pending?.ultrasoundReports);

    const readyCount = Array.isArray(resultsReady) ? resultsReady.length : 0;
    const paymentsCount = Array.isArray(outstandingPayments) ? outstandingPayments.length : 0;

    const items: Array<{
      label: string;
      value: number;
      href: string;
      tone: "ok" | "warn" | "danger";
    }> = [];

    items.push({
      label: "Results ready",
      value: readyCount,
      href: "/treatment",
      tone: readyCount >= 8 ? "warn" : "ok",
    });

    items.push({
      label: "Pending lab results",
      value: pendingLab,
      href: "/laboratory",
      tone: pendingLab >= 10 ? "danger" : pendingLab >= 5 ? "warn" : "ok",
    });

    items.push({
      label: "Pending x-ray reports",
      value: pendingXray,
      href: "/xray",
      tone: pendingXray >= 10 ? "danger" : pendingXray >= 5 ? "warn" : "ok",
    });

    items.push({
      label: "Pending ultrasound reports",
      value: pendingUs,
      href: "/ultrasound",
      tone: pendingUs >= 10 ? "danger" : pendingUs >= 5 ? "warn" : "ok",
    });

    items.push({
      label: "Outstanding payments",
      value: paymentsCount,
      href: "/payment",
      tone: paymentsCount >= 12 ? "warn" : "ok",
    });

    // Show only items that matter first, but still show zeros in calm tone.
    return items;
  }, [stats, resultsReady, outstandingPayments]);

  const getStatusBadge = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "treated":
        return (
          <Badge
            className="font-semibold text-xs text-white shadow-sm"
            style={{ backgroundColor: "var(--health-green)" }}
          >
            Treated
          </Badge>
        );
      case "waiting":
        return (
          <Badge
            className="font-semibold text-xs text-white shadow-sm"
            style={{ backgroundColor: "var(--attention-orange)" }}
          >
            Waiting
          </Badge>
        );
      case "urgent":
        return (
          <Badge
            className="font-semibold text-xs text-white shadow-sm"
            style={{ backgroundColor: "var(--alert-red)" }}
          >
            Urgent
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs dark:border-gray-700">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Command Center Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                Clinic Command Center
              </h1>
              <Badge
                variant="outline"
                className="rounded-full border-gray-300 dark:border-gray-700 text-xs"
              >
                {formatToday()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Run your day with clarity: queues, results, and payments in one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-600 text-white shadow-sm">
              Online
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-xs border-gray-300 dark:border-gray-700"
            >
              Operational view
            </Badge>
          </div>
        </div>

        {/* Needs Attention Strip */}
        <Card className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-800 dark:text-gray-200" />
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Needs attention
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click any item to jump to the work queue
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {attention.map((a) => {
                const tone =
                  a.tone === "danger"
                    ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/25 dark:text-red-200"
                    : a.tone === "warn"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200"
                      : "border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-200";

                return (
                  <Link key={a.label} href={a.href}>
                    <div
                      className={`
                        cursor-pointer rounded-xl border ${tone}
                        px-3 py-2 transition-all duration-200
                        hover:shadow-sm hover:-translate-y-[1px]
                      `}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold truncate">{a.label}</p>
                        <span className="text-sm font-bold tabular-nums">{a.value}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card
                  className={cn(
                    "rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800",
                    "shadow-sm cursor-pointer transition-all duration-200",
                    "hover:-translate-y-1 hover:shadow-md",
                    "active:translate-y-0",
                    "border-l-4",
                    action.accent
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center",
                          "border border-gray-200/70 dark:border-gray-800",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                          action.iconBg
                        )}
                      >
                        <Icon className={cn("h-6 w-6", action.iconTint)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {action.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Top Row: Stats + Results Ready + Pending */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Today's Statistics */}
          <Card className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-200/70 dark:border-gray-800">
              <SectionHeader
                icon={Activity}
                title="Today"
                subtitle="Core operational counts"
                iconColorClass="text-sky-600"
              />
            </CardHeader>
            <CardContent className="p-5">
              {stats ? (
                <>
                  <Link href="/patients?filter=today">
                    <StatCard
                      label="New Patients"
                      value={(stats as any).newPatients}
                      color="var(--medical-blue)"
                      showProgress={true}
                      maxValue={20}
                      icon={<Users className="w-4 h-4" style={{ color: "var(--medical-blue)" }} />}
                    />
                  </Link>
                  <Link href="/treatment?filter=today">
                    <StatCard
                      label="Total Visits"
                      value={(stats as any).totalVisits}
                      color="var(--health-green)"
                      showProgress={true}
                      maxValue={50}
                      icon={<Activity className="w-4 h-4" style={{ color: "var(--health-green)" }} />}
                    />
                  </Link>
                  <Link href="/laboratory">
                    <StatCard
                      label="Lab Tests"
                      value={(stats as any).labTests}
                      color="var(--attention-orange)"
                      showProgress={true}
                      maxValue={30}
                      icon={<TestTube className="w-4 h-4" style={{ color: "var(--attention-orange)" }} />}
                    />
                  </Link>
                  <Link href="/xray">
                    <StatCard
                      label="X-Rays"
                      value={(stats as any).xrays}
                      color="hsl(270, 65%, 55%)"
                      showProgress={true}
                      maxValue={15}
                      icon={<Scan className="w-4 h-4" style={{ color: "hsl(270, 65%, 55%)" }} />}
                    />
                  </Link>
                  <Link href="/ultrasound">
                    <StatCard
                      label="Ultrasounds"
                      value={(stats as any).ultrasounds}
                      color="hsl(210, 75%, 55%)"
                      showProgress={true}
                      maxValue={10}
                      icon={<MonitorSpeaker className="w-4 h-4" style={{ color: "hsl(210, 75%, 55%)" }} />}
                    />
                  </Link>
                </>
              ) : (
                <SkeletonLines rows={5} />
              )}
            </CardContent>
          </Card>

          {/* Results Ready */}
          <Card className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-200/70 dark:border-gray-800">
              <SectionHeader
                icon={FileText}
                title="Results Ready"
                subtitle="Completed results awaiting doctor review"
                iconColorClass="text-purple-600"
              />
            </CardHeader>
            <CardContent className="p-5">
              {resultsReady ? (
                Array.isArray(resultsReady) && resultsReady.length > 0 ? (
                  <div className="space-y-3">
                    {resultsReady.slice(0, 5).map((result: any, index: number) => {
                      const isComplete = !!result.allComplete;
                      const StatusIcon = isComplete ? CheckCircle2 : Clock;

                      const tone = isComplete
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/25"
                        : "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/25";

                      const iconTone = isComplete
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400";

                      return (
                        <Link key={result.encounterId || index} href={`/treatment?patientId=${result.patientId}`}>
                          <div
                            className={cn(
                              "rounded-xl border p-4 cursor-pointer transition-all duration-200",
                              "hover:shadow-sm hover:-translate-y-[1px]",
                              tone
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {result.firstName} {result.lastName}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-gray-300 dark:border-gray-700">
                                    {result.patientId}
                                  </Badge>
                                  {Array.isArray(result.resultTypes) &&
                                    result.resultTypes.slice(0, 3).map((t: string, i: number) => (
                                      <Badge
                                        key={`${t}-${i}`}
                                        variant="outline"
                                        className="text-[10px] px-2 py-0.5 border-gray-300 dark:border-gray-700"
                                      >
                                        {t}
                                      </Badge>
                                    ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <StatusIcon className={cn("h-5 w-5", iconTone)} />
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                                {isComplete
                                  ? `All ${result.totalOrdered} Ready`
                                  : `${result.resultCount} of ${result.totalOrdered} Ready`}
                              </p>
                              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
                                Open <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>

                            {!isComplete && Array.isArray(result.pendingTestTypes) && result.pendingTestTypes.length > 0 ? (
                              <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-400">
                                Waiting for:{" "}
                                <span className="font-semibold">
                                  {result.pendingTestTypes.join(", ")}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })}

                    {Array.isArray(resultsReady) && resultsReady.length > 5 ? (
                      <Link href="/treatment">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl border-gray-300 dark:border-gray-700"
                        >
                          View all ({resultsReady.length}) <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2" style={{ color: "var(--health-green)" }} />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      All caught up
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      No results waiting for review
                    </p>
                  </div>
                )
              ) : (
                <SkeletonLines rows={4} />
              )}
            </CardContent>
          </Card>

          {/* Pending Items */}
          <Card className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-200/70 dark:border-gray-800">
              <SectionHeader
                icon={Clock}
                title="Pending Items"
                subtitle="Queues that can block patient flow"
                iconColorClass="text-gray-800 dark:text-gray-200"
              />
            </CardHeader>
            <CardContent className="p-5">
              {stats ? (
                <div className="space-y-2">
                  <Link href="/laboratory">
                    <div className="flex items-center justify-between rounded-xl border border-gray-200/70 dark:border-gray-800 p-3 hover:shadow-sm hover:-translate-y-[1px] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-gray-200/70 dark:border-gray-800 flex items-center justify-center">
                          <TestTube className="h-5 w-5 text-orange-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lab Results</p>
                      </div>
                      <Badge className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: "var(--attention-orange)", color: "white" }}>
                        {(stats as any).pending?.labResults ?? 0}
                      </Badge>
                    </div>
                  </Link>

                  <Link href="/xray">
                    <div className="flex items-center justify-between rounded-xl border border-gray-200/70 dark:border-gray-800 p-3 hover:shadow-sm hover:-translate-y-[1px] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-gray-200/70 dark:border-gray-800 flex items-center justify-center">
                          <Scan className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">X-Ray Reports</p>
                      </div>
                      <Badge className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: "hsl(270, 65%, 55%)", color: "white" }}>
                        {(stats as any).pending?.xrayReports ?? 0}
                      </Badge>
                    </div>
                  </Link>

                  <Link href="/ultrasound">
                    <div className="flex items-center justify-between rounded-xl border border-gray-200/70 dark:border-gray-800 p-3 hover:shadow-sm hover:-translate-y-[1px] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-gray-200/70 dark:border-gray-800 flex items-center justify-center">
                          <MonitorSpeaker className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ultrasound Reports</p>
                      </div>
                      <Badge className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: "hsl(210, 75%, 55%)", color: "white" }}>
                        {(stats as any).pending?.ultrasoundReports ?? 0}
                      </Badge>
                    </div>
                  </Link>
                </div>
              ) : (
                <SkeletonLines rows={3} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Flow + Payments + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Patient Flow */}
          <Card className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-200/70 dark:border-gray-800">
              <SectionHeader
                icon={UserCheck}
                title="Patient Flow"
                subtitle="Live queue overview"
                iconColorClass="text-sky-600"
              />
            </CardHeader>
            <CardContent className="p-5">
              {patientFlow ? (
                <div className="space-y-2">
                  {[
                    { label: "Waiting for Doctor", value: (patientFlow as any).waitingForDoctor, icon: UserCheck, tint: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
                    { label: "In Treatment", value: (patientFlow as any).inTreatment, icon: Stethoscope, tint: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
                    { label: "Waiting for Lab", value: (patientFlow as any).waitingForLab, icon: FlaskConical, tint: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
                    { label: "Waiting for X-ray", value: (patientFlow as any).waitingForXray, icon: RadioTower, tint: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
                    { label: "Waiting for Ultrasound", value: (patientFlow as any).waitingForUltrasound, icon: MonitorSpeaker, tint: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                    { label: "Waiting for Pharmacy", value: (patientFlow as any).waitingForPharmacy, icon: Pill, tint: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/25" },
                    { label: "Ready for Checkout", value: (patientFlow as any).readyForCheckout, icon: CheckCircle2, tint: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/25" },
                  ].map((row) => {
                    const RowIcon = row.icon;
                    return (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-xl border border-gray-200/70 dark:border-gray-800 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("h-9 w-9 rounded-xl border border-gray-200/70 dark:border-gray-800 flex items-center justify-center", row.bg)}>
                            <RowIcon className={cn("h-5 w-5", row.tint)} />
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {row.label}
                          </p>
                        </div>
                        <Badge className="rounded-full px-3 py-1 text-xs font-bold bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
                          {clampNumber(row.value)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <SkeletonLines rows={7} />
              )}
            </CardContent>
          </Card>

          {/* Outstanding Payments */}
          <Card className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-200/70 dark:border-gray-800">
              <SectionHeader
                icon={DollarSign}
                title="Outstanding Payments"
                subtitle="Patients who need to pay before closing"
                iconColorClass="text-emerald-600"
              />
            </CardHeader>
            <CardContent className="p-5">
              {outstandingPayments ? (
                Array.isArray(outstandingPayments) && outstandingPayments.length > 0 ? (
                  <div className="space-y-2.5">
                    {outstandingPayments.slice(0, 6).map((payment: any, idx: number) => {
                      const orderType = String(payment?.orderType || "other").toLowerCase();
                      const tone =
                        orderType === "lab"
                          ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40"
                          : orderType === "xray"
                            ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40"
                            : orderType === "ultrasound"
                              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40"
                              : "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800";

                      return (
                        <Link key={idx} href="/payment">
                          <div
                            className={cn(
                              "rounded-xl border p-3 cursor-pointer transition-all duration-200",
                              "hover:shadow-sm hover:-translate-y-[1px]",
                              tone
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {payment.patientName}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                  {payment.serviceDescription}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <Badge className="rounded-full px-3 py-1 text-xs font-bold bg-emerald-600 text-white shadow-sm">
                                  {clampNumber(payment.amount).toLocaleString()} SSP
                                </Badge>
                                <Badge variant="outline" className="text-[10px] rounded-full capitalize border-gray-300 dark:border-gray-700">
                                  {orderType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}

                    {Array.isArray(outstandingPayments) && outstandingPayments.length > 6 ? (
                      <Link href="/payment">
                        <Button variant="outline" size="sm" className="w-full rounded-xl border-gray-300 dark:border-gray-700">
                          View all ({outstandingPayments.length}) <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2" style={{ color: "var(--health-green)" }} />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      All payments collected
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Nothing outstanding right now
                    </p>
                  </div>
                )
              ) : (
                <SkeletonLines rows={4} />
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-200/70 dark:border-gray-800">
              <SectionHeader
                icon={Users}
                title="Recent Patients"
                subtitle="Latest activity (quick access)"
                iconColorClass="text-gray-800 dark:text-gray-200"
              />
            </CardHeader>
            <CardContent className="p-5">
              {recentPatients ? (
                Array.isArray(recentPatients) && recentPatients.length > 0 ? (
                  <div className="space-y-2">
                    {recentPatients.slice(0, 6).map((patient: any) => (
                      <div
                        key={patient.id}
                        className={cn(
                          "rounded-xl border border-gray-200/70 dark:border-gray-800 p-3",
                          "hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400">ID: {patient.patientId}</p>
                              {patient.lastVisit ? (
                                <p className="text-[11px] text-gray-500 dark:text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(patient.lastVisit).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex-shrink-0">{getStatusBadge(patient.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      No recent patients
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      New registrations will appear here
                    </p>
                  </div>
                )
              ) : (
                <SkeletonLines rows={4} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Local helper to avoid importing cn twice in this file
function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}
