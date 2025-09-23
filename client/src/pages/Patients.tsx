import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Save, X, Printer, Filter, Calendar, Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { insertPatientSchema, type InsertPatient, type Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

export default function Patients() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Use local date to avoid timezone issues
    const today = new Date();
    return today.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local timezone
  });
  // Persistent mode state - remember user's preference across sessions
  const [viewMode, setViewMode] = useState<'today' | 'date' | 'search' | 'all'>(() => {
    try {
      const savedMode = localStorage.getItem('patient-view-mode');
      if (savedMode && ['today', 'date', 'search', 'all'].includes(savedMode)) {
        return savedMode as 'today' | 'date' | 'search' | 'all';
      }
    } catch (error) {
      console.warn('Failed to load saved view mode:', error);
    }
    return 'today'; // Default to today's patients
  });

  // Save view mode preference when it changes
  const handleViewModeChange = (newMode: 'today' | 'date' | 'search' | 'all') => {
    setViewMode(newMode);
    try {
      localStorage.setItem('patient-view-mode', newMode);
    } catch (error) {
      console.warn('Failed to save view mode preference:', error);
    }
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Patient count queries using efficient counts endpoint
  const { data: patientCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["/api/patients/counts", viewMode, selectedDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (viewMode === 'date') {
        params.append('date', selectedDate);
      }
      return fetch(`/api/patients/counts?${params}`).then(res => res.json());
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Extract counts with fallbacks
  const todayCount = patientCounts?.today || 0;
  const allCount = patientCounts?.all || 0;
  const specificDateCount = patientCounts?.date || 0;
  const serverLastUpdated = patientCounts?.lastUpdated;

  // Track last refresh time
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Search state lifted up to enable printing of search results
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);

  // Print roster functionality - uses same query logic as PatientSearch
  const handlePrintRoster = async () => {
    try {
      // Use the same query logic as PatientSearch component for consistency
      let apiUrl = '/api/patients';
      let queryParams = new URLSearchParams();
      let viewDescription = '';
      let patientCountText = '';

      if (viewMode === 'today') {
        queryParams.append('today', 'true');
        viewDescription = 'Today\'s Patients';
        patientCountText = `${todayCount}`;
      } else if (viewMode === 'date') {
        queryParams.append('date', selectedDate);
        viewDescription = `Patients for ${formatDate(selectedDate)}`;
        patientCountText = `${specificDateCount}`;
      } else if (viewMode === 'all') {
        viewDescription = 'All Patients';
        patientCountText = `${allCount}`;
      } else if (viewMode === 'search') {
        if (!shouldSearch || !searchTerm.trim()) {
          toast({
            title: "No Search Results",
            description: "Please enter a search term and perform a search before printing",
            variant: "destructive",
          });
          return;
        }
        queryParams.append('search', searchTerm.trim());
        viewDescription = `Search Results for "${searchTerm}"`;
        patientCountText = 'Search results';
      }

      // Add service status information to the print
      queryParams.append('withStatus', 'true');
      const fullUrl = queryParams.toString() ? `${apiUrl}?${queryParams}` : apiUrl;
      
      // Fetch the patient data
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Failed to fetch patient data');
      const patients = await response.json();

      // Create print content with correct data
      const printContent = `
        <html>
          <head>
            <title>Patient Roster - Bahr El Ghazal Clinic</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 15px; }
              .info { margin-bottom: 20px; font-size: 14px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .patient-id { font-weight: bold; color: #0066cc; }
              .status-unpaid { color: #dc2626; font-weight: bold; }
              .status-paid { color: #16a34a; }
              .status-pending { color: #ca8a04; }
              .status-completed { color: #16a34a; }
              .status-none { color: #9ca3af; font-style: italic; }
              @media print { body { margin: 0; } }
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
                ${patients.map((patient: any) => {
                  const serviceStatus = patient.serviceStatus || {};
                  const hasUnpaidServices = serviceStatus.hasUnpaidServices;
                  const hasPendingServices = serviceStatus.hasPendingServices;
                  const unpaidCount = serviceStatus.unpaidServices || 0;
                  const pendingCount = serviceStatus.pendingServices || 0;
                  const completedCount = serviceStatus.completedServices || 0;
                  const totalServices = serviceStatus.totalServices || 0;
                  
                  // Payment status text
                  const paymentStatus = hasUnpaidServices 
                    ? `⚠️ ${unpaidCount} UNPAID` 
                    : totalServices > 0 
                    ? '✓ PAID' 
                    : 'No services';
                    
                  // Service status text  
                  const serviceStatusText = totalServices > 0 
                    ? [
                        hasPendingServices ? `⏰ ${pendingCount} pending` : '',
                        completedCount > 0 ? `✓ ${completedCount} done` : ''
                      ].filter(Boolean).join(', ') || 'Processing'
                    : 'No services';
                  
                  return `
                    <tr>
                      <td class="patient-id">${patient.patientId}</td>
                      <td>${patient.firstName} ${patient.lastName}</td>
                      <td>${patient.age}</td>
                      <td>${patient.gender}</td>
                      <td>${patient.phoneNumber || '-'}</td>
                      <td>${patient.village || '-'}</td>
                      <td class="${hasUnpaidServices ? 'status-unpaid' : totalServices > 0 ? 'status-paid' : 'status-none'}">${paymentStatus}</td>
                      <td class="${hasPendingServices ? 'status-pending' : completedCount > 0 ? 'status-completed' : 'status-none'}">${serviceStatusText}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Open print window with actual data
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait a moment for content to load, then print
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Error generating print roster:', error);
      toast({
        title: "Print Error",
        description: "Failed to generate patient roster. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date for display using local timezone to avoid UTC offset issues
  const formatDate = (dateStr: string) => {
    // Parse date as local date to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toLocaleDateString('en-CA');
    return dateStr === today;
  };

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

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient registered successfully",
      });
      form.reset();
      setShowRegistrationForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      // Save to offline storage if network error
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'patient',
          action: 'create',
          data: form.getValues(),
        });
        toast({
          title: "Saved Offline",
          description: "Patient data saved locally. Will sync when online.",
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
    mutationFn: async ({ patientId, data }: { patientId: string; data: Partial<InsertPatient> }) => {
      const response = await apiRequest("PUT", `/api/patients/${patientId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
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
    if (editingPatient) {
      updatePatientMutation.mutate({ patientId: editingPatient.patientId, data });
    } else {
      createPatientMutation.mutate(data);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    form.reset({
      firstName: patient.firstName,
      lastName: patient.lastName,
      age: patient.age || "",
      gender: patient.gender,
      phoneNumber: patient.phoneNumber || "",
      village: patient.village || "",
      emergencyContact: patient.emergencyContact || "",
      allergies: patient.allergies || "",
      medicalHistory: patient.medicalHistory || "",
    });
    setShowRegistrationForm(true);
  };

  const handleViewPatient = (patient: Patient) => {
    toast({
      title: "Patient Details",
      description: `${patient.firstName} ${patient.lastName} (${patient.patientId})`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelEdit = () => {
    setEditingPatient(null);
    setShowRegistrationForm(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-medical-blue" />
              <span>Patient Management</span>
              {viewMode === 'today' && (
                <Badge className="bg-green-600 text-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  Today's Patients
                </Badge>
              )}
              {viewMode === 'date' && !isToday(selectedDate) && (
                <Badge className="bg-blue-600 text-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(selectedDate)}
                </Badge>
              )}
              {viewMode === 'all' && (
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
          {/* Modern Segmented Navigation */}
          <div className="mb-6 space-y-4">
            {/* Primary Navigation - Responsive Segmented Control */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              {/* Desktop: Horizontal segmented control */}
              <div className="hidden sm:flex gap-1">
                <button
                  onClick={() => handleViewModeChange('today')}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] ${
                    viewMode === 'today' 
                      ? 'bg-white dark:bg-gray-700 text-medical-blue shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  data-testid="nav-today-patients"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Today's Patients</span>
                  <Badge className="ml-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {todayCount}
                  </Badge>
                </button>
                
                <button
                  onClick={() => handleViewModeChange('date')}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] ${
                    viewMode === 'date' 
                      ? 'bg-white dark:bg-gray-700 text-medical-blue shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  data-testid="nav-specific-date"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Specific Date</span>
                  {viewMode === 'date' && (
                    <Badge className="ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {specificDateCount}
                    </Badge>
                  )}
                </button>
                
                <button
                  onClick={() => handleViewModeChange('all')}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] ${
                    viewMode === 'all' 
                      ? 'bg-white dark:bg-gray-700 text-medical-blue shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  data-testid="nav-all-patients"
                >
                  <Users className="w-4 h-4" />
                  <span>All Patients</span>
                  <Badge className="ml-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {allCount}
                  </Badge>
                </button>
                
                <button
                  onClick={() => handleViewModeChange('search')}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] ${
                    viewMode === 'search' 
                      ? 'bg-white dark:bg-gray-700 text-medical-blue shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  data-testid="nav-search-patients"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>

              {/* Mobile: Stacked buttons with consistent count badges */}
              <div className="sm:hidden grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleViewModeChange('today')}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                    viewMode === 'today' 
                      ? 'bg-white dark:bg-gray-700 text-medical-blue shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  data-testid="nav-today-patients-mobile"
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
                  onClick={() => handleViewModeChange('date')}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                    viewMode === 'date' 
                      ? 'bg-white dark:bg-gray-700 text-medical-blue shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  data-testid="nav-specific-date-mobile"
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Date</span>
                  </div>
                  {/* Show count for date view when active, otherwise show indicator */}
                  <Badge className={`text-[10px] px-1 py-0 ${
                    viewMode === 'date' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {viewMode === 'date' ? (countsLoading ? "..." : specificDateCount) : "•"}
                  </Badge>
                </button>
                
                <button
                  onClick={() => handleViewModeChange('all')}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                    viewMode === 'all' 
                      ? 'bg-white dark:bg-gray-700 text-medical-blue shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  data-testid="nav-all-patients-mobile"
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
                  onClick={() => handleViewModeChange('search')}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                    viewMode === 'search' 
                      ? 'bg-white dark:bg-gray-700 text-medical-blue shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  data-testid="nav-search-patients-mobile"
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

            {/* Contextual Information Bar */}
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
                {viewMode !== 'search' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      {viewMode === 'today' && `${todayCount} patients today`}
                      {viewMode === 'date' && !isToday(selectedDate) && `${specificDateCount} patients on selected date`}
                      {viewMode === 'all' && `${allCount} total patients`}
                    </span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrintRoster}
                  className="text-xs h-8"
                  data-testid="print-roster"
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
                    // Invalidate and refetch all patient-related queries
                    queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/patients/counts"] });
                    queryClient.refetchQueries({ queryKey: ["/api/patients/counts"] });
                  }}
                  className="text-xs h-8"
                  data-testid="refresh-data"
                  disabled={countsLoading}
                >
                  <Filter className="w-3 h-3 mr-1" />
                  {countsLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Date Picker - Only show when relevant */}
            {viewMode === 'date' && (
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
                  data-testid="date-picker"
                />
                {!isToday(selectedDate) && (
                  <Badge className="bg-blue-600 text-white ml-2">
                    {formatDate(selectedDate)}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <PatientSearch 
            onEditPatient={handleEditPatient}
            onViewPatient={handleViewPatient}
            viewMode={viewMode}
            selectedDate={selectedDate}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            shouldSearch={shouldSearch}
            onShouldSearchChange={setShouldSearch}
          />
        </CardContent>
      </Card>

      {/* Registration/Edit Form */}
      {showRegistrationForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingPatient ? `Edit Patient: ${editingPatient.firstName} ${editingPatient.lastName}` : "New Patient Registration"}
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
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
                            <Input type="text" placeholder="e.g., 25 years, 6 months" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
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

                {/* Contact Information */}
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
                            <Input placeholder="Name and phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Medical Information */}
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

                {/* Form Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button 
                    type="submit" 
                    disabled={createPatientMutation.isPending || updatePatientMutation.isPending}
                    className="bg-medical-blue hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPatient ? (
                      updatePatientMutation.isPending ? "Updating..." : "Update Patient"
                    ) : (
                      createPatientMutation.isPending ? "Registering..." : "Register Patient"
                    )}
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
                    onClick={handlePrint}
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
    </div>
  );
}
