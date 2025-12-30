import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Plus,
  Search,
  Loader2,
  Clock,
  Check,
  Printer,
  Camera,
  Save,
  ChevronRight,
  XSquare,
  AlertTriangle,
} from 'lucide-react';
import clinicLogo from '@assets/Logo-Clinic_1762148237143.jpeg';

import { ObjectUploader } from '@/components/ObjectUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import {
  insertXrayExamSchema,
  type InsertXrayExam,
  type Patient,
  type XrayExam,
} from '@shared/schema';

import { apiRequest } from '@/lib/queryClient';
import { addToPendingSync } from '@/lib/offline';
import { getDateRangeForAPI, formatDateInZone, getZonedNow, getClinicDayKey } from '@/lib/date-utils';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function fullName(p?: Patient | null) {
  if (!p) return '';
  const n = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return n || p.patientId || '';
}

/* ------------------------------------------------------------------ */
/* Data hooks                                                          */
/* ------------------------------------------------------------------ */

function useXrayExams(preset: string, customStart?: Date, customEnd?: Date) {
  return useQuery<XrayExam[]>({
    queryKey: ['/api/xray-exams', { preset, customStart, customEnd }],
    queryFn: async () => {
      const url = new URL("/api/xray-exams", window.location.origin);
      
      // Use new preset-based API (Phase 2)
      if (preset && preset !== 'custom') {
        url.searchParams.set("preset", preset);
      } else if (preset === 'custom' && customStart && customEnd) {
        // For custom range, convert dates to clinic day keys
        const fromKey = getClinicDayKey(customStart);
        const toKey = getClinicDayKey(customEnd);
        url.searchParams.set("preset", "custom");
        url.searchParams.set("from", fromKey);
        url.searchParams.set("to", toKey);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch xray exams");
      }
      return response.json();
    },
  });
}

function usePatientsMap(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  return useQuery<Record<string, Patient>>({
    queryKey: ['/api/patients/byIds', unique.sort().join(',')],
    enabled: unique.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        unique.map(async (id) => {
          try {
            const res = await apiRequest('GET', `/api/patients/${id}`);
            if (!res.ok) return [id, { patientId: id } as Patient] as const;
            const p = await res.json();
            return [id, p as Patient] as const;
          } catch {
            return [id, { patientId: id } as Patient] as const;
          }
        })
      );
      return Object.fromEntries(entries);
    },
  });
}

function useTodayPatients() {
  const today = getClinicDayKey();

  return useQuery<Patient[]>({
    queryKey: ['/api/patients', { today: true, date: today }],
    queryFn: async () => {
      try {
        const r1 = await fetch('/api/patients?today=1');
        if (r1.ok) return r1.json();
      } catch {}
      const r2 = await fetch(`/api/patients?date=${today}`);
      if (!r2.ok) return [];
      return r2.json();
    },
  });
}

