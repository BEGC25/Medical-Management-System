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

import RightRailCart from "@/components/RightRailCart";
import ResultDrawer from "@/components/ResultDrawer";

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

const fmt = (d?: string | number | Date) => (d ? new Date(d).toLocaleString() : "—");

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

  // Queue modal
  const [queueOpen, setQueueOpen] = useState(false);
  const [queueDate, setQueueDate] = useState(new Date().toISOString().slice(0, 10));
  const [queueFilter, setQueueFilter] = useState("");

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

  // queue
  const { data: queueVisits = [], isLoading: queueLoading } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments", { date: queueDate }],
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
      visitDate: new Date().toISOString().split("T")[0],
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
    queryKey: ["/api/encounters", { pid: selectedPatient?.patientId, date: new Date().toISOString().split("T")[0] }],
    queryFn: async () => {
      if (!selectedPatient) return null;
      const today = new Date().toISOString().split("T")[0];
      const r = await fetch(`/api/encounters?date=${today}&patientId=${selectedPatient.patientId}`);
      if (!r.ok) return null;
      const encounters = await r.json();
      return encounters[0] || null;
    },
    enabled: !!selectedPatient && !visitId,
  });

  // unified orders for this visit
  const activeEncounterId = visitId ? loadedVisit?.encounter?.encounterId : currentEncounter?.encounterId;
  // Specify LabTest type for better type safety
  const { data: orders = [] } = useQuery<Array<any | LabTest>>({
    queryKey: ["/api/visits", activeEncounterId, "orders"],
    queryFn: async () => {
      if (!activeEncounterId) return [];
      const r = await fetch(`/api/visits/${activeEncounterId}/orders`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!activeEncounterId,
  });

  // visit cart (aka summary)
  const cartItems = useMemo(
    () => orders.filter(o => !!o.addToCart),
    [orders]
  );

  // Ensure labTests are typed as LabTest[]
  const labTests = useMemo(() => orders.filter((o): o is LabTest => o.type === "lab"), [orders]);
  const xrays = useMemo(() => orders.filter((o) => o.type === "xray"), [orders]);
  const ultrasounds = useMemo(() => orders.filter((o) => o.type === "ultrasound"), [orders]);


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
        visitDate: new Date().toISOString().split("T")[0],
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

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ orderLineId, acknowledgedBy, acknowledged }: { orderLineId: number; acknowledgedBy: string; acknowledged: boolean }) => {
      const r = await apiRequest("PUT", `/api/order-lines/${orderLineId}/acknowledge`, { acknowledgedBy, acknowledged });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", currentEncounter?.encounterId, "orders"] });
      toast({ title: "Updated", description: "Result acknowledgment updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update acknowledgment", variant: "destructive" }),
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ orderLineId, addToCart }: { orderLineId: number; addToCart: boolean }) => {
      const r = await apiRequest("PUT", `/api/order-lines/${orderLineId}/add-to-cart`, { addToCart });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", currentEncounter?.encounterId, "orders"] });
      toast({ title: "Updated", description: "Visit summary updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update summary", variant: "destructive" }),
  });

  // acknowledge + keep cart in sync
  function toggleAcknowledgeAndCart(opts: {
    orderLineId: number;
    acknowledged: boolean;
    alreadyInCart?: boolean;
  }) {
    const { orderLineId, acknowledged, alreadyInCart } = opts;

    acknowledgeMutation.mutate({
      orderLineId,
      acknowledgedBy: "Dr. System",
      acknowledged
    });

    // auto-sync summary
    if (acknowledged && !alreadyInCart) {
      addToCartMutation.mutate({ orderLineId, addToCart: true });
    } else if (!acknowledged && alreadyInCart) {
      // This logic could be debated, but for now, un-acknowledging removes it.
      addToCartMutation.mutate({ orderLineId, addToCart: false });
    }
  }

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
  // ... (keep useEffect for auto-consult and auto-cart) ...
    // auto-add consultation (once per visit)
  useEffect(() => {
    if (!currentEncounter || !services.length) return;
    const hasConsult = orders.some((o: any) => o.type === "consultation");
    if (!hasConsult) addConsultationMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEncounter?.encounterId, services.length, JSON.stringify(orders)]);

  // auto-cart: any completed + paid + acknowledged result
  useEffect(() => {
    orders
      .filter((o: any) => o.status === "completed" && o.isPaid && o.orderLine?.acknowledgedBy && !o.addToCart)
      .forEach((o: any) => addToCartMutation.mutate({ orderLineId: o.orderLine.id, addToCart: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(orders)]);

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
    const completedDiagnostics = [
      ...labTests.filter((t: any) => t.status === "completed" && t.orderLine),
      ...xrays.filter((x: any) => x.status === "completed" && x.orderLine),
      ...ultrasounds.filter((u: any) => u.status === "completed" && u.orderLine),
    ];
    const unack = completedDiagnostics.filter((d: any) => !d.orderLine.acknowledgedBy);
    if (unack.length > 0) {
      toast({
        title: "Validation",
        description: `Acknowledge all ${unack.length} completed diagnostic result(s) before closing`,
        variant: "destructive",
      });
      return;
    }
    closeVisitMutation.mutate(currentEncounter.encounterId);
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient first", variant: "destructive" });
      return;
    }
    createTreatmentMutation.mutate({ ...data, patientId: selectedPatient.patientId });
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


  // ---------- UI ----------
  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Treatment Records</CardTitle>
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
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search patients by name, ID or phone…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && setShouldSearch(true)}
                      className="pl-9"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <Button onClick={() => setShouldSearch(true)}>Search</Button>
                  <Button variant="outline" onClick={() => { setSearchTerm(""); setShouldSearch(false); }}>
                    Clear
                  </Button>
                  <Button variant="outline" onClick={() => setQueueOpen(true)}>
                    Today&apos;s Queue
                  </Button>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-1 shadow-sm">
                  <PatientSearch
                    onSelectPatient={handlePatientSelect}
                    onViewPatient={handlePatientSelect}
                    showActions={false}
                    viewMode="all"
                    selectedDate=""
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    shouldSearch={shouldSearch}
                    onShouldSearchChange={setShouldSearch}
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
                      {orders.length > 0 && <Badge className="ml-2">{orders.length}</Badge>}
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
                            <AccordionItem value="item-1">
                              <AccordionTrigger className="text-base font-semibold px-4 py-3 bg-muted/30 rounded-t-lg hover:no-underline">
                                <Plus className="h-4 w-4 mr-2"/>
                                Add New {qoTab.charAt(0).toUpperCase() + qoTab.slice(1)} Order
                              </AccordionTrigger>
                              <AccordionContent className="border border-t-0 rounded-b-lg p-4">
                                {/* Service Catalog (from OmniOrderBar logic) */}
                                {(() => {
                                  // ... (Keep the existing catalog rendering logic here, using the clearer button style) ...
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

                                })()}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}


                        {/* --- Existing Results (Filtered + Enhanced Lab View) --- */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-base">
                            Existing Results for this Visit {qoTab !== 'all' ? `(${qoTab})` : ''}
                          </h3>
                          
                          {/* Labs */}
                          {(qoTab === "all" || qoTab === "lab") && labTests.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Laboratory Tests</h4>
                              <div className="space-y-4"> {/* Increased spacing */}
                                {labTests.map((test: LabTest) => {
                                  // --- NEW: Parse results for inline display ---
                                  const parsedResults = parseJSON<Record<string, Record<string, string>>>(test.results, {});
                                  const testsOrdered = parseJSON<string[]>(test.tests, []);
                                  // --- End NEW ---
                                  
                                  return (
                                    <Card key={test.testId || test.orderId} className="overflow-hidden">
                                      <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4 border-b">
                                        <div className="flex justify-between items-start gap-3">
                                          <div className="flex-1">
                                            <CardTitle className="text-base mb-1">
                                              {test.category 
                                                ? test.category.charAt(0).toUpperCase() + test.category.slice(1)
                                                : "Laboratory Test"}
                                            </CardTitle>
                                             <div className="flex items-center gap-2 mb-2">
                                              <Badge variant={test.status === "completed" ? "default" : "secondary"}>
                                                {test.status}
                                              </Badge>
                                              {!test.isPaid && (
                                                <Badge variant="destructive" className="bg-red-600">UNPAID</Badge>
                                              )}
                                              {test.orderLine?.acknowledgedBy && (
                                                <Badge variant="outline" className="text-green-600 border-green-600">Acknowledged</Badge>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              Requested: {fmt(test.requestedDate)}
                                            </p>
                                          </div>
                                          <div className="flex flex-col items-end gap-2">
                                              {test.status === "completed" && (
                                                <Button variant="outline" size="sm" onClick={() => openResult("lab", test)}>
                                                  View Details {/* Changed text */}
                                                </Button>
                                              )}
                                              {test.orderLine && (
                                                  <div className="flex items-center gap-2">
                                                    <Checkbox
                                                      id={`ack-lab-${test.id}`}
                                                      checked={!!test.orderLine.acknowledgedBy}
                                                      onCheckedChange={(checked) =>
                                                        toggleAcknowledgeAndCart({
                                                          orderLineId: test.orderLine.id,
                                                          acknowledged: !!checked,
                                                          alreadyInCart: !!test.orderLine.addToCart
                                                        })
                                                      }
                                                      data-testid={`ack-lab-${test.id}`}
                                                    />
                                                    <label htmlFor={`ack-lab-${test.id}`} className="text-sm cursor-pointer">
                                                      Acknowledge
                                                    </label>
                                                  </div>
                                              )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* X-rays */}
                          {/* ... (Keep X-ray rendering logic, maybe wrap in Card like labs for consistency) ... */}
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
                                              const titer = getTiterValue(testData["Titer"]);
                                              const result = testData["Brucella Antibody"];
                                              
                                              if (titer >= 160 || result === "Positive") {
                                                criticalFindings.push(`🔴 POSITIVE for Brucellosis (titer: 1:${titer}) - Zoonotic infection requiring treatment`);
                                              } else if (titer >= 80) {
                                                warnings.push(`⚠️ Possible Brucellosis - Consider patient history and clinical correlation`);
                                              }
                                            }

                                            // ===== VDRL TEST (SYPHILIS) =====
                                            if (testName === "VDRL Test (Syphilis)") {
                                              const result = testData["VDRL"];
                                              const titer = testData["Titer"];
                                              
                                              if (result === "Reactive" || result === "Positive") {
                                                criticalFindings.push(`🔴 POSITIVE for Syphilis (VDRL Reactive${titer ? `, titer: ${titer}` : ""}) - Requires confirmatory testing and treatment`);
                                              }
                                            }

                                            // ===== HEPATITIS B (HBsAg) =====
                                            if (testName === "Hepatitis B Test (HBsAg)") {
                                              const result = testData["HBsAg"];
                                              if (result === "Reactive" || result === "Positive") {
                                                criticalFindings.push(`🔴 POSITIVE for Hepatitis B - Patient is HBsAg positive, infectious`);
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

                                            // ===== URINE ANALYSIS =====
                                            if (testName === "Urine Analysis") {
                                              const appearance = testData["Appearance"];
                                              const protein = testData["Protein"];
                                              const glucose = testData["Glucose"];
                                              const hbPigment = testData["Hb pigment"];
                                              const nitrite = testData["Nitrite"];
                                              const leucocytes = testData["Leucocytes"];

                                              if (appearance?.toLowerCase().includes("bloody") || appearance?.toLowerCase().includes("red")) {
                                                criticalFindings.push(`🔴 Bloody urine detected - Possible bleeding, trauma, or severe infection`);
                                              }

                                              if (protein && (protein.includes("+++") || protein.includes("++++"))) {
                                                criticalFindings.push(`🔴 Severe proteinuria (${protein}) - Kidney damage likely, needs urgent evaluation`);
                                              } else if (protein && protein !== "Negative" && protein !== "-") {
                                                warnings.push(`⚠️ Proteinuria detected (${protein}) - Kidney function needs assessment`);
                                              }

                                              if (glucose && glucose !== "Negative" && glucose !== "-") {
                                                warnings.push(`⚠️ Glucosuria (${glucose}) - Check blood glucose levels, rule out diabetes`);
                                              }

                                              if (hbPigment && (hbPigment === "Positive" || hbPigment.includes("+"))) {
                                                warnings.push(`⚠️ Blood in urine (Hb ${hbPigment}) - Further investigation needed`);
                                              }

                                              if (nitrite === "Positive") {
                                                warnings.push(`⚠️ Nitrite positive - Bacterial urinary tract infection likely`);
                                              }

                                              if (leucocytes && leucocytes !== "Negative" && leucocytes !== "-") {
                                                warnings.push(`⚠️ Leucocytes in urine (${leucocytes}) - Urinary tract infection or inflammation`);
                                              }
                                            }

                                            // ===== COMPLETE BLOOD COUNT (CBC) =====
                                            if (testName === "Complete Blood Count (CBC)") {
                                              const hb = parseFloat(testData["Hemoglobin"]);
                                              const wbc = parseFloat(testData["WBC"]);
                                              const platelets = parseFloat(testData["Platelets"]);
                                              
                                              if (!isNaN(hb) && hb < 7) {
                                                criticalFindings.push(`🔴 SEVERE anemia (Hb: ${hb} g/dL) - Requires urgent blood transfusion consideration`);
                                              } else if (!isNaN(hb) && hb < 10) {
                                                warnings.push(`⚠️ Moderate anemia (Hb: ${hb} g/dL) - Requires treatment`);
                                              }
                                              
                                              if (!isNaN(wbc) && wbc > 15) {
                                                warnings.push(`⚠️ Elevated WBC (${wbc} x10³/µL) - Possible severe infection or leukemia`);
                                              } else if (!isNaN(wbc) && wbc > 11) {
                                                warnings.push(`⚠️ Elevated WBC (${wbc} x10³/µL) - Possible infection`);
                                              }

                                              if (!isNaN(wbc) && wbc < 4) {
                                                warnings.push(`⚠️ Low WBC (${wbc} x10³/µL) - Immunosuppression, needs evaluation`);
                                              }

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
                                              const urea = parseFloat(testData["Urea"]);
                                              
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
                                            if (testName.includes("Blood Sugar") || testName.includes("Blood Glucose")) {
                                              const bloodGlucose = parseFloat(testData["Blood Glucose"]);
                                              
                                              if (!isNaN(bloodGlucose)) {
                                                if (testName.includes("Fasting") && bloodGlucose > 200) {
                                                  criticalFindings.push(`🔴 Very high fasting glucose (${bloodGlucose} mg/dL) - Diabetes, needs urgent management`);
                                                } else if (testName.includes("Fasting") && bloodGlucose > 126) {
                                                  warnings.push(`⚠️ Elevated fasting glucose (${bloodGlucose} mg/dL) - Diabetes likely`);
                                                } else if (testName.includes("Random") && bloodGlucose > 300) {
                                                  criticalFindings.push(`🔴 Dangerously high blood sugar (${bloodGlucose} mg/dL) - Diabetic emergency risk`);
                                                } else if (testName.includes("Random") && bloodGlucose > 200) {
                                                  warnings.push(`⚠️ High random blood sugar (${bloodGlucose} mg/dL) - Diabetes evaluation needed`);
                                                }
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
                                            <div className="mb-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                                              <h5 className="text-base font-bold mb-2 text-yellow-900 flex items-center">
                                                <span className="text-xl mr-2">ℹ️</span> Clinical Interpretation
                                              </h5>
                                              {criticalFindings.length > 0 && (
                                                <div className="mb-3">
                                                  <p className="font-semibold text-red-800 mb-2 text-sm">Critical Findings Requiring Attention:</p>
                                                  <div className="space-y-1">
                                                    {criticalFindings.map((finding, i) => (
                                                      <div key={i} className="bg-red-100 border-l-4 border-red-600 p-2 text-sm">
                                                        {finding}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {warnings.length > 0 && (
                                                <div className="space-y-1">
                                                  {warnings.map((warning, i) => (
                                                    <div key={i} className="bg-yellow-100 border-l-4 border-yellow-600 p-2 text-sm">
                                                      {warning}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ) : null;
                                        })()}

                                        {Object.entries(parsedResults).length > 0 ? (
                                          Object.entries(parsedResults).map(([panel, fields]) => {
                                            const panelConfig = resultFields?.[panel] || {};
                                            return (
                                              <div key={panel}>
                                                <h5 className="font-medium text-sm mb-2 text-blue-700">{panel}</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm border rounded p-3">
                                                  {Object.entries(fields).map(([name, value]) => {
                                                    const fieldConfig = panelConfig[name];
                                                    const abnormal = isAbnormal(value, fieldConfig);
                                                    return (
                                                      <div key={name} className="flex justify-between items-baseline py-1 border-b border-dashed">
                                                        <span className="text-muted-foreground mr-2">{name}</span>
                                                        <span className={`text-right ${abnormal ? "font-semibold text-red-600" : ""}`}>
                                                          {value} {fieldConfig?.unit || ""}
                                                          {fieldConfig?.range && <span className="ml-1 text-xs text-gray-400">[{fieldConfig.range}]</span>}
                                                        </span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          test.status === 'completed' && <p className="text-sm text-muted-foreground">No result values recorded.</p>
                                        )}
                                        {/* --- End NEW --- */}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* X-rays */}
                          {/* ... (Keep X-ray rendering logic, maybe wrap in Card like labs for consistency) ... */}
                           {(qoTab === "all" || qoTab === "xray") && xrays.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">X-Ray Examinations</h4>
                              <div className="space-y-2">
                                {xrays.map((x: any) => ( /* Consider wrapping in Card */
                                  <div key={x.examId || x.orderId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                    <div className="flex justify-between items-start gap-3">
                                      {/* ... existing X-ray content ... */}
                                      <div className="flex-1">
                                        <p className="font-medium">{x.bodyPart}</p>
                                        <div className="flex items-center gap-2 my-1">
                                           <Badge variant={x.status === "completed" ? "default" : "secondary"}>{x.status}</Badge>
                                           {!x.isPaid && (<Badge variant="destructive" className="bg-red-600">UNPAID</Badge>)}
                                           {x.orderLine?.acknowledgedBy && (<Badge variant="outline" className="text-green-600 border-green-600">Acknowledged</Badge>)}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {fmt(x.completedAt || x.resultDate || x.requestDate)}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        {x.status === "completed" && (<Button variant="outline" size="sm" onClick={() => openResult("xray", x)}>View Report</Button>)}
                                        {x.orderLine && (
                                          <div className="flex items-center gap-2">
                                            <Checkbox id={`ack-xray-${x.id}`} checked={!!x.orderLine.acknowledgedBy} onCheckedChange={(checked) => toggleAcknowledgeAndCart({ orderLineId: x.orderLine.id, acknowledged: !!checked, alreadyInCart: !!x.orderLine.addToCart })} data-testid={`ack-xray-${x.id}`} />
                                            <label htmlFor={`ack-xray-${x.id}`} className="text-sm cursor-pointer">Acknowledge</label>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ultrasound */}
                          {/* ... (Keep Ultrasound rendering logic, maybe wrap in Card) ... */}
                          {(qoTab === "all" || qoTab === "ultrasound") && ultrasounds.length > 0 && (
                             <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Ultrasound Examinations</h4>
                              <div className="space-y-2">
                                {ultrasounds.map((u: any) => ( /* Consider wrapping in Card */
                                  <div key={u.examId || u.orderId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                    <div className="flex justify-between items-start gap-3">
                                        {/* ... existing Ultrasound content ... */}
                                      <div className="flex-1">
                                        <p className="font-medium">{u.examType}</p>
                                         <div className="flex items-center gap-2 my-1">
                                           <Badge variant={u.status === "completed" ? "default" : "secondary"}>{u.status}</Badge>
                                           {!u.isPaid && (<Badge variant="destructive" className="bg-red-600">UNPAID</Badge>)}
                                           {u.orderLine?.acknowledgedBy && (<Badge variant="outline" className="text-green-600 border-green-600">Acknowledged</Badge>)}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {fmt(u.completedAt || u.resultDate || u.requestDate)}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                         {u.status === "completed" && (<Button variant="outline" size="sm" onClick={() => openResult("ultrasound", u)}>View Report</Button>)}
                                         {u.orderLine && (
                                            <div className="flex items-center gap-2">
                                              <Checkbox id={`ack-ultrasound-${u.id}`} checked={!!u.orderLine.acknowledgedBy} onCheckedChange={(checked) => toggleAcknowledgeAndCart({ orderLineId: u.orderLine.id, acknowledged: !!checked, alreadyInCart: !!u.orderLine.addToCart })} data-testid={`ack-ultrasound-${u.id}`} />
                                              <label htmlFor={`ack-ultrasound-${u.id}`} className="text-sm cursor-pointer">Acknowledge</label>
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty State */}
                          {qoTab !== 'all' && labTests.length === 0 && xrays.length === 0 && ultrasounds.length === 0 && (
                             <div className="text-center py-6 text-gray-500 border rounded-lg">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No existing {qoTab} results for this visit yet.</p>
                            </div>
                          )}
                           {qoTab === 'all' && labTests.length === 0 && xrays.length === 0 && ultrasounds.length === 0 && (
                            <div className="text-center py-6 text-gray-500 border rounded-lg">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No orders or results yet for this visit.</p>
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
                           {prescriptions.length > 0 && ( <div className="mb-6"> <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4"> Prescribed Medications ({prescriptions.length}) </h3> <div className="space-y-2"> {prescriptions.map((rx) => ( <div key={rx.orderId} className="p-4 bg-gray-50 dark:bg-gray-800 border rounded-lg" data-testid={`prescription-${rx.orderId}`}> <div className="flex items-start justify-between"> <div className="flex-1"> <div className="flex items-center gap-2 mb-2"> <p className="font-medium text-gray-900 dark:text-white">{rx.drugName || "Medication"}</p> <Badge variant={rx.status === "dispensed" ? "default" : "secondary"} className={rx.status === "dispensed" ? "bg-green-600" : ""}>{rx.status}</Badge> <Badge variant={rx.paymentStatus === "paid" ? "default" : "destructive"} className={rx.paymentStatus === "paid" ? "bg-blue-600" : "bg-red-600"}>{rx.paymentStatus}</Badge> </div> <p className="text-sm text-gray-600 dark:text-gray-400">Dosage: {rx.dosage || "As prescribed"} | Quantity: {rx.quantity}</p> {rx.instructions && (<p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Instructions: {rx.instructions}</p>)} <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Order ID: {rx.orderId} | Prescribed: {fmt(rx.createdAt)}</p> {rx.dispensedAt && (<p className="text-xs text-green-600 dark:text-green-400 mt-1">Dispensed: {fmt(rx.dispensedAt)} by {rx.dispensedBy}</p>)} </div> {rx.status === "prescribed" && rx.paymentStatus === "unpaid" && ( <div className="flex gap-2"> <Button type="button" variant="outline" size="sm" onClick={() => { setEditingPrescription(rx); setEditDosage(rx.dosage || ""); setEditQuantity(rx.quantity || 0); setEditInstructions(rx.instructions || ""); }} data-testid={`btn-edit-${rx.orderId}`}><Edit className="w-4 h-4 mr-1" />Edit</Button> <Button type="button" variant="destructive" size="sm" onClick={() => { if (window.confirm("Cancel this prescription?")) { cancelPrescriptionMutation.mutate(rx.orderId); } }} data-testid={`btn-cancel-${rx.orderId}`}><Trash2 className="w-4 h-4 mr-1" />Cancel</Button> </div> )} </div> </div> ))} </div> <div className="border-t pt-4 mt-4" /> </div> )}
                           <div className="flex items-center justify-between"> <h3 className="font-medium text-gray-800 dark:text-gray-200">Order New Medications</h3> <p className="text-sm text-gray-600 dark:text-gray-400">Select drugs from inventory to create pharmacy orders</p> </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"> <div className="space-y-2"><label className="text-sm font-medium">Select Drug</label><Select value={selectedDrugId} onValueChange={(value) => { setSelectedDrugId(value); const drug = drugs.find((d) => d.id.toString() === value); if (drug) setSelectedDrugName(drug.genericName || drug.name); }}><SelectTrigger data-testid="select-drug"><SelectValue placeholder="Choose a medication..." /></SelectTrigger><SelectContent>{drugs.map((drug) => (<SelectItem key={drug.id} value={drug.id.toString()}>{drug.genericName || drug.name} - {drug.strength}</SelectItem>))}</SelectContent></Select></div> <div className="space-y-2"><label className="text-sm font-medium">Dosage Instructions</label><Input placeholder="e.g., 1 tablet twice daily" value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} data-testid="input-dosage" /></div> <div className="space-y-2"><label className="text-sm font-medium">Quantity</label><Input type="number" min="1" placeholder="e.g., 30" value={newMedQuantity} onChange={(e) => setNewMedQuantity(parseInt(e.target.value) || 0)} data-testid="input-quantity" /></div> <div className="space-y-2"><label className="text-sm font-medium">Additional Instructions</label><Input placeholder="e.g., Take with food" value={newMedInstructions} onChange={(e) => setNewMedInstructions(e.target.value)} data-testid="input-instructions" /></div> </div>
                           <Button type="button" onClick={() => { if (!selectedDrugId || !newMedDosage || newMedQuantity <= 0) { toast({ title: "Validation Error", description: "Please fill in drug, dosage, and quantity", variant: "destructive", }); return; } setMedications([...medications, { drugId: parseInt(selectedDrugId), drugName: selectedDrugName, dosage: newMedDosage, quantity: newMedQuantity, instructions: newMedInstructions, },]); setSelectedDrugId(""); setSelectedDrugName(""); setNewMedDosage(""); setNewMedQuantity(0); setNewMedInstructions(""); toast({ title: "Added", description: "Medication added to order list" }); }} data-testid="btn-add-medication"><Plus className="w-4 h-4 mr-2" />Add to Order List</Button>
                           {medications.length > 0 && ( <div className="space-y-2"> <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Medications to Order ({medications.length})</h4> <div className="space-y-2">{medications.map((med, idx) => ( <div key={idx} className="flex items-start justify-between p-3 bg-white dark:bg-gray-900 border rounded-lg"> <div className="flex-1"><p className="font-medium">{med.drugName}</p><p className="text-sm text-gray-600 dark:text-gray-400">Dosage: {med.dosage} | Quantity: {med.quantity}</p>{med.instructions && (<p className="text-sm text-gray-500 dark:text-gray-500">Instructions: {med.instructions}</p>)}</div> <Button type="button" variant="ghost" size="sm" onClick={() => setMedications(medications.filter((_, i) => i !== idx))} data-testid={`btn-remove-med-${idx}`}><Trash2 className="w-4 h-4 text-red-600" /></Button> </div> ))}</div> <Button type="button" onClick={() => submitMedicationsMutation.mutate(medications)} disabled={submitMedicationsMutation.isPending} className="w-full bg-green-600 hover:bg-green-700" data-testid="btn-submit-medications"><Pill className="w-4 h-4 mr-2" />{submitMedicationsMutation.isPending ? "Submitting..." : `Send ${medications.length} Order(s) to Pharmacy`}</Button> </div> )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>


                  {/* === TAB 4: PATIENT HISTORY === */}
                  {/* ... (Keep Patient History tab content as is) ... */}
                  <TabsContent value="history">
                     <Card>
                       <CardHeader><CardTitle>Patient History</CardTitle></CardHeader>
                       <CardContent>
                         <p className="text-sm text-muted-foreground mb-4">Showing recent visit history. Full historical data would be added here.</p>
                         <h4 className="font-semibold mb-2">Recent Visits</h4>
                         {recentTreatments.length > 0 ? ( <div className="space-y-2">{recentTreatments.map((tx) => ( <div key={tx.treatmentId} className="p-3 border rounded-lg bg-muted/50"><div className="flex justify-between items-center"><span className="font-medium">{tx.visitDate}</span><Badge variant="outline">{tx.visitType}</Badge></div><p className="text-sm text-muted-foreground mt-1 truncate">Diagnosis: {tx.diagnosis || "N/A"}</p></div> ))}</div> ) : ( <p className="text-sm text-muted-foreground">No recent visits found.</p> )}
                       </CardContent>
                     </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* === RIGHT "CONTEXT" RAIL === */}
              {/* ... (Keep Vitals, Alerts, Visit Cart as is) ... */}
              <div className="space-y-4">
                {/* Vitals Card */}
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Heart className="h-5 w-5" />Vitals (Today)</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 text-sm"><div><div className="text-muted-foreground">Temp</div><div className="font-medium">{watchedVitals[0] ? `${watchedVitals[0]} °C` : "—"}</div></div><div><div className="text-muted-foreground">BP</div><div className="font-medium">{watchedVitals[1] || "—"}</div></div><div><div className="text-muted-foreground">Heart Rate</div><div className="font-medium">{watchedVitals[2] ? `${watchedVitals[2]} bpm` : "—"}</div></div><div><div className="text-muted-foreground">Weight</div><div className="font-medium">{watchedVitals[3] ? `${watchedVitals[3]} kg` : "—"}</div></div></div></CardContent></Card>
                {/* Alerts Card */}
                <Card className="border-red-500/50"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-red-600"><AlertTriangle className="h-5 w-5" />Alerts & Allergies</CardTitle></CardHeader><CardContent><p className="font-medium text-red-700">No known drug allergies</p><p className="text-sm text-muted-foreground mt-2">(Placeholder for alerts API)</p></CardContent></Card>
                 {/* Visit Cart */}
                <RightRailCart orders={cartItems} onRemove={(orderId) => addToCartMutation.mutate({ orderLineId: orderId, addToCart: false })} onPrint={() => window.print()} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ... (Keep Edit Prescription Dialog, Result Drawer, Print Sheet, Queue Modal as is) ... */}
      {/* Edit Prescription Dialog */}
      <Dialog open={!!editingPrescription} onOpenChange={(open) => !open && setEditingPrescription(null)}> {/* ... content ... */} </Dialog>
      {/* Universal Result Drawer */}
      <ResultDrawer open={resultDrawer.open} onOpenChange={(open) => (open ? null : closeResult())} kind={resultDrawer.kind} data={resultDrawer.data} patient={selectedPatient ?? undefined} resultFields={resultFields} onAcknowledge={(orderLineId, acknowledged) => toggleAcknowledgeAndCart({ orderLineId, acknowledged, alreadyInCart: !!resultDrawer.data?.orderLine?.addToCart, })} onCopyToNotes={(txt) => form.setValue("examination", `${(form.getValues("examination") || "")}\n${txt}`.trim())} />
      {/* Prescription print sheet */}
      {showPrescription && selectedPatient && ( <div> {/* ... content ... */} </div> )}
      {/* Queue modal */}
      <Dialog open={queueOpen} onOpenChange={setQueueOpen}> {/* ... content ... */} </Dialog>

    </div>
  );
}
