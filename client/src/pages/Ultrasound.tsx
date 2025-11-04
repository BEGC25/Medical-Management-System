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

function todayRange() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const start = `${yyyy}-${mm}-${dd}`;
  const end = `${yyyy}-${mm}-${dd}`;
  return { start, end };
}

/* ------------------------------------------------------------------ */
/* Data hooks                                                          */
/* ------------------------------------------------------------------ */

function useUltrasoundExams() {
  return useQuery<UltrasoundExam[]>({
    queryKey: ['/api/ultrasound-exams'],
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
  const { start, end } = todayRange();

  return useQuery<Patient[]>({
    queryKey: ['/api/patients', { today: true, start, end }],
    queryFn: async () => {
      try {
        const r1 = await fetch('/api/patients?today=1');
        if (r1.ok) return r1.json();
      } catch {}
      const r2 = await fetch(`/api/patients?from=${start}&to=${end}`);
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
      requestedDate: new Date().toISOString().split('T')[0],
    },
  });

  const resultsForm = useForm({
    defaultValues: {
      findings: '',
      impression: '',
      recommendations: '',
      imageQuality: 'good' as 'excellent' | 'good' | 'adequate' | 'limited',
      reportDate: new Date().toISOString().split('T')[0],
      sonographer: '',
    },
  });

  /* ----------------------------- Data ----------------------------- */

  const { data: allUltrasoundExams = [] } = useUltrasoundExams();
  const { data: ultrasoundServices = [] } = useUltrasoundServices();
  
  // Calculate date range based on filter
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
      case "yesterday": {
        const yesterday = new Date(today.getTime() - 86400000);
        return { start: yesterday, end: new Date(yesterday.getTime() + 86400000 - 1) };
      }
      case "last7days": {
        const weekAgo = new Date(today.getTime() - 7 * 86400000);
        return { start: weekAgo, end: new Date() };
      }
      case "last30days": {
        const monthAgo = new Date(today.getTime() - 30 * 86400000);
        return { start: monthAgo, end: new Date() };
      }
      case "custom": {
        // Default to today if no dates selected yet
        if (!customStartDate && !customEndDate) {
          return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
        }
        return {
          start: customStartDate || today,
          end: customEndDate ? new Date(customEndDate.setHours(23, 59, 59, 999)) : new Date(),
        };
      }
      default:
        return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    }
  };
  
  const dateRange = getDateRange();
  
  // First filter by date only
  const dateFilteredExams = allUltrasoundExams.filter((e) => {
    const examDate = new Date(e.requestedDate);
    return examDate >= dateRange.start && examDate <= dateRange.end;
  });
  
  const dateFilteredPending = dateFilteredExams.filter((e) => e.status === 'pending');
  const dateFilteredCompleted = dateFilteredExams.filter((e) => e.status === 'completed');

  // Patient map for cards
  const patientIdsForMap = useMemo(
    () => dateFilteredExams.map((e) => e.patientId),
    [dateFilteredExams]
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
      reportDate: (exam as any).reportDate || new Date().toISOString().split('T')[0],
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
          "rounded-lg p-3 cursor-pointer transition-all border shadow-md hover:shadow-xl",
          isPaid && !isCompleted && "border-green-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 hover:from-green-100 hover:to-green-200/50 dark:hover:from-green-900/30 dark:hover:to-green-900/20",
          !isPaid && !isCompleted && "border-red-300 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 hover:from-red-100 hover:to-red-200/50 dark:hover:from-red-900/30 dark:hover:to-red-900/20",
          isCompleted && "border-green-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 hover:from-green-100 hover:to-green-200/50 dark:hover:from-green-900/30 dark:hover:to-green-900/20",
          !canPerform && "opacity-75"
        )}
        onClick={() => canPerform && handleUltrasoundExamSelect(exam)}
        style={!canPerform ? { cursor: "not-allowed" } : {}}
        data-testid={`card-ultrasound-${exam.examId}`}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold truncate">{patient ? fullName(patient) : exam.patientId}</div>
              <Chip tone="slate">{exam.examId}</Chip>
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {timeAgo(exam.requestedDate)}
              {isCompleted && (exam as any).reportDate && (
                <> • Completed {timeAgo((exam as any).reportDate)}</>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
              <span className="font-medium">Exam Type:</span> {exam.examType}
            </div>
            {!isPaid && !isCompleted && (
              <div className="text-xs text-red-700 mt-2">
                ⚠️ Patient must pay at reception before exam can be performed
              </div>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {isCompleted && <Chip tone="emerald">Completed</Chip>}
            {!isCompleted && isPaid && <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">Pending</Badge>}
            {!isCompleted && !isPaid && <Badge variant="destructive">UNPAID</Badge>}
            <ChevronRight className="w-4 h-4 text-gray-400" />
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
          className="p-3 border rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
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
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Waves className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              Ultrasound Department
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Ultrasound imaging and diagnostic services
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setRequestOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-new-request"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Ultrasound Request
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Waves className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-exams">
                  {allUltrasoundExams.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-pending">
                  {pendingExams.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-completed">
                  {completedExams.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending and Completed Tests - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT – Pending Test Requests */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Clock className="w-5 h-5 text-blue-600" />
                Pending Test Requests
              </span>
              <Button
                type="button"
                onClick={() => setRequestOpen(true)}
                className="bg-medical-blue hover:bg-blue-700 text-white font-semibold shadow-md transition-all"
                data-testid="button-new-request"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Date Filter and Search Controls */}
            <div className="mb-4 space-y-3 border-b pb-4">
              <div className="flex flex-wrap gap-2">
                <Button variant={dateFilter === "today" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("today")}>Today</Button>
                <Button variant={dateFilter === "yesterday" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("yesterday")}>Yesterday</Button>
                <Button variant={dateFilter === "last7days" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("last7days")}>Last 7 Days</Button>
                <Button variant={dateFilter === "last30days" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("last30days")}>Last 30 Days</Button>
                <Button variant={dateFilter === "custom" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("custom")}>Custom Range</Button>
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
                <Input placeholder="Search by patient name or ID..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="pl-10" />
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
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No pending ultrasound examinations</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT – Completed Tests */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Check className="w-5 h-5 text-green-600" />
              Completed Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Same filter controls for completed tests */}
            <div className="mb-4 space-y-3 border-b pb-4">
              <div className="flex flex-wrap gap-2">
                <Button variant={dateFilter === "today" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("today")}>Today</Button>
                <Button variant={dateFilter === "yesterday" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("yesterday")}>Yesterday</Button>
                <Button variant={dateFilter === "last7days" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("last7days")}>Last 7 Days</Button>
                <Button variant={dateFilter === "last30days" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("last30days")}>Last 30 Days</Button>
                <Button variant={dateFilter === "custom" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("custom")}>Custom Range</Button>
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
                <Input placeholder="Search by patient name or ID..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="pl-10" />
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
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No completed ultrasound examinations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Request Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Ultrasound Examination Request</DialogTitle>
            <DialogDescription>
              Submit a new ultrasound examination request for a patient
            </DialogDescription>
          </DialogHeader>

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
                        className="pl-10"
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
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200" data-testid="selected-patient-name">
                          {fullName(selectedPatient)}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
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
                    <FormLabel>Exam Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-exam-type">
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
                    <FormLabel>Clinical Indication</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the clinical reason for this ultrasound examination..."
                        {...field}
                        value={field.value || ''}
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
                    <FormLabel>Special Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special instructions for the sonographer..."
                        {...field}
                        value={field.value || ''}
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
                  name="sonographer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sonographer</FormLabel>
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
  );
}
