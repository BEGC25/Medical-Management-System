import { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import {
  UserPlus,
  Save,
  X,
  Calendar,
  Users,
  Search,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  Trash2,
  AlertTriangle,
  Filter,
  Info,
  Edit,
  Eye,
  MoreVertical,
  FileText,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PatientSearch from "@/components/PatientSearch";
import {
  insertPatientSchema,
  type InsertPatient,
  type Patient,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";
import { getDateRangeForAPI, formatClinicDay, getClinicDayKey } from "@/lib/date-utils";

function money(n?: number) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return `${Math.round(v).toLocaleString()} SSP`;
}

export default function Patients() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [collectConsultationFee, setCollectConsultationFee] = useState(true); // Default to checked (simpler than unchecked)
  const [selectedConsultationServiceId, setSelectedConsultationServiceId] = useState<number | null>(null);

  // NEW: quick-view panel state (we keep full row object to access serviceStatus)
  const [activePatient, setActivePatient] = useState<any | null>(null);
  
  // Deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteResult, setDeleteResult] = useState<any>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false);

  // Track newly registered patient for highlighting
  const [newlyRegisteredPatientId, setNewlyRegisteredPatientId] = useState<string | null>(null);

  // Date range filtering and search
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "last7days" | "last30days" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [location] = useLocation();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Payment filter state
  const [paymentFilter, setPaymentFilter] = useState<"all" | "unpaid" | "paid">("all");

  // Ref for search input (for keyboard shortcuts)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Read query parameters and apply them to search
  useEffect(() => {
    // Parse query params from location string
    const queryString = location.split('?')[1];
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const searchParam = params.get("search") || params.get("patientId");
      if (searchParam) {
        setSearchQuery(searchParam);
        setShowSearch(true);
      }
    }
  }, [location]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" to focus search (only if not typing in an input)
      const excludedTags = ["INPUT", "TEXTAREA", "SELECT"];
      if (e.key === "/" && !excludedTags.includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Escape to clear search
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
        setShowSearch(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  // Calculate date range based on filter using timezone-aware utilities
  // This ensures consistent "Today" filtering across all pages
  const getDateRange = () => {
    // Use shared date utility for timezone-aware date ranges
    const dateRange = getDateRangeForAPI(dateFilter, customStartDate, customEndDate);
    
    if (!dateRange) {
      // Fallback to local dates if utility returns null
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { 
        start: today.toISOString(), 
        end: new Date(today.getTime() + 86400000).toISOString() 
      };
    }
    
    return {
      start: dateRange.startDate,
      end: dateRange.endDate,
    };
  };

  // Get consultation service from services list for accurate pricing
  const { data: servicesList } = useQuery({
    queryKey: ["/api/services"],
  });
  
  // Filter active consultation services
  const activeConsultationServices = (servicesList as any[] || []).filter(
    (s: any) => s.category === "consultation" && s.isActive
  );
  
  // Find default consultation service (prefer CONS-GEN code or name match "General Consultation")
  const defaultConsultationService = activeConsultationServices.find(
    (s: any) => s.code === "CONS-GEN"
  ) || activeConsultationServices.find(
    (s: any) => s.name.toLowerCase().includes("general")
  ) || activeConsultationServices[0];
  
  // Get currently selected consultation service
  const selectedConsultationService = activeConsultationServices.find(
    (s: any) => s.id === selectedConsultationServiceId
  ) || defaultConsultationService;
  
  // Set default consultation service ID when services are loaded
  useEffect(() => {
    if (defaultConsultationService && selectedConsultationServiceId === null) {
      setSelectedConsultationServiceId(defaultConsultationService.id);
    }
  }, [defaultConsultationService, selectedConsultationServiceId]);
  
  // Debug log to see what we're getting
  console.log("Active consultation services:", activeConsultationServices);
  console.log("Selected consultation service:", selectedConsultationService);

  // Invalidate patients query when preset changes to prevent cache reuse
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
  }, [dateFilter, customStartDate, customEndDate, queryClient]);

  // Counts
  const { data: patientCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["/api/patients/counts"],
    queryFn: () => {
      return fetch(`/api/patients/counts`).then((r) => r.json());
    },
    refetchInterval: 30000,
  });

  const todayCount = patientCounts?.today || 0;
  const allCount = patientCounts?.all || 0;

  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const searchPatients = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(
          `/api/patients?search=${encodeURIComponent(searchQuery)}&withStatus=true`,
        );
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error searching patients:", error);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: "",
      gender: undefined,
      phoneNumber: "",
      allergies: "",
      medicalHistory: "",
    },
  });

  const createPatientMutation = useMutation({
  mutationFn: async (data: InsertPatient) => {
    // Send all data to the atomic endpoint including selected consultation service
    const registrationData = {
      patientData: data,
      collectConsultationFee: collectConsultationFee,
      consultationServiceId: selectedConsultationServiceId || undefined, // Ensure we send undefined, not null
    };

    const response = await apiRequest("POST", "/api/patients", registrationData);
    // The server now handles all steps, so we just return the result.
    return response.json();
  },
  onSuccess: (data) => {
    const patientName = `${form.getValues('firstName')} ${form.getValues('lastName')}`;
    const patientId = data?.patient?.patientId || '';
    
    toast({
      title: "✓ Patient Registered Successfully",
      description: `${patientName} (${patientId}) has been added to the system`,
    });
    
    // Highlight the newly registered patient
    if (patientId) {
      setNewlyRegisteredPatientId(patientId);
      // Clear highlight after 5 seconds
      setTimeout(() => setNewlyRegisteredPatientId(null), 5000);
    }
    
    form.reset();
    setShowRegistrationForm(false);
    setCollectConsultationFee(true); // Reset to default (checked)
    setSelectedConsultationServiceId(defaultConsultationService?.id || null); // Reset to default
    queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
    queryClient.invalidateQueries({ queryKey: ["/api/patients/counts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
  },
  onError: (error: any) => {
    if (!navigator.onLine) {
      addToPendingSync({
        type: "patient",
        action: "create",
        data: form.getValues(),
      });
      toast({
        title: "Saved Offline",
        description: "Patient saved locally. Will sync when online.",
      });
      form.reset();
      setShowRegistrationForm(false);
    } else {
      toast({
        title: "Error",
        description: error?.error || "Failed to register patient", // Show server error
        variant: "destructive",
      });
    }
  },
});

  const updatePatientMutation = useMutation({
    mutationFn: async ({
      patientId,
      data,
    }: {
      patientId: string;
      data: Partial<InsertPatient>;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/patients/${patientId}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Patient updated" });
      form.reset();
      setEditingPatient(null);
      setShowRegistrationForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async ({ patientId, reason, forceDelete }: { patientId: string; reason?: string; forceDelete?: boolean }) => {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, forceDelete }),
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Throw the structured error data so onError can access blockReasons
        throw data;
      }
      
      return data;
    },
    onSuccess: (data) => {
      setDeleteResult(null);
      setShowDeleteDialog(false);
      setDeletionReason("");
      const totalCancelled = (data.impactSummary?.labTests || 0) + (data.impactSummary?.xrayExams || 0) + 
                            (data.impactSummary?.ultrasoundExams || 0) + (data.impactSummary?.pharmacyOrders || 0) + 
                            (data.impactSummary?.encounters || 0);
      const forceNote = data.forceDeleted ? " (Force deleted with financial history)" : "";
      toast({ 
        title: "Success", 
        description: `Patient deleted successfully${forceNote}. ${totalCancelled > 0 ? `Cancelled ${totalCancelled} related records.` : ''}` 
      });
      setActivePatient(null);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      console.log("Delete error:", error); // Debug log
      if (error?.blockReasons) {
        // Keep dialog open and show the blocking reasons
        setDeleteResult({
          blocked: true,
          blockReasons: error.blockReasons,
          impactSummary: error.impactSummary,
        });
        // Don't close the dialog - let the user see the blocking reasons
      } else {
        toast({
          title: "Error",
          description: error.error || error.message || "Failed to delete patient",
          variant: "destructive",
        });
        setShowDeleteDialog(false);
        setDeleteResult(null);
      }
    },
  });

  const onSubmit = (data: InsertPatient) => {
    // Validate that if collect fee is enabled, we have an active consultation service
    if (!editingPatient && collectConsultationFee && activeConsultationServices.length === 0) {
      toast({
        title: "Cannot Register Patient",
        description: "No active consultation services found. Please create and activate a consultation service in Service Management first.",
        variant: "destructive",
      });
      return;
    }

    if (editingPatient) {
      updatePatientMutation.mutate({
        patientId: editingPatient.patientId,
        data,
      });
    } else {
      createPatientMutation.mutate(data);
    }
  };

  const handleNewPatient = () => {
    form.reset({
      firstName: "",
      lastName: "",
      age: "",
      gender: undefined,
      phoneNumber: "",
      allergies: "",
      medicalHistory: "",
    });
    setEditingPatient(null);
    setCollectConsultationFee(true); // Default to checked
    setSelectedConsultationServiceId(defaultConsultationService?.id || null); // Reset to default
    setShowRegistrationForm(true);
  };

  // NEW: open quick-view panel instead of toast
  const handleViewPatient = (p: any) => setActivePatient(p);

  const handleCancelEdit = () => {
    form.reset();
    setEditingPatient(null);
    setShowRegistrationForm(false);
  };

  const handleEditPatient = (p: Patient) => {
    setEditingPatient(p);
    form.reset({
      firstName: p.firstName,
      lastName: p.lastName,
      age: p.age || "",
      gender: p.gender || undefined,
      phoneNumber: p.phoneNumber || "",
      allergies: p.allergies || "",
      medicalHistory: p.medicalHistory || "",
    });
    setShowRegistrationForm(true);
  };

  const { data: patientsListData, isLoading: patientsLoading, error: patientsError } = useQuery<any[]>(
    {
      // Include preset in query key to prevent cache reuse between tabs
      queryKey: ["/api/patients", { preset: dateFilter, customStart: customStartDate, customEnd: customEndDate }],
      queryFn: async () => {
        const params = new URLSearchParams();
        
        // Use preset parameter for standard filters (today, yesterday, last7days, last30days)
        if (dateFilter === 'custom' && customStartDate && customEndDate) {
          // Custom range: use from/to parameters with clinic day keys
          params.append("preset", "custom");
          params.append("from", getClinicDayKey(customStartDate));
          params.append("to", getClinicDayKey(customEndDate));
        } else {
          // Standard preset: map to backend preset format
          const presetMap: Record<string, string> = {
            'today': 'today',
            'yesterday': 'yesterday',
            'last7days': 'last7',
            'last30days': 'last30',
          };
          params.append("preset", presetMap[dateFilter] || 'today');
        }
        
        params.append("withStatus", "true"); // Include consultation payment status

        try {
          const response = await fetch(`/api/patients?${params}`);
          if (!response.ok) {
            throw new Error("Failed to fetch patients");
          }
          return response.json();
        } catch (error) {
          console.error('[Patients] Failed to fetch patients:', error);
          throw error;
        }
      },
      refetchInterval: 30000,
      retry: 1, // Only retry once to avoid long delays
    },
  );

  // Service status
  const { data: servicesData } = useQuery({
    queryKey: ["/api/services"],
  });

  const patientsList = patientsListData || [];

  // Apply payment filter
  const filteredPatientsList = useMemo(() => {
    if (paymentFilter === "all") return patientsList;
    
    return patientsList.filter((p: any) => {
      const balance = p.serviceStatus?.balanceToday ?? p.serviceStatus?.balance ?? 0;
      if (paymentFilter === "unpaid") return balance > 0;
      if (paymentFilter === "paid") return balance === 0;
      return true;
    });
  }, [patientsList, paymentFilter]);

  // Determine which patients to display
  const patientsToDisplay = showSearch ? searchResults : filteredPatientsList;

  const jump = (path: string) => {
    window.location.href = path;
  };

  // Export patients to CSV
  const exportToCSV = () => {
    const headers = ["Patient ID", "First Name", "Last Name", "Age", "Gender", "Phone Number", "Registered Date", "Consultation Status"];
    
    // Escape CSV cells to prevent injection
    const escapeCSV = (cell: any) => {
      const str = String(cell || "");
      // Escape double quotes and wrap in quotes if contains special chars
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const rows = patientsToDisplay.map((p: any) => [
      escapeCSV(p.patientId),
      escapeCSV(p.firstName),
      escapeCSV(p.lastName),
      escapeCSV(p.age || ""),
      escapeCSV(p.gender || ""),
      escapeCSV(p.phoneNumber || ""),
      escapeCSV(formatClinicDay((p as any).clinicDay || p.createdAt)),
      escapeCSV(
        (p.serviceStatus?.balanceToday ?? p.serviceStatus?.balance ?? 0) > 0 
          ? `Unpaid (${money(p.serviceStatus.balanceToday ?? p.serviceStatus.balance)})` 
          : "Paid"
      )
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `patients_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Clean up the object URL to prevent memory leaks
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `Exported ${patientsToDisplay.length} patients to CSV`,
    });
  };

  // Color generation for avatars - Premium palette with softer, varied colors
  function getAvatarColor(name: string): string {
    const colors = [
      "bg-indigo-500",  // Soft purple-blue
      "bg-teal-500",    // Sophisticated teal
      "bg-pink-500",    // Soft pink
      "bg-orange-500",  // Warm orange
      "bg-blue-500",    // Classic blue
    ];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Compact Page Header */}
      <div className="bg-white dark:bg-gray-800 
                      border border-gray-200/60 dark:border-gray-700/50 
                      rounded-xl 
                      shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)]
                      hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]
                      transition-all duration-300
                      p-3
                      card-premium">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold 
                           text-slate-800 dark:text-gray-100
                           mb-1">
              Patient Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm inline">
              Register and manage patient records
            </p>
            {/* Last updated - inline on larger screens */}
            <span className="hidden lg:inline text-xs text-gray-500 dark:text-gray-500 ml-2">
              • Updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {/* Export Button */}
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="lg"
              disabled={patientsToDisplay.length === 0}
              className="hidden sm:flex items-center gap-2
                         border-gray-300 dark:border-gray-600
                         hover:bg-gray-50 dark:hover:bg-gray-800
                         hover:border-gray-400 dark:hover:border-gray-500
                         transition-all duration-200"
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            
            {/* Register Button */}
            <Button
              onClick={handleNewPatient}
              size="lg"
              className="w-full md:w-auto
                         group bg-gradient-to-r from-teal-500 to-cyan-500 
                         hover:from-teal-600 hover:to-cyan-600
                         dark:from-teal-500 dark:to-cyan-400
                         dark:hover:from-teal-600 dark:hover:to-cyan-500
                         text-white font-semibold
                         px-6 py-3
                         shadow-[0_4px_16px_rgba(20,184,166,0.25),
                                 0_2px_8px_rgba(6,182,212,0.15)]
                         hover:shadow-[0_8px_24px_rgba(20,184,166,0.35),
                                      0_4px_12px_rgba(6,182,212,0.25),
                                      0_0_30px_rgba(20,184,166,0.2)]
                         hover:-translate-y-1
                         active:translate-y-0
                         transition-all duration-300
                         motion-reduce:transform-none motion-reduce:transition-none"
              data-testid="button-new-patient-primary"
            >
              <UserPlus className="w-5 h-5 mr-2 transition-transform duration-300 
                                  group-hover:scale-110 motion-reduce:transform-none" />
              Register New Patient
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Stats Cards - Premium KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Patients for Selected Period */}
        <button
          onClick={() => setPaymentFilter("all")}
          className="bg-gradient-to-br from-white to-teal-50/30 dark:from-gray-800 dark:to-teal-900/10
                     border border-gray-200/60 dark:border-gray-700/50
                     rounded-xl
                     shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)]
                     hover:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.06)]
                     hover:border-teal-300 dark:hover:border-teal-700
                     transition-all duration-200
                     p-4
                     text-left
                     cursor-pointer
                     group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors shadow-sm">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {patientsLoading ? "..." : filteredPatientsList.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {dateFilter === "today" ? "Patients - Today" : 
                 dateFilter === "yesterday" ? "Patients - Yesterday" :
                 dateFilter === "last7days" ? "Patients - Last 7 Days" :
                 dateFilter === "last30days" ? "Patients - Last 30 Days" : "Patients - Range"}
              </div>
            </div>
          </div>
        </button>
        
        {/* Unpaid */}
        <button
          onClick={() => setPaymentFilter("unpaid")}
          className="bg-gradient-to-br from-white to-red-50/30 dark:from-gray-800 dark:to-red-900/10
                     border border-gray-200/60 dark:border-gray-700/50
                     rounded-xl
                     shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)]
                     hover:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.06)]
                     hover:border-red-300 dark:hover:border-red-700
                     transition-all duration-200
                     p-4
                     text-left
                     cursor-pointer
                     group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {patientsLoading ? "..." : patientsList.filter((p: any) => (p.serviceStatus?.balanceToday ?? p.serviceStatus?.balance ?? 0) > 0).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Unpaid
              </div>
            </div>
          </div>
        </button>
        
        {/* Paid */}
        <button
          onClick={() => setPaymentFilter("paid")}
          className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/10
                     border border-gray-200/60 dark:border-gray-700/50
                     rounded-xl
                     shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)]
                     hover:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.06)]
                     hover:border-green-300 dark:hover:border-green-700
                     transition-all duration-200
                     p-4
                     text-left
                     cursor-pointer
                     group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors shadow-sm">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {patientsLoading ? "..." : patientsList.filter((p: any) => (p.serviceStatus?.balanceToday ?? p.serviceStatus?.balance ?? 0) === 0).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Paid
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Old Slim Stats Bar - kept for reference */}
      <div className="hidden bg-white dark:bg-gray-800
                      border border-gray-200/60 dark:border-gray-700/50
                      rounded-xl
                      shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)]
                      hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]
                      transition-all duration-300
                      py-2.5 px-4
                      card-premium">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {/* Registered Today - Only show when filter is "today" */}
          {dateFilter === "today" && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-600 dark:text-gray-400">Registered Today:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {countsLoading ? "..." : todayCount}
              </span>
            </div>
          )}
          
          {/* Divider */}
          {dateFilter === "today" && (
            <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
          )}
          
          {/* Total Patients */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {patientsLoading ? "..." : patientsToDisplay.length}
            </span>
          </div>
          
          {/* Divider */}
          <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
          
          {/* Last Updated */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-gray-600 dark:text-gray-400">Updated:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
              {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Date Range Filters - Modern Underline Design with Mobile Scroll */}
      <div className="space-y-3">
        {/* Search Bar - Prominent and Always Visible */}
        <div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, ID, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(e.target.value.trim().length > 0);
              }}
              className="pl-12 pr-4 h-12 text-base
                         border-gray-300 dark:border-gray-600
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                         focus:border-blue-500 dark:focus:border-blue-400
                         rounded-xl
                         shadow-sm
                         transition-all duration-200"
              data-testid="input-search-main"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearch(false);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 
                           text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                           transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Payment Status:
          </span>
          <button
            onClick={() => setPaymentFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium
                       transition-all duration-200
                       ${paymentFilter === "all"
                         ? "bg-teal-500 text-white shadow-md hover:bg-teal-600"
                         : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                       }`}
            data-testid="filter-all"
          >
            All
            <Badge 
              variant="secondary" 
              className="ml-2 bg-white/20 text-white dark:bg-black/20"
            >
              {filteredPatientsList.length}
            </Badge>
          </button>
          <button
            onClick={() => setPaymentFilter("unpaid")}
            className={`px-4 py-2 rounded-full text-sm font-medium
                       transition-all duration-200
                       ${paymentFilter === "unpaid"
                         ? "bg-red-600 text-white shadow-md"
                         : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                       }`}
            data-testid="filter-unpaid"
          >
            Unpaid Only
            <Badge 
              variant="secondary" 
              className="ml-2 bg-white/20 text-white dark:bg-black/20"
            >
              {patientsList.filter((p: any) => (p.serviceStatus?.balanceToday ?? p.serviceStatus?.balance ?? 0) > 0).length}
            </Badge>
          </button>
          <button
            onClick={() => setPaymentFilter("paid")}
            className={`px-4 py-2 rounded-full text-sm font-medium
                       transition-all duration-200
                       ${paymentFilter === "paid"
                         ? "bg-green-600 text-white shadow-md"
                         : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                       }`}
            data-testid="filter-paid"
          >
            Paid
            <Badge 
              variant="secondary" 
              className="ml-2 bg-white/20 text-white dark:bg-black/20"
            >
              {patientsList.filter((p: any) => (p.serviceStatus?.balanceToday ?? p.serviceStatus?.balance ?? 0) === 0).length}
            </Badge>
          </button>
        </div>

        {/* Date Range Tabs */}
        <div className="flex items-center gap-1">
          {/* Tab container with bottom border - scrollable on mobile */}
          <div className="flex items-center gap-1 flex-1 
                          border-b-2 border-gray-200 dark:border-gray-700
                          overflow-x-auto scrollbar-hide">
            
            {/* Today tab */}
            <button
              onClick={() => setDateFilter("today")}
              className={`relative px-4 py-2.5 font-semibold text-sm whitespace-nowrap
                         transition-all duration-300
                         ${dateFilter === "today" 
                           ? "text-blue-700 dark:text-blue-300" 
                           : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                         }`}
            >
              Today
              {dateFilter === "today" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-600 dark:bg-blue-400
                                shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              )}
            </button>
            
            {/* Yesterday tab */}
            <button
              onClick={() => setDateFilter("yesterday")}
              className={`relative px-4 py-2.5 font-medium text-sm whitespace-nowrap
                         transition-all duration-300
                         group
                         ${dateFilter === "yesterday" 
                           ? "text-blue-700 dark:text-blue-300" 
                           : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                         }`}
            >
              Yesterday
              {dateFilter === "yesterday" ? (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-600 dark:bg-blue-400
                                shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              ) : (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-400 dark:bg-blue-500
                                opacity-0 group-hover:opacity-50
                                transition-opacity duration-300"></div>
              )}
            </button>
            
            {/* Last 7 Days tab */}
            <button
              onClick={() => setDateFilter("last7days")}
              className={`relative px-3 sm:px-4 py-2.5 font-medium text-sm whitespace-nowrap
                         transition-all duration-300
                         group
                         ${dateFilter === "last7days" 
                           ? "text-blue-700 dark:text-blue-300" 
                           : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                         }`}
            >
              <span className="hidden sm:inline">Last 7 Days</span>
              <span className="sm:hidden">7 Days</span>
              {dateFilter === "last7days" ? (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-600 dark:bg-blue-400
                                shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              ) : (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-400 dark:bg-blue-500
                                opacity-0 group-hover:opacity-50
                                transition-opacity duration-300"></div>
              )}
            </button>
            
            {/* Last 30 Days tab */}
            <button
              onClick={() => setDateFilter("last30days")}
              className={`relative px-3 sm:px-4 py-2.5 font-medium text-sm whitespace-nowrap
                         transition-all duration-300
                         group
                         ${dateFilter === "last30days" 
                           ? "text-blue-700 dark:text-blue-300" 
                           : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                         }`}
            >
              <span className="hidden sm:inline">Last 30 Days</span>
              <span className="sm:hidden">30 Days</span>
              {dateFilter === "last30days" ? (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-600 dark:bg-blue-400
                                shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              ) : (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-400 dark:bg-blue-500
                                opacity-0 group-hover:opacity-50
                                transition-opacity duration-300"></div>
              )}
            </button>
            
            {/* Custom Range tab */}
            <button
              onClick={() => setDateFilter("custom")}
              className={`relative px-3 sm:px-4 py-2.5 font-medium text-sm whitespace-nowrap
                         transition-all duration-300
                         group
                         ${dateFilter === "custom" 
                           ? "text-blue-700 dark:text-blue-300" 
                           : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                         }`}
            >
              <span className="hidden sm:inline">Custom Range</span>
              <span className="sm:hidden">Custom</span>
              {dateFilter === "custom" ? (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-600 dark:bg-blue-400
                                shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              ) : (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 
                                bg-blue-400 dark:bg-blue-500
                                opacity-0 group-hover:opacity-50
                                transition-opacity duration-300"></div>
              )}
            </button>
          </div>
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
      </div>

      {/* Patients Table - Premium with Mobile Cards */}
      <Card className="border border-gray-200/60 dark:border-gray-700/50 
                       rounded-xl 
                       shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04),0_8px_16px_rgba(15,23,42,0.03)]
                       hover:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_12px_24px_rgba(15,23,42,0.05)]
                       transition-all duration-300
                       card-premium">
        <CardHeader className="border-b border-gray-200/70 dark:border-gray-800/70 
                               bg-gradient-to-r from-gray-50/80 to-white 
                               dark:from-gray-800/60 dark:to-gray-900
                               rounded-t-xl py-3 px-5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="w-4 h-4" />
            {showSearch && searchQuery ? `Search Results for "${searchQuery}"` :
            showSearch && !searchQuery ? "Enter search query" :
            dateFilter === "today" ? "Patients Registered Today" :
            dateFilter === "yesterday" ? "Patients Registered Yesterday" :
            dateFilter === "last7days" ? "Patients from Last 7 Days" :
            dateFilter === "last30days" ? "Patients from Last 30 Days" :
            "Patients in Custom Range"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
        {patientsLoading || (showSearch && searchLoading) ? (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : patientsToDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            {/* Icon with colored background and badge */}
            <div className="relative mb-8">
              {/* Main icon circle */}
              <div className="p-8 rounded-full 
                              bg-gradient-to-br from-teal-100/90 via-teal-50/80 to-cyan-100/90
                              dark:from-teal-900/40 dark:via-teal-800/30 dark:to-cyan-900/40
                              shadow-[0_8px_32px_rgba(20,184,166,0.15),
                                      0_4px_16px_rgba(20,184,166,0.10)]
                              dark:shadow-[0_8px_32px_rgba(20,184,166,0.25),
                                           0_4px_16px_rgba(20,184,166,0.15)]">
                <Users className="w-20 h-20 text-teal-600 dark:text-teal-400" />
              </div>
              
              {/* Plus badge (encourages action) */}
              <div className="absolute -bottom-2 -right-2 
                              p-3 rounded-full 
                              bg-teal-600 dark:bg-teal-500
                              shadow-[0_4px_16px_rgba(20,184,166,0.4),
                                      0_2px_8px_rgba(20,184,166,0.3)]
                              dark:shadow-[0_4px_16px_rgba(20,184,166,0.6),
                                           0_2px_8px_rgba(20,184,166,0.4)]
                              animate-pulse">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {/* Messaging */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {showSearch && searchQuery
                ? "No patients found"
                : dateFilter === "custom" && !customStartDate && !customEndDate
                ? "Select date range"
                : "No patients found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
              {showSearch && searchQuery
                ? "No patients found matching your search. Try different keywords."
                : dateFilter === "custom" && !customStartDate && !customEndDate
                ? "Select start and end dates above to view patients in custom range"
                : "No patients registered for this date range. Start by registering your first patient to begin managing records."}
            </p>
            
            {/* Call-to-action button */}
            {!showSearch && (
              <Button 
                onClick={handleNewPatient}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 
                           hover:from-teal-600 hover:to-cyan-600
                           dark:from-teal-500 dark:to-cyan-400
                           dark:hover:from-teal-600 dark:hover:to-cyan-500
                           text-white font-semibold text-base
                           px-6 py-3
                           shadow-[0_4px_16px_rgba(20,184,166,0.25),
                                   0_2px_8px_rgba(6,182,212,0.15)]
                           hover:shadow-[0_8px_24px_rgba(20,184,166,0.35),
                                        0_4px_12px_rgba(6,182,212,0.25)]
                           hover:-translate-y-1
                           active:translate-y-0
                           transition-all duration-300
                           motion-reduce:transform-none motion-reduce:transition-none
                           flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Register Your First Patient
              </Button>
            )}
          </div>
        ) : (
            <>
              {/* Desktop Table View - hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50/90 to-gray-100/80 
                                    dark:from-gray-800/70 dark:to-gray-900/60">
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Patient
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        ID
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Age/Gender
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Contact
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Registered
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Consultation
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {patientsToDisplay.map((patient: any, index: number) => {
                      const isNewlyRegistered = patient.patientId === newlyRegisteredPatientId;
                      return (
                      <tr
                        key={patient.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          isNewlyRegistered 
                            ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500 animate-pulse' 
                            : index % 2 === 0
                              ? 'bg-white dark:bg-gray-900 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 hover:shadow-sm'
                              : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 hover:shadow-sm'
                        }`}
                        onClick={() => handleViewPatient(patient)}
                        data-testid={`patient-row-${patient.patientId}`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold shadow-md transition-transform duration-300 hover:scale-110 motion-reduce:transform-none ${getAvatarColor(patient.firstName + patient.lastName)}`}
                            >
                              {getInitials(patient.firstName, patient.lastName)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {patient.firstName} {patient.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-500 font-medium">
                          {patient.patientId}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {patient.age ? `${patient.age}` : "—"}
                          {patient.gender ? ` • ${patient.gender}` : ""}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {patient.phoneNumber ? (
                            <span className="text-gray-600 dark:text-gray-400">{patient.phoneNumber}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              No contact
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatClinicDay((patient as any).clinicDay || patient.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          {patient.serviceStatus ? (
                            ((patient.serviceStatus.balanceToday ?? patient.serviceStatus.balance) || 0) > 0 ? (
                              <Badge 
                                variant="outline" 
                                className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 font-semibold shadow-sm flex items-center gap-1 w-fit"
                                data-testid={`badge-consultation-due-${patient.patientId}`}
                              >
                                <DollarSign className="w-3 h-3" />
                                {money(patient.serviceStatus.balanceToday ?? patient.serviceStatus.balance)} Due
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 font-semibold shadow-sm flex items-center gap-1 w-fit"
                                data-testid={`badge-consultation-paid-${patient.patientId}`}
                              >
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </Badge>
                            )
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                className="font-semibold 
                                           border-teal-200 dark:border-teal-800
                                           hover:bg-teal-600 hover:text-white hover:border-teal-600 
                                           dark:hover:bg-teal-500 dark:hover:border-teal-500
                                           hover:shadow-[0_4px_12px_rgba(20,184,166,0.25),0_2px_6px_rgba(6,182,212,0.15)]
                                           transition-all duration-200"
                                data-testid={`button-actions-${patient.patientId}`}
                              >
                                Actions
                                <MoreVertical className="w-4 h-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPatient(patient);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPatient(patient);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Patient
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/billing?patientId=${patient.patientId}`;
                                }}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Billing & Payments
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/treatment?patientId=${patient.patientId}`;
                                }}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Start Visit
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

              {/* Mobile Card View - shown only on mobile */}
              <div className="md:hidden space-y-3 p-4">
                {patientsToDisplay.map((patient: any) => {
                  const isNewlyRegistered = patient.patientId === newlyRegisteredPatientId;
                  return (
                    <div
                      key={patient.id}
                      className={`rounded-xl border p-4 cursor-pointer
                                  transition-all duration-300
                                  ${isNewlyRegistered 
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 shadow-lg' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700'
                                  }`}
                      onClick={() => handleViewPatient(patient)}
                      data-testid={`patient-card-${patient.patientId}`}
                    >
                      {/* Patient Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0 ${getAvatarColor(patient.firstName + patient.lastName)}`}
                        >
                          {getInitials(patient.firstName, patient.lastName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base text-gray-900 dark:text-white truncate">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            ID: {patient.patientId}
                          </div>
                        </div>
                      </div>

                      {/* Patient Details */}
                      <div className="space-y-2 mb-3">
                        {(patient.age || patient.gender) && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              {patient.age ? `${patient.age}` : ""}
                              {patient.gender ? ` • ${patient.gender}` : ""}
                            </span>
                          </div>
                        )}
                        
                        {/* Contact */}
                        <div className="text-sm">
                          {patient.phoneNumber ? (
                            <span className="text-gray-600 dark:text-gray-400">{patient.phoneNumber}</span>
                          ) : (
                            <span className="text-orange-500 dark:text-orange-400 text-xs italic flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              No contact info
                            </span>
                          )}
                        </div>
                        
                        {/* Consultation Badge */}
                        {patient.serviceStatus && (
                          <div>
                            {((patient.serviceStatus.balanceToday ?? patient.serviceStatus.balance) || 0) > 0 ? (
                              <Badge 
                                variant="outline" 
                                className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 font-semibold text-xs flex items-center gap-1 w-fit"
                                data-testid={`badge-consultation-due-mobile-${patient.patientId}`}
                              >
                                <DollarSign className="w-3 h-3" />
                                {money(patient.serviceStatus.balanceToday ?? patient.serviceStatus.balance)} Due
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 font-semibold text-xs flex items-center gap-1 w-fit"
                                data-testid={`badge-consultation-paid-mobile-${patient.patientId}`}
                              >
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* View Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPatient(patient);
                        }}
                        className="w-full font-semibold 
                                   border-teal-200 dark:border-teal-800
                                   hover:bg-teal-600 hover:text-white hover:border-teal-600
                                   dark:hover:bg-teal-500 dark:hover:border-teal-500
                                   transition-all duration-300"
                        data-testid={`button-view-mobile-${patient.patientId}`}
                      >
                        View Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Patient Registration/Edit Dialog - Premium Style */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto
                                   sm:rounded-2xl
                                   shadow-[0_20px_50px_rgba(15,23,42,0.15),0_8px_20px_rgba(15,23,42,0.10)]
                                   dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.3)]
                                   border border-gray-200/60 dark:border-gray-700/50
                                   animate-in fade-in duration-300">
          <DialogHeader className="border-b border-gray-200/70 dark:border-gray-800/70 pb-4">
            <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
              {editingPatient ? "Edit Patient" : "New Patient Registration"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-firstname"
                            placeholder="Enter first name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-lastname"
                            placeholder="Enter last name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-age"
                            placeholder="e.g., 25, 6 months, 2 years"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-phone"
                          placeholder="Enter phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="textarea-allergies"
                          placeholder="List any known allergies"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical History</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="textarea-medical-history"
                          placeholder="Previous conditions, surgeries, etc."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!editingPatient && (
                  <div className="space-y-3 p-4 border border-teal-200 rounded-lg bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800">
                    {/* Consultation Fee Toggle */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="collect-fee"
                        checked={collectConsultationFee}
                        onCheckedChange={setCollectConsultationFee}
                        data-testid="switch-collect-fee"
                        className="data-[state=checked]:bg-teal-500 dark:data-[state=checked]:bg-teal-500
                                   transition-all duration-300 ease-in-out
                                   shadow-sm data-[state=checked]:shadow-md"
                      />
                      <label
                        htmlFor="collect-fee"
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        {selectedConsultationService 
                          ? `Collect consultation fee (${money(selectedConsultationService.price)})`
                          : "Collect consultation fee"}
                      </label>
                    </div>

                    {/* Consultation Service Dropdown - shown when toggle is on */}
                    {collectConsultationFee && (
                      <div className="space-y-2">
                        {activeConsultationServices.length > 0 ? (
                          <>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Consultation Type
                            </label>
                            <Select
                              value={selectedConsultationServiceId?.toString() || ""}
                              onValueChange={(value) => setSelectedConsultationServiceId(parseInt(value))}
                            >
                              <SelectTrigger 
                                className="w-full bg-white dark:bg-gray-800"
                                data-testid="select-consultation-service"
                              >
                                <SelectValue placeholder="Select consultation type" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeConsultationServices.map((service: any) => (
                                  <SelectItem 
                                    key={service.id} 
                                    value={service.id.toString()}
                                    data-testid={`option-service-${service.id}`}
                                  >
                                    {service.name} - {money(service.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedConsultationService && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {selectedConsultationService.description || "Standard consultation service"}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-red-700 dark:text-red-300">
                              <strong>No active consultation services found.</strong>
                              <br />
                              Please create and activate a consultation service in Service Management before registering patients with consultation fees.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 
                               hover:from-teal-600 hover:to-cyan-600
                               dark:from-teal-500 dark:to-cyan-400
                               dark:hover:from-teal-600 dark:hover:to-cyan-500
                               text-white font-semibold
                               shadow-[0_4px_12px_rgba(20,184,166,0.25),0_2px_6px_rgba(6,182,212,0.15)]
                               hover:shadow-[0_8px_20px_rgba(20,184,166,0.35),0_4px_10px_rgba(6,182,212,0.25)]
                               transition-all duration-300"
                    disabled={
                      createPatientMutation.isPending ||
                      updatePatientMutation.isPending
                    }
                    data-testid="button-save-patient"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPatient ? "Update Patient" : "Register Patient"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="sm:w-auto"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== QUICK VIEW / ACTION PANEL ==================== */}
      {activePatient && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setActivePatient(null)}
          aria-hidden
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          {/* panel - full width on mobile, sidebar on desktop */}
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-[420px] md:w-[480px] 
                        bg-white dark:bg-gray-900 
                        shadow-2xl 
                        border-l border-gray-200 dark:border-gray-700 
                        overflow-y-auto
                        animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b dark:border-gray-700 flex items-center justify-between
                            bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/60 dark:to-gray-900">
              <div>
                <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {activePatient.firstName} {activePatient.lastName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {activePatient.patientId}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePatient(null)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Summary */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <div>
                  <span className="font-medium">Age/Gender:</span>{" "}
                  {activePatient.age ?? "—"}{" "}
                  {activePatient.gender ? `• ${activePatient.gender}` : ""}
                </div>
                <div>
                  <span className="font-medium">Contact:</span>{" "}
                  {activePatient.phoneNumber || "—"}
                </div>
              </div>

              {/* Service chips if available */}
              {activePatient.serviceStatus && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Today's Orders
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const s = activePatient.serviceStatus;
                      const d = s.departments || {};
                      const chips: JSX.Element[] = [];

                      const chip = (
                        label: string,
                        pending?: number,
                        done?: number,
                        color = "bg-gray-50 dark:bg-gray-800",
                      ) => (
                        <span
                          key={label}
                          className={`inline-flex items-center gap-2 rounded-full ${color} px-3 py-1.5 text-xs font-medium`}
                        >
                          {label}
                          {pending ? (
                            <Badge
                              variant="outline"
                              className="px-1 py-0 h-4 text-xs"
                            >
                              {pending} pending
                            </Badge>
                          ) : null}
                          {done ? (
                            <Badge
                              variant="secondary"
                              className="px-1 py-0 h-4 text-xs"
                            >
                              {done} done
                            </Badge>
                          ) : null}
                        </span>
                      );

                      if (d.laboratory) {
                        chips.push(
                          chip(
                            "Lab",
                            d.laboratory.pending,
                            d.laboratory.completed,
                            "bg-purple-50 dark:bg-purple-900/20",
                          ),
                        );
                      }
                      if (d.radiology) {
                        chips.push(
                          chip(
                            "X-Ray",
                            d.radiology.pending,
                            d.radiology.completed,
                            "bg-cyan-50 dark:bg-cyan-900/20",
                          ),
                        );
                      }
                      if (d.ultrasound) {
                        chips.push(
                          chip(
                            "Ultrasound",
                            d.ultrasound.pending,
                            d.ultrasound.completed,
                            "bg-green-50 dark:bg-green-900/20",
                          ),
                        );
                      }
                      if (d.pharmacy) {
                        chips.push(
                          chip(
                            "Pharmacy",
                            d.pharmacy.pending,
                            d.pharmacy.completed,
                            "bg-orange-50 dark:bg-orange-900/20",
                          ),
                        );
                      }

                      if (chips.length === 0) {
                        chips.push(
                          <span
                            key="none"
                            className="text-xs text-gray-500"
                          >
                            {s.pendingServices || s.completedServices
                              ? `${s.pendingServices || 0} Pending • ${s.completedServices || 0} Done`
                              : "No orders"}
                          </span>,
                        );
                      }
                      return chips;
                    })()}
                  </div>
                </div>
              )}

              {/* Consultation Payment Status */}
              {activePatient.serviceStatus && (
                <div className="mt-3">
                  {((activePatient.serviceStatus.balanceToday ??
                    activePatient.serviceStatus.balance) ||
                    0) > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 text-xs font-medium">
                      <CreditCard className="w-3.5 h-3.5" />
                      Consultation: {money(
                        activePatient.serviceStatus.balanceToday ??
                          activePatient.serviceStatus.balance,
                      )} Due
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5 text-xs font-medium">
                      <CreditCard className="w-3.5 h-3.5" />
                      Consultation: Paid
                    </div>
                  )}
                </div>
              )}

              {/* Quick actions - Simplified for Reception */}
              <div className="mt-6 space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 
                             hover:from-teal-600 hover:to-cyan-600
                             dark:from-teal-500 dark:to-cyan-400
                             dark:hover:from-teal-600 dark:hover:to-cyan-500
                             text-white font-semibold
                             shadow-[0_4px_12px_rgba(20,184,166,0.25),0_2px_6px_rgba(6,182,212,0.15)]
                             hover:shadow-[0_8px_20px_rgba(20,184,166,0.35),0_4px_10px_rgba(6,182,212,0.25)]
                             transition-all duration-300
                             h-12"
                  onClick={() =>
                    jump(`/billing?patientId=${activePatient.patientId}`)
                  }
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Billing & Payments
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 font-medium
                             border-gray-300 dark:border-gray-600
                             hover:bg-gray-50 dark:hover:bg-gray-800
                             transition-all duration-300"
                  onClick={() => {
                    const p: Patient = activePatient;
                    setActivePatient(null);
                    handleEditPatient(p);
                  }}
                  data-testid="button-edit-patient"
                >
                  ✏️ Edit Patient Details
                </Button>
                
                {/* Admin-only Delete button (visible when auth disabled or user is admin) */}
                {(!user || user?.role === 'admin') && (
                  <Button
                    variant="destructive"
                    className="w-full h-12 font-medium
                               shadow-sm hover:shadow-md
                               transition-all duration-300"
                    onClick={async () => {
                      setDeleteResult(null);
                      setDeletionReason("");
                      setShowDeleteDialog(true);
                      
                      // Pre-check if deletion will be blocked
                      try {
                        const response = await fetch(`/api/patients/${activePatient.patientId}`, {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reason: "", forceDelete: false }),
                          credentials: "include",
                        });
                        
                        const data = await response.json();
                        
                        if (!response.ok && data.blockReasons) {
                          // Set the blocking result immediately
                          setDeleteResult({
                            blocked: true,
                            blockReasons: data.blockReasons,
                            impactSummary: data.impactSummary,
                          });
                        }
                      } catch (error) {
                        console.error("Pre-check error:", error);
                      }
                    }}
                    data-testid="button-delete-patient"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Patient
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ================== /QUICK VIEW ================== */}

      {/* ==================== DELETE CONFIRMATION DIALOG ==================== */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Patient?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {deleteResult?.blocked ? (
                <>
                  <div className="text-red-600 font-semibold">
                    Cannot Delete Patient
                  </div>
                  <div className="space-y-2">
                    {deleteResult.blockReasons.map((reason: string, idx: number) => (
                      <div key={idx} className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                        {reason}
                      </div>
                    ))}
                  </div>
                  {deleteResult.impactSummary && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <div className="font-medium mb-1">Related Records:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {deleteResult.impactSummary.encounters > 0 && (
                          <li>{deleteResult.impactSummary.encounters} Encounter(s)</li>
                        )}
                        {deleteResult.impactSummary.labTests > 0 && (
                          <li>{deleteResult.impactSummary.labTests} Lab Test(s)</li>
                        )}
                        {deleteResult.impactSummary.xrayExams > 0 && (
                          <li>{deleteResult.impactSummary.xrayExams} X-Ray(s)</li>
                        )}
                        {deleteResult.impactSummary.ultrasoundExams > 0 && (
                          <li>{deleteResult.impactSummary.ultrasoundExams} Ultrasound(s)</li>
                        )}
                        {deleteResult.impactSummary.pharmacyOrders > 0 && (
                          <li>{deleteResult.impactSummary.pharmacyOrders} Pharmacy Order(s)</li>
                        )}
                        {deleteResult.impactSummary.payments > 0 && (
                          <li>{deleteResult.impactSummary.payments} Payment(s)</li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    You are about to delete patient:{" "}
                    <strong>
                      {activePatient?.firstName} {activePatient?.lastName} (ID: {activePatient?.patientId})
                    </strong>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                      This will:
                    </div>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Mark the patient as deleted</li>
                      <li>Cancel all pending lab tests, X-rays, ultrasounds, and pharmacy orders</li>
                      <li>Close all open encounters</li>
                      <li>Remove patient from all department queues</li>
                    </ul>
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reason for deletion (optional):
                    </label>
                    <Textarea
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="e.g., Test patient, duplicate record, etc."
                      className="mt-1"
                      rows={2}
                      data-testid="textarea-deletion-reason"
                    />
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deleteResult?.blocked ? (
              <>
                <AlertDialogCancel onClick={() => {
                  setDeleteResult(null);
                  setShowDeleteDialog(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowForceDeleteDialog(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="button-force-delete"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Force Delete
                </AlertDialogAction>
              </>
            ) : (
              <>
                <AlertDialogCancel onClick={() => {
                  setDeletionReason("");
                  setShowDeleteDialog(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deletePatientMutation.mutate({
                      patientId: activePatient.patientId,
                      reason: deletionReason || undefined,
                      forceDelete: false,
                    });
                  }}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-confirm-delete"
                  disabled={deletePatientMutation.isPending}
                >
                  {deletePatientMutation.isPending ? "Deleting..." : "Delete Patient"}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ================== /DELETE DIALOG ================== */}

      {/* ================== FORCE DELETE CONFIRMATION DIALOG ================== */}
      <AlertDialog open={showForceDeleteDialog} onOpenChange={setShowForceDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Force Delete Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-base font-medium">
                You are about to force delete this patient despite existing financial history.
              </p>
              
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-4 space-y-2">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  This action will:
                </p>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-disc list-inside">
                  <li>Bypass all safety protections</li>
                  <li>Affect financial audit trails</li>
                  <li>Delete {deleteResult?.impactSummary?.payments || 0} payment record(s)</li>
                  {deleteResult?.impactSummary?.labTests > 0 && (
                    <li>Delete {deleteResult.impactSummary.labTests} lab test(s)</li>
                  )}
                  {deleteResult?.impactSummary?.xrayExams > 0 && (
                    <li>Delete {deleteResult.impactSummary.xrayExams} X-ray exam(s)</li>
                  )}
                  {deleteResult?.impactSummary?.ultrasoundExams > 0 && (
                    <li>Delete {deleteResult.impactSummary.ultrasoundExams} ultrasound exam(s)</li>
                  )}
                  {deleteResult?.impactSummary?.pharmacyOrders > 0 && (
                    <li>Delete {deleteResult.impactSummary.pharmacyOrders} pharmacy order(s)</li>
                  )}
                </ul>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone. All related records will be permanently removed from the system.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowForceDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowForceDeleteDialog(false);
                deletePatientMutation.mutate({
                  patientId: activePatient.patientId,
                  reason: deletionReason || "Force deleted despite financial history",
                  forceDelete: true,
                });
              }}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-confirm-force-delete"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Proceed with Force Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ================== /FORCE DELETE CONFIRMATION DIALOG ================== */}
    </div>
  );
}
