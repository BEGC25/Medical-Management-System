import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, Link } from "wouter";
import {
  Save,
  FileText,
  Printer,
  ShoppingCart,
  Plus,
  DollarSign,
  Pill,
  Activity,
  Trash2,
  Edit,
  X,
  AlertTriangle,
  Heart,
  History,
  Clock,
  Search,
  Loader2,
  ChevronDown, // Icon for Accordion
  Stethoscope,
  Users,
  ClipboardList,
  AlertCircle,
  Beaker,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
// NEW: Import Accordion components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";

import ResultDrawer from "@/components/ResultDrawer";
import { DischargeSummary } from "@/components/DischargeSummary";

import {
  insertTreatmentSchema,
  type InsertTreatment,
  type Patient,
  type Treatment,
  type Encounter,
  type Service,
  type Drug,
  type PharmacyOrder,
  type LabTest // Assuming LabTest type includes interpretation field
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";
import { getDateRangeForAPI, getClinicRangeKeys, formatDateInZone, getZonedNow, getClinicDayKey, formatClinicDayKey, formatClinicDateTime } from "@/lib/date-utils";

// ---------- helpers ----------
function parseJSON<T = any>(v: any, fallback: T): T {
  try {
    // Check if it's already an object (e.g., from direct API response)
    if (typeof v === 'object' && v !== null) return v;
    return JSON.parse(v ?? "");
  } catch {
    return fallback;
  }
}

// Type for orders returned from /api/visits/:visitId/orders
// These have additional properties beyond the base LabTest/XRay/Ultrasound types
type VisitOrder = {
  orderId: string | number;
  visitId: string;
  type: string;
  name: string;
  status: string;
  isPaid: boolean;
  orderLine?: {
    id: number;
    acknowledgedAt?: string | null;
    acknowledgedBy?: string | null;
    addToCart?: boolean;
  };
  [key: string]: any; // Allow other properties
};

// Helper to check if a lab value is abnormal based on resultFields config
function isAbnormal(val: string | number | undefined | null, cfg?: { normal?: string; range?: string }) {
  if (val === undefined || val === null || !cfg) return false;
  const valueStr = String(val);

  // Check against normal value if provided
  if (cfg.normal) {
    // Consider common "normal" strings
    const normalStrings = ["negative", "not seen", "none", "clear"];
    if (normalStrings.includes(valueStr.toLowerCase())) return false;
    return cfg.normal.toLowerCase() !== valueStr.toLowerCase();
  }

  // Check against numeric range if provided
  if (cfg.range && typeof val === 'number') {
    const [minStr, maxStr] = cfg.range.split('-');
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);
    if (!isNaN(min) && !isNaN(max)) {
      return val < min || val > max;
    }
  }

  return false; // Default to not abnormal if no clear rule
}


// --- Quick Orders helpers ---
// ... (keep CATEGORY_ALIASES and matchesCategory as they are) ...
const CATEGORY_ALIASES: Record<"lab" | "xray" | "ultrasound" | "consult" | "pharmacy", string[]> = {
  lab: ["lab", "labs", "laboratory", "hematology", "chemistry", "microbiology"],
  xray: ["xray", "x-ray", "radiology-xray", "radiology_xray", "radiology"],
  ultrasound: ["ultrasound", "u/s", "sonography", "radiology-ultrasound"],
  consult: ["consult", "consultation", "general consultation"],
  pharmacy: ["pharmacy", "drug", "medication", "dispensary"],
};
function matchesCategory(svc: any, active: keyof typeof CATEGORY_ALIASES) {
  const c = (svc?.category ?? "").toString().toLowerCase().trim();
  return CATEGORY_ALIASES[active].some((alias) => c.includes(alias));
}

const resultFields: Record< // Keep this config for metadata
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
  "Complete Blood Count (CBC)": {
    WBC: { type: "number", unit: "x10³/µL", normal: "4.0-11.0", range: "4.0-11.0" },
    RBC: { type: "number", unit: "x10⁶/µL", normal: "4.5-5.5", range: "4.5-5.5" },
    Hemoglobin: { type: "number", unit: "g/dL", normal: "12-16", range: "12-16" },
    Hematocrit: { type: "number", unit: "%", normal: "36-46", range: "36-46" },
    Platelets: { type: "number", unit: "x10³/µL", normal: "150-400", range: "150-400" },
    MCV: { type: "number", unit: "fL", normal: "80-100", range: "80-100" },
    MCH: { type: "number", unit: "pg", normal: "27-32", range: "27-32" },
    MCHC: { type: "number", unit: "g/dL", normal: "32-36", range: "32-36" },
  },
  "Blood Film for Malaria (BFFM)": {
    "Malaria Parasites": { type: "select", options: ["Not seen", "P. falciparum", "P. vivax", "P. malariae", "P. ovale"], normal: "Not seen" },
    Parasitemia: { type: "select", options: ["None", "+", "++", "+++"], normal: "None" },
    Gametocytes: { type: "select", options: ["Not seen", "Seen"], normal: "Not seen" },
  },
  "Urine Analysis": {
    Appearance: { type: "select", options: ["Clear", "Turbid", "Bloody", "Cloudy"], normal: "Clear" },
    Protein: { type: "select", options: ["Negative", "Trace", "+", "++", "+++"], normal: "Negative" },
    Glucose: { type: "select", options: ["Negative", "+", "++", "+++"], normal: "Negative" },
    Acetone: { type: "select", options: ["Negative", "Positive"], normal: "Negative" },
    "Hb pigment": { type: "select", options: ["Negative", "Positive"], normal: "Negative" },
    Leucocytes: { type: "select", options: ["Negative", "+", "++", "+++"], normal: "Negative" },
    Nitrite: { type: "select", options: ["Negative", "Positive"], normal: "Negative" },
    PH: { type: "number", unit: "", range: "5.0-8.0", normal: "6.0-7.5" },
    "Specific Gravity": { type: "number", unit: "", range: "1.003-1.030", normal: "1.010-1.025" },
    Bilirubin: { type: "select", options: ["Negative", "Positive"], normal: "Negative" },
  },
  // ... (keep other resultFields definitions) ...
};

// Lab test categories (from Laboratory page)
const commonTests = {
  hematology: [
    "Blood Film for Malaria (BFFM)",
    "Complete Blood Count (CBC)",
    "Hemoglobin (HB)",
    "Total White Blood Count (TWBC)",
    "Blood Group & Rh",
    "ESR (Erythrocyte Sedimentation Rate)",
    "Rheumatoid Factor",
  ],
  serology: [
    "Widal Test (Typhoid)",
    "Brucella Test (B.A.T)",
    "Hepatitis B Test (HBsAg)",
    "Hepatitis C Test (HCV)",
    "H. Pylori Test",
    "VDRL Test (Syphilis)",
  ],
  reproductive: [
    "Pregnancy Test (HCG)",
    "Gonorrhea Test",
    "Chlamydia Test",
    "Reproductive Hormones",
  ],
  parasitology: [
    "Toxoplasma Test",
    "Filariasis Tests",
    "Schistosomiasis Test",
    "Leishmaniasis Test",
  ],
  hormones: ["Thyroid Hormones", "Reproductive Hormones", "Cardiac & Other Markers"],
  tuberculosis: ["Tuberculosis Tests"],
  emergency: ["Meningitis Tests", "Yellow Fever Test", "Typhus Test"],
  urine: ["Urine Analysis", "Urine Microscopy"],
  biochemistry: [
    "Renal Function Test (RFT)",
    "Liver Function Test (LFT)",
    "Random Blood Sugar (RBS)",
    "Fasting Blood Sugar (FBS)",
  ],
  stool: ["Stool Examination"],
};

