import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "lucide-react";
import clinicLogo from "@assets/Logo-Clinic_1762148237143.jpeg";

import { ObjectUploader } from "@/components/ObjectUploader";
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
import { useToast } from "@/hooks/use-toast";

import {
  insertLabTestSchema,
  type InsertLabTest,
  type Patient,
  type LabTest,
} from "@shared/schema";

import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";
import { getDateRangeForAPI, getClinicDayKey } from "@/lib/date-utils";

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

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
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
const commonTests = {
  blood: [
    "Blood Film for Malaria (BFFM)",
    "Complete Blood Count (CBC)",
    "Hemoglobin (HB)",
    "Total White Blood Count (TWBC)",
    "Blood Group & Rh",
    "ESR (Erythrocyte Sedimentation Rate)",
    "Rheumatoid Factor",
    "Widal Test (Typhoid)",
    "Brucella Test (B.A.T)",
    "Hepatitis B Test (HBsAg)",
    "Hepatitis C Test (HCV)",
    "H. Pylori Test",
    "VDRL Test (Syphilis)",
  ],
  hormonal: [
    "Pregnancy Test (HCG)",
    "Gonorrhea Test",
    "Chlamydia Test",
    "Reproductive Hormones",
    "Thyroid Hormones",
    "Cardiac & Other Markers",
  ],
  microbiology: [
    "Toxoplasma Test",
    "Filariasis Tests",
    "Schistosomiasis Test",
    "Leishmaniasis Test",
    "Tuberculosis Tests",
    "Meningitis Tests",
    "Yellow Fever Test",
    "Typhus Test",
  ],
  urine: ["Urine Analysis", "Urine Microscopy"],
  chemistry: [
    "Renal Function Test (RFT)",
    "Liver Function Test (LFT)",
    "Random Blood Sugar (RBS)",
    "Fasting Blood Sugar (FBS)",
  ],
  stool: ["Stool Examination"],
  other: ["Custom Test"],
};

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

  // Request state
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] =
    useState<keyof typeof commonTests>("blood");

  // Results state
  const [selectedLabTest, setSelectedLabTest] = useState<LabTest | null>(null);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
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
      completedDate: new Date().toISOString().split("T")[0],
      technicianNotes: "",
    },
  });

  /* ----------------------------- Data ----------------------------- */

  // Use the date filter preset directly for API calls (Phase 2)
  const { data: allLabTests = [] } = useLabTests(dateFilter, customStartDate, customEndDate);
  
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
    createLabTestMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
      tests: JSON.stringify(selectedTests),
    });
  };

  const onSubmitResults = (data: any) => {
    if (!selectedLabTest) return;
    updateLabTestMutation.mutate({
      testId: selectedLabTest.testId,
      data: { ...data, results: JSON.stringify(detailedResults), status: "completed" },
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
      completedDate: (labTest as any).completedDate || new Date().toISOString().split("T")[0],
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
    <div className="space-y-6">
      {/* Page Header - Premium Card Container */}
      <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                Laboratory Department
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Clinical laboratory testing and diagnostics</p>
            </div>
            <Button
              type="button"
              onClick={() => setRequestOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-violet-500 hover:shadow-[0_4px_20px_rgba(139,92,246,0.4)] text-white font-semibold transition-all duration-300 ease-out"
              data-testid="button-new-lab-request"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Lab Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics - Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending</p>
                <p className="text-3xl font-bold mt-1" data-testid="stat-pending">{pendingTests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completed</p>
                <p className="text-3xl font-bold mt-1" data-testid="stat-completed">{completedTests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Exams</p>
                <p className="text-3xl font-bold mt-1" data-testid="stat-total">{allLabTests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TestTube className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TestTube className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT – Pending Test Requests (Always Visible) */}

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Clock className="w-5 h-5 text-amber-600" />
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
                <Button
                  variant={dateFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("today")}
                  data-testid="filter-today"
                >
                  Today
                </Button>
                <Button
                  variant={dateFilter === "yesterday" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("yesterday")}
                  data-testid="filter-yesterday"
                >
                  Yesterday
                </Button>
                <Button
                  variant={dateFilter === "last7days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("last7days")}
                  data-testid="filter-last7days"
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={dateFilter === "last30days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("last30days")}
                  data-testid="filter-last30days"
                >
                  Last 30 Days
                </Button>
                <Button
                  variant={dateFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("custom")}
                  data-testid="filter-custom"
                >
                  Custom Range
                </Button>
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
                  placeholder="Search by patient name or ID..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="pl-10"
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
                      className={cx(
                        "rounded-lg p-3 cursor-pointer transition-all border shadow-md hover:shadow-xl",
                        isPaid
                          ? "border-green-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 hover:from-green-100 hover:to-green-200/50 dark:hover:from-green-900/30 dark:hover:to-green-900/20"
                          : "border-red-300 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 hover:from-red-100 hover:to-red-200/50 dark:hover:from-red-900/30 dark:hover:to-red-900/20",
                        !canPerform && "opacity-75"
                      )}
                      onClick={() => canPerform && handleLabTestSelect(test)}
                      style={!canPerform ? { cursor: "not-allowed" } : {}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold truncate">{fullName(p)}</div>
                            <Chip tone="slate">{test.patientId}</Chip>
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {timeAgo(test.requestedDate)}
                          </div>
                          <TestsRow tests={tests} />
                          {!isPaid && (
                            <div className="text-xs text-red-700 mt-2">
                              ⚠️ Patient must pay at reception before test can be performed
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                            Ordered by Doctor
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Chip tone={isPaid ? "emerald" : "rose"}>{isPaid ? "Paid" : "UNPAID"}</Chip>
                            <Chip tone="amber">Pending</Chip>
                            {canPerform && <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {dateFilter === "custom" && !customStartDate && !customEndDate
                    ? "📅 Select start and end dates above to view tests in custom range"
                    : "No pending tests"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT – Completed Tests */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border-0">
          <CardHeader className="bg-gradient-to-r from-green-50/50 to-white dark:from-green-900/10 dark:to-gray-900 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Check className="w-5 h-5 text-green-600" />
              Completed Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Same filter controls for completed tests */}
            <div className="mb-4 space-y-3 border-b pb-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={dateFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("today")}
                >
                  Today
                </Button>
                <Button
                  variant={dateFilter === "yesterday" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("yesterday")}
                >
                  Yesterday
                </Button>
                <Button
                  variant={dateFilter === "last7days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("last7days")}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={dateFilter === "last30days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("last30days")}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant={dateFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("custom")}
                >
                  Custom Range
                </Button>
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
                  placeholder="Search by patient name or ID..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="pl-10"
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
                      className="rounded-lg p-3 cursor-pointer transition-all border border-green-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 hover:from-green-100 hover:to-green-200/50 dark:hover:from-green-900/30 dark:hover:to-green-900/20 shadow-md hover:shadow-xl"
                      onClick={() => handleLabTestSelect(test)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold truncate">{fullName(p) || test.patientId}</div>
                            <Chip tone="slate">{test.patientId}</Chip>
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {timeAgo(test.requestedDate)} • Completed {timeAgo((test as any).completedDate)}
                          </div>
                          <TestsRow tests={tests} />
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <Chip tone="emerald">Completed</Chip>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {dateFilter === "custom" && !customStartDate && !customEndDate
                    ? "📅 Select start and end dates above to view tests in custom range"
                    : "No completed lab tests"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Request Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-blue-600" />
              New Laboratory Test Request
            </DialogTitle>
            <DialogDescription>
              Select a patient and specify the tests to be performed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Patient selector */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Patient</h3>

              {!selectedPatient ? (
                <>
                  {/* Search input */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className="pl-9"
                        placeholder="Search by name or Patient ID (e.g., BGC5)…"
                        value={term}
                        onChange={(e) => {
                          setPage(1);
                          setTerm(e.target.value);
                        }}
                        data-testid="input-patient-search"
                      />
                    </div>
                  </div>

                  {/* Tip */}
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <BadgeInfo className="w-3 h-3" />
                    By default we list Today's Patients. Start typing to search anyone.
                  </p>

                  {/* Table header */}
                  <div className="mt-4 grid grid-cols-5 gap-0 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 text-xs font-semibold text-gray-700 dark:text-gray-300 px-3 py-2 rounded-t-xl border border-purple-200 dark:border-purple-800">
                    <div>Patient ID</div>
                    <div className="col-span-2">Name</div>
                    <div>Contact</div>
                    <div>Gender</div>
                  </div>

                  {/* Results section */}
                  <ul className="divide-y dark:divide-gray-800 rounded-b-xl border border-t-0 dark:border-gray-800 max-h-64 overflow-y-auto">
                    {/* Show search if there is a term, otherwise show today */}
                    {(debounced ? visibleSearch : visibleToday).length === 0 ? (
                      <li className="py-8 text-center text-sm text-gray-500">
                        {debounced
                          ? searchPatients.isLoading
                            ? "Searching…"
                            : "No matches."
                          : todayPatients.isLoading
                          ? "Loading today's patients…"
                          : "No patients registered today."}
                      </li>
                    ) : (
                      (debounced ? visibleSearch : visibleToday).map((p) => (
                        <li
                          key={p.id}
                          className="grid grid-cols-5 items-center px-3 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors duration-200"
                          onClick={() => setSelectedPatient(p)}
                          data-testid={`row-patient-${p.patientId}`}
                        >
                          <div className="font-medium">{p.patientId}</div>
                          <div className="col-span-2 truncate">{fullName(p)}</div>
                          <div className="truncate">{p.phoneNumber || "N/A"}</div>
                          <div className="capitalize">{p.gender || "—"}</div>
                        </li>
                      ))
                    )}
                  </ul>

                  {/* Load more */}
                  {!!(debounced ? searchPatients.data?.length : todayPatients.data?.length) &&
                    (debounced ? visibleSearch.length : visibleToday.length) <
                      (debounced ? (searchPatients.data?.length ?? 0) : (todayPatients.data?.length ?? 0)) && (
                      <div className="p-3 border dark:border-gray-800 text-center rounded-b-xl -mt-[1px]">
                        <Button variant="outline" onClick={() => setPage((p) => p + 1)} data-testid="button-load-more">
                          Load more
                        </Button>
                      </div>
                    )}
                </>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{fullName(selectedPatient)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {selectedPatient.patientId}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)} data-testid="button-change-patient">
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Order form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          setCurrentCategory(v as keyof typeof commonTests);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="blood">Blood Tests</SelectItem>
                          <SelectItem value="urine">Urine Analysis</SelectItem>
                          <SelectItem value="stool">Stool Examination</SelectItem>
                          <SelectItem value="microbiology">Microbiology</SelectItem>
                          <SelectItem value="chemistry">Biochemistry</SelectItem>
                          <SelectItem value="hormonal">Hormonal Tests</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Specific Tests</FormLabel>
                  <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                    {commonTests[currentCategory].map((t) => (
                      <label key={t} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedTests.includes(t)}
                          onCheckedChange={() => handleTestToggle(t)}
                          data-testid={`checkbox-test-${t}`}
                        />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </div>
                  {selectedTests.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Selected: {selectedTests.join(", ")}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="clinicalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical Information</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Symptoms, suspected diagnosis, relevant clinical information..."
                          rows={3}
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-clinical-info"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="stat">STAT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-requested-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createLabTestMutation.isPending}
                    className="bg-medical-blue hover:bg-blue-700"
                    data-testid="button-submit-request"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createLabTestMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button type="button" variant="outline" onClick={printLabRequest} data-testid="button-print-request">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Request
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Entry Modal */}
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

          {selectedLabTest && (
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
        <div>
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

      {/* PRINT — Report */}
      {showLabReport && selectedLabTest && (
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
            {/* Header - Modern Professional with Logo */}
            <div className="mb-4 pb-3 border-b-2 border-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={clinicLogo} alt="Clinic Logo" className="h-16 w-16 object-contain" />
                  <div>
                    <h1 className="text-2xl font-bold text-blue-600 mb-0.5">Bahr El Ghazal Clinic</h1>
                    <p className="text-xs text-gray-600">Comprehensive Healthcare Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-800">Laboratory Test Report</p>
                  <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Patient Information - Comes First */}
            <div className="mb-4">
              <h2 className="text-base font-bold mb-2 text-gray-900">Patient Information</h2>
              <div className="text-xs">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong>Patient Name:</strong> {fullName(reportPatient)}</span>
                  <span><strong>Patient ID:</strong> {selectedLabTest.patientId}</span>
                  <span><strong>Age:</strong> {reportPatient?.age}</span>
                  <span><strong>Gender:</strong> {reportPatient?.gender}</span>
                </div>
              </div>
            </div>

            {/* Test Information - Compact Inline */}
            <div className="mb-4">
              <h2 className="text-base font-bold mb-2 text-gray-900">Test Information</h2>
              <div className="text-xs space-y-1">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong>Category:</strong> {selectedLabTest.category}</span>
                  <span><strong>Priority:</strong> {selectedLabTest.priority}</span>
                  <span><strong>Test ID:</strong> {selectedLabTest.testId}</span>
                </div>
                <div>
                  <strong>Tests Ordered:</strong>
                  <div className="mt-1 inline-flex flex-wrap gap-1 ml-1">
                    {parseJSON<string[]>(selectedLabTest.tests, []).map((test, i) => (
                      <span key={i} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Laboratory Results - SHOW DATA FIRST */}
            <div className="mb-4">
              <h2 className="text-base font-bold mb-2 text-gray-900">Laboratory Results</h2>
              {(() => {
                const results = parseJSON<Record<string, Record<string, string>>>(selectedLabTest.results, {});
                return Object.entries(results).map(([testName, testData]) => {
                  const fields = resultFields[testName];
                  return (
                    <div key={testName} className="mb-3 border border-gray-300 rounded p-3">
                      <h3 className="text-sm font-semibold text-blue-700 mb-2">{testName}</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {Object.entries(testData).map(([fieldName, value]) => {
                          const config = fields?.[fieldName];
                          const isNormal = config?.normal === value;
                          const isAbnormal = config?.normal && config.normal !== value;
                          
                          return (
                            <div key={fieldName} className="flex justify-between items-center border-b border-gray-200 py-1">
                              <span className="font-medium text-gray-700">{fieldName}:</span>
                              <span className={cx(
                                "font-semibold",
                                isNormal && "text-green-600",
                                isAbnormal && value && value !== "Not seen" && value !== "Negative" && "text-red-600"
                              )}>
                                {value} {config?.unit || ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Clinical Interpretation - SHOW AT END AS REFERENCE */}
            {(() => {
              const results = parseJSON<Record<string, Record<string, string>>>(selectedLabTest.results, {});
              const criticalFindings: string[] = [];
              const warnings: string[] = [];

              // Helper function to check if titer is significant
              const getTiterValue = (titer: string): number => {
                const match = titer?.match(/1:(\d+)/);
                return match ? parseInt(match[1]) : 0;
              };

              // Analyze results for critical findings
              Object.entries(results).forEach(([testName, testData]) => {
                // ===== MALARIA DETECTION =====
                if (testName === "Blood Film for Malaria (BFFM)") {
                  const parasites = testData["Malaria Parasites"];
                  if (parasites && parasites !== "Not seen" && parasites !== "Negative") {
                    criticalFindings.push(`🔴 POSITIVE for ${parasites} malaria - Requires immediate treatment`);
                  }
                  if (testData["Gametocytes"] === "Seen") {
                    warnings.push(`⚠️ Gametocytes present - Patient is infectious`);
                  }
                }

                // ===== WIDAL TEST (TYPHOID) =====
                if (testName === "Widal Test (Typhoid)") {
                  const oAg = getTiterValue(testData["S. Typhi (O)Ag"]);
                  const hAg = getTiterValue(testData["S. Typhi (H)Ag"]);
                  const paraA = getTiterValue(testData["S. Paratyphi A"]);
                  const paraB = getTiterValue(testData["S. Paratyphi B"]);
                  
                  if (oAg >= 320 || hAg >= 320) {
                    criticalFindings.push(`🔴 VERY HIGH typhoid titers (O:1:${oAg}, H:1:${hAg}) - Strongly suggests active typhoid infection`);
                  } else if (oAg >= 160 || hAg >= 160) {
                    warnings.push(`⚠️ HIGH typhoid titers (O:1:${oAg}, H:1:${hAg}) - Probable typhoid fever, start treatment`);
                  } else if (oAg >= 80 || hAg >= 80) {
                    warnings.push(`⚠️ Elevated typhoid titers - Consider typhoid fever`);
                  }

                  if (paraA >= 160 || paraB >= 160) {
                    warnings.push(`⚠️ Elevated paratyphoid titers detected`);
                  }
                }

                // ===== BRUCELLA TEST =====
                if (testName === "Brucella Test (B.A.T)") {
                  const abortus = getTiterValue(testData["B. Abortus"]);
                  const malitensis = getTiterValue(testData["B. Malitensis"]);
                  
                  if (abortus >= 160 || malitensis >= 160) {
                    criticalFindings.push(`🔴 POSITIVE for Brucellosis (Abortus:1:${abortus}, Malitensis:1:${malitensis}) - Zoonotic infection requiring treatment`);
                  } else if (abortus >= 80 || malitensis >= 80) {
                    warnings.push(`⚠️ Possible Brucellosis - Consider patient history and clinical correlation`);
                  }
                }

                // ===== VDRL TEST (SYPHILIS) =====
                if (testName === "VDRL Test (Syphilis)") {
                  const result = testData["VDRL Result"];
                  const titer = testData["Titer"];
                  
                  if (result === "Reactive" || result === "Positive") {
                    criticalFindings.push(`🔴 POSITIVE for Syphilis (VDRL Reactive${titer ? `, titer: ${titer}` : ""}) - Requires confirmatory testing and treatment`);
                  }
                }

                // ===== HEPATITIS B (HBsAg) =====
                if (testName === "Hepatitis B Test (HBsAg)") {
                  const result = testData["HBsAg Result"];
                  if (result === "Reactive" || result === "Positive") {
                    criticalFindings.push(`🔴 POSITIVE for Hepatitis B - Patient is HBsAg positive, infectious`);
                  }
                }

                // ===== URINE ANALYSIS =====
                if (testName === "Urine Analysis") {
                  const appearance = testData["Appearance"];
                  const protein = testData["Protein"];
                  const glucose = testData["Glucose"];
                  const hbPigment = testData["Hb pigment"];
                  const nitrite = testData["Nitrite"];
                  const leucocytes = testData["Leucocytes"];

                  // Bloody urine
                  if (appearance?.toLowerCase().includes("bloody") || appearance?.toLowerCase().includes("red")) {
                    criticalFindings.push(`🔴 Bloody urine detected - Possible bleeding, trauma, or severe infection`);
                  }

                  // Significant proteinuria
                  if (protein && (protein.includes("+++") || protein.includes("++++"))) {
                    criticalFindings.push(`🔴 Severe proteinuria (${protein}) - Kidney damage likely, needs urgent evaluation`);
                  } else if (protein && protein !== "Negative" && protein !== "-") {
                    warnings.push(`⚠️ Proteinuria detected (${protein}) - Kidney function needs assessment`);
                  }

                  // Glucosuria
                  if (glucose && glucose !== "Negative" && glucose !== "-") {
                    warnings.push(`⚠️ Glucosuria (${glucose}) - Check blood glucose levels, rule out diabetes`);
                  }

                  // Blood in urine
                  if (hbPigment && (hbPigment === "Positive" || hbPigment.includes("+"))) {
                    warnings.push(`⚠️ Blood in urine (Hb ${hbPigment}) - Further investigation needed`);
                  }

                  // Nitrite positive - suggests bacterial infection
                  if (nitrite === "Positive") {
                    warnings.push(`⚠️ Nitrite positive - Bacterial urinary tract infection likely`);
                  }

                  // Leucocytes in urine
                  if (leucocytes && leucocytes !== "Negative" && leucocytes !== "-") {
                    warnings.push(`⚠️ Leucocytes in urine (${leucocytes}) - Urinary tract infection or inflammation`);
                  }
                }

                // ===== COMPLETE BLOOD COUNT (CBC) =====
                if (testName === "Complete Blood Count (CBC)") {
                  const hb = parseFloat(testData["Hemoglobin"]);
                  const wbc = parseFloat(testData["WBC Count"] || testData["WBC"]);
                  const platelets = parseFloat(testData["Platelets"]);
                  
                  // Severe anemia
                  if (!isNaN(hb) && hb < 7) {
                    criticalFindings.push(`🔴 SEVERE anemia (Hb: ${hb} g/dL) - Requires urgent blood transfusion consideration`);
                  } else if (!isNaN(hb) && hb < 10) {
                    warnings.push(`⚠️ Moderate anemia (Hb: ${hb} g/dL) - Requires treatment`);
                  }
                  
                  // Elevated WBC
                  if (!isNaN(wbc) && wbc > 15000) {
                    warnings.push(`⚠️ Elevated WBC (${wbc.toLocaleString()}) - Possible severe infection or leukemia`);
                  } else if (!isNaN(wbc) && wbc > 11000) {
                    warnings.push(`⚠️ Elevated WBC (${wbc.toLocaleString()}) - Possible infection`);
                  }

                  // Low WBC
                  if (!isNaN(wbc) && wbc < 4000) {
                    warnings.push(`⚠️ Low WBC (${wbc.toLocaleString()}) - Immunosuppression, needs evaluation`);
                  }

                  // Thrombocytopenia
                  if (!isNaN(platelets) && platelets < 50) {
                    criticalFindings.push(`🔴 Severe thrombocytopenia (Platelets: ${platelets} x10³/µL) - Bleeding risk, urgent care needed`);
                  } else if (!isNaN(platelets) && platelets < 150) {
                    warnings.push(`⚠️ Low platelets (${platelets} x10³/µL) - Monitor for bleeding`);
                  }
                }

                // ===== LIVER FUNCTION TEST =====
                if (testName === "Liver Function Test (LFT)") {
                  const alt = parseFloat(testData["ALT (SGPT)"]);
                  const ast = parseFloat(testData["AST (SGOT)"]);
                  const bilirubin = parseFloat(testData["Total Bilirubin"]);
                  
                  if (!isNaN(alt) && alt > 200) {
                    criticalFindings.push(`🔴 Severely elevated ALT (${alt} U/L) - Significant liver damage`);
                  } else if (!isNaN(alt) && alt > 100) {
                    warnings.push(`⚠️ Elevated ALT (${alt} U/L) - Liver function impaired`);
                  }
                  
                  if (!isNaN(ast) && ast > 200) {
                    criticalFindings.push(`🔴 Severely elevated AST (${ast} U/L) - Significant liver damage`);
                  } else if (!isNaN(ast) && ast > 100) {
                    warnings.push(`⚠️ Elevated AST (${ast} U/L) - Liver damage possible`);
                  }

                  if (!isNaN(bilirubin) && bilirubin > 3) {
                    warnings.push(`⚠️ Elevated bilirubin (${bilirubin} mg/dL) - Jaundice, liver dysfunction`);
                  }
                }

                // ===== RENAL FUNCTION TEST =====
                if (testName === "Renal Function Test (RFT)") {
                  const creatinine = parseFloat(testData["Creatinine"]);
                  const urea = parseFloat(testData["Urea"] || testData["Blood Urea"]);
                  
                  if (!isNaN(creatinine) && creatinine > 3) {
                    criticalFindings.push(`🔴 Severely elevated creatinine (${creatinine} mg/dL) - Acute kidney injury or failure`);
                  } else if (!isNaN(creatinine) && creatinine > 1.5) {
                    warnings.push(`⚠️ Elevated creatinine (${creatinine} mg/dL) - Kidney function compromised`);
                  }

                  if (!isNaN(urea) && urea > 50) {
                    warnings.push(`⚠️ Elevated urea (${urea} mg/dL) - Kidney dysfunction`);
                  }
                }

                // ===== BLOOD GLUCOSE =====
                if (testName === "Blood Glucose Test") {
                  const fbs = parseFloat(testData["Fasting Blood Sugar (FBS)"]);
                  const rbs = parseFloat(testData["Random Blood Sugar (RBS)"]);
                  
                  if (!isNaN(fbs) && fbs > 200) {
                    criticalFindings.push(`🔴 Very high fasting glucose (${fbs} mg/dL) - Diabetes, needs urgent management`);
                  } else if (!isNaN(fbs) && fbs > 126) {
                    warnings.push(`⚠️ Elevated fasting glucose (${fbs} mg/dL) - Diabetes likely`);
                  }

                  if (!isNaN(rbs) && rbs > 300) {
                    criticalFindings.push(`🔴 Dangerously high blood sugar (${rbs} mg/dL) - Diabetic emergency risk`);
                  } else if (!isNaN(rbs) && rbs > 200) {
                    warnings.push(`⚠️ High random blood sugar (${rbs} mg/dL) - Diabetes evaluation needed`);
                  }
                }

                // ===== H. PYLORI TEST =====
                if (testName === "H. Pylori Test") {
                  const result = testData["H. Pylori Antigen"];
                  if (result === "Positive") {
                    warnings.push(`⚠️ H. Pylori POSITIVE - Causative agent of peptic ulcer disease, requires treatment with antibiotics`);
                  }
                }

                // ===== HEPATITIS C TEST (HCV) =====
                if (testName === "Hepatitis C Test (HCV)") {
                  const result = testData["HCV Antibody"];
                  if (result === "Positive") {
                    criticalFindings.push(`🔴 POSITIVE for Hepatitis C - Chronic liver infection, requires confirmatory testing and specialist referral`);
                  }
                }

                // ===== HIV TEST =====
                if (testName === "HIV Test") {
                  const result = testData["HIV Antibody"];
                  if (result === "Positive") {
                    criticalFindings.push(`🔴 POSITIVE for HIV - Requires confirmatory testing, counseling, and antiretroviral therapy`);
                  }
                }

                // ===== GONORRHEA TEST =====
                if (testName === "Gonorrhea Test") {
                  const result = testData["Gonorrhea"];
                  if (result === "Positive") {
                    criticalFindings.push(`🔴 POSITIVE for Gonorrhea - Sexually transmitted infection requiring antibiotic treatment and partner notification`);
                  }
                }

                // ===== PREGNANCY TEST (HCG) =====
                if (testName === "Pregnancy Test (HCG)") {
                  const result = testData["β-hCG"];
                  if (result === "Positive") {
                    warnings.push(`⚠️ Pregnancy test POSITIVE - Confirm pregnancy and initiate prenatal care`);
                  }
                }

                // ===== ESR (ERYTHROCYTE SEDIMENTATION RATE) =====
                if (testName === "ESR (Erythrocyte Sedimentation Rate)") {
                  const esr = parseFloat(testData["ESR (1 hour)"]);
                  if (!isNaN(esr) && esr > 50) {
                    warnings.push(`⚠️ Markedly elevated ESR (${esr} mm/hr) - Significant inflammation, infection, or malignancy possible`);
                  } else if (!isNaN(esr) && esr > 30) {
                    warnings.push(`⚠️ Elevated ESR (${esr} mm/hr) - Inflammatory process present`);
                  }
                }

                // ===== RHEUMATOID FACTOR =====
                if (testName === "Rheumatoid Factor") {
                  const result = testData["RF"];
                  const titer = testData["Titer"];
                  if (result === "Positive") {
                    if (titer && (titer.includes(">80") || titer.includes("40-80"))) {
                      warnings.push(`⚠️ Rheumatoid Factor POSITIVE (titer: ${titer}) - Strongly suggests rheumatoid arthritis or autoimmune disease`);
                    } else {
                      warnings.push(`⚠️ Rheumatoid Factor POSITIVE - May indicate rheumatoid arthritis, requires clinical correlation`);
                    }
                  }
                }

                // ===== HEMOGLOBIN (HB) =====
                if (testName === "Hemoglobin (HB)") {
                  const hb = parseFloat(testData["Hemoglobin"]);
                  if (!isNaN(hb) && hb < 7) {
                    criticalFindings.push(`🔴 SEVERE anemia (Hb: ${hb} g/dL) - Requires urgent blood transfusion consideration`);
                  } else if (!isNaN(hb) && hb < 10) {
                    warnings.push(`⚠️ Moderate anemia (Hb: ${hb} g/dL) - Requires treatment and investigation`);
                  } else if (!isNaN(hb) && hb < 12) {
                    warnings.push(`⚠️ Mild anemia (Hb: ${hb} g/dL) - Monitor and consider iron supplementation`);
                  }
                }

                // ===== TOTAL WHITE BLOOD COUNT (TWBC) =====
                if (testName === "Total White Blood Count (TWBC)") {
                  const wbc = parseFloat(testData["WBC"]);
                  if (!isNaN(wbc) && wbc > 15) {
                    warnings.push(`⚠️ Elevated WBC (${wbc} x10³/µL) - Possible severe infection or leukemia`);
                  } else if (!isNaN(wbc) && wbc > 11) {
                    warnings.push(`⚠️ Elevated WBC (${wbc} x10³/µL) - Possible infection`);
                  } else if (!isNaN(wbc) && wbc < 4) {
                    warnings.push(`⚠️ Low WBC (${wbc} x10³/µL) - Immunosuppression, requires evaluation`);
                  }
                }
              });

              return (criticalFindings.length > 0 || warnings.length > 0) ? (
                <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded p-3">
                  <h2 className="text-sm font-bold mb-1 text-yellow-900 flex items-center">
                    <span className="text-base mr-1">ℹ️</span> Clinical Interpretation
                  </h2>
                  {criticalFindings.length > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold text-red-800 mb-1 text-xs">Critical Findings Requiring Attention:</p>
                      <div className="space-y-0.5">
                        {criticalFindings.map((finding, i) => (
                          <div key={i} className="bg-red-100 border-l-2 border-red-600 p-1.5 text-xs">
                            {finding}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {warnings.length > 0 && (
                    <div className="space-y-0.5">
                      {warnings.map((warning, i) => (
                        <div key={i} className="bg-yellow-100 border-l-2 border-yellow-600 p-1.5 text-xs">
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-gray-300 text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Completed Date:</strong> {resultsForm.getValues("completedDate")}</p>
                  <p><strong>Result Status:</strong> <span className="capitalize">{resultsForm.getValues("resultStatus")}</span></p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Lab Technician Signature:</p>
                  <div className="border-b border-gray-400 w-48 ml-auto mt-6"></div>
                </div>
              </div>
              {resultsForm.getValues("technicianNotes") && (
                <div className="mt-3">
                  <p><strong>Technician Notes:</strong></p>
                  <p className="text-gray-700">{resultsForm.getValues("technicianNotes")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
    </div>
  );
}
