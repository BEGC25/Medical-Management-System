import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, Link } from "wouter";
import { Save, FileText, Printer, Filter, Calendar, ShoppingCart, Plus, DollarSign, Pill, Activity, Trash2, Edit, X, AlertTriangle, Heart, History, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { insertTreatmentSchema, type InsertTreatment, type Patient, type Treatment, type Encounter, type OrderLine, type Service, type LabTest, type XrayExam, type UltrasoundExam, type Drug, type PharmacyOrder } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

// Helper function to parse JSON safely
function parseJSON<T = any>(v: any, fallback: T): T {
  try {
    return JSON.parse(v ?? "");
  } catch {
    return fallback;
  }
}

// Result fields configuration (same as Laboratory page)
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
    "WBC": { type: "number", unit: "x10³/µL", normal: "4.0-11.0" },
    "RBC": { type: "number", unit: "x10⁶/µL", normal: "4.5-5.5" },
    "Hemoglobin": { type: "number", unit: "g/dL", normal: "12-16" },
    "Hematocrit": { type: "number", unit: "%", normal: "36-46" },
    "Platelets": { type: "number", unit: "x10³/µL", normal: "150-400" },
    "MCV": { type: "number", unit: "fL", normal: "80-100" },
    "MCH": { type: "number", unit: "pg", normal: "27-32" },
    "MCHC": { type: "number", unit: "g/dL", normal: "32-36" },
  },
  "Blood Film for Malaria (BFFM)": {
    "Malaria Parasites": { type: "select", options: ["Not seen", "P. falciparum", "P. vivax", "P. malariae", "P. ovale"], normal: "Not seen" },
    "Parasitemia": { type: "select", options: ["None", "+", "++", "+++"], normal: "None" },
    "Gametocytes": { type: "select", options: ["Not seen", "Seen"], normal: "Not seen" },
  },
  "Urine Analysis": {
    "Appearance": { type: "select", options: ["Clear", "Turbid", "Bloody", "Cloudy"], normal: "Clear" },
    "Protein": { type: "select", options: ["Negative", "Trace", "+", "++", "+++"], normal: "Negative" },
    "Glucose": { type: "select", options: ["Negative", "+", "++", "+++"], normal: "Negative" },
    "Acetone": { type: "select", options: ["Negative", "Positive"], normal: "Negative" },
    "Hb pigment": { type: "select", options: ["Negative", "Positive"], normal: "Negative" },
    "Leucocytes": { type: "select", options: ["Negative", "+", "++", "+++"], normal: "Negative" },
    "Nitrite": { type: "select", options: ["Negative", "Positive"], normal: "Negative" },
    "PH": { type: "number", unit: "", range: "5.0-8.0", normal: "6.0-7.5" },
    "Specific Gravity": { type: "number", unit: "", range: "1.003-1.030", normal: "1.010-1.025" },
    "Bilirubin": { type: "select", options: ["Negative", "Positive"], normal: "Negative" },
  },
  "Liver Function Test (LFT)": {
    "Total Bilirubin": { type: "number", unit: "mg/dL", normal: "0.3-1.2" },
    "Direct Bilirubin": { type: "number", unit: "mg/dL", normal: "0-0.3" },
    "ALT (SGPT)": { type: "number", unit: "U/L", normal: "7-56" },
    "AST (SGOT)": { type: "number", unit: "U/L", normal: "10-40" },
    "ALP": { type: "number", unit: "U/L", normal: "44-147" },
    "Total Protein": { type: "number", unit: "g/dL", normal: "6.0-8.3" },
    "Albumin": { type: "number", unit: "g/dL", normal: "3.5-5.0" },
  },
  "Renal Function Test (RFT)": {
    "Urea": { type: "number", unit: "mg/dL", normal: "15-40" },
    "Creatinine": { type: "number", unit: "mg/dL", normal: "0.7-1.3" },
    "Uric Acid": { type: "number", unit: "mg/dL", normal: "3.5-7.2" },
    "Sodium": { type: "number", unit: "mmol/L", normal: "135-145" },
    "Potassium": { type: "number", unit: "mmol/L", normal: "3.5-5.0" },
    "Chloride": { type: "number", unit: "mmol/L", normal: "98-106" },
  },
};