// ---------- component ----------
export default function Treatment() {
  // ... (keep existing state variables: selectedPatient, showPrescription, etc.) ...
  const { visitId: rawVisitId } = useParams<{ visitId?: string }>();
  const visitId = rawVisitId && rawVisitId !== "new" ? rawVisitId : undefined;
  const searchParams = new URLSearchParams(window.location.search);
  const patientIdFromQuery = searchParams.get("patientId") || undefined;

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [savedTreatment, setSavedTreatment] = useState<Treatment | null>(null);
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [activeTab, setActiveTab] = useState("notes"); // For the new top-level tabs

  // State for the NEW sub-tabs inside "Orders & Results"
  const [qoTab, setQoTab] = useState<"lab" | "xray" | "ultrasound" | "consult" | "pharmacy" | "all">("all");
  const [qoSearch, setQoSearch] = useState("");

  // unified result drawer state
  const [resultDrawer, setResultDrawer] = useState<{
    open: boolean;
    kind: "lab" | "xray" | "ultrasound" | null;
    data: any | null;
  }>({ open: false, kind: null, data: null });

  const openResult = (kind: "lab" | "xray" | "ultrasound", data: any) =>
    setResultDrawer({ open: true, kind, data });
  const closeResult = () => setResultDrawer({ open: false, kind: null, data: null });

  // Medication ordering state
  const [medications, setMedications] = useState<
    Array<{ drugId: number; drugName: string; dosage: string; quantity: number; instructions: string }>
  >([]);
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [selectedDrugName, setSelectedDrugName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedQuantity, setNewMedQuantity] = useState(0);
  const [newMedInstructions, setNewMedInstructions] = useState("");

  // Prescription editing
  const [editingPrescription, setEditingPrescription] = useState<PharmacyOrder | null>(null);
  const [editDosage, setEditDosage] = useState("");
  const [editQuantity, setEditQuantity] = useState(0);
  const [editInstructions, setEditInstructions] = useState("");

  // Patient search
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);

  // Date filtering - normalized preset values to match backend (today/yesterday/last7/last30/custom)
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "last7" | "last30" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [quickFilter, setQuickFilter] = useState<"today" | "active" | "pending" | null>("today"); // Quick filter from stat cards

  // Build preset parameter for API calls - no more local date math
  // Server handles all date range calculations using Africa/Juba timezone
  const presetParams = useMemo(() => {
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      return {
        preset: "custom" as const,
        from: getClinicDayKey(customStartDate),
        to: getClinicDayKey(customEndDate),
      };
    }
    return { preset: dateFilter };
  }, [dateFilter, customStartDate, customEndDate]);

  // Queue modal - use preset 'today' for consistent filtering
  const [queueOpen, setQueueOpen] = useState(false);
  const [queueFilter, setQueueFilter] = useState("");

  // Lab test selection state (for category-based ordering)
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [currentLabCategory, setCurrentLabCategory] = useState<keyof typeof commonTests>("hematology");
  const [labPriority, setLabPriority] = useState<"routine" | "urgent" | "stat">("routine");
  const [labClinicalInfo, setLabClinicalInfo] = useState("");

  // Edit lab test modal state
  const [editLabModalOpen, setEditLabModalOpen] = useState(false);
  const [labTestToEdit, setLabTestToEdit] = useState<any>(null);
  const [editLabTests, setEditLabTests] = useState<string[]>([]);
  const [editLabCategory, setEditLabCategory] = useState<keyof typeof commonTests>("hematology");
  const [editLabPriority, setEditLabPriority] = useState<"routine" | "urgent" | "stat">("routine");
  const [editLabClinicalInfo, setEditLabClinicalInfo] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();


  // ... (keep useEffect hooks and data fetching queries as they are) ...
  // open queue if ?filter=today
  useEffect(() => {
    const filter = new URLSearchParams(window.location.search).get("filter");
    if (filter === "today") {
      setQueueOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // reset when no visitId
  useEffect(() => {
    if (!visitId) {
      setSelectedPatient(null);
      setCurrentEncounter(null);
      setSavedTreatment(null);
      setMedications([]);
    }
  }, [visitId]);

  // patients (for names in queue)
  const { data: allPatients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: queueOpen || !visitId,
  });

  // queue - using preset 'today' for consistent filtering
  const { data: queueVisits = [], isLoading: queueLoading } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments", { preset: 'today' }],
    queryFn: async () => {
      const url = new URL("/api/treatments", window.location.origin);
      url.searchParams.set("preset", "today");
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch treatments");
      }
      return response.json();
    },
    enabled: queueOpen,
  });

  // filter out soft-deleted patients
  const activePatients = allPatients.filter((p: any) => !p.is_deleted);
  const activePatientIds = new Set(activePatients.map((p) => p.patientId));

  const getPatientName = (patientId: string): string => {
    const patient = activePatients.find((p) => p.patientId === patientId);
    if (!patient) return patientId;
    return `${patient.firstName} ${patient.lastName}`;
  };

  const visibleQueue = queueVisits.filter((v) => {
    if (!activePatientIds.has(v.patientId)) return false;
    if (!queueFilter) return true;
    const needle = queueFilter.toLowerCase();
    const name = getPatientName(v.patientId).toLowerCase();
    return (
      name.includes(needle) ||
      v.patientId.toLowerCase().includes(needle) ||
      (v.chiefComplaint || "").toLowerCase().includes(needle) ||
      (v.diagnosis || "").toLowerCase().includes(needle)
    );
  });

  // form
  const form = useForm<InsertTreatment>({
    resolver: zodResolver(insertTreatmentSchema),
    defaultValues: {
      patientId: "",
      // Use clinic timezone (Africa/Juba) for visitDate to ensure consistent day classification.
      // Using UTC `.toISOString().split("T")[0]` would cause records around midnight to be 
      // classified into wrong clinic day.
      visitDate: formatDateInZone(getZonedNow()),
      visitType: "consultation",
      priority: "routine",
      chiefComplaint: "",
      temperature: null,
      bloodPressure: "",
      heartRate: null,
      weight: null,
      examination: "",
      diagnosis: "",
      treatmentPlan: "",
      followUpDate: "",
      followUpType: "",
    },
  });

  // Watch vitals from the form to display in the right rail
  const watchedVitals = form.watch(["temperature", "bloodPressure", "heartRate", "weight"]);

  // services & drugs
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: drugs = [] } = useQuery<Drug[]>({ queryKey: ["/api/pharmacy/drugs"] });
  
  // Statistics for header
  const { data: patientCounts } = useQuery<{ today: number; all: number }>({
    queryKey: ["/api/patients/counts"],
  });
  
  const { data: unpaidOrders } = useQuery({
    queryKey: ["/api/unpaid-orders/all"],
  });

  // visit via /treatment/:visitId
  const { data: loadedVisit } = useQuery({
    queryKey: ["/api/encounters", visitId],
    queryFn: async () => {
      if (!visitId) return null;
      const r = await fetch(`/api/encounters/${visitId}`);
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!visitId,
  });

  const { data: loadedPatient } = useQuery<Patient | null>({
    queryKey: ["/api/patients", loadedVisit?.encounter?.patientId],
    queryFn: async () => {
      const pid = loadedVisit?.encounter?.patientId;
      if (!pid) return null;
      const r = await fetch(`/api/patients/${pid}`);
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!loadedVisit?.encounter?.patientId,
  });

  // visit via /treatment/new?patientId=...
  const { data: patientFromQuery } = useQuery<Patient | null>({
    queryKey: ["/api/patients", patientIdFromQuery],
    queryFn: async () => {
      if (!patientIdFromQuery) return null;
      const r = await fetch(`/api/patients/${patientIdFromQuery}`);
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!patientIdFromQuery && !visitId && !selectedPatient,
  });

  useEffect(() => {
    if (patientFromQuery) setSelectedPatient(patientFromQuery);
  }, [patientFromQuery]);

  // today's encounter (legacy flow)
  const { data: todayEncounter } = useQuery<Encounter | null>({
    queryKey: ["/api/encounters", { pid: selectedPatient?.patientId, preset: 'today' }],
    queryFn: async () => {
      if (!selectedPatient) return null;
      // Use preset=today instead of legacy date parameter for clinic timezone consistency
      const r = await fetch(`/api/encounters?preset=today&patientId=${selectedPatient.patientId}`);
      if (!r.ok) return null;
      const encounters = await r.json();
      return encounters[0] || null;
    },
    enabled: !!selectedPatient && !visitId,
  });

  // unified orders for this visit
  const activeEncounterId = visitId ? loadedVisit?.encounter?.encounterId : currentEncounter?.encounterId;
  // Type as any[] since orders contain mixed types with additional backend properties
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/visits", activeEncounterId, "orders"],
    queryFn: async () => {
      if (!activeEncounterId) return [];
      const r = await fetch(`/api/visits/${activeEncounterId}/orders`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!activeEncounterId,
  });


  // Filter orders by type (keep as any to preserve backend properties like orderId, isPaid)
  const labTests = useMemo(() => orders.filter((o) => o.type === "lab"), [orders]);
  const xrays = useMemo(() => orders.filter((o) => o.type === "xray"), [orders]);
  const ultrasounds = useMemo(() => orders.filter((o) => o.type === "ultrasound"), [orders]);
  
  // Count only diagnostic tests (lab + xray + ultrasound) for badge
  const diagnosticTestCount = useMemo(() => labTests.length + xrays.length + ultrasounds.length, [labTests, xrays, ultrasounds]);


  // ... (keep existing treatment query, pharmacy orders query, recent treatments query) ...
  // existing treatment for this encounter
  const { data: existingTreatment } = useQuery<Treatment | null>({
    queryKey: ["/api/treatments", "encounter", currentEncounter?.encounterId],
    queryFn: async () => {
      if (!currentEncounter?.encounterId) return null;
      const r = await fetch(`/api/treatments?encounterId=${currentEncounter.encounterId}`);
      if (!r.ok) return null;
      const t = await r.json();
      return t[0] || null;
    },
    enabled: !!currentEncounter?.encounterId,
  });

  // pharmacy orders for patient
  const { data: allPrescriptions = [] } = useQuery<PharmacyOrder[]>({
    queryKey: ["/api/pharmacy-orders", selectedPatient?.patientId],
    queryFn: async () => {
      if (!selectedPatient?.patientId) return [];
      const r = await fetch(`/api/pharmacy-orders/${selectedPatient.patientId}`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!selectedPatient?.patientId,
  });

  // recent visits (for history tab stub)
  const { data: recentTreatments = [] } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments", "patient", selectedPatient?.patientId],
    queryFn: async () => {
      if (!selectedPatient?.patientId) return [];
      const r = await fetch(`/api/treatments?patientId=${selectedPatient.patientId}`);
      if (!r.ok) return [];
      const t = await r.json();
      return t.slice(0, 5); // Get 5 for the stub
    },
    enabled: !!selectedPatient?.patientId,
  });



  // ... (keep useEffect for syncing/checks and populating form) ...
  // encounter sync for /treatment/:visitId
  useEffect(() => {
    if (loadedVisit?.encounter && loadedPatient && !selectedPatient) {
      setSelectedPatient(loadedPatient);
      setCurrentEncounter(loadedVisit.encounter);
    }
  }, [loadedVisit, loadedPatient]);

  // safety check: mismatch patient/encounter
  useEffect(() => {
    if (selectedPatient && currentEncounter && selectedPatient.patientId !== currentEncounter.patientId) {
      window.location.href = `/treatment/new?patientId=${selectedPatient.patientId}`;
    }
  }, [selectedPatient, currentEncounter]);

  // populate form when existing treatment found
  useEffect(() => {
    if (existingTreatment && selectedPatient) {
      form.reset({
        patientId: existingTreatment.patientId,
        visitDate: existingTreatment.visitDate,
        visitType: existingTreatment.visitType,
        priority: existingTreatment.priority,
        chiefComplaint: existingTreatment.chiefComplaint || "",
        temperature: existingTreatment.temperature,
        bloodPressure: existingTreatment.bloodPressure || "",
        heartRate: existingTreatment.heartRate,
        weight: existingTreatment.weight,
        examination: existingTreatment.examination || "",
        diagnosis: existingTreatment.diagnosis || "",
        treatmentPlan: existingTreatment.treatmentPlan || "",
        followUpDate: existingTreatment.followUpDate || "",
        followUpType: existingTreatment.followUpType || "",
      });
      setSavedTreatment(existingTreatment);
    }
  }, [existingTreatment, selectedPatient]);

  // legacy: create encounter if none today
  useEffect(() => {
    if (visitId) return;
    if (todayEncounter) {
      setCurrentEncounter(todayEncounter);
    } else if (selectedPatient) {
      createEncounterMutation.mutate({
        patientId: selectedPatient.patientId,
        visitDate: getClinicDayKey(),
        attendingClinician: "Dr. System",
      });
    }
  }, [todayEncounter, selectedPatient, visitId]);


  // --- mutations ---
  // ... (keep createEncounterMutation, orderMutation, addConsultationMutation, createTreatmentMutation) ...
  // ... (keep acknowledgeMutation, addToCartMutation, toggleAcknowledgeAndCart) ...
  // ... (keep submitMedicationsMutation, cancelPrescriptionMutation, editPrescriptionMutation, closeVisitMutation) ...
    // --- mutations ---
  const createEncounterMutation = useMutation({
    mutationFn: async (data: { patientId: string; visitDate: string; attendingClinician: string }) => {
      const r = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Failed to create encounter");
      return r.json();
    },
    onSuccess: (encounter) => {
      setCurrentEncounter(encounter);
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
    },
  });

  // NEW: Re-usable order mutation for the "+ Add" buttons
  const orderMutation = useMutation({
    mutationFn: async (payload: { serviceId: number; kind: string; name: string; price: number }) => {
      if (!currentEncounter) throw new Error("No active encounter");
      const { serviceId, kind, name, price } = payload;
      const body = {
        encounterId: currentEncounter.encounterId,
        serviceId,
        relatedType: kind,
        description: name,
        quantity: 1,
        unitPriceSnapshot: price,
        totalPrice: price,
        department: kind,
        orderedBy: "Dr. System",
      };
      const res = await apiRequest("POST", "/api/order-lines", body);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      toast({ title: "Order Added", description: data.description });
    },
    onError: (err: any) => {
      toast({ title: "Order Failed", description: err.message, variant: "destructive" });
    }
  });

  const addConsultationMutation = useMutation({
    mutationFn: async () => {
      if (!currentEncounter) throw new Error("No encounter found");
      const svc = services.find((s) => s.category === "consultation" && s.name.includes("General"));
      if (!svc) throw new Error("Consultation service not found");

      return orderMutation.mutateAsync({
        serviceId: svc.id,
        kind: "consultation",
        name: svc.name,
        price: svc.price || 0
      });
    },
    onSuccess: () => {
      // The orderMutation's onSuccess already handles this
    },
  });

  // Lab test submission mutation (submits multiple tests together)
  const submitLabTestsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) throw new Error("No patient selected");
      if (!currentEncounter) throw new Error("No active encounter");
      if (selectedLabTests.length === 0) throw new Error("Please select at least one test");
      
      // 1. Find lab service from catalog (similar to how consultation is found)
      const labService = services.find((s) => s.category === "laboratory");
      if (!labService) throw new Error("Laboratory service not found in catalog");
      if (!labService.price) {
        console.warn("Laboratory service has no price set in catalog");
      }
      
      // 2. Create the lab test record
      // Use clinic timezone (Africa/Juba) for requestedDate to ensure consistent day classification
      // across all pages (Treatment, Laboratory, Payments). Using UTC would cause records around
      // midnight to be classified into wrong clinic day.
      const labTestData = {
        patientId: selectedPatient.patientId,
        category: currentLabCategory,
        tests: JSON.stringify(selectedLabTests),
        priority: labPriority,
        clinicalInfo: labClinicalInfo,
        requestedDate: formatDateInZone(getZonedNow()),
      };
      
      const labTestRes = await apiRequest("POST", "/api/lab-tests", labTestData);
      const createdLabTest = await labTestRes.json();
      
      // 3. Create corresponding order_lines entry (like X-ray/Ultrasound do)
      const orderLineData = {
        encounterId: currentEncounter.encounterId,
        serviceId: labService.id,
        relatedType: "lab",
        relatedId: createdLabTest.testId,
        description: `Lab Tests: ${currentLabCategory} - ${selectedLabTests.join(", ")}`,
        quantity: 1,
        unitPriceSnapshot: labService.price || 0,
        totalPrice: labService.price || 0,
        department: "laboratory",
        orderedBy: "Dr. System",
      };
      
      const orderLineRes = await apiRequest("POST", "/api/order-lines", orderLineData);
      await orderLineRes.json();
      
      return createdLabTest;
    },
    onSuccess: () => {
      toast({ title: "Success", description: `${selectedLabTests.length} lab test(s) ordered successfully` });
      setSelectedLabTests([]);
      setLabClinicalInfo("");
      setLabPriority("routine");
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit lab tests", variant: "destructive" });
    },
  });

  // Helper to toggle test selection
  const handleLabTestToggle = (test: string) => {
    setSelectedLabTests((prev) => 
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  // Delete lab test mutation
  const deleteLabTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await apiRequest("DELETE", `/api/lab-tests/${testId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lab test cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits", currentEncounter?.encounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel lab test",
        variant: "destructive",
      });
    },
  });

  // Edit lab test mutation
  const editLabTestMutation = useMutation({
    mutationFn: async ({ testId, tests, priority, clinicalInfo }: { testId: string; tests: string; priority: string; clinicalInfo: string }) => {
      const response = await apiRequest("PATCH", `/api/lab-tests/${testId}`, {
        tests,
        priority,
        clinicalInfo,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lab test updated successfully" });
      setEditLabModalOpen(false);
      setLabTestToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits", currentEncounter?.encounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lab test",
        variant: "destructive",
      });
    },
  });

  // Handlers for edit/delete lab tests
  const handleEditLabTest = (test: any) => {
    setLabTestToEdit(test);
    const tests = parseJSON<string[]>(test.tests, []);
    setEditLabTests(tests);
    setEditLabPriority(test.priority);
    setEditLabClinicalInfo(test.clinicalInfo || "");
    
    // Set the correct category so checkboxes show the right tests
    if (test.category && test.category in commonTests) {
      setEditLabCategory(test.category as keyof typeof commonTests);
    } else if (tests.length > 0) {
      // Fallback: Find category by checking which category contains the first test
      const firstTest = tests[0];
      for (const [category, testList] of Object.entries(commonTests)) {
        if (testList.includes(firstTest)) {
          setEditLabCategory(category as keyof typeof commonTests);
          break;
        }
      }
    }
    
    setEditLabModalOpen(true);
  };

  const handleDeleteLabTest = (testId: string) => {
    if (confirm("Are you sure you want to cancel this lab test request?")) {
      deleteLabTestMutation.mutate(testId);
    }
  };

  const handleEditLabTestToggle = (test: string) => {
    setEditLabTests((prev) => (prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]));
  };

  const handleSaveLabEdit = () => {
    if (!labTestToEdit) return;
    if (editLabTests.length === 0) {
      toast({ title: "Error", description: "Please select at least one test", variant: "destructive" });
      return;
    }
    editLabTestMutation.mutate({
      testId: labTestToEdit.testId || labTestToEdit.orderId,
      tests: JSON.stringify(editLabTests),
      priority: editLabPriority,
      clinicalInfo: editLabClinicalInfo,
    });
  };

  const createTreatmentMutation = useMutation({
    mutationFn: async (data: InsertTreatment): Promise<Treatment> => {
      const r = await apiRequest("POST", "/api/treatments", data);
      return r.json();
    },
    onSuccess: (treatment: Treatment) => {
      setSavedTreatment(treatment);
      toast({ title: "Success", description: `Treatment saved (ID: ${treatment.treatmentId})` });
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      if (!navigator.onLine) {
        addToPendingSync({ type: "treatment", action: "create", data: form.getValues() });
        toast({ title: "Saved Offline", description: "Will sync when online." });
        setSavedTreatment(null);
        form.reset();
        setSelectedPatient(null);
      } else {
        toast({ title: "Error", description: "Failed to save treatment", variant: "destructive" });
      }
    },
  });


  const submitMedicationsMutation = useMutation({
    mutationFn: async (meds: typeof medications) => {
      if (!selectedPatient || !currentEncounter) throw new Error("No patient or encounter");
      const pharmacyService = services.find((s) => s.category === "pharmacy");
      if (!pharmacyService) throw new Error("Pharmacy service not found");

      const promises = meds.map((med) =>
        apiRequest("POST", "/api/pharmacy-orders", {
          patientId: selectedPatient.patientId,
          encounterId: currentEncounter.encounterId,
          treatmentId: savedTreatment?.treatmentId,
          serviceId: pharmacyService.id,
          drugId: med.drugId,
          drugName: med.drugName,
          dosage: med.dosage,
          quantity: med.quantity,
          instructions: med.instructions,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy/prescriptions/paid"] });
      setMedications([]);
      toast({ title: "Medications Ordered", description: "Sent to pharmacy" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.message || "Failed to submit medications", variant: "destructive" }),
  });

  const cancelPrescriptionMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const r = await apiRequest("PATCH", `/api/pharmacy-orders/${orderId}`, { status: "cancelled" });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
      toast({ title: "Cancelled", description: "Prescription cancelled" });
    },
    onError: () => toast({ title: "Error", description: "Failed to cancel prescription", variant: "destructive" }),
  });

  const editPrescriptionMutation = useMutation({
    mutationFn: async (data: { orderId: string; dosage: string; quantity: number; instructions: string }) => {
      const r = await apiRequest("PATCH", `/api/pharmacy-orders/${data.orderId}`, {
        dosage: data.dosage,
        quantity: data.quantity,
        instructions: data.instructions,
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
      setEditingPrescription(null);
      toast({ title: "Updated", description: "Prescription updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update prescription", variant: "destructive" }),
  });

  const closeVisitMutation = useMutation({
    mutationFn: async (encounterId: string) => {
      const r = await apiRequest("POST", `/api/encounters/${encounterId}/close`, {});
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      toast({ title: "Closed", description: "Visit closed" });
      setSelectedPatient(null);
      form.reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to close visit", variant: "destructive" }),
  });

  // ---------- behavior wiring ----------
  // auto-add consultation (once per visit)
  useEffect(() => {
    if (!currentEncounter || !services.length) return;
    const hasConsult = orders.some((o: any) => o.type === "consultation");
    if (!hasConsult) addConsultationMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEncounter?.encounterId, services.length, JSON.stringify(orders)]);

  // ---------- handlers ----------
  // ... (keep handlers: handleCloseVisit, handleSubmit, handlePatientSelect, etc.) ...
  const handleCloseVisit = () => {
    if (!currentEncounter) return;
    const persistedDx = existingTreatment?.diagnosis;
    const currentDx = form.watch("diagnosis");
    const hasDx = (persistedDx && persistedDx.trim() !== "") || (currentDx && currentDx.trim() !== "");
    if (!hasDx) {
      toast({ title: "Validation", description: "Enter and save a diagnosis before closing", variant: "destructive" });
      return;
    }
    closeVisitMutation.mutate(currentEncounter.encounterId);
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient first", variant: "destructive" });
      return;
    }
    if (!currentEncounter) {
      toast({ title: "Error", description: "No active encounter found", variant: "destructive" });
      return;
    }
    createTreatmentMutation.mutate({ 
      ...data, 
      patientId: selectedPatient.patientId,
      encounterId: currentEncounter.encounterId
    });
  });

  const handlePatientSelect = (patient: Patient) => {
    window.location.href = `/treatment/new?patientId=${patient.patientId}`;
  };

  const handleNewTreatment = () => {
    form.reset();
    setSelectedPatient(null);
    setSavedTreatment(null);
    setShowPrescription(false);
  };

  const printPrescription = () => {
    // ... (keep printPrescription content) ...
    const win = window.open("", "_blank");
    if (!win) return;
    const html = document.getElementById("prescription-print")?.innerHTML || "";
    win.document.write(`
      <!doctype html><html><head>
      <meta charset="utf-8" />
      <title>Prescription - ${savedTreatment?.treatmentId || "BGC"}</title>
      <style>
        @media print { body{margin:0} .prescription-container{width:210mm; min-height:297mm; max-height:297mm; padding:20mm; box-sizing:border-box; display:flex; flex-direction:column;} .content{flex:1} .footer{margin-top:auto}}
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111}
        .text-center{text-align:center}.border-b{border-bottom:1px solid #e5e7eb}.mb-6{margin-bottom:1.5rem}.pb-4{padding-bottom:1rem}
      </style>
      </head><body><div class="prescription-container">${html}</div></body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const getAge = (age: string) => age || "Unknown";

  // prescriptions filtered to current encounter if available
  const prescriptions = currentEncounter
    ? allPrescriptions.filter((rx) => rx.encounterId === currentEncounter.encounterId)
    : allPrescriptions;

  // Statistics calculations
  const todayPatients = patientCounts?.today || 0;
  const activeEncountersCount = queueVisits.length;
  const pendingOrdersCount = unpaidOrders 
    ? ((unpaidOrders as any).laboratory?.length || 0) + 
      ((unpaidOrders as any).xray?.length || 0) + 
      ((unpaidOrders as any).ultrasound?.length || 0) + 
      ((unpaidOrders as any).pharmacy?.length || 0)
    : 0;

  // Quick filter handlers for stat cards
  const handleTodayClick = () => {
    setQuickFilter("today");
    setDateFilter("today");
    setShowDateFilter(false);
    setSearchTerm(""); // Clear search when switching to today
  };

  const handleActiveVisitsClick = () => {
    setQuickFilter("active");
    setShowDateFilter(false);
    setSearchTerm(""); // Clear search
    // Show queue modal to see active visits
    setQueueOpen(true);
  };

  const handlePendingOrdersClick = () => {
    setQuickFilter("pending");
    setDateFilter("today"); // Show today's patients by default
    setShowDateFilter(true); // Enable search mode so all patients are visible
    setSearchTerm(""); // Clear search to show all
    // The patient list already shows payment badges, so doctors can see who has pending payments
    // Users can then search for specific patients or use date filters
  };

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      {/* World-Class Department Header - More Compact */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl p-4 shadow-lg border border-emerald-100 dark:border-emerald-900/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur-sm opacity-75"></div>
            <div className="relative h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treatment Records</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">Patient encounters, clinical documentation & care management</p>
          </div>
        </div>
        
        {/* Statistics Cards - Compact & Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Patients Today - Clickable */}
          <button
            type="button"
            onClick={handleTodayClick}
            data-testid="stat-card-today"
            className={`group bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg p-2 border ${
              quickFilter === "today" 
                ? "border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700" 
                : "border-emerald-200 dark:border-emerald-800/50"
            } shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer text-left`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="h-7 w-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md flex items-center justify-center shadow-sm">
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{todayPatients}</span>
            </div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Patients Today</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">Click to filter</p>
          </button>

          {/* Active Visits - Clickable */}
          <button
            type="button"
            onClick={handleActiveVisitsClick}
            data-testid="stat-card-active"
            className={`group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-2 border ${
              quickFilter === "active" 
                ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700" 
                : "border-blue-200 dark:border-blue-800/50"
            } shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer text-left`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="h-7 w-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                <Activity className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{activeEncountersCount}</span>
            </div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Active Visits</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">Click to view queue</p>
          </button>

          {/* Pending Orders - Clickable */}
          <button
            type="button"
            onClick={handlePendingOrdersClick}
            data-testid="stat-card-pending"
            className={`group bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg p-2 border ${
              quickFilter === "pending" 
                ? "border-amber-500 dark:border-amber-500 ring-2 ring-amber-300 dark:ring-amber-700" 
                : "border-amber-200 dark:border-amber-800/50"
            } shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer text-left`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="h-7 w-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-md flex items-center justify-center shadow-sm">
                <ClipboardList className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{pendingOrdersCount}</span>
            </div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Pending Orders</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">Click to search</p>
          </button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Patient Selection & Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Patient selection / Header */}
          {/* ... (keep this section as is) ... */}
          {/* Patient selection */}
          {/* THIS CARD IS HIDDEN ONCE A PATIENT IS SELECTED */}
          {!selectedPatient && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6 shadow-sm border border-blue-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Select Patient for Treatment</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose a patient to begin documenting their visit</p>
                </div>
              </div>

              <>
                {/* Date Filter and Search Controls */}
                <div className="mb-4 space-y-3 border-b pb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={dateFilter === "today" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => { setDateFilter("today"); setShowDateFilter(false); }}
                    >
                      Today
                    </Button>
                    <Button 
                      variant={dateFilter === "yesterday" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => { setDateFilter("yesterday"); setShowDateFilter(false); }}
                    >
                      Yesterday
                    </Button>
                    <Button 
                      variant={dateFilter === "last7" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => { setDateFilter("last7"); setShowDateFilter(false); }}
                    >
                      Last 7 Days
                    </Button>
                    <Button 
                      variant={dateFilter === "last30" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => { setDateFilter("last30"); setShowDateFilter(false); }}
                    >
                      Last 30 Days
                    </Button>
                    <Button 
                      variant={dateFilter === "custom" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => { setDateFilter("custom"); setShowDateFilter(false); }}
                    >
                      Custom Range
                    </Button>
                    <Button 
                      variant={showDateFilter ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setShowDateFilter(!showDateFilter)}
                    >
                      <Search className="w-3 h-3 mr-1" />
                      Search
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
                  
                  {showDateFilter && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        placeholder="Search by patient name or ID..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-10" 
                      />
                    </div>
                  )}
                  
                  {dateFilter === "custom" && !customStartDate && !customEndDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      📅 Select start and end dates above to view patients in custom range
                    </p>
                  )}
                </div>

                <div className="flex justify-end mb-2">
                  <Button variant="outline" size="sm" onClick={() => setQueueOpen(true)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Today&apos;s Queue
                  </Button>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-1 shadow-sm">
                  <PatientSearch
                    onSelectPatient={handlePatientSelect}
                    onViewPatient={handlePatientSelect}
                    showActions={false}
                    viewMode={
                      showDateFilter ? "all" :
                      dateFilter === "last7" || dateFilter === "last30" || dateFilter === "custom" ? "dateRange" :
                      "date"
                    }
                    selectedDate={getClinicDayKey()} // Current clinic day for single-day views
                    startDate={presetParams.preset === "custom" ? presetParams.from : undefined}
                    endDate={presetParams.preset === "custom" ? presetParams.to : undefined}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    shouldSearch={shouldSearch}
                    onShouldSearchChange={setShouldSearch}
                    filterPendingOnly={quickFilter === "pending"}
                    preset={presetParams.preset} // Pass preset for backend filtering and cache isolation
                  />
                </div>
              </>
            </div>
          )}

          {/* THIS REPLACES THE CARD ABOVE ONCE PATIENT IS SELECTED */}
          {selectedPatient && (
            <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {selectedPatient.firstName?.[0]}
                    {selectedPatient.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </h4>
                      {savedTreatment && <Badge className="bg-green-600 text-white shadow-sm">Saved: {savedTreatment.treatmentId}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span>
                        <span className="font-mono">{selectedPatient.patientId}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Age:</span>
                        {getAge(selectedPatient.age || "")}
                      </span>
                      {selectedPatient.gender && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Gender:</span>
                          {selectedPatient.gender}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span>
                        {selectedPatient.phoneNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Badge className="bg-green-600 text-white shadow-sm whitespace-nowrap">✓ Selected</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Change
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Discharge Summary Button for Current Visit */}
          {selectedPatient && currentEncounter && (
            <div className="flex justify-end mb-4">
              <DischargeSummary 
                encounterId={currentEncounter.encounterId} 
                patientId={selectedPatient.patientId} 
              />
            </div>
          )}

          {/* ---------- TWO-COLUMN COCKPIT LAYOUT ---------- */}
          {selectedPatient && currentEncounter && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              
              {/* === LEFT "ACTION" COLUMN === */}
              <div className="space-y-4">
                <Tabs defaultValue="notes" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="notes">
                      <FileText className="h-4 w-4 mr-2" />
                      Visit Notes
                    </TabsTrigger>
                    <TabsTrigger value="orders">
                      <FileText className="h-4 w-4 mr-2" />
                      Orders & Results
                      {diagnosticTestCount > 0 && <Badge className="ml-2">{diagnosticTestCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="medications">
                      <Pill className="h-4 w-4 mr-2" />
                      Medications
                      {prescriptions.length > 0 && <Badge className="ml-2">{prescriptions.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4 w-4 mr-2" />
                      Patient History
                    </TabsTrigger>
                  </TabsList>

                  {/* === TAB 1: VISIT NOTES === */}
                  <TabsContent value="notes">
                    <Card>
                      <CardHeader>
                        {/* UPDATED: Removed (S.O.A.P. Note) */}
                        <CardTitle>Clinical Documentation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* ... (Keep the entire Form and form fields for Visit Notes as is) ... */}
                        <Form {...form}>
                          <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Visit Info */}
                            <div>
                              <h3 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                                Visit Information
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* ... Visit Date, Type, Priority fields ... */}
                                <FormField control={form.control} name="visitDate" render={({ field }) => ( <FormItem><FormLabel>Visit Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="visitType" render={({ field }) => ( <FormItem><FormLabel>Visit Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="consultation">Consultation</SelectItem><SelectItem value="follow-up">Follow-up</SelectItem><SelectItem value="emergency">Emergency</SelectItem><SelectItem value="preventive">Preventive Care</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="priority" render={({ field }) => ( <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="routine">Routine</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                              </div>
                            </div>
                            {/* Subjective */}
                            <FormField control={form.control} name="chiefComplaint" render={({ field }) => ( <FormItem><FormLabel>Subjective (Chief Complaint)</FormLabel><FormControl><Textarea placeholder="What brings the patient in today?" rows={3} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                            {/* Objective */}
                            <div>
                              <h3 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">Objective</h3>
                              <div className="font-medium mb-2">Vital Signs</div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* ... Vitals fields ... */}
                                <FormField control={form.control} name="temperature" render={({ field }) => ( <FormItem><FormLabel>Temperature (°C)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="36.5" {...field} value={field.value ?? ""} onChange={(e) => field.onChange( e.target.value ? parseFloat(e.target.value) : null )} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="bloodPressure" render={({ field }) => ( <FormItem><FormLabel>Blood Pressure</FormLabel><FormControl><Input placeholder="120/80" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="heartRate" render={({ field }) => ( <FormItem><FormLabel>Heart Rate (bpm)</FormLabel><FormControl><Input type="number" placeholder="72" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="65.0" {...field} value={field.value ?? ""} onChange={(e) => field.onChange( e.target.value ? parseFloat(e.target.value) : null )} /></FormControl><FormMessage /></FormItem> )} />
                              </div>
                            </div>
                            <FormField control={form.control} name="examination" render={({ field }) => ( <FormItem><FormLabel>Physical Examination</FormLabel><FormControl><Textarea placeholder="Detailed examination findings..." rows={4} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                            {/* Assessment */}
                            <FormField control={form.control} name="diagnosis" render={({ field }) => ( <FormItem><FormLabel>Assessment (Diagnosis)</FormLabel><FormControl><Textarea placeholder="Primary and secondary diagnoses..." rows={3} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                            {/* Plan */}
                            <FormField control={form.control} name="treatmentPlan" render={({ field }) => ( <FormItem><FormLabel>Plan (Treatment & Follow-up)</FormLabel><FormControl><Textarea placeholder="Medications, procedures, recommendations..." rows={4} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ... Follow up fields ... */}
                                <FormField control={form.control} name="followUpDate" render={({ field }) => ( <FormItem><FormLabel>Follow-up Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="followUpType" render={({ field }) => ( <FormItem><FormLabel>Next Visit Type</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""}><FormControl><SelectTrigger><SelectValue placeholder="No follow-up needed" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No follow-up needed</SelectItem><SelectItem value="routine">Routine Follow-up</SelectItem><SelectItem value="urgent">Urgent Follow-up</SelectItem><SelectItem value="lab-results">Lab Results Review</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                            </div>
                            {/* Actions */}
                            <div className="flex gap-4 pt-6 mt-6 border-t">
                                {/* ... Save, Close Visit, New Treatment buttons ... */}
                                <Button type="submit" disabled={createTreatmentMutation.isPending} className="bg-medical-blue hover:bg-blue-700" data-testid="save-treatment-btn"><Save className="w-4 h-4 mr-2" />{createTreatmentMutation.isPending ? "Saving..." : "Save Visit Notes"}</Button>
                                {currentEncounter && currentEncounter.status === "open" && ( <Button type="button" onClick={handleCloseVisit} variant="default" className="bg-orange-600 hover:bg-orange-700" disabled={closeVisitMutation.isPending} data-testid="close-visit-btn">{closeVisitMutation.isPending ? "Closing..." : "Close Visit"}</Button> )}
                                <Button type="button" variant="outline" onClick={handleNewTreatment} className="ml-auto">New Treatment</Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* === TAB 2: ORDERS & RESULTS (UNIFIED) === */}
                  <TabsContent value="orders">
                    <Card>
                      <CardHeader>
                        <CardTitle>Orders & Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        
                        {/* --- Sub-tabs --- */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Button variant={qoTab === "all" ? "secondary" : "outline"} onClick={() => setQoTab("all")}>
                            All Results
                          </Button>
                          {(["lab", "xray", "ultrasound", "consult", "pharmacy"] as const).map((k) => (
                            <Button key={k} variant={qoTab === k ? "default" : "outline"} onClick={() => { setQoTab(k); setQoSearch(''); }}> {/* Reset search on tab change */}
                              {/* ... (Tab labels) ... */}
                              {k === "lab" && "Lab"}
                              {k === "xray" && "X-Ray"}
                              {k === "ultrasound" && "Ultrasound"}
                              {k === "consult" && "Consult"}
                              {k === "pharmacy" && "Pharmacy"}
                            </Button>
                          ))}
                          {qoTab !== "all" && (
                            <div className="ml-auto w-full sm:w-64 relative">
                              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                              <Input
                                placeholder="Search services to add…"
                                value={qoSearch}
                                onChange={(e) => setQoSearch(e.target.value)}
                                className="pl-8"
                              />
                            </div>
                          )}
                        </div>

                        {/* --- NEW: Accordion for Ordering --- */}
                        {qoTab !== "all" && (
                          <Accordion type="single" collapsible className="w-full mb-6">
                            <AccordionItem value="item-1" className="border-2 border-blue-200 rounded-lg">
                              <AccordionTrigger className="text-base font-semibold px-4 py-3 bg-blue-50 dark:bg-blue-950 rounded-t-lg hover:no-underline hover:bg-blue-100 dark:hover:bg-blue-900">
                                <div className="flex items-center gap-2">
                                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                                  <span className="text-blue-700 dark:text-blue-300">
                                    Order New {qoTab.charAt(0).toUpperCase() + qoTab.slice(1)} Tests
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="border-t-2 border-blue-200 rounded-b-lg p-4 bg-white dark:bg-gray-900">
                                {/* LAB TESTS: Category-based dropdown + checkboxes */}
                                {qoTab === "lab" ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Category Dropdown */}
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Test Category</label>
                                        <Select
                                          value={currentLabCategory}
                                          onValueChange={(v) => setCurrentLabCategory(v as keyof typeof commonTests)}
                                        >
                                          <SelectTrigger data-testid="select-lab-category">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="hematology">Hematology</SelectItem>
                                            <SelectItem value="serology">Serology</SelectItem>
                                            <SelectItem value="reproductive">Reproductive</SelectItem>
                                            <SelectItem value="parasitology">Parasitology</SelectItem>
                                            <SelectItem value="hormones">Hormones</SelectItem>
                                            <SelectItem value="tuberculosis">Tuberculosis</SelectItem>
                                            <SelectItem value="emergency">Emergency</SelectItem>
                                            <SelectItem value="urine">Urine Analysis</SelectItem>
                                            <SelectItem value="biochemistry">Biochemistry</SelectItem>
                                            <SelectItem value="stool">Stool</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Priority Dropdown */}
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Priority</label>
                                        <Select value={labPriority} onValueChange={(v: any) => setLabPriority(v)}>
                                          <SelectTrigger data-testid="select-lab-priority">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="routine">Routine</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                            <SelectItem value="stat">STAT</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    {/* Test Selection Checkboxes */}
                                    <div>
                                      <label className="text-sm font-medium mb-2 block">Select Tests</label>
                                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                        {commonTests[currentLabCategory].map((test) => (
                                          <label key={test} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
                                            <Checkbox
                                              checked={selectedLabTests.includes(test)}
                                              onCheckedChange={() => handleLabTestToggle(test)}
                                              data-testid={`checkbox-lab-test-${test}`}
                                            />
                                            <span className="text-sm">{test}</span>
                                          </label>
                                        ))}
                                      </div>
                                      {selectedLabTests.length > 0 && (
                                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                            Selected ({selectedLabTests.length}): {selectedLabTests.join(", ")}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Clinical Information */}
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Clinical Information</label>
                                      <Textarea
                                        placeholder="Symptoms, suspected diagnosis, relevant clinical information..."
                                        rows={3}
                                        value={labClinicalInfo}
                                        onChange={(e) => setLabClinicalInfo(e.target.value)}
                                        data-testid="textarea-lab-clinical-info"
                                      />
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                      type="button"
                                      onClick={() => submitLabTestsMutation.mutate()}
                                      disabled={submitLabTestsMutation.isPending || selectedLabTests.length === 0}
                                      className="w-full bg-medical-blue hover:bg-blue-700"
                                      data-testid="btn-submit-lab-tests"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      {submitLabTestsMutation.isPending 
                                        ? "Submitting..." 
                                        : `Submit ${selectedLabTests.length} Lab Test${selectedLabTests.length !== 1 ? 's' : ''}`
                                      }
                                    </Button>
                                  </div>
                                ) : (
                                  /* Other Services: Grid layout */
                                  (() => {
                                    const rows = (qoTab === 'pharmacy' ? drugs : services)
                                    .filter((s: any) => {
                                      if (qoTab === 'pharmacy') return true;
                                      return matchesCategory(s, qoTab as any);
                                    })
                                    .filter((s: any) => {
                                      if (!qoSearch) return true;
                                      const needle = qoSearch.toLowerCase();
                                      const name = s.name || s.genericName || "";
                                      return (
                                        (name).toLowerCase().includes(needle) ||
                                        (s.description ?? "").toLowerCase().includes(needle)
                                      );
                                    })
                                    .slice(0, 50);

                                    if (rows.length === 0) {
                                      return <div className="text-sm text-muted-foreground p-4 text-center">No matching services found.</div>;
                                    }

                                    return (
                                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {rows.map((svc: any) => (
                                          <div key={svc.id} className="flex items-center justify-between rounded border p-3 bg-white">
                                            <div className="min-w-0 pr-2">
                                              <div className="font-medium truncate">{svc.genericName || svc.name}</div>
                                              <div className="text-xs text-gray-500 truncate">
                                                {svc.description ? svc.description : (svc.strength ? `Strength: ${svc.strength}` : (typeof svc.price === 'number' ? `Fee: ${svc.price}` : ''))}
                                              </div>
                                            </div>
                                            {qoTab === 'pharmacy' ? (
                                              <Button size="sm" onClick={() => {
                                                setSelectedDrugId(String(svc.id));
                                                setSelectedDrugName(svc.genericName || svc.name);
                                                setActiveTab("medications");
                                                toast({ title: "Medication Selected", description: "Please complete dosage and quantity." });
                                              }}>
                                                <Plus className="h-4 w-4 mr-1"/> Queue
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                onClick={() => orderMutation.mutate({ serviceId: svc.id, kind: qoTab, name: svc.name, price: svc.price || 0 })}
                                                disabled={orderMutation.isPending && orderMutation.variables?.serviceId === svc.id}
                                              >
                                                {orderMutation.isPending && orderMutation.variables?.serviceId === svc.id ?
                                                  <Loader2 className="h-4 w-4 animate-spin"/> :
                                                  <Plus className="h-4 w-4 mr-1"/>
                                                }
                                                Add
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}

                        {/* --- Pending Orders (Just Ordered, Not Processed Yet) --- */}
                        {(() => {
                          const pendingOrders = orders.filter((order: any) => {
                            // Show orders that match current tab and don't have results yet
                            if (qoTab === 'all') return order.status === 'pending';
                            if (qoTab === 'lab') return order.type === 'lab' && order.status === 'pending';
                            if (qoTab === 'xray') return order.type === 'xray' && order.status === 'pending';
                            if (qoTab === 'ultrasound') return order.type === 'ultrasound' && order.status === 'pending';
                            if (qoTab === 'consult') return order.type === 'consult' && order.status === 'pending';
                            return false;
                          });

                          if (pendingOrders.length === 0) return null;

                          return (
                            <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-l-4 border-amber-500 rounded-lg shadow-sm">
                              <h3 className="font-bold text-lg mb-4 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Pending Orders (Awaiting Processing)
                              </h3>
                              <div className="space-y-3">
                                {pendingOrders.map((order: any) => (
                                  <div key={order.orderId} className="p-4 bg-white dark:bg-gray-900 border-2 border-amber-300 dark:border-amber-700 rounded-lg shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-semibold text-base text-gray-900 dark:text-white">{order.name || order.description}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          Ordered just now • Awaiting {order.department || order.type} processing
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {order.type === 'lab' && (
                                          <div className="flex gap-1 mr-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleEditLabTest(order)}
                                              className="h-8 px-2"
                                              data-testid={`button-edit-lab-${order.orderId}`}
                                            >
                                              <Edit className="w-3 h-3 mr-1" />
                                              Edit
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleDeleteLabTest(order.testId || order.orderId)}
                                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                              data-testid={`button-delete-lab-${order.orderId}`}
                                            >
                                              <Trash2 className="w-3 h-3 mr-1" />
                                              Delete
                                            </Button>
                                          </div>
                                        )}
                                        <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-400 dark:border-amber-600 font-semibold px-3 py-1">
                                          Pending
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* --- Existing Results (Filtered + Enhanced Lab View) --- */}
                        <div className="space-y-4 mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-l-4 border-green-600 rounded-lg shadow-sm">
                          <h3 className="font-bold text-lg text-green-800 dark:text-green-300 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Completed Results for this Visit {qoTab !== 'all' ? `(${qoTab})` : ''}
                          </h3>
                          
                          {/* Labs */}
                          {(qoTab === "all" || qoTab === "lab") && labTests.filter((t: any) => t.status === "completed").length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Laboratory Tests</h4>
                              <div className="space-y-4"> {/* Increased spacing */}
                                {labTests.filter((t: any) => t.status === "completed").map((test: any) => {
                                  // --- NEW: Parse results for inline display ---
                                  const parsedResults = parseJSON<Record<string, Record<string, string>>>(test.results, {});
                                  const testsOrdered = parseJSON<string[]>(test.tests, []);
                                  
                                  // Create professional title showing test count and preview
                                  const getTestTitle = () => {
                                    if (testsOrdered.length === 0) {
                                      return test.category 
                                        ? test.category.charAt(0).toUpperCase() + test.category.slice(1)
                                        : "Laboratory Test";
                                    }
                                    
                                    const count = testsOrdered.length;
                                    const testLabel = count === 1 ? "Lab Test" : "Lab Tests";
                                    
                                    // Show first 2 tests with ellipsis if more
                                    const preview = testsOrdered.slice(0, 2).join(", ");
                                    const hasMore = testsOrdered.length > 2;
                                    
                                    return `${count} ${testLabel} (${preview}${hasMore ? "..." : ""})`;
                                  };
                                  // --- End NEW ---
                                  
                                  return (
                                    <Card key={test.testId || test.orderId} className="overflow-hidden">
                                      <CardHeader className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 border-b">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                                            <CardTitle className="text-sm sm:text-base mb-1">
                                              {getTestTitle()}
                                            </CardTitle>
                                             <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                                              <Badge variant={test.status === "completed" ? "default" : "secondary"} className="text-xs">
                                                {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                                              </Badge>
                                              {!test.isPaid && (
                                                <Badge variant="destructive" className="bg-red-600 text-xs">UNPAID</Badge>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              Requested: {formatClinicDayKey(test.requestedDate)}
                                            </p>
                                          </div>
                                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                              {test.status === "completed" && (
                                                <Button variant="outline" size="sm" onClick={() => openResult("lab", test)} className="text-xs sm:text-sm flex-1 sm:flex-initial min-h-[36px]" data-testid={`view-details-lab-${test.id}`}>
                                                  View Details
                                                </Button>
                                              )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                        {/* --- NEW: Inline Results Display --- */}
                                        {testsOrdered.length > 0 && (
                                          <div>
                                            <h5 className="font-medium text-xs sm:text-sm mb-1.5">Tests Ordered:</h5>
                                            <div className="flex flex-wrap gap-1">
                                              {testsOrdered.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* X-rays */}
                          {/* ... (Keep X-ray rendering logic, maybe wrap in Card like labs for consistency) ... */}
                           {(qoTab === "all" || qoTab === "xray") && xrays.filter((x: any) => x.status === "completed").length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">X-Ray Examinations</h4>
                              <div className="space-y-2">
                                {xrays.filter((x: any) => x.status === "completed").map((x: any) => ( /* Consider wrapping in Card */
                                  <div key={x.examId || x.orderId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                    <div className="flex justify-between items-start gap-3">
                                      {/* ... existing X-ray content ... */}
                                      <div className="flex-1">
                                        <p className="font-medium">{x.bodyPart}</p>
                                        <div className="flex items-center gap-2 my-1">
                                           <Badge variant={x.status === "completed" ? "default" : "secondary"}>{x.status.charAt(0).toUpperCase() + x.status.slice(1)}</Badge>
                                           {!x.isPaid && (<Badge variant="destructive" className="bg-red-600">UNPAID</Badge>)}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {formatClinicDateTime(x.completedAt || x.resultDate || x.requestDate)}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        {x.status === "completed" && (<Button variant="outline" size="sm" onClick={() => openResult("xray", x)}>View Report</Button>)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ultrasound */}
                          {/* ... (Keep Ultrasound rendering logic, maybe wrap in Card) ... */}
                          {(qoTab === "all" || qoTab === "ultrasound") && ultrasounds.filter((u: any) => u.status === "completed").length > 0 && (
                             <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Ultrasound Examinations</h4>
                              <div className="space-y-2">
                                {ultrasounds.filter((u: any) => u.status === "completed").map((u: any) => ( /* Consider wrapping in Card */
                                  <div key={u.examId || u.orderId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                    <div className="flex justify-between items-start gap-3">
                                        {/* ... existing Ultrasound content ... */}
                                      <div className="flex-1">
                                        <p className="font-medium">{u.examType}</p>
                                         <div className="flex items-center gap-2 my-1">
                                           <Badge variant={u.status === "completed" ? "default" : "secondary"}>{u.status.charAt(0).toUpperCase() + u.status.slice(1)}</Badge>
                                           {!u.isPaid && (<Badge variant="destructive" className="bg-red-600">UNPAID</Badge>)}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {formatClinicDateTime(u.completedAt || u.resultDate || u.requestDate)}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                         {u.status === "completed" && (<Button variant="outline" size="sm" onClick={() => openResult("ultrasound", u)}>View Report</Button>)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty State */}
                          {qoTab !== 'all' && labTests.filter((t: LabTest) => t.status === "completed").length === 0 && xrays.filter((x: any) => x.status === "completed").length === 0 && ultrasounds.filter((u: any) => u.status === "completed").length === 0 && (
                             <div className="text-center py-6 text-gray-500 border rounded-lg">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No completed {qoTab} results for this visit yet.</p>
                            </div>
                          )}
                           {qoTab === 'all' && labTests.filter((t: LabTest) => t.status === "completed").length === 0 && xrays.filter((x: any) => x.status === "completed").length === 0 && ultrasounds.filter((u: any) => u.status === "completed").length === 0 && (
                            <div className="text-center py-6 text-gray-500 border rounded-lg">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No completed results yet for this visit.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* === TAB 3: MEDICATIONS === */}
                  {/* ... (Keep Medications tab content as is) ... */}
                  <TabsContent value="medications">
                    {/* ... The existing Card and content for Medications ... */}
                    <Card>
                      <CardHeader><CardTitle>Medication Orders</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                           {/* Prescribed list */}
                          {prescriptions.length > 0 && ( <div className="mb-6"> {/* ... Prescribed list rendering ... */} </div> )}
                          {/* Order New Meds section */}
                          {/* ... Select Drug, Dosage, Quantity, Instructions inputs ... */}
                          {/* ... Add to Order List button ... */}
                          {/* ... Medications to Order list and Submit button ... */}
                           {prescriptions.length > 0 && ( <div className="mb-6"> <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4"> Prescribed Medications ({prescriptions.length}) </h3> <div className="space-y-2"> {prescriptions.map((rx) => ( <div key={rx.orderId} className="p-4 bg-gray-50 dark:bg-gray-800 border rounded-lg" data-testid={`prescription-${rx.orderId}`}> <div className="flex items-start justify-between"> <div className="flex-1"> <div className="flex items-center gap-2 mb-2"> <p className="font-medium text-gray-900 dark:text-white">{rx.drugName || "Medication"}</p> <Badge variant={rx.status === "dispensed" ? "default" : "secondary"} className={rx.status === "dispensed" ? "bg-green-600" : ""}>{rx.status}</Badge> <Badge variant={rx.paymentStatus === "paid" ? "default" : "destructive"} className={rx.paymentStatus === "paid" ? "bg-blue-600" : "bg-red-600"}>{rx.paymentStatus}</Badge> </div> <p className="text-sm text-gray-600 dark:text-gray-400">Dosage: {rx.dosage || "As prescribed"} | Quantity: {rx.quantity}</p> {rx.instructions && (<p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Instructions: {rx.instructions}</p>)} <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Order ID: {rx.orderId} | Prescribed: {formatClinicDateTime(rx.createdAt)}</p> {rx.dispensedAt && (<p className="text-xs text-green-600 dark:text-green-400 mt-1">Dispensed: {formatClinicDateTime(rx.dispensedAt)} by {rx.dispensedBy}</p>)} </div> {rx.status === "prescribed" && rx.paymentStatus === "unpaid" && ( <div className="flex gap-2"> <Button type="button" variant="outline" size="sm" onClick={() => { setEditingPrescription(rx); setEditDosage(rx.dosage || ""); setEditQuantity(rx.quantity || 0); setEditInstructions(rx.instructions || ""); }} data-testid={`btn-edit-${rx.orderId}`}><Edit className="w-4 h-4 mr-1" />Edit</Button> <Button type="button" variant="destructive" size="sm" onClick={() => { if (window.confirm("Cancel this prescription?")) { cancelPrescriptionMutation.mutate(rx.orderId); } }} data-testid={`btn-cancel-${rx.orderId}`}><Trash2 className="w-4 h-4 mr-1" />Cancel</Button> </div> )} </div> </div> ))} </div> <div className="border-t pt-4 mt-4" /> </div> )}
                           <div className="flex items-center justify-between"> <h3 className="font-medium text-gray-800 dark:text-gray-200">Order New Medications</h3> <p className="text-sm text-gray-600 dark:text-gray-400">Select drugs from inventory to create pharmacy orders</p> </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"> <div className="space-y-2"><label className="text-sm font-medium">Select Drug</label><Select value={selectedDrugId} onValueChange={(value) => { setSelectedDrugId(value); const drug = drugs.find((d) => d.id.toString() === value); if (drug) setSelectedDrugName(drug.genericName || drug.name); }}><SelectTrigger data-testid="select-drug"><SelectValue placeholder="Choose a medication..." /></SelectTrigger><SelectContent>{drugs.map((drug) => (<SelectItem key={drug.id} value={drug.id.toString()}>{drug.genericName || drug.name} - {drug.strength}</SelectItem>))}</SelectContent></Select></div> <div className="space-y-2"><label className="text-sm font-medium">Dosage Instructions</label><Input placeholder="e.g., 1 tablet twice daily" value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} data-testid="input-dosage" /></div> <div className="space-y-2"><label className="text-sm font-medium">Quantity</label><Input type="number" min="1" placeholder="e.g., 30" value={newMedQuantity} onChange={(e) => setNewMedQuantity(parseInt(e.target.value) || 0)} data-testid="input-quantity" /></div> <div className="space-y-2"><label className="text-sm font-medium">Additional Instructions</label><Input placeholder="e.g., Take with food" value={newMedInstructions} onChange={(e) => setNewMedInstructions(e.target.value)} data-testid="input-instructions" /></div> </div>
                           <Button type="button" onClick={() => { if (!selectedDrugId || !newMedDosage || newMedQuantity <= 0) { toast({ title: "Validation Error", description: "Please fill in drug, dosage, and quantity", variant: "destructive", }); return; } setMedications([...medications, { drugId: parseInt(selectedDrugId), drugName: selectedDrugName, dosage: newMedDosage, quantity: newMedQuantity, instructions: newMedInstructions, },]); setSelectedDrugId(""); setSelectedDrugName(""); setNewMedDosage(""); setNewMedQuantity(0); setNewMedInstructions(""); toast({ title: "Added", description: "Medication added to order list" }); }} data-testid="btn-add-medication"><Plus className="w-4 h-4 mr-2" />Add to Order List</Button>
                           {medications.length > 0 && ( <div className="space-y-2"> <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Medications to Order ({medications.length})</h4> <div className="space-y-2">{medications.map((med, idx) => ( <div key={idx} className="flex items-start justify-between p-3 bg-white dark:bg-gray-900 border rounded-lg"> <div className="flex-1"><p className="font-medium">{med.drugName}</p><p className="text-sm text-gray-600 dark:text-gray-400">Dosage: {med.dosage} | Quantity: {med.quantity}</p>{med.instructions && (<p className="text-sm text-gray-500 dark:text-gray-500">Instructions: {med.instructions}</p>)}</div> <Button type="button" variant="ghost" size="sm" onClick={() => setMedications(medications.filter((_, i) => i !== idx))} data-testid={`btn-remove-med-${idx}`}><Trash2 className="w-4 h-4 text-red-600" /></Button> </div> ))}</div> <Button type="button" onClick={() => submitMedicationsMutation.mutate(medications)} disabled={submitMedicationsMutation.isPending} className="w-full bg-green-600 hover:bg-green-700" data-testid="btn-submit-medications"><Pill className="w-4 h-4 mr-2" />{submitMedicationsMutation.isPending ? "Submitting..." : `Send ${medications.length} Order(s) to Pharmacy`}</Button> </div> )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>


                  {/* === TAB 4: PATIENT HISTORY === */}
                  <TabsContent value="history">
                     <Card>
                       <CardHeader><CardTitle>Patient History</CardTitle></CardHeader>
                       <CardContent>
                         <p className="text-sm text-muted-foreground mb-4">Past visit history for this patient. Current visit is not shown here.</p>
                         <h4 className="font-semibold mb-2">Previous Visits</h4>
                         {/* Filter out current encounter to avoid duplication */}
                         {(() => {
                           const pastVisits = recentTreatments.filter(tx => 
                             tx.encounterId !== currentEncounter?.encounterId
                           );
                           return pastVisits.length > 0 ? (
                           <div className="space-y-3">
                             {pastVisits.map((tx) => (
                               <div 
                                 key={tx.treatmentId} 
                                 className="p-4 border rounded-lg bg-gradient-to-r from-blue-50/50 to-white dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all border-blue-200 dark:border-blue-800"
                                 data-testid={`history-visit-${tx.treatmentId}`}
                               >
                                 <div className="flex justify-between items-start gap-3 mb-3">
                                   <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-2">
                                       <span className="font-bold text-gray-900 dark:text-white text-base">
                                         {formatClinicDayKey(tx.visitDate, 'EEE, d MMM yyyy')}
                                       </span>
                                       <Badge variant="outline" className="capitalize font-semibold">{tx.visitType}</Badge>
                                       <Badge className="bg-blue-600 text-white text-xs font-mono">{tx.treatmentId}</Badge>
                                     </div>
                                     <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                       <span className="font-semibold">Diagnosis:</span> {tx.diagnosis || "Not recorded"}
                                     </p>
                                     {tx.chiefComplaint && (
                                       <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                         <span className="font-medium">Complaint:</span> {tx.chiefComplaint}
                                       </p>
                                     )}
                                   </div>
                                   <div className="flex flex-col gap-2">
                                     {tx.encounterId && (
                                       <DischargeSummary 
                                         encounterId={tx.encounterId} 
                                         patientId={selectedPatient?.patientId || ""} 
                                       />
                                     )}
                                     {!tx.encounterId && (
                                       <span className="text-xs text-gray-400 italic">No encounter linked</span>
                                     )}
                                   </div>
                                 </div>
                                 
                                 {/* Quick Stats */}
                                 <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                                   {tx.temperature && (
                                     <span className="flex items-center gap-1">
                                       <span>🌡️</span>
                                       <span className="font-medium">{tx.temperature}°C</span>
                                     </span>
                                   )}
                                   {tx.bloodPressure && (
                                     <span className="flex items-center gap-1">
                                       <span>💓</span>
                                       <span className="font-medium">{tx.bloodPressure}</span>
                                     </span>
                                   )}
                                   {tx.weight && (
                                     <span className="flex items-center gap-1">
                                       <span>⚖️</span>
                                       <span className="font-medium">{tx.weight} kg</span>
                                     </span>
                                   )}
                                   {tx.followUpDate && (
                                     <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                                       <span>⏰</span>
                                       <span>Follow-up: {new Date(tx.followUpDate).toLocaleDateString()}</span>
                                     </span>
                                   )}
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="text-center py-8 text-gray-500">
                             <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                             <p className="text-sm font-medium">No previous visits found for this patient.</p>
                             <p className="text-xs mt-1">Visit history will appear here after saving treatment notes.</p>
                           </div>
                         );
                         })()}
                       </CardContent>
                     </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* === RIGHT "CONTEXT" RAIL === */}
              <div className="space-y-4">
                {/* Vitals Card */}
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Heart className="h-5 w-5" />Vitals (Today)</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 text-sm"><div><div className="text-muted-foreground">Temp</div><div className="font-medium">{watchedVitals[0] ? `${watchedVitals[0]} °C` : "—"}</div></div><div><div className="text-muted-foreground">BP</div><div className="font-medium">{watchedVitals[1] || "—"}</div></div><div><div className="text-muted-foreground">Heart Rate</div><div className="font-medium">{watchedVitals[2] ? `${watchedVitals[2]} bpm` : "—"}</div></div><div><div className="text-muted-foreground">Weight</div><div className="font-medium">{watchedVitals[3] ? `${watchedVitals[3]} kg` : "—"}</div></div></div></CardContent></Card>
                {/* Alerts Card */}
                <Card className="border-red-500/50"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-red-600"><AlertTriangle className="h-5 w-5" />Alerts & Allergies</CardTitle></CardHeader><CardContent><p className="font-medium text-red-700">No known drug allergies</p><p className="text-sm text-muted-foreground mt-2">(Placeholder for alerts API)</p></CardContent></Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ... (Keep Edit Prescription Dialog, Result Drawer, Print Sheet, Queue Modal as is) ... */}
      {/* Edit Prescription Dialog */}
      <Dialog open={!!editingPrescription} onOpenChange={(open) => !open && setEditingPrescription(null)}> {/* ... content ... */} </Dialog>
      {/* Universal Result Drawer */}
      <ResultDrawer open={resultDrawer.open} onOpenChange={(open) => (open ? null : closeResult())} kind={resultDrawer.kind} data={resultDrawer.data} patient={selectedPatient ?? undefined} resultFields={resultFields} onCopyToNotes={(txt) => form.setValue("examination", `${(form.getValues("examination") || "")}\n${txt}`.trim())} />
      {/* Prescription print sheet */}
      {showPrescription && selectedPatient && ( <div> {/* ... content ... */} </div> )}
      {/* Queue modal */}
      <Dialog open={queueOpen} onOpenChange={setQueueOpen}> {/* ... content ... */} </Dialog>

      {/* Edit Lab Test Dialog */}
      <Dialog open={editLabModalOpen} onOpenChange={setEditLabModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-amber-600" />
              Edit Lab Test Request
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Test Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Category
              </label>
              <Select
                value={editLabCategory}
                onValueChange={(val) => setEditLabCategory(val as keyof typeof commonTests)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(commonTests).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Tests ({editLabTests.length} selected)
              </label>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                {commonTests[editLabCategory].map((test) => (
                  <div key={test} className="flex items-center gap-2">
                    <Checkbox
                      checked={editLabTests.includes(test)}
                      onCheckedChange={() => handleEditLabTestToggle(test)}
                      id={`edit-test-${test}`}
                    />
                    <label
                      htmlFor={`edit-test-${test}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {test}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <Select
                value={editLabPriority}
                onValueChange={(val) => setEditLabPriority(val as "routine" | "urgent" | "stat")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clinical Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clinical Information
              </label>
              <Textarea
                value={editLabClinicalInfo}
                onChange={(e) => setEditLabClinicalInfo(e.target.value)}
                rows={3}
                placeholder="Relevant clinical history, symptoms, or special instructions..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveLabEdit}
                disabled={editLabTestMutation.isPending || editLabTests.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-save-edit"
              >
                <Save className="w-4 h-4 mr-2" />
                {editLabTestMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditLabModalOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
