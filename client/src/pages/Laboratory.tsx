import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import {
  Beaker,
  Plus,
  X,
  Search,
  Loader2,
  Clock,
  Check,
  Printer,
  Camera,
  FileImage,
  Save,
  BadgeInfo,
  ChevronRight,
  TestTube,
  AlertTriangle,
  User,
  Zap,
  RefreshCw,
  CheckCircle,
  Activity,
  Info,
} from "lucide-react";

import { ObjectUploader } from "@/components/ObjectUploader";
import { LabReportPrint } from "@/components/LabReportPrint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useServicesByCategory } from "@/hooks/useServicesByCategory";

import {
  insertLabTestSchema,
  type InsertLabTest,
  type Patient,
  type LabTest,
  type Service,
} from "@shared/schema";

import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";
import { getDateRangeForAPI, getClinicDayKey } from "@/lib/date-utils";
import { timeAgo } from "@/lib/time-utils";
import { ResultPatientHeader, ResultHeaderCard, ResultSectionCard, KeyFindingCard } from "@/components/diagnostics";
import { LAB_TEST_CATALOG, getLabCategoryLabel, type LabTestCategory } from "@/lib/diagnostic-catalog";
import { interpretLabResults } from "@/lib/lab-interpretation";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function parseJSON<T = any>(v: any, fallback: T): T {
  try {
    return JSON.parse(v ?? "");
  } catch {
    return fallback;
  }
}


function fullName(p?: Patient | null) {
  if (!p) return "";
  const n = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return n || p.patientId || "";
}

// Note: todayRange() removed - now using shared timezone-aware date utilities

/* ------------------------------------------------------------------ */
/* Doctor order categories (aligned with database schema)              */
/* ------------------------------------------------------------------ */

// Database schema expects: "blood", "urine", "stool", "microbiology", "chemistry", "hormonal", "other"
// Use shared diagnostic catalog for consistency with Treatment page
const commonTests = LAB_TEST_CATALOG;

/* ---------------------- Result field configs ---------------------- */
/* (Unmodified from your file, except kept inline for brevity)        */

const bloodSugarFields = {
  "Random Blood Sugar (RBS)": {
    "Blood Glucose": { type: "number" as const, unit: "mg/dL", normal: "<200 (random)" },
    "Time of Test": { type: "text" as const, unit: "", normal: "Any time" },
  },
  "Fasting Blood Sugar (FBS)": {
    "Blood Glucose": { type: "number" as const, unit: "mg/dL", normal: "70-110 (fasting)" },
    "Fasting Duration": {
      type: "select" as const,
      options: ["8 hours", "10 hours", "12 hours", "14+ hours"],
      normal: "8+ hours",
    },
  },
};

const resultFields: Record<
  string,
  Record<
    string,
    {
      type: "number" | "text" | "select" | "multiselect";
      unit?: string;
      range?: string;
      normal?: string;
      options?: string[];
    }
  >
