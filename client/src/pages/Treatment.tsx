import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Check,
  ChevronRight,
  Stethoscope,
  Users,
  ClipboardList,
  AlertCircle,
  Beaker,
  Zap, // For X-Ray icon
  Radio, // For Ultrasound icon
  FlaskConical, // Alternative Lab icon
  Mic, // For voice dictation
  Camera, // For X-Ray views
  CheckCircle, // For X-Ray quality indicator
  Send, // For submit button
  Calendar, // For dates
  RefreshCw, // For renew medication
  XCircle, // For stop/out of stock
  Package, // For stock indicators
  Calculator, // For auto-calculate quantity
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
import { timeAgo } from '@/lib/time-utils';
import { getXrayDisplayName, getUltrasoundDisplayName, formatDepartmentName, type XrayDisplayData, type UltrasoundDisplayData } from '@/lib/display-utils';
import { extractLabKeyFinding } from '@/lib/medical-criteria';
import { hasPendingOrders } from '@/lib/patient-utils';
import type { PatientWithStatus } from "@shared/schema";

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

// Format currency with SSP and thousand separators
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `SSP ${amount.toLocaleString('en-US')}`;
}

// Get icon for order type
function getOrderIcon(type: string) {
  switch (type) {
    case 'lab':
      return <Beaker className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case 'xray':
      return <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />;
    case 'ultrasound':
      return <Radio className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    default:
      return <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
  }
}

/**
 * Convert SQLite datetime string to ISO format for proper parsing
 * 
 * Handles two datetime formats from the database:
 * 1. SQLite datetime('now'): Returns "YYYY-MM-DD HH:MM:SS" in UTC
 * 2. Backend ISO format: Returns "YYYY-MM-DDTHH:MM:SS.sssZ" from new Date().toISOString()
 * 
 * @param dateString - Date string from database (SQLite or ISO format)
 * @returns ISO 8601 formatted string with UTC timezone (e.g., "2025-01-05T03:35:54.200Z")
 *          or null if the format is unrecognized
 * 
 * @example
 * ensureISOFormat("2025-01-05 03:35:54") // "2025-01-05T03:35:54Z"
 * ensureISOFormat("2025-01-05T03:35:54.200Z") // "2025-01-05T03:35:54.200Z"
 * ensureISOFormat("invalid") // null (with console warning)
 */
function ensureISOFormat(dateString: string | undefined | null): string | null {
  if (!dateString) return null;
  
  // Already in ISO format with 'T' separator, optional milliseconds, and UTC timezone
  // Matches: "2025-01-05T03:35:54Z" or "2025-01-05T03:35:54.200Z"
  // Note: We only handle 'Z' (UTC) since backend always uses UTC timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(dateString)) {
    return dateString;
  }
  
  // SQLite format "YYYY-MM-DD HH:MM:SS" - assume UTC and convert to ISO
  // Matches exactly: "2025-01-05 03:35:54"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
    return dateString.replace(' ', 'T') + 'Z';
  }
  
  // If format is unrecognized, return null to avoid invalid dates
  console.warn('Unrecognized date format:', dateString);
  return null;
}

// Common chief complaints in South Sudan
const COMMON_COMPLAINTS = [
  "Fever",
  "Cough",
  "Headache",
  "Abdominal Pain",
  "Diarrhea",
  "Vomiting",
  "Body Weakness",
  "Joint Pain",
  "Skin Rash",
  "Difficulty Breathing",
  "Chest Pain",
  "Malaria Symptoms",
  "Follow-up Visit",
];

// Common diagnoses in South Sudan
const COMMON_DIAGNOSES = [
  "Malaria (uncomplicated)",
  "Malaria (severe)",
  "Typhoid Fever",
  "Upper Respiratory Tract Infection (URTI)",
  "Lower Respiratory Tract Infection (LRTI)",
  "Pneumonia",
  "Acute Watery Diarrhea",
  "Dysentery",
  "Urinary Tract Infection (UTI)",
  "Skin Infection / Cellulitis",
  "Worm Infestation (Helminthiasis)",
  "Anemia",
  "Hypertension",
  "Diabetes Mellitus",
  "HIV/AIDS related illness",
  "Tuberculosis (TB)",
  "Malnutrition",
  "Acute Gastritis",
  "Peptic Ulcer Disease",
  "Conjunctivitis",
];

// Body systems for structured physical exam
const BODY_SYSTEMS = [
  { id: "general", label: "General Appearance" },
  { id: "heent", label: "HEENT (Head, Eyes, Ears, Nose, Throat)" },
  { id: "chest", label: "Chest/Lungs" },
  { id: "cardiovascular", label: "Cardiovascular" },
  { id: "abdomen", label: "Abdomen" },
  { id: "extremities", label: "Extremities" },
  { id: "neurological", label: "Neurological" },
  { id: "skin", label: "Skin" },
];

// Quick dosage presets for common medications
const DOSAGE_PRESETS = [
  "1 tablet once daily",
  "1 tablet twice daily",
  "1 tablet three times daily",
  "2 tablets twice daily",
  "1 tablet at bedtime",
  "1 tablet every 8 hours",
  "1 tablet every 6 hours",
  "As needed for pain/fever",
];

// Duration presets
const DURATION_PRESETS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "30 days",
];

// Common medications for South Sudan context
const COMMON_MEDICATIONS = [
  {
    id: "coartem",
    name: "Artemether-Lumefantrine (Coartem)",
    category: "Antimalarial",
    emoji: "🦟",
    defaultDosage: "4 tablets twice daily",
    defaultDuration: "3 days",
    defaultQuantity: 24,
    stockLevel: 150,
  },
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    category: "Antibiotic",
    emoji: "💊",
    defaultDosage: "1 tablet three times daily",
    defaultDuration: "7 days",
    defaultQuantity: 21,
    stockLevel: 85,
  },
  {
    id: "paracetamol",
    name: "Paracetamol",
    category: "Pain/Fever",
    emoji: "🌡️",
    defaultDosage: "1-2 tablets every 6 hours",
    defaultDuration: "As needed",
    defaultQuantity: 20,
    stockLevel: 15,
  },
  {
    id: "metronidazole",
    name: "Metronidazole",
    category: "Antibiotic",
    emoji: "💊",
    defaultDosage: "1 tablet three times daily",
    defaultDuration: "7 days",
    defaultQuantity: 21,
    stockLevel: 45,
  },
  {
    id: "ors",
    name: "ORS (Oral Rehydration Salts)",
    category: "Rehydration",
    emoji: "💧",
    defaultDosage: "1 sachet after each loose stool",
    defaultDuration: "As needed",
    defaultQuantity: 10,
    stockLevel: 200,
  },
  {
    id: "zinc",
    name: "Zinc Tablets",
    category: "Supplement",
    emoji: "⚡",
    defaultDosage: "1 tablet once daily",
    defaultDuration: "10 days",
    defaultQuantity: 10,
    stockLevel: 0,
  },
];

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

// Route of administration options
const ROUTE_OPTIONS = [
  "PO (By Mouth)",
  "IV (Intravenous)",
  "IM (Intramuscular)",
  "SC (Subcutaneous)",
  "Topical",
  "Rectal",
  "Sublingual",
  "Inhalation",
  "Eye Drops",
  "Ear Drops",
];

// Auto-calculate quantity based on dosage instructions and duration
function calculateQuantity(dosageInstructions: string, duration: string): number {
  // Parse tablets per dose
  const doseMatch = dosageInstructions.match(/(\d+)\s*tablet[s]?/i);
  if (!doseMatch) return 1;
  const tabletsPerDose = parseInt(doseMatch[1]);
  
  // Parse frequency
  let dosesPerDay = 1;
  const instruction = dosageInstructions.toLowerCase();
  if (instruction.includes('twice')) dosesPerDay = 2;
  else if (instruction.includes('three times')) dosesPerDay = 3;
  else if (instruction.includes('four times')) dosesPerDay = 4;
  else if (instruction.includes('every 8 hours')) dosesPerDay = 3;
  else if (instruction.includes('every 6 hours')) dosesPerDay = 4;
  else if (instruction.includes('every 4 hours')) dosesPerDay = 6;
  
  // Parse duration days
  const durationMatch = duration.match(/(\d+)/);
  if (!durationMatch) return tabletsPerDose * dosesPerDay;
  const days = parseInt(durationMatch[1]);
  
  return tabletsPerDose * dosesPerDay * days;
}

// Check if drug matches patient allergies
function checkDrugAllergy(
  drug: { name: string; genericName?: string },
  allergies: Array<{ name: string; severity: string; reaction: string }>
): { hasAllergy: boolean; matchedAllergy?: { name: string; severity: string; reaction: string } } {
  if (allergies.length === 0) return { hasAllergy: false };
  
  const drugName = (drug.genericName || drug.name).toLowerCase();
  
  for (const allergy of allergies) {
    const allergyName = allergy.name.toLowerCase();
    
    // Check exact match or contains
    if (allergyName.includes(drugName) || drugName.includes(allergyName)) {
      return { hasAllergy: true, matchedAllergy: allergy };
    }
    
    // Check for drug class matches (e.g., "Penicillin" should flag "Amoxicillin")
    const drugClasses: Record<string, string[]> = {
      'penicillin': ['amoxicillin', 'ampicillin', 'penicillin'],
      'sulfa': ['sulfamethoxazole', 'sulfonamide', 'trimethoprim'],
      'nsaid': ['ibuprofen', 'aspirin', 'diclofenac', 'naproxen'],
    };
    
    for (const [className, classMembers] of Object.entries(drugClasses)) {
      if (allergyName.includes(className) && classMembers.some(member => drugName.includes(member))) {
        return { hasAllergy: true, matchedAllergy: allergy };
      }
    }
  }
  
  return { hasAllergy: false };
}

// Get medication status badge label
function getMedicationStatusLabel(status: string): string {
  switch (status) {
    case "dispensed":
      return "Dispensed";
    case "prescribed":
      return "Active";
    default:
      return "Pending";
  }
}


