import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
  Activity,
  Zap,
  User,
  Eye,
  Trash,
  FileText,
  Mic,
  Copy,
  Lightbulb,
  Filter,
  RefreshCw,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useServicesByCategory } from '@/hooks/useServicesByCategory';

import {
  insertXrayExamSchema,
  type InsertXrayExam,
  type Patient,
  type XrayExam,
  type Service,
} from '@shared/schema';

import { apiRequest } from '@/lib/queryClient';
import { addToPendingSync } from '@/lib/offline';
import { getDateRangeForAPI, formatDateInZone, getZonedNow, getClinicDayKey } from '@/lib/date-utils';
import { timeAgo } from '@/lib/time-utils';
import { getXrayDisplayName, toTitleCase } from '@/lib/display-utils';
import { ResultPatientHeader, ResultHeaderCard, ResultSectionCard, KeyFindingCard } from '@/components/diagnostics';
import { XRAY_EXAM_TYPES, XRAY_BODY_PARTS } from '@/lib/diagnostic-catalog';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function fullName(p?: Patient | null) {
  if (!p) return '';
  const n = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return n || p.patientId || '';
}

/**
 * Get human-readable label for X-Ray exam type
 * (Uses toTitleCase from display-utils)
 */
function getExamTypeLabel(examType: string): string {
  const labels: Record<string, string> = {
    'chest': 'Chest',
    'abdomen': 'Abdomen',
    'spine': 'Spine',
    'extremities': 'Extremities',
    'pelvis': 'Pelvis',
    'skull': 'Skull',
  };
  return labels[examType.toLowerCase()] || toTitleCase(examType);
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

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */


export default function XRay() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Request state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [examType, setExamType] = useState('chest');
  const [bodyPart, setBodyPart] = useState('');
  const [safetyChecklist, setSafetyChecklist] = useState({
    pregnancy: false,
    metal: false,
    cooperation: false,
  });

  // Results state
  const [selectedXrayExam, setSelectedXrayExam] = useState<XrayExam | null>(null);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"view" | "edit">("edit"); // View mode for completed results
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string }>>([]);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [viewDescriptions, setViewDescriptions] = useState('');
  const [technicalFactors, setTechnicalFactors] = useState('');
  const [radiologistName, setRadiologistName] = useState('');
  
  // Voice recording state for multiple fields
  const [isRecording, setIsRecording] = useState({
    viewDescription: false,
    findings: false,
    impression: false,
    recommendations: false,
    technicalFactors: false
  });
  
  const [imageUploadMode, setImageUploadMode] = useState<'describe' | 'upload'>('describe');

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
      technicalFactors: '',
      // Use clinic timezone (Africa/Juba) for reportDate to ensure consistent day classification
      reportDate: formatDateInZone(getZonedNow()),
      radiologist: '',
    },
  });
  
  // Refs for voice input
  const viewDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const findingsRef = useRef<HTMLTextAreaElement>(null);
  const impressionRef = useRef<HTMLTextAreaElement>(null);
  const recommendationsRef = useRef<HTMLTextAreaElement>(null);
  const technicalFactorsRef = useRef<HTMLInputElement>(null);
  
  // Recognition instance (shared across all fields)
  const recognitionInstanceRef = useRef<any>(null);

  /* ----------------------------- Data ----------------------------- */

  const { data: allXrayExams = [], refetch: refetchXrayExams } = useXrayExams(dateFilter, customStartDate, customEndDate);
  const { data: radiologyServices = [] } = useServicesByCategory('radiology');
  
  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchXrayExams();
      toast({
        title: "Refreshed",
        description: "X-ray data has been refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh X-ray data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
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
      setSafetyChecklist({ pregnancy: false, metal: false, cooperation: false });
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
        setSafetyChecklist({ pregnancy: false, metal: false, cooperation: false });
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
      // Reset new state variables
      setFindings('');
      setImpression('');
      setRecommendations('');
      setViewDescriptions('');
      setImageUploadMode('describe');
      setUploadedImages([]);
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
        // Reset new state variables
        setFindings('');
        setImpression('');
        setRecommendations('');
        setViewDescriptions('');
        setImageUploadMode('describe');
        setUploadedImages([]);
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
      data: { 
        ...data, 
        status: 'completed',
        viewDescriptions: viewDescriptions, // Include view descriptions in mutation
      },
    });
  };

  const handleXrayExamSelect = (exam: XrayExam) => {
    setSelectedXrayExam(exam);
    setResultsModalOpen(true);
    
    // Set view mode based on completion status
    setViewMode(exam.status === "completed" ? "view" : "edit");
    setUploadedImages([]);
    
    // Set local state for all fields
    setFindings(exam.findings || '');
    setImpression(exam.impression || '');
    setRecommendations(exam.recommendations || '');
    setViewDescriptions(exam.viewDescriptions || ''); // Load saved view descriptions
    setTechnicalFactors(exam.technicalFactors || '');
    setRadiologistName(exam.radiologist || '');
    setImageUploadMode('describe');
    
    resultsForm.reset({
      findings: exam.findings || '',
      impression: exam.impression || '',
      recommendations: exam.recommendations || '',
      imageQuality: exam.imageQuality || 'good',
      technicalFactors: exam.technicalFactors || '',
      // Use clinic timezone (Africa/Juba) for reportDate fallback
      reportDate: exam.reportDate || formatDateInZone(getZonedNow()),
      radiologist: exam.radiologist || '',
    });
  };

  // Helper functions for quick fill
  const addFinding = (text: string) => {
    setFindings(prev => {
      const newValue = prev ? `${prev}\n\n${text}` : text;
      resultsForm.setValue('findings', newValue);
      return newValue;
    });
  };

  const addImpression = (text: string) => {
    setImpression(prev => {
      const newValue = prev ? `${prev}\n${text}` : text;
      resultsForm.setValue('impression', newValue);
      return newValue;
    });
  };

  const addRecommendation = (text: string) => {
    setRecommendations(prev => {
      const newValue = prev ? `${prev}\n${text}` : text;
      resultsForm.setValue('recommendations', newValue);
      return newValue;
    });
  };

  // Voice dictation - multi-field support
  const startVoiceInput = (fieldName: keyof typeof isRecording) => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice dictation is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    // Stop any existing recognition
    if (recognitionInstanceRef.current) {
      recognitionInstanceRef.current.stop();
    }

    // If already recording this field, stop
    if (isRecording[fieldName]) {
      setIsRecording(prev => ({ ...prev, [fieldName]: false }));
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(prev => ({ ...prev, [fieldName]: true }));
      toast({
        title: "🎤 Listening...",
        description: "Speak clearly. Click 'Stop' when done.",
        duration: 2000
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      // Update the appropriate field
      switch(fieldName) {
        case 'viewDescription':
          setViewDescriptions(transcript);
          break;
        case 'findings':
          setFindings(transcript);
          resultsForm.setValue('findings', transcript);
          break;
        case 'impression':
          setImpression(transcript);
          resultsForm.setValue('impression', transcript);
          break;
        case 'recommendations':
          setRecommendations(transcript);
          resultsForm.setValue('recommendations', transcript);
          break;
        case 'technicalFactors':
          setTechnicalFactors(transcript);
          resultsForm.setValue('technicalFactors', transcript);
          break;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(prev => ({ ...prev, [fieldName]: false }));
      toast({
        title: "Error",
        description: `Voice recognition error: ${event.error}`,
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsRecording(prev => ({ ...prev, [fieldName]: false }));
      recognitionInstanceRef.current = null;
    };

    recognitionInstanceRef.current = recognition;
    recognition.start();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionInstanceRef.current) {
        recognitionInstanceRef.current.stop();
      }
    };
  }, []);

  // Copy from previous report
  const copyFromPreviousReport = async () => {
    if (!selectedXrayExam) return;
    
    try {
      // Find previous completed reports for this patient
      const previousReports = completedExams
        .filter(e => e.patientId === selectedXrayExam.patientId && e.examId !== selectedXrayExam.examId)
        .sort((a, b) => new Date(b.requestedDate || 0).getTime() - new Date(a.requestedDate || 0).getTime());
      
      if (previousReports.length > 0) {
        const prev = previousReports[0];
        if (prev.findings) addFinding(prev.findings);
        if (prev.impression) addImpression(prev.impression);
        if (prev.recommendations) addRecommendation(prev.recommendations);
        toast({ title: 'Copied', description: 'Previous report copied successfully' });
      } else {
        toast({ 
          title: 'No Previous Reports', 
          description: 'No previous reports found for this patient',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to copy previous report',
        variant: 'destructive'
      });
    }
  };

  const hasPreviousReports = selectedXrayExam 
    ? completedExams.filter(e => 
        e.patientId === selectedXrayExam.patientId && 
        e.examId !== selectedXrayExam.examId
      ).length > 0
    : false;

  // Print function for X-ray report
  const printXrayReport = () => {
    if (selectedXrayExam && reportPatient) {
      setShowXrayReport(true);
      setTimeout(() => {
        window.print();
        setTimeout(() => setShowXrayReport(false), 500);
      }, 100);
    }
  };

  /* --------------------------- Render ---------------------------- */

  const ExamCard = ({ exam, patient }: { exam: XrayExam; patient?: Patient | null }) => {
    const isPaid = exam.paymentStatus === 'paid';
    const canPerform = exam.status === 'completed' || isPaid;
    const isCompleted = exam.status === 'completed';
    
    return (
      <div
        className={cx(
          "rounded-lg p-2.5 border-l-4 cursor-pointer transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-[0_4px_16px_rgba(37,99,235,0.15)] hover:-translate-y-0.5 group",
          isCompleted && "border-l-emerald-500 bg-white dark:bg-gray-800",
          !isCompleted && isPaid && "border-l-orange-500 bg-white dark:bg-gray-800",
          !isCompleted && !isPaid && "border-l-red-500 bg-red-50/50 dark:bg-red-900/10",
          !canPerform && "opacity-70 hover:shadow-none"
        )}
        onClick={() => canPerform && handleXrayExamSelect(exam)}
        style={!canPerform ? { cursor: "not-allowed" } : {}}
        data-testid={`card-xray-${exam.examId}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Line 1: Patient name + ID chip (left), Status pill + chevron (right) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {patient ? fullName(patient) : exam.patientId}
                </span>
                <Badge className="h-5 px-2 bg-blue-100 text-blue-700 border-0">
                  {exam.patientId}
                </Badge>
                {patient?.patientType === "referral_diagnostic" && (
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-300 dark:border-orange-700 text-xs">
                    External Referral
                  </Badge>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                {isCompleted && (
                  <Badge className="px-1.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                    Completed
                  </Badge>
                )}
                {!isCompleted && isPaid && (
                  <Badge className="px-1.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                    Pending
                  </Badge>
                )}
                {!isCompleted && !isPaid && (
                  <Badge className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white dark:bg-red-600 border-0 shadow-sm">
                    UNPAID
                  </Badge>
                )}
                {canPerform && <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />}
              </div>
            </div>
            
            {/* Line 2: Exam summary without redundant label */}
            <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 truncate">
              {getXrayDisplayName(exam)} • {timeAgo(exam.createdAt)}
            </div>
            
            {/* Line 3: "Ordered by Doctor" badge */}
            {!isCompleted && (
              <div className="mt-1">
                <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-full border border-teal-200 dark:border-teal-800">
                  Ordered by Doctor
                </span>
              </div>
            )}
            
            {/* Line 4: Warning if UNPAID (compact, single line) */}
            {!isPaid && !isCompleted && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-700 dark:text-amber-400 truncate">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="truncate">Payment required before exam</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Memoized handler for safety checklist changes to prevent re-renders and event issues
  const handleSafetyCheckChange = useCallback((itemId: string, checked: boolean) => {
    setSafetyChecklist(prev => ({
      ...prev,
      [itemId]: checked
    }));
  }, []);

  // Check if all safety checks are passed
  const allSafetyChecksPassed = safetyChecklist.pregnancy && safetyChecklist.metal && safetyChecklist.cooperation;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-6 pt-1.5 pb-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Premium Header */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04)]">
          <CardContent className="p-6">
            {/* Top Section: Title + CTA */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                    X-Ray Department
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Radiological imaging and diagnostic services
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 transition-all duration-200 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Pending: <strong>{pendingExams.length}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Completed: <strong>{completedExams.length}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Total: <strong>{allXrayExams.length}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simple ordering notice */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> New orders can only be created from the <strong>Treatment page</strong> by doctors during patient visits. Staff can update results and status for existing orders.
          </p>
        </div>

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
              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                {["today", "yesterday", "last7days", "last30days", "custom"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter as any)}
                    className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                      dateFilter === filter
                        ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-cyan-500 after:shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                        : "text-gray-500 hover:text-blue-500"
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
                  className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-400"
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {pendingExams.length} pending{patientSearchTerm && ` matching "${patientSearchTerm}"`}
              </div>
            </div>
            
            <div className="space-y-2">
              {pendingExams.length > 0 ? (
                pendingExams.map((exam) => (
                  <ExamCard key={exam.examId} exam={exam} patient={patientsMap.data?.[exam.patientId]} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                    <Clock className="w-7 h-7 text-orange-500 dark:text-orange-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select date range"
                      : "All caught up!"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select dates above to view exams."
                      : "No pending exams at the moment."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT – Completed Results (X-Ray) */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              Completed Results (X-Ray)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Same filter controls for completed tests */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                {["today", "yesterday", "last7days", "last30days", "custom"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter as any)}
                    className={`pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative ${
                      dateFilter === filter
                        ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-cyan-500 after:shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                        : "text-gray-500 hover:text-blue-500"
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
                  className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-400"
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {completedExams.length} completed{patientSearchTerm && ` matching "${patientSearchTerm}"`}
              </div>
            </div>
            
            <div className="space-y-2">
              {completedExams.length > 0 ? (
                completedExams.map((exam) => (
                  <ExamCard key={exam.examId} exam={exam} patient={patientsMap.data?.[exam.patientId]} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select date range"
                      : "No completed exams"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select dates above to view exams."
                      : "Completed exams will appear here."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Results/Report Dialog */}
      <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[95vh] overflow-hidden border-0">
          {/* Premium Header with Gradient Background */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 -m-6 mb-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    X-Ray Examination Report
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 text-sm mt-1">
                    Complete radiological findings and diagnosis
                  </DialogDescription>
                </div>
              </div>
              <button 
                onClick={() => setResultsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Exam Type & Body Part Banner */}
            {selectedXrayExam && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-blue-100">
                <Badge className="bg-white/20 text-white border-0 px-3 py-1">
                  {selectedXrayExam.examType.charAt(0).toUpperCase() + selectedXrayExam.examType.slice(1)}
                </Badge>
                {selectedXrayExam.bodyPart && (
                  <Badge className="bg-white/20 text-white border-0 px-3 py-1">
                    {selectedXrayExam.bodyPart}
                  </Badge>
                )}
                <span className="text-sm">
                  Requested: {selectedXrayExam.requestedDate ? new Date(selectedXrayExam.requestedDate).toLocaleDateString() : 'N/A'}
                </span>
                <span className="text-sm">
                  Patient: {reportPatient ? fullName(reportPatient) : selectedXrayExam.patientId}
                </span>
              </div>
            )}
          </div>

          {/* VIEW MODE - Unified diagnostic result UI */}
          {viewMode === "view" && selectedXrayExam && (
            <div className="space-y-4 px-6 pb-6">
              {/* Modal Title */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  X-Ray • {selectedXrayExam.examId}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("edit")}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Edit Results
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={printXrayReport}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>

              {/* Patient + Status Row */}
              <ResultPatientHeader
                patientName={fullName(reportPatient) || selectedXrayExam.patientId}
                patientId={selectedXrayExam.patientId}
                statuses={[
                  { variant: selectedXrayExam.paymentStatus === "paid" ? "paid" : "unpaid" },
                  { variant: "completed" },
                  { variant: "routine" },
                ]}
              />

              {/* Hero Card */}
              <ResultHeaderCard
                modality="xray"
                title={getXrayDisplayName(selectedXrayExam)}
                subtitle={selectedXrayExam.bodyPart || undefined}
                requestedAt={selectedXrayExam.requestedDate}
                completedAt={selectedXrayExam.reportDate}
                status="completed"
              />

              {/* Radiological Findings Section */}
              {selectedXrayExam.findings && (
                <ResultSectionCard
                  title="Radiological Findings"
                  tone="accent-blue"
                >
                  <div className="whitespace-pre-wrap">{selectedXrayExam.findings}</div>
                </ResultSectionCard>
              )}

              {/* Technical Details Section */}
              {(selectedXrayExam.viewDescriptions || selectedXrayExam.technicalFactors || selectedXrayExam.imageQuality) && (
                <ResultSectionCard
                  title="Technical Details"
                  tone="neutral"
                >
                  <div className="space-y-2 text-sm">
                    {selectedXrayExam.viewDescriptions && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Views Obtained:</span>
                        <div className="mt-1 whitespace-pre-wrap text-gray-600 dark:text-gray-400">{selectedXrayExam.viewDescriptions}</div>
                      </div>
                    )}
                    {selectedXrayExam.imageQuality && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Image Quality:</span>{' '}
                        <span className={cx(
                          "font-semibold",
                          selectedXrayExam.imageQuality === "excellent" && "text-green-600 dark:text-green-400",
                          selectedXrayExam.imageQuality === "good" && "text-blue-600 dark:text-blue-400",
                          selectedXrayExam.imageQuality === "adequate" && "text-yellow-600 dark:text-yellow-400",
                          selectedXrayExam.imageQuality === "limited" && "text-red-600 dark:text-red-400"
                        )}>
                          {selectedXrayExam.imageQuality.charAt(0).toUpperCase() + selectedXrayExam.imageQuality.slice(1)}
                        </span>
                      </div>
                    )}
                    {selectedXrayExam.technicalFactors && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Technical Factors:</span>
                        <div className="mt-1 whitespace-pre-wrap text-gray-600 dark:text-gray-400">{selectedXrayExam.technicalFactors}</div>
                      </div>
                    )}
                  </div>
                </ResultSectionCard>
              )}

              {/* Impression / Key Findings using KeyFindingCard */}
              {selectedXrayExam.impression && (
                <KeyFindingCard
                  severity={(() => {
                    const imp = selectedXrayExam.impression.toLowerCase();
                    // Check for critical/abnormal indicators
                    if (imp.includes("fracture") || imp.includes("pneumothorax") || imp.includes("mass") || 
                        imp.includes("acute") || imp.includes("emergency") || imp.includes("urgent") ||
                        imp.includes("cardiomegaly") || imp.includes("consolidation") || imp.includes("effusion")) {
                      return "critical";
                    }
                    // Check for attention indicators
                    if (imp.includes("mild") || imp.includes("borderline") || imp.includes("degenerative") ||
                        imp.includes("chronic") || imp.includes("follow") || imp.includes("correlation")) {
                      return "attention";
                    }
                    // Check for normal indicators
                    if (imp.includes("normal") || imp.includes("no acute") || imp.includes("unremarkable") ||
                        imp.includes("clear") || imp.includes("negative")) {
                      return "normal";
                    }
                    // Default to attention if can't determine
                    return "attention";
                  })()}
                  title="Impression / Key Findings"
                  summary={selectedXrayExam.impression}
                />
              )}

              {/* Recommendations Section */}
              {selectedXrayExam.recommendations && (
                <ResultSectionCard
                  title="Recommendations"
                  tone="accent-amber"
                >
                  <div className="whitespace-pre-wrap">{selectedXrayExam.recommendations}</div>
                </ResultSectionCard>
              )}
            </div>
          )}

          {/* EDIT MODE */}
          {viewMode === "edit" && (
          <Form {...resultsForm}>
            <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-6 overflow-y-auto max-h-[calc(95vh-250px)] px-6">
              
              {/* Tabs for Describe Views vs Upload Images */}
              <Tabs value={imageUploadMode} onValueChange={(v) => setImageUploadMode(v as 'describe' | 'upload')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="describe" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Describe X-Ray Views
                  </TabsTrigger>
                  <TabsTrigger value="upload">📤 Upload Images</TabsTrigger>
                </TabsList>
                
                <TabsContent value="describe" className="mt-4">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-900 dark:text-green-100">Describe X-Ray Views</h3>
                        <p className="text-xs text-green-700 dark:text-green-300">Document image details without uploading files</p>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Describe X-Ray Views
                        </label>
                        <Button 
                          type="button"
                          size="sm" 
                          variant="outline"
                          onClick={() => startVoiceInput('viewDescription')}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Mic className={`w-3 h-3 mr-1 ${isRecording.viewDescription ? 'animate-pulse text-red-500' : ''}`} />
                          {isRecording.viewDescription ? 'Stop' : 'Dictate'}
                        </Button>
                      </div>
                      
                      <Textarea
                        ref={viewDescriptionRef}
                        placeholder="Example: AP and Lateral views obtained. Patient positioning adequate. Good penetration and exposure..."
                        value={viewDescriptions}
                        onChange={(e) => setViewDescriptions(e.target.value)}
                        rows={4}
                        className="w-full bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="upload" className="mt-4">
                  {/* Premium Image Upload Section */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">X-Ray Images (Optional)</h3>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Upload radiological films or digital images (max 10 files)</p>
                      </div>
                    </div>
                    
                    <ObjectUploader
                      maxNumberOfFiles={10}
                      maxFileSize={20971520}
                      accept="image/*,.dcm"
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
                          const newImages = uploadedFiles.map((file, idx) => ({
                            url: file.url,
                            name: `X-Ray ${uploadedImages.length + idx + 1}`
                          }));
                          setUploadedImages([...uploadedImages, ...newImages]);
                          toast({ title: 'Success', description: `${uploadedFiles.length} image(s) uploaded successfully` });
                        }
                      }}
                      buttonClassName="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Upload X-Ray Images
                    </ObjectUploader>
                    
                    {/* Image Gallery */}
                    {uploadedImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-3">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border-2 border-blue-300 dark:border-blue-700 shadow-md hover:shadow-xl transition-all">
                            <img src={img.url} alt={img.name} className="w-full h-24 object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => window.open(img.url, '_blank')}
                                className="p-2 rounded-lg text-white hover:bg-white/20 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                                className="p-2 rounded-lg text-white hover:bg-white/20 transition-all"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Interactive Finding Builder System */}
              <FormField
                control={resultsForm.control}
                name="findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Radiological Findings
                    </FormLabel>
                    
                    {/* EXTREMITY X-RAY FINDING BUILDER */}
                    {selectedXrayExam?.examType === 'extremities' && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Quick Findings Builder (Click to Add)</h4>
                        </div>
                        
                        {/* Bone Assessment */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Bone Integrity:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("No fracture identified. Bone cortex intact.")}
                              className="border-green-300 hover:bg-green-50 hover:border-green-500 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              No Fracture
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Fracture identified at [specify location]. [Describe displacement/angulation].")}
                              className="border-red-300 hover:bg-red-50 hover:border-red-500 text-xs"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Fracture Present
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Dislocation noted at [joint]. No associated fracture.")}
                              className="border-orange-300 hover:bg-orange-50 hover:border-orange-500 text-xs"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Dislocation
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Normal bone alignment and density.")}
                              className="border-green-300 hover:bg-green-50 hover:border-green-500 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Normal Alignment
                            </Button>
                          </div>
                        </div>
                        
                        {/* Joint Assessment */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Joint Space:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Joint spaces preserved. No effusion.")}
                              className="border-green-300 hover:bg-green-50 hover:border-green-500 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Normal Joint Space
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Joint effusion present suggesting inflammation or hemarthrosis.")}
                              className="border-blue-300 hover:bg-blue-50 hover:border-blue-500 text-xs"
                            >
                              💧 Effusion
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Degenerative changes with joint space narrowing and osteophyte formation.")}
                              className="border-amber-300 hover:bg-amber-50 hover:border-amber-500 text-xs"
                            >
                              🦴 Arthritis
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Bone spur formation noted.")}
                              className="border-gray-300 hover:bg-gray-50 text-xs"
                            >
                              Bone Spurs
                            </Button>
                          </div>
                        </div>
                        
                        {/* Soft Tissue */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Soft Tissues:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Soft tissues unremarkable. No swelling or masses.")}
                              className="border-green-300 hover:bg-green-50 hover:border-green-500 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Normal
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Soft tissue swelling present consistent with trauma/inflammation.")}
                              className="border-orange-300 hover:bg-orange-50 hover:border-orange-500 text-xs"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Swelling
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("No radiopaque foreign body visualized.")}
                              className="border-green-300 hover:bg-green-50 hover:border-green-500 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              No Foreign Body
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => addFinding("Radiopaque foreign body identified at [location].")}
                              className="border-red-300 hover:bg-red-50 hover:border-red-500 text-xs"
                            >
                              ⚠️ Foreign Body
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* CHEST X-RAY FINDING BUILDER */}
                    {selectedXrayExam?.examType === 'chest' && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Quick Findings Builder (Click to Add)</h4>
                        </div>
                        
                        {/* Lungs */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Lungs:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Lungs clear. No infiltrates or masses.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Clear Lungs
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Infiltrate seen in [location] consistent with pneumonia.")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Infiltrate/Pneumonia
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Pleural effusion present on [left/right] side.")} className="border-blue-300 hover:bg-blue-50 text-xs">
                              💧 Pleural Effusion
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Pulmonary mass/nodule identified requiring further evaluation.")} className="border-red-300 hover:bg-red-50 text-xs">
                              ⚠️ Mass/Nodule
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Pneumothorax noted on [left/right] side.")} className="border-red-300 hover:bg-red-50 text-xs">
                              ⚠️ Pneumothorax
                            </Button>
                          </div>
                        </div>
                        
                        {/* Heart */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Heart & Mediastinum:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Heart size normal. Cardiothoracic ratio <0.5.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Heart Size
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Cardiomegaly present. Cardiothoracic ratio >0.5.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              ❤️ Cardiomegaly
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Mediastinal widening noted.")} className="border-red-300 hover:bg-red-50 text-xs">
                              ⚠️ Mediastinal Widening
                            </Button>
                          </div>
                        </div>
                        
                        {/* Bones */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Bones & Soft Tissues:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Ribs, clavicles, and visible spine intact.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Intact Bones
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Rib fracture identified at [location].")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Rib Fracture
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Subcutaneous emphysema present.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              ⚠️ Subcutaneous Emphysema
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* ABDOMINAL X-RAY FINDING BUILDER */}
                    {selectedXrayExam?.examType === 'abdomen' && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Quick Findings Builder (Click to Add)</h4>
                        </div>
                        
                        {/* Bowel Gas */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Bowel Gas Pattern:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Normal bowel gas pattern. No obstruction.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Pattern
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Dilated bowel loops consistent with obstruction.")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Obstruction
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Air-fluid levels present suggesting obstruction or ileus.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              ⚠️ Air-Fluid Levels
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Free air under diaphragm indicating perforation.")} className="border-red-300 hover:bg-red-50 text-xs">
                              🚨 Free Air (Perforation)
                            </Button>
                          </div>
                        </div>
                        
                        {/* Organs */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Solid Organs:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Liver, spleen, and kidneys normal in size and position.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Organs
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Hepatomegaly noted.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              Enlarged Liver
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Splenomegaly present.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              Enlarged Spleen
                            </Button>
                          </div>
                        </div>
                        
                        {/* Calcifications */}
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Calcifications/Stones:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("No renal or gallstones visualized.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> No Stones
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Renal calculus identified in [location].")} className="border-red-300 hover:bg-red-50 text-xs">
                              💎 Kidney Stone
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Gallstones present in gallbladder region.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              💎 Gallstones
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* SPINE X-RAY FINDING BUILDER */}
                    {selectedXrayExam?.examType === 'spine' && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Quick Findings Builder (Click to Add)</h4>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Alignment:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Normal vertebral alignment maintained.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Alignment
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Scoliosis present with [direction] curvature.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              ⚠️ Scoliosis
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Listhesis noted at [level].")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Listhesis
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Disc Spaces:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Disc spaces preserved throughout.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Disc Spaces
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Disc space narrowing at [level] suggesting degeneration.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              Disc Narrowing
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Vertebral Bodies:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Vertebral bodies intact with normal height and density.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Vertebrae
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Compression fracture at [level].")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Compression Fracture
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Osteophyte formation consistent with degenerative changes.")} className="border-amber-300 hover:bg-amber-50 text-xs">
                              Osteophytes
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* SKULL X-RAY FINDING BUILDER */}
                    {selectedXrayExam?.examType === 'skull' && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Quick Findings Builder (Click to Add)</h4>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Calvarium:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Calvarium intact. No fracture lines identified.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Intact Calvarium
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Skull fracture identified at [location].")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Skull Fracture
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Sinuses & Facial Bones:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Paranasal sinuses clear. Facial bones intact.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Sinuses
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Sinus opacification suggesting sinusitis.")} className="border-orange-300 hover:bg-orange-50 text-xs">
                              Sinusitis
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Facial bone fracture at [location].")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Facial Fracture
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* PELVIC X-RAY FINDING BUILDER */}
                    {selectedXrayExam?.examType === 'pelvis' && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Quick Findings Builder (Click to Add)</h4>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Pelvic Bones:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Pelvic bones intact with normal alignment.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Pelvis
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Pelvic fracture identified at [location].")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Pelvic Fracture
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                            Hip Joints:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Hip joints preserved bilaterally.")} className="border-green-300 hover:bg-green-50 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Normal Hips
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Hip dislocation on [left/right] side.")} className="border-red-300 hover:bg-red-50 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Hip Dislocation
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => addFinding("Degenerative changes in hip joint with space narrowing.")} className="border-amber-300 hover:bg-amber-50 text-xs">
                              Hip Arthritis
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Radiological Findings
                        </label>
                        <Button 
                          type="button"
                          size="sm" 
                          variant="outline"
                          onClick={() => startVoiceInput('findings')}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Mic className={`w-3 h-3 mr-1 ${isRecording.findings ? 'animate-pulse text-red-500' : ''}`} />
                          {isRecording.findings ? 'Stop' : 'Dictate'}
                        </Button>
                      </div>
                      
                      <FormControl>
                        <Textarea
                          ref={findingsRef}
                          placeholder="Click buttons above to add findings, or type/dictate here..."
                          value={findings}
                          onChange={(e) => {
                            setFindings(e.target.value);
                            field.onChange(e.target.value);
                          }}
                          rows={8}
                          className="font-mono text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200"
                          data-testid="textarea-findings"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Clinical Impression & Recommendations - Collapsible Accordions */}
              <Accordion type="multiple" className="w-full space-y-4">
                
                {/* Clinical Impression - Collapsible */}
                <AccordionItem value="impression" className="border-2 border-purple-100 rounded-xl overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:bg-purple-50 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-gray-900">Clinical Impression</span>
                      <Badge variant="outline" className="ml-2 text-xs border-purple-300 text-purple-700">
                        Click to expand
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4">
                    <FormField
                      control={resultsForm.control}
                      name="impression"
                      render={({ field }) => (
                        <FormItem>
                          {/* Quick Templates */}
                          <div className="mb-3">
                            <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2 block">
                              Quick Templates:
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => setImpression("No acute fracture, dislocation, or other bony abnormality. Normal study.")} className="border-green-300 hover:bg-green-50 text-xs justify-start">
                                ✅ Normal Study
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setImpression("Fracture of [specify bone] requiring orthopedic evaluation and management.")} className="border-red-300 hover:bg-red-50 text-xs justify-start">
                                🦴 Fracture
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setImpression("Degenerative changes consistent with osteoarthritis.")} className="border-amber-300 hover:bg-amber-50 text-xs justify-start">
                                🦴 Arthritis
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setImpression("Soft tissue injury without associated bony abnormality.")} className="border-blue-300 hover:bg-blue-50 text-xs justify-start">
                                🩹 Soft Tissue
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setImpression("Pneumonia/infiltrate seen in [location]. Clinical correlation advised.")} className="border-red-300 hover:bg-red-50 text-xs justify-start">
                                🫁 Pneumonia
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setImpression("Suspicious finding requiring further evaluation.")} className="border-orange-300 hover:bg-orange-50 text-xs justify-start">
                                ⚠️ Suspicious
                              </Button>
                            </div>
                          </div>
                          
                          {/* Voice Dictation + Textarea */}
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-700">Summary Impression</label>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline"
                              onClick={() => startVoiceInput('impression')}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Mic className={`w-3 h-3 mr-1 ${isRecording.impression ? 'animate-pulse text-red-500' : ''}`} />
                              {isRecording.impression ? 'Stop' : 'Dictate'}
                            </Button>
                          </div>
                          
                          <FormControl>
                            <Textarea
                              ref={impressionRef}
                              value={impression}
                              onChange={(e) => {
                                setImpression(e.target.value);
                                field.onChange(e.target.value);
                              }}
                              rows={4}
                              placeholder="Summary diagnosis and impression..."
                              className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200"
                              data-testid="textarea-impression"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                {/* Recommendations - Collapsible */}
                <AccordionItem value="recommendations" className="border-2 border-green-100 rounded-xl overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:bg-green-50 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Recommendations</span>
                      <Badge variant="outline" className="ml-2 text-xs border-green-300 text-green-700">
                        Click to expand
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4">
                    <FormField
                      control={resultsForm.control}
                      name="recommendations"
                      render={({ field }) => (
                        <FormItem>
                          {/* Quick Add Buttons */}
                          <div className="mb-3">
                            <label className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 block">
                              Quick Add:
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => addRecommendation("No further imaging required at this time.")} className="text-xs border-green-300 hover:bg-green-50">
                                ✅ No Follow-up
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => addRecommendation("Follow-up X-ray in 4-6 weeks to assess healing.")} className="text-xs border-blue-300 hover:bg-blue-50">
                                📅 Follow-up XR
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => addRecommendation("CT scan recommended for better anatomical detail.")} className="text-xs border-blue-300 hover:bg-blue-50">
                                🔍 CT Scan
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => addRecommendation("MRI recommended for soft tissue evaluation.")} className="text-xs border-purple-300 hover:bg-purple-50">
                                🧲 MRI
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => addRecommendation("Ultrasound for further characterization.")} className="text-xs border-cyan-300 hover:bg-cyan-50">
                                🔊 Ultrasound
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => addRecommendation("Clinical correlation recommended.")} className="text-xs border-amber-300 hover:bg-amber-50">
                                💡 Clinical Correlation
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => addRecommendation("Orthopedic consultation recommended.")} className="text-xs border-orange-300 hover:bg-orange-50">
                                👨‍⚕️ Ortho Consult
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => addRecommendation("Urgent surgical consultation required.")} className="text-xs border-red-300 hover:bg-red-50">
                                🚨 Urgent Surgery
                              </Button>
                            </div>
                          </div>
                          
                          {/* Voice Dictation + Textarea */}
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-700">Follow-up Plan</label>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline"
                              onClick={() => startVoiceInput('recommendations')}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Mic className={`w-3 h-3 mr-1 ${isRecording.recommendations ? 'animate-pulse text-red-500' : ''}`} />
                              {isRecording.recommendations ? 'Stop' : 'Dictate'}
                            </Button>
                          </div>
                          
                          <FormControl>
                            <Textarea
                              ref={recommendationsRef}
                              value={recommendations}
                              onChange={(e) => {
                                setRecommendations(e.target.value);
                                field.onChange(e.target.value);
                              }}
                              rows={4}
                              placeholder="Follow-up recommendations, additional imaging..."
                              className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200"
                              data-testid="textarea-recommendations"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
                
              </Accordion>

              {/* Image Quality & Technical Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={resultsForm.control}
                  name="imageQuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Image Quality
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200" data-testid="select-image-quality">
                            <SelectValue placeholder="Select quality..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent - Diagnostic quality</SelectItem>
                          <SelectItem value="good">Good - Minor limitations</SelectItem>
                          <SelectItem value="adequate">Fair - Suboptimal but diagnostic</SelectItem>
                          <SelectItem value="limited">Poor - Limited diagnostic value</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={resultsForm.control}
                  name="technicalFactors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Technical Factors
                      </FormLabel>
                      <FormControl>
                        <Input
                          ref={technicalFactorsRef}
                          value={technicalFactors}
                          onChange={(e) => {
                            setTechnicalFactors(e.target.value);
                            field.onChange(e.target.value);
                          }}
                          placeholder="kVp, mAs, positioning notes..."
                          className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Radiologist Signature & Report Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={resultsForm.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Report Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200" data-testid="input-report-date" />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Radiologist Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          value={radiologistName}
                          onChange={(e) => {
                            setRadiologistName(e.target.value);
                            field.onChange(e.target.value);
                          }}
                          placeholder="Enter radiologist name" 
                          className="focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200 text-sm" 
                          data-testid="input-radiologist" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-blue-100 dark:border-blue-900">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedXrayExam && reportPatient) {
                      setShowXrayReport(true);
                      setTimeout(() => window.print(), 100);
                    }
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 min-h-[44px]"
                  data-testid="button-print-report"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResultsModalOpen(false);
                      setSelectedXrayExam(null);
                      setUploadedImages([]);
                    }}
                    className="min-h-[44px]"
                    data-testid="button-cancel-report"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateXrayExamMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg min-h-[44px]"
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
          )}
        </DialogContent>
      </Dialog>

      {/* Print Report (hidden) - STANDARDIZED PREMIUM DESIGN */}
      {showXrayReport && selectedXrayExam && reportPatient && (
        <div id="xray-report-print" className="print-only">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #xray-report-print, #xray-report-print * { visibility: visible; }
              #xray-report-print { position: absolute; left: 0; top: 0; width: 100%; max-height: 273mm; overflow: hidden; }
              @page { size: A4; margin: 12mm 15mm; }
            }
          `}</style>
          {/* Premium Professional Report with Border - MATCHES INVOICE */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <div className="p-6 max-w-4xl mx-auto bg-white">
              
              {/* HEADER - IDENTICAL TO INVOICE */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-blue-900">Bahr El Ghazal Clinic</h1>
                  <p className="text-sm text-gray-600 italic">Excellence in Healthcare</p>
                  <p className="text-xs text-gray-600 mt-1">Aweil, South Sudan</p>
                  <p className="text-xs text-gray-600">Tel: +211916759060/+211928754760</p>
                  <p className="text-xs text-gray-600">Email: bahr.ghazal.clinic@gmail.com</p>
                </div>
                <div className="w-24 h-24">
                  <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* TITLE WITH ACCENT BAR - MATCHES INVOICE */}
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">RADIOLOGY REPORT</h2>
                <div className="h-1 bg-gradient-to-r from-blue-900 to-blue-800 mt-2" />
              </div>

              {/* Patient & Exam Information Cards - Side by Side like Invoice */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Patient Information Box */}
                <div className="border border-gray-300 shadow-sm rounded p-2 bg-blue-50">
                  <h3 className="font-bold text-sm mb-1 text-gray-800 border-b border-blue-900 pb-1">
                    PATIENT INFORMATION
                  </h3>
                  <div className="space-y-1 leading-tight">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Name:</span>
                      <span className="text-xs font-bold text-gray-900">{fullName(reportPatient)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Patient ID:</span>
                      <span className="text-xs font-medium text-gray-900">{reportPatient.patientId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Age:</span>
                      <span className="text-xs font-medium text-gray-900">{reportPatient.age}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Gender:</span>
                      <span className="text-xs font-medium text-gray-900">{reportPatient.gender}</span>
                    </div>
                  </div>
                </div>

                {/* Exam Information Box */}
                <div className="border border-gray-300 shadow-sm rounded p-2 bg-gray-50">
                  <h3 className="font-bold text-sm mb-1 text-gray-800 border-b border-blue-900 pb-1">
                    EXAMINATION DETAILS
                  </h3>
                  <div className="space-y-1 leading-tight">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Exam ID:</span>
                      <span className="text-xs font-bold text-blue-900">{selectedXrayExam.examId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Exam Type:</span>
                      <span className="text-xs font-medium capitalize">{selectedXrayExam.examType} X-Ray</span>
                    </div>
                    {selectedXrayExam.bodyPart && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">Body Part:</span>
                        <span className="text-xs font-medium capitalize">{selectedXrayExam.bodyPart}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Image Quality:</span>
                      <span className="text-xs font-medium capitalize">{resultsForm.getValues('imageQuality')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Descriptions - If Present */}
              {viewDescriptions && (
                <div className="mb-3 border border-gray-300 rounded p-2 bg-gray-50">
                  <h3 className="font-bold text-xs mb-1 text-gray-800">Views Obtained:</h3>
                  <p className="text-xs text-gray-700 whitespace-pre-line">{viewDescriptions}</p>
                </div>
              )}

              {/* Radiological Findings */}
              <div className="mb-3 border border-gray-300 rounded p-2 bg-white">
                <h3 className="font-bold text-sm mb-1 text-gray-800 border-b-2 border-gray-400 pb-1 uppercase">
                  Radiological Findings
                </h3>
                <p className="text-xs text-gray-900 whitespace-pre-line leading-relaxed mt-1">
                  {resultsForm.getValues('findings') || 'No findings documented.'}
                </p>
              </div>

              {/* Impression / Key Findings */}
              <div className="mb-3 border-2 border-blue-900 rounded p-2 bg-blue-50">
                <h3 className="font-bold text-sm mb-1 text-blue-900 uppercase">
                  Impression
                </h3>
                <p className="text-xs text-gray-900 whitespace-pre-line leading-relaxed font-semibold">
                  {resultsForm.getValues('impression') || 'Pending interpretation.'}
                </p>
              </div>

              {/* Recommendations - If Present */}
              {resultsForm.getValues('recommendations') && (
                <div className="mb-3 border border-gray-300 rounded p-2 bg-amber-50">
                  <h3 className="font-bold text-xs mb-1 text-gray-800 uppercase">Recommendations:</h3>
                  <p className="text-xs text-gray-700 whitespace-pre-line">{resultsForm.getValues('recommendations')}</p>
                </div>
              )}

              {/* Technical Factors - If Present */}
              {selectedXrayExam.technicalFactors && (
                <div className="mb-3 border border-gray-300 rounded p-2 bg-gray-50">
                  <h3 className="font-bold text-xs mb-1 text-gray-800">Technical Factors:</h3>
                  <p className="text-xs text-gray-700">{selectedXrayExam.technicalFactors}</p>
                </div>
              )}

              {/* SIGNATURE SECTION - MATCHES INVOICE */}
              <div className="grid grid-cols-2 gap-12 mt-6 mb-4">
                <div>
                  <div className="border-t-2 border-gray-800 pt-2 mt-20">
                    <p className="text-sm font-bold">Radiologist:</p>
                    <p className="text-xs text-gray-600">{resultsForm.getValues('radiologist') || 'Radiology Department'}</p>
                  </div>
                </div>
                <div>
                  <div className="border-t-2 border-gray-800 pt-2 mt-20">
                    <p className="text-sm font-bold">Date:</p>
                    <p className="text-xs text-gray-600">{resultsForm.getValues('reportDate')}</p>
                  </div>
                </div>
              </div>

              {/* FOOTER - IDENTICAL TO INVOICE */}
              <div className="text-center text-xs text-gray-600 border-t pt-3 mt-4">
                <p className="font-semibold">THIS IS A COMPUTER-GENERATED RADIOLOGY REPORT</p>
                <p className="font-semibold mt-1">Bahr El Ghazal Clinic</p>
                <p>Accredited Medical Facility | Republic of South Sudan</p>
                <p className="mt-1 italic">Your health is our priority</p>
              </div>
              
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Scrollbar Styling */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgb(224 242 254);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgb(125 211 252);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgb(6 182 212);
        }
      `}</style>
      </div>
    </div>
  );
}
