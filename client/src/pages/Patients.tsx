import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus,
  Save,
  X,
  Printer,
  Filter,
  Calendar,
  Users,
  Search,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import PatientSearch from "@/components/PatientSearch";
import {
  insertPatientSchema,
  type InsertPatient,
  type Patient,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

function money(n?: number) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  try {
    return v.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  } catch {
    return `₦${v.toLocaleString()}`;
  }
}

export default function Patients() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [collectConsultationFee, setCollectConsultationFee] = useState(false);

  // NEW: quick-view panel state (we keep full row object to access serviceStatus)
  const [activePatient, setActivePatient] = useState<any | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString("en-CA");
  });

  const [viewMode, setViewMode] = useState<"today" | "date" | "search" | "all">(
    () => {
      try {
        const savedMode = localStorage.getItem("patient-view-mode");
        if (
          savedMode &&
          ["today", "date", "search", "all"].includes(savedMode)
        ) {
          return savedMode as "today" | "date" | "search" | "all";
        }
      } catch {}
      return "today";
    },
  );

  const handleViewModeChange = (m: "today" | "date" | "search" | "all") => {
    setViewMode(m);
    try {
      localStorage.setItem("patient-view-mode", m);
    } catch {}
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Billing settings
  const { data: billingSettings } = useQuery({
    queryKey: ["/api/billing/settings"],
  });

  useEffect(() => {
    if (billingSettings?.requirePrepayment) {
      setCollectConsultationFee(true);
    }
  }, [billingSettings]);

  // Counts
  const { data: patientCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["/api/patients/counts", viewMode, selectedDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (viewMode === "date") params.append("date", selectedDate);
      return fetch(`/api/patients/counts?${params}`).then((r) => r.json());
    },
    refetchInterval: 30000,
  });

  const todayCount = patientCounts?.today || 0;
  const allCount = patientCounts?.all || 0;
  const specificDateCount = patientCounts?.date || 0;

  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);

  // Print roster (fixed: removed stray escapes)
  const handlePrintRoster = async () => {
    try {
      let apiUrl = "/api/patients";
      const qs = new URLSearchParams();
      let viewDescription = "";
      let patientCountText = "";

      if (viewMode === "today") {
        qs.append("today", "true");
        viewDescription = "Today's Patients";
        patientCountText = `${todayCount}`;
      } else if (viewMode === "date") {
        qs.append("date", selectedDate);
        viewDescription = `Patients for ${formatDate(selectedDate)}`;
        patientCountText = `${specificDateCount}`;
      } else if (viewMode === "all") {
        viewDescription = "All Patients";
        patientCountText = `${allCount}`;
      } else if (viewMode === "search") {
        if (!shouldSearch || !searchTerm.trim()) {
          toast({
            title: "No Search Results",
            description:
              "Please enter a search term and perform a search before printing",
            variant: "destructive",
          });
          return;
        }
        qs.append("search", searchTerm.trim());
        viewDescription = `Search Results for "${searchTerm}"`;
        patientCountText = "Search results";
      }

      qs.append("withStatus", "true");
      const fullUrl = qs.toString() ? `${apiUrl}?${qs}` : apiUrl;

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Failed to fetch patient data");
      const patients = await response.json();

      const html = `
        <html>
          <head>
            <title>Patient Roster - Bahr El Ghazal Clinic</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 15px; }
              .info { margin-bottom: 20px; font-size: 14px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
              th { background: #f5f5f5; }
              .patient-id { font-weight: bold; color: #0066cc; }
              .status-unpaid { color: #dc2626; font-weight: bold; }
              .status-paid { color: #16a34a; }
              .status-pending { color: #ca8a04; }
              .status-completed { color: #16a34a; }
              .status-none { color: #9ca3af; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Bahr El Ghazal Clinic</h2>
              <h3>Patient Roster</h3>
            </div>
            <div class="info">
              <p><strong>View:</strong> ${viewDescription}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Total Patients:</strong> ${patientCountText} patients</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Village</th>
                  <th>Payment Status</th>
                  <th>Service Status</th>
                </tr>
              </thead>
              <tbody>
                ${patients
                  .map((patient: any) => {
                    const s = patient.serviceStatus || {};
                    const paymentStatus = s.hasUnpaidServices
                      ? `⚠️ ${s.unpaidServices || 0} UNPAID`
                      : s.totalServices > 0
                        ? "✓ PAID"
                        : "No services";

                    const svcTxt =
                      s.totalServices > 0
                        ? [
                            s.hasPendingServices
                              ? `⏰ ${s.pendingServices || 0} pending`
                              : "",
                            s.completedServices
                              ? `✓ ${s.completedServices} done`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(", ") || "Processing"
                        : "No services";

                    return `
                      <tr>
                        <td class="patient-id">${patient.patientId}</td>
                        <td>${patient.firstName} ${patient.lastName}</td>
                        <td>${patient.age ?? "-"}</td>
                        <td>${patient.gender ?? "-"}</td>
                        <td>${patient.phoneNumber || "-"}</td>
                        <td>${patient.village || "-"}</td>
                        <td class="${
                          s.hasUnpaidServices
                            ? "status-unpaid"
                            : s.totalServices > 0
                              ? "status-paid"
                              : "status-none"
                        }">${paymentStatus}</td>
                        <td class="${
                          s.hasPendingServices
                            ? "status-pending"
                            : s.completedServices
                              ? "status-completed"
                              : "status-none"
                        }">${svcTxt}</td>
                      </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 500);
      }
    } catch (e) {
      toast({
        title: "Print Error",
        description: "Failed to generate patient roster. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const isToday = (dateStr: string) =>
    dateStr === new Date().toLocaleDateString("en-CA");

  // ----- Create / Update patient (unchanged) -----
  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: "",
      gender: undefined,
      phoneNumber: "",
      village: "",
      emergencyContact: "",
      allergies: "",
      medicalHistory: "",
    },
  });

  const { data: servicesList } = useQuery({
    queryKey: ["/api/services"],
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const patientResponse = await apiRequest("POST", "/api/patients", data);
      const patient = await patientResponse.json();

      if (collectConsultationFee && billingSettings) {
        try {
          const encounterResponse = await fetch("/api/encounters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId: patient.patientId,
              visitDate: new Date().toISOString().split("T")[0],
              attendingClinician: "Reception",
            }),
          });

          if (encounterResponse.ok && servicesList) {
            const encounter = await encounterResponse.json();
            const consultationService = (servicesList as any[]).find(
              (s) =>
                s.category === "consultation" && s.name.includes("General"),
            );
            if (consultationService) {
              await fetch("/api/order-lines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  encounterId: encounter.encounterId,
                  serviceId: consultationService.id,
                  relatedType: "consultation",
                  description: consultationService.name,
                  quantity: 1,
                  unitPriceSnapshot: consultationService.price,
                  totalPrice: consultationService.price,
                  department: "consultation",
                  orderedBy: "Reception",
                }),
              });
            }
          }
        } catch {
          // don't fail overall
        }
      }
      return patient;
    },
    onSuccess: (patient) => {
      toast({
        title: "Success",
        description: collectConsultationFee
          ? `Patient registered. Consultation fee added to today's visit.`
          : "Patient registered successfully",
      });
      form.reset();
      setShowRegistrationForm(false);
      setCollectConsultationFee(false);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
    },
    onError: () => {
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
          description: "Failed to register patient",
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

  const onSubmit = (data: InsertPatient) => {
    if (editingPatient)
      updatePatientMutation.mutate({
        patientId: editingPatient.patientId,
        data,
      });
    else createPatientMutation.mutate(data);
  };

  const handleEditPatient = (p: Patient) => {
    setEditingPatient(p);
    form.reset({
      firstName: p.firstName,
      lastName: p.lastName,
      age: p.age || "",
      gender: p.gender,
      phoneNumber: p.phoneNumber || "",
      village: p.village || "",
      emergencyContact: p.emergencyContact || "",
      allergies: p.allergies || "",
      medicalHistory: p.medicalHistory || "",
    });
    setShowRegistrationForm(true);
  };

  // NEW: open quick-view panel instead of toast
  const handleViewPatient = (p: any) => setActivePatient(p);

  const handleCancelEdit = () => {
    setEditingPatient(null);
    setShowRegistrationForm(false);
    form.reset();
  };

  const jump = (path: string) => (window.location.href = path);

  return (
    <div className="space-y-6">
      {/* Patient Search / Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-medical-blue" />
              <span>Patient Management</span>
              {viewMode === "today" && (
                <Badge className="bg-green-600 text-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  Today's Patients
                </Badge>
              )}
              {viewMode === "date" && !isToday(selectedDate) && (
                <Badge className="bg-blue-600 text-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(selectedDate)}
                </Badge>
              )}
              {viewMode === "all" && (
                <Badge className="bg-purple-600 text-white">
                  <Users className="w-3 h-3 mr-1" />
                  All Patients
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="bg-health-green hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Segmented Nav */}
          <div className="mb-6 space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <div className="hidden sm:flex gap-1">
                <button
                  onClick={() => handleViewModeChange("today")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] ${
                    viewMode === "today"
                      ? "bg-white dark:bg-gray-700 text-medical-blue shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Today's Patients</span>
                  <Badge className="ml-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {todayCount}
                  </Badge>
                </button>

                <button
                  onClick={() => handleViewModeChange("date")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] ${
                    viewMode === "date"
                      ? "bg-white dark:bg-gray-700 text-medical-blue shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Specific Date</span>
                  {viewMode === "date" && (
                    <Badge className="ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {specificDateCount}
                    </Badge>
                  )}
                </button>

                <button
                  onClick={() => handleViewModeChange("all")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] ${
                    viewMode === "all"
                      ? "bg-white dark:bg-gray-700 text-medical-blue shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>All Patients</span>
                  <Badge className="ml-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {allCount}
                  </Badge>
                </button>

                <button
                  onClick={() => handleViewModeChange("search")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] ${
                    viewMode === "search"
                      ? "bg-white dark:bg-gray-700 text-medical-blue shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>

              {/* Mobile */}
              <div className="sm:hidden grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleViewModeChange("today")}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                    viewMode === "today"
                      ? "bg-white dark:bg-gray-700 text-medical-blue shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Today</span>
                  </div>
                  <Badge className="text-[10px] px-1 py-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {countsLoading ? "..." : todayCount}
                  </Badge>
                </button>

                <button
                  onClick={() => handleViewModeChange("date")}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                    viewMode === "date"
                      ? "bg-white dark:bg-gray-700 text-medical-blue shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Date</span>
                  </div>
                  <Badge
                    className={`text-[10px] px-1 py-0 ${
                      viewMode === "date"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {viewMode === "date"
                      ? countsLoading
                        ? "..."
                        : specificDateCount
                      : "•"}
                  </Badge>
                </button>

                <button
                  onClick={() => handleViewModeChange("all")}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                    viewMode === "all"
                      ? "bg-white dark:bg-gray-700 text-medical-blue shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">All</span>
                  </div>
                  <Badge className="text-[10px] px-1 py-0 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {countsLoading ? "..." : allCount}
                  </Badge>
                </button>

                <button
                  onClick={() => handleViewModeChange("search")}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                    viewMode === "search"
                      ? "bg-white dark:bg-gray-700 text-medical-blue shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Search className="w-4 h-4" />
                    <span className="text-xs">Search</span>
                  </div>
                  <Badge className="text-[10px] px-1 py-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    •
                  </Badge>
                </button>
              </div>
            </div>

            {/* Info bar */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span>Last Updated:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {viewMode !== "search" && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      {viewMode === "today" && `${todayCount} patients today`}
                      {viewMode === "date" &&
                        !isToday(selectedDate) &&
                        `${specificDateCount} patients on selected date`}
                      {viewMode === "all" && `${allCount} total patients`}
                    </span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrintRoster}
                  className="text-xs h-8"
                  disabled={countsLoading}
                >
                  <Printer className="w-3 h-3 mr-1" />
                  Print
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLastRefresh(new Date());
                    queryClient.invalidateQueries({
                      queryKey: ["/api/patients"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["/api/patients/counts"],
                    });
                    queryClient.refetchQueries({
                      queryKey: ["/api/patients/counts"],
                    });
                  }}
                  className="text-xs h-8"
                  disabled={countsLoading}
                >
                  <Filter className="w-3 h-3 mr-1" />
                  {countsLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Date filter */}
            {viewMode === "date" && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Calendar className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Select Date:
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto bg-white dark:bg-gray-700 border-blue-300 dark:border-blue-600"
                />
                {!isToday(selectedDate) && (
                  <Badge className="bg-blue-600 text-white ml-2">
                    {formatDate(selectedDate)}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* The modern list (uses your improved PatientSearch) */}
          <PatientSearch
            onEditPatient={handleEditPatient}
            onViewPatient={setActivePatient}
            viewMode={viewMode}
            selectedDate={selectedDate}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            shouldSearch={shouldSearch}
            onShouldSearchChange={setShouldSearch}
          />
        </CardContent>
      </Card>

      {/* Registration / Edit Form */}
      {showRegistrationForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingPatient
                ? `Edit Patient: ${editingPatient.firstName} ${editingPatient.lastName}`
                : "New Patient Registration"}
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Personal Info */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="e.g., 25 years, 6 months"
                              {...field}
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
                              <SelectTrigger>
                                <SelectValue placeholder="Select Gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Village/Area</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Name and phone number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Medical Info */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Medical Information
                  </h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Known Allergies</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any known allergies..."
                              rows={2}
                              {...field}
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
                              placeholder="Previous medical conditions, surgeries, etc..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Consultation Fee */}
                {!editingPatient && billingSettings && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                    <h3 className="font-medium text-gray-800 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Consultation Fee Collection
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <p className="font-medium">
                            Consultation Fee: {billingSettings.consultationFee}{" "}
                            {billingSettings.currency}
                          </p>
                          <p className="text-sm text-gray-600">
                            {billingSettings.requirePrepayment
                              ? "Payment required before seeing doctor"
                              : "Payment can be collected now or later"}
                          </p>
                        </div>
                        {billingSettings.requirePrepayment && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="collect-fee"
                            checked={collectConsultationFee}
                            onCheckedChange={setCollectConsultationFee}
                            disabled={billingSettings.requirePrepayment}
                          />
                          <label
                            htmlFor="collect-fee"
                            className="text-sm font-medium cursor-pointer"
                          >
                            {billingSettings.requirePrepayment
                              ? "Collect consultation fee now (Required)"
                              : "Collect consultation fee now (Optional)"}
                          </label>
                        </div>
                        {collectConsultationFee && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              {billingSettings.consultationFee}{" "}
                              {billingSettings.currency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={
                      createPatientMutation.isPending ||
                      updatePatientMutation.isPending
                    }
                    className="bg-medical-blue hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPatient
                      ? updatePatientMutation.isPending
                        ? "Updating..."
                        : "Update Patient"
                      : createPatientMutation.isPending
                        ? "Registering..."
                        : "Register Patient"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.print()}
                    className="ml-auto"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Form
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

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
                  <span className="font-medium">Contact:</span>{" "}
                  {activePatient.phoneNumber || "—"}
                </div>
                <div>
                  <span className="font-medium">Age/Gender:</span>{" "}
                  {activePatient.age ?? "—"}{" "}
                  {activePatient.gender ? `• ${activePatient.gender}` : ""}
                </div>
                <div>
                  <span className="font-medium">Village:</span>{" "}
                  {activePatient.village || "—"}
                </div>
              </div>

              {/* Service chips if available */}
              {activePatient.serviceStatus && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Today’s Orders
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
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <Clock className="w-3 h-3" />
                              {pending}
                            </span>
                          ) : null}
                          {done ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              {done}
                            </span>
                          ) : null}
                        </span>
                      );

                      if (d.lab)
                        chips.push(
                          chip(
                            "🧪 Lab",
                            d.lab.pending,
                            d.lab.done,
                            "bg-blue-50 dark:bg-blue-900/20",
                          ),
                        );
                      if (d.xray)
                        chips.push(
                          chip(
                            "📷 X-Ray",
                            d.xray.pending,
                            d.xray.done,
                            "bg-indigo-50 dark:bg-indigo-900/20",
                          ),
                        );
                      if (d.ultrasound)
                        chips.push(
                          chip(
                            "🌊 Ultrasound",
                            d.ultrasound.pending,
                            d.ultrasound.done,
                            "bg-teal-50 dark:bg-teal-900/20",
                          ),
                        );
                      if (d.pharmacy)
                        chips.push(
                          chip(
                            "💊 Pharmacy",
                            d.pharmacy.pending,
                            d.pharmacy.done,
                            "bg-emerald-50 dark:bg-emerald-900/20",
                          ),
                        );

                      if (chips.length === 0) {
                        // Fallback to totals
                        chips.push(
                          <span
                            key="fallback"
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

              {/* Balance */}
              {activePatient.serviceStatus && (
                <div className="mt-1">
                  {((activePatient.serviceStatus.balanceToday ??
                    activePatient.serviceStatus.balance) ||
                    0) > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 px-3 py-1 text-xs">
                      <CreditCard className="w-3 h-3" />
                      {money(
                        activePatient.serviceStatus.balanceToday ??
                          activePatient.serviceStatus.balance,
                      )}{" "}
                      Due
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 px-3 py-1 text-xs">
                      <CreditCard className="w-3 h-3" />
                      Paid
                    </div>
                  )}
                </div>
              )}

              {/* Quick actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    jump(
                      `/laboratory?patientId=${activePatient.patientId}&followUp=true`,
                    )
                  }
                >
                  🧪 Order Lab
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    jump(
                      `/xray?patientId=${activePatient.patientId}&followUp=true`,
                    )
                  }
                >
                  📷 Order X-Ray
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    jump(
                      `/ultrasound?patientId=${activePatient.patientId}&followUp=true`,
                    )
                  }
                >
                  🌊 Ultrasound
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    jump(`/pharmacy?patientId=${activePatient.patientId}`)
                  }
                >
                  💊 Pharmacy
                </Button>
                <Button
                  className="col-span-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() =>
                    jump(`/billing?patientId=${activePatient.patientId}`)
                  }
                >
                  💵 Billing & Payments
                </Button>
                <Button
                  variant="outline"
                  className="col-span-2"
                  onClick={() => {
                    const p: Patient = activePatient;
                    setActivePatient(null);
                    handleEditPatient(p);
                  }}
                >
                  ✏️ Edit Patient
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ================== /QUICK VIEW ================== */}
    </div>
  );
}
