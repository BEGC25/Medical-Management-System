import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Waves,
  Plus,
  Search,
  Loader2,
  Clock,
  Check,
  Printer,
  Camera,
  Save,
  ChevronRight,
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import {
  insertUltrasoundExamSchema,
  type InsertUltrasoundExam,
  type Patient,
  type UltrasoundExam,
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
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

function fullName(p?: Patient | null) {
  if (!p) return '';
  const n = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return n || p.patientId || '';
}

/* ------------------------------------------------------------------ */
/* Data hooks                                                          */
/* ------------------------------------------------------------------ */

function useUltrasoundExams(preset: string, customStart?: Date, customEnd?: Date) {
  return useQuery<UltrasoundExam[]>({
    queryKey: ['/api/ultrasound-exams', { preset, customStart, customEnd }],
    queryFn: async () => {
      const url = new URL("/api/ultrasound-exams", window.location.origin);
      
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
        throw new Error("Failed to fetch ultrasound exams");
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

function useUltrasoundServices() {
  return useQuery<Array<{ id: number; name: string; price: number }>>({
    queryKey: ['/api/services', { category: 'ultrasound' }],
    queryFn: async () => {
      const url = new URL('/api/services', window.location.origin);
      url.searchParams.set('category', 'ultrasound');
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      return res.json();
    },
  });
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function Ultrasound() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Request state
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Results state
  const [selectedUltrasoundExam, setSelectedUltrasoundExam] = useState<UltrasoundExam | null>(null);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);

  // Print modals
  const [showUltrasoundRequest, setShowUltrasoundRequest] = useState(false);
  const [showUltrasoundReport, setShowUltrasoundReport] = useState(false);

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
  const form = useForm<InsertUltrasoundExam>({
    resolver: zodResolver(insertUltrasoundExamSchema),
    defaultValues: {
      patientId: '',
      examType: 'abdominal',
      clinicalIndication: '',
      specialInstructions: '',
      // Use clinic timezone (Africa/Juba) for requestedDate to ensure consistent day classification
      // across all pages (Treatment, Ultrasound, Payments). Using UTC would cause records around
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
      sonographer: '',
    },
  });

  /* ----------------------------- Data ----------------------------- */

  const { data: allUltrasoundExams = [] } = useUltrasoundExams(dateFilter, customStartDate, customEndDate);
  const { data: ultrasoundServices = [] } = useUltrasoundServices();
  
  // Server now handles all date filtering - no need for client-side date filtering
  // Split by status for the two tabs
  const dateFilteredPending = allUltrasoundExams.filter((e) => e.status === 'pending');
  const dateFilteredCompleted = allUltrasoundExams.filter((e) => e.status === 'completed');

  // Patient map for cards
  const patientIdsForMap = useMemo(
    () => allUltrasoundExams.map((e) => e.patientId),
    [allUltrasoundExams]
  );
  const patientsMap = usePatientsMap(patientIdsForMap);
  
  // Then filter by patient search (needs patientsMap loaded)
  const filterByPatient = (exams: typeof allUltrasoundExams) => {
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
    if (!selectedUltrasoundExam) {
      setReportPatient(null);
      return;
    }
    (async () => {
      try {
        const res = await apiRequest('GET', `/api/patients/${selectedUltrasoundExam.patientId}`);
        const p = await res.json();
        setReportPatient(p?.patientId ? p : null);
      } catch {
        setReportPatient(null);
      }
    })();
  }, [selectedUltrasoundExam]);

  /* --------------------------- Mutations -------------------------- */

  const createUltrasoundExamMutation = useMutation({
    mutationFn: async (data: InsertUltrasoundExam) => {
      const response = await apiRequest('POST', '/api/ultrasound-exams', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Ultrasound examination request submitted successfully' });
      form.reset();
      setSelectedPatient(null);
      setRequestOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/ultrasound-exams'] });
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
          type: 'ultrasound_exam',
          action: 'create',
          data: { ...form.getValues(), patientId: selectedPatient.patientId },
        });
        toast({
          title: 'Saved Offline',
          description: 'Ultrasound request saved locally. Will sync when online.',
        });
        form.reset();
        setSelectedPatient(null);
        setRequestOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit ultrasound examination request',
          variant: 'destructive',
        });
      }
    },
  });

  const updateUltrasoundExamMutation = useMutation({
    mutationFn: async ({ examId, data }: { examId: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/ultrasound-exams/${examId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Exam Completed', description: 'Ultrasound report saved and exam marked as completed' });
      resultsForm.reset();
      setSelectedUltrasoundExam(null);
      setResultsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/ultrasound-exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error, variables) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'ultrasound_exam',
          action: 'update',
          data: { examId: variables.examId, ...variables.data },
        });
        toast({
          title: 'Saved Offline',
          description: 'Ultrasound report saved locally. Will sync when online.',
        });
        resultsForm.reset();
        setSelectedUltrasoundExam(null);
        setResultsModalOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save ultrasound report',
          variant: 'destructive',
        });
      }
    },
  });

  /* --------------------------- Handlers --------------------------- */

  const onSubmitRequest = (data: InsertUltrasoundExam) => {
    if (!selectedPatient) {
      toast({ title: 'Error', description: 'Please select a patient first', variant: 'destructive' });
      return;
    }
    createUltrasoundExamMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
    });
  };

  const onSubmitResults = (data: any) => {
    if (!selectedUltrasoundExam) return;
    updateUltrasoundExamMutation.mutate({
      examId: selectedUltrasoundExam.examId,
      data: { ...data, status: 'completed' },
    });
  };

  const handleUltrasoundExamSelect = (exam: UltrasoundExam) => {
    setSelectedUltrasoundExam(exam);
    setResultsModalOpen(true);
    resultsForm.reset({
      findings: exam.findings || '',
      impression: exam.impression || '',
      recommendations: exam.recommendations || '',
      imageQuality: (exam as any).imageQuality || 'good',
      // Use clinic timezone (Africa/Juba) for reportDate fallback
      reportDate: (exam as any).reportDate || formatDateInZone(getZonedNow()),
      sonographer: exam.sonographer || '',
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

  const ExamCard = ({ exam, patient }: { exam: UltrasoundExam; patient?: Patient | null }) => {
    const isPaid = exam.paymentStatus === 'paid';
    const canPerform = exam.status === 'completed' || isPaid;
    const isCompleted = exam.status === 'completed';
    
    return (
      <div
        className={cx(
          "rounded-lg p-2.5 border-l-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md group",
          isPaid && !isCompleted && "border-orange-500 bg-white dark:bg-gray-800",
          !isPaid && !isCompleted && "border-red-500 bg-red-50/50 dark:bg-red-900/10",
          isCompleted && "border-emerald-500 bg-white dark:bg-gray-800",
          !canPerform && "opacity-75"
        )}
        onClick={() => canPerform && handleUltrasoundExamSelect(exam)}
        style={!canPerform ? { cursor: "not-allowed" } : {}}
        data-testid={`card-ultrasound-${exam.examId}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Line 1: Patient name + ID chip */}
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {patient ? fullName(patient) : exam.patientId}
              </div>
              <Chip tone="slate">{exam.examId}</Chip>
            </div>
            
            {/* Line 2: Exam summary (no label) */}
            <div className="text-xs text-gray-700 dark:text-gray-300 mb-0.5">
              {exam.examType}
            </div>
            
            {/* Meta: Compact time */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo(exam.requestedDate)}
            </div>
            
            {/* UNPAID warning - compact */}
            {!isPaid && !isCompleted && (
              <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-xs text-amber-800 dark:text-amber-300 font-medium line-clamp-1">
                  Payment required at reception
                </span>
              </div>
            )}
          </div>
          
          <div className="shrink-0 flex items-center gap-2">
            {/* Status pill */}
            {isCompleted && (
              <Badge className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Completed
              </Badge>
            )}
            {!isCompleted && isPaid && (
              <Badge className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                Pending
              </Badge>
            )}
            {!isCompleted && !isPaid && (
              <Badge className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white dark:bg-red-700 dark:text-white border border-red-700 dark:border-red-800 shadow-sm">
                UNPAID
              </Badge>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all duration-200" />
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
          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all duration-200"
          data-testid={`patient-option-${p.patientId}`}
        >
          <div className="font-medium text-gray-900 dark:text-white">
            {fullName(p)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ID: {p.patientId} • {p.age} • {p.gender}
          </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Premium Header */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04)]">
          <CardContent className="p-6">
            {/* Top Section: Title + CTA */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Waves className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Ultrasound Department
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Advanced diagnostic imaging and ultrasound services
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setRequestOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300"
                data-testid="button-new-request"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>

            {/* Thin KPI Bar (Patient page style) */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm py-2.5 px-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {/* Pending */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums" data-testid="stat-pending">
                    {pendingExams.length}
                  </span>
                </div>
                
                {/* Divider */}
                <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
                
                {/* Completed */}
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums" data-testid="stat-completed">
                    {completedExams.length}
                  </span>
                </div>
                
                {/* Divider */}
                <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
                
                {/* Total */}
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-gray-600 dark:text-gray-400">Total:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums" data-testid="stat-total">
                    {allUltrasoundExams.length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT – Pending Test Requests */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              Pending Test Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Date Filter and Search Controls */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setDateFilter("today")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "today"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter("yesterday")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "yesterday"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setDateFilter("last7days")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "last7days"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateFilter("last30days")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "last30days"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateFilter("custom")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "custom"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Custom Range
                </button>
              </div>
              {dateFilter === "custom" && (
                <div className="flex gap-2 items-center">
                  <DatePicker date={customStartDate} onDateChange={setCustomStartDate} placeholder="Start Date" className="w-48" />
                  <span className="text-sm text-gray-500">to</span>
                  <DatePicker date={customEndDate} onDateChange={setCustomEndDate} placeholder="End Date" className="w-48" />
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search by patient name or ID..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="pl-10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {pendingExams.length} pending exam{pendingExams.length !== 1 ? "s" : ""}{patientSearchTerm && ` matching "${patientSearchTerm}"`}
              </div>
            </div>
            
            <div className="space-y-2">
              {pendingExams.length > 0 ? (
                pendingExams.map((exam) => (
                  <ExamCard key={exam.examId} exam={exam} patient={patientsMap.data?.[exam.patientId]} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center shadow-lg">
                      <Clock className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center border-2 border-green-500">
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mt-4">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select date range"
                      : "All caught up!"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select start and end dates above to view exams in custom range"
                      : "No pending examinations at the moment. New requests will appear here."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT – Completed Tests */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              Completed Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Same filter controls for completed tests */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setDateFilter("today")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "today"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter("yesterday")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "yesterday"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setDateFilter("last7days")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "last7days"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateFilter("last30days")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "last30days"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateFilter("custom")}
                  className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                    dateFilter === "custom"
                      ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-500 after:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Custom Range
                </button>
              </div>
              {dateFilter === "custom" && (
                <div className="flex gap-2 items-center">
                  <DatePicker date={customStartDate} onDateChange={setCustomStartDate} placeholder="Start Date" className="w-48" />
                  <span className="text-sm text-gray-500">to</span>
                  <DatePicker date={customEndDate} onDateChange={setCustomEndDate} placeholder="End Date" className="w-48" />
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search by patient name or ID..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="pl-10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {completedExams.length} completed exam{completedExams.length !== 1 ? "s" : ""}{patientSearchTerm && ` matching "${patientSearchTerm}"`}
              </div>
            </div>
            
            <div className="space-y-2">
              {completedExams.length > 0 ? (
                completedExams.map((exam) => (
                  <ExamCard key={exam.examId} exam={exam} patient={patientsMap.data?.[exam.patientId]} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select date range"
                      : "No completed examinations"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-4 rounded-t-xl -m-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">New Ultrasound Examination Request</h2>
                <p className="text-indigo-100 text-sm">Submit a new ultrasound examination request for a patient</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Patient Selection</h3>
                {!selectedPatient ? (
                  <div>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search patients by name or ID..."
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="pl-10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
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
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-indigo-800 dark:text-indigo-200" data-testid="selected-patient-name">
                          {fullName(selectedPatient)}
                        </p>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                          ID: {selectedPatient.patientId} | Age: {selectedPatient.age} | {selectedPatient.gender}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPatient(null)}
                        data-testid="button-change-patient"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Exam Details */}
              <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Exam Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200" data-testid="select-exam-type">
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ultrasoundServices.length > 0 ? (
                          ultrasoundServices.map((service) => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="abdominal">Abdominal Ultrasound</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clinicalIndication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Clinical Indication</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the clinical reason for this ultrasound examination..."
                        {...field}
                        value={field.value || ''}
                        className="focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
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
                        placeholder="Any special instructions for the sonographer..."
                        {...field}
                        value={field.value || ''}
                        className="focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        data-testid="textarea-special-instructions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRequestOpen(false);
                    setSelectedPatient(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-request"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedPatient || createUltrasoundExamMutation.isPending}
                  data-testid="button-submit-request"
                >
                  {createUltrasoundExamMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
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
            <DialogTitle>Ultrasound Examination Report</DialogTitle>
            <DialogDescription>
              {selectedUltrasoundExam && (
                <>
                  Exam ID: {selectedUltrasoundExam.examId} | Patient: {reportPatient ? fullName(reportPatient) : selectedUltrasoundExam.patientId}
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
                  <h4 className="font-medium text-gray-900 dark:text-white">Ultrasound Images</h4>
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
                  Upload Ultrasound Images
                </ObjectUploader>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload ultrasound scans or images. Images will be added to findings.
                </p>
              </div>

              {/* Image Quality */}
              <FormField
                control={resultsForm.control}
                name="imageQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Image Quality</FormLabel>
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
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Findings</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe ultrasound findings..."
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
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Impression</FormLabel>
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
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Recommendations</FormLabel>
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
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-report-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resultsForm.control}
                  name="sonographer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Sonographer</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of sonographer" {...field} data-testid="input-sonographer" />
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
                    if (selectedUltrasoundExam && reportPatient) {
                      setShowUltrasoundReport(true);
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
                      setSelectedUltrasoundExam(null);
                    }}
                    data-testid="button-cancel-report"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUltrasoundExamMutation.isPending}
                    data-testid="button-save-report"
                  >
                    {updateUltrasoundExamMutation.isPending ? (
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
      {showUltrasoundReport && selectedUltrasoundExam && reportPatient && (
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
                  <p className="text-xl font-semibold text-gray-800">Ultrasound Examination Report</p>
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
                <p className="text-sm"><strong>Exam ID:</strong> {selectedUltrasoundExam.examId}</p>
                <p className="text-sm"><strong>Exam Type:</strong> {selectedUltrasoundExam.examType} Ultrasound</p>
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
              <p className="text-sm"><strong>Sonographer:</strong> {resultsForm.getValues('sonographer')}</p>
              <p className="text-sm"><strong>Image Quality:</strong> {resultsForm.getValues('imageQuality')}</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
