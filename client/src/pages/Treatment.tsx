import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, Link, useLocation } from "wouter";
import { Save, FileText, Printer, Filter, Calendar, ShoppingCart, Plus, DollarSign, Pill, Activity, Trash2, Edit, X, AlertTriangle, Heart, History, Clock, Search } from "lucide-react"; // Added Search icon
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
import PatientSearch from "@/components/PatientSearch"; // Still used for starting NEW visits for unlisted patients
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

// Result fields configuration (remains the same)
const resultFields: Record<string, Record<string, { /* ... */ }>> = {
  // ... (resultFields definition kept the same as previous code) ...
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

// Helper to get start/end dates for filters
function getDateRange(filter: string): { start?: string; end?: string } {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (filter === 'today') {
        return { start: todayStr, end: todayStr };
    }
    if (filter === 'last7') {
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        return { start: last7.toISOString().split('T')[0], end: todayStr };
    }
    // Add 'last30', 'custom', etc. ranges here if needed
    return {}; // Default: no date filter (all time)
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
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [showVisitSummary, setShowVisitSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");
  const [viewingLabTest, setViewingLabTest] = useState<any | null>(null);
  const [viewingXray, setViewingXray] = useState<any | null>(null);
  const [viewingUltrasound, setViewingUltrasound] = useState<any | null>(null);
  
  // State for integrated search and filters
  const [visitSearchTerm, setVisitSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // Default to 'today'
  const [statusFilter, setStatusFilter] = useState("all"); // Default to 'all'
  
  // State for PatientSearch modal (for starting new visits)
  const [showPatientSearchModal, setShowPatientSearchModal] = useState(false);

  // Use wouter's location hook for navigation
  const [, setLocation] = useLocation(); 
  
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
    
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Clear selected patient when navigating away from a specific visit
  useEffect(() => {
    if (!visitId) {
      setSelectedPatient(null);
      setCurrentEncounter(null);
      setSavedTreatment(null);
      setMedications([]);
      // Reset form only if we are truly on the base /treatment page
      if (window.location.pathname === '/treatment' && !window.location.search.includes('patientId')) {
        form.reset(); 
      }
    }
  }, [visitId, form]);

  // Calculate date range for the query
  const { start: startDate, end: endDate } = getDateRange(dateFilter);

  // Query for treatments based on search and filters
  // ** IMPORTANT: Assumes API supports ?search=term&startDate=...&endDate=...&status=... **
  const { data: filteredTreatments = [], isLoading: isLoadingTreatments } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments", { search: visitSearchTerm, startDate, endDate, status: statusFilter }],
    queryFn: async () => {
        const params = new URLSearchParams();
        if (visitSearchTerm) params.append('search', visitSearchTerm);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        
        // ** TODO: Update endpoint if needed, e.g., might need to join encounters for status **
        const response = await fetch(`/api/treatments?${params.toString()}`);
        if (!response.ok) {
            console.error("Failed to fetch treatments:", response);
            // Handle error appropriately, maybe show toast
            return [];
        }
        return response.json();
    },
    enabled: !visitId && !patientIdFromQuery, // Only run this query on the main search screen
  });

  // Fetch minimal patient data needed for displaying names in the list
  // Optimization: Only fetch if treatments are loaded, consider adding patient names directly to /api/treatments response
   const { data: patientDataForList = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients", "minimal"], // Example key, adjust as needed
    queryFn: async () => {
        // Ideally, the API would return names directly with treatments.
        // As a fallback, fetch all active patients *once* if needed.
        const response = await fetch('/api/patients'); // Assumes this fetches active patients
        if (!response.ok) return [];
        return response.json();
    },
    enabled: filteredTreatments.length > 0 && !visitId && !patientIdFromQuery, // Fetch only when list has items
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

   // Helper to get patient name from the minimal patient data
   const getPatientNameFromListData = (patientId: string): string => {
       const patient = patientDataForList.find(p => p.patientId === patientId);
       return patient ? `${patient.firstName} ${patient.lastName}` : patientId;
   };

  // --- Form and Mutation Logic (Mostly unchanged from previous versions) ---

  const form = useForm<InsertTreatment>({
    resolver: zodResolver(insertTreatmentSchema),
    defaultValues: { /* ... */ },
  });

  // Get services and drugs (unchanged)
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: drugs = [] } = useQuery<Drug[]>({ queryKey: ["/api/pharmacy/drugs"] });

  // Load specific visit if visitId is provided (unchanged)
  const { data: loadedVisit, isLoading: loadingVisit } = useQuery({ /* ... */ });
  // Load patient for the loaded visit (unchanged)
  const { data: loadedPatient } = useQuery<Patient | null>({ /* ... */ });
  // Load patient from query param if provided (unchanged)
  const { data: patientFromQuery } = useQuery<Patient | null>({ /* ... */ });
  // Adopt patient from query (unchanged)
  useEffect(() => { if (patientFromQuery) setSelectedPatient(patientFromQuery); }, [patientFromQuery]);
  // Get today's encounter (minor change: only needed if starting new visit via query param)
  const { data: todayEncounter } = useQuery<Encounter | null>({ /* ... enabled only if patientIdFromQuery exists ... */ });
  // Get order lines (unchanged)
  const { data: orderLines = [] } = useQuery({ /* ... */ });
  // Get unified orders (unchanged)
  const { data: orders = [] } = useQuery<any[]>({ /* ... */ });
  const labTests = orders.filter(o => o.type === 'lab');
  const xrays = orders.filter(o => o.type === 'xray');
  const ultrasounds = orders.filter(o => o.type === 'ultrasound');
  // Load existing treatment record (unchanged)
  const { data: existingTreatment } = useQuery<Treatment | null>({ /* ... */ });
  // Get all pharmacy orders for patient (unchanged)
  const { data: allPrescriptions = [] } = useQuery<PharmacyOrder[]>({ /* ... */ });
  // Get recent treatments (unchanged)
  const { data: recentTreatments = [] } = useQuery<Treatment[]>({ /* ... */ });
  // Filter prescriptions (unchanged)
  const prescriptions = currentEncounter ? allPrescriptions.filter(rx => rx.encounterId === currentEncounter.encounterId) : allPrescriptions;
  // Sync loaded visit/patient state (unchanged)
  useEffect(() => { /* ... */ });
  // Safety check patient/encounter match (unchanged)
  useEffect(() => { /* ... */ });
  // Populate form (unchanged)
  useEffect(() => { /* ... */ });
  // Create encounter mutation (unchanged)
  const createEncounterMutation = useMutation({ /* ... */ });
   // Update current encounter (minor change: primarily used when patientIdFromQuery is present)
  useEffect(() => { /* ... simplified logic ... */ });

  // --- Mutations (addConsultation, createTreatment, acknowledge, addToCart, submitMeds, cancelRx, editRx, closeVisit) remain the same ---
  const addConsultationMutation = useMutation({ /* ... */ });
  const createTreatmentMutation = useMutation({ /* ... */ });
  const acknowledgeMutation = useMutation({ /* ... */ });
  const addToCartMutation = useMutation({ /* ... */ });
  const submitMedicationsMutation = useMutation({ /* ... */ });
  const cancelPrescriptionMutation = useMutation({ /* ... */ });
  const editPrescriptionMutation = useMutation({ /* ... */ });
  const closeVisitMutation = useMutation({ /* ... */ });
  
  // --- Handlers (printPrescription, generatePrescription, handleCloseVisit, handleSubmit, getAge, navigateToPatient) remain the same ---
  const generatePrescription = () => { /* ... */ };
  const printPrescription = () => { /* ... */ };
  const handleCloseVisit = () => { /* ... */ };
  const handleSubmit = form.handleSubmit((data) => { /* ... */ });
  const getAge = (age: string) => { return age || 'Unknown'; };
  const navigateToPatient = (patientId: string) => { setLocation(`/patients?patientId=${patientId}`); };

  // Handler for selecting a patient from the PatientSearch modal
  const handlePatientSelectForNewVisit = (patient: Patient) => {
    setShowPatientSearchModal(false); // Close modal
    setLocation(`/treatment/new?patientId=${patient.patientId}`); // Navigate to start new visit
  };

  // Handler to simply reset the main search/filter view
   const handleShowAllVisits = () => {
    setVisitSearchTerm("");
    setDateFilter("today");
    setStatusFilter("all");
    // queryClient.invalidateQueries({ queryKey: ["/api/treatments"] }); // Trigger refetch
  };

  // --- RETURN JSX ---
  return (
    <div className="space-y-6">
      
      {/* If visitId or patientIdFromQuery exists, show the detailed visit/form view */}
      {(visitId || patientIdFromQuery) ? (
         // --- START: Detailed Visit View (Patient Selected) ---
         // This is the multi-tab form section, mostly unchanged from your previous code
         // It only shows when a specific visit is loaded or a patient is selected for a new visit
        <Card className="print:hidden">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Treatment Records</CardTitle>
                    {/* Button to go back to the main search/list view */}
                    <Button variant="outline" onClick={() => setLocation('/treatment')}>
                        <Search className="w-4 h-4 mr-2" />
                        Find Patient / Visit
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Patient Header Display (only if selectedPatient exists) */}
                {selectedPatient ? (
                     <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md mb-6">
                        {/* ... (Patient header display code - same as previous version) ... */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                  {selectedPatient.firstName} {selectedPatient.lastName}
                                </h4>
                                {savedTreatment && ( <Badge className="bg-green-600 text-white shadow-sm"> Saved: {savedTreatment.treatmentId} </Badge> )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1"> <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span> <span className="font-mono">{selectedPatient.patientId}</span> </span>
                                <span className="flex items-center gap-1"> <span className="font-medium text-gray-700 dark:text-gray-300">Age:</span> {getAge(selectedPatient.age || '')} </span>
                                {selectedPatient.gender && ( <span className="flex items-center gap-1"> <span className="font-medium text-gray-700 dark:text-gray-300">Gender:</span> {selectedPatient.gender} </span> )}
                                <span className="flex items-center gap-1"> <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span> {selectedPatient.phoneNumber || 'N/A'} </span>
                              </div>
                            </div>
                          </div>
                          {/* No "Change" button needed here as we are in a specific visit context */}
                        </div>
                    </div>
                ) : (
                    // Optional: Loading indicator while patient data loads for a specific visitId
                    loadingVisit ? <p>Loading visit details...</p> : <p className="text-red-500">Error: Patient data could not be loaded.</p>
                )}


                {/* Medical Alert Panel (Allergies, History, etc. - only if selectedPatient exists) */}
                {selectedPatient && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Allergies Card */}
                        <Card className={`${selectedPatient.allergies && selectedPatient.allergies.trim() ? 'border-2 border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200'}`}>
                           {/* ... (Allergies card content - same as previous version) ... */}
                            <CardHeader className="pb-3"> <CardTitle className={`flex items-center gap-2 text-base ${selectedPatient.allergies && selectedPatient.allergies.trim() ? 'text-red-700 dark:text-red-400' : ''}`}> <AlertTriangle className={`h-5 w-5 ${selectedPatient.allergies && selectedPatient.allergies.trim() ? 'text-red-600' : 'text-gray-400'}`} /> Allergies </CardTitle> </CardHeader>
                            <CardContent> {selectedPatient.allergies && selectedPatient.allergies.trim() ? ( <div className="bg-white dark:bg-red-950/50 p-3 rounded-lg border border-red-300 dark:border-red-700"> <p className="text-red-900 dark:text-red-200 font-medium whitespace-pre-line"> {selectedPatient.allergies} </p> </div> ) : ( <p className="text-gray-500 dark:text-gray-400 italic">No known allergies</p> )} </CardContent>
                        </Card>
                        {/* Medical History Card */}
                         <Card> {/* ... (Medical History card content - same as previous version) ... */} <CardHeader className="pb-3"> <CardTitle className="flex items-center gap-2 text-base"> <Heart className="h-5 w-5 text-pink-600" /> Medical History </CardTitle> </CardHeader> <CardContent> {selectedPatient.medicalHistory && selectedPatient.medicalHistory.trim() ? ( <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"> <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line"> {selectedPatient.medicalHistory} </p> </div> ) : ( <p className="text-gray-500 dark:text-gray-400 italic">No medical history recorded</p> )} </CardContent> </Card>
                         {/* Recent Visits Card */}
                         <Card> {/* ... (Recent Visits card content - same as previous version) ... */} <CardHeader className="pb-3"> <CardTitle className="flex items-center gap-2 text-base"> <History className="h-5 w-5 text-blue-600" /> Recent Visits ({recentTreatments.length}) </CardTitle> </CardHeader> <CardContent> {recentTreatments.length > 0 ? ( <div className="space-y-2"> {recentTreatments.map((treatment) => ( <div key={treatment.treatmentId} className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm border-l-2 border-blue-400"> <div className="flex items-center justify-between mb-1"> <span className="font-medium text-gray-900 dark:text-white"> {new Date(treatment.visitDate).toLocaleDateString()} </span> <Badge variant="outline" className="text-xs">{treatment.visitType}</Badge> </div> {treatment.diagnosis && ( <p className="text-gray-700 dark:text-gray-300 text-xs"> <span className="font-medium">Dx:</span> {treatment.diagnosis} </p> )} </div> ))} </div> ) : ( <p className="text-gray-500 dark:text-gray-400 italic">No previous visits</p> )} </CardContent> </Card>
                         {/* Active Medications Card */}
                         <Card> {/* ... (Active Medications card content - same as previous version) ... */} <CardHeader className="pb-3"> <CardTitle className="flex items-center gap-2 text-base"> <Pill className="h-5 w-5 text-green-600" /> Active Medications </CardTitle> </CardHeader> <CardContent> {allPrescriptions.filter(rx => rx.status === 'dispensed').length > 0 ? ( <div className="space-y-2"> {allPrescriptions.filter(rx => rx.status === 'dispensed').slice(0, 5).map((rx) => ( <div key={rx.orderId} className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm border-l-2 border-green-500"> <p className="font-medium text-gray-900 dark:text-white">{rx.drugName}</p> <p className="text-xs text-gray-600 dark:text-gray-400"> {rx.dosage} • {rx.instructions} </p> <p className="text-xs text-gray-500 dark:text-gray-500 mt-1"> <Clock className="h-3 w-3 inline mr-1" /> {new Date(rx.createdAt).toLocaleDateString()} </p> </div> ))} </div> ) : ( <p className="text-gray-500 dark:text-gray-400 italic">No active medications</p> )} </CardContent> </Card>
                    </div>
                )}

                {/* Orders & Results Panel (only if encounter exists) */}
                {selectedPatient && currentEncounter && (
                    <Card className="border-l-4 border-l-blue-500 mb-6">
                       {/* ... (Orders & Results card content - same as previous version, including modals triggers) ... */}
                        <CardHeader> <div className="flex items-center justify-between"> <CardTitle className="flex items-center gap-2"> <FileText className="h-5 w-5" /> Orders & Results </CardTitle> {orders.some(o => o.status === 'completed' && !o.addToCart && o.isPaid) && ( <Button variant="outline" size="sm" onClick={() => { /* ... add all logic ... */ }} data-testid="add-all-to-cart-btn"> <Plus className="h-4 w-4 mr-2" /> Add All Completed </Button> )} </div> </CardHeader>
                        <CardContent> <div className="space-y-4"> {/* Lab Tests */} {labTests.length > 0 && ( <div> <h4 className="font-semibold mb-2">Laboratory Tests</h4> <div className="space-y-2"> {labTests.map((test: any) => { /* ... Lab test rendering logic ... */ })} </div> </div> )} {/* X-Rays */} {xrays.length > 0 && ( <div> <h4 className="font-semibold mb-2">X-Ray Examinations</h4> <div className="space-y-2"> {xrays.map((xray: any) => { /* ... X-ray rendering logic ... */ })} </div> </div> )} {/* Ultrasounds */} {ultrasounds.length > 0 && ( <div> <h4 className="font-semibold mb-2">Ultrasound Examinations</h4> <div className="space-y-2"> {ultrasounds.map((ultrasound: any) => { /* ... Ultrasound rendering logic ... */ })} </div> </div> )} {/* Empty state */} {labTests.length === 0 && xrays.length === 0 && ultrasounds.length === 0 && ( <div className="text-center py-6 text-gray-500"> <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" /> <p>No orders or results yet</p> </div> )} </div> </CardContent>
                    </Card>
                )}

                {/* Visit Summary Panel (only if encounter exists) */}
                {selectedPatient && currentEncounter && (
                    <Card className="border-l-4 border-l-green-500 mb-6">
                         {/* ... (Visit Summary card content - same as previous version) ... */}
                        <CardHeader> <CardTitle className="flex items-center justify-between"> <div className="flex items-center gap-2"> <DollarSign className="h-5 w-5" /> Visit Summary - Today's Services </div> <div className="flex items-center gap-2"> <Badge variant="secondary"> {orders.filter(o => o.addToCart).length} items </Badge> <Button variant="outline" size="sm" onClick={() => setShowVisitSummary(!showVisitSummary)}> {showVisitSummary ? "Hide" : "Show"} Details </Button> </div> </CardTitle> </CardHeader>
                        {showVisitSummary && ( <CardContent> <div className="space-y-3"> {orders.filter(o => o.addToCart).length === 0 ? ( <div className="text-center py-4 text-gray-500"> <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" /> <p>No services in today's visit yet</p> <p className="text-xs mt-1">Acknowledge completed tests to add them here</p> </div> ) : ( <> {orders.filter(o => o.addToCart).map((order: any) => ( <div key={order.orderId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"> <div> <p className="font-medium">{order.name}</p> <p className="text-sm text-gray-600 dark:text-gray-400"> {order.type.toUpperCase()} - {order.status} </p> {order.flags && ( <Badge variant={order.flags === 'critical' ? 'destructive' : 'outline'} className="mt-1"> {order.flags} </Badge> )} </div> <div className="text-right"> <Button variant="ghost" size="sm" onClick={() => { addToCartMutation.mutate({ orderLineId: order.orderId, addToCart: false }); }}> Remove </Button> </div> </div> ))} <div className="border-t pt-3 flex justify-between items-center"> <span className="font-medium">Services Today:</span> <span className="font-bold text-lg text-green-600 dark:text-green-400"> {orders.filter(o => o.addToCart).length} service(s) </span> </div> </> )} </div> </CardContent> )}
                    </Card>
                )}
                
                {/* Treatment Form Tabs (only if selectedPatient exists) */}
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
                                    <TabsTrigger value="notes" data-testid="tab-notes"> <FileText className="h-4 w-4 mr-2" /> Visit Notes </TabsTrigger>
                                    <TabsTrigger value="tests" data-testid="tab-tests"> Lab Tests </TabsTrigger>
                                    <TabsTrigger value="imaging" data-testid="tab-imaging"> Imaging </TabsTrigger>
                                    <TabsTrigger value="medications" data-testid="tab-medications"> <Pill className="h-4 w-4 mr-2" /> Medications {medications.length > 0 && ( <Badge className="ml-2 bg-green-600">{medications.length}</Badge> )} </TabsTrigger>
                                </TabsList>

                                <Form {...form}>
                                    <form onSubmit={handleSubmit} className="mt-6">
                                        <TabsContent value="notes" className="space-y-6">
                                            {/* Visit Info, Complaint, Vitals, Exam, Dx, Plan, Followup FormFields */}
                                            {/* ... (Form content for "Visit Notes" tab - same as previous version) ... */}
                                        </TabsContent>
                                        <TabsContent value="tests" className="space-y-6">
                                            {/* Link to Laboratory page */}
                                            {/* ... (Content for "Lab Tests" tab - same as previous version) ... */}
                                        </TabsContent>
                                        <TabsContent value="imaging" className="space-y-6">
                                            {/* Links to XRay/Ultrasound pages */}
                                             {/* ... (Content for "Imaging" tab - same as previous version) ... */}
                                        </TabsContent>
                                        <TabsContent value="medications" className="space-y-6">
                                            {/* Prescribed list, New Medication form */}
                                            {/* ... (Content for "Medications" tab - same as previous version) ... */}
                                        </TabsContent>
                                        
                                        {/* Form Actions */}
                                        <div className="flex gap-4 pt-6 mt-6 border-t">
                                            <Button type="submit" disabled={createTreatmentMutation.isPending} className="bg-medical-blue hover:bg-blue-700" data-testid="save-treatment-btn"> <Save className="w-4 h-4 mr-2" /> {createTreatmentMutation.isPending ? "Saving..." : "Save Visit Notes"} </Button>
                                            {currentEncounter && currentEncounter.status === 'open' && ( <Button type="button" onClick={handleCloseVisit} variant="default" className="bg-orange-600 hover:bg-orange-700" disabled={closeVisitMutation.isPending} data-testid="close-visit-btn"> {closeVisitMutation.isPending ? "Closing..." : "Close Visit"} </Button> )}
                                            {/* Removed "New Treatment" button from here, handled by main nav/back button */}
                                        </div>
                                    </form>
                                </Form>
                            </Tabs>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
        // --- END: Detailed Visit View ---

      ) : (

        // --- START: Main Search/Filter View (No Patient Selected) ---
        <Card>
            <CardHeader>
                <CardTitle>Treatment Records</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Search for existing visits or start a new one.
                </p>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                     {/* Search Input */}
                    <div className="relative flex-1">
                        <Input
                            placeholder="Search visits by Patient Name, ID, Complaint, Dx..."
                            value={visitSearchTerm}
                            onChange={(e) => setVisitSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Date Filter */}
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="last7">Last 7 Days</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                            {/* <SelectItem value="custom">Custom Range...</SelectItem> */}
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[150px]">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            {/* Add other relevant statuses like 'ready_to_bill' if needed */}
                        </SelectContent>
                    </Select>
                    
                     {/* Button to Start New Visit */}
                    <Button 
                        onClick={() => setShowPatientSearchModal(true)}
                        className="w-full md:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Start New Visit
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingTreatments ? (
                    <p className="text-center text-gray-500 py-6">Loading visits...</p>
                ) : filteredTreatments.length > 0 ? (
                    <div className="space-y-3">
                        {filteredTreatments.map((treatment: any) => (
                             <Link 
                                key={treatment.id} 
                                // Link using encounterId primarily, fallback to treatmentId
                                href={`/treatment/${treatment.encounterId || treatment.treatmentId}`} 
                                className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md hover:border-medical-blue/50 cursor-pointer"
                                data-testid={`treatment-card-${treatment.treatmentId}`}
                            >
                                <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Patient:</span>
                                    {/* Use minimal patient data for name */}
                                    <span className="font-semibold text-medical-blue">
                                        {getPatientNameFromListData(treatment.patientId)}
                                    </span>
                                    <span className="text-sm text-gray-500">({treatment.patientId})</span>
                                    </div>
                                    <div className="space-y-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Visit ID:</span> {treatment.treatmentId} 
                                        {/* Optionally display Encounter Status here if available */}
                                        {/* <Badge variant="outline" className="ml-2">{treatment.encounterStatus || 'Unknown'}</Badge> */}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Type:</span> <Badge variant="outline" className="ml-1">{treatment.visitType}</Badge>
                                        <span className="ml-3 font-medium">Priority:</span> <Badge variant="outline" className="ml-1">{treatment.priority}</Badge>
                                    </p>
                                    {treatment.chiefComplaint && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Complaint:</span> {treatment.chiefComplaint}
                                        </p>
                                    )}
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
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No treatment visits found matching your criteria.</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters, or start a new visit.</p>
                        <Button variant="link" onClick={handleShowAllVisits} className="mt-2">Show Recent Visits</Button>
                    </div>
                )}
            </CardContent>
        </Card>
        // --- END: Main Search/Filter View ---
      )}

      {/* Patient Search Modal (for starting new visits) */}
       <Dialog open={showPatientSearchModal} onOpenChange={setShowPatientSearchModal}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Select Patient to Start New Visit</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {/* Reuse PatientSearch component */}
                    <PatientSearch 
                        onSelectPatient={handlePatientSelectForNewVisit} 
                        // Optional: Add onViewPatient if needed, maybe just close modal?
                        onViewPatient={() => setShowPatientSearchModal(false)} 
                        showActions={true} // Show actions like "Select"
                        selectButtonLabel="Start Visit"
                        viewMode="all"
                    />
                </div>
            </DialogContent>
        </Dialog>

      {/* --- Modals (Edit Prescription, Lab Results, XRay, Ultrasound, Print Prescription) remain the same --- */}
      <Dialog open={!!editingPrescription} onOpenChange={(open) => !open && setEditingPrescription(null)}> {/* ... Edit Prescription Modal Content ... */} </Dialog>
      {viewingLabTest && ( <Dialog open={!!viewingLabTest} onOpenChange={() => setViewingLabTest(null)}> {/* ... Lab Results Modal Content ... */} </Dialog> )}
      {viewingXray && ( <Dialog open={!!viewingXray} onOpenChange={() => setViewingXray(null)}> {/* ... XRay Report Modal Content ... */} </Dialog> )}
      {viewingUltrasound && ( <Dialog open={!!viewingUltrasound} onOpenChange={() => setViewingUltrasound(null)}> {/* ... Ultrasound Report Modal Content ... */} </Dialog> )}
      {showPrescription && selectedPatient && ( <div> {/* ... Print Prescription Card Content ... */} </div> )}

    </div>
  );
}
