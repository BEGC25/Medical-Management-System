import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Clock, Check, AlertCircle, Search, AlertTriangle, Package, ArrowRight, RefreshCw, ChevronDown, ChevronUp, CheckCircle, User, Printer, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PharmacyOrder, Patient, DrugBatch } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PharmacyHelp from "@/components/PharmacyHelp";
import { DateFilter, DateFilterPreset } from "@/components/pharmacy/DateFilter";
import { PharmacyReceipt } from "@/components/pharmacy/PharmacyReceipt";

// Helper function to format dates consistently
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

// Helper function to format date with time
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid
    }
    const dateFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeFormatted = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateFormatted} at ${timeFormatted}`;
  } catch {
    return dateString;
  }
}

interface PrescriptionWithPatient extends PharmacyOrder {
  patient: Patient;
}

// Skeleton loader for prescription cards
function PrescriptionCardSkeleton() {
  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Pharmacy() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PrescriptionWithPatient | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [helpCollapsed, setHelpCollapsed] = useState(() => {
    const saved = localStorage.getItem("pharmacyHelpCollapsed");
    // Default to collapsed (true) if no preference is saved
    return saved !== "false";
  });
  
  // Date filter states
  const [dispensedDateFilter, setDispensedDateFilter] = useState<DateFilterPreset>("all");
  const [dispensedStartDate, setDispensedStartDate] = useState<string>();
  const [dispensedEndDate, setDispensedEndDate] = useState<string>();
  const [unpaidDateFilter, setUnpaidDateFilter] = useState<DateFilterPreset>("all");
  const [unpaidStartDate, setUnpaidStartDate] = useState<string>();
  const [unpaidEndDate, setUnpaidEndDate] = useState<string>();
  
  // Print receipt state
  const [printOrder, setPrintOrder] = useState<PrescriptionWithPatient | null>(null);
  
  const { toast } = useToast();

  // Persist help collapsed state
  useEffect(() => {
    localStorage.setItem("pharmacyHelpCollapsed", String(helpCollapsed));
  }, [helpCollapsed]);

  // Fetch paid prescriptions ready for dispensing
  const { data: paidPrescriptions = [], isLoading: isLoadingPaid } = useQuery<PrescriptionWithPatient[]>({
    queryKey: ['/api/pharmacy/prescriptions/paid'],
  });

  // Fetch unpaid prescriptions
  const { data: unpaidPrescriptions = [], isLoading: isLoadingUnpaid } = useQuery<PrescriptionWithPatient[]>({
    queryKey: ['/api/pharmacy/prescriptions/unpaid'],
  });

  // Fetch dispensed prescriptions history
  const { data: dispensedPrescriptions = [], isLoading: isLoadingDispensed } = useQuery<PrescriptionWithPatient[]>({
    queryKey: ['/api/pharmacy/prescriptions/dispensed'],
  });

  // Combined loading state
  const isLoading = isLoadingPaid || isLoadingUnpaid || isLoadingDispensed;

  // Fetch batches for selected drug (FEFO sorted)
  const { data: batches = [] } = useQuery<DrugBatch[]>({
    queryKey: ['/api/pharmacy/batches/fefo', selectedOrder?.drugId],
    queryFn: async () => {
      if (!selectedOrder?.drugId) return [];
      const response = await fetch(`/api/pharmacy/batches/fefo/${selectedOrder.drugId}`);
      if (!response.ok) throw new Error('Failed to fetch batches');
      return response.json();
    },
    enabled: !!selectedOrder?.drugId,
  });
  
  // Helper function to check if a date is within the filter range
  const isDateInRange = (dateStr: string | null | undefined, preset: DateFilterPreset, startDate?: string, endDate?: string): boolean => {
    if (!dateStr) return true; // If no date, include it
    if (preset === "all") return true;
    
    const date = new Date(dateStr);
    // Validate that the date is valid
    if (isNaN(date.getTime())) return true; // Include invalid dates to avoid hiding data
    
    const now = new Date();
    
    if (preset === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return date >= today && date < tomorrow;
    }
    
    if (preset === "last7days") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date >= sevenDaysAgo;
    }
    
    if (preset === "last30days") {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    }
    
    if (preset === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      return date >= start && date <= end;
    }
    
    return true;
  };
  
  // Filter prescriptions by search term
  const filteredPaidOrders = paidPrescriptions.filter((order) => 
    (order.patient?.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.drugName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredUnpaidOrders = unpaidPrescriptions.filter((order) => {
    const matchesSearch = 
      (order.patient?.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.patient?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.patient?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.drugName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = isDateInRange(order.createdAt, unpaidDateFilter, unpaidStartDate, unpaidEndDate);
    
    return matchesSearch && matchesDate;
  });

  const filteredDispensedOrders = dispensedPrescriptions.filter((order) => {
    const matchesSearch = 
      (order.patient?.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.patient?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.patient?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.drugName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by dispensedAt if available, otherwise fall back to createdAt
    const dateToFilter = order.dispensedAt || order.createdAt;
    const matchesDate = isDateInRange(dateToFilter, dispensedDateFilter, dispensedStartDate, dispensedEndDate);
    
    return matchesSearch && matchesDate;
  });

  // Handle refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/prescriptions/paid'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/prescriptions/unpaid'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/prescriptions/dispensed'] });
    if (selectedOrder?.drugId) {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/batches/fefo', selectedOrder.drugId] });
    }
    toast({
      title: "Refreshed",
      description: "Pharmacy data has been updated.",
    });
  };

  // Dispense medication mutation
  const dispenseMutation = useMutation({
    mutationFn: async (data: { orderId: string; batchId: string; quantity: number; dispensedBy: string }) => {
      const response = await apiRequest('POST', '/api/pharmacy/dispense', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/prescriptions/paid'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/prescriptions/dispensed'] });
      setSelectedOrder(null);
      setSelectedBatch("");
      toast({
        title: "Medication Dispensed",
        description: "The prescription has been successfully dispensed and inventory updated.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to dispense medication",
      });
    },
  });

  const handleDispenseClick = (order: PrescriptionWithPatient) => {
    setSelectedOrder(order);
    setSelectedBatch("");
  };

  const handleConfirmDispense = () => {
    if (!selectedOrder || !selectedBatch) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a batch to dispense",
      });
      return;
    }

    // Find selected batch to validate quantity
    const batch = batches.find(b => b.batchId === selectedBatch);
    if (batch && selectedOrder.quantity > batch.quantityOnHand) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock",
        description: `Selected batch only has ${batch.quantityOnHand} units available, but ${selectedOrder.quantity} units are required.`,
      });
      return;
    }

    dispenseMutation.mutate({
      orderId: selectedOrder.orderId,
      batchId: selectedBatch,
      quantity: selectedOrder.quantity || 1,
      dispensedBy: 'Pharmacist', // TODO: Get from auth context
    });
  };

  const hasAllergies = selectedOrder?.patient?.allergies && selectedOrder.patient.allergies.trim() !== '';

  // Premium loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen transition-all duration-300 ${helpCollapsed ? 'pr-0' : 'pr-96'}`}>
        <PharmacyHelp collapsed={helpCollapsed} onCollapsedChange={setHelpCollapsed} />
        <div className="space-y-6 p-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>

          {/* Search Skeleton */}
          <Card className="shadow-premium-sm border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          {/* Tabs Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="space-y-3">
              <PrescriptionCardSkeleton />
              <PrescriptionCardSkeleton />
              <PrescriptionCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${helpCollapsed ? 'pr-0' : 'pr-96'}`}>
      {/* Right-side help panel - rendered as a fixed sidebar */}
      <PharmacyHelp collapsed={helpCollapsed} onCollapsedChange={setHelpCollapsed} />

      {/* Main content */}
      <div className="space-y-6 p-6">
        {/* Premium Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-premium-md 
                          hover:shadow-premium-lg transition-all duration-200 hover:scale-105">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pharmacy</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Prescription Management & Dispensing</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setHelpCollapsed(!helpCollapsed)}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 
                       transition-all duration-200 hover:shadow-premium-sm hover:scale-105"
              data-testid="button-help"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Button>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 
                       transition-all duration-200 hover:shadow-premium-sm hover:scale-105"
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/pharmacy-inventory">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                               shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105" 
                      data-testid="button-manage-inventory">
                <Package className="w-4 h-4 mr-2" />
                Manage Inventory
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Premium Search Card */}
        <Card className="shadow-premium-md border-gray-200 dark:border-gray-700 
                       hover:shadow-premium-lg transition-all duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <Label htmlFor="search" className="sr-only">Search prescriptions</Label>
              <Input
                id="search"
                placeholder="Search by Patient ID, Name, Order ID, or Drug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 
                         transition-all duration-200"
                data-testid="input-search-prescriptions"
              />
            </div>
          </CardContent>
        </Card>

        {/* Premium Tabs */}
        <Tabs defaultValue="ready" className="space-y-6">
          <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner-premium">
            <TabsTrigger 
              value="ready" 
              data-testid="tab-ready"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 
                       data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200
                       data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Ready to Dispense ({filteredPaidOrders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="dispensed" 
              data-testid="tab-dispensed"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 
                       data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200
                       data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
            >
              <Package className="w-4 h-4 mr-2" />
              Dispensed History ({filteredDispensedOrders.length})
            </TabsTrigger>
            {filteredUnpaidOrders.length > 0 && (
              <TabsTrigger 
                value="unpaid" 
                data-testid="tab-unpaid"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 
                         data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200
                         data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400"
              >
                <Clock className="w-4 h-4 mr-2" />
                Awaiting Payment ({filteredUnpaidOrders.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Ready to Dispense Tab - Premium */}
          <TabsContent value="ready" className="space-y-4">
            {filteredPaidOrders.length === 0 ? (
              <Card className="shadow-premium-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 
                                  rounded-2xl shadow-premium-sm">
                      <Check className="w-16 h-16 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">All Caught Up!</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        No prescriptions ready to dispense at the moment. 
                        Paid prescriptions will appear here automatically.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPaidOrders.map((order) => {
                  const isExpanded = expandedCard === order.orderId;
                  return (
                    <Card 
                      key={order.id}
                      className="border-green-200 dark:border-green-800/50 bg-gradient-to-br from-green-50 to-emerald-50 
                               dark:from-green-900/10 dark:to-emerald-900/10
                               hover:shadow-premium-md hover:border-green-300 dark:hover:border-green-700
                               transition-all duration-200 hover:-translate-y-0.5"
                      data-testid={`order-paid-${order.orderId}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Header with badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                {order.patient?.firstName} {order.patient?.lastName}
                              </h3>
                              <Badge className="bg-gray-700 text-white shadow-premium-sm">
                                {order.patient?.patientId}
                              </Badge>
                              <Badge className="bg-green-600 text-white shadow-premium-sm">
                                ✓ PAID
                              </Badge>
                              {order.patient?.allergies && order.patient.allergies.trim() !== '' && (
                                <Badge className="bg-red-600 text-white shadow-premium-sm animate-pulse-premium">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  ALLERGIES
                                </Badge>
                              )}
                            </div>
                            
                            {/* Primary info */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Order:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{order.orderId}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600 dark:text-gray-400">Drug:</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {order.drugName || <span className="text-red-600 font-semibold">Not specified</span>}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                    {order.dosage || 'As prescribed'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                    {order.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Expandable details */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-green-200 dark:border-green-800 space-y-2 animate-slide-in-up">
                                {order.route && (
                                  <div className="text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Route:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{order.route}</span>
                                  </div>
                                )}
                                {order.duration && (
                                  <div className="text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{order.duration}</span>
                                  </div>
                                )}
                                {order.instructions && (
                                  <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Instructions:</span>
                                    <p className="mt-1 text-gray-900 dark:text-white italic">{order.instructions}</p>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                                  Prescribed: {formatDate(order.createdAt)}
                                </div>
                              </div>
                            )}

                            {/* Expand toggle */}
                            {(order.route || order.duration || order.instructions) && (
                              <button
                                onClick={() => setExpandedCard(isExpanded ? null : order.orderId)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1
                                         transition-colors duration-200"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Show Details
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Action buttons column */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              onClick={() => handleDispenseClick(order)}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                                       shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105"
                              data-testid={`button-dispense-${order.orderId}`}
                            >
                              <Pill className="w-4 h-4 mr-2" />
                              Dispense
                            </Button>
                            <Link href={`/patients?search=${order.patient?.patientId}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-green-300 dark:border-green-700 text-green-600 dark:text-green-400
                                         hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                              >
                                <User className="w-3.5 h-3.5 mr-1.5" />
                                Patient
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Dispensed History Tab - Premium */}
          <TabsContent value="dispensed" className="space-y-4">
            {/* Date Filter */}
            <DateFilter 
              onFilterChange={(preset, start, end) => {
                setDispensedDateFilter(preset);
                setDispensedStartDate(start);
                setDispensedEndDate(end);
              }}
              defaultPreset="all"
            />
            
            {filteredDispensedOrders.length === 0 ? (
              <Card className="shadow-premium-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 
                                  rounded-2xl shadow-premium-sm">
                      <Package className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Dispensed Medications Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        Once you dispense medications, they will appear here for tracking and auditing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDispensedOrders.map((order) => {
                  const isExpanded = expandedCard === order.orderId;
                  return (
                    <Card 
                      key={order.id}
                      className="border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-indigo-50 
                               dark:from-blue-900/10 dark:to-indigo-900/10
                               hover:shadow-premium-md hover:border-blue-300 dark:hover:border-blue-700
                               transition-all duration-200"
                      data-testid={`order-dispensed-${order.orderId}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Header with badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                {order.patient?.firstName} {order.patient?.lastName}
                              </h3>
                              <Badge className="bg-gray-700 text-white shadow-premium-sm">
                                {order.patient?.patientId}
                              </Badge>
                              <Badge className="bg-blue-600 text-white shadow-premium-sm">
                                ✓ DISPENSED
                              </Badge>
                            </div>
                            
                            {/* Primary info */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Order:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{order.orderId}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600 dark:text-gray-400">Drug:</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{order.drugName}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                    {order.dosage || 'As prescribed'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                    {order.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Dispensing info */}
                            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-blue-200 dark:border-blue-800">
                              <div>
                                <span>Prescribed:</span>
                                <span className="ml-1">{formatDate(order.createdAt)}</span>
                              </div>
                              {order.dispensedAt && (
                                <div className="font-semibold text-blue-600 dark:text-blue-400">
                                  <span>Dispensed:</span>
                                  <span className="ml-1">{formatDateTime(order.dispensedAt)}</span>
                                </div>
                              )}
                            </div>
                            {order.dispensedBy && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Dispensed by: <span className="font-medium">{order.dispensedBy}</span>
                              </div>
                            )}

                            {/* Expandable details */}
                            {isExpanded && (order.route || order.duration || order.instructions) && (
                              <div className="pt-3 border-t border-blue-200 dark:border-blue-800 space-y-2 animate-slide-in-up">
                                {order.route && (
                                  <div className="text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Route:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{order.route}</span>
                                  </div>
                                )}
                                {order.duration && (
                                  <div className="text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{order.duration}</span>
                                  </div>
                                )}
                                {order.instructions && (
                                  <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Instructions:</span>
                                    <p className="mt-1 text-gray-900 dark:text-white italic">{order.instructions}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Expand toggle */}
                            {(order.route || order.duration || order.instructions) && (
                              <button
                                onClick={() => setExpandedCard(isExpanded ? null : order.orderId)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1
                                         transition-colors duration-200"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Show Details
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Link href={`/patients?search=${order.patient?.patientId}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                                         hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                              >
                                <User className="w-3.5 h-3.5 mr-1.5" />
                                View Patient
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPrintOrder(order)}
                              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1.5" />
                              Print
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Unpaid Orders Tab - Premium */}
          <TabsContent value="unpaid" className="space-y-4">
            {/* Date Filter */}
            <DateFilter 
              onFilterChange={(preset, start, end) => {
                setUnpaidDateFilter(preset);
                setUnpaidStartDate(start);
                setUnpaidEndDate(end);
              }}
              defaultPreset="all"
            />
            
            {filteredUnpaidOrders.length === 0 ? (
              <Card className="shadow-premium-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 
                                  rounded-2xl shadow-premium-sm">
                      <Clock className="w-16 h-16 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Unpaid Prescriptions</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        All prescriptions have been paid for. Unpaid ones will appear here.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredUnpaidOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="border-orange-200 dark:border-orange-800/50 bg-gradient-to-br from-orange-50 to-amber-50 
                             dark:from-orange-900/10 dark:to-amber-900/10
                             hover:shadow-premium-md hover:border-orange-300 dark:hover:border-orange-700
                             transition-all duration-200"
                    data-testid={`order-unpaid-${order.orderId}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Header with badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {order.patient?.firstName} {order.patient?.lastName}
                            </h3>
                            <Badge className="bg-gray-700 text-white shadow-premium-sm">
                              {order.patient?.patientId}
                            </Badge>
                            <Badge className="bg-orange-600 text-white shadow-premium-sm">
                              UNPAID
                            </Badge>
                          </div>
                          
                          {/* Primary info */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Order:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{order.orderId}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-600 dark:text-gray-400">Drug:</span>
                              <span className="font-semibold text-orange-600 dark:text-orange-400">
                                {order.drugName || <span className="text-orange-600 font-semibold">Not specified</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                  {order.dosage || 'As prescribed'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                  {order.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                              Prescribed: {formatDate(order.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Payment reminder and actions */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 
                                                            dark:border-orange-700 dark:text-orange-300 shadow-premium-sm">
                            Payment Required
                          </Badge>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-right max-w-[200px] mb-2">
                            Patient must pay at reception before dispensing
                          </p>
                          <Link href={`/patients?search=${order.patient?.patientId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400
                                       hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                            >
                              <User className="w-3.5 h-3.5 mr-1.5" />
                              View Patient
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Premium Dispense Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-premium-2xl" data-testid="dialog-dispense">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Dispense Medication</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Select batch and confirm dispensing for {selectedOrder?.patient?.firstName} {selectedOrder?.patient?.lastName}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 pt-2">
              {/* Patient Info - Premium */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                            p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-premium-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Patient ID</span>
                    <p className="font-semibold text-gray-900 dark:text-white" data-testid="text-patient-id">
                      {selectedOrder.patient?.patientId}
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Age</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.patient?.age || 'N/A'}</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg col-span-2">
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Gender</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.patient?.gender || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Allergy Warning - Premium */}
              {hasAllergies && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 
                              border-2 border-red-500 dark:border-red-700 p-4 rounded-xl shadow-premium-md
                              animate-pulse-premium" 
                     data-testid="alert-allergies">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-600 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-900 dark:text-red-100 mb-1.5 text-lg">⚠️ ALLERGY WARNING</h3>
                      <p className="text-sm text-red-800 dark:text-red-200 mb-1">
                        Patient has known allergies: <strong className="font-bold">{selectedOrder.patient?.allergies}</strong>
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        ⚡ Please verify drug compatibility before dispensing
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescription Details - Premium */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 
                            p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-premium-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-gray-500 to-slate-500 rounded-full"></div>
                  Prescription Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Drug:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400" data-testid="text-drug-name">
                      {selectedOrder.drugName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.dosage || 'As prescribed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                    <span className="font-semibold text-gray-900 dark:text-white" data-testid="text-quantity">
                      {selectedOrder.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Instructions:</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right">
                      {selectedOrder.instructions || 'Follow prescription'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batch Selection (FEFO) - Premium */}
              <div>
                <Label htmlFor="batch" className="text-sm font-semibold mb-3 block text-gray-900 dark:text-white">
                  Select Batch (First Expiry First Out)
                </Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger 
                    id="batch" 
                    data-testid="select-batch"
                    className="border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 
                             shadow-premium-sm hover:shadow-premium-md transition-all duration-200"
                  >
                    <SelectValue placeholder="Select a batch to dispense" />
                  </SelectTrigger>
                  <SelectContent className="shadow-premium-lg">
                    {batches.map((batch) => {
                      const expiryDate = new Date(batch.expiryDate);
                      const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpiringSoon = daysToExpiry < 90;
                      
                      return (
                        <SelectItem 
                          key={batch.batchId} 
                          value={batch.batchId} 
                          data-testid={`batch-option-${batch.batchId}`}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Lot: {batch.lotNumber}</span>
                            <span className="text-xs text-gray-500">
                              | Exp: {expiryDate.toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              | Stock: {batch.quantityOnHand}
                            </span>
                            {isExpiringSoon && (
                              <Badge className="bg-amber-500 text-white text-xs shadow-premium-sm">
                                <Clock className="w-3 h-3 mr-1" />
                                {daysToExpiry}d
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                {/* Selected Batch Info - Premium */}
                {selectedBatch && batches.length > 0 && (() => {
                  const batch = batches.find(b => b.batchId === selectedBatch);
                  if (!batch) return null;
                  
                  const expiryDate = new Date(batch.expiryDate);
                  const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = daysToExpiry < 90;
                  const hasInsufficientStock = selectedOrder.quantity > batch.quantityOnHand;
                  
                  return (
                    <div className={`mt-4 p-4 rounded-xl border-2 shadow-premium-md transition-all duration-200 ${
                      hasInsufficientStock 
                        ? 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-400 dark:border-red-700' 
                        : isExpiringSoon 
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-400 dark:border-amber-700'
                          : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-400 dark:border-blue-700'
                    }`}>
                      <h5 className="text-sm font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Selected Batch Details
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400">Lot Number:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{batch.lotNumber}</span>
                        </div>
                        <div className="flex justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400">Expiry Date:</span>
                          <span className={`font-semibold ${isExpiringSoon ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                            {expiryDate.toLocaleDateString()} {isExpiringSoon && `(${daysToExpiry} days)`}
                          </span>
                        </div>
                        <div className="flex justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400">Available Stock:</span>
                          <span className={`font-semibold ${hasInsufficientStock ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                            {batch.quantityOnHand} units
                          </span>
                        </div>
                        <div className="flex justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400">Required:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{selectedOrder.quantity} units</span>
                        </div>
                      </div>
                      
                      {hasInsufficientStock && (
                        <div className="mt-3 pt-3 border-t-2 border-red-400 dark:border-red-700">
                          <div className="flex items-start gap-2 bg-red-100 dark:bg-red-900/40 p-3 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-800 dark:text-red-200 font-semibold leading-relaxed">
                              ⚠️ INSUFFICIENT STOCK: This batch only has {batch.quantityOnHand} units available, 
                              but {selectedOrder.quantity} units are required. Dispensing is blocked.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {isExpiringSoon && !hasInsufficientStock && (
                        <div className="mt-3 pt-3 border-t-2 border-amber-400 dark:border-amber-700">
                          <div className="flex items-start gap-2 bg-amber-100 dark:bg-amber-900/40 p-3 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                              This batch expires in less than 90 days. Consider dispensing it first (FEFO principle).
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {batches.length === 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 
                                border-2 border-orange-300 dark:border-orange-700 p-4 rounded-xl mt-3 shadow-premium-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-orange-900 dark:text-orange-100 mb-1">
                          No stock available for this drug
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          Go to <Link href="/pharmacy-inventory" className="underline font-semibold hover:text-orange-900 dark:hover:text-orange-100">
                            Pharmacy Inventory
                          </Link> to add this drug and receive stock batches.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions - Premium */}
              <div className="flex justify-end gap-3 pt-5 border-t-2 border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  data-testid="button-cancel-dispense"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800
                           transition-all duration-200 hover:shadow-premium-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDispense}
                  disabled={
                    !selectedBatch || 
                    dispenseMutation.isPending || 
                    batches.length === 0 ||
                    (selectedBatch && batches.find(b => b.batchId === selectedBatch)?.quantityOnHand < selectedOrder.quantity)
                  }
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500
                           shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105
                           disabled:hover:scale-100 disabled:hover:shadow-premium-md"
                  data-testid="button-confirm-dispense"
                >
                  {dispenseMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Dispensing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm Dispense
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Receipt Dialog */}
      <PharmacyReceipt order={printOrder} onClose={() => setPrintOrder(null)} />
    </div>
  );
}