// Helper function to join classes
function cx(...cls: (string | boolean | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export default function Treatment() {
  // Normalize visitId and read patientId from query string
  const { visitId: rawVisitId } = useParams<{ visitId?: string }>();
  const visitId = rawVisitId && rawVisitId !== "new" ? rawVisitId : undefined;
  const searchParams = new URLSearchParams(window.location.search);
  const patientIdFromQuery = searchParams.get("patientId") || undefined;

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [savedTreatment, setSavedTreatment] = useState<Treatment | null>(null);
  const [filterToday, setFilterToday] = useState(false);
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [showVisitSummary, setShowVisitSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");
  const [viewingLabTest, setViewingLabTest] = useState<any | null>(null);
  const [viewingXray, setViewingXray] = useState<any | null>(null);
  const [viewingUltrasound, setViewingUltrasound] = useState<any | null>(null);
  
  // Medication ordering state
  const [medications, setMedications] = useState<Array<{
    drugId: number;
    drugName: string;
    dosage: string;
    quantity: number;
    instructions: string;
  }>>([]);
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [selectedDrugName, setSelectedDrugName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedQuantity, setNewMedQuantity] = useState(0);
  const [newMedInstructions, setNewMedInstructions] = useState("");
  
  // Prescription editing state
  const [editingPrescription, setEditingPrescription] = useState<PharmacyOrder | null>(null);
  const [editDosage, setEditDosage] = useState("");
  const [editQuantity, setEditQuantity] = useState(0);
  const [editInstructions, setEditInstructions] = useState("");
  
  // Patient search state for PatientSearch component
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for filter parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    if (filter === 'today') {
      setFilterToday(true);
    }
  }, []);

  // Clear selected patient when navigating to base /treatment route (no visitId)
  useEffect(() => {
    if (!visitId) {
      setSelectedPatient(null);
      setCurrentEncounter(null);
      setSavedTreatment(null);
      setMedications([]);
    }
  }, [visitId]);

  // Query for today's treatments if filtering
  const { data: todaysTreatments = [] } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments", "today"],
    enabled: filterToday,
  });

  // Fetch all patients to get names for treatment records
  const { data: allPatients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: filterToday,
  });

  // --- START PATCH TO FIX DELETED PATIENT VISIBILITY ---

  // Filter out soft-deleted patients from the list
  // The API is likely returning all patients, but we should only work with active ones.
  // A proper fix involves updating the GET /api/patients endpoint.
  const activePatients = allPatients.filter((p: any) => !p.is_deleted);
  
  // Create a set of active patient IDs for quick lookup
  const activePatientIds = new Set(activePatients.map(p => p.patientId));
  
  // Filter today's treatments to only show those from active (non-deleted) patients
  const activeTodaysTreatments = todaysTreatments.filter(t => 
    activePatientIds.has(t.patientId)
  );

  // --- END PATCH ---

  // NEW: Add filtered treatments based on search term
  const filteredTreatments = activeTodaysTreatments.filter(t => {
    if (!searchTerm) return true;
    const patient = activePatients.find(p => p.patientId === t.patientId);
    if (!patient) return false;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(lowerSearch) ||
      patient.lastName.toLowerCase().includes(lowerSearch) ||
      patient.patientId.toLowerCase().includes(lowerSearch)
    );
  });

  const form = useForm<InsertTreatment>({
    resolver: zodResolver(insertTreatmentSchema),
    defaultValues: {
      patientId: "",
      visitDate: new Date().toISOString().split('T')[0],
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

  // Get services for billing
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Get drugs for medication ordering
  const { data: drugs = [] } = useQuery<Drug[]>({
    queryKey: ["/api/pharmacy/drugs"],
  });

  // Load specific visit if visitId is provided
  const { data: loadedVisit, isLoading: loadingVisit } = useQuery({
    queryKey: ["/api/encounters", visitId],
    queryFn: async () => {
      if (!visitId) return null;
      const response = await fetch(`/api/encounters/${visitId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!visitId,
  });

  // Load patient for the loaded visit (when visiting /treatment/:visitId)
  const { data: loadedPatient } = useQuery<Patient | null>({
    queryKey: ["/api/patients", loadedVisit?.encounter?.patientId],
    queryFn: async () => {
      const pid = loadedVisit?.encounter?.patientId;
      if (!pid) return null;
      const response = await fetch(`/api/patients/${pid}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!loadedVisit?.encounter?.patientId,
  });

  // If we came via /treatment/new?patientId=..., load that patient
  const { data: patientFromQuery } = useQuery<Patient | null>({
    queryKey: ["/api/patients", patientIdFromQuery],
    queryFn: async () => {
      if (!patientIdFromQuery) return null;
      const res = await fetch(`/api/patients/${patientIdFromQuery}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!patientIdFromQuery && !visitId && !selectedPatient,
  });

  // Adopt the patient loaded from the query param
  useEffect(() => {
    if (patientFromQuery) setSelectedPatient(patientFromQuery);
  }, [patientFromQuery]);

  // Get today's encounter for the selected patient (legacy flow, no visitId)
  const { data: todayEncounter } = useQuery<Encounter | null>({
    queryKey: [
      "/api/encounters",
      { pid: selectedPatient?.patientId, date: new Date().toISOString().split("T")[0] },
    ],
    queryFn: async () => {
      if (!selectedPatient) return null;
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/encounters?date=${today}&patientId=${selectedPatient.patientId}`
      );
      if (!response.ok) return null;
      const encounters = await response.json();
      return encounters[0] || null;
    },
    enabled: !!selectedPatient && !visitId,
  });

  // Get order lines for current encounter
  const { data: orderLines = [] } = useQuery({
    queryKey: ["/api/encounters", currentEncounter?.encounterId, "order-lines"],
    queryFn: async () => {
      if (!currentEncounter) return [];
      const response = await fetch(`/api/encounters/${currentEncounter.encounterId}/order-lines`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!currentEncounter,
  });

  // Get unified orders for this visit
  const activeEncounterId = visitId ? loadedVisit?.encounter?.encounterId : currentEncounter?.encounterId;
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/visits", activeEncounterId, "orders"],
    queryFn: async () => {
      if (!activeEncounterId) return [];
      const response = await fetch(`/api/visits/${activeEncounterId}/orders`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!activeEncounterId,
  });

  const labTests = orders.filter(o => o.type === 'lab');
  const xrays = orders.filter(o => o.type === 'xray');
  const ultrasounds = orders.filter(o => o.type === 'ultrasound');

  // Load existing treatment records for this encounter
  const { data: existingTreatment } = useQuery<Treatment | null>({
    queryKey: ["/api/treatments", "encounter", currentEncounter?.encounterId],
    queryFn: async () => {
      if (!currentEncounter?.encounterId) return null;
      const response = await fetch(`/api/treatments?encounterId=${currentEncounter.encounterId}`);
      if (!response.ok) return null;
      const treatments = await response.json();
      return treatments[0] || null;
    },
    enabled: !!currentEncounter?.encounterId,
  });

  // Get pharmacy orders for current patient (filtered by encounter if available)
  const { data: allPrescriptions = [] } = useQuery<PharmacyOrder[]>({
    queryKey: ["/api/pharmacy-orders", selectedPatient?.patientId],
    queryFn: async () => {
      if (!selectedPatient?.patientId) return [];
      const response = await fetch(`/api/pharmacy-orders/${selectedPatient.patientId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedPatient?.patientId,
  });

  // Get recent treatments/visits for this patient
  const { data: recentTreatments = [] } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments", "patient", selectedPatient?.patientId],
    queryFn: async () => {
      if (!selectedPatient?.patientId) return [];
      const response = await fetch(`/api/treatments?patientId=${selectedPatient.patientId}`);
      if (!response.ok) return [];
      const treatments = await response.json();
      return treatments.slice(0, 3); // Get last 3 visits
    },
    enabled: !!selectedPatient?.patientId,
  });

  // Filter prescriptions to current encounter if available, otherwise show all
  const prescriptions = currentEncounter
    ? allPrescriptions.filter(rx => rx.encounterId === currentEncounter.encounterId)
    : allPrescriptions;

  // Sync loaded visit and patient into state when visitId route is used
  useEffect(() => {
    if (loadedVisit?.encounter && loadedPatient && !selectedPatient) {
      setSelectedPatient(loadedPatient);
      setCurrentEncounter(loadedVisit.encounter);
    }
  }, [loadedVisit, loadedPatient]);

  // Safety check: Ensure patient matches encounter
  useEffect(() => {
    if (selectedPatient && currentEncounter && selectedPatient.patientId !== currentEncounter.patientId) {
      console.warn(`Patient mismatch detected! Selected: ${selectedPatient.patientId}, Encounter: ${currentEncounter.patientId}`);
      // Redirect to the correct encounter for this patient
      window.location.href = `/treatment/new?patientId=${selectedPatient.patientId}`;
    }
  }, [selectedPatient, currentEncounter]);

  // Populate form with existing treatment data when it loads
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

  // Update current encounter when patient changes (legacy flow)
  useEffect(() => {
    if (visitId) return; // Skip legacy flow when using visitId route
    
    if (todayEncounter) {
      setCurrentEncounter(todayEncounter);
    } else if (selectedPatient) {
      // Create new encounter if none exists for today
      createEncounterMutation.mutate({
        patientId: selectedPatient.patientId,
        visitDate: new Date().toISOString().split('T')[0],
        attendingClinician: "Dr. System", // In real app, get from auth
      });
    }
  }, [todayEncounter, selectedPatient, visitId]);

  // Create encounter mutation
  const createEncounterMutation = useMutation({
    mutationFn: async (data: { patientId: string; visitDate: string; attendingClinician: string }) => {
      const response = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create encounter");
      return response.json();
    },
    onSuccess: (encounter) => {
      setCurrentEncounter(encounter);
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
    },
  });

  // Auto-add consultation fee
  const addConsultationMutation = useMutation({
    mutationFn: async () => {
      if (!currentEncounter) throw new Error("No encounter found");
      
      const consultationService = services.find(s => s.category === "consultation" && s.name.includes("General"));
      if (!consultationService) throw new Error("Consultation service not found");

      const response = await fetch("/api/order-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encounterId: currentEncounter.encounterId,
          serviceId: consultationService.id,
          relatedType: "consultation",
          description: consultationService.name,
          quantity: 1,
          unitPriceSnapshot: consultationService.price,
          totalPrice: consultationService.price,
          department: "consultation",
          orderedBy: "Dr. System",
        }),
      });
      if (!response.ok) throw new Error("Failed to add consultation fee");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      toast({
        title: "Consultation Added",
        description: "Consultation fee has been added to the patient's visit.",
      });
    },
  });

  const generatePrescription = () => {
    const formData = form.getValues();
    if (!selectedPatient || !formData.treatmentPlan) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in patient and treatment plan before generating prescription.",
        variant: "destructive",
      });
      return;
    }
    
    if (!savedTreatment) {
      toast({
        title: "Save Treatment First",
        description: "Please save the treatment record before generating prescription.",
        variant: "destructive",
      });
      return;
    }
    
    setShowPrescription(true);
  };

  const printPrescription = () => {
    // Create a new window for printing with proper title
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const prescriptionContent = document.getElementById('prescription-print')?.innerHTML;
    const originalTitle = document.title;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${savedTreatment?.treatmentId || 'BGC'}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              body { margin: 0; }
              .prescription-container {
                width: 210mm;
                min-height: 297mm;
                max-height: 297mm;
                padding: 20mm;
                box-sizing: border-box;
                page-break-after: avoid;
                display: flex;
                flex-direction: column;
              }
              .content { flex: 1; }
              .footer { margin-top: auto; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div className="prescription-container">
            ${prescriptionContent}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Add medication to order
  const addMedication = () => {
    if (!selectedDrugId || !newMedDosage || newMedQuantity <= 0) return;
    
    const drug = drugs.find(d => d.id === parseInt(selectedDrugId));
    if (!drug) return;
    
    setMedications(prev => [...prev, {
      drugId: drug.id,
      drugName: drug.name,
      dosage: newMedDosage,
      quantity: newMedQuantity,
      instructions: newMedInstructions,
    }]);
    
    setSelectedDrugId("");
    setSelectedDrugName("");
    setNewMedDosage("");
    setNewMedQuantity(0);
    setNewMedInstructions("");
  };

  // Order mutation for pharmacy
  const orderMedicationMutation = useMutation({
    mutationFn: async () => {
      if (!currentEncounter || medications.length === 0) throw new Error("No medications to order");
      
      const response = await fetch("/api/pharmacy-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient?.patientId,
          encounterId: currentEncounter.encounterId,
          medications: medications.map(m => ({
            drugId: m.drugId,
            dosage: m.dosage,
            quantity: m.quantity,
            instructions: m.instructions,
          })),
        }),
      });
      if (!response.ok) throw new Error("Failed to order medication");
      return response.json();
    },
    onSuccess: () => {
      setMedications([]);
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
      toast({ title: "Medication Ordered", description: "Prescription sent to pharmacy." });
    },
  });

  // Save treatment mutation
  const saveTreatmentMutation = useMutation({
    mutationFn: async (data: InsertTreatment) => {
      const response = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, encounterId: currentEncounter?.encounterId }),
      });
      if (!response.ok) throw new Error("Failed to save treatment");
      return response.json();
    },
    onSuccess: (treatment) => {
      setSavedTreatment(treatment);
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      toast({ title: "Treatment Saved", description: "Treatment record updated successfully." });
    },
  });

  const onSubmit = (data: InsertTreatment) => {
    if (!selectedPatient) return;
    saveTreatmentMutation.mutate({ ...data, patientId: selectedPatient.patientId });
  };

  // Delete order line
  const deleteOrderLineMutation = useMutation({
    mutationFn: async (lineId: number) => {
      const response = await fetch(`/api/order-lines/${lineId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete order line");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      toast({ title: "Item Removed", description: "Order line deleted successfully." });
    },
  });

  // Edit prescription
  const startEditPrescription = (rx: PharmacyOrder) => {
    setEditingPrescription(rx);
    setEditDosage(rx.dosage);
    setEditQuantity(rx.quantity);
    setEditInstructions(rx.instructions);
  };

  const updatePrescriptionMutation = useMutation({
    mutationFn: async () => {
      if (!editingPrescription) return;
      const response = await fetch(`/api/pharmacy-orders/${editingPrescription.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dosage: editDosage,
          quantity: editQuantity,
          instructions: editInstructions,
        }),
      });
      if (!response.ok) throw new Error("Failed to update prescription");
      return response.json();
    },
    onSuccess: () => {
      setEditingPrescription(null);
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
      toast({ title: "Prescription Updated", description: "Changes saved successfully." });
    },
  });

  // Delete prescription
  const deletePrescriptionMutation = useMutation({
    mutationFn: async (rxId: number) => {
      const response = await fetch(`/api/pharmacy-orders/${rxId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete prescription");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
      toast({ title: "Prescription Deleted", description: "Prescription removed successfully." });
    },
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      {filterToday && !selectedPatient ? (
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Treatment Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-lg mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-500" />
              Select Patient for Treatment
            </div>
            <div className="relative mb-4 max-w-md">
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {filteredTreatments.length === 0 ? (
              <p className="text-gray-500">No matching patients found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-left text-sm font-medium">
                      <th className="p-3">Patient</th>
                      <th className="p-3">Age / Sex</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Consultation</th>
                      <th className="p-3">Date of Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTreatments.map((t) => {
                      const patient = activePatients.find((p) => p.patientId === t.patientId);
                      if (!patient) return null;
                      // Assuming Treatment has paymentStatus and amount; adjust if needed
                      const isPaid = t.paymentStatus === "paid"; 
                      const amount = t.amount || 5000; 
                      const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase() : "";
                      return (
                        <tr
                          key={t.treatmentId}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-medium">
                                {patient.firstName[0]}
                                {patient.lastName[0]}
                              </div>
                              <div>
                                {patient.firstName} {patient.lastName}
                                <div className="text-xs text-gray-500">ID: {patient.patientId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {patient.age} / {gender}
                          </td>
                          <td className="p-3">{patient.phoneNumber || "-"}</td>
                          <td className="p-3">
                            <Badge variant={isPaid ? "default" : "destructive"}>
                              {isPaid ? "Paid" : ""} {amount} SSP {isPaid ? "" : "Due"}
                            </Badge>
                          </td>
                          <td className="p-3">{new Date(t.visitDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {!selectedPatient ? (
            <PatientSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              shouldSearch={shouldSearch}
              setShouldSearch={setShouldSearch}
              onSelect={(patient) => {
                setSelectedPatient(patient);
                setShouldSearch(false);
              }}
            />
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Treatment for {selectedPatient.firstName} {selectedPatient.lastName} (ID: {selectedPatient.patientId})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                          <TabsTrigger value="vitals">Vitals</TabsTrigger>
                          <TabsTrigger value="orders">Orders</TabsTrigger>
                          <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="notes" className="space-y-4">
                          <FormField
                            control={form.control}
                            name="chiefComplaint"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chief Complaint</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="examination"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Examination</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="diagnosis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Diagnosis</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="treatmentPlan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Treatment Plan</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>

                        <TabsContent value="vitals" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="temperature"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Temperature (°C)</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.1" {...field} />
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
                                    <Input placeholder="120/80" {...field} />
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
                                    <Input type="number" {...field} />
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
                                    <Input type="number" step="0.1" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="orders">
                          <div className="space-y-6">
                            {/* Billing Orders */}
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Billing Orders
                              </h3>
                              {orderLines.map((line: OrderLine) => (
                                <div key={line.id} className="flex items-center justify-between border-b py-2">
                                  <span>{line.description} - {line.quantity} x {line.unitPriceSnapshot} = {line.totalPrice} SSP</span>
                                  <Button variant="ghost" size="icon" onClick={() => deleteOrderLineMutation.mutate(line.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            {/* Lab Tests */}
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Pill className="h-4 w-4" />
                                Lab Tests
                              </h3>
                              {labTests.map((test: LabTest) => (
                                <div key={test.labRequestId} className="flex items-center justify-between border-b py-2">
                                  <span onClick={() => setViewingLabTest(test)} className="cursor-pointer hover:underline">
                                    {test.tests.join(", ")} - {test.status}
                                  </span>
                                  <Badge variant={test.paymentStatus === "paid" ? "default" : "destructive"}>{test.paymentStatus}</Badge>
                                </div>
                              ))}
                            </div>

                            {/* X-Rays */}
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                X-Rays
                              </h3>
                              {xrays.map((xray: XrayExam) => (
                                <div key={xray.examId} className="flex items-center justify-between border-b py-2">
                                  <span onClick={() => setViewingXray(xray)} className="cursor-pointer hover:underline">
                                    {xray.bodyPart} - {xray.examType} - {xray.status}
                                  </span>
                                  <Badge variant={xray.paymentStatus === "paid" ? "default" : "destructive"}>{xray.paymentStatus}</Badge>
                                </div>
                              ))}
                            </div>

                            {/* Ultrasounds */}
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Ultrasounds
                              </h3>
                              {ultrasounds.map((us: UltrasoundExam) => (
                                <div key={us.examId} className="flex items-center justify-between border-b py-2">
                                  <span onClick={() => setViewingUltrasound(us)} className="cursor-pointer hover:underline">
                                    {us.examType} - {us.status}
                                  </span>
                                  <Badge variant={us.paymentStatus === "paid" ? "default" : "destructive"}>{us.paymentStatus}</Badge>
                                </div>
                              ))}
                            </div>

                            {/* Prescriptions */}
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Pill className="h-4 w-4" />
                                Prescriptions
                              </h3>
                              {prescriptions.map((rx: PharmacyOrder) => (
                                <div key={rx.id} className="flex items-center justify-between border-b py-2">
                                  <span>{rx.drugName} - {rx.dosage} x {rx.quantity}</span>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => startEditPrescription(rx)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deletePrescriptionMutation.mutate(rx.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add Medication */}
                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">Add Medication</h4>
                              <div className="grid grid-cols-4 gap-4">
                                <Select value={selectedDrugId} onValueChange={(v) => {
                                  setSelectedDrugId(v);
                                  const drug = drugs.find(d => d.id === parseInt(v));
                                  setSelectedDrugName(drug?.name || "");
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Drug" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {drugs.map(drug => (
                                      <SelectItem key={drug.id} value={drug.id.toString()}>{drug.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input placeholder="Dosage" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} />
                                <Input type="number" placeholder="Quantity" value={newMedQuantity} onChange={e => setNewMedQuantity(parseInt(e.target.value))} />
                                <Input placeholder="Instructions" value={newMedInstructions} onChange={e => setNewMedInstructions(e.target.value)} />
                              </div>
                              <Button onClick={addMedication} className="mt-2">
                                <Plus className="h-4 w-4 mr-2" /> Add
                              </Button>
                              {medications.length > 0 && (
                                <Button onClick={() => orderMedicationMutation.mutate()} className="mt-2 ml-2">
                                  <ShoppingCart className="h-4 w-4 mr-2" /> Order Medications
                                </Button>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="history">
                          <div className="space-y-4">
                            {recentTreatments.map((rt: Treatment) => (
                              <div key={rt.treatmentId} className="border p-4 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-4 w-4" />
                                  {new Date(rt.visitDate).toLocaleDateString()}
                                </div>
                                <p><strong>Complaint:</strong> {rt.chiefComplaint}</p>
                                <p><strong>Diagnosis:</strong> {rt.diagnosis}</p>
                                <p><strong>Treatment:</strong> {rt.treatmentPlan}</p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="flex justify-between">
                        <Button type="submit" disabled={saveTreatmentMutation.isPending}>
                          <Save className="h-4 w-4 mr-2" /> Save Treatment
                        </Button>
                        <Button onClick={generatePrescription}>
                          <Printer className="h-4 w-4 mr-2" /> Generate Prescription
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Edit Prescription Dialog */}
              {editingPrescription && (
                <Dialog open={!!editingPrescription} onOpenChange={() => setEditingPrescription(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Prescription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input value={editingPrescription.drugName} disabled />
                      <Input placeholder="Dosage" value={editDosage} onChange={e => setEditDosage(e.target.value)} />
                      <Input type="number" placeholder="Quantity" value={editQuantity} onChange={e => setEditQuantity(parseInt(e.target.value))} />
                      <Textarea placeholder="Instructions" value={editInstructions} onChange={e => setEditInstructions(e.target.value)} />
                      <Button onClick={() => updatePrescriptionMutation.mutate()}>Save Changes</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Lab Test Modal */}
              {viewingLabTest && (
                <Dialog open={!!viewingLabTest} onOpenChange={() => setViewingLabTest(null)}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Lab Report - {viewingLabTest.labRequestId}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Report Header */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Requested:</span> {new Date(viewingLabTest.requestedDate).toLocaleDateString()}
                          </div>
                          {viewingLabTest.reportDate && (
                            <div>
                              <span className="font-medium">Report Date:</span> {new Date(viewingLabTest.reportDate).toLocaleDateString()}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Payment:</span> <Badge variant={viewingLabTest.paymentStatus === 'paid' ? 'default' : 'destructive'}>{viewingLabTest.paymentStatus}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span> {viewingLabTest.priority || 'routine'}
                          </div>
                        </div>
                      </div>

                      {/* Tests Performed */}
                      <div>
                        <h4 className="font-semibold mb-2">Tests Performed:</h4>
                        <div className="flex flex-wrap gap-2">
                          {parseJSON<string[]>(viewingLabTest.tests, []).map((test, i) => (
                            <span key={i} className="inline-block bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-xs font-medium">
                              {test}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Clinical Information */}
                      {viewingLabTest.clinicalInfo && (
                        <div>
                          <h4 className="font-semibold mb-2">Clinical Information:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border">{viewingLabTest.clinicalInfo}</p>
                        </div>
                      )}

                      {/* Clinical Interpretation */}
                      {(() => {
                        const results = parseJSON<Record<string, Record<string, string>>>(viewingLabTest.results, {});
                        const criticalFindings: string[] = [];
                        const warnings: string[] = [];

                        // Analyze results for critical findings
                        Object.entries(results).forEach(([testName, testData]) => {
                          const fields = resultFields[testName];
                          if (!fields) return;

                          Object.entries(testData).forEach(([fieldName, value]) => {
                            const config = fields[fieldName];
                            if (!config || !value) return;

                            const numValue = parseFloat(value);
                            
                            // Check for critical values based on test type
                            if (testName === "Complete Blood Count (CBC)") {
                              if (fieldName === "Hemoglobin" && numValue < 7) {
                                criticalFindings.push(`🔴 SEVERE anemia (Hb: ${value} g/dL) - Requires urgent blood transfusion consideration`);
                              } else if (fieldName === "Hemoglobin" && numValue < 10) {
                                warnings.push(`⚠️ Moderate anemia (Hb: ${value} g/dL) - Iron supplementation recommended`);
                              }
                              if (fieldName === "WBC" && numValue > 15) {
                                warnings.push(`⚠️ Elevated WBC (${value} x10³/µL) - Possible infection or inflammation`);
                              }
                              if (fieldName === "Platelets" && numValue < 50) {
                                criticalFindings.push(`🔴 CRITICAL thrombocytopenia (Platelets: ${value} x10³/µL) - Bleeding risk, avoid IM injections`);
                              }
                            }

                            if (testName === "Blood Film for Malaria (BFFM)") {
                              if (fieldName === "Malaria Parasites" && value !== "Not seen" && value !== "None") {
                                criticalFindings.push(`🔴 POSITIVE for ${value} malaria - Requires immediate treatment`);
                              }
                            }

                            if (testName === "Liver Function Test (LFT)") {
                              if (fieldName === "Total Bilirubin" && numValue > 3) {
                                warnings.push(`⚠️ Severe jaundice (Bilirubin: ${value} mg/dL) - Hepatic or hemolytic condition`);
                              }
                              if (fieldName === "ALT (SGPT)" && numValue > 200) {
                                warnings.push(`⚠️ Significant liver enzyme elevation (ALT: ${value} U/L) - Hepatocellular injury`);
                              }
                            }

                            if (testName === "Renal Function Test (RFT)") {
                              if (fieldName === "Creatinine" && numValue > 2) {
                                criticalFindings.push(`🔴 Elevated creatinine (${value} mg/dL) - Possible renal impairment`);
                              }
                              if (fieldName === "Potassium" && (numValue > 6 || numValue < 2.5)) {
                                criticalFindings.push(`🔴 CRITICAL potassium level (${value} mmol/L) - Cardiac arrhythmia risk`);
                              }
                            }
                          });
                        });

                        return (criticalFindings.length > 0 || warnings.length > 0) ? (
                          <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                            <h2 className="text-lg font-bold mb-2 text-yellow-900 dark:text-yellow-100 flex items-center">
                              <span className="text-2xl mr-2">ℹ️</span> Clinical Interpretation
                            </h2>
                            {criticalFindings.length > 0 && (
                              <div className="mb-3">
                                <p className="font-semibold text-red-800 dark:text-red-300 mb-2">Critical Findings Requiring Attention:</p>
                                <div className="space-y-1">
                                  {criticalFindings.map((finding, i) => (
                                    <div key={i} className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 p-2 text-sm text-red-900 dark:text-red-100">
                                      {finding}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {warnings.length > 0 && (
                              <div className="space-y-1">
                                {warnings.map((warning, i) => (
                                  <div key={i} className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-600 p-2 text-sm text-yellow-900 dark:text-yellow-100">
                                    {warning}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* Laboratory Results */}
                      {viewingLabTest.results && (
                        <div>
                          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Laboratory Results</h2>
                          {(() => {
                            const results = parseJSON<Record<string, Record<string, string>>>(viewingLabTest.results, {});
                            return Object.entries(results).map(([testName, testData]) => {
                              const fields = resultFields[testName];
                              return (
                                <div key={testName} className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                                  <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3">{testName}</h3>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    {Object.entries(testData).map(([fieldName, value]) => {
                                      const config = fields?.[fieldName];
                                      const isNormal = config?.normal === value;
                                      const isAbnormal = config?.normal && config.normal !== value;
                                      
                                      return (
                                        <div key={fieldName} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-1">
                                          <span className="font-medium text-gray-700 dark:text-gray-300">{fieldName}:</span>
                                          <span className={cx(
                                            "font-semibold",
                                            isNormal && "text-green-600 dark:text-green-400",
                                            isAbnormal && value && value !== "Not seen" && value !== "Negative" && "text-red-600 dark:text-red-400"
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
                      )}

                      {/* Technician Notes */}
                      {viewingLabTest.technicianNotes && (
                        <div>
                          <p className="font-semibold">Technician Notes:</p>
                          <p className="text-gray-700 dark:text-gray-300">{viewingLabTest.technicianNotes}</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* X-Ray Report Modal */}
              {viewingXray && (
                <Dialog open={!!viewingXray} onOpenChange={() => setViewingXray(null)}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        X-Ray Report - {viewingXray.examId}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Report Header */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Body Part:</span> {viewingXray.bodyPart}
                          </div>
                          <div>
                            <span className="font-medium">Exam Type:</span> {viewingXray.examType}
                          </div>
                          <div>
                            <span className="font-medium">Requested:</span> {new Date(viewingXray.requestDate || viewingXray.requestedDate).toLocaleDateString()}
                          </div>
                          {viewingXray.reportDate && (
                            <div>
                              <span className="font-medium">Report Date:</span> {new Date(viewingXray.reportDate).toLocaleDateString()}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Payment:</span> <Badge variant={viewingXray.paymentStatus === 'paid' ? 'default' : 'destructive'}>{viewingXray.paymentStatus}</Badge>
                          </div>
                          {viewingXray.radiologist && (
                            <div>
                              <span className="font-medium">Radiologist:</span> {viewingXray.radiologist}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clinical Indication */}
                      {viewingXray.clinicalIndication && (
                        <div>
                          <h4 className="font-semibold mb-2">Clinical Indication:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border">{viewingXray.clinicalIndication}</p>
                        </div>
                      )}

                      {/* Special Instructions */}
                      {viewingXray.specialInstructions && (
                        <div>
                          <h4 className="font-semibold mb-2">Special Instructions:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border">{viewingXray.specialInstructions}</p>
                        </div>
                      )}

                      {/* Findings */}
                      {viewingXray.findings && (
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">Findings:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border whitespace-pre-line">{viewingXray.findings}</p>
                        </div>
                      )}

                      {/* Impression */}
                      {viewingXray.impression && (
                        <div>
                          <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">Impression:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border whitespace-pre-line font-medium">{viewingXray.impression}</p>
                        </div>
                      )}

                      {/* Recommendations */}
                      {viewingXray.recommendations && (
                        <div>
                          <h4 className="font-semibold mb-2">Recommendations:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border whitespace-pre-line">{viewingXray.recommendations}</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Ultrasound Report Modal */}
              {viewingUltrasound && (
                <Dialog open={!!viewingUltrasound} onOpenChange={() => setViewingUltrasound(null)}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Ultrasound Report - {viewingUltrasound.examId}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Report Header */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Exam Type:</span> {viewingUltrasound.examType}
                          </div>
                          <div>
                            <span className="font-medium">Requested:</span> {new Date(viewingUltrasound.requestDate || viewingUltrasound.requestedDate).toLocaleDateString()}
                          </div>
                          {viewingUltrasound.reportDate && (
                            <div>
                              <span className="font-medium">Report Date:</span> {new Date(viewingUltrasound.reportDate).toLocaleDateString()}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Payment:</span> <Badge variant={viewingUltrasound.paymentStatus === 'paid' ? 'default' : 'destructive'}>{viewingUltrasound.paymentStatus}</Badge>
                          </div>
                          {viewingUltrasound.reportStatus && (
                            <div>
                              <span className="font-medium">Report Status:</span> <Badge variant={viewingUltrasound.reportStatus === 'normal' ? 'default' : 'destructive'}>{viewingUltrasound.reportStatus}</Badge>
                            </div>
                          )}
                          {viewingUltrasound.sonographer && (
                            <div>
                              <span className="font-medium">Sonographer:</span> {viewingUltrasound.sonographer}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clinical Indication */}
                      {viewingUltrasound.clinicalIndication && (
                        <div>
                          <h4 className="font-semibold mb-2">Clinical Indication:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border">{viewingUltrasound.clinicalIndication}</p>
                        </div>
                      )}

                      {/* Special Instructions */}
                      {viewingUltrasound.specialInstructions && (
                        <div>
                          <h4 className="font-semibold mb-2">Special Instructions:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border">{viewingUltrasound.specialInstructions}</p>
                        </div>
                      )}

                      {/* Findings */}
                      {viewingUltrasound.findings && (
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">Findings:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border whitespace-pre-line">{viewingUltrasound.findings}</p>
                        </div>
                      )}

                      {/* Impression */}
                      {viewingUltrasound.impression && (
                        <div>
                          <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">Impression:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border whitespace-pre-line font-medium">{viewingUltrasound.impression}</p>
                        </div>
                      )}

                      {/* Recommendations */}
                      {viewingUltrasound.recommendations && (
                        <div>
                          <h4 className="font-semibold mb-2">Recommendations:</h4>
                          <p className="bg-white dark:bg-gray-900 p-3 rounded border whitespace-pre-line">{viewingUltrasound.recommendations}</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Prescription Modal */}
              {showPrescription && selectedPatient && (
                <div>
                  <Card className="border-2 border-medical-green">
                    <CardContent className="p-6">
                      <div
                        id="prescription-print"
                        className="flex flex-col min-h-[100vh] print:min-h-[100vh] print:w-[210mm] print:h-[297mm] p-8"
                      >
                        {/* Header */}
                        <div className="text-center border-b pb-4 mb-6">
                          <h1 className="text-2xl font-bold text-medical-blue">
                            BAHR EL GHAZAL CLINIC
                          </h1>
                          <p className="text-sm text-gray-600">
                            Your Health, Our Priority
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com
                          </p>
                          <p className="text-lg font-semibold text-medical-green mt-2">
                            PRESCRIPTION
                          </p>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                          {/* Patient Information */}
                          <div className="grid grid-cols-2 gap-4 pb-4 border-b mb-6">
                            <div>
                              <p><strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                              <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
                              <p><strong>Age:</strong> {selectedPatient.age || 'Not specified'}</p>
                            </div>
                            <div>
                              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                              <p><strong>Treatment ID:</strong> {savedTreatment?.treatmentId || 'Not available'}</p>
                              <p><strong>Phone:</strong> {selectedPatient.phoneNumber || 'Not provided'}</p>
                            </div>
                          </div>

                          {/* Clinical Information */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-medical-blue mb-2">Rx (Treatment Plan):</h4>
                              <div className="pl-4 whitespace-pre-line bg-gray-50 print:bg-white p-3 rounded border">
                                {form.getValues("treatmentPlan")}
                              </div>
                            </div>

                            {form.getValues("followUpDate") && (
                              <div>
                                <h4 className="font-semibold text-medical-blue mb-2">Follow-up:</h4>
                                <p className="pl-4">Next visit: {form.getValues("followUpDate")} 
                                  {form.getValues("followUpType") && ` (${form.getValues("followUpType")})`}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-8 border-t">
                          <p className="mt-6">Doctor's Signature: ____________________</p>
                          <p className="text-xs text-gray-500 mt-4 text-center">Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 print:hidden">
                        <Button 
                          onClick={printPrescription}
                          className="bg-medical-blue hover:bg-blue-700"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print Prescription
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowPrescription(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
