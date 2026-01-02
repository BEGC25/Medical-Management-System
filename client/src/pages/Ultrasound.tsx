import { useEffect, useMemo, useState, useRef } from 'react';
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
  X,
  Heart,
  Baby,
  Stethoscope,
  Bone,
  Lungs,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  const [examType, setExamType] = useState('abdominal');

  // Results state
  const [selectedUltrasoundExam, setSelectedUltrasoundExam] = useState<UltrasoundExam | null>(null);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string }>>([]);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [technicalDetails, setTechnicalDetails] = useState('');
  const [sonographerName, setSonographerName] = useState('');
  
  // Voice recording state for multiple fields
  const [isRecording, setIsRecording] = useState({
    technicalDetails: false,
    findings: false,
    impression: false,
    recommendations: false,
  });
  
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'describe'>('upload');

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

  // Refs for voice input
  const technicalDetailsRef = useRef<HTMLTextAreaElement>(null);
  const findingsRef = useRef<HTMLTextAreaElement>(null);
  const impressionRef = useRef<HTMLTextAreaElement>(null);
  const recommendationsRef = useRef<HTMLTextAreaElement>(null);
  
  // Recognition instance (shared across all fields)
  const recognitionInstanceRef = useRef<any>(null);

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
    setUploadedImages([]);
    
    // Set local state for all fields
    setFindings(exam.findings || '');
    setImpression(exam.impression || '');
    setRecommendations(exam.recommendations || '');
    setTechnicalDetails('');
    setSonographerName(exam.sonographer || '');
    setImageUploadMode('upload');
    
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
        case 'technicalDetails':
          setTechnicalDetails(transcript);
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
    if (!selectedUltrasoundExam) return;
    
    try {
      // Find previous completed reports for this patient
      const previousReports = completedExams
        .filter(e => e.patientId === selectedUltrasoundExam.patientId && e.examId !== selectedUltrasoundExam.examId)
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

  const hasPreviousReports = selectedUltrasoundExam 
    ? completedExams.filter(e => 
        e.patientId === selectedUltrasoundExam.patientId && 
        e.examId !== selectedUltrasoundExam.examId
      ).length > 0
    : false;

  /* --------------------------- Render ---------------------------- */

  const ExamCard = ({ exam, patient }: { exam: UltrasoundExam; patient?: Patient | null }) => {
    const isPaid = exam.paymentStatus === 'paid';
    const canPerform = exam.status === 'completed' || isPaid;
    const isCompleted = exam.status === 'completed';
    
    return (
      <div
        className={cx(
          "rounded-lg p-2.5 border-l-4 cursor-pointer transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-[0_4px_16px_rgba(99,102,241,0.15)] hover:-translate-y-0.5 group",
          isCompleted && "border-l-emerald-500 bg-white dark:bg-gray-800",
          !isCompleted && isPaid && "border-l-orange-500 bg-white dark:bg-gray-800",
          !isCompleted && !isPaid && "border-l-red-500 bg-red-50/50 dark:bg-red-900/10",
          !canPerform && "opacity-70 hover:shadow-none"
        )}
        onClick={() => canPerform && handleUltrasoundExamSelect(exam)}
        style={!canPerform ? { cursor: "not-allowed" } : {}}
        data-testid={`card-ultrasound-${exam.examId}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Line 1: Patient name + ID chip (left), Status pill + chevron (right) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {patient ? fullName(patient) : exam.patientId}
                </span>
                <Badge className="h-5 px-2 bg-indigo-100 text-indigo-700 border-0">
                  {exam.patientId}
                </Badge>
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
                {canPerform && <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />}
              </div>
            </div>
            
            {/* Line 2: Exam summary without redundant label */}
            <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 truncate">
              {exam.examType} • {timeAgo(exam.requestedDate)}
            </div>
            
            {/* Line 3: Warning if UNPAID (compact, single line) */}
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                  <Waves className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                    Ultrasound Department
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Advanced diagnostic imaging and ultrasound services
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setRequestOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                data-testid="button-new-request"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
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
                <Waves className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-gray-600">Total: <strong>{allUltrasoundExams.length}</strong></span>
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

      {/* New Request Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-100">
          
          {/* Premium Header with Gradient Background */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white p-6 -m-6 mb-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                  <Waves className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    New Ultrasound Examination Request
                  </DialogTitle>
                  <DialogDescription className="text-indigo-100 text-sm mt-1">
                    Submit an ultrasound imaging request for diagnostic evaluation
                  </DialogDescription>
                </div>
              </div>
              <button 
                onClick={() => setRequestOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-6 overflow-y-auto max-h-[calc(95vh-200px)] px-6">
              {/* Premium Patient Selection */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Select Patient
                </label>
                
                {!selectedPatient ? (
                  <>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className="pl-10 border-2 border-indigo-200 focus:border-indigo-500"
                        placeholder="Search patients by name or ID (press / to focus)..."
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        data-testid="input-patient-search"
                      />
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-50">
                      {(term.trim() ? visibleSearch : visibleToday).map((patient) => (
                        <div
                          key={patient.patientId}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setTerm('');
                          }}
                          className="group relative overflow-hidden rounded-xl border-2 border-gray-100 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm p-4"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/50 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                              </div>
                              
                              <div>
                                <div className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                  {fullName(patient)}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <Badge className="h-5 px-2 bg-indigo-100 text-indigo-700 border-0">
                                    {patient.patientId}
                                  </Badge>
                                  <span>{patient.age}y</span>
                                  <span className="capitalize">{patient.gender}</span>
                                </div>
                              </div>
                            </div>
                            
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                        {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-900">{fullName(selectedPatient)}</p>
                        <p className="text-sm text-indigo-700">ID: {selectedPatient.patientId}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedPatient(null)}
                      className="border-indigo-400 text-indigo-700 hover:bg-indigo-100"
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Visual Exam Type Selector */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Waves className="w-4 h-4 text-indigo-600" />
                  Examination Type
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'cardiac', label: 'Cardiac/Echo', icon: '🫀', description: 'Heart & vessels' },
                    { value: 'obstetric', label: 'Obstetric', icon: '🤰', description: 'Pregnancy imaging' },
                    { value: 'abdominal', label: 'Abdominal', icon: '🫄', description: 'Abdomen & organs' },
                    { value: 'musculoskeletal', label: 'Musculoskeletal', icon: '🦴', description: 'Bones & joints' },
                    { value: 'thoracic', label: 'Thoracic', icon: '🫁', description: 'Chest & lungs' },
                    { value: 'vascular', label: 'Vascular', icon: '🧠', description: 'Blood vessels' },
                    { value: 'pelvic', label: 'Pelvic', icon: '🩺', description: 'Pelvic organs' },
                    { value: 'other', label: 'Other/Custom', icon: '🎯', description: 'Custom exam' },
                  ].map((exam) => (
                    <button
                      key={exam.value}
                      type="button"
                      onClick={() => {
                        setExamType(exam.value);
                        form.setValue('examType', exam.value);
                      }}
                      className={`
                        relative overflow-hidden rounded-xl p-4 border-2 transition-all duration-300 text-left min-h-[100px]
                        ${examType === exam.value
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg shadow-indigo-500/20 scale-105'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md hover:scale-102'
                        }
                      `}
                    >
                      <div className="text-3xl mb-2">{exam.icon}</div>
                      <div className={`text-sm font-semibold mb-1 ${
                        examType === exam.value ? 'text-indigo-700' : 'text-gray-700'
                      }`}>
                        {exam.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {exam.description}
                      </div>
                      
                      {examType === exam.value && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Exam Presets */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Common Exam Presets
                </label>
                
                <div className="flex gap-2 flex-wrap">
                  {[
                    { 
                      name: 'First Trimester Scan', 
                      icon: '👶',
                      examType: 'obstetric',
                      indication: 'First trimester pregnancy evaluation - confirm intrauterine pregnancy, gestational age assessment, fetal viability'
                    },
                    { 
                      name: 'Anatomy Scan (20w)', 
                      icon: '🤰',
                      examType: 'obstetric',
                      indication: 'Mid-trimester anatomy survey at 20 weeks - detailed fetal anatomical evaluation'
                    },
                    { 
                      name: 'RUQ - Liver/GB', 
                      icon: '🫄',
                      examType: 'abdominal',
                      indication: 'Right upper quadrant pain - evaluate liver, gallbladder, bile ducts for stones, inflammation'
                    },
                    { 
                      name: 'Renal Ultrasound', 
                      icon: '🔍',
                      examType: 'abdominal',
                      indication: 'Evaluate kidneys for stones, obstruction, masses, or infection'
                    },
                    { 
                      name: 'Transthoracic Echo', 
                      icon: '🫀',
                      examType: 'cardiac',
                      indication: 'Evaluate cardiac function, chamber sizes, valvular function, ejection fraction'
                    },
                    { 
                      name: 'Carotid Doppler', 
                      icon: '🧠',
                      examType: 'vascular',
                      indication: 'Carotid artery stenosis evaluation - assess for atherosclerotic disease'
                    },
                    { 
                      name: 'DVT Lower Extremity', 
                      icon: '🦵',
                      examType: 'vascular',
                      indication: 'Rule out deep vein thrombosis in lower extremity - assess venous flow and compressibility'
                    },
                  ].map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExamType(preset.examType);
                        form.setValue('examType', preset.examType);
                        form.setValue('clinicalIndication', preset.indication);
                      }}
                      className="border-2 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-500 hover:shadow-md transition-all"
                    >
                      <span className="mr-1.5">{preset.icon}</span>
                      <Plus className="w-3 h-3 mr-1" />
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

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

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRequestOpen(false);
                    setSelectedPatient(null);
                    form.reset();
                  }}
                  className="border-gray-300 hover:bg-gray-50 min-h-[44px] w-full sm:w-auto"
                  data-testid="button-cancel-request"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedPatient || createUltrasoundExamMutation.isPending}
                  className="bg-gradient-to-r from-indigo-600 to-purple-500 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] text-white font-semibold min-h-[44px] w-full sm:w-auto"
                  data-testid="button-submit-request"
                >
                  {createUltrasoundExamMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Ultrasound Request'
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