> = {
  ...bloodSugarFields,
  
  "Urine Analysis": {
    "Appearance": { type: "select" as const, options: ["Clear", "Turbid", "Bloody", "Cloudy"], normal: "Clear" },
    "Protein": { type: "select" as const, options: ["Negative", "Trace", "+", "++", "+++"], normal: "Negative" },
    "Glucose": { type: "select" as const, options: ["Negative", "+", "++", "+++"], normal: "Negative" },
    "Acetone": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
    "Hb pigment": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
    "Leucocytes": { type: "select" as const, options: ["Negative", "+", "++", "+++"], normal: "Negative" },
    "Nitrite": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
    "PH": { type: "number" as const, unit: "", range: "5.0-8.0", normal: "6.0-7.5" },
    "Specific Gravity": { type: "number" as const, unit: "", range: "1.003-1.030", normal: "1.010-1.025" },
    "Bilirubin": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
  },

  "Stool Examination": {
    "Appearance": { type: "select" as const, options: ["Normal", "Bloody", "Mucoid", "Tarry", "Pale"], normal: "Normal" },
    "Consistency": { type: "select" as const, options: ["Formed", "Loose", "Watery", "Hard"], normal: "Formed" },
    "Color": { type: "select" as const, options: ["Brown", "Green", "Yellow", "Black", "Red"], normal: "Brown" },
    "Ova/Parasites": { type: "select" as const, options: ["None seen", "Ascaris", "Hookworm", "E. histolytica", "G. lamblia"], normal: "None seen" },
    "Occult Blood": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
  },

  "Complete Blood Count (CBC)": {
    "WBC": { type: "number" as const, unit: "x10³/µL", normal: "4.0-11.0" },
    "RBC": { type: "number" as const, unit: "x10⁶/µL", normal: "4.5-5.5" },
    "Hemoglobin": { type: "number" as const, unit: "g/dL", normal: "12-16" },
    "Hematocrit": { type: "number" as const, unit: "%", normal: "36-46" },
    "Platelets": { type: "number" as const, unit: "x10³/µL", normal: "150-400" },
    "MCV": { type: "number" as const, unit: "fL", normal: "80-100" },
    "MCH": { type: "number" as const, unit: "pg", normal: "27-32" },
    "MCHC": { type: "number" as const, unit: "g/dL", normal: "32-36" },
  },

  "Blood Film for Malaria (BFFM)": {
    "Malaria Parasites": { type: "select" as const, options: ["Not seen", "P. falciparum", "P. vivax", "P. malariae", "P. ovale"], normal: "Not seen" },
    "Parasitemia": { type: "select" as const, options: ["None", "+", "++", "+++"], normal: "None" },
    "Gametocytes": { type: "select" as const, options: ["Not seen", "Seen"], normal: "Not seen" },
  },

  "Widal Test (Typhoid)": {
    "S. Typhi (O)Ag": { type: "select" as const, options: ["Negative", "1:20", "1:40", "1:80", "1:160", "1:320"], normal: "Negative or 1:20" },
    "S. Typhi (H)Ag": { type: "select" as const, options: ["Negative", "1:20", "1:40", "1:80", "1:160", "1:320"], normal: "Negative or 1:20" },
    "S. Paratyphi A": { type: "select" as const, options: ["Negative", "1:20", "1:40", "1:80", "1:160"], normal: "Negative" },
    "S. Paratyphi B": { type: "select" as const, options: ["Negative", "1:20", "1:40", "1:80", "1:160"], normal: "Negative" },
  },

  "Liver Function Test (LFT)": {
    "Total Bilirubin": { type: "number" as const, unit: "mg/dL", normal: "0.3-1.2" },
    "Direct Bilirubin": { type: "number" as const, unit: "mg/dL", normal: "0-0.3" },
    "ALT (SGPT)": { type: "number" as const, unit: "U/L", normal: "7-56" },
    "AST (SGOT)": { type: "number" as const, unit: "U/L", normal: "10-40" },
    "ALP": { type: "number" as const, unit: "U/L", normal: "44-147" },
    "Total Protein": { type: "number" as const, unit: "g/dL", normal: "6.0-8.3" },
    "Albumin": { type: "number" as const, unit: "g/dL", normal: "3.5-5.0" },
  },

  "Renal Function Test (RFT)": {
    "Urea": { type: "number" as const, unit: "mg/dL", normal: "15-40" },
    "Creatinine": { type: "number" as const, unit: "mg/dL", normal: "0.7-1.3" },
    "Uric Acid": { type: "number" as const, unit: "mg/dL", normal: "3.5-7.2" },
    "Sodium": { type: "number" as const, unit: "mmol/L", normal: "135-145" },
    "Potassium": { type: "number" as const, unit: "mmol/L", normal: "3.5-5.0" },
    "Chloride": { type: "number" as const, unit: "mmol/L", normal: "98-106" },
  },

  "Blood Group & Rh": {
    "Blood Group": { type: "select" as const, options: ["A", "B", "AB", "O"], normal: "Any" },
    "Rh Factor": { type: "select" as const, options: ["Positive", "Negative"], normal: "Positive" },
  },

  "Hepatitis B Test (HBsAg)": {
    "HBsAg": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
  },

  "HIV Test": {
    "HIV Antibody": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
  },

  "Pregnancy Test (HCG)": {
    "β-hCG": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative (if not pregnant)" },
  },

  "Thyroid Hormones": {
    "TSH": { type: "number" as const, unit: "μIU/mL", normal: "0.4-4.0" },
    "T3": { type: "number" as const, unit: "ng/dL", normal: "80-200" },
    "T4": { type: "number" as const, unit: "μg/dL", normal: "5-12" },
  },

  "H. Pylori Test": {
    "H. Pylori Antigen": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
    "Test Method": { type: "select" as const, options: ["Stool Antigen", "Serology", "Breath Test"], normal: "Stool Antigen" },
  },

  "Hepatitis C Test (HCV)": {
    "HCV Antibody": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
  },

  "VDRL Test (Syphilis)": {
    "VDRL": { type: "select" as const, options: ["Non-Reactive", "Reactive"], normal: "Non-Reactive" },
    "Titer": { type: "select" as const, options: ["None", "1:2", "1:4", "1:8", "1:16", "1:32", "1:64"], normal: "None" },
  },

  "Brucella Test (B.A.T)": {
    "Brucella Antibody": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
    "Titer": { type: "select" as const, options: ["None", "1:20", "1:40", "1:80", "1:160", "1:320"], normal: "None" },
  },

  "ESR (Erythrocyte Sedimentation Rate)": {
    "ESR (1 hour)": { type: "number" as const, unit: "mm/hr", normal: "0-20 (varies by age/gender)" },
  },

  "Rheumatoid Factor": {
    "RF": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
    "Titer": { type: "select" as const, options: ["<20", "20-40", "40-80", ">80"], normal: "<20" },
  },

  "Hemoglobin (HB)": {
    "Hemoglobin": { type: "number" as const, unit: "g/dL", normal: "12-16 (adult)" },
  },

  "Total White Blood Count (TWBC)": {
    "WBC": { type: "number" as const, unit: "x10³/µL", normal: "4.0-11.0" },
  },

  "Gonorrhea Test": {
    "Gonorrhea": { type: "select" as const, options: ["Negative", "Positive"], normal: "Negative" },
  },
};

/* ------------------------------------------------------------------ */
/* Data hooks                                                          */
/* ------------------------------------------------------------------ */

// 1) Lab tests (all -> split by status locally)
// The API returns lab tests with patient data included via JOIN
function useLabTests(preset: string, customStart?: Date, customEnd?: Date) {
  return useQuery<(LabTest & { patient?: Patient })[]>({
    queryKey: ["/api/lab-tests", { preset, customStart, customEnd }],
    queryFn: async () => {
      const url = new URL("/api/lab-tests", window.location.origin);
      
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
        throw new Error("Failed to fetch lab tests");
      }
      return response.json();
    },
  });
}

