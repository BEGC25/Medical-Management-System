import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit2, X, Check, Filter, 
  Stethoscope, Beaker, Activity, Radio, Pill, Syringe,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  DollarSign, Package, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { type Service, type InsertService, insertServiceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

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
  laboratory: Beaker,
  radiology: Activity,
  ultrasound: Radio,
  pharmacy: Pill,
  procedure: Syringe,
};

// Category colors
const CATEGORY_COLORS = {
  consultation: { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50" },
  laboratory: { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50" },
  radiology: { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-50" },
  ultrasound: { bg: "bg-teal-500", text: "text-teal-700", light: "bg-teal-50" },
  pharmacy: { bg: "bg-pink-500", text: "text-pink-700", light: "bg-pink-50" },
  procedure: { bg: "bg-green-500", text: "text-green-700", light: "bg-green-50" },
};

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
    "Blood Tests": [
      "Complete Blood Count (CBC)",
      "Blood Sugar (Glucose)",
      "Hemoglobin",
      "Blood Group & Rh",
      "ESR (Erythrocyte Sedimentation Rate)",
      "HbA1c (Diabetes)",
    ],
    "Infectious Disease Tests": [
      "Malaria Test (RDT)",
      "Malaria Microscopy",
      "HIV Test",
      "Hepatitis B Test",
      "Hepatitis C Test",
      "Syphilis (VDRL/RPR)",
      "Tuberculosis (TB) Test",
      "Widal Test (Typhoid)",
    ],
    "Urine & Stool Tests": [
      "Urinalysis",
      "Urine Pregnancy Test",
      "Stool Analysis",
      "Stool for Ova and Parasites",
      "Culture & Sensitivity (Urine)",
      "Culture & Sensitivity (Stool)",
    ],
    "Biochemistry Tests": [
      "Liver Function Test (LFT)",
      "Kidney Function Test (RFT)",
      "Lipid Profile",
      "Electrolytes (Na, K, Cl)",
      "Thyroid Function Test (TFT)",
      "Uric Acid",
      "Total Protein",
      "Albumin",
      "Bilirubin",
      "AST/ALT",
      "Creatinine",
      "Urea/BUN",
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
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("laboratory");
  const [useCustomName, setUseCustomName] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Service | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [predefinedSearch, setPredefinedSearch] = useState("");
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

  // Auto-suggest code based on name and category
  useEffect(() => {
    if (!editingService && watchedName && watchedCategory) {
      const suggester = CODE_SUGGESTIONS[watchedCategory as keyof typeof CODE_SUGGESTIONS];
      if (suggester && !watchedCode) {
        const suggested = suggester(watchedName);
        form.setValue("code", suggested);
      }
    }
  }, [watchedName, watchedCategory, editingService, watchedCode, form]);

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

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        service.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        service.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(service.category);
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && service.isActive === 1) ||
        (statusFilter === "inactive" && service.isActive === 0);
      
      const matchesPriceRange = 
        (!priceRange.min || Number(service.price) >= Number(priceRange.min)) &&
        (!priceRange.max || Number(service.price) <= Number(priceRange.max));
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPriceRange;
    });
  }, [services, debouncedSearch, categoryFilter, statusFilter, priceRange]);

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
    const activeCount = services.filter(s => s.isActive === 1).length;
    const inactiveCount = services.length - activeCount;
    
    const byCategory = services.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalRevenue = services.reduce((sum, s) => sum + Number(s.price), 0);
    
    return {
      total: services.length,
      active: activeCount,
      inactive: inactiveCount,
      byCategory,
      avgPrice: services.length > 0 ? totalRevenue / services.length : 0,
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
    setPriceRange({ min: "", max: "" });
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

  const hasActiveFilters = searchTerm || categoryFilter.length > 0 || statusFilter !== "all" || priceRange.min || priceRange.max;

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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header with gradient */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Service Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage pricing and catalog for all clinic services
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAddNew} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl font-semibold transition-all transform hover:scale-105" 
              data-testid="button-add-service"
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
                            {Object.entries(CATEGORY_ICONS).map(([cat, Icon]) => (
                              <SelectItem key={cat} value={cat}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  <span className="capitalize">{cat}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Service Code {watchedCategory === "consultation" && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder={getCodePlaceholder(watchedCategory)} 
                            data-testid="input-service-code"
                            className="h-11 uppercase"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Format: CATEGORY-DESCRIPTOR (auto-capitalized)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
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
                                      field.onChange(serviceName);
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
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-service-price"
                            className="pl-10 h-11"
                          />
                        </div>
                      </FormControl>
                      {field.value > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(field.value).toLocaleString()} SSP
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
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
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    data-testid="button-save-service"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Service"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Services</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Package className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Services</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Check className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900 border-red-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Services</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Price</p>
                <p className="text-3xl font-bold text-purple-600">{Math.round(stats.avgPrice).toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500 opacity-50" />
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

            {/* Filters Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
                {hasActiveFilters && (
                  <Badge variant="default" className="ml-1 bg-blue-600">
                    {[
                      searchTerm && 1,
                      categoryFilter.length,
                      statusFilter !== "all" && 1,
                      (priceRange.min || priceRange.max) && 1,
                    ].filter(Boolean).reduce((a, b) => Number(a) + Number(b), 0)}
                  </Badge>
                )}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                {/* Category Multi-Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(CATEGORY_ICONS).map((cat) => (
                      <Badge
                        key={cat}
                        variant={categoryFilter.includes(cat) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          categoryFilter.includes(cat) 
                            ? CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS].bg + " text-white"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => toggleCategoryFilter(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range (SSP)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => {
                        setPriceRange({ ...priceRange, min: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-1/2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => {
                        setPriceRange({ ...priceRange, max: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-1/2"
                    />
                  </div>
                </div>
              </div>
            )}

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
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    Status: {statusFilter}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => setStatusFilter("all")}
                    />
                  </Badge>
                )}
                {(priceRange.min || priceRange.max) && (
                  <Badge variant="secondary" className="gap-1">
                    Price: {priceRange.min || "0"} - {priceRange.max || "∞"}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => setPriceRange({ min: "", max: "" })}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="shadow-xl hover:shadow-2xl transition-shadow">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="flex items-center justify-between">
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
                      const CategoryIcon = CATEGORY_ICONS[service.category as keyof typeof CATEGORY_ICONS];
                      const categoryColor = CATEGORY_COLORS[service.category as keyof typeof CATEGORY_COLORS];
                      
                      return (
                        <tr 
                          key={service.id} 
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {service.code || "-"}
                            </span>
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
                              <div className={`w-2 h-2 rounded-full ${service.isActive ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
                              <Badge 
                                variant={service.isActive ? "default" : "secondary"}
                                className={`font-semibold shadow-sm ${service.isActive ? "bg-green-600" : "bg-gray-400"}`}
                              >
                                {service.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(service)}
                                data-testid={`button-edit-service-${service.id}`}
                                className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant={service.isActive ? "outline" : "default"}
                                size="sm"
                                onClick={() =>
                                  toggleActiveMutation.mutate({
                                    id: service.id,
                                    isActive: service.isActive ? 0 : 1,
                                  })
                                }
                                data-testid={`button-toggle-service-${service.id}`}
                                className={service.isActive 
                                  ? "hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors" 
                                  : "bg-green-600 hover:bg-green-700"}
                              >
                                {service.isActive ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                              </Button>
                            </div>
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
    </div>
  );
}
