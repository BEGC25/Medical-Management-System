import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, Link } from "wouter";
import { Save, FileText, Printer, Filter, Calendar, ShoppingCart, Plus, DollarSign, Pill, Activity, Trash2, Edit } from "lucide-react";
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
  const { visitId } = useParams<{ visitId?: string }>();
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

  // Load patient for the loaded visit
  const { data: loadedPatient } = useQuery({
    queryKey: ["/api/patients", loadedVisit?.encounter?.patientId],
    queryFn: async () => {
      if (!loadedVisit?.encounter) return null;
      const response = await fetch(`/api/patients?id=${loadedVisit.encounter.patientId}`);
      if (!response.ok) return null;
      const patients = await response.json();
      return patients[0] || null;
    },
    enabled: !!loadedVisit?.encounter,
  });

  // Get today's encounter for selected patient (legacy flow)
  const { data: todayEncounter } = useQuery({
    queryKey: ["/api/encounters", { patientId: selectedPatient?.patientId, date: new Date().toISOString().split('T')[0] }],
    queryFn: async () => {
      if (!selectedPatient) return null;
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/encounters?date=${today}`);
      if (!response.ok) return null;
      const encounters = await response.json();
      return encounters.find((e: Encounter) => e.patientId === selectedPatient.patientId) || null;
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
            body {
              font-family: 'Roboto', sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .text-center { text-align: center; }
            .text-medical-blue { color: #1e40af; }
            .text-medical-green { color: #16a34a; }
            .text-gray-600 { color: #6b7280; }
            .text-gray-500 { color: #9ca3af; }
            .text-2xl { font-size: 1.5rem; font-weight: bold; }
            .text-lg { font-size: 1.125rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .pb-4 { padding-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            .pt-8 { padding-top: 2rem; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .pl-4 { padding-left: 1rem; }
            .p-3 { padding: 0.75rem; }
            .whitespace-pre-line { white-space: pre-line; }
            .rounded { border-radius: 0.25rem; }
            .border { border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="prescription-container">
            ${prescriptionContent}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const createTreatmentMutation = useMutation({
    mutationFn: async (data: InsertTreatment): Promise<Treatment> => {
      const response = await apiRequest("POST", "/api/treatments", data);
      return response.json();
    },
    onSuccess: (treatment: Treatment) => {
      setSavedTreatment(treatment);
      toast({
        title: "Success",
        description: `Treatment record saved successfully (ID: ${treatment.treatmentId})`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'treatment',
          action: 'create',
          data: form.getValues(),
        });
        toast({
          title: "Saved Offline",
          description: "Treatment record saved locally. Will sync when online.",
        });
        setSavedTreatment(null);
        form.reset();
        setSelectedPatient(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to save treatment record",
          variant: "destructive",
        });
      }
    },
  });

  // Acknowledgment mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ orderLineId, acknowledgedBy, acknowledged }: { orderLineId: number; acknowledgedBy: string; acknowledged: boolean }) => {
      const response = await apiRequest("PUT", `/api/order-lines/${orderLineId}/acknowledge`, {
        acknowledgedBy,
        acknowledged,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", currentEncounter?.encounterId, "orders"] });
      toast({
        title: "Success",
        description: "Result acknowledgment updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update acknowledgment",
        variant: "destructive",
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ orderLineId, addToCart }: { orderLineId: number; addToCart: boolean }) => {
      const response = await apiRequest("PUT", `/api/order-lines/${orderLineId}/add-to-cart`, {
        addToCart,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", currentEncounter?.encounterId, "orders"] });
      toast({
        title: "Success",
        description: "Added to visit cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      });
    },
  });

  // Submit pharmacy orders mutation
  const submitMedicationsMutation = useMutation({
    mutationFn: async (meds: typeof medications) => {
      if (!selectedPatient || !currentEncounter) throw new Error("No patient or encounter");
      
      const pharmacyService = services.find(s => s.category === "pharmacy");
      if (!pharmacyService) throw new Error("Pharmacy service not found");
      
      // Create pharmacy orders for each medication
      const promises = meds.map(med => 
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
      toast({
        title: "Medications Ordered",
        description: `${medications.length} medication(s) sent to pharmacy`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit medications",
        variant: "destructive",
      });
    },
  });

  // Cancel pharmacy order mutation
  const cancelPrescriptionMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/pharmacy-orders/${orderId}`, {
        status: "cancelled",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
      toast({
        title: "Success",
        description: "Prescription cancelled",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel prescription",
        variant: "destructive",
      });
    },
  });

  // Edit pharmacy order mutation
  const editPrescriptionMutation = useMutation({
    mutationFn: async (data: { orderId: string; dosage: string; quantity: number; instructions: string }) => {
      const response = await apiRequest("PATCH", `/api/pharmacy-orders/${data.orderId}`, {
        dosage: data.dosage,
        quantity: data.quantity,
        instructions: data.instructions,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
      setEditingPrescription(null);
      toast({
        title: "Success",
        description: "Prescription updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prescription",
        variant: "destructive",
      });
    },
  });

  // Close visit mutation
  const closeVisitMutation = useMutation({
    mutationFn: async (encounterId: string) => {
      const response = await apiRequest("POST", `/api/encounters/${encounterId}/close`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      toast({
        title: "Success",
        description: "Visit closed successfully",
      });
      setSelectedPatient(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to close visit",
        variant: "destructive",
      });
    },
  });

  // Close visit validation and handler
  const handleCloseVisit = () => {
    if (!currentEncounter) return;
    
    // Validate diagnosis exists - check both persisted treatment and current form
    const persistedDiagnosis = existingTreatment?.diagnosis;
    const currentDiagnosis = form.watch("diagnosis");
    const hasDiagnosis = (persistedDiagnosis && persistedDiagnosis.trim() !== "") || 
                         (currentDiagnosis && currentDiagnosis.trim() !== "");
    
    if (!hasDiagnosis) {
      toast({
        title: "Validation Error",
        description: "Please enter and save a diagnosis before closing the visit",
        variant: "destructive",
      });
      return;
    }
    
    // Check if all completed diagnostics are acknowledged
    const completedDiagnostics = [
      ...labTests.filter((t: any) => t.status === 'completed' && t.orderLine),
      ...xrays.filter((x: any) => x.status === 'completed' && x.orderLine),
      ...ultrasounds.filter((u: any) => u.status === 'completed' && u.orderLine),
    ];
    
    const unacknowledged = completedDiagnostics.filter((d: any) => !d.orderLine.acknowledgedBy);
    
    if (unacknowledged.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please acknowledge all ${unacknowledged.length} completed diagnostic result(s) before closing the visit`,
        variant: "destructive",
      });
      return;
    }
    
    // All validations passed, close the visit
    closeVisitMutation.mutate(currentEncounter.encounterId);
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }
    
    createTreatmentMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
    });
  });

  const handlePatientSelect = (patient: Patient) => {
    // Navigate to visit redirector which will find or create today's visit
    window.location.href = `/treatment/new?patientId=${patient.patientId}`;
  };

  const handleNewTreatment = () => {
    form.reset();
    setSelectedPatient(null);
    setSavedTreatment(null);
    setShowPrescription(false);
  };

  const getAge = (age: string) => {
    return age || 'Unknown';
  };

  // Get patient name from patient ID
  const getPatientName = (patientId: string): string => {
    const patient = allPatients.find(p => p.patientId === patientId);
    if (!patient) return patientId;
    return `${patient.firstName} ${patient.lastName}`;
  };

  // Navigate to patient details page
  const navigateToPatient = (patientId: string) => {
    window.location.href = `/patients?patientId=${patientId}`;
  };

  return (
    <div className="space-y-6">
      {/* Today's Treatments List (when filtering) */}
      {filterToday && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Today's Treatment Visits</span>
                <Badge className="bg-blue-600 text-white">
                  <Filter className="w-3 h-3 mr-1" />
                  Today Only
                </Badge>
              </div>
              <Button 
                variant="outline"
                onClick={() => setFilterToday(false)}
              >
                Back to New Treatment
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysTreatments && todaysTreatments.length > 0 ? (
                todaysTreatments.map((treatment: any) => (
                  <div 
                    key={treatment.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md hover:border-medical-blue/50"
                    data-testid={`treatment-card-${treatment.treatmentId}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Patient:</span>
                          <button
                            onClick={() => navigateToPatient(treatment.patientId)}
                            className="font-semibold text-medical-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                            data-testid={`patient-name-${treatment.patientId}`}
                          >
                            {getPatientName(treatment.patientId)}
                          </button>
                          <span className="text-sm text-gray-500">({treatment.patientId})</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Visit ID:</span> {treatment.treatmentId}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Type:</span> <Badge variant="outline" className="ml-1">{treatment.visitType}</Badge>
                            <span className="ml-3 font-medium">Priority:</span> <Badge variant="outline" className="ml-1">{treatment.priority}</Badge>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Chief Complaint:</span> {treatment.chiefComplaint}
                          </p>
                          {treatment.diagnosis && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Diagnosis:</span> {treatment.diagnosis}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white shrink-0">
                        <Calendar className="w-3 h-3 mr-1" />
                        {treatment.visitDate}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No treatment visits recorded today
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment Entry Form */}
      {!filterToday && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Treatment Records</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Patient Selection */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Select Patient</h3>
            
            {!selectedPatient ? (
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
            ) : (
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                      {savedTreatment && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          Saved: {savedTreatment.treatmentId}
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {selectedPatient.patientId} | 
                      Age: {getAge(selectedPatient.age || '')} | 
                      {selectedPatient.gender && ` ${selectedPatient.gender}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Contact: {selectedPatient.phoneNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-health-green text-white">Selected</Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => setSelectedPatient(null)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Orders & Results Panel */}
          {selectedPatient && currentEncounter && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Orders & Results
                  </CardTitle>
                  {orders.some(o => o.status === 'completed' && !o.addToCart && o.isPaid) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const completedOrders = orders.filter(o => o.status === 'completed' && !o.addToCart && o.isPaid);
                        Promise.all(
                          completedOrders.map(order =>
                            addToCartMutation.mutate({ orderLineId: order.orderId, addToCart: true })
                          )
                        );
                      }}
                      data-testid="add-all-to-cart-btn"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add All Completed
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Lab Tests */}
                  {labTests.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Laboratory Tests</h4>
                      <div className="space-y-2">
                        {labTests.map((test: any) => {
                          const testNames = Array.isArray(test.tests) 
                            ? test.tests 
                            : (typeof test.tests === 'string' ? JSON.parse(test.tests) : []);
                          
                          return (
                          <div key={test.testId || test.orderId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                                    {test.status}
                                  </Badge>
                                  {!test.isPaid && (
                                    <Badge variant="destructive" className="bg-red-600">UNPAID</Badge>
                                  )}
                                </div>
                                <p className="font-semibold text-base capitalize mb-1">{test.category}</p>
                                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                  {testNames.map((testName: string, idx: number) => (
                                    <div key={idx}>• {testName}</div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Requested: {new Date(test.requestedDate).toLocaleDateString()}
                                </p>
                                {test.orderLine?.acknowledgedBy && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    ✓ Acknowledged by {test.orderLine.acknowledgedBy}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {test.status === 'completed' && test.orderLine && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`ack-lab-${test.id}`}
                                        checked={!!test.orderLine.acknowledgedBy}
                                        onCheckedChange={(checked) => {
                                          acknowledgeMutation.mutate({
                                            orderLineId: test.orderLine.id,
                                            acknowledgedBy: "Dr. System", // In real app, use actual user
                                            acknowledged: checked as boolean,
                                          });
                                        }}
                                        data-testid={`ack-lab-${test.id}`}
                                      />
                                      <label htmlFor={`ack-lab-${test.id}`} className="text-sm cursor-pointer">
                                        Acknowledge
                                      </label>
                                    </div>
                                    {test.orderLine.acknowledgedBy && !test.orderLine.addToCart && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => addToCartMutation.mutate({
                                          orderLineId: test.orderLine.id,
                                          addToCart: true,
                                        })}
                                        data-testid={`add-cart-lab-${test.id}`}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add to Summary
                                      </Button>
                                    )}
                                    {test.orderLine.addToCart === 1 && (
                                      <Badge variant="outline" className="bg-green-50">Added</Badge>
                                    )}
                                  </>
                                )}
                                {test.status === 'completed' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setViewingLabTest(test)}
                                    data-testid={`view-lab-${test.id}`}
                                  >
                                    View Results
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* X-Rays */}
                  {xrays.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">X-Ray Examinations</h4>
                      <div className="space-y-2">
                        {xrays.map((xray: any) => (
                          <div key={xray.examId || xray.orderId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1">
                                <p className="font-medium">{xray.bodyPart}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(xray.requestDate).toLocaleDateString()}
                                </p>
                                <Badge variant={xray.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                                  {xray.status}
                                </Badge>
                                {xray.orderLine?.acknowledgedBy && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    ✓ Acknowledged by {xray.orderLine.acknowledgedBy}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {xray.status === 'completed' && xray.orderLine && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`ack-xray-${xray.id}`}
                                        checked={!!xray.orderLine.acknowledgedBy}
                                        onCheckedChange={(checked) => {
                                          acknowledgeMutation.mutate({
                                            orderLineId: xray.orderLine.id,
                                            acknowledgedBy: "Dr. System",
                                            acknowledged: checked as boolean,
                                          });
                                        }}
                                        data-testid={`ack-xray-${xray.id}`}
                                      />
                                      <label htmlFor={`ack-xray-${xray.id}`} className="text-sm cursor-pointer">
                                        Acknowledge
                                      </label>
                                    </div>
                                    {xray.orderLine.acknowledgedBy && !xray.orderLine.addToCart && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => addToCartMutation.mutate({
                                          orderLineId: xray.orderLine.id,
                                          addToCart: true,
                                        })}
                                        data-testid={`add-cart-xray-${xray.id}`}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add to Summary
                                      </Button>
                                    )}
                                    {xray.orderLine.addToCart === 1 && (
                                      <Badge variant="outline" className="bg-green-50">Added</Badge>
                                    )}
                                  </>
                                )}
                                {xray.status === 'completed' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setViewingXray(xray)}
                                    data-testid={`view-xray-${xray.id}`}
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

                  {/* Ultrasounds */}
                  {ultrasounds.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Ultrasound Examinations</h4>
                      <div className="space-y-2">
                        {ultrasounds.map((ultrasound: any) => (
                          <div key={ultrasound.examId || ultrasound.orderId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1">
                                <p className="font-medium">{ultrasound.examType}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(ultrasound.requestDate).toLocaleDateString()}
                                </p>
                                <Badge variant={ultrasound.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                                  {ultrasound.status}
                                </Badge>
                                {ultrasound.orderLine?.acknowledgedBy && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    ✓ Acknowledged by {ultrasound.orderLine.acknowledgedBy}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {ultrasound.status === 'completed' && ultrasound.orderLine && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`ack-ultrasound-${ultrasound.id}`}
                                        checked={!!ultrasound.orderLine.acknowledgedBy}
                                        onCheckedChange={(checked) => {
                                          acknowledgeMutation.mutate({
                                            orderLineId: ultrasound.orderLine.id,
                                            acknowledgedBy: "Dr. System",
                                            acknowledged: checked as boolean,
                                          });
                                        }}
                                        data-testid={`ack-ultrasound-${ultrasound.id}`}
                                      />
                                      <label htmlFor={`ack-ultrasound-${ultrasound.id}`} className="text-sm cursor-pointer">
                                        Acknowledge
                                      </label>
                                    </div>
                                    {ultrasound.orderLine.acknowledgedBy && !ultrasound.orderLine.addToCart && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => addToCartMutation.mutate({
                                          orderLineId: ultrasound.orderLine.id,
                                          addToCart: true,
                                        })}
                                        data-testid={`add-cart-ultrasound-${ultrasound.id}`}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add to Summary
                                      </Button>
                                    )}
                                    {ultrasound.orderLine.addToCart === 1 && (
                                      <Badge variant="outline" className="bg-green-50">Added</Badge>
                                    )}
                                  </>
                                )}
                                {ultrasound.status === 'completed' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setViewingUltrasound(ultrasound)}
                                    data-testid={`view-ultrasound-${ultrasound.id}`}
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

                  {/* Empty state */}
                  {labTests.length === 0 && xrays.length === 0 && ultrasounds.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No orders or results yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visit Summary - Today's Services & Billing */}
          {selectedPatient && currentEncounter && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Visit Summary - Today's Services
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {orders.filter(o => o.addToCart).length} items
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVisitSummary(!showVisitSummary)}
                    >
                      {showVisitSummary ? "Hide" : "Show"} Details
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {showVisitSummary && (
                <CardContent>
                  <div className="space-y-3">
                    {orders.filter(o => o.addToCart).length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No services in today's visit yet</p>
                        <p className="text-xs mt-1">Acknowledge completed tests to add them here</p>
                      </div>
                    ) : (
                      <>
                        {orders.filter(o => o.addToCart).map((order: any) => (
                          <div key={order.orderId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium">{order.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.type.toUpperCase()} - {order.status}
                              </p>
                              {order.flags && (
                                <Badge variant={order.flags === 'critical' ? 'destructive' : 'outline'} className="mt-1">
                                  {order.flags}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  addToCartMutation.mutate({ orderLineId: order.orderId, addToCart: false });
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-3 flex justify-between items-center">
                          <span className="font-medium">Services Today:</span>
                          <span className="font-bold text-lg text-green-600 dark:text-green-400">
                            {orders.filter(o => o.addToCart).length} service(s)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
          </CardContent>

          {/* Treatment Form */}
          {selectedPatient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Clinical Documentation & Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="notes" data-testid="tab-notes">
                      <FileText className="h-4 w-4 mr-2" />
                      Visit Notes
                    </TabsTrigger>
                    <TabsTrigger value="tests" data-testid="tab-tests">
                      Lab Tests
                    </TabsTrigger>
                    <TabsTrigger value="imaging" data-testid="tab-imaging">
                      Imaging
                    </TabsTrigger>
                    <TabsTrigger value="medications" data-testid="tab-medications">
                      <Pill className="h-4 w-4 mr-2" />
                      Medications
                      {medications.length > 0 && (
                        <Badge className="ml-2 bg-green-600">{medications.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <Form {...form}>
                    <form onSubmit={handleSubmit} className="mt-6">
                      <TabsContent value="notes" className="space-y-6">
                        {/* Visit Information */}
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

                {/* Chief Complaint */}
                <FormField
                  control={form.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint</FormLabel>
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

                {/* Vital Signs */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Vital Signs
                  </h3>
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
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
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
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Examination Findings */}
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

                {/* Diagnosis */}
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
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

                {/* Treatment Plan */}
                <FormField
                  control={form.control}
                  name="treatmentPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Plan</FormLabel>
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

                {/* Follow-up */}
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
                      </TabsContent>

                      {/* Lab Tests Tab */}
                      <TabsContent value="tests" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-medium text-gray-800 dark:text-gray-200">Order Laboratory Tests</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quick lab test ordering for current patient
                          </p>
                          
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              For detailed lab test ordering with full test catalog, visit the <a href="/laboratory" className="text-blue-600 hover:underline">Laboratory</a> page.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              Use this quick form for common tests or the Laboratory page for comprehensive test selection.
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Imaging Tab */}
                      <TabsContent value="imaging" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-medium text-gray-800 dark:text-gray-200">Order Imaging Studies</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quick imaging study ordering for current patient
                          </p>
                          
                          <div className="grid gap-4 md:grid-cols-2">
                            <Link href="/xray">
                              <div className="block p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">X-Ray Examinations</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                  Order X-ray studies including chest, abdomen, spine, extremities, and more
                                </p>
                                <div className="w-full px-4 py-2 border border-blue-300 dark:border-blue-700 rounded text-sm text-center bg-white dark:bg-gray-900">
                                  Go to X-Ray Module →
                                </div>
                              </div>
                            </Link>
                            
                            <Link href="/ultrasound">
                              <div className="block p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                                <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Ultrasound Examinations</h4>
                                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                                  Order ultrasound studies including obstetric, abdominal, vascular, and cardiac echo
                                </p>
                                <div className="w-full px-4 py-2 border border-purple-300 dark:border-purple-700 rounded text-sm text-center bg-white dark:bg-gray-900">
                                  Go to Ultrasound Module →
                                </div>
                              </div>
                            </Link>
                          </div>
                          
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              Note: For detailed imaging requests with safety checklists and specialized protocols, please use the dedicated X-Ray and Ultrasound modules.
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Medications Tab */}
                      <TabsContent value="medications" className="space-y-6">
                        <div className="space-y-4">
                          {/* Prescribed Medications Section */}
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
                                            {rx.drugName || 'Medication'}
                                          </p>
                                          <Badge 
                                            variant={rx.status === 'dispensed' ? 'default' : 'secondary'}
                                            className={rx.status === 'dispensed' ? 'bg-green-600' : ''}
                                          >
                                            {rx.status}
                                          </Badge>
                                          <Badge 
                                            variant={rx.paymentStatus === 'paid' ? 'default' : 'destructive'}
                                            className={rx.paymentStatus === 'paid' ? 'bg-blue-600' : 'bg-red-600'}
                                          >
                                            {rx.paymentStatus}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Dosage: {rx.dosage || 'As prescribed'} | Quantity: {rx.quantity}
                                        </p>
                                        {rx.instructions && (
                                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                            Instructions: {rx.instructions}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                          Order ID: {rx.orderId} | Prescribed: {new Date(rx.createdAt).toLocaleString()}
                                        </p>
                                        {rx.dispensedAt && (
                                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            Dispensed: {new Date(rx.dispensedAt).toLocaleString()} by {rx.dispensedBy}
                                          </p>
                                        )}
                                      </div>
                                      {rx.status === 'prescribed' && rx.paymentStatus === 'unpaid' && (
                                        <div className="flex gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingPrescription(rx);
                                              setEditDosage(rx.dosage || '');
                                              setEditQuantity(rx.quantity || 0);
                                              setEditInstructions(rx.instructions || '');
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
                                              if (window.confirm('Cancel this prescription?')) {
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
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">Order New Medications</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Select drugs from inventory to create pharmacy orders
                            </p>
                          </div>

                          {/* Medication Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Select Drug</label>
                              <Select 
                                value={selectedDrugId} 
                                onValueChange={(value) => {
                                  setSelectedDrugId(value);
                                  const drug = drugs.find(d => d.id.toString() === value);
                                  if (drug) setSelectedDrugName(drug.genericName || drug.name);
                                }}
                              >
                                <SelectTrigger data-testid="select-drug">
                                  <SelectValue placeholder="Choose a medication..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {drugs.map(drug => (
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

                              setMedications([...medications, {
                                drugId: parseInt(selectedDrugId),
                                drugName: selectedDrugName,
                                dosage: newMedDosage,
                                quantity: newMedQuantity,
                                instructions: newMedInstructions,
                              }]);

                              // Reset form
                              setSelectedDrugId("");
                              setSelectedDrugName("");
                              setNewMedDosage("");
                              setNewMedQuantity(0);
                              setNewMedInstructions("");

                              toast({
                                title: "Added",
                                description: "Medication added to order list",
                              });
                            }}
                            data-testid="btn-add-medication"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Order List
                          </Button>

                          {/* Medications List */}
                          {medications.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Medications to Order ({medications.length})</h4>
                              <div className="space-y-2">
                                {medications.map((med, idx) => (
                                  <div key={idx} className="flex items-start justify-between p-3 bg-white dark:bg-gray-900 border rounded-lg">
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
                                      onClick={() => {
                                        setMedications(medications.filter((_, i) => i !== idx));
                                      }}
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
                                {submitMedicationsMutation.isPending ? "Submitting..." : `Send ${medications.length} Order(s) to Pharmacy`}
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Form Actions - Outside tabs but inside form */}
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
                  {currentEncounter && currentEncounter.status === 'open' && (
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
                </Tabs>
              </CardContent>
            </Card>
          )}
        </Card>
      )}

      {/* Edit Prescription Dialog */}
      <Dialog open={!!editingPrescription} onOpenChange={(open) => !open && setEditingPrescription(null)}>
        <DialogContent className="max-w-lg" data-testid="dialog-edit-prescription">
          <DialogHeader>
            <DialogTitle>Edit Prescription</DialogTitle>
          </DialogHeader>
          
          {editingPrescription && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">
                  {editingPrescription.drugName}
                </p>
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

      {/* Lab Results Modal */}
      {viewingLabTest && (
        <Dialog open={!!viewingLabTest} onOpenChange={() => setViewingLabTest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lab Test Results - {viewingLabTest.testId}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Header Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Requested:</span> {new Date(viewingLabTest.requestedDate).toLocaleDateString()}
                  </div>
                  {viewingLabTest.completedDate && (
                    <div>
                      <span className="font-medium">Completed:</span> {new Date(viewingLabTest.completedDate).toLocaleDateString()}
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
  );
}