// 2) Today's patients (doctor's default list in New Request)
// Now using timezone-aware date utilities for consistent "Today" filtering
function useTodayPatients() {
  const dateRange = getDateRangeForAPI('today');

  return useQuery<Patient[]>({
    queryKey: ["/api/patients", { preset: "today" }],
    queryFn: async () => {
      // Use preset-based API call for timezone-aware filtering
      if (dateRange) {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        const response = await fetch(`/api/patients?${params}`);
        if (response.ok) return response.json();
      }
      
      // Fallback to legacy today endpoint
      const fallback = await fetch("/api/patients?today=1");
      return fallback.ok ? fallback.json() : [];
    },
  });
}

// 3) Debounced search for the New Request patient picker
function usePatientSearch(term: string) {
  return useQuery<Patient[]>({
    queryKey: ["/api/patients", { search: term }],
    enabled: term.trim().length >= 1,
    queryFn: async () => {
      const url = new URL("/api/patients", window.location.origin);
      url.searchParams.set("search", term.trim());
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      return res.json();
    },
  });

}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function Laboratory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Request state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] =
    useState<keyof typeof commonTests>("blood");

  // Results state
  const [selectedLabTest, setSelectedLabTest] = useState<LabTest | null>(null);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"view" | "edit">("edit"); // View mode for completed results
  const [detailedResults, setDetailedResults] = useState<
    Record<string, Record<string, string>>
  >({});

  // Print modals
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [showLabReport, setShowLabReport] = useState(false);
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);

  // Edit modal state
  // Patient picker search/paging
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // Date range filtering and patient search
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "last7days" | "last30days" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-testid="input-patient-search"]')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(id);
  }, [term]);

  // Forms
  const form = useForm<InsertLabTest>({
    resolver: zodResolver(insertLabTestSchema),
    defaultValues: {
      patientId: "",
      category: "blood",
      tests: "",
      clinicalInfo: "",
      priority: "routine",
      requestedDate: new Date().toISOString().split("T")[0],
    },
  });

  const resultsForm = useForm({
    defaultValues: {
      results: "",
      normalValues: "",
      resultStatus: "normal" as "normal" | "abnormal" | "critical",
      completedDate: new Date().toISOString(),
      technicianNotes: "",
    },
  });

  /* ----------------------------- Data ----------------------------- */

  // Use the date filter preset directly for API calls (Phase 2)
  const { data: allLabTests = [], refetch: refetchLabTests } = useLabTests(dateFilter, customStartDate, customEndDate);
  
  // Refresh state
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  
  // Fetch active laboratory services for catalog enforcement
  const { data: laboratoryServices = [] } = useServicesByCategory('laboratory');
  
  // Filter catalog tests to only those with active services
  // STRICT CATALOG ENFORCEMENT: Only show tests that exist as active services
  const availableTests = useMemo(() => {
    const serviceNames = new Set(laboratoryServices.map(s => s.name));
    const result: Record<LabTestCategory, string[]> = {
      blood: [],
      hormonal: [],
      microbiology: [],
      urine: [],
      chemistry: [],
      stool: [],
      other: [],
    };
    
    // Filter tests from catalog that have corresponding active services
    Object.entries(commonTests).forEach(([category, tests]) => {
      result[category as LabTestCategory] = tests.filter(testName => serviceNames.has(testName));
    });
    
    return result;
  }, [laboratoryServices]);
  
  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Server already filters by date using timezone-aware utilities, no need for client-side filtering
  // Just separate by status
  const dateFilteredPending = allLabTests.filter((t) => t.status === "pending");
  const dateFilteredCompleted = allLabTests.filter((t) => t.status === "completed");

  // Filter by patient search using the patient data already included in lab test results
  const filterByPatient = (tests: (LabTest & { patient?: Patient })[]) => {
    if (!patientSearchTerm.trim()) return tests;
    
    return tests.filter((t) => {
      const patient = t.patient;
      if (!patient) return false;
      
      const searchLower = patientSearchTerm.toLowerCase();
      const patientName = fullName(patient).toLowerCase();
      const patientId = patient.patientId.toLowerCase();
      
      return patientName.includes(searchLower) || patientId.includes(searchLower);
    });
  };
  
  const pendingTests = filterByPatient(dateFilteredPending);
  const completedTests = filterByPatient(dateFilteredCompleted);

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

  // Follow-up selection via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get("patientId");
    const isFollowUp = urlParams.get("followUp") === "true";

    if (!pid || !isFollowUp) return;

    (async () => {
      try {
        const res = await apiRequest("GET", `/api/patients/${pid}`);
        const patient = await res.json();
        if (patient?.patientId) {
          setSelectedPatient(patient);
          setRequestOpen(true);
          toast({
            title: "Follow-up test",
            description: `Patient ${patient.firstName ?? ""} ${
              patient.lastName ?? ""
            } (${patient.patientId}) preselected.`,
            duration: 4000,
          });
        }
      } catch {
        // ignore
      } finally {
        window.history.replaceState({}, "", "/laboratory");
      }
    })();
  }, [toast]);

  // Load patient for report print
  useEffect(() => {
    if (!selectedLabTest) {
      setReportPatient(null);
      return;
    }
    (async () => {
      try {
        const res = await apiRequest(
          "GET",
          `/api/patients/${selectedLabTest.patientId}`
        );
        const p = await res.json();
        setReportPatient(p?.patientId ? p : null);
      } catch {
        setReportPatient(null);
      }
    })();
  }, [selectedLabTest]);


  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchLabTests();
      toast({
        title: "Refreshed",
        description: "Laboratory data has been refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh laboratory data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  /* --------------------------- Mutations -------------------------- */

  const createLabTestMutation = useMutation({
    mutationFn: async (data: InsertLabTest) => {
      const response = await apiRequest("POST", "/api/lab-tests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lab test request submitted successfully" });
      form.reset();
      setSelectedPatient(null);
      setSelectedTests([]);
      setRequestOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: "lab_test",
          action: "create",
          data: { ...form.getValues(), tests: JSON.stringify(selectedTests) },
        });
        toast({
          title: "Saved Offline",
          description: "Lab test request saved locally. Will sync when online.",
        });
        form.reset();
        setSelectedPatient(null);
        setSelectedTests([]);
        setRequestOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to submit lab test request",
          variant: "destructive",
        });
      }
    },
  });

  const updateLabTestMutation = useMutation({
    mutationFn: async ({ testId, data }: { testId: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/lab-tests/${testId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: "lab_test",
          action: "update",
          data: { testId: selectedLabTest?.testId, ...resultsForm.getValues() },
        });
        toast({
          title: "Saved Offline",
          description: "Lab test results saved locally. Will sync when online.",
        });
        resultsForm.reset();
        setSelectedLabTest(null);
        setResultsModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to save lab test results",
          variant: "destructive",
        });
      }
    },
  });

  /* --------------------------- Handlers --------------------------- */

  const onSubmitRequest = (data: InsertLabTest) => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient first", variant: "destructive" });
      return;
    }
    if (selectedTests.length === 0) {
      toast({ title: "Error", description: "Please select at least one test", variant: "destructive" });
      return;
    }
    
    // STRICT CATALOG VALIDATION: Verify each selected test has a corresponding active service
    const missingServices: string[] = [];
    const testServiceMap = new Map<string, Service>();
    
    selectedTests.forEach(testName => {
      const service = laboratoryServices.find(s => s.name === testName);
      if (!service) {
        missingServices.push(testName);
      } else {
        testServiceMap.set(testName, service);
      }
    });
    
    if (missingServices.length > 0) {
      toast({
        title: "Cannot Order Tests",
        description: `The following test(s) are not available in the active service catalog: ${missingServices.join(", ")}. Please contact administration to add these tests to Service Management.`,
        variant: "destructive",
      });
      return;
    }
    
    // Use the first test's service for validation
    const firstService = testServiceMap.get(selectedTests[0])!;
    
    createLabTestMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
      tests: JSON.stringify(selectedTests),
      serviceId: firstService.id, // Include serviceId for server-side validation
    });
  };

  const onSubmitResults = (data: any) => {
    if (!selectedLabTest) return;
    
    // Convert completedDate to full ISO timestamp if it's a date-only string
    let completedDate = data.completedDate;
    if (completedDate) {
      // Check if it's a date-only string (YYYY-MM-DD format)
      const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyPattern.test(completedDate)) {
        // Date-only string from HTML date input - append current time
        // Using current date/time ensures the completion time is accurate
        const now = new Date();
        const [year, month, day] = completedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        completedDate = date.toISOString();
      }
    }
    
    updateLabTestMutation.mutate({
      testId: selectedLabTest.testId,
      data: { ...data, completedDate, results: JSON.stringify(detailedResults), status: "completed" },
    });
    setSelectedLabTest(null);
    setResultsModalOpen(false);
    toast({ title: "Test Completed", description: "All results saved and test marked as completed" });
  };


  const handleTestToggle = (test: string) => {
    setSelectedTests((prev) => (prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]));
  };

  const handleLabTestSelect = (labTest: LabTest) => {
    setSelectedLabTest(labTest);
    setResultsModalOpen(true);
    
    // Set view mode based on completion status
    setViewMode(labTest.status === "completed" ? "view" : "edit");
    const loaded = parseJSON<Record<string, Record<string, string>>>(labTest.results, {});
    setDetailedResults(loaded);

    // readable summary into results form
    let readableSummary = "";
    if (labTest.results) {
      try {
        const parsed = JSON.parse(labTest.results);
        const chunks: string[] = [];
        Object.entries(parsed).forEach(([testName, testData]: [string, any]) => {
          const lines: string[] = [];
          Object.entries(testData).forEach(([field, value]) => {
            lines.push(`${field}: ${value}`);
          });
          if (lines.length) chunks.push(`◆ ${testName.toUpperCase()}\n   ${lines.join("\n   ")}`);
        });
        readableSummary = chunks.length ? chunks.join("\n\n") : "No test results recorded";
      } catch {
        readableSummary = labTest.results;
      }
    }

    resultsForm.reset({
      results: readableSummary,
      normalValues: (labTest as any).normalValues || "",
      resultStatus: (labTest as any).resultStatus || "normal",
      completedDate: (labTest as any).completedDate || new Date().toISOString(),
      technicianNotes: (labTest as any).technicianNotes || "",
    });

    setTimeout(() => {
      const textarea = document.querySelector('textarea[name="results"]') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.max(100, textarea.scrollHeight) + "px";
      }
    }, 50);
  };

  const updateDetailedResult = (testName: string, fieldName: string, value: string) => {
    setDetailedResults((prev) => ({
      ...prev,
      [testName]: { ...(prev[testName] || {}), [fieldName]: value },
    }));
  };

  const saveTestCategoryResults = (testName: string) => {
    if (!selectedLabTest) return;
    updateLabTestMutation.mutate({
      testId: selectedLabTest.testId,
      data: { results: JSON.stringify(detailedResults), status: selectedLabTest.status },
    });
    toast({ title: "Saved", description: `Results for ${testName} saved successfully` });
  };

  const printLabRequest = () => {
    if (!selectedPatient || selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select a patient and tests before printing",
        variant: "destructive",
      });
      return;
    }
    setShowLabRequest(true);
    setTimeout(() => {
      const done = () => setShowLabRequest(false);
      window.addEventListener("afterprint", done, { once: true });
      window.print();
    }, 50);
  };

  const printLabReport = () => {
    if (!selectedLabTest) {
      toast({
        title: "Error",
        description: "Please select a lab test to print the report",
        variant: "destructive",
      });
      return;
    }
    setShowLabReport(true);
    setTimeout(() => {
      const done = () => setShowLabReport(false);
      window.addEventListener("afterprint", done, { once: true });
      window.print();
    }, 50);
  };

  /* ================================================================== */
  /* UI                                                                 */
  /* ================================================================== */

  // Small chip component
  const Chip = ({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "blue" | "emerald" | "amber" | "rose" }) => {
    const tones: Record<string, string> = {
      slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
      blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
      emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
      amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
      rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
    };
    return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm", tones[tone])}>{children}</span>;
  };

  const TestsRow = ({ tests }: { tests: string[] }) =>
    tests.length ? (
      <div className="mt-2 flex flex-wrap gap-1">
        {tests.map((t, i) => (
          <span key={i} className="rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-sm">
            {t}
          </span>
        ))}
      </div>
    ) : null;

