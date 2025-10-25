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
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";

// New components wired in
import OmniOrderBar from "@/components/OmniOrderBar"; // We will remove this from the layout but keep the component for now
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
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

// ---------- helpers ----------
function parseJSON<T = any>(v: any, fallback: T): T {
  try {
    return JSON.parse(v ?? "");
  } catch {
    return fallback;
  }
}

const fmt = (d?: string | number | Date) => (d ? new Date(d).toLocaleString() : "—");

// --- Quick Orders helpers ---
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
  "Complete Blood Count (CBC)": {
    WBC: { type: "number", unit: "x10³/µL", normal: "4.0-11.0" },
    RBC: { type: "number", unit: "x10⁶/µL", normal: "4.5-5.5" },
    Hemoglobin: { type: "number", unit: "g/dL", normal: "12-16" },
    Hematocrit: { type: "number", unit: "%", normal: "36-46" },
    Platelets: { type: "number", unit: "x10³/µL", normal: "150-400" },
    MCV: { type: "number", unit: "fL", normal: "80-100" },
    MCH: { type: "number", unit: "pg", normal: "27-32" },
    MCHC: { type: "number", unit: "g/dL", normal: "32-36" },
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
  "Liver Function Test (LFT)": {
    "Total Bilirubin": { type: "number", unit: "mg/dL", normal: "0.3-1.2" },
    "Direct Bilirubin": { type: "number", unit: "mg/dL", normal: "0-0.3" },
    "ALT (SGPT)": { type: "number", unit: "U/L", normal: "7-56" },
    "AST (SGOT)": { type: "number", unit: "U/L", normal: "10-40" },
    ALP: { type: "number", unit: "U/L", normal: "44-147" },
    "Total Protein": { type: "number", unit: "g/dL", normal: "6.0-8.3" },
    Albumin: { type: "number", unit: "g/dL", normal: "3.5-5.0" },
  },
  "Renal Function Test (RFT)": {
    Urea: { type: "number", unit: "mg/dL", normal: "15-40" },
    Creatinine: { type: "number", unit: "mg/dL", normal: "0.7-1.3" },
    "Uric Acid": { type: "number", unit: "mg/dL", normal: "3.5-7.2" },
    Sodium: { type: "number", unit: "mmol/L", normal: "135-145" },
    Potassium: { type: "number", unit: "mmol/L", normal: "3.5-5.0" },
    Chloride: { type: "number", unit: "mmol/L", normal: "98-106" },
  },
};