// --- Quick Orders helpers ---
// ... (keep CATEGORY_ALIASES and matchesCategory as they are) ...
const CATEGORY_ALIASES: Record<"lab" | "xray" | "ultrasound", string[]> = {
  lab: ["lab", "labs", "laboratory", "hematology", "chemistry", "microbiology"],
  xray: ["xray", "x-ray", "radiology-xray", "radiology_xray", "radiology"],
  ultrasound: ["ultrasound", "u/s", "sonography", "radiology-ultrasound"],
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
  const [qoTab, setQoTab] = useState<"lab" | "xray" | "ultrasound" | "all">("all");
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
    Array<{ drugId: number; drugName: string; dosage: string; quantity: number; instructions: string; duration?: string; route?: string }>
  >([]);
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [selectedDrugName, setSelectedDrugName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedQuantity, setNewMedQuantity] = useState(1); // Changed default from 0 to 1
  const [newMedInstructions, setNewMedInstructions] = useState("");
  const [newMedDuration, setNewMedDuration] = useState(""); // New: duration field
  const [newMedRoute, setNewMedRoute] = useState("oral"); // New: route of administration
  const [isRecordingInstructions, setIsRecordingInstructions] = useState(false); // New: voice recording state
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null); // New: for editing medications in cart
  const [selectedCommonDrug, setSelectedCommonDrug] = useState<string | null>(null); // New: track selected common medication
  
  // New state for collapsible order form and searchable dropdown
  const [isOrderFormExpanded, setIsOrderFormExpanded] = useState(false);
  const [drugSearchOpen, setDrugSearchOpen] = useState(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  
  // State for Bug #2: Edit button functionality on Current Medications
  const [editingCurrentMedication, setEditingCurrentMedication] = useState<PharmacyOrder | null>(null);
  
  // State for Bug #3: Make Common Medications collapsible
  const [showCommonMedications, setShowCommonMedications] = useState(false);

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
  const [isRefreshing, setIsRefreshing] = useState(false); // Refresh state

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

  // X-Ray ordering state
  const [xrayClinicalInfo, setXrayClinicalInfo] = useState("");
  const [editXrayModalOpen, setEditXrayModalOpen] = useState(false);
  const [xrayToEdit, setXrayToEdit] = useState<any>(null);
  const [editXrayClinicalInfo, setEditXrayClinicalInfo] = useState("");
  
  // Enhanced X-Ray state
  const [xrayExamType, setXrayExamType] = useState('chest');
  const [xrayBodyPart, setXrayBodyPart] = useState('');
  const [xraySafetyChecklist, setXraySafetyChecklist] = useState({
    pregnancy: false,
    metal: false,
    cooperation: false,
  });

  // Ultrasound ordering state
  const [ultrasoundClinicalInfo, setUltrasoundClinicalInfo] = useState("");
  const [editUltrasoundModalOpen, setEditUltrasoundModalOpen] = useState(false);
  const [ultrasoundToEdit, setUltrasoundToEdit] = useState<any>(null);
  const [editUltrasoundClinicalInfo, setEditUltrasoundClinicalInfo] = useState("");
  
  // Enhanced Ultrasound state
  const [ultrasoundExamType, setUltrasoundExamType] = useState('abdominal');
  const [ultrasoundSpecificExam, setUltrasoundSpecificExam] = useState('');
  
  // Enhanced Lab state
  const [labCategory, setLabCategory] = useState<keyof typeof commonTests>('hematology');
  const [labSpecificTests, setLabSpecificTests] = useState<string[]>([]);

  // Allergies state
  const [allergies, setAllergies] = useState<Array<{ id: string; name: string; severity: string; reaction: string }>>([]);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [newAllergyName, setNewAllergyName] = useState("");
  const [newAllergySeverity, setNewAllergySeverity] = useState<"Mild" | "Moderate" | "Severe">("Mild");
  const [newAllergyReaction, setNewAllergyReaction] = useState("");

  // NEW: Structured exam toggle state
  const [useStructuredExam, setUseStructuredExam] = useState(false);
  const [structuredExamFindings, setStructuredExamFindings] = useState<Record<string, string>>({});

  // Patient History - expandable visits
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

  // Voice dictation state for Visit Notes
  const [isRecording, setIsRecording] = useState({
    chiefComplaint: false,
    examination: false,
    diagnosis: false,
    treatmentPlan: false,
  });
  
  // Refs for voice input
  const chiefComplaintRef = useRef<HTMLTextAreaElement>(null);
  const examinationRef = useRef<HTMLTextAreaElement>(null);
  const diagnosisRef = useRef<HTMLTextAreaElement>(null);
  const treatmentPlanRef = useRef<HTMLTextAreaElement>(null);
  
  // Recognition instance (shared across all fields)
  const recognitionInstanceRef = useRef<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to update examination field from structured findings
  const updateExaminationFromStructured = (findings: Record<string, string>) => {
    const combined = Object.entries(findings)
      .filter(([_, value]) => value.trim())
      .map(([system, value]) => {
        const label = BODY_SYSTEMS.find(s => s.id === system)?.label || system;
        return `${label}: ${value}`;
      })
      .join('\n');
    form.setValue("examination", combined);
  };

  // Helper function to parse freeform examination into structured format
  const parseExaminationToStructured = (text: string): Record<string, string> => {
    const findings: Record<string, string> = {};
    const lines = text.split('\n');
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const label = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        // Try to match with known body systems
        const system = BODY_SYSTEMS.find(s => 
          s.label.toLowerCase() === label.toLowerCase()
        );
        
        if (system && value) {
          findings[system.id] = value;
        }
      }
    });
    
    return findings;
  };


  // ... (keep useEffect hooks and data fetching queries as they are) ...
  // Auto-calculate quantity when dosage or duration changes
  useEffect(() => {
    if (newMedDosage && newMedDuration) {
      const calculatedQty = calculateQuantity(newMedDosage, newMedDuration);
      if (calculatedQty > 0) {
        setNewMedQuantity(calculatedQty);
      }
    }
  }, [newMedDosage, newMedDuration]);

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
  // Always load patient data for queue names and filtering
  const { data: allPatients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // queue - using preset 'today' for consistent filtering
  // Always load queue data so the badge count is accurate
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
  
  // Filter drugs based on search query and group by category
  const filteredDrugs = useMemo(() => {
    return drugs.filter(drug => 
      drug.name.toLowerCase().includes(drugSearchQuery.toLowerCase()) ||
      (drug.genericName && drug.genericName.toLowerCase().includes(drugSearchQuery.toLowerCase())) ||
      (drug.category && drug.category.toLowerCase().includes(drugSearchQuery.toLowerCase()))
    );
  }, [drugs, drugSearchQuery]);
  
  // Get unique drug categories for grouping
  const drugCategories = useMemo(() => {
    const categories = new Set(drugs.map(d => d.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [drugs]);
  
  // Statistics for header
  const { data: patientCounts } = useQuery<{ today: number; all: number }>({
    queryKey: ["/api/patients/counts"],
  });
  
  const { data: unpaidOrders } = useQuery({
    queryKey: ["/api/unpaid-orders/all"],
  });

  // Fetch patients with pending (unprocessed) orders for the stat card
  // Use preset 'today' to get today's patients with service status
  const { data: patientsWithStatus = [] } = useQuery<PatientWithStatus[]>({
    queryKey: ["/api/patients", { withStatus: true, preset: 'today' }],
    queryFn: async () => {
      const url = new URL("/api/patients", window.location.origin);
      url.searchParams.set("withStatus", "true");
      url.searchParams.set("preset", "today");
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch patients with status");
      }
      return response.json();
    },
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
  // Also filter out cancelled lab tests from display
  const labTests = useMemo(() => orders.filter((o) => o.type === "lab" && o.status !== "cancelled"), [orders]);
  const xrays = useMemo(() => orders.filter((o) => o.type === "xray"), [orders]);
  const ultrasounds = useMemo(() => orders.filter((o) => o.type === "ultrasound"), [orders]);
  
  // Count only diagnostic tests (lab + xray + ultrasound) for badge, excluding cancelled ones
  const diagnosticTestCount = useMemo(() => labTests.length + xrays.length + ultrasounds.length, [labTests, xrays, ultrasounds]);

  // Memoized handler for X-ray safety checklist changes to prevent re-renders and event issues
  const handleXraySafetyCheckChange = useCallback((itemId: string, checked: boolean) => {
    setXraySafetyChecklist(prev => ({ ...prev, [itemId]: checked }));
  }, []);

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
        requestedDate: new Date().toISOString(),
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

  // Order X-Ray mutation (creates exam record + order line)
  const orderXrayMutation = useMutation({
    mutationFn: async ({ service, bodyPart }: { service: Service; bodyPart: string }) => {
      if (!selectedPatient) throw new Error("No patient selected");
      if (!currentEncounter) throw new Error("No active encounter");

      // 1. Create X-ray exam record with clinical notes
      // Use component state xrayExamType (e.g., 'chest', 'extremities') instead of service.category
      // to ensure correct exam type is saved (not generic 'radiology')
      const xrayData = {
        patientId: selectedPatient.patientId,
        examType: xrayExamType,
        bodyPart: bodyPart || service.name,
        clinicalIndication: xrayClinicalInfo,
        requestedDate: new Date().toISOString(),
      };

      const xrayRes = await apiRequest("POST", "/api/xray-exams", xrayData);
      const createdXray = await xrayRes.json();

      // Build descriptive X-Ray label
      const examTypeLabel: Record<string, string> = {
        'chest': 'Chest X-Ray',
        'extremities': 'Extremity X-Ray',
        'extremity': 'Extremity X-Ray',
        'abdomen': 'Abdominal X-Ray',
        'spine': 'Spine X-Ray',
        'skull': 'Skull X-Ray',
        'dental': 'Dental X-Ray'
      };

      // Use component state for exam type
      const examType = xrayExamType;
      
      // If bodyPart is set and is NOT an exam type itself, it's a specific body part
      const isBodyPartAnExamType = bodyPart && bodyPart.toLowerCase() in examTypeLabel;
      const hasSpecificBodyPart = bodyPart && !isBodyPartAnExamType;
      
      const fullDescription = hasSpecificBodyPart 
        ? `${examTypeLabel[examType] || 'X-Ray Examination'} - ${bodyPart}`
        : examTypeLabel[examType] || examTypeLabel[bodyPart?.toLowerCase() || ''] || 'X-Ray Examination';

      // 2. Create corresponding order_line
      const orderLineData = {
        encounterId: currentEncounter.encounterId,
        serviceId: service.id,
        relatedType: "xray",
        relatedId: createdXray.examId,
        description: `X-Ray: ${fullDescription}`,
        quantity: 1,
        unitPriceSnapshot: service.price || 0,
        totalPrice: service.price || 0,
        department: "radiology",
        orderedBy: "Dr. System",
      };

      await apiRequest("POST", "/api/order-lines", orderLineData);

      return createdXray;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "X-Ray exam ordered successfully" });
      setXrayClinicalInfo("");
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to order X-Ray exam", variant: "destructive" });
    },
  });

  // Order Ultrasound mutation (creates exam record + order line)
  const orderUltrasoundMutation = useMutation({
    mutationFn: async ({ service, examType }: { service: Service; examType: string }) => {
      if (!selectedPatient) throw new Error("No patient selected");
      if (!currentEncounter) throw new Error("No active encounter");

      // 1. Create ultrasound exam record with clinical notes
      const ultrasoundData = {
        patientId: selectedPatient.patientId,
        examType: examType || service.name,
        clinicalIndication: ultrasoundClinicalInfo,
        requestedDate: new Date().toISOString(),
      };

      const ultrasoundRes = await apiRequest("POST", "/api/ultrasound-exams", ultrasoundData);
      const createdUltrasound = await ultrasoundRes.json();

      // Build descriptive Ultrasound label
      const examTypeLabel: Record<string, string> = {
        'obstetric': 'Obstetric Ultrasound',
        'abdominal': 'Abdominal Ultrasound',
        'pelvic': 'Pelvic Ultrasound',
        'thyroid': 'Thyroid Ultrasound',
        'breast': 'Breast Ultrasound',
        'musculoskeletal': 'Musculoskeletal Ultrasound',
        'vascular': 'Vascular Ultrasound',
        'renal': 'Renal Ultrasound'
      };

      // Use component state for the base exam type, and examType param for specific exam if provided
      const baseExamType = ultrasoundExamType;
      const fullDescription = examTypeLabel[baseExamType] || examType || 'Ultrasound Examination';

      // 2. Create corresponding order_line
      const orderLineData = {
        encounterId: currentEncounter.encounterId,
        serviceId: service.id,
        relatedType: "ultrasound",
        relatedId: createdUltrasound.examId,
        description: `Ultrasound: ${fullDescription}`,
        quantity: 1,
        unitPriceSnapshot: service.price || 0,
        totalPrice: service.price || 0,
        department: "ultrasound",
        orderedBy: "Dr. System",
      };

      await apiRequest("POST", "/api/order-lines", orderLineData);

      return createdUltrasound;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Ultrasound exam ordered successfully" });
      setUltrasoundClinicalInfo("");
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to order Ultrasound exam", variant: "destructive" });
    },
  });

  // Delete lab test mutation
  const deleteLabTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      await apiRequest("DELETE", `/api/lab-tests/${testId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lab test cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
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

  // X-Ray mutations
  const deleteXrayMutation = useMutation({
    mutationFn: async (examId: string) => {
      await apiRequest("DELETE", `/api/xray-exams/${examId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "X-Ray exam cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel X-Ray exam",
        variant: "destructive",
      });
    },
  });

  const editXrayMutation = useMutation({
    mutationFn: async ({ examId, clinicalIndication }: { examId: string; clinicalIndication: string }) => {
      const response = await apiRequest("PUT", `/api/xray-exams/${examId}`, {
        clinicalIndication,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "X-Ray exam updated successfully" });
      setEditXrayModalOpen(false);
      setXrayToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update X-Ray exam",
        variant: "destructive",
      });
    },
  });

  const handleEditXray = (xray: any) => {
    setXrayToEdit(xray);
    setEditXrayClinicalInfo(xray.clinicalIndication || "");
    setEditXrayModalOpen(true);
  };

  const handleDeleteXray = (examId: string) => {
    if (!examId) {
      toast({ 
        title: "Error", 
        description: "Cannot delete: Exam ID is missing", 
        variant: "destructive" 
      });
      return;
    }
    if (confirm("Are you sure you want to cancel this X-Ray exam request?")) {
      deleteXrayMutation.mutate(examId);
    }
  };

  const handleSaveXrayEdit = () => {
    if (!xrayToEdit) return;
    const examId = xrayToEdit.examId || xrayToEdit.orderId;
    if (!examId) {
      toast({ 
        title: "Error", 
        description: "Cannot edit: Exam ID is missing", 
        variant: "destructive" 
      });
      return;
    }
    editXrayMutation.mutate({
      examId,
      clinicalIndication: editXrayClinicalInfo,
    });
  };

  // Ultrasound mutations
  const deleteUltrasoundMutation = useMutation({
    mutationFn: async (examId: string) => {
      await apiRequest("DELETE", `/api/ultrasound-exams/${examId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Ultrasound exam cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel Ultrasound exam",
        variant: "destructive",
      });
    },
  });

  const editUltrasoundMutation = useMutation({
    mutationFn: async ({ examId, clinicalIndication }: { examId: string; clinicalIndication: string }) => {
      const response = await apiRequest("PUT", `/api/ultrasound-exams/${examId}`, {
        clinicalIndication,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Ultrasound exam updated successfully" });
      setEditUltrasoundModalOpen(false);
      setUltrasoundToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update Ultrasound exam",
        variant: "destructive",
      });
    },
  });

  const handleEditUltrasound = (ultrasound: any) => {
    setUltrasoundToEdit(ultrasound);
    setEditUltrasoundClinicalInfo(ultrasound.clinicalIndication || "");
    setEditUltrasoundModalOpen(true);
  };

  const handleDeleteUltrasound = (examId: string) => {
    if (!examId) {
      toast({ 
        title: "Error", 
        description: "Cannot delete: Exam ID is missing", 
        variant: "destructive" 
      });
      return;
    }
    if (confirm("Are you sure you want to cancel this Ultrasound exam request?")) {
      deleteUltrasoundMutation.mutate(examId);
    }
  };

  const handleSaveUltrasoundEdit = () => {
    if (!ultrasoundToEdit) return;
    const examId = ultrasoundToEdit.examId || ultrasoundToEdit.orderId;
    if (!examId) {
      toast({ 
        title: "Error", 
        description: "Cannot edit: Exam ID is missing", 
        variant: "destructive" 
      });
      return;
    }
    editUltrasoundMutation.mutate({
      examId,
      clinicalIndication: editUltrasoundClinicalInfo,
    });
  };

  // Bug #2: Handler for editing Current Medications
  const handleEditCurrentMedication = (medication: PharmacyOrder) => {
    // Expand the order form if collapsed
    setIsOrderFormExpanded(true);
    
    // Find the drug in the drugs list to pre-fill properly
    const drug = drugs.find(d => d.id === medication.drugId);
    
    // Pre-fill the form with medication data
    if (drug) {
      setSelectedDrugId(drug.id.toString());
      setSelectedDrugName(drug.genericName || drug.name);
    }
    setNewMedDosage(medication.dosage || "");
    setNewMedQuantity(medication.quantity || 1);
    setNewMedInstructions(medication.instructions || "");
    setNewMedDuration(medication.duration || "");
    setNewMedRoute(medication.route || "oral");
    
    // Mark that we're editing (not creating new)
    setEditingCurrentMedication(medication);
    
    // Scroll to form
    setTimeout(() => {
      document.getElementById('medication-order-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
          route: med.route,
          duration: med.duration,
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

  const handlePatientFromQueue = (patientId: string) => {
    const patient = activePatients.find(p => p.patientId === patientId);
    if (patient) {
      handlePatientSelect(patient);
      setQueueOpen(false);
    }
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
  const activeEncountersCount = visibleQueue.length;
  
  // Count PATIENTS with PENDING (unprocessed) diagnostic orders, not UNPAID orders
  // Pending = Lab/X-Ray/Ultrasound hasn't processed the order yet (clinical concern)
  // Unpaid = Patient hasn't paid yet (billing concern)
  const pendingOrdersCount = patientsWithStatus
    ? patientsWithStatus.filter(hasPendingOrders).length
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

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/patients"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/treatments"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/unpaid-orders/all"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/patients/counts"] }),
      ]);
      toast({
        title: "Refreshed",
        description: "Treatment data has been updated",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Voice dictation - multi-field support for Visit Notes
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
        case 'chiefComplaint':
          form.setValue('chiefComplaint', transcript);
          break;
        case 'examination':
          form.setValue('examination', transcript);
          break;
        case 'diagnosis':
          form.setValue('diagnosis', transcript);
          break;
        case 'treatmentPlan':
          form.setValue('treatmentPlan', transcript);
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

  // Voice input handler for medication instructions field
  const startInstructionsVoiceInput = () => {
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

    // If already recording, stop
    if (isRecordingInstructions) {
      setIsRecordingInstructions(false);
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecordingInstructions(true);
      toast({
        title: "🎤 Listening...",
        description: "Speak medication instructions. Click 'Stop' when done.",
        duration: 2000
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      setNewMedInstructions(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecordingInstructions(false);
      toast({
        title: "Error",
        description: `Voice recognition error: ${event.error}`,
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsRecordingInstructions(false);
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

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      {/* World-Class Department Header - More Compact */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl p-4 shadow-lg border border-emerald-100 dark:border-emerald-900/30">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur-sm opacity-75"></div>
              <div className="relative h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treatment Records</h1>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Today's Queue</p>
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
          <CardTitle>Patient Selection</CardTitle>
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
                      showDateFilter ? "today" :
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
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg">
                    {/* Visit Notes Tab - Emerald with distinct background */}
                    <TabsTrigger 
                      value="notes" 
                      className={`px-4 py-3 rounded-t-lg font-medium transition-all duration-200 ${
                        activeTab === "notes"
                          ? "bg-emerald-100 border-b-3 border-emerald-500 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                          : "text-gray-600 dark:text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                      }`}
                    >
                      <FileText className={`h-4 w-4 mr-2 ${activeTab === "notes" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`} />
                      <span className="hidden sm:inline">Visit Notes</span>
                      <span className="sm:hidden">Notes</span>
                    </TabsTrigger>
                    
                    {/* Orders & Results Tab - Blue with distinct background */}
                    <TabsTrigger 
                      value="orders" 
                      className={`px-4 py-3 rounded-t-lg font-medium transition-all duration-200 ${
                        activeTab === "orders"
                          ? "bg-blue-100 border-b-3 border-blue-500 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                          : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      }`}
                    >
                      <ClipboardList className={`h-4 w-4 mr-2 ${activeTab === "orders" ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                      <span className="hidden sm:inline">Orders & Results</span>
                      <span className="sm:hidden">Orders</span>
                      {diagnosticTestCount > 0 && (
                        <Badge className="ml-2 transition-all duration-200 animate-in fade-in bg-blue-600 text-white">
                          {diagnosticTestCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    
                    {/* Medications Tab - Purple with distinct background */}
                    <TabsTrigger 
                      value="medications" 
                      className={`px-4 py-3 rounded-t-lg font-medium transition-all duration-200 ${
                        activeTab === "medications"
                          ? "bg-purple-100 border-b-3 border-purple-500 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200"
                          : "text-gray-600 dark:text-gray-400 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                      }`}
                    >
                      <Pill className={`h-4 w-4 mr-2 ${activeTab === "medications" ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`} />
                      <span className="hidden sm:inline">Medications</span>
                      <span className="sm:hidden">Meds</span>
                      {prescriptions.length > 0 && (
                        <Badge className="ml-2 transition-all duration-200 animate-in fade-in bg-purple-600 text-white">
                          {prescriptions.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    
                    {/* Patient History Tab - Amber with distinct background */}
                    <TabsTrigger 
                      value="history" 
                      className={`px-4 py-3 rounded-t-lg font-medium transition-all duration-200 ${
                        activeTab === "history"
                          ? "bg-amber-100 border-b-3 border-amber-500 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                          : "text-gray-600 dark:text-gray-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
                      }`}
                    >
                      <History className={`h-4 w-4 mr-2 ${activeTab === "history" ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`} />
                      <span className="hidden sm:inline">Patient History</span>
                      <span className="sm:hidden">History</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* === TAB 1: VISIT NOTES === */}
                  <TabsContent value="notes">
                    <Card>
                      <CardHeader>
                        <CardTitle>Clinical Documentation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...form}>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Visit Info */}
                            <div>
                              <h3 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                                Visit Information
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="visitDate" render={({ field }) => ( <FormItem><FormLabel>Visit Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="visitType" render={({ field }) => ( <FormItem><FormLabel>Visit Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="consultation">Consultation</SelectItem><SelectItem value="follow-up">Follow-up</SelectItem><SelectItem value="emergency">Emergency</SelectItem><SelectItem value="preventive">Preventive Care</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="priority" render={({ field }) => ( <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="routine">Routine</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                              </div>
                            </div>

                            {/* SOAP Sections with Accordion */}
                            <Accordion type="multiple" defaultValue={["subjective"]} className="w-full space-y-3">
                              
                              {/* Subjective Section */}
                              <AccordionItem value="subjective" className="border rounded-lg px-4">
                                <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
                                  <span className="text-teal-700 dark:text-teal-400">Subjective (Chief Complaint)</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4">
                                  {/* Quick Complaint Chips */}
                                  <div className="mb-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                      Common Complaints (click to add)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                      {COMMON_COMPLAINTS.map((complaint) => (
                                        <button
                                          key={complaint}
                                          type="button"
                                          onClick={() => {
                                            const current = form.getValues("chiefComplaint") || "";
                                            const newValue = current 
                                              ? `${current}, ${complaint}` 
                                              : complaint;
                                            form.setValue("chiefComplaint", newValue);
                                          }}
                                          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-teal-100 dark:bg-gray-800 dark:hover:bg-teal-900 text-gray-700 dark:text-gray-300 rounded-full border border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-sm hover:shadow"
                                        >
                                          {complaint}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <FormField control={form.control} name="chiefComplaint" render={({ field }) => ( 
                                    <FormItem>
                                      <div className="flex items-center justify-between mb-2">
                                        <FormLabel>Chief Complaint Details</FormLabel>
                                        <Button 
                                          type="button"
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => startVoiceInput('chiefComplaint')}
                                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                        >
                                          <Mic className={`w-3 h-3 mr-1 ${isRecording.chiefComplaint ? 'animate-pulse text-red-500' : ''}`} />
                                          {isRecording.chiefComplaint ? 'Stop' : 'Dictate'}
                                        </Button>
                                      </div>
                                      <FormControl>
                                        <Textarea 
                                          ref={chiefComplaintRef}
                                          placeholder="What brings the patient in today?" 
                                          className="min-h-[60px] resize-y"
                                          {...field} 
                                          value={field.value ?? ""} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem> 
                                  )} />
                                </AccordionContent>
                              </AccordionItem>

                              {/* Objective Section */}
                              <AccordionItem value="objective" className="border rounded-lg px-4">
                                <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
                                  <span className="text-teal-700 dark:text-teal-400">Objective (Physical Exam & Vitals)</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-4">
                                  <div>
                                    <div className="font-medium mb-3 text-gray-800 dark:text-gray-200">Vital Signs</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <FormField control={form.control} name="temperature" render={({ field }) => ( <FormItem><FormLabel>Temperature (°C)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="36.5" {...field} value={field.value ?? ""} onChange={(e) => field.onChange( e.target.value ? parseFloat(e.target.value) : null )} /></FormControl><FormMessage /></FormItem> )} />
                                      <FormField control={form.control} name="bloodPressure" render={({ field }) => ( <FormItem><FormLabel>Blood Pressure</FormLabel><FormControl><Input placeholder="120/80" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                                      <FormField control={form.control} name="heartRate" render={({ field }) => ( <FormItem><FormLabel>Heart Rate (bpm)</FormLabel><FormControl><Input type="number" placeholder="72" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} /></FormControl><FormMessage /></FormItem> )} />
                                      <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="65.0" {...field} value={field.value ?? ""} onChange={(e) => field.onChange( e.target.value ? parseFloat(e.target.value) : null )} /></FormControl><FormMessage /></FormItem> )} />
                                    </div>
                                  </div>

                                  {/* Physical Examination with Structured Option */}
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <FormLabel>Physical Examination</FormLabel>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (useStructuredExam) {
                                            // Convert structured to freeform
                                            updateExaminationFromStructured(structuredExamFindings);
                                            // Keep the structured findings so user can switch back
                                          } else {
                                            // Convert freeform to structured
                                            const currentExam = form.getValues("examination") || "";
                                            if (currentExam.trim()) {
                                              const parsed = parseExaminationToStructured(currentExam);
                                              setStructuredExamFindings(parsed);
                                            }
                                          }
                                          setUseStructuredExam(!useStructuredExam);
                                        }}
                                        className="text-xs"
                                      >
                                        {useStructuredExam ? "Switch to Freeform" : "Switch to Structured"}
                                      </Button>
                                    </div>

                                    {useStructuredExam ? (
                                      <div className="space-y-3 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                                        {BODY_SYSTEMS.map((system) => (
                                          <div key={system.id} className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                              {system.label}
                                            </label>
                                            <Input
                                              placeholder={`Findings for ${system.label.toLowerCase()}...`}
                                              value={structuredExamFindings[system.id] || ""}
                                              onChange={(e) => {
                                                const newFindings = {
                                                  ...structuredExamFindings,
                                                  [system.id]: e.target.value
                                                };
                                                setStructuredExamFindings(newFindings);
                                              }}
                                              onBlur={() => {
                                                // Update form field when user finishes editing
                                                updateExaminationFromStructured(structuredExamFindings);
                                              }}
                                              className="text-sm"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <FormField control={form.control} name="examination" render={({ field }) => ( 
                                        <FormItem>
                                          <div className="flex items-center justify-between mb-2">
                                            <FormLabel>Physical Examination</FormLabel>
                                            <Button 
                                              type="button"
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => startVoiceInput('examination')}
                                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                            >
                                              <Mic className={`w-3 h-3 mr-1 ${isRecording.examination ? 'animate-pulse text-red-500' : ''}`} />
                                              {isRecording.examination ? 'Stop' : 'Dictate'}
                                            </Button>
                                          </div>
                                          <FormControl>
                                            <Textarea 
                                              ref={examinationRef}
                                              placeholder="Detailed examination findings..." 
                                              className="min-h-[60px] resize-y"
                                              {...field} 
                                              value={field.value ?? ""} 
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem> 
                                      )} />
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Assessment Section */}
                              <AccordionItem value="assessment" className="border rounded-lg px-4">
                                <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
                                  <span className="text-teal-700 dark:text-teal-400">Assessment (Diagnosis)</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4">
                                  {/* Common Diagnosis Chips */}
                                  <div className="mb-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                      Common Diagnoses (click to add)
                                    </label>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50 dark:bg-gray-900">
                                      {COMMON_DIAGNOSES.map((diagnosis) => (
                                        <button
                                          key={diagnosis}
                                          type="button"
                                          onClick={() => {
                                            const current = form.getValues("diagnosis") || "";
                                            const newValue = current 
                                              ? `${current}, ${diagnosis}` 
                                              : diagnosis;
                                            form.setValue("diagnosis", newValue);
                                          }}
                                          className="px-3 py-1.5 text-sm bg-white hover:bg-teal-100 dark:bg-gray-800 dark:hover:bg-teal-900 text-gray-700 dark:text-gray-300 rounded-full border border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-sm hover:shadow"
                                        >
                                          {diagnosis}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <FormField control={form.control} name="diagnosis" render={({ field }) => ( 
                                    <FormItem>
                                      <div className="flex items-center justify-between mb-2">
                                        <FormLabel>Diagnosis Details</FormLabel>
                                        <Button 
                                          type="button"
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => startVoiceInput('diagnosis')}
                                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                        >
                                          <Mic className={`w-3 h-3 mr-1 ${isRecording.diagnosis ? 'animate-pulse text-red-500' : ''}`} />
                                          {isRecording.diagnosis ? 'Stop' : 'Dictate'}
                                        </Button>
                                      </div>
                                      <FormControl>
                                        <Textarea 
                                          ref={diagnosisRef}
                                          placeholder="Primary and secondary diagnoses..." 
                                          className="min-h-[60px] resize-y"
                                          {...field} 
                                          value={field.value ?? ""} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem> 
                                  )} />
                                </AccordionContent>
                              </AccordionItem>

                              {/* Plan Section */}
                              <AccordionItem value="plan" className="border rounded-lg px-4">
                                <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
                                  <span className="text-teal-700 dark:text-teal-400">Plan (Treatment & Follow-up)</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-4">
                                  <FormField control={form.control} name="treatmentPlan" render={({ field }) => ( 
                                    <FormItem>
                                      <div className="flex items-center justify-between mb-2">
                                        <FormLabel>Treatment Plan</FormLabel>
                                        <Button 
                                          type="button"
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => startVoiceInput('treatmentPlan')}
                                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                        >
                                          <Mic className={`w-3 h-3 mr-1 ${isRecording.treatmentPlan ? 'animate-pulse text-red-500' : ''}`} />
                                          {isRecording.treatmentPlan ? 'Stop' : 'Dictate'}
                                        </Button>
                                      </div>
                                      <FormControl>
                                        <Textarea 
                                          ref={treatmentPlanRef}
                                          placeholder="Medications, procedures, recommendations..." 
                                          className="min-h-[60px] resize-y"
                                          {...field} 
                                          value={field.value ?? ""} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem> 
                                  )} />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="followUpDate" render={({ field }) => ( <FormItem><FormLabel>Follow-up Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="followUpType" render={({ field }) => ( <FormItem><FormLabel>Next Visit Type</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""}><FormControl><SelectTrigger><SelectValue placeholder="No follow-up needed" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No follow-up needed</SelectItem><SelectItem value="routine">Routine Follow-up</SelectItem><SelectItem value="urgent">Urgent Follow-up</SelectItem><SelectItem value="lab-results">Lab Results Review</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>

                            {/* Actions */}
                            <div className="flex gap-4 pt-6 mt-6 border-t">
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
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Button 
                            variant={qoTab === "all" ? "default" : "outline"} 
                            onClick={() => setQoTab("all")}
                            className={qoTab === "all" ? "shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
                          >
                            All Results
                          </Button>
                          {(["lab", "xray", "ultrasound"] as const).map((k) => {
                            const count = orders.filter((o: any) => o.type === k).length;
                            return (
                              <Button 
                                key={k} 
                                variant={qoTab === k ? "default" : "outline"} 
                                onClick={() => { setQoTab(k); setQoSearch(''); }}
                                className={`gap-2 ${qoTab === k ? "shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                              > 
                                {k === "lab" && (
                                  <>
                                    <Beaker className="h-4 w-4" />
                                    Lab
                                  </>
                                )}
                                {k === "xray" && (
                                  <>
                                    <Zap className="h-4 w-4" />
                                    X-Ray
                                  </>
                                )}
                                {k === "ultrasound" && (
                                  <>
                                    <Radio className="h-4 w-4" />
                                    Ultrasound
                                  </>
                                )}
                                {count > 0 && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`ml-1 px-1.5 py-0.5 text-xs ${
                                      qoTab === k 
                                        ? "bg-white/20 text-white" 
                                        : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                  >
                                    {count}
                                  </Badge>
                                )}
                              </Button>
                            );
                          })}
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
                                {/* LAB TESTS: Enhanced visual category cards */}
                                {qoTab === "lab" ? (
                                  <div className="space-y-6">
                                    {/* Visual Test Category Cards */}
                                    <div className="space-y-3">
                                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">Test Category</h3>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                          { value: 'hematology' as const, label: 'Blood Tests', description: 'Hematology & CBC', icon: '🩸' },
                                          { value: 'urine' as const, label: 'Urine Analysis', description: 'Urinalysis panels', icon: '🧪' },
                                          { value: 'stool' as const, label: 'Stool Analysis', description: 'Parasitology', icon: '💩' },
                                          { value: 'serology' as const, label: 'Serology', description: 'Infectious diseases', icon: '🦠' },
                                          { value: 'biochemistry' as const, label: 'Chemistry', description: 'Biochemistry tests', icon: '⚗️' },
                                          { value: 'hormones' as const, label: 'Hormones', description: 'Endocrine panels', icon: '💉' },
                                        ].map((cat) => {
                                          const isSelected = labCategory === cat.value;
                                          return (
                                            <button
                                              key={cat.value}
                                              type="button"
                                              onClick={() => {
                                                setLabCategory(cat.value);
                                                setCurrentLabCategory(cat.value);
                                                setLabSpecificTests([]);
                                              }}
                                              className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                                                isSelected
                                                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 shadow-lg scale-105'
                                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 hover:shadow-md'
                                              }`}
                                            >
                                              {isSelected && (
                                                <div className="absolute top-2 right-2">
                                                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                  </div>
                                                </div>
                                              )}
                                              <div className="text-3xl mb-2">{cat.icon}</div>
                                              <div className={`font-semibold text-sm mb-1 ${isSelected ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'}`}>
                                                {cat.label}
                                              </div>
                                              <div className={`text-xs ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {cat.description}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Quick Panels Section */}
                                    <div className="space-y-3">
                                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">Quick Panels (Common Test Bundles)</h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {[
                                          { 
                                            name: 'Malaria Screen', 
                                            icon: '🦟', 
                                            tests: ['Blood Film for Malaria (BFFM)', 'Complete Blood Count (CBC)'] 
                                          },
                                          { 
                                            name: 'Complete Blood Work', 
                                            icon: '🩸', 
                                            tests: ['Complete Blood Count (CBC)', 'Blood Group & Rh', 'ESR (Erythrocyte Sedimentation Rate)'] 
                                          },
                                          { 
                                            name: 'Basic Metabolic', 
                                            icon: '⚗️', 
                                            tests: ['Random Blood Sugar (RBS)', 'Renal Function Test (RFT)'] 
                                          },
                                          { 
                                            name: 'Fever Workup', 
                                            icon: '🤒', 
                                            tests: ['Blood Film for Malaria (BFFM)', 'Complete Blood Count (CBC)', 'Widal Test (Typhoid)'] 
                                          },
                                          { 
                                            name: 'Antenatal Panel', 
                                            icon: '🤰', 
                                            tests: ['Blood Group & Rh', 'Hemoglobin (HB)', 'Hepatitis B Test (HBsAg)', 'VDRL Test (Syphilis)'] 
                                          },
                                        ].map((panel) => (
                                          <button
                                            key={panel.name}
                                            type="button"
                                            onClick={() => {
                                              setSelectedLabTests(panel.tests);
                                              toast({ title: "Quick Panel Selected", description: `${panel.name} tests added` });
                                            }}
                                            className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
                                          >
                                            <span className="text-2xl">{panel.icon}</span>
                                            <div className="flex-1">
                                              <div className="font-semibold text-sm text-gray-900 dark:text-white">{panel.name}</div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400">{panel.tests.length} tests</div>
                                            </div>
                                            <Plus className="h-4 w-4 text-green-600" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Specific Tests Section */}
                                    <div>
                                      <label className="text-sm font-medium mb-2 block">Specific Tests in Category</label>
                                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                        {commonTests[currentLabCategory].map((test) => (
                                          <label key={test} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
                                            <Checkbox
                                              checked={selectedLabTests.includes(test)}
                                              onCheckedChange={() => handleLabTestToggle(test)}
                                              data-testid={`checkbox-lab-test-${test}`}
                                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                            />
                                            <span className="text-sm">{test}</span>
                                          </label>
                                        ))}
                                      </div>
                                      {selectedLabTests.length > 0 && (
                                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                            Selected ({selectedLabTests.length}): {selectedLabTests.join(", ")}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Priority Visual Buttons */}
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Priority Level</label>
                                      <div className="flex gap-2">
                                        {[
                                          { value: 'routine', label: 'Routine', color: 'gray', icon: '' },
                                          { value: 'urgent', label: '⚠️ Urgent', color: 'orange', icon: '' },
                                          { value: 'stat', label: '🚨 STAT', color: 'red', icon: '' },
                                        ].map((priority) => (
                                          <button
                                            key={priority.value}
                                            type="button"
                                            onClick={() => setLabPriority(priority.value as "routine" | "urgent" | "stat")}
                                            className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                                              labPriority === priority.value
                                                ? priority.color === 'gray'
                                                  ? 'bg-gray-600 text-white border-gray-600'
                                                  : priority.color === 'orange'
                                                  ? 'bg-orange-500 text-white border-orange-500'
                                                  : 'bg-red-600 text-white border-red-600'
                                                : priority.color === 'gray'
                                                ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-500'
                                                : priority.color === 'orange'
                                                ? 'bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600 hover:border-orange-500'
                                                : 'bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600 hover:border-red-500'
                                            }`}
                                            data-testid={`btn-priority-${priority.value}`}
                                          >
                                            {priority.label}
                                          </button>
                                        ))}
                                      </div>
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

                                    {/* Submit Button with Green/Teal Gradient */}
                                    <Button
                                      type="button"
                                      onClick={() => submitLabTestsMutation.mutate()}
                                      disabled={submitLabTestsMutation.isPending || selectedLabTests.length === 0}
                                      className="w-full bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white font-semibold"
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
                                  /* Other Services: X-Ray, Ultrasound with Clinical Notes */
                                  (() => {
                                    // Enhanced X-Ray ordering with visual selector and safety checklist
                                    if (qoTab === 'xray') {
                                      const xrayService = services.find((s: any) => matchesCategory(s, 'xray'));
                                      
                                      return (
                                        <div className="space-y-6">
                                          {/* Visual Exam Type Selector */}
                                          <div className="space-y-3">
                                            <h3 className="font-semibold text-base text-gray-900 dark:text-white">Select Exam Type</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                              {[
                                                { id: 'chest', emoji: '🫁', name: 'Chest X-Ray', desc: 'Thoracic imaging' },
                                                { id: 'extremity', emoji: '🦴', name: 'Extremity', desc: 'Arms, legs, joints' },
                                                { id: 'abdominal', emoji: '🫄', name: 'Abdominal', desc: 'Abdomen & pelvis' },
                                                { id: 'spine', emoji: '🦴', name: 'Spine', desc: 'Cervical to lumbar' },
                                                { id: 'skull', emoji: '💀', name: 'Skull/Head', desc: 'Cranial imaging' },
                                                { id: 'pelvic', emoji: '🦴', name: 'Pelvic', desc: 'Hip & pelvis' },
                                              ].map((type) => (
                                                <button
                                                  key={type.id}
                                                  type="button"
                                                  onClick={() => {
                                                    setXrayExamType(type.id);
                                                    setXrayBodyPart('');
                                                  }}
                                                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                                                    xrayExamType === type.id
                                                      ? 'bg-gradient-to-br from-blue-600 to-cyan-500 border-blue-500 text-white shadow-lg scale-[1.02]'
                                                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md'
                                                  }`}
                                                >
                                                  {xrayExamType === type.id && (
                                                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                                                      <Check className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                  )}
                                                  <div className="text-3xl mb-2">{type.emoji}</div>
                                                  <div className={`font-semibold text-sm mb-1 ${xrayExamType === type.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                    {type.name}
                                                  </div>
                                                  <div className={`text-xs ${xrayExamType === type.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {type.desc}
                                                  </div>
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Quick Exam Presets */}
                                          <div className="space-y-3">
                                            <h3 className="font-semibold text-base text-gray-900 dark:text-white">Quick Presets</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                              {[
                                                { emoji: '🚑', name: 'Trauma Screen', examType: 'extremity', bodyPart: 'Multiple', indication: 'Suspected fracture' },
                                                { emoji: '🫁', name: 'Respiratory Assessment', examType: 'chest', bodyPart: 'PA & Lateral', indication: 'Pneumonia evaluation' },
                                                { emoji: '🦴', name: 'Back Pain Evaluation', examType: 'spine', bodyPart: 'Lumbar spine', indication: 'Back pain assessment' },
                                                { emoji: '✅', name: 'Post-Operative Check', examType: 'chest', bodyPart: 'Chest AP', indication: 'Post-op monitoring' },
                                              ].map((preset) => (
                                                <button
                                                  key={preset.name}
                                                  type="button"
                                                  onClick={() => {
                                                    setXrayExamType(preset.examType);
                                                    setXrayBodyPart(preset.bodyPart);
                                                    setXrayClinicalInfo(preset.indication);
                                                    toast({ title: "Preset Applied", description: preset.name });
                                                  }}
                                                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                                                >
                                                  <span className="text-2xl">{preset.emoji}</span>
                                                  <div className="flex-1">
                                                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{preset.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{preset.indication}</div>
                                                  </div>
                                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Conditional Body Part Selectors */}
                                          {xrayExamType === 'extremity' && (
                                            <div className="space-y-3">
                                              <h3 className="font-semibold text-base text-gray-900 dark:text-white">Select Body Part</h3>
                                              <div className="grid grid-cols-4 gap-2">
                                                {['Left Hand', 'Right Hand', 'Left Wrist', 'Right Wrist', 
                                                  'Left Elbow', 'Right Elbow', 'Left Shoulder', 'Right Shoulder',
                                                  'Left Knee', 'Right Knee', 'Left Ankle', 'Right Ankle',
                                                  'Left Foot', 'Right Foot', 'Left Hip', 'Right Hip'].map((part) => (
                                                  <button
                                                    key={part}
                                                    type="button"
                                                    onClick={() => setXrayBodyPart(part)}
                                                    className={`p-2 text-sm rounded border-2 transition-all ${
                                                      xrayBodyPart === part
                                                        ? 'bg-blue-600 text-white border-blue-500'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                                                    }`}
                                                  >
                                                    {part}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {xrayExamType === 'chest' && (
                                            <div className="space-y-3">
                                              <h3 className="font-semibold text-base text-gray-900 dark:text-white">Select View</h3>
                                              <div className="grid grid-cols-3 gap-2">
                                                {['PA', 'AP', 'Lateral', 'AP & Lateral', 'Portable AP', 'Lordotic View'].map((view) => (
                                                  <button
                                                    key={view}
                                                    type="button"
                                                    onClick={() => setXrayBodyPart(view)}
                                                    className={`p-3 text-sm rounded border-2 transition-all ${
                                                      xrayBodyPart === view
                                                        ? 'bg-blue-600 text-white border-blue-500'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                                                    }`}
                                                  >
                                                    {view}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Clinical Information */}
                                          <div className="space-y-2">
                                            <label className="text-sm font-medium">Clinical Indication</label>
                                            <Textarea
                                              placeholder="Clinical indication, suspected diagnosis, relevant history..."
                                              rows={3}
                                              value={xrayClinicalInfo}
                                              onChange={(e) => setXrayClinicalInfo(e.target.value)}
                                              data-testid="textarea-xray-clinical-info"
                                            />
                                          </div>

                                          {/* Safety Checklist */}
                                          <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
                                            <h3 className="font-semibold text-base text-amber-900 dark:text-amber-300 flex items-center gap-2">
                                              <AlertCircle className="h-5 w-5" />
                                              Safety Checklist
                                            </h3>
                                            <div className="space-y-2">
                                              {[
                                                { id: 'pregnancy', icon: '🤰', label: 'Patient is not pregnant (or pregnancy status confirmed)', required: true },
                                                { id: 'metal', icon: '💍', label: 'Metal objects and jewelry removed from examination area', required: false },
                                                { id: 'cooperation', icon: '🙋', label: 'Patient can cooperate and follow positioning instructions', required: false },
                                              ].map((item) => {
                                                const isChecked = xraySafetyChecklist[item.id as keyof typeof xraySafetyChecklist] || false;
                                                
                                                return (
                                                  <label
                                                    key={item.id}
                                                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                                      isChecked
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800'
                                                        : item.required
                                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                  >
                                                    {/* Custom Checkbox */}
                                                    <div className={`
                                                      w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
                                                      ${isChecked
                                                        ? 'bg-green-600 border-green-600'
                                                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                                                      }
                                                    `}>
                                                      <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                          e.stopPropagation();
                                                          handleXraySafetyCheckChange(item.id, e.target.checked);
                                                        }}
                                                        className="sr-only"
                                                      />
                                                      {isChecked && <Check className="w-4 h-4 text-white stroke-[3]" />}
                                                    </div>
                                                    <div className="flex-1">
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-lg">{item.icon}</span>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
                                                        {item.required && (
                                                          <Badge variant="destructive" className="text-xs">REQUIRED</Badge>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </label>
                                                );
                                              })}
                                            </div>
                                            {!xraySafetyChecklist.pregnancy && (
                                              <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded text-sm text-red-900 dark:text-red-200">
                                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                                <span className="font-medium">Please confirm pregnancy status before proceeding</span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Submit Button */}
                                          <Button
                                            size="lg"
                                            onClick={() => {
                                              if (!xrayBodyPart && (xrayExamType === 'extremity' || xrayExamType === 'chest')) {
                                                toast({ 
                                                  title: "Selection Required", 
                                                  description: "Please select a body part or view", 
                                                  variant: "destructive" 
                                                });
                                                return;
                                              }
                                              if (xrayService) {
                                                orderXrayMutation.mutate({ 
                                                  service: xrayService, 
                                                  bodyPart: xrayBodyPart || xrayExamType 
                                                });
                                              }
                                            }}
                                            disabled={!xraySafetyChecklist.pregnancy || orderXrayMutation.isPending}
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold"
                                          >
                                            {orderXrayMutation.isPending ? (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                              <Zap className="h-4 w-4 mr-2" />
                                            )}
                                            {orderXrayMutation.isPending ? 'Ordering...' : 'Order X-Ray Exam'}
                                          </Button>
                                        </div>
                                      );
                                    }

                                    // Enhanced Ultrasound ordering with visual exam type cards
                                    if (qoTab === 'ultrasound') {
                                      const ultrasoundService = services.find((s: any) => matchesCategory(s, 'ultrasound'));
                                      
                                      // Ultrasound exam types mapping
                                      const ultrasoundExamTypes = [
                                        { value: 'cardiac', label: 'Cardiac/Echo', description: 'Heart & vessels', icon: '❤️' },
                                        { value: 'obstetric', label: 'Obstetric', description: 'Pregnancy imaging', icon: '🤰' },
                                        { value: 'abdominal', label: 'Abdominal', description: 'Abdomen & organs', icon: '👶' },
                                        { value: 'musculoskeletal', label: 'Musculoskeletal', description: 'Bones & joints', icon: '🔧' },
                                        { value: 'thoracic', label: 'Thoracic', description: 'Chest & lungs', icon: '🫁' },
                                        { value: 'vascular', label: 'Vascular', description: 'Blood vessels', icon: '🧠' },
                                        { value: 'pelvic', label: 'Pelvic', description: 'Pelvic organs', icon: '🩻' },
                                        { value: 'other', label: 'Other/Custom', description: 'Custom exam', icon: '🎯' },
                                      ];

                                      // Specific exams based on type
                                      const ultrasoundSpecificExams: Record<string, string[]> = {
                                        abdominal: ['Complete Abdomen', 'RUQ - Liver & Gallbladder', 'Renal (Kidneys & Bladder)', 'Appendix Study', 'Spleen'],
                                        obstetric: ['Dating Scan', 'Anatomy Scan', 'Growth Scan', 'Biophysical Profile'],
                                        pelvic: ['Transvaginal', 'Transabdominal', 'Bladder Assessment'],
                                        cardiac: ['2D Echo', 'Doppler Study', 'Stress Echo'],
                                        vascular: ['Carotid Doppler', 'Venous Doppler (Legs)', 'Arterial Doppler'],
                                        thoracic: ['Pleural Assessment', 'Lung Ultrasound'],
                                        musculoskeletal: ['Joint Assessment', 'Soft Tissue Mass', 'Tendon Evaluation'],
                                        other: [],
                                      };

                                      return (
                                        <div className="space-y-6">
                                          {/* Visual Examination Type Cards */}
                                          <div className="space-y-3">
                                            <h3 className="font-semibold text-base text-gray-900 dark:text-white">Examination Type</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                              {ultrasoundExamTypes.map((type) => {
                                                const isSelected = ultrasoundExamType === type.value;
                                                return (
                                                  <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => {
                                                      setUltrasoundExamType(type.value);
                                                      setUltrasoundSpecificExam('');
                                                    }}
                                                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                                                      isSelected
                                                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 shadow-lg scale-105'
                                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 hover:shadow-md'
                                                    }`}
                                                  >
                                                    {isSelected && (
                                                      <div className="absolute top-2 right-2">
                                                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                                          <Check className="w-4 h-4 text-white" />
                                                        </div>
                                                      </div>
                                                    )}
                                                    <div className="text-3xl mb-2">{type.icon}</div>
                                                    <div className={`font-semibold text-sm mb-1 ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>
                                                      {type.label}
                                                    </div>
                                                    <div className={`text-xs ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                      {type.description}
                                                    </div>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {/* Specific Exam (Quick Select) Section */}
                                          {ultrasoundSpecificExams[ultrasoundExamType] && ultrasoundSpecificExams[ultrasoundExamType].length > 0 && (
                                            <div className="space-y-3">
                                              <h3 className="font-semibold text-base text-gray-900 dark:text-white">Specific Exam (Quick Select)</h3>
                                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {ultrasoundSpecificExams[ultrasoundExamType].map((exam) => (
                                                  <button
                                                    key={exam}
                                                    type="button"
                                                    onClick={() => setUltrasoundSpecificExam(exam)}
                                                    className={`p-3 text-sm rounded-lg border-2 transition-all font-medium ${
                                                      ultrasoundSpecificExam === exam
                                                        ? 'bg-purple-600 text-white border-purple-500'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-purple-400 dark:hover:border-purple-600'
                                                    }`}
                                                  >
                                                    {exam}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Prominent Clinical Info Field */}
                                          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg space-y-2">
                                            <div className="flex items-center gap-2 mb-2">
                                              <label className="text-sm font-semibold text-purple-900 dark:text-purple-300">Clinical Information</label>
                                              <Badge className="bg-purple-600 text-white text-xs">Recommended</Badge>
                                            </div>
                                            <Textarea
                                              placeholder="Clinical indication, suspected diagnosis, relevant history..."
                                              rows={3}
                                              value={ultrasoundClinicalInfo}
                                              onChange={(e) => setUltrasoundClinicalInfo(e.target.value)}
                                              data-testid="textarea-ultrasound-clinical-info"
                                              className="border-purple-300 dark:border-purple-700 focus:ring-purple-500"
                                            />
                                            <p className="text-xs text-purple-700 dark:text-purple-400">
                                              💡 Tip: Include relevant symptoms, suspected conditions, and specific areas of concern for better diagnostic accuracy
                                            </p>
                                          </div>

                                          {/* Submit Button with Purple/Indigo Gradient */}
                                          <Button
                                            size="lg"
                                            onClick={() => {
                                              if (!ultrasoundService) {
                                                toast({ 
                                                  title: "Configuration Error", 
                                                  description: "Ultrasound service not found in system", 
                                                  variant: "destructive" 
                                                });
                                                return;
                                              }
                                              const examDescription = ultrasoundSpecificExam || ultrasoundExamType;
                                              orderUltrasoundMutation.mutate({ 
                                                service: ultrasoundService, 
                                                examType: examDescription
                                              });
                                            }}
                                            disabled={orderUltrasoundMutation.isPending || !ultrasoundService}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white font-semibold disabled:opacity-50"
                                          >
                                            {orderUltrasoundMutation.isPending ? (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                              <Radio className="h-4 w-4 mr-2" />
                                            )}
                                            {orderUltrasoundMutation.isPending ? 'Ordering...' : 'Order Ultrasound Exam'}
                                          </Button>
                                        </div>
                                      );
                                    }

                                    // All other tabs should just show services with Add button
                                    const rows = services
                                      .filter((s: any) => {
                                        return matchesCategory(s, qoTab as any);
                                      })
                                      .filter((s: any) => {
                                        if (!qoSearch) return true;
                                        const needle = qoSearch.toLowerCase();
                                        const name = s.name || "";
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
                                              <div className="font-medium truncate">{svc.name}</div>
                                              <div className="text-xs text-gray-500 truncate">
                                                {svc.description ? svc.description : (typeof svc.price === 'number' ? `Fee: ${svc.price}` : '')}
                                              </div>
                                            </div>
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
                            return false;
                          });

                          if (pendingOrders.length === 0) return null;

                          return (
                            <div className="mb-8 p-5 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 border-l-4 border-amber-500 rounded-xl shadow-md animate-in fade-in slide-in-from-top-2 duration-500">
                              <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-lg text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                  <Clock className="h-5 w-5 animate-pulse" />
                                  Pending Orders
                                  <Badge variant="secondary" className="bg-amber-600 text-white ml-2 px-2 py-0.5 text-sm font-bold">
                                    {pendingOrders.length}
                                  </Badge>
                                </h3>
                                <p className="text-sm text-amber-700 dark:text-amber-400">Awaiting processing</p>
                              </div>
                              <div className="space-y-3">
                                {pendingOrders.map((order: any, index: number) => (
                                  <div 
                                    key={order.orderId} 
                                    className="group p-4 bg-white dark:bg-gray-900 border-2 border-amber-200 dark:border-amber-800 rounded-lg shadow-sm hover:shadow-lg hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 animate-in fade-in slide-in-from-left-1"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Icon */}
                                      <div className="flex-shrink-0 mt-1">
                                        {getOrderIcon(order.type)}
                                      </div>
                                      
                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                          <div className="flex-1">
                                            <p className="font-semibold text-base text-gray-900 dark:text-white truncate">
                                              {(() => {
                                                // Use display helper functions for consistent labeling
                                                if (order.type === 'xray' && order.examType && order.bodyPart) {
                                                  const xrayData: XrayDisplayData = {
                                                    examType: order.examType,
                                                    bodyPart: order.bodyPart
                                                  };
                                                  return getXrayDisplayName(xrayData);
                                                }
                                                if (order.type === 'ultrasound' && order.examType) {
                                                  const ultrasoundData: UltrasoundDisplayData = {
                                                    examType: order.examType,
                                                    specificExam: order.specificExam
                                                  };
                                                  return getUltrasoundDisplayName(ultrasoundData);
                                                }
                                                // Fallback to name/description for other types
                                                return order.name || order.description;
                                              })()}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                              Ordered {timeAgo(order.createdAt)} • <span className="font-medium text-gray-700 dark:text-gray-300">{formatDepartmentName(order.department || order.type)}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-full border border-teal-200 dark:border-teal-800">
                                                Ordered by Doctor
                                              </Badge>
                                            </div>
                                            {order.totalPrice && (
                                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                                                Fee: {formatCurrency(order.totalPrice)}
                                              </p>
                                            )}
                                          </div>
                                          
                                          {/* Actions and Badge */}
                                          <div className="flex items-center gap-2">
                                            {order.type === 'lab' && (
                                              <div className="flex gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleEditLabTest(order)}
                                                  className="h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                  data-testid={`button-edit-lab-${order.orderId}`}
                                                >
                                                  <Edit className="w-3 h-3 mr-1" />
                                                  Edit
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleDeleteLabTest(order.testId)}
                                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                  data-testid={`button-delete-lab-${order.orderId}`}
                                                  disabled={!order.testId}
                                                >
                                                  <Trash2 className="w-3 h-3 mr-1" />
                                                  Delete
                                                </Button>
                                              </div>
                                            )}
                                            {order.type === 'xray' && (
                                              <div className="flex gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleEditXray(order)}
                                                  className="h-8 px-2 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                                                  data-testid={`button-edit-xray-${order.orderId}`}
                                                >
                                                  <Edit className="w-3 h-3 mr-1" />
                                                  Edit
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleDeleteXray(order.examId)}
                                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                  data-testid={`button-delete-xray-${order.orderId}`}
                                                  disabled={!order.examId}
                                                >
                                                  <Trash2 className="w-3 h-3 mr-1" />
                                                  Delete
                                                </Button>
                                              </div>
                                            )}
                                            {order.type === 'ultrasound' && (
                                              <div className="flex gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleEditUltrasound(order)}
                                                  className="h-8 px-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                  data-testid={`button-edit-ultrasound-${order.orderId}`}
                                                >
                                                  <Edit className="w-3 h-3 mr-1" />
                                                  Edit
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleDeleteUltrasound(order.examId)}
                                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                  data-testid={`button-delete-ultrasound-${order.orderId}`}
                                                  disabled={!order.examId}
                                                >
                                                  <Trash2 className="w-3 h-3 mr-1" />
                                                  Delete
                                                </Button>
                                              </div>
                                            )}
                                            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-400 dark:border-amber-600 font-semibold px-3 py-1 ml-2">
                                              Pending
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* --- Existing Results (Filtered + Enhanced Lab View) --- */}
                        <div className="space-y-4 mt-8 p-5 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 dark:from-green-950 dark:via-emerald-950 dark:to-blue-950 border-l-4 border-green-600 rounded-xl shadow-md">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-green-800 dark:text-green-300 flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Completed Results {qoTab !== 'all' ? `(${qoTab.charAt(0).toUpperCase() + qoTab.slice(1)})` : ''}
                            </h3>
                            {(() => {
                              const completedCount = 
                                labTests.filter((t: any) => t.status === "completed").length +
                                xrays.filter((x: any) => x.status === "completed").length +
                                ultrasounds.filter((u: any) => u.status === "completed").length;
                              return completedCount > 0 ? (
                                <Badge variant="secondary" className="bg-green-600 text-white px-2 py-0.5 text-sm font-bold">
                                  {completedCount}
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                          
                          {/* Labs */}
                          {(qoTab === "all" || qoTab === "lab") && labTests.filter((t: any) => t.status === "completed").length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Laboratory Tests</h4>
                              <div className="space-y-3">
                                {labTests.filter((t: any) => t.status === "completed").map((test: any) => {
                                  const parsedResults = parseJSON<Record<string, Record<string, string>>>(test.results, {});
                                  const testsOrdered = parseJSON<string[]>(test.tests, []);
                                  
                                  // Extract key finding using centralized medical criteria
                                  const keyFinding = extractLabKeyFinding(parsedResults);
                                  
                                  const getTestTitle = () => {
                                    if (testsOrdered.length === 0) {
                                      return test.category 
                                        ? test.category.charAt(0).toUpperCase() + test.category.slice(1)
                                        : "Laboratory Test";
                                    }
                                    const count = testsOrdered.length;
                                    const testLabel = count === 1 ? "Lab Test" : "Lab Tests";
                                    const preview = testsOrdered.slice(0, 2).join(", ");
                                    const hasMore = testsOrdered.length > 2;
                                    return `${count} ${testLabel} (${preview}${hasMore ? "..." : ""})`;
                                  };
                                  
                                  return (
                                    <div 
                                      key={test.testId || test.orderId}
                                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                                    >
                                      {/* Header Row */}
                                      <div className="p-4 flex justify-between items-start gap-3">
                                        <div className="flex items-center gap-2 flex-1">
                                          <FlaskConical className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                          <div>
                                            <p className="font-semibold text-base">{getTestTitle()}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                <Check className="h-3 w-3 mr-1" />
                                                Completed
                                              </Badge>
                                              {!test.isPaid && (<Badge variant="destructive" className="bg-red-600">UNPAID</Badge>)}
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Requested {formatClinicDayKey(test.requestedDate)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Tests Ordered */}
                                      {testsOrdered.length > 0 && (
                                        <div className="px-4 pb-2">
                                          <div className="flex flex-wrap gap-1">
                                            {testsOrdered.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
                                          </div>
                                        </div>
                                      )}

                                      {/* Key Finding Preview */}
                                      {keyFinding && (
                                        <div className="mx-4 mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md" role="alert" aria-live="assertive">
                                          <div className="flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-1">KEY FINDING</p>
                                              <p className="text-sm text-red-900 dark:text-red-100 line-clamp-2">{keyFinding}</p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* View Full Report Button */}
                                      <div className="px-4 pb-4">
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="w-full" 
                                          onClick={() => openResult("lab", test)}
                                          data-testid={`view-details-lab-${test.id}`}
                                        >
                                          View Full Report →
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* X-rays */}
                           {(qoTab === "all" || qoTab === "xray") && xrays.filter((x: any) => x.status === "completed").length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">X-Ray Examinations</h4>
                              <div className="space-y-3">
                                {xrays.filter((x: any) => x.status === "completed").map((x: any) => (
                                  <div 
                                    key={x.examId || x.orderId} 
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                                  >
                                    {/* Header Row */}
                                    <div className="p-4 flex justify-between items-start gap-3">
                                      <div className="flex items-center gap-2 flex-1">
                                        <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                        <div>
                                          <p className="font-semibold text-base">{getXrayDisplayName(x)}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                              <Check className="h-3 w-3 mr-1" />
                                              Completed
                                            </Badge>
                                            {!x.isPaid && (<Badge variant="destructive" className="bg-red-600">UNPAID</Badge>)}
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              Completed {timeAgo(x.completedAt || x.resultDate || x.updatedAt)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Quick Info Row */}
                                    <div className="px-4 pb-2 grid grid-cols-2 gap-2 text-xs">
                                      {x.viewDescriptions && (
                                        <div className="flex items-start gap-1">
                                          <Camera className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                          <span className="text-gray-700 dark:text-gray-300 line-clamp-1">
                                            <span className="font-semibold">View:</span> {x.viewDescriptions.includes('.') ? x.viewDescriptions.split('.')[0] : x.viewDescriptions}
                                          </span>
                                        </div>
                                      )}
                                      {x.imageQuality && (
                                        <div className="flex items-start gap-1">
                                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                          <span className="text-gray-700 dark:text-gray-300 line-clamp-1">
                                            <span className="font-semibold">Quality:</span> {x.imageQuality.replace('-', ' - ')}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Findings Preview */}
                                    {x.findings && (
                                      <div className="mx-4 mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                        <div className="flex items-start gap-2">
                                          <Activity className="h-4 w-4 text-blue-700 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">KEY FINDING</p>
                                            <p className="text-sm text-blue-900 dark:text-blue-100 line-clamp-2">{x.findings}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Impression Preview (if available) */}
                                    {x.impression && (
                                      <div className="mx-4 mb-3 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-md">
                                        <div className="flex items-start gap-2">
                                          <FileText className="h-4 w-4 text-purple-700 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">IMPRESSION</p>
                                            <p className="text-sm text-purple-900 dark:text-purple-100 line-clamp-2">{x.impression}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* View Full Report Button */}
                                    <div className="px-4 pb-4">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full" 
                                        onClick={() => openResult("xray", x)}
                                      >
                                        View Full Report →
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ultrasound */}
                          {(qoTab === "all" || qoTab === "ultrasound") && ultrasounds.filter((u: any) => u.status === "completed").length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Ultrasound Examinations</h4>
                              <div className="space-y-3">
                                {ultrasounds.filter((u: any) => u.status === "completed").map((u: any) => (
                                  <div 
                                    key={u.examId || u.orderId} 
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                                  >
                                    {/* Header Row */}
                                    <div className="p-4 flex justify-between items-start gap-3">
                                      <div className="flex items-center gap-2 flex-1">
                                        <Radio className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                        <div>
                                          <p className="font-semibold text-base">{getUltrasoundDisplayName(u)}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                              <Check className="h-3 w-3 mr-1" />
                                              Completed
                                            </Badge>
                                            {!u.isPaid && (<Badge variant="destructive" className="bg-red-600">UNPAID</Badge>)}
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              Completed {timeAgo(u.completedAt || u.resultDate || u.updatedAt)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Findings Preview */}
                                    {u.findings && (
                                      <div className="mx-4 mb-3 p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-md">
                                        <div className="flex items-start gap-2">
                                          <Activity className="h-4 w-4 text-teal-700 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-teal-900 dark:text-teal-100 mb-1">SONOGRAPHIC FINDINGS</p>
                                            <p className="text-sm text-teal-900 dark:text-teal-100 line-clamp-2">{u.findings}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Impression Preview (if available) */}
                                    {u.impression && (
                                      <div className="mx-4 mb-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                                        <div className="flex items-start gap-2">
                                          <FileText className="h-4 w-4 text-green-700 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">KEY FINDING</p>
                                            <p className="text-sm text-green-900 dark:text-green-100 line-clamp-2 font-medium">{u.impression}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* View Full Report Button */}
                                    <div className="px-4 pb-4">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full" 
                                        onClick={() => openResult("ultrasound", u)}
                                      >
                                        View Full Report →
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty State */}
                          {qoTab !== 'all' && labTests.filter((t: LabTest) => t.status === "completed").length === 0 && xrays.filter((x: any) => x.status === "completed").length === 0 && ultrasounds.filter((u: any) => u.status === "completed").length === 0 && (
                             <div className="text-center py-12 px-6 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                              <div className="flex flex-col items-center gap-4">
                                {qoTab === 'lab' && <Beaker className="h-16 w-16 text-blue-300 dark:text-blue-700" />}
                                {qoTab === 'xray' && <Zap className="h-16 w-16 text-cyan-300 dark:text-cyan-700" />}
                                {qoTab === 'ultrasound' && <Radio className="h-16 w-16 text-indigo-300 dark:text-indigo-700" />}
                                <div>
                                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No {qoTab} results yet</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Order tests using the form above</p>
                                </div>
                              </div>
                            </div>
                          )}
                           {qoTab === 'all' && labTests.filter((t: LabTest) => t.status === "completed").length === 0 && xrays.filter((x: any) => x.status === "completed").length === 0 && ultrasounds.filter((u: any) => u.status === "completed").length === 0 && (
                            <div className="text-center py-12 px-6 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                              <div className="flex flex-col items-center gap-4">
                                <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700" />
                                <div>
                                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No results yet</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Order diagnostic tests to see results here</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* === TAB 3: MEDICATIONS === */}
                  <TabsContent value="medications">
                    <Card>
                      <CardHeader><CardTitle>Medication Orders</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          
                          {/* === 2. CURRENT/ACTIVE MEDICATIONS SECTION (HIGH PRIORITY) === */}
                          <div className="mb-8 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl shadow-md">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-bold flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                Current Medications
                              </h3>
                              <Badge variant="secondary" className="bg-blue-600 text-white">
                                {prescriptions.filter(p => p.status !== 'cancelled').length} active
                              </Badge>
                            </div>

                            {prescriptions.filter(p => p.status !== 'cancelled').length === 0 ? (
                              <p className="text-sm text-gray-600 dark:text-gray-400 italic">No active medications on record</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {prescriptions.filter(p => p.status !== 'cancelled').map((med) => (
                                  <div key={med.orderId} className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white">{med.drugName || "Medication"}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{med.dosage || "Dose not recorded"}</p>
                                        {med.route && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Route: {med.route}
                                          </p>
                                        )}
                                        {med.duration && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Duration: {med.duration}
                                          </p>
                                        )}
                                        {med.instructions && (
                                          <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                                            {med.instructions}
                                          </p>
                                        )}
                                        <div className="flex flex-col gap-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                          {/* Always show prescribed date */}
                                          {(() => {
                                            const isoDate = ensureISOFormat(med.createdAt);
                                            if (!isoDate) return null;
                                            const formattedDate = formatClinicDateTime(isoDate, 'MMM d, yyyy');
                                            if (formattedDate === '—') return null;
                                            return (
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Prescribed: {formattedDate}
                                              </span>
                                            );
                                          })()}
                                          
                                          {/* Show dispensed date if status is dispensed */}
                                          {(() => {
                                            if (med.status !== "dispensed") return null;
                                            const isoDate = ensureISOFormat(med.dispensedAt);
                                            if (!isoDate) return null;
                                            const formattedDate = formatClinicDateTime(isoDate, 'MMM d, yyyy');
                                            if (formattedDate === '—') return null;
                                            return (
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Dispensed: {formattedDate}
                                              </span>
                                            );
                                          })()}
                                        </div>

                                        {/* Status badge BELOW the dates */}
                                        <Badge variant={med.status === "dispensed" ? "default" : "secondary"} className={`text-xs mt-2 ${med.status === "dispensed" ? "bg-green-600" : ""}`}>
                                          {getMedicationStatusLabel(med.status)}
                                        </Badge>
                                      </div>
                                      <div className="flex gap-2">
                                        {med.status === "prescribed" && med.paymentStatus === "unpaid" && (
                                          <>
                                            <Button variant="outline" size="sm" onClick={() => handleEditCurrentMedication(med)} className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20" data-testid={`btn-edit-${med.orderId}`}>
                                              <RefreshCw className="w-3 h-3 mr-1" />
                                              Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => {
                                              if (window.confirm("Cancel this prescription?")) {
                                                cancelPrescriptionMutation.mutate(med.orderId);
                                              }
                                            }} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" data-testid={`btn-cancel-${med.orderId}`}>
                                              <XCircle className="w-3 h-3" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* === SECTION: ORDER NEW MEDICATIONS === */}
                          <div className="mt-6 space-y-6">
                            {/* Section Header - NOT collapsible */}
                            <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Order New Medications</h3>
                            </div>
                            
                            <div className="p-6 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm space-y-6">
                              {/* Allergy Warning */}
                              {allergies.length > 0 && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 rounded">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                    <div>
                                      <p className="font-semibold text-red-900 dark:text-red-100 text-sm">Patient has known allergies:</p>
                                      <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                                        {allergies.map(a => a.name).join(", ")}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* === RECENTLY PRESCRIBED QUICK ACCESS === */}
                              {(() => {
                                // Get unique drug IDs from recent prescriptions (last 30 days)
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                
                                const recentDrugIds = new Set(
                                  allPrescriptions
                                    .filter(rx => new Date(rx.createdAt) >= thirtyDaysAgo)
                                    .map(rx => rx.drugId)
                                    .filter(Boolean)
                                );
                                
                                const recentlyPrescribed = drugs.filter(d => recentDrugIds.has(d.id)).slice(0, 5);
                                
                                if (recentlyPrescribed.length === 0) return null;
                                
                                return (
                                  <div className="mb-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recently Prescribed:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {recentlyPrescribed.map(drug => (
                                        <button
                                          key={drug.id}
                                          onClick={() => {
                                            setSelectedDrugId(drug.id.toString());
                                            setSelectedDrugName(drug.genericName || drug.name);
                                            // Find a recent prescription for this drug to pre-fill dosage
                                            const recentRx = allPrescriptions.find(rx => rx.drugId === drug.id);
                                            if (recentRx) {
                                              setNewMedDosage(recentRx.dosage || "");
                                                setNewMedQuantity(recentRx.quantity || 1);
                                                setNewMedInstructions(recentRx.instructions || "");
                                              }
                                              toast({ 
                                                title: "Quick Prescription", 
                                                description: `${drug.genericName || drug.name} selected. Previous dosage pre-filled.` 
                                              });
                                            }}
                                            className="px-3 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors border border-purple-200 dark:border-purple-800"
                                            type="button"
                                          >
                                            {drug.genericName || drug.name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                                
                                {/* === COMMON MEDICATIONS - COLLAPSIBLE === */}
                                <div>
                                  <button
                                    onClick={() => setShowCommonMedications(!showCommonMedications)}
                                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 mb-3 transition-colors"
                                    type="button"
                                  >
                                    {showCommonMedications ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                    <span className="font-medium">Common Medications (Click to use)</span>
                                    <span className="text-gray-400 dark:text-gray-500">- Quick select</span>
                                  </button>
                                  
                                  {showCommonMedications && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6 animate-in slide-in-from-top-2">
                                {COMMON_MEDICATIONS.map((drug) => (
                                  <div
                                    key={drug.id}
                                    className={`
                                      p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                      hover:shadow-lg hover:scale-105
                                      ${selectedCommonDrug === drug.id 
                                        ? 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-500 dark:border-purple-700 shadow-md' 
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                                      }
                                    `}
                                    onClick={() => {
                                      setSelectedCommonDrug(drug.id);
                                      setNewMedDosage(drug.defaultDosage);
                                      setNewMedDuration(drug.defaultDuration);
                                      setNewMedQuantity(drug.defaultQuantity);
                                      // Try to find matching drug in inventory
                                      const matchingDrug = drugs.find(d => 
                                        (d.genericName || d.name).toLowerCase().includes(drug.name.split(' ')[0].toLowerCase())
                                      );
                                      if (matchingDrug) {
                                        setSelectedDrugId(matchingDrug.id.toString());
                                        setSelectedDrugName(matchingDrug.genericName || matchingDrug.name);
                                      }
                                      toast({ title: "Quick Prescription", description: `${drug.name} template loaded. Adjust as needed.` });
                                    }}
                                  >
                                    <div className="text-3xl mb-2">{drug.emoji}</div>
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">{drug.name.split(' ')[0]}</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{drug.category}</p>
                                    {drug.stockLevel !== undefined && (
                                      <div className="mt-2 flex items-center gap-1">
                                        <Package className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                        <span className={`text-xs ${drug.stockLevel < 20 ? 'text-amber-600 dark:text-amber-400 font-medium' : drug.stockLevel === 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                          {drug.stockLevel === 0 ? 'Out of stock' : `${drug.stockLevel} in stock`}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                                  )}
                                </div>
                          
                          {/* === PRESCRIPTION FORM - ALWAYS VISIBLE === */}
                          <div id="medication-order-form" className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Drug</label>
                              <Popover open={drugSearchOpen} onOpenChange={setDrugSearchOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={drugSearchOpen}
                                    className="w-full justify-between border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-600"
                                    data-testid="select-drug"
                                  >
                                    {selectedDrugId ? (() => {
                                      const drug = drugs.find((d) => d.id.toString() === selectedDrugId);
                                      return drug ? (
                                        <span className="flex items-center gap-2">
                                          <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                          {drug.genericName || drug.name} - {drug.strength}
                                        </span>
                                      ) : <span className="text-gray-500">Search medications...</span>;
                                    })() : (
                                      <span className="text-gray-500">Search medications...</span>
                                    )}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Type to search drugs..." 
                                      value={drugSearchQuery}
                                      onValueChange={setDrugSearchQuery}
                                      className="border-none focus:ring-0"
                                    />
                                    <CommandList className="max-h-[300px]">
                                      <CommandEmpty>
                                        <div className="p-4 text-center text-gray-500">
                                          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                          <p>No medications found</p>
                                          <p className="text-xs">Try a different search term</p>
                                        </div>
                                      </CommandEmpty>
                                      
                                      {/* Group by category */}
                                      {drugCategories.length > 0 ? drugCategories.map(category => {
                                        const categoryDrugs = filteredDrugs.filter(d => d.category === category);
                                        if (categoryDrugs.length === 0) return null;
                                        
                                        return (
                                          <CommandGroup key={category} heading={category || "Other"}>
                                            {categoryDrugs.map(drug => (
                                              <CommandItem
                                                key={drug.id}
                                                value={`${drug.name}-${drug.id}`}
                                                onSelect={() => {
                                                  setSelectedDrugId(drug.id.toString());
                                                  setSelectedDrugName(drug.genericName || drug.name);
                                                  setDrugSearchOpen(false);
                                                  setDrugSearchQuery("");
                                                }}
                                                className="flex items-center justify-between p-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Pill className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                                  <div>
                                                    <p className="font-medium">{drug.genericName || drug.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{drug.strength} • {drug.form || 'N/A'}</p>
                                                  </div>
                                                </div>
                                                <div className="text-right">
                                                  {drug.stockLevel !== undefined && (
                                                    <span className={`text-xs ${
                                                      drug.stockLevel === 0 ? 'text-red-600 dark:text-red-400' :
                                                      drug.stockLevel < 20 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                      {drug.stockLevel === 0 ? 'Out of stock' : `${drug.stockLevel} in stock`}
                                                    </span>
                                                  )}
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        );
                                      }) : (
                                        <CommandGroup>
                                          {filteredDrugs.map(drug => (
                                            <CommandItem
                                              key={drug.id}
                                              value={`${drug.name}-${drug.id}`}
                                              onSelect={() => {
                                                setSelectedDrugId(drug.id.toString());
                                                setSelectedDrugName(drug.genericName || drug.name);
                                                setDrugSearchOpen(false);
                                                setDrugSearchQuery("");
                                              }}
                                              className="flex items-center justify-between p-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                            >
                                              <div className="flex items-center gap-2">
                                                <Pill className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                                <div>
                                                  <p className="font-medium">{drug.genericName || drug.name}</p>
                                                  <p className="text-xs text-gray-500 dark:text-gray-400">{drug.strength} • {drug.form || 'N/A'}</p>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                {drug.stockLevel !== undefined && (
                                                  <span className={`text-xs ${
                                                    drug.stockLevel === 0 ? 'text-red-600 dark:text-red-400' :
                                                    drug.stockLevel < 20 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'
                                                  }`}>
                                                    {drug.stockLevel === 0 ? 'Out of stock' : `${drug.stockLevel} in stock`}
                                                  </span>
                                                )}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      )}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              
                              {/* === 3. ALLERGY ALERT COMPONENT (HIGH PRIORITY) === */}
                              {selectedDrugId && (() => {
                                const drug = drugs.find((d) => d.id.toString() === selectedDrugId);
                                if (!drug) return null;
                                const allergyCheck = checkDrugAllergy(drug, allergies);
                                if (!allergyCheck.hasAllergy) return null;
                                return (
                                  <div className="mt-4 flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-2 border-red-400 dark:border-red-600 rounded-xl animate-pulse shadow-lg">
                                    <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-red-900 dark:text-red-100 text-lg flex items-center gap-2">
                                        ⚠️ ALLERGY ALERT!
                                        <Badge variant="destructive" className="animate-bounce">Critical</Badge>
                                      </p>
                                      <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                                        Patient has documented allergy to <strong>{drug.genericName || drug.name}</strong> or related medications.
                                      </p>
                                      {allergyCheck.matchedAllergy && (
                                        <p className="text-xs text-red-700 dark:text-red-300 mt-2 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                                          Previous reaction: {allergyCheck.matchedAllergy.reaction || "See patient record"}
                                        </p>
                                      )}
                                      <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                                        ⚠️ Do NOT prescribe unless absolutely necessary with appropriate precautions
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                              
                              {/* === 4. STOCK LEVEL WARNING === */}
                              {selectedDrugId && (() => {
                                const drug = drugs.find((d) => d.id.toString() === selectedDrugId);
                                if (!drug || drug.stockLevel === undefined) return null;
                                
                                if (drug.stockLevel === 0) {
                                  return (
                                    <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">Out of Stock</p>
                                        <p className="text-xs text-red-800 dark:text-red-200">Cannot prescribe - medication out of stock</p>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                if (drug.stockLevel < 20) {
                                  return (
                                    <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg">
                                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Low Stock Warning</p>
                                        <p className="text-xs text-amber-800 dark:text-amber-200">Only {drug.stockLevel} units available in pharmacy</p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            
                            {/* === 5. ROUTE OF ADMINISTRATION DROPDOWN === */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Route of Administration</label>
                              <Select value={newMedRoute} onValueChange={setNewMedRoute} defaultValue="oral">
                                <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="oral">💊 Oral (by mouth)</SelectItem>
                                  <SelectItem value="iv">💉 Intravenous (IV)</SelectItem>
                                  <SelectItem value="im">💉 Intramuscular (IM)</SelectItem>
                                  <SelectItem value="sc">💉 Subcutaneous (SC)</SelectItem>
                                  <SelectItem value="topical">🧴 Topical (on skin)</SelectItem>
                                  <SelectItem value="inhalation">🌬️ Inhalation</SelectItem>
                                  <SelectItem value="rectal">Rectal</SelectItem>
                                  <SelectItem value="sublingual">👅 Under tongue</SelectItem>
                                  <SelectItem value="ophthalmic">👁️ Eye drops</SelectItem>
                                  <SelectItem value="otic">👂 Ear drops</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dosage Instructions</label>
                              <Select value={newMedDosage} onValueChange={setNewMedDosage}>
                                <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500" data-testid="select-dosage">
                                  <SelectValue placeholder="Select or type dosage..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {DOSAGE_PRESETS.map((preset) => (
                                    <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input 
                                placeholder="Or type custom dosage..." 
                                value={newMedDosage} 
                                onChange={(e) => setNewMedDosage(e.target.value)} 
                                data-testid="input-dosage" 
                                className="mt-2 border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                              <Select value={newMedDuration} onValueChange={setNewMedDuration}>
                                <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500" data-testid="select-duration">
                                  <SelectValue placeholder="Select duration..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {DURATION_PRESETS.map((preset) => (
                                    <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                                  ))}
                                  <SelectItem value="As needed">As needed</SelectItem>
                                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="e.g., 30" 
                                value={newMedQuantity} 
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setNewMedQuantity(isNaN(val) ? 1 : Math.max(1, val));
                                }} 
                                data-testid="input-quantity"
                                className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                              />
                              
                              {/* === 7. AUTO-CALCULATE QUANTITY WITH VISUAL BREAKDOWN === */}
                              {newMedDosage && newMedDuration && (
                                <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border border-purple-200 dark:border-purple-800 rounded-lg">
                                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1 flex items-center gap-2">
                                    <Calculator className="w-4 h-4" />
                                    Auto-Calculated Quantity
                                  </p>
                                  <p className="text-xs text-purple-800 dark:text-purple-200">
                                    <strong>{newMedQuantity}</strong> tablets = {newMedDosage} × {newMedDuration}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* === 6. VOICE DICTATION FOR ADDITIONAL INSTRUCTIONS === */}
                            <div className="space-y-2 sm:col-span-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Instructions</label>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={startInstructionsVoiceInput}
                                  className={`text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${isRecordingInstructions ? 'animate-pulse bg-purple-100 dark:bg-purple-900/30' : ''}`}
                                  type="button"
                                >
                                  <Mic className={`w-4 h-4 mr-1 ${isRecordingInstructions ? 'text-red-600 dark:text-red-400' : ''}`} />
                                  {isRecordingInstructions ? 'Stop' : 'Dictate'}
                                </Button>
                              </div>
                              <Textarea
                                placeholder="e.g., Take with food, avoid alcohol, complete full course..."
                                value={newMedInstructions}
                                onChange={(e) => setNewMedInstructions(e.target.value)}
                                rows={3}
                                className="resize-none border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                                data-testid="input-instructions"
                              />
                              {isRecordingInstructions && (
                                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                                  <span className="inline-block w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-pulse"></span>
                                  Listening...
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
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
                                
                                // If we're editing a Current Medication, update it via the edit prescription mutation
                                if (editingCurrentMedication) {
                                  editPrescriptionMutation.mutate({
                                    orderId: editingCurrentMedication.orderId,
                                    dosage: newMedDosage,
                                    quantity: newMedQuantity,
                                    instructions: newMedInstructions,
                                  });
                                  // Reset form
                                  setSelectedDrugId("");
                                  setSelectedDrugName("");
                                  setNewMedDosage("");
                                  setNewMedQuantity(1);
                                  setNewMedInstructions("");
                                  setNewMedDuration("");
                                  setNewMedRoute("oral");
                                  setSelectedCommonDrug(null);
                                  setEditingCurrentMedication(null);
                                  return;
                                }
                                
                                // Otherwise, add to order list as normal
                                setMedications([...medications, {
                                  drugId: parseInt(selectedDrugId),
                                  drugName: selectedDrugName,
                                  dosage: newMedDosage,
                                  quantity: newMedQuantity,
                                  instructions: newMedInstructions,
                                  duration: newMedDuration,
                                  route: newMedRoute,
                                }]);
                                setSelectedDrugId("");
                                setSelectedDrugName("");
                                setNewMedDosage("");
                                setNewMedQuantity(1);
                                setNewMedInstructions("");
                                setNewMedDuration("");
                                setNewMedRoute("oral");
                                setSelectedCommonDrug(null);
                                toast({ 
                                  title: (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                      <span>{selectedDrugName} added</span>
                                    </div>
                                  ),
                                  description: "Click \"Submit to Pharmacy\" when ready" 
                                });
                              }}
                              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white"
                              data-testid="btn-add-medication"
                            >
                              {editingCurrentMedication ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Update Medication
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add to Order List
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSelectedDrugId("");
                                setSelectedDrugName("");
                                setNewMedDosage("");
                                setNewMedQuantity(1);
                                setNewMedInstructions("");
                              setNewMedDuration("");
                              setNewMedRoute("oral");
                              setSelectedCommonDrug(null);
                              setEditingCurrentMedication(null);
                            }}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            type="button"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                            </div>
                          </div>

                          {/* === 1. MEDICATION ORDER LIST / SHOPPING CART (HIGH PRIORITY) === */}
                          {medications.length > 0 && (
                            <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-2 border-purple-200 dark:border-purple-800 rounded-xl shadow-lg">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-purple-900 dark:text-purple-100">
                                  <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                  Prescription Order List
                                  <Badge variant="secondary" className="ml-2 bg-purple-600 text-white">
                                    {medications.length}
                                  </Badge>
                                </h3>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setMedications([])} 
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  type="button"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Clear All
                                </Button>
                              </div>

                              <div className="space-y-3">
                                {medications.map((order, index) => (
                                  <div key={index} className="flex items-start justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <p className="font-semibold text-gray-900 dark:text-white">{order.drugName}</p>
                                      </div>
                                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5 ml-6">
                                        <p><strong>Dosage:</strong> {order.dosage}</p>
                                        {order.route && <p><strong>Route:</strong> {order.route}</p>}
                                        {order.duration && <p><strong>Duration:</strong> {order.duration}</p>}
                                        <p><strong>Quantity:</strong> {order.quantity} units</p>
                                        {order.instructions && (
                                          <p className="italic text-gray-600 dark:text-gray-400">"{order.instructions}"</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setMedications(medications.filter((_, i) => i !== index))} 
                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        type="button"
                                        data-testid={`btn-remove-med-${index}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Submit Actions */}
                              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <Button 
                                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-700 dark:to-indigo-700 dark:hover:from-purple-800 dark:hover:to-indigo-800 text-white shadow-lg" 
                                  onClick={() => submitMedicationsMutation.mutate(medications)}
                                  disabled={submitMedicationsMutation.isPending}
                                  type="button"
                                  data-testid="btn-submit-medications"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  {submitMedicationsMutation.isPending ? "Submitting..." : `Submit to Pharmacy (${medications.length})`}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowPrescription(true)} 
                                  className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                  type="button"
                                >
                                  <Printer className="w-4 h-4 mr-2" />
                                  Print
                                </Button>
                              </div>
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
                         <div className="flex items-center justify-between">
                           <CardTitle>Patient History</CardTitle>
                           {recentTreatments.length > 0 && (
                             <Badge variant="secondary" className="bg-blue-600 text-white px-3 py-1">
                               {recentTreatments.filter(tx => tx.encounterId !== currentEncounter?.encounterId).length} Previous Visits
                             </Badge>
                           )}
                         </div>
                       </CardHeader>
                       <CardContent>
                         <p className="text-sm text-muted-foreground mb-4">Past visit history for this patient. Current visit is not shown here.</p>
                         {/* Filter out current encounter to avoid duplication */}
                         {(() => {
                           const pastVisits = recentTreatments.filter(tx => 
                             tx.encounterId !== currentEncounter?.encounterId
                           );
                           return pastVisits.length > 0 ? (
                           <div className="space-y-3">
                             {pastVisits.map((tx) => {
                               const isExpanded = expandedVisits.has(tx.treatmentId.toString());
                               // Color-code by visit type
                               const visitTypeColors: Record<string, { bg: string; border: string; badge: string }> = {
                                 consultation: { bg: 'from-blue-50/50 to-white dark:from-gray-800 dark:to-gray-900', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-600' },
                                 emergency: { bg: 'from-red-50/50 to-white dark:from-gray-800 dark:to-gray-900', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-600' },
                                 followup: { bg: 'from-green-50/50 to-white dark:from-gray-800 dark:to-gray-900', border: 'border-green-200 dark:border-green-800', badge: 'bg-green-600' },
                               };
                               const colors = visitTypeColors[tx.visitType] || visitTypeColors.consultation;
                               
                               return (
                                 <div 
                                   key={tx.treatmentId} 
                                   className={`p-4 border rounded-lg bg-gradient-to-r ${colors.bg} hover:shadow-lg transition-all ${colors.border} cursor-pointer`}
                                   data-testid={`history-visit-${tx.treatmentId}`}
                                   onClick={() => {
                                     const newExpanded = new Set(expandedVisits);
                                     if (isExpanded) {
                                       newExpanded.delete(tx.treatmentId.toString());
                                     } else {
                                       newExpanded.add(tx.treatmentId.toString());
                                     }
                                     setExpandedVisits(newExpanded);
                                   }}
                                 >
                                   <div className="flex justify-between items-start gap-3 mb-3">
                                     <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-2">
                                         <span className="font-bold text-gray-900 dark:text-white text-base">
                                           {formatClinicDayKey(tx.visitDate, 'EEE, d MMM yyyy')}
                                         </span>
                                         <Badge variant="outline" className={`capitalize font-semibold ${colors.badge} text-white border-none`}>
                                           {tx.visitType}
                                         </Badge>
                                         <Badge className="bg-gray-600 text-white text-xs font-mono">{tx.treatmentId}</Badge>
                                         <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                                     <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
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
                                   
                                   {/* Quick Stats - Always Visible */}
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
                                     {tx.heartRate && (
                                       <span className="flex items-center gap-1">
                                         <span>❤️</span>
                                         <span className="font-medium">{tx.heartRate} bpm</span>
                                       </span>
                                     )}
                                     {tx.followUpDate && (
                                       <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                                         <span>⏰</span>
                                         <span>Follow-up: {new Date(tx.followUpDate).toLocaleDateString()}</span>
                                       </span>
                                     )}
                                   </div>
                                   
                                   {/* Expanded Details */}
                                   {isExpanded && (
                                     <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                       {/* Full Examination */}
                                       {tx.examination && (
                                         <div>
                                           <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                             <Stethoscope className="h-4 w-4" />
                                             Examination
                                           </h5>
                                           <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                             {tx.examination}
                                           </p>
                                         </div>
                                       )}
                                       
                                       {/* Treatment Plan */}
                                       {tx.treatmentPlan && (
                                         <div>
                                           <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                             <ClipboardList className="h-4 w-4" />
                                             Treatment Plan
                                           </h5>
                                           <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                             {tx.treatmentPlan}
                                           </p>
                                         </div>
                                       )}
                                       
                                       {/* Medications Prescribed (if available) */}
                                       <div>
                                         <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                           <Pill className="h-4 w-4" />
                                           Medications Prescribed
                                         </h5>
                                         {allPrescriptions.filter(rx => rx.encounterId === tx.encounterId).length > 0 ? (
                                           <div className="space-y-2">
                                             {allPrescriptions
                                               .filter(rx => rx.encounterId === tx.encounterId)
                                               .map(rx => (
                                                 <div key={rx.orderId} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                   <p className="font-medium text-gray-900 dark:text-white">
                                                     {rx.drugName || "Medication"}
                                                   </p>
                                                   <p className="text-gray-600 dark:text-gray-400 text-xs">
                                                     {rx.dosage} • Qty: {rx.quantity}
                                                     {rx.instructions && ` • ${rx.instructions}`}
                                                   </p>
                                                 </div>
                                               ))}
                                           </div>
                                         ) : (
                                           <p className="text-sm text-gray-500 italic">No medications prescribed</p>
                                         )}
                                       </div>
                                       
                                       {/* Lab/Imaging Results Summary (placeholder - would need to fetch) */}
                                       <div>
                                         <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                           <Beaker className="h-4 w-4" />
                                           Diagnostic Tests
                                         </h5>
                                         <p className="text-sm text-gray-500 italic">
                                           View full test results in discharge summary
                                         </p>
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
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
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Heart className="h-5 w-5" />Vitals (Today)</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 text-sm"><div><div className="text-muted-foreground">Temp</div><div className="font-medium">{watchedVitals[0] ? `${watchedVitals[0]} °C` : <span className="text-gray-400 italic text-xs">Not recorded</span>}</div></div><div><div className="text-muted-foreground">BP</div><div className="font-medium">{watchedVitals[1] || <span className="text-gray-400 italic text-xs">Not recorded</span>}</div></div><div><div className="text-muted-foreground">Heart Rate</div><div className="font-medium">{watchedVitals[2] ? `${watchedVitals[2]} bpm` : <span className="text-gray-400 italic text-xs">Not recorded</span>}</div></div><div><div className="text-muted-foreground">Weight</div><div className="font-medium">{watchedVitals[3] ? `${watchedVitals[3]} kg` : <span className="text-gray-400 italic text-xs">Not recorded</span>}</div></div></div></CardContent></Card>
                {/* Alerts Card */}
                <Card className="border-red-500/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Alerts & Allergies
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAllergyModal(true)}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {allergies.length === 0 ? (
                      <p className="font-medium text-red-700">No known drug allergies</p>
                    ) : (
                      <div className="space-y-2">
                        {allergies.map((allergy) => (
                          <div key={allergy.id} className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm text-red-900 dark:text-red-100">{allergy.name}</p>
                                  <Badge variant={allergy.severity === "Severe" ? "destructive" : allergy.severity === "Moderate" ? "default" : "secondary"} className="text-xs">
                                    {allergy.severity}
                                  </Badge>
                                </div>
                                {allergy.reaction && (
                                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">{allergy.reaction}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setAllergies(allergies.filter(a => a.id !== allergy.id))}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
      <Dialog open={queueOpen} onOpenChange={setQueueOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Today's Patient Queue
              <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
                {visibleQueue.length} patients
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients in queue..."
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Queue list */}
            {queueLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-gray-500 mt-2">Loading queue...</p>
              </div>
            ) : visibleQueue.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No patients in queue</p>
                <p className="text-xs mt-1">
                  {queueFilter 
                    ? "Try a different search term" 
                    : "Patients who visit today will appear here"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleQueue.map((visit, index) => {
                  const patientName = getPatientName(visit.patientId);
                  return (
                    <div 
                      key={visit.treatmentId} 
                      className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handlePatientFromQueue(visit.patientId)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {patientName}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {visit.patientId}
                              </Badge>
                            </div>
                            {visit.chiefComplaint && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <span className="font-medium">Chief Complaint:</span> {visit.chiefComplaint}
                              </p>
                            )}
                            {visit.diagnosis && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <Badge 
                                variant={visit.priority === "urgent" ? "destructive" : "secondary"}
                                className="capitalize"
                              >
                                {visit.priority || "routine"}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatClinicDayKey(visit.visitDate, 'h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientFromQueue(visit.patientId);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Edit X-Ray Dialog */}
      <Dialog open={editXrayModalOpen} onOpenChange={setEditXrayModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              Edit X-Ray Request
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Clinical Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clinical Information
              </label>
              <Textarea
                value={editXrayClinicalInfo}
                onChange={(e) => setEditXrayClinicalInfo(e.target.value)}
                rows={4}
                placeholder="Clinical indication, suspected diagnosis, relevant history..."
                data-testid="textarea-edit-xray-clinical-info"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveXrayEdit}
                disabled={editXrayMutation.isPending}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                data-testid="button-save-xray-edit"
              >
                <Save className="w-4 h-4 mr-2" />
                {editXrayMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditXrayModalOpen(false)}
                data-testid="button-cancel-xray-edit"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Ultrasound Dialog */}
      <Dialog open={editUltrasoundModalOpen} onOpenChange={setEditUltrasoundModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Edit Ultrasound Request
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Clinical Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clinical Information
              </label>
              <Textarea
                value={editUltrasoundClinicalInfo}
                onChange={(e) => setEditUltrasoundClinicalInfo(e.target.value)}
                rows={4}
                placeholder="Clinical indication, suspected diagnosis, relevant history..."
                data-testid="textarea-edit-ultrasound-clinical-info"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveUltrasoundEdit}
                disabled={editUltrasoundMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                data-testid="button-save-ultrasound-edit"
              >
                <Save className="w-4 h-4 mr-2" />
                {editUltrasoundMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditUltrasoundModalOpen(false)}
                data-testid="button-cancel-ultrasound-edit"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Allergy Dialog */}
      <Dialog open={showAllergyModal} onOpenChange={setShowAllergyModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Add Allergy
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Common Allergens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Common Allergens (click to select)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Penicillin",
                  "Sulfa drugs (Sulfonamides)",
                  "Aspirin / NSAIDs",
                  "Chloroquine",
                  "Metronidazole",
                  "ACE Inhibitors",
                  "Contrast dye",
                  "Latex",
                ].map((allergen) => (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => setNewAllergyName(allergen)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      newAllergyName === allergen
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-gray-100 hover:bg-red-100 dark:bg-gray-800 dark:hover:bg-red-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500"
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergy Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allergy Name / Substance
              </label>
              <Input
                value={newAllergyName}
                onChange={(e) => setNewAllergyName(e.target.value)}
                placeholder="Enter allergy name or select from above"
                data-testid="input-allergy-name"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity
              </label>
              <Select value={newAllergySeverity} onValueChange={(val) => setNewAllergySeverity(val as "Mild" | "Moderate" | "Severe")}>
                <SelectTrigger data-testid="select-allergy-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mild">Mild</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reaction Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reaction Description (Optional)
              </label>
              <Textarea
                value={newAllergyReaction}
                onChange={(e) => setNewAllergyReaction(e.target.value)}
                rows={2}
                placeholder="Describe the reaction (e.g., rash, difficulty breathing, swelling)..."
                data-testid="textarea-allergy-reaction"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  if (!newAllergyName.trim()) {
                    toast({ title: "Error", description: "Please enter an allergy name", variant: "destructive" });
                    return;
                  }
                  setAllergies([
                    ...allergies,
                    {
                      id: crypto.randomUUID(),
                      name: newAllergyName,
                      severity: newAllergySeverity,
                      reaction: newAllergyReaction,
                    },
                  ]);
                  setNewAllergyName("");
                  setNewAllergySeverity("Mild");
                  setNewAllergyReaction("");
                  setShowAllergyModal(false);
                  toast({ title: "Success", description: "Allergy added successfully" });
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-save-allergy"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Allergy
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAllergyModal(false);
                  setNewAllergyName("");
                  setNewAllergySeverity("Mild");
                  setNewAllergyReaction("");
                }}
                data-testid="button-cancel-allergy"
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
