import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { getDateRangeForAPI, formatClinicDay } from "@/lib/date-utils";

function money(n?: number) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return `${Math.round(v).toLocaleString()} SSP`;
}

export default function Patients() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [collectConsultationFee, setCollectConsultationFee] = useState(false);

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

  // Billing settings
  const { data: billingSettings } = useQuery({
    queryKey: ["/api/billing/settings"],
  });

  // Get consultation service from services list for accurate pricing
  const { data: servicesList } = useQuery({
    queryKey: ["/api/services"],
  });
  
  const consultationService = (servicesList as any[] || []).find(
  (s: any) => s.code === "CONS-GEN" // Use stable code 'CONS-GEN' (matches backend and database)
);
  
  // Debug log to see what we're getting
  console.log("Consultation service found:", consultationService);

  useEffect(() => {
    if (billingSettings?.requirePrepayment) {
      setCollectConsultationFee(true);
    }
  }, [billingSettings]);

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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
    // --- FIX: Send all data to the new atomic endpoint ---
    const registrationData = {
      patientData: data,
      collectConsultationFee: collectConsultationFee, // Get state of the checkbox
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
    setCollectConsultationFee(billingSettings?.requirePrepayment || false);
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
    // No longer enforce consultation fee - manager can override
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
    setCollectConsultationFee(billingSettings?.requirePrepayment || false);
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
      queryKey: ["/api/patients", { preset: dateFilter, customStartDate, customEndDate }],
      queryFn: async () => {
        const params = new URLSearchParams();
        
        // Use preset parameter for cleaner API calls and better cache key differentiation
        if (dateFilter === 'custom' && customStartDate && customEndDate) {
          params.append("preset", "custom");
          params.append("from", customStartDate.toISOString().split('T')[0]);
          params.append("to", customEndDate.toISOString().split('T')[0]);
        } else {
          params.append("preset", dateFilter);
        }
        
        params.append("withStatus", "true"); // Include consultation payment status

        try {
          const response = await fetch(`/api/patients?${params}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch patients: ${response.statusText}`);
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

  // Determine which patients to display
  const patientsToDisplay = showSearch ? searchResults : patientsList;

  const jump = (path: string) => {
    window.location.href = path;
  };

  // Color generation for avatars
  function getAvatarColor(name: string): string {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-rose-500",
    ];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Patient Management
          </h1>
          {/* Prominent New Patient Button */}
          <Button
            onClick={handleNewPatient}
            size="lg"
            className="bg-gradient-to-r from-medical-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-semibold"
            data-testid="button-new-patient-primary"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Register New Patient
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {dateFilter === "today" && (
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Registered Today
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {countsLoading ? "..." : todayCount}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Patients in Range
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {patientsLoading ? "..." : patientsToDisplay.length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Filter className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Last Updated
                  </p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {lastRefresh.toLocaleTimeString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-700/30 rounded-xl">
                  <Clock className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Range Filters */}
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("today")}
              className={dateFilter === "today" ? "bg-medical-blue hover:bg-blue-700" : ""}
              data-testid="button-filter-today"
            >
              Today
            </Button>
            <Button
              variant={dateFilter === "yesterday" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("yesterday")}
              className={dateFilter === "yesterday" ? "bg-medical-blue hover:bg-blue-700" : ""}
              data-testid="button-filter-yesterday"
            >
              Yesterday
            </Button>
            <Button
              variant={dateFilter === "last7days" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("last7days")}
              className={dateFilter === "last7days" ? "bg-medical-blue hover:bg-blue-700" : ""}
              data-testid="button-filter-last7"
            >
              Last 7 Days
            </Button>
            <Button
              variant={dateFilter === "last30days" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("last30days")}
              className={dateFilter === "last30days" ? "bg-medical-blue hover:bg-blue-700" : ""}
              data-testid="button-filter-last30"
            >
              Last 30 Days
            </Button>
            <Button
              variant={dateFilter === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("custom")}
              className={dateFilter === "custom" ? "bg-medical-blue hover:bg-blue-700" : ""}
              data-testid="button-filter-custom"
            >
              Custom Range
            </Button>
            <Button
              variant={showSearch ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className={`ml-auto ${showSearch ? "bg-medical-blue hover:bg-blue-700" : ""}`}
              data-testid="button-toggle-search"
            >
              <Search className="w-4 h-4 mr-2" />
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
          
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          )}
        </div>
      </div>

      {/* Patients Table */}
      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
            {showSearch && searchQuery && `Search Results for "${searchQuery}"`}
            {showSearch && !searchQuery && "Enter search query"}
            {!showSearch && dateFilter === "today" && `Patients Registered Today`}
            {!showSearch && dateFilter === "yesterday" && `Patients Registered Yesterday`}
            {!showSearch && dateFilter === "last7days" && `Patients from Last 7 Days`}
            {!showSearch && dateFilter === "last30days" && `Patients from Last 30 Days`}
            {!showSearch && dateFilter === "custom" && `Patients in Custom Range`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientsLoading || (showSearch && searchLoading) ? (
            <div className="text-center py-8">Loading...</div>
          ) : patientsToDisplay.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {showSearch && searchQuery
                ? "No patients found matching your search"
                : dateFilter === "custom" && !customStartDate && !customEndDate
                ? "📅 Select start and end dates above to view patients in custom range"
                : "No patients found for this date range"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Age/Gender
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Registered
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Consultation
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patientsToDisplay.map((patient: any) => {
                    const isNewlyRegistered = patient.patientId === newlyRegisteredPatientId;
                    return (
                    <tr
                      key={patient.id}
                      className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all duration-500 ${
                        isNewlyRegistered 
                          ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500 animate-pulse' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                      onClick={() => handleViewPatient(patient)}
                      data-testid={`patient-row-${patient.patientId}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(patient.firstName + patient.lastName)}`}
                          >
                            {getInitials(patient.firstName, patient.lastName)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {patient.firstName} {patient.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {patient.patientId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {patient.age ? `${patient.age}` : "—"}
                        {patient.gender ? ` • ${patient.gender}` : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {patient.phoneNumber || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatClinicDay((patient as any).clinicDay || patient.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {patient.serviceStatus ? (
                          ((patient.serviceStatus.balanceToday ?? patient.serviceStatus.balance) || 0) > 0 ? (
                            <Badge 
                              variant="outline" 
                              className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 font-semibold shadow-sm"
                              data-testid={`badge-consultation-due-${patient.patientId}`}
                            >
                              {money(patient.serviceStatus.balanceToday ?? patient.serviceStatus.balance)} Due
                            </Badge>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 font-semibold shadow-sm"
                              data-testid={`badge-consultation-paid-${patient.patientId}`}
                            >
                              Paid
                            </Badge>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPatient(patient);
                          }}
                          className="font-semibold hover:bg-medical-blue hover:text-white hover:border-medical-blue transition-all"
                          data-testid={`button-view-${patient.patientId}`}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Registration/Edit Dialog */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
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

                {!editingPatient && billingSettings && (
                  <div className="flex items-center space-x-2 p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <Switch
                      id="collect-fee"
                      checked={collectConsultationFee}
                      onCheckedChange={setCollectConsultationFee}
                      data-testid="switch-collect-fee"
                    />
                    <label
                      htmlFor="collect-fee"
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      {(() => {
                        const price = consultationService?.price || parseFloat(billingSettings.consultationFee);
                        console.log("Displaying consultation fee:", price, "consultationService:", consultationService);
                        return `Collect consultation fee (${money(price)})`;
                      })()}
                      {billingSettings.requirePrepayment && (
                        <Badge variant="default" className="ml-2">Recommended</Badge>
                      )}
                    </label>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
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
          <div className="absolute inset-0 bg-black/30" />
          {/* panel */}
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-[420px] md:w-[480px] bg-white dark:bg-gray-900 shadow-2xl border-l dark:border-gray-700 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">
                  {activePatient.firstName} {activePatient.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  ID: {activePatient.patientId}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePatient(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Summary */}
            <div className="p-4 space-y-3">
              <div className="text-sm text-gray-700 dark:text-gray-300">
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
                <div className="mt-2">
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
                          className={`inline-flex items-center gap-2 rounded-full ${color} px-2 py-1 text-xs`}
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
                <div className="mt-1">
                  {((activePatient.serviceStatus.balanceToday ??
                    activePatient.serviceStatus.balance) ||
                    0) > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 px-3 py-1 text-xs">
                      <CreditCard className="w-3 h-3" />
                      Consultation: {money(
                        activePatient.serviceStatus.balanceToday ??
                          activePatient.serviceStatus.balance,
                      )} Due
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 px-3 py-1 text-xs">
                      <CreditCard className="w-3 h-3" />
                      Consultation: Paid
                    </div>
                  )}
                </div>
              )}

              {/* Quick actions - Simplified for Reception */}
              <div className="mt-4 space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() =>
                    jump(`/billing?patientId=${activePatient.patientId}`)
                  }
                  size="lg"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Billing & Payments
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
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
                    className="w-full"
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