// ---------- component ----------
export default function Treatment() {
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

  // visit cart (aka summary)
  const cartItems = useMemo(
    () => orders.filter(o => !!o.addToCart),
    [orders]
  );

  const labTests = orders.filter((o) => o.type === "lab");
  const xrays = orders.filter((o) => o.type === "xray");
  const ultrasounds = orders.filter((o) => o.type === "ultrasound");

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

  const addConsultationMutation = useMutation({
    mutationFn: async () => {
      if (!currentEncounter) throw new Error("No encounter found");
      const svc = services.find((s) => s.category === "consultation" && s.name.includes("General"));
      if (!svc) throw new Error("Consultation service not found");
      const r = await fetch("/api/order-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encounterId: currentEncounter.encounterId,
          serviceId: svc.id,
          relatedType: "consultation",
          description: svc.name,
          quantity: 1,
          unitPriceSnapshot: svc.price,
          totalPrice: svc.price,
          department: "consultation",
          orderedBy: "Dr. System",
        }),
      });
      if (!r.ok) throw new Error("Failed to add consultation fee");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      toast({ title: "Consultation Added", description: "Consultation fee added to the visit." });
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
      toast({ title: "Added", description: "Added to visit summary" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add to summary", variant: "destructive" }),
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
          {/* Patient selection */}
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

            {!selectedPatient ? (
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
            ) : (
              <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md">
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
          </div>

          {/* !!! REMOVED OmniOrderBar from here !!! */}

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

                  {/* === TAB 1: VISIT NOTES (S.O.A.P.) === */}
                  <TabsContent value="notes">
                    <Card>
                      <CardHeader>
                        <CardTitle>Clinical Documentation (S.O.A.P. Note)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...form}>
                          <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Visit Info */}
                            <div>
                              <h3 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                                Visit Information
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="visitDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Visit Date</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="visitType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Visit Type</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="consultation">Consultation</SelectItem>
                                          <SelectItem value="follow-up">Follow-up</SelectItem>
                                          <SelectItem value="emergency">Emergency</SelectItem>
                                          <SelectItem value="preventive">Preventive Care</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="priority"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Priority</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="routine">Routine</SelectItem>
                                          <SelectItem value="urgent">Urgent</SelectItem>
                                          <SelectItem value="emergency">Emergency</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            {/* Subjective */}
                            <FormField
                              control={form.control}
                              name="chiefComplaint"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Subjective (Chief Complaint)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="What brings the patient in today?"
                                      rows={3}
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Objective */}
                            <div>
                              <h3 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                                Objective
                              </h3>
                              <div className="font-medium mb-2">Vital Signs</div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormField
                                  control={form.control}
                                  name="temperature"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Temperature (°C)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.1"
                                          placeholder="36.5"
                                          {...field}
                                          value={field.value ?? ""}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value ? parseFloat(e.target.value) : null
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="bloodPressure"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Blood Pressure</FormLabel>
                                      <FormControl>
                                        <Input placeholder="120/80" {...field} value={field.value ?? ""} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="heartRate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Heart Rate (bpm)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="72"
                                          {...field}
                                          value={field.value ?? ""}
                                          onChange={(e) =>
                                            field.onChange(e.target.value ? parseInt(e.target.value) : null)
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="weight"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Weight (kg)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.1"
                                          placeholder="65.0"
                                          {...field}
                                          value={field.value ?? ""}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value ? parseFloat(e.target.value) : null
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            <FormField
                              control={form.control}
                              name="examination"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Physical Examination</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Detailed examination findings..."
                                      rows={4}
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Assessment */}
                            <FormField
                              control={form.control}
                              name="diagnosis"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Assessment (Diagnosis)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Primary and secondary diagnoses..."
                                      rows={3}
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Plan */}
                            <FormField
                              control={form.control}
                              name="treatmentPlan"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Plan (Treatment & Follow-up)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Medications, procedures, recommendations..."
                                      rows={4}
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="followUpDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Follow-up Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="followUpType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Next Visit Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="No follow-up needed" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="none">No follow-up needed</SelectItem>
                                        <SelectItem value="routine">Routine Follow-up</SelectItem>
                                        <SelectItem value="urgent">Urgent Follow-up</SelectItem>
                                        <SelectItem value="lab-results">Lab Results Review</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-6 mt-6 border-t">
                              <Button
                                type="submit"
                                disabled={createTreatmentMutation.isPending}
                                className="bg-medical-blue hover:bg-blue-700"
                                data-testid="save-treatment-btn"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                {createTreatmentMutation.isPending ? "Saving..." : "Save Visit Notes"}
                              </Button>

                              {currentEncounter && currentEncounter.status === "open" && (
                                <Button
                                  type="button"
                                  onClick={handleCloseVisit}
                                  variant="default"
                                  className="bg-orange-600 hover:bg-orange-700"
                                  disabled={closeVisitMutation.isPending}
                                  data-testid="close-visit-btn"
                                >
                                  {closeVisitMutation.isPending ? "Closing..." : "Close Visit"}
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleNewTreatment}
                                className="ml-auto"
                              >
                                New Treatment
                              </Button>
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
                        
                        {/* --- NEW: Sub-tabs for Ordering --- */}
                        <div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Button variant={qoTab === "all" ? "default" : "outline"} onClick={() => setQoTab("all")}>
                              All Results
                            </Button>
                            {(["lab", "xray", "ultrasound", "consult", "pharmacy"] as const).map((k) => (
                              <Button key={k} variant={qoTab === k ? "default" : "outline"} onClick={() => setQoTab(k)}>
                                {k === "lab" && "Lab"}
                                {k === "xray" && "X-Ray"}
                                {k === "ultrasound" && "Ultrasound"}
                                {k === "consult" && "Consult"}
                                {k === "pharmacy" && "Pharmacy"}
                              </Button>
                            ))}
                            {qoTab !== "all" && (
                              <div className="ml-auto w-full sm:w-64">
                                <Input
                                  placeholder="Search services to add…"
                                  value={qoSearch}
                                  onChange={(e) => setQoSearch(e.target.value)}
                                />
                              </div>
                            )}
                          </div>

                          {/* --- NEW: Service Catalog (from OmniOrderBar) --- */}
                          {qoTab !== "all" && (
                            <div className="rounded-md border p-3 mb-6">
                              <h3 className="font-semibold mb-3 text-lg">
                                Add New {qoTab.charAt(0).toUpperCase() + qoTab.slice(1)} Order
                              </h3>
                              {(() => {
                                const rows = (qoTab === 'pharmacy' ? drugs : services)
                                  .filter((s: any) => {
                                    if (qoTab === 'pharmacy') {
                                      return true; // Simple filter for drugs
                                    }
                                    return matchesCategory(s, qoTab);
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
                                  .slice(0, 50); // keep it snappy

                                if (rows.length === 0) {
                                  return <div className="text-sm text-muted-foreground">No matching services.</div>;
                                }

                                return (
                                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {rows.map((svc: any) => (
                                      <button
                                        key={svc.id}
                                        onClick={async () => {
                                          if (!currentEncounter) return;
                                          
                                          if (qoTab === "lab") {
                                            window.location.href = `/laboratory?encounterId=${currentEncounter.encounterId}&serviceId=${svc.id}`;
                                            return;
                                          }
                                          if (qoTab === "xray") {
                                            window.location.href = `/xray?encounterId=${currentEncounter.encounterId}&serviceId=${svc.id}`;
                                            return;
                                          }
                                          if (qoTab === "ultrasound") {
                                            window.location.href = `/ultrasound?encounterId=${currentEncounter.encounterId}&serviceId=${svc.id}`;
                                            return;
                                          }
                                          if (qoTab === "consult") {
                                            try {
                                              const res = await fetch("/api/order-lines", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  encounterId: currentEncounter.encounterId,
                                                  serviceId: svc.id,
                                                  relatedType: "consultation",
                                                  description: svc.name,
                                                  quantity: 1,
                                                  unitPriceSnapshot: svc.price,
                                                  totalPrice: svc.price,
                                                  department: "consultation",
                                                  orderedBy: "Dr. System",
                                                }),
                                              });
                                              if (!res.ok) throw new Error();
                                              toast({ title: "Consultation added", description: svc.name });
                                              queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
                                            } catch {
                                              toast({
                                                title: "Could not add",
                                                description: svc.name,
                                                variant: "destructive",
                                              });
                                            }
                                            return;
                                          }
                                          if (qoTab === "pharmacy") {
                                            setSelectedDrugId(String(svc.id));
                                            setSelectedDrugName(svc.genericName || svc.name);
                                            setActiveTab("medications"); // Jump to main medications tab
                                            toast({ title: "Medication Selected", description: "Please complete dosage and quantity." });
                                            return;
                                          }
                                        }}
                                        className="text-left rounded-md border p-3 hover:bg-muted transition"
                                      >
                                        <div className="font-medium">{svc.genericName || svc.name}</div>
                                        {svc.description && (
                                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {svc.description}
                                          </div>
                                        )}
                                        {typeof svc.price === "number" && (
                                          <div className="text-xs text-muted-foreground mt-1">Fee: {svc.price}</div>
                                        )}
                                        {svc.strength && (
                                          <div className="text-xs text-muted-foreground mt-1">Strength: {svc.strength}</div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* --- Existing Results (Now Filtered) --- */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Existing Results for this Visit</h3>
                            {orders.some((o) => o.status === "completed" && o.orderLine && !o.orderLine.addToCart) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  orders
                                    .filter((o) => o.orderLine && o.status === "completed" && !o.orderLine.addToCart)
                                    .forEach((o) =>
                                      addToCartMutation.mutate({ orderLineId: o.orderLine.id, addToCart: true })
                                    )
                                }
                              >
                                Add All Completed
                              </Button>
                            )}
                          </div>
                          
                          {/* Labs */}
                          {(qoTab === "all" || qoTab === "lab") && labTests.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Laboratory Tests</h4>
                              <div className="space-y-2">
                                {labTests.map((test: any) => {
                                  const testNames = Array.isArray(test.tests)
                                    ? test.tests
                                    : typeof test.tests === "string"
                                    ? parseJSON<string[]>(test.tests, [])
                                    : [];
                                  return (
                                    <div
                                      key={test.testId || test.orderId}
                                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500"
                                    >
                                      <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={test.status === "completed" ? "default" : "secondary"}>
                                              {test.status}
                                            </Badge>
                                            {!test.isPaid && (
                                              <Badge variant="destructive" className="bg-red-600">
                                                UNPAID
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="font-semibold text-base capitalize mb-1">{test.category}</p>
                                          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                            {testNames.map((n: string, idx: number) => (
                                              <div key={idx}>• {n}</div>
                                            ))}
                                          </div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Requested: {fmt(test.requestedDate)}
                                          </p>
                                          {test.orderLine?.acknowledgedBy && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                              ✓ Acknowledged by {test.orderLine.acknowledgedBy}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          {test.orderLine && (
                                            <>
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
                                                <label
                                                  htmlFor={`ack-lab-${test.id}`}
                                                  className="text-sm cursor-pointer"
                                                >
                                                  Acknowledge
                                                </label>
                                              </div>
                                              {test.orderLine.acknowledgedBy && !test.orderLine.addToCart && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    addToCartMutation.mutate({
                                                      orderLineId: test.orderLine.id,
                                                      addToCart: true,
                                                    })
                                                  }
                                                  data-testid={`add-cart-lab-${test.id}`}
                                                >
                                                  <Plus className="h-3 w-3 mr-1" />
                                                  Add to Summary
                                                </Button>
                                              )}
                                              {test.orderLine.addToCart === 1 && (
                                                <Badge variant="outline" className="bg-green-50">
                                                  Added
                                                </Badge>
                                              )}
                                            </>
                                          )}

                                          {test.status === "completed" && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => openResult("lab", test)}
                                            >
                                              View Results
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* X-rays */}
                          {(qoTab === "all" || qoTab === "xray") && xrays.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">X-Ray Examinations</h4>
                              <div className="space-y-2">
                                {xrays.map((x: any) => (
                                  <div
                                    key={x.examId || x.orderId}
                                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                  >
                                    <div className="flex justify-between items-start gap-3">
                                      <div className="flex-1">
                                        <p className="font-medium">{x.bodyPart}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {fmt(x.completedAt || x.resultDate || x.requestDate)}
                                        </p>
                                        <Badge
                                          variant={x.status === "completed" ? "default" : "secondary"}
                                          className="mt-1"
                                        >
                                          {x.status}
                                        </Badge>
                                        {x.orderLine?.acknowledgedBy && (
                                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            ✓ Acknowledged by {x.orderLine.acknowledgedBy}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        {x.orderLine && (
                                          <>
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                id={`ack-xray-${x.id}`}
                                                checked={!!x.orderLine.acknowledgedBy}
                                                onCheckedChange={(checked) =>
                                                  toggleAcknowledgeAndCart({
                                                    orderLineId: x.orderLine.id,
                                                    acknowledged: !!checked,
                                                    alreadyInCart: !!x.orderLine.addToCart
                                                  })
                                                }
                                                data-testid={`ack-xray-${x.id}`}
                                              />
                                              <label
                                                htmlFor={`ack-xray-${x.id}`}
                                                className="text-sm cursor-pointer"
                                              >
                                                Acknowledge
                                              </label>
                                            </div>
                                            {x.orderLine.acknowledgedBy && !x.orderLine.addToCart && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  addToCartMutation.mutate({
                                                    orderLineId: x.orderLine.id,
                                                    addToCart: true,
                                                  })
                                                }
                                                data-testid={`add-cart-xray-${x.id}`}
                                              >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add to Summary
                                              </Button>
                                            )}
                                            {x.orderLine.addToCart === 1 && (
                                              <Badge variant="outline" className="bg-green-50">
                                                Added
                                              </Badge>
                                            )}
                                          </>
                                        )}

                                        {x.status === "completed" && (
                                          <Button variant="outline" size="sm" onClick={() => openResult("xray", x)}>
                                            View Report
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ultrasound */}
                          {(qoTab === "all" || qoTab === "ultrasound") && ultrasounds.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Ultrasound Examinations</h4>
                              <div className="space-y-2">
                                {ultrasounds.map((u: any) => (
                                  <div
                                    key={u.examId || u.orderId}
                                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                  >
                                    <div className="flex justify-between items-start gap-3">
                                      <div className="flex-1">
                                        <p className="font-medium">{u.examType}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {fmt(u.completedAt || u.resultDate || u.requestDate)}
                                        </p>
                                        <Badge
                                          variant={u.status === "completed" ? "default" : "secondary"}
                                          className="mt-1"
                                        >
                                          {u.status}
                                        </Badge>
                                        {u.orderLine?.acknowledgedBy && (
                                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            ✓ Acknowledged by {u.orderLine.acknowledgedBy}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        {u.orderLine && (
                                          <>
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                id={`ack-ultrasound-${u.id}`}
                                                checked={!!u.orderLine.acknowledgedBy}
                                                onCheckedChange={(checked) =>
                                                  toggleAcknowledgeAndCart({
                                                    orderLineId: u.orderLine.id,
                                                    acknowledged: !!checked,
                                                    alreadyInCart: !!u.orderLine.addToCart
                                                  })
                                                }
                                                data-testid={`ack-ultrasound-${u.id}`}
                                              />
                                              <label
                                                htmlFor={`ack-ultrasound-${u.id}`}
                                                className="text-sm cursor-pointer"
                                              >
                                                Acknowledge
                                              </label>
                                            </div>
                                            {u.orderLine.acknowledgedBy && !u.orderLine.addToCart && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  addToCartMutation.mutate({
                                                    orderLineId: u.orderLine.id,
                                                    addToCart: true,
                                                  })
                                                }
                                                data-testid={`add-cart-ultrasound-${u.id}`}
                                              >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add to Summary
                                              </Button>
                                            )}
                                            {u.orderLine.addToCart === 1 && (
                                              <Badge variant="outline" className="bg-green-50">
                                                Added
                                              </Badge>
                                            )}
                                          </>
                                        )}

                                        {u.status === "completed" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openResult("ultrasound", u)}
                                          >
                                            View Report
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {labTests.length === 0 && xrays.length === 0 && ultrasounds.length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No orders or results yet for this visit</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* === TAB 3: MEDICATIONS === */}
                  <TabsContent value="medications">
                    <Card>
                      <CardHeader>
                        <CardTitle>Medication Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Prescribed list */}
                          {prescriptions.length > 0 && (
                            <div className="mb-6">
                              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
                                Prescribed Medications ({prescriptions.length})
                              </h3>
                              <div className="space-y-2">
                                {prescriptions.map((rx) => (
                                  <div
                                    key={rx.orderId}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 border rounded-lg"
                                    data-testid={`prescription-${rx.orderId}`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <p className="font-medium text-gray-900 dark:text-white">
                                            {rx.drugName || "Medication"}
                                          </p>
                                          <Badge
                                            variant={
                                              rx.status === "dispensed" ? "default" : "secondary"
                                            }
                                            className={
                                              rx.status === "dispensed" ? "bg-green-600" : ""
                                            }
                                          >
                                            {rx.status}
                                          </Badge>
                                          <Badge
                                            variant={
                                              rx.paymentStatus === "paid" ? "default" : "destructive"
                                            }
                                            className={
                                              rx.paymentStatus === "paid" ? "bg-blue-600" : "bg-red-600"
                                            }
                                          >
                                            {rx.paymentStatus}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Dosage: {rx.dosage || "As prescribed"} | Quantity: {rx.quantity}
                                        </p>
                                        {rx.instructions && (
                                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                            Instructions: {rx.instructions}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                          Order ID: {rx.orderId} | Prescribed: {fmt(rx.createdAt)}
                                        </p>
                                        {rx.dispensedAt && (
                                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            Dispensed: {fmt(rx.dispensedAt)} by {rx.dispensedBy}
                                          </p>
                                        )}
                                      </div>

                                      {rx.status === "prescribed" &&
                                        rx.paymentStatus === "unpaid" && (
                                          <div className="flex gap-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setEditingPrescription(rx);
                                                setEditDosage(rx.dosage || "");
                                                setEditQuantity(rx.quantity || 0);
                                                setEditInstructions(rx.instructions || "");
                                              }}
                                              data-testid={`btn-edit-${rx.orderId}`}
                                            >
                                              <Edit className="w-4 h-4 mr-1" />
                                              Edit
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => {
                                                if (window.confirm("Cancel this prescription?")) {
                                                  cancelPrescriptionMutation.mutate(rx.orderId);
                                                }
                                              }}
                                              data-testid={`btn-cancel-${rx.orderId}`}
                                            >
                                              <Trash2 className="w-4 h-4 mr-1" />
                                              Cancel
                                            </Button>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t pt-4 mt-4" />
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">
                              Order New Medications
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Select drugs from inventory to create pharmacy orders
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Select Drug</label>
                              <Select
                                value={selectedDrugId}
                                onValueChange={(value) => {
                                  setSelectedDrugId(value);
                                  const drug = drugs.find((d) => d.id.toString() === value);
                                  if (drug) setSelectedDrugName(drug.genericName || drug.name);
                                }}
                              >
                                <SelectTrigger data-testid="select-drug">
                                  <SelectValue placeholder="Choose a medication..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {drugs.map((drug) => (
                                    <SelectItem key={drug.id} value={drug.id.toString()}>
                                      {drug.genericName || drug.name} - {drug.strength}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Dosage Instructions</label>
                              <Input
                                placeholder="e.g., 1 tablet twice daily"
                                value={newMedDosage}
                                onChange={(e) => setNewMedDosage(e.target.value)}
                                data-testid="input-dosage"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Quantity</label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g., 30"
                                value={newMedQuantity}
                                onChange={(e) => setNewMedQuantity(parseInt(e.target.value) || 0)}
                                data-testid="input-quantity"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Additional Instructions</label>
                              <Input
                                placeholder="e.g., Take with food"
                                value={newMedInstructions}
                                onChange={(e) => setNewMedInstructions(e.target.value)}
                                data-testid="input-instructions"
                              />
                            </div>
                          </div>

                          <Button
                            type="button"
                            onClick={() => {
                              if (!selectedDrugId || !newMedDosage || newMedQuantity <= 0) {
                                toast({
                                  title: "Validation Error",
                                  description: "Please fill in drug, dosage, and quantity",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setMedications([
                                ...medications,
                                {
                                  drugId: parseInt(selectedDrugId),
                                  drugName: selectedDrugName,
                                  dosage: newMedDosage,
                                  quantity: newMedQuantity,
                                  instructions: newMedInstructions,
                                },
                              ]);
                              setSelectedDrugId("");
                              setSelectedDrugName("");
                              setNewMedDosage("");
                              setNewMedQuantity(0);
                              setNewMedInstructions("");
                              toast({ title: "Added", description: "Medication added to order list" });
                            }}
                            data-testid="btn-add-medication"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Order List
                          </Button>

                          {medications.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                Medications to Order ({medications.length})
                              </h4>
                              <div className="space-y-2">
                                {medications.map((med, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start justify-between p-3 bg-white dark:bg-gray-900 border rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium">{med.drugName}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Dosage: {med.dosage} | Quantity: {med.quantity}
                                      </p>
                                      {med.instructions && (
                                        <p className="text-sm text-gray-500 dark:text-gray-500">
                                          Instructions: {med.instructions}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setMedications(medications.filter((_, i) => i !== idx))
                                      }
                                      data-testid={`btn-remove-med-${idx}`}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              <Button
                                type="button"
                                onClick={() => submitMedicationsMutation.mutate(medications)}
                                disabled={submitMedicationsMutation.isPending}
                                className="w-full bg-green-600 hover:bg-green-700"
                                data-testid="btn-submit-medications"
                              >
                                <Pill className="w-4 h-4 mr-2" />
                                {submitMedicationsMutation.isPending
                                  ? "Submitting..."
                                  : `Send ${medications.length} Order(s) to Pharmacy`}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* === TAB 4: PATIENT HISTORY === */}
                  <TabsContent value="history">
                    <Card>
                      <CardHeader>
                        <CardTitle>Patient History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Showing recent visit history. Full historical data (labs, imaging, etc.)
                          would be added here.
                        </p>
                        
                        <h4 className="font-semibold mb-2">Recent Visits</h4>
                        {recentTreatments.length > 0 ? (
                          <div className="space-y-2">
                            {recentTreatments.map((tx) => (
                              <div key={tx.treatmentId} className="p-3 border rounded-lg bg-muted/50">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{tx.visitDate}</span>
                                  <Badge variant="outline">{tx.visitType}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  Diagnosis: {tx.diagnosis || "N/A"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No recent visits found.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* === RIGHT "CONTEXT" RAIL === */}
              <div className="space-y-4">
                
                {/* NEW: Vitals Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Heart className="h-5 w-5" />
                      Vitals (Today)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Temp</div>
                        <div className="font-medium">{watchedVitals[0] ? `${watchedVitals[0]} °C` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">BP</div>
                        <div className="font-medium">{watchedVitals[1] || "—"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Heart Rate</div>
                        <div className="font-medium">{watchedVitals[2] ? `${watchedVitals[2]} bpm` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Weight</div>
                        <div className="font-medium">{watchedVitals[3] ? `${watchedVitals[3]} kg` : "—"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* NEW: Alerts (Stub) */}
                <Card className="border-red-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Alerts & Allergies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* This is a stub. Wire this up to your patient's allergy data. */}
                    <p className="font-medium text-red-700">No known drug allergies</p>
                    <p className="text-sm text-muted-foreground mt-2">(Placeholder for alerts API)</p>
                  </CardContent>
                </Card>

                {/* EXISTING: Visit Cart */}
                <RightRailCart
                  orders={cartItems}
                  onRemove={(orderId) =>
                    addToCartMutation.mutate({ orderLineId: orderId, addToCart: false })
                  }
                  onPrint={() => window.print()}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Prescription Dialog */}
      <Dialog open={!!editingPrescription} onOpenChange={(open) => !open && setEditingPrescription(null)}>
        <DialogContent className="max-w-lg" data-testid="dialog-edit-prescription">
          <DialogHeader>
            <DialogTitle>Edit Prescription</DialogTitle>
          </DialogHeader>

          {editingPrescription && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">{editingPrescription.drugName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order ID: {editingPrescription.orderId}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dosage Instructions</label>
                <Input
                  placeholder="e.g., 1 tablet twice daily"
                  value={editDosage}
                  onChange={(e) => setEditDosage(e.target.value)}
                  data-testid="input-edit-dosage"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                  data-testid="input-edit-quantity"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Instructions</label>
                <Input
                  placeholder="e.g., Take with food"
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  data-testid="input-edit-instructions"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    if (!editDosage || editQuantity <= 0) {
                      toast({
                        title: "Validation Error",
                        description: "Please fill in dosage and quantity",
                        variant: "destructive",
                      });
                      return;
                    }
                    editPrescriptionMutation.mutate({
                      orderId: editingPrescription.orderId,
                      dosage: editDosage,
                      quantity: editQuantity,
                      instructions: editInstructions,
                    });
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={editPrescriptionMutation.isPending}
                  data-testid="btn-save-edit"
                >
                  {editPrescriptionMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPrescription(null)}
                  data-testid="btn-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Universal Result Drawer */}
      <ResultDrawer
        open={resultDrawer.open}
        onOpenChange={(open) => (open ? null : closeResult())}
        kind={resultDrawer.kind}
        data={resultDrawer.data}
        patient={selectedPatient ?? undefined}
        resultFields={resultFields}
        onAcknowledge={(orderLineId, acknowledged) =>
          toggleAcknowledgeAndCart({
            orderLineId,
            acknowledged,
            alreadyInCart: !!resultDrawer.data?.orderLine?.addToCart,
          })
        }
        onAddToSummary={(orderLineId, add) =>
          addToCartMutation.mutate({ orderLineId, addToCart: add })
        }
        onCopyToNotes={(txt) =>
          form.setValue("examination", `${(form.getValues("examination") || "")}\n${txt}`.trim())
        }
      />

      {/* Prescription print sheet */}
      {showPrescription && selectedPatient && (
        <div>
          <Card className="border-2 border-medical-green">
            <CardContent className="p-6">
              <div id="prescription-print" className="flex flex-col min-h-[100vh] p-8">
                
                <div className="text-center border-b pb-4 mb-6">
                  <h1 className="text-2xl font-bold">BAHR EL GHAZAL CLINIC</h1>
                  <p className="text-sm text-gray-600">Your Health, Our Priority</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com
                  </p>
                  
                  {/* You can replace this wireframe image with your actual clinic logo */}
                  <img alt="Bahr El Ghazal Clinic logo" src="https://i.imgur.com/g9vY0vX.png" className="w-24 h-auto mx-auto my-2" />
                  
                  <p className="text-lg font-semibold mt-2">PRESCRIPTION</p>
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b mb-6">
                    <div>
                      <p>
                        <strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p>
                        <strong>Patient ID:</strong> {selectedPatient.patientId}
                      </p>
                      <p>
                        <strong>Age:</strong> {selectedPatient.age || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Date:</strong> {fmt(new Date())}
                      </p>
                      <p>
                        <strong>Treatment ID:</strong> {savedTreatment?.treatmentId || "Not available"}
                      </p>
                      <p>
                        <strong>Phone:</strong> {selectedPatient.phoneNumber || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Rx (Treatment Plan):</h4>
                      <div className="pl-4 whitespace-pre-line bg-gray-50 p-3 rounded border">
                        {form.getValues("treatmentPlan")}
                      </div>
                    </div>

                    {form.getValues("followUpDate") && (
                      <div>
                        <h4 className="font-semibold mb-2">Follow-up:</h4>
                        <p className="pl-4">
                          Next visit: {form.getValues("followUpDate")}
                          {form.getValues("followUpType") && ` (${form.getValues("followUpType")})`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t">
                  <p className="mt-6">Doctor's Signature: ____________________</p>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 print:hidden">
                <Button onClick={printPrescription} className="bg-medical-blue hover:bg-blue-700">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Prescription
                </Button>
                <Button variant="outline" onClick={() => setShowPrescription(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Queue modal */}
      <Dialog open={queueOpen} onOpenChange={setQueueOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Today’s Queue</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Input
              type="date"
              value={queueDate}
              onChange={(e) => setQueueDate(e.target.value)}
              className="w-40"
            />
            <Input
              placeholder="Filter by name, ID or complaint…"
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="border rounded-lg divide-y max-h-[60vh] overflow-y-auto">
            {queueLoading && <div className="p-6 text-center text-gray-500">Loading…</div>}
            {!queueLoading && visibleQueue.length === 0 && (
              <div className="p-10 text-center text-gray-500">No visits on {queueDate}.</div>
            )}

            {visibleQueue.map((v) => (
              <button
                key={v.treatmentId ?? v.encounterId ?? v.patientId}
                onClick={() => {
                  setQueueOpen(false);
                  if (v.encounterId) {
                    window.location.href = `/treatment/${v.encounterId}`;
                  } else {
                    window.location.href = `/treatment/new?patientId=${v.patientId}`;
                  }
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {getPatientName(v.patientId)}{" "}
                      <span className="text-xs text-gray-500">({v.patientId})</span>
                    </div>
                    <div className="text-sm text-gray-500 truncate">{v.chiefComplaint || "—"}</div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {v.visitType || "consultation"}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
