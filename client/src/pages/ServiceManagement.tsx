import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit2, X, Check,
  Stethoscope, FlaskConical, Activity, Radio, Pill, Syringe,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  DollarSign, Package, XCircle, MoreVertical, Copy,
  CheckCircle, Trash2, AlertCircle, ArrowRight, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CountUp } from "@/components/CountUp";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { type Service, type InsertService, insertServiceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { generateAndValidateServiceCode, validateServiceCode, sanitizeCode } from "@shared/service-code-utils";

/**
 * Normalize isActive value to handle different data types from database
 * SQLite stores as INTEGER (0/1), but it may come back as number, boolean, or string
 * @param service - The service object or isActive value
 * @returns true if active, false if inactive
 */
function isServiceActive(service: Service | number | boolean | string | null | undefined): boolean {
  if (service === null || service === undefined) return false;
  
  // If passed a service object, extract isActive
  const value = typeof service === 'object' && 'isActive' in service 
    ? service.isActive 
    : service;
  
  // Handle different types:
  // - number: 1 = active, 0 = inactive
  // - boolean: true = active, false = inactive
  // - string: "1" or "true" = active, "0" or "false" = inactive
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  
  return false;
}

const serviceFormSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(1, "Service name is required"),
  category: z.enum(["consultation", "laboratory", "radiology", "ultrasound", "pharmacy", "procedure"]),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be 0 or greater"),
  isActive: z.union([z.number(), z.boolean()]).transform(val => typeof val === 'boolean' ? (val ? 1 : 0) : val),
}).refine((data) => {
  // Make service code required for consultation category
  if (data.category === 'consultation' && !data.code?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Service code is required for consultation services",
  path: ["code"],
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

// Category icons mapping
const CATEGORY_ICONS = {
  consultation: Stethoscope,
  laboratory: FlaskConical,
  radiology: Radio,
  ultrasound: Activity,
  pharmacy: Pill,
  procedure: Syringe,
};

// Category colors with gradient support
const CATEGORY_COLORS = {
  consultation: { 
    bg: "bg-blue-500", 
    text: "text-blue-700", 
    light: "bg-blue-50",
    gradient: "from-blue-500 to-indigo-600",
    ring: "ring-blue-500",
    iconColor: "text-blue-600"
  },
  laboratory: { 
    bg: "bg-amber-500", 
    text: "text-amber-700", 
    light: "bg-amber-50",
    gradient: "from-amber-500 to-orange-600",
    ring: "ring-amber-500",
    iconColor: "text-amber-600"
  },
  radiology: { 
    bg: "bg-purple-500", 
    text: "text-purple-700", 
    light: "bg-purple-50",
    gradient: "from-purple-500 to-violet-600",
    ring: "ring-purple-500",
    iconColor: "text-purple-600"
  },
  ultrasound: { 
    bg: "bg-teal-500", 
    text: "text-teal-700", 
    light: "bg-teal-50",
    gradient: "from-teal-500 to-cyan-600",
    ring: "ring-teal-500",
    iconColor: "text-teal-600"
  },
  pharmacy: { 
    bg: "bg-pink-500", 
    text: "text-pink-700", 
    light: "bg-pink-50",
    gradient: "from-pink-500 to-rose-600",
    ring: "ring-pink-500",
    iconColor: "text-pink-600"
  },
  procedure: { 
    bg: "bg-green-500", 
    text: "text-green-700", 
    light: "bg-green-50",
    gradient: "from-green-500 to-emerald-600",
    ring: "ring-green-500",
    iconColor: "text-green-600"
  },
};

// Category configuration with complete properties for code generator
// Built from existing CATEGORY_ICONS and CATEGORY_COLORS to maintain consistency
const categoryConfig: Record<string, {
  icon: any;
  gradient: string;
  color: string;
  bg: string;
  ring: string;
  text: string;
}> = {
  consultation: {
    icon: Stethoscope,
    gradient: CATEGORY_COLORS.consultation.gradient,
    color: "blue-500",
    bg: CATEGORY_COLORS.consultation.light,
    ring: CATEGORY_COLORS.consultation.ring,
    text: CATEGORY_COLORS.consultation.text
  },
  laboratory: {
    icon: FlaskConical,
    gradient: CATEGORY_COLORS.laboratory.gradient,
    color: "amber-500",
    bg: CATEGORY_COLORS.laboratory.light,
    ring: CATEGORY_COLORS.laboratory.ring,
    text: CATEGORY_COLORS.laboratory.text
  },
  radiology: {
    icon: Radio,
    gradient: CATEGORY_COLORS.radiology.gradient,
    color: "purple-500",
    bg: CATEGORY_COLORS.radiology.light,
    ring: CATEGORY_COLORS.radiology.ring,
    text: CATEGORY_COLORS.radiology.text
  },
  ultrasound: {
    icon: Activity,
    gradient: CATEGORY_COLORS.ultrasound.gradient,
    color: "teal-500",
    bg: CATEGORY_COLORS.ultrasound.light,
    ring: CATEGORY_COLORS.ultrasound.ring,
    text: CATEGORY_COLORS.ultrasound.text
  },
  pharmacy: {
    icon: Pill,
    gradient: CATEGORY_COLORS.pharmacy.gradient,
    color: "pink-500",
    bg: CATEGORY_COLORS.pharmacy.light,
    ring: CATEGORY_COLORS.pharmacy.ring,
    text: CATEGORY_COLORS.pharmacy.text
  },
  procedure: {
    icon: Syringe,
    gradient: CATEGORY_COLORS.procedure.gradient,
    color: "green-500",
    bg: CATEGORY_COLORS.procedure.light,
    ring: CATEGORY_COLORS.procedure.ring,
    text: CATEGORY_COLORS.procedure.text
  }
};

// Helper function to get category config with fallback
function getCategoryConfig(category: string) {
  return categoryConfig[category] || {
    icon: Package,
    gradient: "from-gray-500 to-gray-600",
    color: "gray-500",
    bg: "bg-gray-50",
    ring: "ring-gray-500",
    text: "text-gray-700"
  };
}

// Smart code suggestions by category
const CODE_SUGGESTIONS = {
  consultation: (name: string) => {
    if (name.toLowerCase().includes("general")) return "CONS-GEN";
    if (name.toLowerCase().includes("follow") || name.toLowerCase().includes("follow-up")) return "CONS-FU";
    if (name.toLowerCase().includes("specialist") || name.toLowerCase().includes("special")) return "CONS-SPEC";
    if (name.toLowerCase().includes("emergency")) return "CONS-EMER";
    return "CONS-";
  },
  laboratory: (name: string) => {
    if (name.toLowerCase().includes("blood") && name.toLowerCase().includes("count")) return "LAB-CBC";
    if (name.toLowerCase().includes("malaria")) return "LAB-MAL";
    if (name.toLowerCase().includes("hiv")) return "LAB-HIV";
    if (name.toLowerCase().includes("urine") || name.toLowerCase().includes("urinalysis")) return "LAB-URINE";
    if (name.toLowerCase().includes("stool")) return "LAB-STOOL";
    return "LAB-";
  },
  radiology: (name: string) => {
    if (name.toLowerCase().includes("chest")) return "RAD-CHEST";
    if (name.toLowerCase().includes("abdomen") || name.toLowerCase().includes("abdominal")) return "RAD-ABD";
    if (name.toLowerCase().includes("pelvis") || name.toLowerCase().includes("pelvic")) return "RAD-PELV";
    if (name.toLowerCase().includes("skull")) return "RAD-SKULL";
    return "RAD-";
  },
  ultrasound: (name: string) => {
    if (name.toLowerCase().includes("abdomen") || name.toLowerCase().includes("abdominal")) return "US-ABD";
    if (name.toLowerCase().includes("obstetric") || name.toLowerCase().includes("pregnancy")) return "US-OB";
    if (name.toLowerCase().includes("cardiac") || name.toLowerCase().includes("echo")) return "US-CARD";
    if (name.toLowerCase().includes("pelvis") || name.toLowerCase().includes("pelvic")) return "US-PELV";
    return "US-";
  },
  procedure: (name: string) => {
    if (name.toLowerCase().includes("injection")) return "TREAT-INJ";
    if (name.toLowerCase().includes("dressing") || name.toLowerCase().includes("wound")) return "TREAT-DRESS";
    if (name.toLowerCase().includes("sutur")) return "TREAT-SUTURE";
    return "TREAT-";
  },
  pharmacy: (name: string) => "PHARM-MED",
};

// Grouped predefined services by subcategory
const PREDEFINED_SERVICES = {
  laboratory: {
    "Blood Tests (Hematology)": [
      "Complete Blood Count (CBC)",
      "Hemoglobin (Hb)",
      "Hematocrit (HCT)",
      "White Blood Cell Count (WBC)",
      "Platelet Count",
      "ESR (Erythrocyte Sedimentation Rate)",
      "Blood Group & Rh",
      "Bleeding Time (BT)",
      "Clotting Time (CT)",
      "Prothrombin Time (PT)",
      "INR (International Normalized Ratio)",
      "Reticulocyte Count",
    ],
    "Blood Sugar & Diabetes": [
      "Blood Sugar (Glucose)",
      "Fasting Blood Sugar (FBS)",
      "Random Blood Sugar (RBS)",
      "2-Hour Post-Prandial (2HPP)",
      "Oral Glucose Tolerance Test (OGTT)",
      "HbA1c (Diabetes)",
    ],
    "Malaria & Parasites": [
      "Malaria Test (RDT)",
      "Malaria Microscopy",
      "Blood Film for Malaria (BFFM)",
      "Microfilaria",
    ],
    "Chemistry Panel": [
      "Liver Function Test (LFT)",
      "AST (SGOT)",
      "ALT (SGPT)",
      "Alkaline Phosphatase (ALP)",
      "Bilirubin (Total & Direct)",
      "Total Protein",
      "Albumin",
      "Globulin",
      "Kidney Function Test (KFT/RFT)",
      "Urea/BUN",
      "Creatinine",
      "Uric Acid",
      "Electrolytes (Na, K, Cl)",
      "Sodium (Na)",
      "Potassium (K)",
      "Chloride (Cl)",
      "Calcium (Ca)",
      "Magnesium (Mg)",
      "Phosphorus",
    ],
    "Lipid Profile": [
      "Lipid Profile",
      "Total Cholesterol",
      "HDL Cholesterol",
      "LDL Cholesterol",
      "Triglycerides",
      "VLDL",
    ],
    "Cardiac Markers": [
      "Troponin I/T",
      "CK-MB",
      "Myoglobin",
      "D-Dimer",
      "BNP/NT-proBNP",
    ],
    "Thyroid Function": [
      "Thyroid Function Test (TFT)",
      "TSH (Thyroid Stimulating Hormone)",
      "Free T3 (FT3)",
      "Free T4 (FT4)",
      "Total T3",
      "Total T4",
    ],
    "Hormones (Reproductive)": [
      "Testosterone",
      "Estrogen (E2)",
      "Progesterone",
      "LH (Luteinizing Hormone)",
      "FSH (Follicle Stimulating Hormone)",
      "Prolactin",
      "Beta-hCG (Pregnancy Test)",
    ],
    "Other Hormones": [
      "Cortisol",
      "ACTH",
      "Growth Hormone",
      "Vitamin D (25-OH)",
      "Vitamin B12",
      "Folate",
      "Ferritin",
      "Iron Studies (Serum Iron, TIBC)",
    ],
    "Serology (Infectious Diseases)": [
      "HIV Test",
      "Hepatitis B (HBsAg)",
      "Hepatitis C (Anti-HCV)",
      "Syphilis (VDRL/RPR)",
      "TPHA (Treponema pallidum)",
      "Widal Test (Typhoid)",
      "Brucella Test (B.A.T)",
      "H. Pylori Test",
      "Dengue NS1 Antigen",
      "Dengue IgM/IgG",
      "COVID-19 Antigen/PCR",
      "Rubella IgM/IgG",
      "Toxoplasma IgM/IgG",
      "Cytomegalovirus (CMV)",
      "Epstein-Barr Virus (EBV)",
    ],
    "Urine Tests": [
      "Urinalysis",
      "Urine Microscopy",
      "Urine Culture & Sensitivity",
      "Urine Pregnancy Test",
      "24-Hour Urine Protein",
      "Urine Microalbumin",
      "Urine Creatinine Clearance",
    ],
    "Stool Tests": [
      "Stool Analysis",
      "Stool for Ova and Parasites",
      "Stool Culture & Sensitivity",
      "Stool Occult Blood",
      "Stool for H. Pylori Antigen",
    ],
    "Microbiology (Cultures)": [
      "Blood Culture & Sensitivity",
      "Sputum Culture & Sensitivity",
      "Throat Swab Culture",
      "Wound Swab Culture",
      "Vaginal Swab Culture",
      "Urethral Swab Culture",
      "Gram Stain",
      "AFB Stain (TB)",
      "KOH Mount (Fungal)",
    ],
    "Special Tests": [
      "C-Reactive Protein (CRP)",
      "Rheumatoid Factor (RF)",
      "Anti-CCP (Rheumatoid Arthritis)",
      "ANA (Antinuclear Antibody)",
      "Anti-dsDNA",
      "Complement (C3, C4)",
      "Immunoglobulins (IgA, IgG, IgM, IgE)",
      "Amylase",
      "Lipase",
      "G6PD (Glucose-6-Phosphate Dehydrogenase)",
      "Sickling Test",
      "Hemoglobin Electrophoresis",
    ],
    "Tumor Markers": [
      "PSA (Prostate Specific Antigen)",
      "CEA (Carcinoembryonic Antigen)",
      "CA 19-9",
      "CA 125",
      "AFP (Alpha-Fetoprotein)",
    ],
    "Coagulation": [
      "PT/INR",
      "aPTT",
      "Fibrinogen",
    ],
  },
  radiology: {
    "Common X-Rays": [
      "Chest X-Ray",
      "Abdomen X-Ray",
      "Pelvis X-Ray",
      "Skull X-Ray",
    ],
    "Spine X-Rays": [
      "Spine X-Ray (Cervical)",
      "Spine X-Ray (Thoracic)",
      "Spine X-Ray (Lumbar)",
    ],
    "Extremities": [
      "Hand X-Ray",
      "Foot X-Ray",
      "Shoulder X-Ray",
      "Hip X-Ray",
      "Knee X-Ray",
      "Ankle X-Ray",
      "Forearm X-Ray",
      "Elbow X-Ray",
    ],
  },
  ultrasound: {
    "Obstetric Scans": [
      "Obstetric Ultrasound (Early Pregnancy)",
      "Obstetric Ultrasound (Dating Scan)",
      "Obstetric Ultrasound (Anomaly Scan)",
      "Obstetric Ultrasound (Growth Scan)",
    ],
    "Abdominal & Pelvic": [
      "Abdominal Ultrasound",
      "Pelvic Ultrasound",
      "Renal Ultrasound (Kidneys)",
      "Hepatobiliary Ultrasound (Liver/Gallbladder)",
    ],
    "Specialized Scans": [
      "Cardiac Echo",
      "Thyroid Ultrasound",
      "Breast Ultrasound",
      "Scrotal Ultrasound",
      "Prostate Ultrasound",
      "Vascular Doppler",
    ],
  },
  consultation: {
    "General Services": [
      "General Consultation",
      "Follow-up Visit",
      "Emergency Consultation",
      "Specialist Consultation",
    ],
    "Maternal & Child Health": [
      "Antenatal Care (ANC) Visit",
      "Postnatal Care (PNC) Visit",
      "Child Wellness Visit",
      "Immunization Visit",
    ],
  },
  procedure: {
    "Wound Care": [
      "Wound Dressing",
      "Suturing (Small Wound)",
      "Suturing (Large Wound)",
      "Abscess Drainage",
    ],
    "Minor Procedures": [
      "Foreign Body Removal",
      "Minor Surgery",
      "Injection (IM/IV)",
      "IV Cannulation",
      "Catheterization",
      "Nasogastric Tube Insertion",
      "Ear Syringing",
    ],
  },
  pharmacy: {},
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ServiceManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("laboratory");
  const [useCustomName, setUseCustomName] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Service | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [predefinedSearch, setPredefinedSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "laboratory",
      description: "",
      price: 0,
      isActive: 1,
    },
  });

  const watchedCategory = form.watch("category");
  const watchedName = form.watch("name");
  const watchedCode = form.watch("code");

  // Memoize existing codes to avoid unnecessary rerenders
  const existingCodes = useMemo(() => 
    services.map(s => s.code).filter(Boolean) as string[], 
    [services]
  );

  // Auto-generate code based on name and category
  useEffect(() => {
    if (!editingService && watchedName && watchedCategory) {
      try {
        const generatedCode = generateAndValidateServiceCode(watchedName, watchedCategory, existingCodes);
        form.setValue("code", generatedCode);
      } catch (error) {
        console.error("Error generating code:", error);
        // Fallback to empty if generation fails
        form.setValue("code", "");
      }
    }
  }, [watchedName, watchedCategory, editingService, existingCodes, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      return await apiRequest("POST", "/api/services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "✓ Success",
        description: "Service created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServiceFormData> }) => {
      return await apiRequest("PUT", `/api/services/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
      toast({
        title: "✓ Success",
        description: "Service updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: number }) => {
      return await apiRequest("PUT", `/api/services/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "✓ Success",
        description: "Service status updated",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Create error object with status and response data
        const error: any = new Error(data.error || 'Failed to delete service');
        error.status = response.status;
        error.details = data.details;
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "✓ Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error: any) => {
      // Handle 409 Conflict - service is referenced
      if (error.status === 409) {
        const details = error.details;
        const referenceList: string[] = [];
        
        if (details?.orderLines > 0) {
          referenceList.push(`${details.orderLines} order line${details.orderLines > 1 ? 's' : ''}`);
        }
        if (details?.paymentItems > 0) {
          referenceList.push(`${details.paymentItems} payment item${details.paymentItems > 1 ? 's' : ''}`);
        }
        if (details?.pharmacyOrders > 0) {
          referenceList.push(`${details.pharmacyOrders} pharmacy order${details.pharmacyOrders > 1 ? 's' : ''}`);
        }
        
        toast({
          title: "❌ Cannot Delete Service",
          description: (
            <div className="space-y-2">
              <p className="font-medium">{error.message}</p>
              {referenceList.length > 0 && (
                <p className="text-sm">Referenced by: {referenceList.join(', ')}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                💡 <strong>Suggestion:</strong> Deactivate this service instead to prevent new usage while preserving historical records.
              </p>
            </div>
          ),
          variant: "destructive",
          duration: 8000, // Show longer for important information
        });
        return;
      }
      
      // Handle 404 Not Found
      if (error.status === 404) {
        toast({
          title: "⚠️ Service Not Found",
          description: "This service may have already been deleted.",
          variant: "destructive",
        });
        // Refresh the list to sync state
        queryClient.invalidateQueries({ queryKey: ["/api/services"] });
        return;
      }
      
      // Handle other errors
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return Promise.all(ids.map(id => apiRequest("DELETE", `/api/services/${id}`)));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setSelectedServices([]);
      toast({
        title: "✓ Success",
        description: `Deleted ${ids.length} services`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete services",
        variant: "destructive",
      });
    },
  });

  const bulkActivateMutation = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: number[]; isActive: number }) => {
      return Promise.all(ids.map(id => apiRequest("PUT", `/api/services/${id}`, { isActive })));
    },
    onSuccess: (_, { ids, isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setSelectedServices([]);
      toast({
        title: "✓ Success",
        description: `${isActive ? 'Activated' : 'Deactivated'} ${ids.length} services`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update services",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ServiceFormData) => {
    // Validate for duplicate names in same category
    const duplicateName = services.find(
      s => s.name.toLowerCase() === data.name.toLowerCase() && 
           s.category === data.category &&
           s.id !== editingService?.id
    );
    
    if (duplicateName) {
      toast({
        title: "⚠️ Duplicate Service",
        description: `A service named "${data.name}" already exists in ${data.category} category.`,
        variant: "destructive",
      });
      return;
    }

    // Validate for duplicate codes
    if (data.code) {
      const duplicateCode = services.find(
        s => s.code?.toLowerCase() === data.code?.toLowerCase() && s.id !== editingService?.id
      );
      
      if (duplicateCode) {
        toast({
          title: "⚠️ Duplicate Code",
          description: `Service code "${data.code}" is already in use.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Warn if price is 0
    if (data.price === 0) {
      // You could add a confirmation dialog here
      console.log("Warning: Service price is 0");
    }

    // Convert empty strings to null and uppercase code
    const formattedData = {
      ...data,
      code: data.code?.trim().toUpperCase() || null,
      description: data.description?.trim() || null,
      isActive: data.isActive ? 1 : 0,
    };
    
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleSaveAndAddAnother = (data: ServiceFormData) => {
    // Validate and save
    const formattedData = {
      ...data,
      code: data.code?.trim().toUpperCase() || null,
      description: data.description?.trim() || null,
      isActive: data.isActive ? 1 : 0,
    };
    
    createMutation.mutate(formattedData, {
      onSuccess: () => {
        // Reset form but keep category
        const currentCategory = form.watch('category');
        form.reset({
          code: "",
          name: "",
          category: currentCategory,
          description: "",
          price: 0,
          isActive: 1,
        });
        setUseCustomName(false);
        toast({
          title: "✓ Service Added",
          description: "Add another service or close dialog",
        });
      }
    });
  };

  const handleDuplicate = (service: Service) => {
    const newService = {
      ...service,
      name: `${service.name} (Copy)`,
      code: service.code ? `${service.code}-COPY` : null,
    };
    
    form.reset({
      code: newService.code || "",
      name: newService.name,
      category: newService.category,
      description: newService.description || "",
      price: Number(newService.price),
      isActive: newService.isActive,
    });
    setEditingService(null);
    setSelectedCategory(newService.category);
    setUseCustomName(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    if (confirm(`Are you sure you want to delete "${service.name}"?`)) {
      deleteMutation.mutate(service.id);
    }
  };

  const handleBulkActivate = () => {
    if (selectedServices.length > 0) {
      bulkActivateMutation.mutate({ ids: selectedServices, isActive: 1 });
    }
  };

  const handleBulkDeactivate = () => {
    if (selectedServices.length > 0) {
      bulkActivateMutation.mutate({ ids: selectedServices, isActive: 0 });
    }
  };

  const handleBulkDelete = () => {
    if (selectedServices.length > 0 && confirm(`Are you sure you want to delete ${selectedServices.length} services?`)) {
      bulkDeleteMutation.mutate(selectedServices);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      code: service.code || "",
      name: service.name,
      category: service.category,
      description: service.description || "",
      price: Number(service.price),
      isActive: service.isActive,
    });
    setSelectedCategory(service.category);
    setUseCustomName(true);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setSelectedCategory("laboratory");
    setUseCustomName(false);
    form.reset({
      code: "",
      name: "",
      category: "laboratory",
      description: "",
      price: 0,
      isActive: 1,
    });
    setIsDialogOpen(true);
  };

  // Filter by status helper function
  const filterByStatus = (status: 'active' | 'inactive' | 'all') => {
    setStatusFilter(status);
    setCategoryFilter([]); // Clear category filter when filtering by status
    setCurrentPage(1);
  };

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        service.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        service.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(service.category);
      
      // Add status filtering
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && isServiceActive(service)) ||
        (statusFilter === "inactive" && !isServiceActive(service));
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, debouncedSearch, categoryFilter, statusFilter]);

  // Sort services
  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortConfig.direction === "asc"
          ? (aValue < bValue ? -1 : 1)
          : (bValue < aValue ? -1 : 1);
      });
    }
    return sorted;
  }, [filteredServices, sortConfig]);

  // Paginate services
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedServices.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedServices, currentPage]);

  const totalPages = Math.ceil(sortedServices.length / itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeCount = services.filter(s => isServiceActive(s)).length;
    const inactiveCount = services.filter(s => !isServiceActive(s)).length;
    
    const byCategory = services.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalRevenue = services.reduce((sum, s) => sum + Number(s.price), 0);
    const prices = services.map(s => Number(s.price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    return {
      total: services.length,
      active: activeCount,
      inactive: inactiveCount,
      byCategory,
      avgPrice: services.length > 0 ? totalRevenue / services.length : 0,
      minPrice,
      maxPrice,
    };
  }, [services]);

  const handleSort = (key: keyof Service) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter([]);
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || categoryFilter.length > 0 || statusFilter !== "all";

  // Handle predefined service selection and auto-generate code
  const handlePredefinedServiceSelect = (serviceName: string) => {
    const category = form.watch('category');
    if (!category || !serviceName) return;
    
    const existingCodes = services.map(s => s.code).filter(Boolean) as string[];
    const generatedCode = generateAndValidateServiceCode(serviceName, category, existingCodes);
    
    form.setValue('name', serviceName);
    form.setValue('code', generatedCode);
  };

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    return services.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [services]);

  // Get placeholder for code based on category
  const getCodePlaceholder = (category: string) => {
    const placeholders = {
      consultation: "e.g., CONS-GEN, CONS-FU, CONS-SPEC",
      laboratory: "e.g., LAB-CBC, LAB-MAL, LAB-HIV",
      radiology: "e.g., RAD-CHEST, RAD-ABD, RAD-PELV",
      ultrasound: "e.g., US-ABD, US-OB, US-CARD",
      procedure: "e.g., TREAT-INJ, TREAT-DRESS",
      pharmacy: "e.g., PHARM-MED",
    };
    return placeholders[category as keyof typeof placeholders] || "e.g., CODE-001";
  };

  const getCodeExample = (category: string) => {
    const examples = {
      consultation: "CONS-[TYPE] (CONS-GEN, CONS-SPECIALIST)",
      laboratory: "LAB-[TEST] (LAB-CBC, LAB-MALARIA)",
      radiology: "RAD-[EXAM] (RAD-CHEST, RAD-SKULL)",
      ultrasound: "US-[AREA] (US-ABDOMEN, US-PELVIS)",
      pharmacy: "PHARM-[SERVICE] (PHARM-DISPENSE)",
      procedure: "PROC-[TYPE] (PROC-INJECTION, PROC-DRESSING)"
    };
    return examples[category as keyof typeof examples] || "CATEGORY-DESCRIPTOR";
  };

  const getCategoryGradient = (category: string) => {
    const categoryColor = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
    return categoryColor?.gradient || "from-gray-500 to-gray-600";
  };

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Package;
    return <Icon className="w-4 h-4 text-white" />;
  };

  // Filter predefined services based on search
  const getFilteredPredefinedServices = () => {
    const categoryServices = PREDEFINED_SERVICES[selectedCategory as keyof typeof PREDEFINED_SERVICES];
    if (!categoryServices || typeof categoryServices !== 'object') return {};
    
    if (!predefinedSearch) return categoryServices;
    
    const filtered: Record<string, string[]> = {};
    Object.entries(categoryServices).forEach(([subcategory, services]) => {
      const filteredServices = services.filter(s => 
        s.toLowerCase().includes(predefinedSearch.toLowerCase())
      );
      if (filteredServices.length > 0) {
        filtered[subcategory] = filteredServices;
      }
    });
    
    return filtered;
  };

  return (
    <div className="space-y-3 px-4 sm:px-6 pt-2 sm:pt-3 pb-4 sm:pb-6">
      {/* Premium Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Service Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage pricing and catalog for all clinic services
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/services"] })}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            {/* Add Service Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingService(null);
                    form.reset({
                      name: "",
                      code: "",
                      category: "consultation",
                      price: 0,
                      description: "",
                      isActive: 1
                    });
                    setIsDialogOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
              <DialogDescription>
                {editingService 
                  ? "Update service information and pricing" 
                  : "Create a new service with pricing details"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Row 1: Category & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Category *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategory(value);
                            if (!editingService) {
                              form.setValue("name", "");
                              form.setValue("code", "");
                              setUseCustomName(false);
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-service-category" className="h-11">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CATEGORY_ICONS).map(([cat, Icon]) => {
                              const categoryColor = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
                              return (
                                <SelectItem key={cat} value={cat}>
                                  <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${categoryColor?.iconColor || 'text-gray-600'}`} />
                                    <span className="capitalize">{cat}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between p-3 border rounded-lg h-11">
                          <div>
                            <FormLabel className="text-base font-semibold">Status</FormLabel>
                            <p className="text-xs text-gray-500">Service availability</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === 1}
                              onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Service Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-1">
                        <FormLabel className="font-semibold">
                          Service Code {watchedCategory === "consultation" && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              value={field.value || ""} 
                              placeholder={getCodePlaceholder(watchedCategory)} 
                              data-testid="input-service-code"
                              className="h-11 font-mono font-semibold bg-gray-50 dark:bg-gray-900 border-2"
                              readOnly
                              title="Code is auto-generated from service name"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              {field.value && validateServiceCode(field.value) === null ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : field.value ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : null}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Auto-generated from service name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="font-semibold">Service Name *</FormLabel>
                      {!editingService && Object.keys(PREDEFINED_SERVICES[selectedCategory as keyof typeof PREDEFINED_SERVICES] || {}).length > 0 && !useCustomName ? (
                        <div className="space-y-3">
                          <Input
                            placeholder="Search predefined services..."
                            value={predefinedSearch}
                            onChange={(e) => setPredefinedSearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-64 overflow-y-auto border rounded-md">
                            {Object.entries(getFilteredPredefinedServices()).map(([subcategory, serviceList]) => (
                              <div key={subcategory} className="p-2">
                                <h4 className="font-semibold text-xs text-gray-500 uppercase mb-2">{subcategory}</h4>
                                {serviceList.map((serviceName) => (
                                  <button
                                    key={serviceName}
                                    type="button"
                                    onClick={() => {
                                      handlePredefinedServiceSelect(serviceName);
                                      setPredefinedSearch("");
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded hover:bg-blue-50 transition-colors text-sm ${
                                      field.value === serviceName ? "bg-blue-100 font-medium" : ""
                                    }`}
                                  >
                                    {serviceName}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setUseCustomName(true);
                              form.setValue("name", "");
                            }}
                            className="text-xs p-0 h-auto"
                          >
                            + Use custom service name
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""} 
                              placeholder="e.g., Complete Blood Count (CBC)" 
                              data-testid="input-service-name"
                              className="h-11"
                            />
                          </FormControl>
                          {!editingService && Object.keys(PREDEFINED_SERVICES[selectedCategory as keyof typeof PREDEFINED_SERVICES] || {}).length > 0 && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setUseCustomName(false);
                                form.setValue("name", "");
                              }}
                              className="text-xs p-0 h-auto"
                            >
                              ← Choose from predefined services
                            </Button>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Brief description of the service"
                          rows={3}
                          data-testid="input-service-description"
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Price (SSP) *</FormLabel>
                      
                      {/* Quick Price Buttons */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {[500, 1000, 2000, 5000, 10000].map((price) => (
                          <Button
                            key={price}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => form.setValue('price', price)}
                            className={`text-xs ${field.value === price ? 'bg-blue-100 border-blue-500' : ''}`}
                          >
                            {price >= 1000 ? `${price / 1000}K` : price}
                          </Button>
                        ))}
                        <div className="flex-1 min-w-[100px]">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Custom"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-service-price"
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      {/* Selected Price Display */}
                      {field.value > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Selected: <span className="font-bold text-lg text-blue-600">
                            {(field.value || 0).toLocaleString()} SSP
                          </span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Service Preview Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                              border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryGradient(form.watch('category'))}`}>
                      {getCategoryIcon(form.watch('category'))}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Preview</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">How this service will appear</p>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">
                            {form.watch('code') || '(No code)'}
                          </span>
                          <Badge variant={form.watch('category') === 'consultation' ? 'default' : 'secondary'} className="capitalize">
                            {form.watch('category') || 'Category'}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-base mt-1">
                          {form.watch('name') || 'Service Name'}
                        </h3>
                        {form.watch('description') && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {form.watch('description')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {(form.watch('price') || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">SSP</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Badge variant={form.watch('isActive') ? 'default' : 'secondary'}>
                        {form.watch('isActive') ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {editingService ? 'Editing Service' : 'New Service'}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingService(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-service"
                  >
                    Cancel
                  </Button>
                  
                  <div className="flex gap-2">
                    {!editingService && (
                      <Button
                        type="button"
                        onClick={() => handleSaveAndAddAnother(form.getValues())}
                        variant="secondary"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        Save & Add Another
                      </Button>
                    )}
                    
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      data-testid="button-save-service"
                    >
                      {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingService ? "Update Service" : "Save Service")}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Total Services Card */}
        <Card 
          className="border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg hover:-translate-y-1 
                     transition-all duration-300 cursor-pointer group"
          onClick={clearFilters}
        >
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Total Services
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <CountUp
                    end={stats.total}
                    duration={2}
                    className="text-xl font-bold text-blue-600 dark:text-blue-400"
                  />
                  <span className="text-xs text-gray-500">services</span>
                </div>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg 
                            shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Package className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Services Card */}
        <Card 
          className="border-2 border-green-200 dark:border-green-800 hover:shadow-lg hover:-translate-y-1 
                     transition-all duration-300 cursor-pointer group"
          onClick={() => filterByStatus('active')}
        >
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Active Services
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <CountUp
                    end={stats.active}
                    duration={2}
                    className="text-xl font-bold text-green-600 dark:text-green-400"
                  />
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg 
                            shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Services Card */}
        <Card 
          className="border-2 border-red-200 dark:border-red-800 hover:shadow-lg hover:-translate-y-1 
                     transition-all duration-300 cursor-pointer group"
          onClick={() => filterByStatus('inactive')}
        >
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Inactive Services
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <CountUp
                    end={stats.inactive}
                    duration={2}
                    className="text-xl font-bold text-red-600 dark:text-red-400"
                  />
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {stats.total > 0 ? ((stats.inactive / stats.total) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg 
                            shadow-lg group-hover:scale-110 transition-transform duration-300">
                <XCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Range Card */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg hover:-translate-y-1 
                       transition-all duration-300 group">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Price Range
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-center">
                    <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                      {stats.minPrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Min</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="text-center">
                    <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                      {stats.maxPrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Max</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Spread: {(stats.maxPrice - stats.minPrice).toLocaleString()} SSP
                </p>
              </div>
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg 
                            shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-12 text-base"
                data-testid="input-search-services"
              />
            </div>

            {/* Premium Category Filter Pills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter by Category</label>
                {categoryFilter.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategoryFilter([])}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear Categories
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_ICONS).map(([cat, Icon]) => {
                  const categoryColor = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
                  const isActive = categoryFilter.includes(cat);
                  const count = categoryCounts[cat] || 0;
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategoryFilter(cat)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl h-11 font-medium
                        transition-all duration-200 ease-in-out
                        ${isActive 
                          ? `bg-gradient-to-r ${categoryColor.gradient} text-white shadow-lg ring-2 ${categoryColor.ring} transform scale-105` 
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                        }
                        hover:shadow-md hover:scale-105 active:scale-95
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : categoryColor.iconColor}`} />
                      <span className="capitalize">{cat}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-0.5 ${isActive ? 'bg-white/20 text-white border-white/30' : 'bg-gray-100 dark:bg-gray-700'}`}
                      >
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              {categoryFilter.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredServices.length} of {services.length} services
                </p>
              )}
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-2">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchTerm}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => setSearchTerm("")}
                    />
                  </Badge>
                )}
                {categoryFilter.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-1 capitalize">
                    {cat}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => toggleCategoryFilter(cat)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="shadow-xl hover:shadow-2xl transition-shadow">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
            <span>Services ({sortedServices.length})</span>
            {sortedServices.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, sortedServices.length)} of {sortedServices.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading services...</p>
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No services found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more results." 
                  : "Get started by adding your first service."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-4 w-12">
                        <Checkbox
                          checked={selectedServices.length > 0 && selectedServices.length === paginatedServices.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedServices(paginatedServices.map(s => s.id));
                            } else {
                              setSelectedServices([]);
                            }
                          }}
                        />
                      </th>
                      <th 
                        className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort("code")}
                      >
                        <div className="flex items-center gap-1">
                          Code
                          {sortConfig.key === "code" && (
                            sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          Service Name
                          {sortConfig.key === "name" && (
                            sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort("category")}
                      >
                        <div className="flex items-center gap-1">
                          Category
                          {sortConfig.key === "category" && (
                            sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center gap-1">
                          Price (SSP)
                          {sortConfig.key === "price" && (
                            sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort("isActive")}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig.key === "isActive" && (
                            sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedServices.map((service) => {
                      const CategoryIcon = CATEGORY_ICONS[service.category as keyof typeof CATEGORY_ICONS] || Package;
                      const categoryColor = CATEGORY_COLORS[service.category as keyof typeof CATEGORY_COLORS] || { bg: "bg-gray-500", text: "text-gray-700", light: "bg-gray-50" };
                      
                      return (
                        <tr 
                          key={service.id} 
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200"
                        >
                          <td className="px-4 py-4 w-12">
                            <Checkbox
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedServices([...selectedServices, service.id]);
                                } else {
                                  setSelectedServices(selectedServices.filter(id => id !== service.id));
                                }
                              }}
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
                                {service.code || "-"}
                              </span>
                              {service.code && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(service.code || '');
                                    toast({ title: "Code copied!", description: service.code });
                                  }}
                                  title={`Copy code: ${service.code}`}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {service.name}
                            </div>
                            {service.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-md truncate">
                                {service.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge className={`${categoryColor.bg} text-white capitalize font-semibold shadow-sm flex items-center gap-1 w-fit`}>
                              <CategoryIcon className="w-3 h-3" />
                              {service.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                                {Math.round(Number(service.price)).toLocaleString()}
                              </span>
                              {Number(service.price) > 1000 && <TrendingUp className="w-3 h-3 text-green-600" />}
                              {Number(service.price) < 100 && <TrendingDown className="w-3 h-3 text-red-600" />}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isServiceActive(service) ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
                              <Badge 
                                variant={isServiceActive(service) ? "default" : "secondary"}
                                className={`font-semibold shadow-sm ${isServiceActive(service) ? "bg-green-600" : "bg-gray-400"}`}
                              >
                                {isServiceActive(service) ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEdit(service)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit Service
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(service)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleActiveMutation.mutate({
                                  id: service.id,
                                  isActive: service.isActive ? 0 : 1,
                                })}>
                                  {service.isActive ? (
                                    <>
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(service)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 
                        bg-white dark:bg-gray-800 border-2 border-blue-500 
                        rounded-full shadow-2xl px-6 py-3 flex items-center gap-4
                        animate-slide-in-up z-50">
          <span className="font-semibold text-sm">
            {selectedServices.length} selected
          </span>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleBulkActivate}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Activate
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleBulkDeactivate}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Deactivate
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleBulkDelete}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setSelectedServices([])}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