return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 -m-3 sm:-m-4 md:-m-5 p-3 sm:p-4 md:p-5">
      <div className="space-y-3">
        {/* Header Section - Premium Gradient Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Premium gradient icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 
                            rounded-2xl blur-xl opacity-40 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 
                            flex items-center justify-center shadow-lg shadow-green-500/50">
                <TestTube className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
            
            {/* Premium title with gradient text */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 
                           bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-300">
                Laboratory Department
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
                Clinical laboratory testing and diagnostics
              </p>
            </div>
          </div>

          {/* Right: Info Button + Refresh Button */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowInfoDialog(true)}
              className="hover:bg-green-50 dark:hover:bg-green-950/20 
                       hover:border-green-400 dark:hover:border-green-500 
                       hover:text-green-700 dark:hover:text-green-400
                       transition-all duration-200"
              aria-label="Show information about lab orders"
            >
              <Info className="w-4 h-4 mr-2" />
              Info
            </Button>
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="hover:bg-green-50 dark:hover:bg-green-950/20 
                       hover:border-green-400 dark:hover:border-green-500 
                       hover:text-green-700 dark:hover:text-green-400
                       transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Pending Card */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-orange-900 dark:text-orange-100 uppercase tracking-wide">
                    Pending
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-xl font-bold text-orange-700 dark:text-orange-400" data-testid="stat-pending">
                      {pendingTests.length}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      requests
                    </p>
                  </div>
                </div>
                <div className="p-2 bg-orange-600 rounded-lg shadow-sm">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Card */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-900 dark:text-green-100 uppercase tracking-wide">
                    Completed
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-xl font-bold text-green-700 dark:text-green-400" data-testid="stat-completed">
                      {completedTests.length}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      results
                    </p>
                  </div>
                </div>
                <div className="p-2 bg-green-600 rounded-lg shadow-sm">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide">
                    Total Exams
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400" data-testid="stat-total">
                      {allLabTests.length}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      all time
                    </p>
                  </div>
                </div>
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <Activity className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* LEFT – Pending Test Requests (Always Visible) */}

        <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04)] border-0 overflow-hidden">
          <CardHeader className="bg-orange-50 dark:bg-orange-950/20 border-b py-2.5 px-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              </div>
              Pending Test Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-4 space-y-3">
              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setDateFilter("today")}
                  data-testid="filter-today"
                  className={dateFilter === "today" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter("yesterday")}
                  data-testid="filter-yesterday"
                  className={dateFilter === "yesterday" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setDateFilter("last7days")}
                  data-testid="filter-last7days"
                  className={dateFilter === "last7days" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateFilter("last30days")}
                  data-testid="filter-last30days"
                  className={dateFilter === "last30days" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateFilter("custom")}
                  data-testid="filter-custom"
                  className={dateFilter === "custom" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Custom Range
                </button>
              </div>
              
              {dateFilter === "custom" && (
                <div className="flex gap-2 items-center">
                  <DatePicker
                    date={customStartDate}
                    onDateChange={setCustomStartDate}
                    placeholder="Start Date"
                    className="w-48"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <DatePicker
                    date={customEndDate}
                    onDateChange={setCustomEndDate}
                    placeholder="End Date"
                    className="w-48"
                  />
                </div>
              )}
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, ID, or exam type..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 placeholder:text-gray-400"
                  data-testid="input-patient-search"
                />
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {pendingTests.length} pending test{pendingTests.length !== 1 ? "s" : ""}
                {patientSearchTerm && ` matching "${patientSearchTerm}"`}
              </div>
            </div>
            
            <div className="space-y-2">
              {pendingTests.length ? (
                pendingTests.map((test) => {
                  const tests = parseJSON<string[]>(test.tests, []);
                  const p = test.patient; // Use patient data from lab test result
                  const isPaid = test.paymentStatus === "paid";
                  const canPerform = isPaid;

                  return (
                    <div
                      key={test.testId}
                      data-testid={`card-pending-test-${test.testId}`}
                      role="button"
                      tabIndex={canPerform ? 0 : -1}
                      aria-label={`${fullName(p) || test.patientId} - ${tests.length} test${tests.length !== 1 ? 's' : ''}`}
                      className={cx(
                        "rounded-xl p-2.5 border-l-4 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                        !isPaid ? "bg-red-50 dark:bg-red-900/20 border-red-500" : "bg-white dark:bg-gray-800 border-orange-500",
                        !canPerform && "opacity-75"
                      )}
                      onClick={() => canPerform && handleLabTestSelect(test)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && canPerform) {
                          e.preventDefault();
                          handleLabTestSelect(test);
                        }
                      }}
                      style={!canPerform ? { cursor: "not-allowed" } : {}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-semibold truncate">{fullName(p)}</div>
                            <Chip tone="slate">{test.patientId}</Chip>
                            {p.patientType === "referral_diagnostic" && (
                              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-300 dark:border-orange-700 text-xs">
                                External Referral
                              </Badge>
                            )}
                            <Chip tone="blue">{tests.length} test{tests.length !== 1 ? 's' : ''}</Chip>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{timeAgo(test.createdAt)}</span>
                          </div>
                          <TestsRow tests={tests} />
                          {test.resultStatus === 'critical' && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 mt-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="text-red-500" size={18} />
                                <span className="text-sm font-semibold text-red-700">
                                  Critical result - requires immediate physician notification
                                </span>
                              </div>
                            </div>
                          )}
                          {!isPaid && (
                            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium mt-2">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Patient must pay at reception before test can be performed</span>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-full border border-teal-200 dark:border-teal-800">
                            Ordered by Doctor
                          </span>
                          <div className="flex items-center gap-2">
                            {!isPaid ? (
                              <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 rounded-full uppercase inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              UNPAID
                            </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                            )}
                            {canPerform && <ChevronRight className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center shadow-lg">
                      <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center border-2 border-green-500">
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight mt-4">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select date range"
                      : "All caught up!"}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select start and end dates above to view tests"
                      : 'No pending tests. Create a new lab request or register a patient to get started.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT – Completed Tests */}
        <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04)] border-0 overflow-hidden">
          <CardHeader className="bg-green-50 dark:bg-green-950/20 border-b py-2.5 px-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
              Completed Results (Lab)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-4 space-y-3">
              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setDateFilter("today")}
                  className={dateFilter === "today" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter("yesterday")}
                  className={dateFilter === "yesterday" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setDateFilter("last7days")}
                  className={dateFilter === "last7days" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateFilter("last30days")}
                  className={dateFilter === "last30days" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateFilter("custom")}
                  className={dateFilter === "custom" 
                    ? "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 relative text-teal-600 dark:text-teal-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-purple-600 after:to-violet-500 after:shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "pb-2 text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-500 hover:text-teal-500"
                  }
                >
                  Custom Range
                </button>
              </div>
              
              {dateFilter === "custom" && (
                <div className="flex gap-2 items-center">
                  <DatePicker
                    date={customStartDate}
                    onDateChange={setCustomStartDate}
                    placeholder="Start Date"
                    className="w-48"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <DatePicker
                    date={customEndDate}
                    onDateChange={setCustomEndDate}
                    placeholder="End Date"
                    className="w-48"
                  />
                </div>
              )}
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, ID, or exam type..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 placeholder:text-gray-400"
                />
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {completedTests.length} completed test{completedTests.length !== 1 ? "s" : ""}
                {patientSearchTerm && ` matching "${patientSearchTerm}"`}
              </div>
            </div>
            
            <div className="space-y-2">
              {completedTests.length ? (
                completedTests.map((test) => {
                  const tests = parseJSON<string[]>(test.tests, []);
                  const p = test.patient; // Use patient data from lab test result
                  return (
                    <div
                      key={test.testId}
                      data-testid={`card-completed-test-${test.testId}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${fullName(p) || test.patientId} - ${tests.length} test${tests.length !== 1 ? 's' : ''}`}
                      className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border-l-4 border-green-500 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      onClick={() => handleLabTestSelect(test)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleLabTestSelect(test);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-semibold truncate">{fullName(p) || test.patientId}</div>
                            <Chip tone="slate">{test.patientId}</Chip>
                            {p.patientType === "referral_diagnostic" && (
                              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-300 dark:border-orange-700 text-xs">
                                External Referral
                              </Badge>
                            )}
                            <Chip tone="blue">{tests.length} test{tests.length !== 1 ? 's' : ''}</Chip>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{timeAgo((test as any).completedDate)}</span>
                          </div>
                          <TestsRow tests={tests} />
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Completed
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center shadow-lg">
                      <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mt-4">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select date range"
                      : "No completed tests"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
                    {dateFilter === "custom" && !customStartDate && !customEndDate
                      ? "Select start and end dates above to view tests"
                      : "Completed tests will appear here once lab work is finished."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-blue-600" />
              Enter Test Results — {selectedLabTest?.testId}
              {selectedLabTest?.status === "completed" && (
                <Badge className="ml-2 bg-blue-600 text-white">Editing Completed Results</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Record laboratory test results and findings
            </DialogDescription>
          </DialogHeader>


          {/* VIEW MODE - Unified diagnostic result UI */}
          {selectedLabTest && viewMode === "view" && (
            <div className="space-y-4 px-6 pb-6 max-h-[65vh] overflow-y-auto">
              {/* Modal Title */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Lab • {selectedLabTest.testId}
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
                    onClick={printLabReport}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>

              {/* Patient + Status Row */}
              <ResultPatientHeader
                patientName={fullName(reportPatient) || selectedLabTest.patientId}
                patientId={selectedLabTest.patientId}
                statuses={[
                  { variant: selectedLabTest.paymentStatus === "paid" ? "paid" : "unpaid" },
                  { variant: "completed" },
                  { variant: selectedLabTest.priority as any },
                ]}
              />

              {/* Hero Card */}
              <ResultHeaderCard
                modality="lab"
                title={`${selectedLabTest.category.charAt(0).toUpperCase() + selectedLabTest.category.slice(1)} Tests`}
                subtitle={`${parseJSON<string[]>(selectedLabTest.tests, []).length} test(s) ordered`}
                requestedAt={selectedLabTest.requestedDate}
                completedAt={selectedLabTest.completedDate}
                status="completed"
              />

              {/* Tests Ordered Section */}
              <ResultSectionCard
                title="Tests Ordered"
                tone="accent-blue"
              >
                <div className="flex flex-wrap gap-2">
                  {parseJSON<string[]>(selectedLabTest.tests, []).map((test, i) => (
                    <Badge key={i} variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      {test}
                    </Badge>
                  ))}
                </div>
              </ResultSectionCard>

              {/* Laboratory Results Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Laboratory Results</h3>
                <div className="space-y-3">
                  {(() => {
                    const results = parseJSON<Record<string, Record<string, string>>>(selectedLabTest.results, {});
                    return Object.entries(results).map(([testName, testData]) => {
                      const fields = resultFields[testName];
                      return (
                        <ResultSectionCard
                          key={testName}
                          title={testName}
                          tone="neutral"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            {Object.entries(testData).map(([fieldName, value]) => {
                              const config = fields?.[fieldName];
                              const isNormal = config?.normal === value;
                              const isAbnormal = config?.normal && config.normal !== value && value && value !== "Not seen" && value !== "Negative";
                              
                              return (
                                <div key={fieldName} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 py-2">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{fieldName}:</span>
                                  <span className={cx(
                                    "font-semibold",
                                    isNormal && "text-green-600 dark:text-green-400",
                                    isAbnormal && "text-red-600 dark:text-red-400"
                                  )}>
                                    {value} {config?.unit || ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </ResultSectionCard>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Clinical Interpretation with KeyFindingCard */}
              {(() => {
                const results = parseJSON<Record<string, Record<string, string>>>(selectedLabTest.results, {});
                // Use shared interpretation utility for consistent results between view and print
                const interpretation = interpretLabResults(results);
                const { criticalFindings, warnings } = interpretation;

                // Render appropriate KeyFindingCard based on findings
                if (criticalFindings.length > 0) {
                  const items = [];
                  // Add remaining critical findings as items if there are multiple
                  if (criticalFindings.length > 1) {
                    for (let i = 1; i < criticalFindings.length; i++) {
                      items.push({ text: criticalFindings[i] });
                    }
                  }
                  // Add all warnings as items
                  for (let i = 0; i < warnings.length; i++) {
                    items.push({ text: warnings[i] });
                  }
                  
                  return (
                    <KeyFindingCard
                      severity="critical"
                      summary={criticalFindings[0]}
                      items={items}
                    />
                  );
                } else if (warnings.length > 0) {
                  return (
                    <KeyFindingCard
                      severity="attention"
                      summary={warnings[0]}
                      items={warnings.slice(1).map(w => ({ text: w }))}
                    />
                  );
                } else {
                  return (
                    <KeyFindingCard
                      severity="normal"
                      summary="All test results are within normal limits. No critical findings or abnormalities detected."
                    />
                  );
                }
              })()}
            </div>
          )}
          {selectedLabTest && viewMode === "edit" && (
            <div className="space-y-6">
              {/* Photo uploader */}
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Lab Printout Photos
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Upload photos of CBC, chemistry, or other machine printouts to reduce manual typing.
                </p>

                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760}
                  accept="image/*"
                  onGetUploadParameters={async () => {
                    const response = await fetch("/api/objects/upload", { method: "POST" });
                    const data = await response.json();
                    return { method: "PUT" as const, url: data.uploadURL };
                  }}
                  onComplete={async (uploadedFiles) => {
                    const attachments = uploadedFiles.map((f) => ({ url: f.url, name: f.name, type: "lab_printout" }));
                    try {
                      const response = await fetch(
                        `/api/lab-tests/${selectedLabTest.testId}/attachments`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ attachments }),
                        }
                      );
                      if (response.ok) {
                        toast({ title: "Success", description: "Lab printout photos uploaded successfully!" });
                        queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
                      } else {
                        throw new Error("Upload failed");
                      }
                    } catch {
                      toast({
                        title: "Error",
                        description: "Failed to save uploaded photos",
                        variant: "destructive",
                      });
                    }
                  }}
                  buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Lab Photos
                </ObjectUploader>

                {selectedLabTest.attachments && (
                  <div className="mt-4">
                    <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Uploaded Photos:
                    </h6>
                    <div className="flex flex-wrap gap-2">
                      {parseJSON<any[]>(selectedLabTest.attachments, []).map((a, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-700 p-2 rounded border">
                          <FileImage className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{a.name}</span>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-4">
                {/* Dynamic fields per ordered test */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detailed Test Results
                  </label>

                  {parseJSON<string[]>(selectedLabTest.tests, []).map((orderedTest) => {
                    const fields = resultFields[orderedTest];
                    if (!fields) return null;

                    return (
                      <div
                        key={orderedTest}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                      >
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                          {orderedTest}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(fields).map(([fieldName, config]) => {
                            const v = detailedResults[orderedTest]?.[fieldName] || "";

                            if (config.type === "multiselect") {
                              const selected = v.split(", ").filter(Boolean);
                              return (
                                <div key={fieldName} className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                    {fieldName}
                                    {config.normal && (
                                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                        Normal: {config.normal}
                                      </span>
                                    )}
                                  </label>
                                  {config.options?.map((opt) => {
                                    const isSelected = selected.includes(opt);
                                    return (
                                      <div key={opt} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            let next = [...selected];
                                            if (e.target.checked) {
                                              if (opt === "Not seen") next = ["Not seen"];
                                              else next = next.filter((s) => s !== "Not seen").concat(opt);
                                            } else {
                                              next = next.filter((s) => s !== opt);
                                              if (!next.length) next = ["Not seen"];
                                            }
                                            updateDetailedResult(orderedTest, fieldName, next.join(", "));
                                          }}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className={cx("text-sm", opt === config.normal && "text-green-600 font-medium")}>
                                          {opt === config.normal && "✓ "}
                                          {opt}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            if (config.type === "select") {
                              return (
                                <div key={fieldName} className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                    {fieldName}
                                    {config.normal && (
                                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                        Normal: {config.normal}
                                      </span>
                                    )}
                                  </label>
                                  <Select
                                    value={v}
                                    onValueChange={(value) => updateDetailedResult(orderedTest, fieldName, value)}
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue placeholder="Select value..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {config.options?.map((opt) => (
                                        <SelectItem
                                          key={opt}
                                          value={opt}
                                          className={opt === config.normal ? "bg-green-50 dark:bg-green-900/30" : ""}
                                        >
                                          {opt === config.normal && "✓ "}
                                          {opt}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            }

                            return (
                              <div key={fieldName} className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                  {fieldName}
                                  {config.normal && (
                                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                      Normal: {config.normal}
                                    </span>
                                  )}
                                </label>
                                <div className="relative">
                                  <Input
                                    value={v}
                                    onChange={(e) => updateDetailedResult(orderedTest, fieldName, e.target.value)}
                                    type={config.type}
                                    placeholder={config.type === "number" ? "Enter value..." : "Enter result..."}
                                    className="text-sm pr-12"
                                  />
                                  {config.unit && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                      {config.unit}
                                    </span>
                                  )}
                                </div>
                                {config.range && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Range: {config.range}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex flex-wrap gap-2 justify-between">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  Object.entries(fields).forEach(([fieldName, conf]) => {
                                    if (conf.normal) updateDetailedResult(orderedTest, fieldName, conf.normal);
                                  });
                                }}
                                className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"
                              >
                                ✓ All Normal
                              </Button>
                              <Button type="button" variant="outline" size="sm" className="text-xs">
                                📋 Copy Previous
                              </Button>
                            </div>
                            <Button
                              type="button"
                              onClick={() => saveTestCategoryResults(orderedTest)}
                              size="sm"
                              className="bg-health-green hover:bg-green-700 text-white"
                              disabled={updateLabTestMutation.isPending}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              {updateLabTestMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall Summary / Additional Results
                  </label>
                  <Textarea
                    className="min-h-[100px] resize-none overflow-hidden"
                    placeholder="Enter overall summary or any additional findings not covered above..."
                    {...resultsForm.register("results")}
                    onInput={(e) => {
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = "auto";
                      el.style.height = Math.max(100, el.scrollHeight) + "px";
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Normal Values Reference
                  </label>
                  <Textarea rows={3} placeholder="Reference ranges for normal values..." {...resultsForm.register("normalValues")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Result Status</label>
                    <Select
                      value={resultsForm.watch("resultStatus")}
                      onValueChange={(v) => resultsForm.setValue("resultStatus", v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="abnormal">Abnormal</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Completed Date</label>
                    <Input type="date" {...resultsForm.register("completedDate")} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lab Technician Notes
                  </label>
                  <Textarea rows={2} placeholder="Additional notes or observations..." {...resultsForm.register("technicianNotes")} />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={updateLabTestMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-complete-results"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {updateLabTestMutation.isPending ? "Saving..." : "Complete & Finalize All Results"}
                  </Button>
                  <Button type="button" variant="outline" onClick={printLabReport} data-testid="button-print-report">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PRINT — Request */}
      {showLabRequest && selectedPatient && (
        <div id="lab-request-print" className="prescription">
          <Card className="border-2 border-medical-green">
            <CardContent className="p-6">
              {/* Print layout - kept exactly as-is from your original file */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">Laboratory Test Request</h2>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="space-y-2">
                <p><strong>Patient:</strong> {fullName(selectedPatient)}</p>
                <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
                <p><strong>Tests Requested:</strong> {selectedTests.join(", ")}</p>
                <p><strong>Priority:</strong> {form.getValues("priority")}</p>
                <p><strong>Clinical Info:</strong> {form.getValues("clinicalInfo") || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* PRINT — Report (Patient Copy - No Interpretation) */}
      <LabReportPrint
        containerId="lab-report-print"
        visible={showLabReport && !!selectedLabTest}
        labTest={selectedLabTest!}
        patient={reportPatient}
        resultFields={resultFields}
        includeInterpretation={false}
        formValues={{
          completedDate: resultsForm.getValues("completedDate"),
          resultStatus: resultsForm.getValues("resultStatus"),
          technicianNotes: resultsForm.getValues("technicianNotes"),
          completedBy: user?.fullName,
        }}
      />

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
              Laboratory Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              New lab orders can only be created from the Treatment page by doctors during patient visits. Lab staff can update results and status for existing orders.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Scrollbar Styling */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgb(240 253 250);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgb(94 234 212);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgb(45 212 191);
        }
      `}</style>
      </div>
    </div>
  );

}