function usePatientSearch(term: string) {
  return useQuery<Patient[]>({
    queryKey: ['/api/patients', { search: term }],
    enabled: term.trim().length >= 1,
    queryFn: async () => {
      const url = new URL('/api/patients', window.location.origin);
      url.searchParams.set('search', term.trim());
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function useRadiologyServices() {
  return useQuery<Array<{ id: number; name: string; price: number }>>({
    queryKey: ['/api/services', { category: 'radiology' }],
    queryFn: async () => {
      const url = new URL('/api/services', window.location.origin);
      url.searchParams.set('category', 'radiology');
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      return res.json();
    },
  });
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function XRay() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Request state
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [safetyChecklist, setSafetyChecklist] = useState({
    notPregnant: false,
    metalRemoved: false,
    canCooperate: false,
  });

  // Results state
  const [selectedXrayExam, setSelectedXrayExam] = useState<XrayExam | null>(null);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);

  // Print modals
  const [showXrayRequest, setShowXrayRequest] = useState(false);
  const [showXrayReport, setShowXrayReport] = useState(false);

  // Patient picker search/paging
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // Date range filtering and patient search
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "last7days" | "last30days" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(id);
  }, [term]);

  // Forms
  const form = useForm<InsertXrayExam>({
    resolver: zodResolver(insertXrayExamSchema),
    defaultValues: {
      patientId: '',
      examType: 'chest',
      bodyPart: '',
      clinicalIndication: '',
      specialInstructions: '',
      // Use clinic timezone (Africa/Juba) for requestedDate to ensure consistent day classification
      // across all pages (Treatment, X-Ray, Payments). Using UTC would cause records around
      // midnight to be classified into wrong clinic day.
      requestedDate: formatDateInZone(getZonedNow()),
    },
  });

  const resultsForm = useForm({
    defaultValues: {
      findings: '',
      impression: '',
      recommendations: '',
      imageQuality: 'good' as 'excellent' | 'good' | 'adequate' | 'limited',
      // Use clinic timezone (Africa/Juba) for reportDate to ensure consistent day classification
      reportDate: formatDateInZone(getZonedNow()),
      radiologist: '',
    },
  });

  /* ----------------------------- Data ----------------------------- */

  const { data: allXrayExams = [] } = useXrayExams(dateFilter, customStartDate, customEndDate);
  const { data: radiologyServices = [] } = useRadiologyServices();
  
  // Server now handles all date filtering - no need for client-side date filtering
  // Split by status for the two tabs
  const dateFilteredPending = allXrayExams.filter((e) => e.status === 'pending');
  const dateFilteredCompleted = allXrayExams.filter((e) => e.status === 'completed');

  // Patient map for cards
  const patientIdsForMap = useMemo(
    () => allXrayExams.map((e) => e.patientId),
    [allXrayExams]
  );
  const patientsMap = usePatientsMap(patientIdsForMap);
  
  // Then filter by patient search (needs patientsMap loaded)
  const filterByPatient = (exams: typeof allXrayExams) => {
    if (!patientSearchTerm.trim()) return exams;
    
    return exams.filter((e) => {
      const patient = patientsMap.data?.[e.patientId];
      if (!patient) return false;
      
      const searchLower = patientSearchTerm.toLowerCase();
      const patientName = fullName(patient).toLowerCase();
      const patientId = patient.patientId.toLowerCase();
      
      return patientName.includes(searchLower) || patientId.includes(searchLower);
    });
  };
  
  const pendingExams = filterByPatient(dateFilteredPending);
  const completedExams = filterByPatient(dateFilteredCompleted);

  // Patient picker data: today's + search
  const todayPatients = useTodayPatients();
  const searchPatients = usePatientSearch(debounced);

  const visibleToday = useMemo(() => {
    const list = todayPatients.data ?? [];
    return list.slice(0, page * PER_PAGE);
  }, [todayPatients.data, page]);

  const visibleSearch = useMemo(() => {
    const list = searchPatients.data ?? [];
    return list.slice(0, page * PER_PAGE);
  }, [searchPatients.data, page]);

  /* --------------------------- Effects ---------------------------- */

  // Load patient for report print
  useEffect(() => {
    if (!selectedXrayExam) {
      setReportPatient(null);
      return;
    }
    (async () => {
      try {
        const res = await apiRequest('GET', `/api/patients/${selectedXrayExam.patientId}`);
        const p = await res.json();
        setReportPatient(p?.patientId ? p : null);
      } catch {
        setReportPatient(null);
      }
    })();
  }, [selectedXrayExam]);

  /* --------------------------- Mutations -------------------------- */

  const createXrayExamMutation = useMutation({
    mutationFn: async (data: InsertXrayExam) => {
      const response = await apiRequest('POST', '/api/xray-exams', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'X-ray examination request submitted successfully' });
      form.reset();
      setSelectedPatient(null);
      setSafetyChecklist({ notPregnant: false, metalRemoved: false, canCooperate: false });
      setRequestOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/xray-exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: () => {
      if (!navigator.onLine) {
        if (!selectedPatient) {
          toast({
            title: 'Error',
            description: 'Cannot save offline without patient selection',
            variant: 'destructive',
          });
          return;
        }
        addToPendingSync({
          type: 'xray_exam',
          action: 'create',
          data: { ...form.getValues(), patientId: selectedPatient.patientId },
        });
        toast({
          title: 'Saved Offline',
          description: 'X-ray request saved locally. Will sync when online.',
        });
        form.reset();
        setSelectedPatient(null);
        setSafetyChecklist({ notPregnant: false, metalRemoved: false, canCooperate: false });
        setRequestOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit X-ray examination request',
          variant: 'destructive',
        });
      }
    },
  });

  const updateXrayExamMutation = useMutation({
    mutationFn: async ({ examId, data }: { examId: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/xray-exams/${examId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Exam Completed', description: 'X-ray report saved and exam marked as completed' });
      resultsForm.reset();
      setSelectedXrayExam(null);
      setResultsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/xray-exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error, variables) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'xray_exam',
          action: 'update',
          data: { examId: variables.examId, ...variables.data },
        });
        toast({
          title: 'Saved Offline',
          description: 'X-ray report saved locally. Will sync when online.',
        });
        resultsForm.reset();
        setSelectedXrayExam(null);
        setResultsModalOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save X-ray report',
          variant: 'destructive',
        });
      }
    },
  });

  /* --------------------------- Handlers --------------------------- */

  const onSubmitRequest = (data: InsertXrayExam) => {
    if (!selectedPatient) {
      toast({ title: 'Error', description: 'Please select a patient first', variant: 'destructive' });
      return;
    }
    createXrayExamMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
    });
  };

  const onSubmitResults = (data: any) => {
    if (!selectedXrayExam) return;
    updateXrayExamMutation.mutate({
      examId: selectedXrayExam.examId,
      data: { ...data, status: 'completed' },
    });
  };

  const handleXrayExamSelect = (exam: XrayExam) => {
    setSelectedXrayExam(exam);
    setResultsModalOpen(true);
    resultsForm.reset({
      findings: exam.findings || '',
      impression: exam.impression || '',
      recommendations: exam.recommendations || '',
      imageQuality: (exam as any).imageQuality || 'good',
      // Use clinic timezone (Africa/Juba) for reportDate fallback
      reportDate: (exam as any).reportDate || formatDateInZone(getZonedNow()),
      radiologist: exam.radiologist || '',
    });
  };

  /* --------------------------- Render ---------------------------- */

  const Chip = ({ tone, children }: { tone: string; children: React.ReactNode }) => (
    <span className={cx(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      tone === "slate" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      tone === "emerald" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    )}>
      {children}
    </span>
  );

  const ExamCard = ({ exam, patient }: { exam: XrayExam; patient?: Patient | null }) => {
    const isPaid = exam.paymentStatus === 'paid';
    const canPerform = exam.status === 'completed' || isPaid;
    const isCompleted = exam.status === 'completed';
    
    return (
      <div
        className={cx(
          "bg-white dark:bg-gray-800 rounded-xl p-3 border-l-4 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer group",
          isCompleted && "border-green-500",
          !isCompleted && isPaid && "border-orange-500",
          !isCompleted && !isPaid && "border-red-500",
          !canPerform && "opacity-75"
        )}
        onClick={() => canPerform && handleXrayExamSelect(exam)}
        style={!canPerform ? { cursor: "not-allowed" } : {}}
        data-testid={`card-xray-${exam.examId}`}
      >
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{patient ? fullName(patient) : exam.patientId}</span>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{exam.examId}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{timeAgo(exam.requestedDate)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Exam Type: <span className="font-medium">{exam.examType}</span>
              {exam.bodyPart && <> • Body Part: <span className="font-medium">{exam.bodyPart}</span></>}
            </p>
            {!isPaid && !isCompleted && (
              <>
                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full uppercase inline-block mt-2">
                  UNPAID
                </span>
                <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium mt-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Patient must pay at reception before exam can be performed</span>
                </div>
              </>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {isCompleted && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                Completed
              </span>
            )}
            {!isCompleted && isPaid && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                Pending
              </span>
            )}
            {canPerform && <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all duration-300" />}
          </div>
        </div>
      </div>
    );
  };

  const PatientPickerList = ({ patients }: { patients: Patient[] }) => (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {patients.map((p) => (
        <div
          key={p.patientId}
          onClick={() => {
            setSelectedPatient(p);
            setTerm('');
          }}
          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:border-cyan-300 cursor-pointer transition-all duration-200"
          data-testid={`patient-option-${p.patientId}`}
        >
          <p className="font-semibold">{fullName(p)}</p>
          <p className="text-sm text-gray-500">ID: {p.patientId} • {p.age} • {p.gender}</p>
        </div>
      ))}
      {patients.length >= page * PER_PAGE && (
        <Button
          variant="ghost"
          onClick={() => setPage((p) => p + 1)}
          className="w-full"
        >
          Load More
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Page Header - Premium Card Container */}
      <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0">
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                <XSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  X-Ray Department
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Radiological imaging and diagnostic services</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setRequestOpen(true)}
              className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:shadow-[0_4px_20px_rgba(6,182,212,0.4)] text-white font-semibold transition-all duration-300"
              data-testid="button-new-request"
            >
              <Plus className="w-4 h-4 mr-2" />
              New X-Ray Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics - Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pending</p>
                <p className="text-2xl font-bold mt-0.5" data-testid="stat-pending">{pendingExams.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Completed</p>
                <p className="text-2xl font-bold mt-0.5" data-testid="stat-completed">{completedExams.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Exams</p>
                <p className="text-2xl font-bold mt-0.5" data-testid="stat-total">{allXrayExams.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <XSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT – Pending Test Requests */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0">
          <CardContent className="p-4">
            {/* Section Header with Icon */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Pending Test Requests</h2>
            </div>
            {/* Date Filter and Search Controls */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                {["today", "yesterday", "last7days", "last30days", "custom"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter as any)}
                    className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                      dateFilter === filter
                        ? "text-cyan-600 dark:text-cyan-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-cyan-600 after:to-teal-500 after:shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                        : "text-gray-500 hover:text-cyan-500"
                    }`}
                  >
                    {filter === "today" && "Today"}
                    {filter === "yesterday" && "Yesterday"}
                    {filter === "last7days" && "Last 7 Days"}
                    {filter === "last30days" && "Last 30 Days"}
                    {filter === "custom" && "Custom Range"}
                  </button>
                ))}
              </div>
              {dateFilter === "custom" && (
                <div className="flex gap-2 items-center">
                  <DatePicker date={customStartDate} onDateChange={setCustomStartDate} placeholder="Start Date" className="w-48" />
                  <span className="text-sm text-gray-500">to</span>
                  <DatePicker date={customEndDate} onDateChange={setCustomEndDate} placeholder="End Date" className="w-48" />
                </div>
              )}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300 placeholder:text-gray-400"
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {pendingExams.length} pending exam{pendingExams.length !== 1 ? "s" : ""}{patientSearchTerm && ` matching "${patientSearchTerm}"`}
              </div>
            </div>
            
            <div className="space-y-3">
              {pendingExams.length > 0 ? (
                pendingExams.map((exam) => (
                  <ExamCard key={exam.examId} exam={exam} patient={patientsMap.data?.[exam.patientId]} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                    <Clock className="w-7 h-7 text-orange-500 dark:text-orange-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No pending X-ray examinations</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select start and end dates above to view exams in custom range"
                      : "All caught up! Completed exams will appear in the right panel."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT – Completed Tests */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0">
          <CardContent className="p-4">
            {/* Section Header with Icon */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Completed Tests</h2>
            </div>
            {/* Same filter controls for completed tests */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                {["today", "yesterday", "last7days", "last30days", "custom"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter as any)}
                    className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                      dateFilter === filter
                        ? "text-cyan-600 dark:text-cyan-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-cyan-600 after:to-teal-500 after:shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                        : "text-gray-500 hover:text-cyan-500"
                    }`}
                  >
                    {filter === "today" && "Today"}
                    {filter === "yesterday" && "Yesterday"}
                    {filter === "last7days" && "Last 7 Days"}
                    {filter === "last30days" && "Last 30 Days"}
                    {filter === "custom" && "Custom Range"}
                  </button>
                ))}
              </div>
              {dateFilter === "custom" && (
                <div className="flex gap-2 items-center">
                  <DatePicker date={customStartDate} onDateChange={setCustomStartDate} placeholder="Start Date" className="w-48" />
                  <span className="text-sm text-gray-500">to</span>
                  <DatePicker date={customEndDate} onDateChange={setCustomEndDate} placeholder="End Date" className="w-48" />
                </div>
              )}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300 placeholder:text-gray-400"
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {completedExams.length} completed exam{completedExams.length !== 1 ? "s" : ""}{patientSearchTerm && ` matching "${patientSearchTerm}"`}
              </div>
            </div>
            
            <div className="space-y-3">
              {completedExams.length > 0 ? (
                completedExams.map((exam) => (
                  <ExamCard key={exam.examId} exam={exam} patient={patientsMap.data?.[exam.patientId]} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                    <Check className="w-7 h-7 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No completed X-ray examinations</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select start and end dates above to view exams in custom range"
                      : "Completed exams will appear here."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Request Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Modal header with gradient */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-500 p-4 rounded-t-xl -m-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <XSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">New X-Ray Examination Request</h2>
                <p className="text-cyan-100 text-sm">Submit a new X-ray examination request for a patient</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Patient Selection</h3>
                {!selectedPatient ? (
                  <div>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search patients by name or ID..."
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="pl-10 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                        data-testid="input-patient-search"
                      />
                    </div>
                    {term.trim() ? (
                      <PatientPickerList patients={visibleSearch} />
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Today's Patients</p>
                        <PatientPickerList patients={visibleToday} />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border-2 border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-cyan-800 dark:text-cyan-200" data-testid="selected-patient-name">
                          {fullName(selectedPatient)}
                        </p>
                        <p className="text-sm text-cyan-700 dark:text-cyan-300">
                          ID: {selectedPatient.patientId} | Age: {selectedPatient.age} | {selectedPatient.gender}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPatient(null)}
                        className="border-gray-300 hover:bg-gray-50"
                        data-testid="button-change-patient"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Exam Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="examType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Exam Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500" data-testid="select-exam-type">
                            <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {radiologyServices.length > 0 ? (
                            radiologyServices.map((service) => (
                              <SelectItem key={service.id} value={service.name}>
                                {service.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="chest">Chest X-Ray</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyPart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Body Part (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Left knee, Right shoulder"
                          {...field}
                          value={field.value || ''}
                          className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                          data-testid="input-body-part"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clinicalIndication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Clinical Indication</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the clinical reason for this X-ray examination..."
                        {...field}
                        value={field.value || ''}
                        className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                        data-testid="textarea-clinical-indication"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Special Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special instructions for the technician..."
                        {...field}
                        value={field.value || ''}
                        className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                        data-testid="textarea-special-instructions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Safety Checklist */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">Safety Checklist</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notPregnant"
                      checked={safetyChecklist.notPregnant}
                      onCheckedChange={(checked) =>
                        setSafetyChecklist((prev) => ({ ...prev, notPregnant: !!checked }))
                      }
                      data-testid="checkbox-not-pregnant"
                    />
                    <label htmlFor="notPregnant" className="text-sm">
                      Patient is not pregnant (or pregnancy status confirmed)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="metalRemoved"
                      checked={safetyChecklist.metalRemoved}
                      onCheckedChange={(checked) =>
                        setSafetyChecklist((prev) => ({ ...prev, metalRemoved: !!checked }))
                      }
                      data-testid="checkbox-metal-removed"
                    />
                    <label htmlFor="metalRemoved" className="text-sm">
                      Metal objects and jewelry removed from examination area
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canCooperate"
                      checked={safetyChecklist.canCooperate}
                      onCheckedChange={(checked) =>
                        setSafetyChecklist((prev) => ({ ...prev, canCooperate: !!checked }))
                      }
                      data-testid="checkbox-can-cooperate"
                    />
                    <label htmlFor="canCooperate" className="text-sm">
                      Patient can cooperate and follow positioning instructions
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRequestOpen(false);
                    setSelectedPatient(null);
                    form.reset();
                    setSafetyChecklist({ notPregnant: false, metalRemoved: false, canCooperate: false });
                  }}
                  className="border-gray-300 hover:bg-gray-50"
                  data-testid="button-cancel-request"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedPatient || createXrayExamMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:shadow-[0_4px_20px_rgba(6,182,212,0.4)] text-white font-semibold"
                  data-testid="button-submit-request"
                >
                  {createXrayExamMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit X-Ray Request'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Results/Report Dialog */}
      <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>X-Ray Examination Report</DialogTitle>
            <DialogDescription>
              {selectedXrayExam && (
                <>
                  Exam ID: {selectedXrayExam.examId} | Patient: {reportPatient ? fullName(reportPatient) : selectedXrayExam.patientId}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...resultsForm}>
            <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-6">
              {/* Photo Upload Section */}
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">X-Ray Images</h4>
                </div>
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760}
                  accept="image/*"
                  onGetUploadParameters={async () => {
                    const response = await fetch('/api/objects/upload', { method: 'POST' });
                    if (!response.ok) throw new Error('Upload failed');
                    const data = await response.json();
                    return {
                      method: 'PUT' as const,
                      url: data.url,
                    };
                  }}
                  onComplete={(uploadedFiles) => {
                    if (uploadedFiles.length > 0) {
                      const currentFindings = resultsForm.getValues('findings');
                      const imageLinks = uploadedFiles.map((file) => `Image: ${file.url}`).join('\n');
                      resultsForm.setValue('findings', currentFindings ? `${currentFindings}\n\n${imageLinks}` : imageLinks);
                      toast({ title: 'Success', description: `${uploadedFiles.length} image(s) uploaded successfully` });
                    }
                  }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload X-Ray Images
                </ObjectUploader>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload X-ray films or digital images. Images will be added to findings.
                </p>
              </div>

              {/* Image Quality */}
              <FormField
                control={resultsForm.control}
                name="imageQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Quality</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-image-quality">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="adequate">Adequate</SelectItem>
                        <SelectItem value="limited">Limited</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Findings */}
              <FormField
                control={resultsForm.control}
                name="findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Findings</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe radiological findings..."
                        {...field}
                        rows={6}
                        data-testid="textarea-findings"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Impression */}
              <FormField
                control={resultsForm.control}
                name="impression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impression</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Clinical impression and diagnosis..."
                        {...field}
                        rows={3}
                        data-testid="textarea-impression"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recommendations */}
              <FormField
                control={resultsForm.control}
                name="recommendations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommendations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Clinical recommendations and follow-up..."
                        {...field}
                        rows={3}
                        data-testid="textarea-recommendations"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={resultsForm.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-report-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resultsForm.control}
                  name="radiologist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Radiologist</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of radiologist" {...field} data-testid="input-radiologist" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedXrayExam && reportPatient) {
                      setShowXrayReport(true);
                      setTimeout(() => window.print(), 100);
                    }
                  }}
                  data-testid="button-print-report"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResultsModalOpen(false);
                      setSelectedXrayExam(null);
                    }}
                    data-testid="button-cancel-report"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateXrayExamMutation.isPending}
                    data-testid="button-save-report"
                  >
                    {updateXrayExamMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Print Report (hidden) */}
      {showXrayReport && selectedXrayExam && reportPatient && (
        <div className="print-only">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-only, .print-only * { visibility: visible; }
              .print-only { position: absolute; left: 0; top: 0; width: 100%; }
              @page { margin: 1cm; }
            }
          `}</style>
          <div className="bg-white p-6 max-w-4xl mx-auto">
            <div className="mb-6 pb-4 border-b-2 border-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={clinicLogo} alt="Clinic Logo" className="h-20 w-20 object-contain" />
                  <div>
                    <h1 className="text-3xl font-bold text-blue-600 mb-1">Bahr El Ghazal Clinic</h1>
                    <p className="text-sm text-gray-600">Comprehensive Healthcare Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-800">X-Ray Examination Report</p>
                  <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm"><strong>Patient Name:</strong> {fullName(reportPatient)}</p>
                <p className="text-sm"><strong>Patient ID:</strong> {reportPatient.patientId}</p>
                <p className="text-sm"><strong>Age:</strong> {reportPatient.age}</p>
                <p className="text-sm"><strong>Gender:</strong> {reportPatient.gender}</p>
              </div>
              <div>
                <p className="text-sm"><strong>Exam ID:</strong> {selectedXrayExam.examId}</p>
                <p className="text-sm"><strong>Exam Type:</strong> {selectedXrayExam.examType} X-Ray</p>
                {selectedXrayExam.bodyPart && (
                  <p className="text-sm"><strong>Body Part:</strong> {selectedXrayExam.bodyPart}</p>
                )}
                <p className="text-sm"><strong>Report Date:</strong> {resultsForm.getValues('reportDate')}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-bold mb-2">FINDINGS:</h3>
              <p className="text-sm whitespace-pre-line">{resultsForm.getValues('findings')}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-bold mb-2">IMPRESSION:</h3>
              <p className="text-sm whitespace-pre-line">{resultsForm.getValues('impression')}</p>
            </div>

            {resultsForm.getValues('recommendations') && (
              <div className="mb-4">
                <h3 className="font-bold mb-2">RECOMMENDATIONS:</h3>
                <p className="text-sm whitespace-pre-line">{resultsForm.getValues('recommendations')}</p>
              </div>
            )}

            <div className="mt-8 pt-4 border-t">
              <p className="text-sm"><strong>Radiologist:</strong> {resultsForm.getValues('radiologist')}</p>
              <p className="text-sm"><strong>Image Quality:</strong> {resultsForm.getValues('imageQuality')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
