import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, DollarSign, Receipt, AlertCircle, Users, X, CheckCircle, Plus, Trash2, Eye, ChevronDown, ChevronUp, TrendingUp, Wallet, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LaboratoryIcon, XRayIcon, UltrasoundIcon, PharmacyIcon, getMedicalIcon } from "@/components/MedicalIcons";
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

interface Patient {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
}

interface UnpaidOrder {
  id: string;
  type: string;
  description: string;
  date: string;
  category?: string;
  bodyPart?: string;
  patient?: Patient | null;
  patientId: string;
  dosage?: string;
  quantity?: number;
  serviceId?: number;
  serviceName?: string;
  price?: number;
}

interface AllUnpaidOrders {
  laboratory: UnpaidOrder[];
  xray: UnpaidOrder[];
  ultrasound: UnpaidOrder[];
  pharmacy: UnpaidOrder[];
}

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
}

export default function Payment() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentItems, setPaymentItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [openServiceCategories, setOpenServiceCategories] = useState<string[]>(["consultation"]);
  const [paymentHistoryTab, setPaymentHistoryTab] = useState<"today" | "yesterday" | "last7days" | "last30days" | "all">("today");
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<any | null>(null);
  const [isReceiptViewOpen, setIsReceiptViewOpen] = useState(false);
  
  // NEW: Main tab navigation state
  const [activeMainTab, setActiveMainTab] = useState<"pending" | "history">("pending");
  
  // NEW: Active category filter for pending payments (replaces Tabs)
  const [activeCategory, setActiveCategory] = useState<"laboratory" | "xray" | "ultrasound" | "pharmacy">("laboratory");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Avatar utility functions - Premium palette
  function getAvatarColor(name: string): string {
    // Handle empty or undefined names
    if (!name || name.length === 0) {
      return "bg-gray-500"; // Default color for missing names
    }
    
    const colors = [
      "bg-indigo-500",  // Soft purple-blue
      "bg-teal-500",    // Sophisticated teal
      "bg-pink-500",    // Soft pink
      "bg-orange-500",  // Warm orange
      "bg-blue-500",    // Classic blue
      "bg-purple-500",  // Rich purple
    ];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  function getInitials(firstName: string, lastName: string): string {
    const first = (firstName || '').charAt(0);
    const last = (lastName || '').charAt(0);
    return `${first}${last}`.toUpperCase() || '??';
  }

  // Service-specific color themes - WCAG compliant
  function getServiceColors(type: string) {
    const colorMap: Record<string, {
      bg: string;
      bgHover: string;
      border: string;
      borderHover: string;
      text: string;
      iconColor: string;
      chipBg: string;
      chipBorder: string;
      chipText: string;
      badgeBg: string;
    }> = {
      laboratory: {
        bg: "bg-purple-50 dark:bg-purple-950/30",
        bgHover: "hover:bg-purple-100 dark:hover:bg-purple-900/40",
        border: "border-purple-200 dark:border-purple-800",
        borderHover: "hover:border-purple-400 dark:hover:border-purple-600",
        text: "text-purple-700 dark:text-purple-300",
        iconColor: "text-purple-600 dark:text-purple-400",
        chipBg: "bg-purple-100 dark:bg-purple-900",
        chipBorder: "border-purple-500",
        chipText: "text-purple-700 dark:text-purple-300",
        badgeBg: "bg-purple-500"
      },
      xray: {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        bgHover: "hover:bg-blue-100 dark:hover:bg-blue-900/40",
        border: "border-blue-200 dark:border-blue-800",
        borderHover: "hover:border-blue-400 dark:hover:border-blue-600",
        text: "text-blue-700 dark:text-blue-300",
        iconColor: "text-blue-600 dark:text-blue-400",
        chipBg: "bg-blue-100 dark:bg-blue-900",
        chipBorder: "border-blue-500",
        chipText: "text-blue-700 dark:text-blue-300",
        badgeBg: "bg-blue-500"
      },
      ultrasound: {
        bg: "bg-teal-50 dark:bg-teal-950/30",
        bgHover: "hover:bg-teal-100 dark:hover:bg-teal-900/40",
        border: "border-teal-200 dark:border-teal-800",
        borderHover: "hover:border-teal-400 dark:hover:border-teal-600",
        text: "text-teal-700 dark:text-teal-300",
        iconColor: "text-teal-600 dark:text-teal-400",
        chipBg: "bg-teal-100 dark:bg-teal-900",
        chipBorder: "border-teal-500",
        chipText: "text-teal-700 dark:text-teal-300",
        badgeBg: "bg-teal-500"
      },
      pharmacy: {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        bgHover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
        border: "border-emerald-200 dark:border-emerald-800",
        borderHover: "hover:border-emerald-400 dark:hover:border-emerald-600",
        text: "text-emerald-700 dark:text-emerald-300",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        chipBg: "bg-emerald-100 dark:bg-emerald-900",
        chipBorder: "border-emerald-500",
        chipText: "text-emerald-700 dark:text-emerald-300",
        badgeBg: "bg-emerald-500"
      },
      consultation: {
        bg: "bg-cyan-50 dark:bg-cyan-950/30",
        bgHover: "hover:bg-cyan-100 dark:hover:bg-cyan-900/40",
        border: "border-cyan-200 dark:border-cyan-800",
        borderHover: "hover:border-cyan-400 dark:hover:border-cyan-600",
        text: "text-cyan-700 dark:text-cyan-300",
        iconColor: "text-cyan-600 dark:text-cyan-400",
        chipBg: "bg-cyan-100 dark:bg-cyan-900",
        chipBorder: "border-cyan-500",
        chipText: "text-cyan-700 dark:text-cyan-300",
        badgeBg: "bg-cyan-500"
      }
    };
    
    return colorMap[type] || colorMap.consultation;
  }

  // Service icon mapping - returns React component with type-specific colors
  function getServiceIcon(type: string, departmentType?: string) {
    const serviceType = departmentType || type;
    let normalizedType = serviceType.toLowerCase();
    
    // Normalize types
    if (type === 'lab_test_item') normalizedType = 'laboratory';
    if (type === 'xray_exam') normalizedType = 'xray';
    if (type === 'ultrasound_exam') normalizedType = 'ultrasound';
    if (type === 'pharmacy_order') normalizedType = 'pharmacy';
    
    const colors = getServiceColors(normalizedType);
    return getMedicalIcon(type, { className: colors.iconColor, size: 18 });
  }
  
  // Service icon for tabs - slightly larger
  function getServiceIconLarge(type: string) {
    const colors = getServiceColors(type);
    return getMedicalIcon(type, { className: colors.iconColor, size: 20 });
  }

  // Format date nicely
  function formatDateNice(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // Search patients with better error handling
  const { data: patients = [], isLoading: patientsLoading, error: patientsError } = useQuery<Patient[]>({
    queryKey: ["/api/patients", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search patients - Please check your connection and try again');
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Get services with better error handling
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to load services - Please refresh the page and try again');
      return response.json();
    },
  });

  // Get ALL unpaid orders grouped by department
  const { data: allUnpaidOrders, isLoading: allUnpaidLoading, refetch: refetchAllUnpaid } = useQuery<AllUnpaidOrders>({
    queryKey: ["/api/unpaid-orders/all"],
    queryFn: async () => {
      const response = await fetch('/api/unpaid-orders/all');
      if (!response.ok) throw new Error('Failed to load unpaid orders');
      return response.json();
    },
  });

  // Get payment history using preset-based filtering
  const { data: paymentHistory = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery<any[]>({
    queryKey: ["/api/payments", { preset: paymentHistoryTab }, paymentSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (paymentHistoryTab !== "all") {
        params.append('preset', paymentHistoryTab);
      }
      if (paymentSearchQuery) {
        params.append('patientId', paymentSearchQuery);
      }
      
      const response = await fetch(`/api/payments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load payment history');
      return response.json();
    },
  });

  // Get selected payment details for receipt view
  const { data: paymentDetails } = useQuery({
    queryKey: [`/api/payments/${selectedPaymentForView?.paymentId}`],
    enabled: !!selectedPaymentForView,
  });

  // Get unpaid orders for selected patient with better error handling
  const { data: unpaidOrders = [], refetch: refetchUnpaidOrders, isLoading: unpaidLoading, error: unpaidError } = useQuery<UnpaidOrder[]>({
    queryKey: [`/api/patients/${selectedPatient?.patientId}/unpaid-orders`],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${selectedPatient?.patientId}/unpaid-orders`);
      if (!response.ok) throw new Error('Failed to load unpaid orders - Please verify patient information and try again');
      return response.json();
    },
    enabled: !!selectedPatient,
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (paymentData: any) => apiRequest("POST", "/api/payments", paymentData),
    onSuccess: () => {
      toast({
        title: "Payment Processed",
        description: "Payment has been successfully recorded",
      });
      setPaymentItems([]);
      setNotes("");
      setReceivedBy("");
      setIsPaymentModalOpen(false);
      setSelectedPatient(null);
      setSearchQuery("");
      refetchUnpaidOrders();
      refetchAllUnpaid();
      refetchHistory(); // Refresh payment history
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unpaid-orders/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/xray-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ultrasound-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery("");
    setIsPaymentModalOpen(true);
  };

  const addServiceToPayment = (service: Service, relatedOrder?: UnpaidOrder) => {
    // Check if item already added
    const alreadyAdded = paymentItems.some(item => 
      item.relatedId === relatedOrder?.id && relatedOrder?.id
    );
    
    if (alreadyAdded) {
      toast({
        title: "Already Added",
        description: "This item is already in your payment list",
        variant: "default",
      });
      return;
    }

    const newItem = {
      serviceId: service.id,
      serviceName: service.name,
      unitPrice: service.price,
      quantity: 1,
      relatedId: relatedOrder?.id || null,
      relatedType: relatedOrder?.type || null,
      description: relatedOrder?.description || service.name,
    };
    
    setPaymentItems([...paymentItems, newItem]);
    
    toast({
      title: "Item Added",
      description: `${service.name} added to payment`,
    });
  };

  const addAllUnpaidItems = () => {
    if (!unpaidOrders || unpaidOrders.length === 0) return;
    
    const newItems: any[] = [];
    
    unpaidOrders.forEach(order => {
      // Skip if already added
      const alreadyAdded = paymentItems.some(item => item.relatedId === order.id);
      if (alreadyAdded) return;
      
      // Use the service information already in the order
      // The backend already provides serviceId, serviceName, and price
      if (order.serviceId && order.price > 0) {
        newItems.push({
          serviceId: order.serviceId,
          serviceName: order.serviceName,
          unitPrice: order.price,
          quantity: 1,
          relatedId: order.id,
          relatedType: order.type,
          description: order.description,
        });
      }
    });
    
    if (newItems.length > 0) {
      setPaymentItems([...paymentItems, ...newItems]);
      toast({
        title: "All Unpaid Items Added",
        description: `Added ${newItems.length} item(s) to payment`,
      });
    } else {
      toast({
        title: "No New Items",
        description: "All unpaid items are already added or need manual selection",
      });
    }
  };

  const removePaymentItem = (index: number) => {
    setPaymentItems(paymentItems.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return paymentItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const handleProcessPayment = () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }

    if (paymentItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to the payment",
        variant: "destructive",
      });
      return;
    }

    if (!receivedBy.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter who received the payment",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmAndProcessPayment = () => {
    if (!selectedPatient) return;

    createPaymentMutation.mutate({
      patientId: selectedPatient.patientId,
      items: paymentItems,
      paymentMethod,
      receivedBy: receivedBy.trim(),
      notes: notes.trim(),
    });
    
    setShowConfirmDialog(false);
  };

  const toggleServiceCategory = (category: string) => {
    setOpenServiceCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getFilteredServices = () => {
    if (!serviceSearchQuery.trim()) return services;
    
    const query = serviceSearchQuery.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query)
    );
  };

  const getServiceByCategory = (category: string) => {
    return services.filter(service => service.category === category);
  };

  const getTotalUnpaidCount = () => {
    if (!allUnpaidOrders) return 0;
    return (
      allUnpaidOrders.laboratory.length +
      allUnpaidOrders.xray.length +
      allUnpaidOrders.ultrasound.length +
      allUnpaidOrders.pharmacy.length
    );
  };

  const renderOrderCard = (order: UnpaidOrder, departmentType: string) => {
    const patient = order.patient;
    const displayPrice = order.price || 0;
    const colors = getServiceColors(departmentType);
    const serviceIcon = getServiceIcon(order.type, departmentType);

    return (
      <div 
        key={order.id} 
        className={`p-4 rounded-lg ${colors.bg} border ${colors.border} ${colors.bgHover} ${colors.borderHover} hover:shadow-md transition-all duration-300 ease-out cursor-pointer group`}
        data-testid={`unpaid-order-${order.id}`}
        onClick={() => {
          if (patient) {
            handleSelectPatient(patient);
          }
        }}
      >
        {/* Compact 2-row layout */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Patient Avatar */}
            {patient && (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0 ${getAvatarColor(patient.firstName + patient.lastName)}`}
              >
                {getInitials(patient.firstName, patient.lastName)}
              </div>
            )}
            
            {/* Row 1: Patient Name, ID, and Date on same line */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {patient ? (
                  <>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <span className="text-gray-400 text-xs">•</span>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{patient.patientId}</Badge>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{formatDateNice(order.date)}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{order.patientId}</span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{formatDateNice(order.date)}</span>
                  </>
                )}
              </div>
              
              {/* Row 2: Service Description with Icon */}
              <div className="flex items-center gap-2">
                {serviceIcon}
                <h4 className={`font-medium text-sm ${colors.text}`}>{order.description}</h4>
              </div>
              
              {/* Additional Info - inline if present */}
              {(order.bodyPart || order.dosage || order.quantity) && (
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {order.bodyPart && <span>Part: {order.bodyPart}</span>}
                  {order.dosage && <span>Dosage: {order.dosage}</span>}
                  {order.quantity && <span>Qty: {order.quantity}</span>}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side: Amount and Action */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Amount - Large and Bold */}
            {displayPrice > 0 && (
              <div className={`text-2xl font-bold ${colors.text} tabular-nums`}>
                SSP {displayPrice.toLocaleString()}
              </div>
            )}
            
            {/* Action Button */}
            <Button 
              size="sm"
              className={`${colors.badgeBg} hover:opacity-90 text-white shadow-sm transition-all`}
            >
              Process Payment
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 fade-in duration-500 animate-in">
      {/* Compact Premium Header with Integrated Search */}
      <Card className="border-gray-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] transition-all duration-300">
        <CardContent className="pt-3 pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Payment Processing
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Process patient payments and manage outstanding balances</p>
            </div>
          </div>
          
          {/* Integrated Search Bar */}
          <div className="relative">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors z-10" />
              <Input
                placeholder="🔍 Search patients by name or ID... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 text-sm border-gray-200/70 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                data-testid="input-search-patients"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {searchQuery.length >= 2 && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-h-80 overflow-y-auto">
                {patientsLoading && (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Searching patients...</span>
                  </div>
                )}
                {patientsError && (
                  <div className="p-3 m-2 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{patientsError.message}</span>
                    </div>
                  </div>
                )}
                {!patientsLoading && !patientsError && patients.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No patients found</h3>
                    <p className="text-sm text-gray-500">{`No patients matching "${searchQuery}"`}</p>
                  </div>
                )}
                {!patientsLoading && !patientsError && patients.map((patient: Patient) => (
                  <Button
                    key={patient.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 dark:hover:bg-blue-950 rounded-none first:rounded-t-lg last:rounded-b-lg group"
                    onClick={() => handleSelectPatient(patient)}
                    data-testid={`patient-result-${patient.patientId}`}
                  >
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        {patient.firstName} {patient.lastName} ({patient.patientId})
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {patient.age} years • {patient.gender}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <div className="absolute z-50 w-full mt-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  <span className="inline-block mr-1" aria-hidden="true">💡</span>
                  <span>Enter at least 2 characters to search</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Primary Navigation Tabs - Card-Tab Pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveMainTab("pending")}
          className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
            activeMainTab === "pending"
              ? "border-teal-500 bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950 dark:to-teal-900/50 shadow-lg ring-2 ring-teal-500/20"
              : "border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-700 hover:border-gray-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-bold ${
              activeMainTab === "pending"
                ? "text-teal-700 dark:text-teal-400"
                : "text-gray-700 dark:text-gray-300"
            }`}>
              Pending Payments
            </h3>
            {allUnpaidOrders && getTotalUnpaidCount() > 0 && (
              <Badge className={`text-sm font-bold ${
                activeMainTab === "pending"
                  ? "bg-teal-600 text-white"
                  : "bg-red-600 text-white"
              }`}>
                {getTotalUnpaidCount()}
              </Badge>
            )}
          </div>
          <p className={`text-sm ${
            activeMainTab === "pending"
              ? "text-teal-600 dark:text-teal-400"
              : "text-gray-500 dark:text-gray-400"
          }`}>
            {allUnpaidOrders && getTotalUnpaidCount() > 0
              ? `${getTotalUnpaidCount()} pending payment${getTotalUnpaidCount() !== 1 ? 's' : ''}`
              : "No pending payments"}
          </p>
        </button>
        
        <button
          onClick={() => setActiveMainTab("history")}
          className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
            activeMainTab === "history"
              ? "border-teal-500 bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950 dark:to-teal-900/50 shadow-lg ring-2 ring-teal-500/20"
              : "border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-700 hover:border-gray-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-bold ${
              activeMainTab === "history"
                ? "text-teal-700 dark:text-teal-400"
                : "text-gray-700 dark:text-gray-300"
            }`}>
              Payment History
            </h3>
            {paymentHistoryTab === "today" && paymentHistory.length > 0 && (
              <Badge className={`text-sm font-bold ${
                activeMainTab === "history"
                  ? "bg-teal-600 text-white"
                  : "bg-teal-600 text-white"
              }`}>
                {paymentHistory.length}
              </Badge>
            )}
          </div>
          <p className={`text-sm ${
            activeMainTab === "history"
              ? "text-teal-600 dark:text-teal-400"
              : "text-gray-500 dark:text-gray-400"
          }`}>
            {paymentHistoryTab === "today" && paymentHistory.length > 0
              ? `${paymentHistory.length} payment${paymentHistory.length !== 1 ? 's' : ''} today`
              : "View payment records"}
          </p>
        </button>
      </div>

      {/* PENDING PAYMENTS TAB CONTENT */}
      {activeMainTab === "pending" && (
        <>
          {/* Pending Payments Overview - Premium */}
          {allUnpaidLoading ? (
            <Card className="border-gray-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-lg shadow-sm">
                    <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span>Patients with Pending Payments</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : allUnpaidOrders && getTotalUnpaidCount() > 0 ? (
            <Card className="border-gray-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] transition-all duration-300">
              <CardContent className="pt-4">
                {/* Filter Chips (Pills) - Replacing Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setActiveCategory("laboratory")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === "laboratory"
                        ? "bg-purple-100 text-purple-700 border-2 border-purple-500 shadow-sm dark:bg-purple-900 dark:text-purple-300"
                        : "bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {getServiceIconLarge("laboratory")}
                    <span>Lab</span>
                    {allUnpaidOrders.laboratory.length > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        activeCategory === "laboratory"
                          ? "bg-purple-500 text-white"
                          : "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                      }`}>
                        {allUnpaidOrders.laboratory.length}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveCategory("xray")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === "xray"
                        ? "bg-blue-100 text-blue-700 border-2 border-blue-500 shadow-sm dark:bg-blue-900 dark:text-blue-300"
                        : "bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {getServiceIconLarge("xray")}
                    <span>X-Ray</span>
                    {allUnpaidOrders.xray.length > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        activeCategory === "xray"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                      }`}>
                        {allUnpaidOrders.xray.length}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveCategory("ultrasound")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === "ultrasound"
                        ? "bg-teal-100 text-teal-700 border-2 border-teal-500 shadow-sm dark:bg-teal-900 dark:text-teal-300"
                        : "bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {getServiceIconLarge("ultrasound")}
                    <span>Ultrasound</span>
                    {allUnpaidOrders.ultrasound.length > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        activeCategory === "ultrasound"
                          ? "bg-teal-500 text-white"
                          : "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                      }`}>
                        {allUnpaidOrders.ultrasound.length}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveCategory("pharmacy")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === "pharmacy"
                        ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500 shadow-sm dark:bg-emerald-900 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {getServiceIconLarge("pharmacy")}
                    <span>Pharmacy</span>
                    {allUnpaidOrders.pharmacy.length > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        activeCategory === "pharmacy"
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                      }`}>
                        {allUnpaidOrders.pharmacy.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Content for active category */}
                <div className="space-y-2">
                  {activeCategory === "laboratory" && (
                    allUnpaidOrders.laboratory.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700 rounded-full flex items-center justify-center">
                          <LaboratoryIcon className="text-purple-600 dark:text-purple-300" size={28} />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No pending lab payments</h3>
                        <p className="text-sm text-gray-500">All laboratory tests paid</p>
                      </div>
                    ) : (
                      allUnpaidOrders.laboratory.map(order => renderOrderCard(order, 'laboratory'))
                    )
                  )}
                  
                  {activeCategory === "xray" && (
                    allUnpaidOrders.xray.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-full flex items-center justify-center">
                          <XRayIcon className="text-blue-600 dark:text-blue-300" size={28} />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No pending X-ray payments</h3>
                        <p className="text-sm text-gray-500">All X-ray exams paid</p>
                      </div>
                    ) : (
                      allUnpaidOrders.xray.map(order => renderOrderCard(order, 'xray'))
                    )
                  )}
                  
                  {activeCategory === "ultrasound" && (
                    allUnpaidOrders.ultrasound.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-800 dark:to-teal-700 rounded-full flex items-center justify-center">
                          <UltrasoundIcon className="text-teal-600 dark:text-teal-300" size={28} />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No pending ultrasound payments</h3>
                        <p className="text-sm text-gray-500">All ultrasound exams paid</p>
                      </div>
                    ) : (
                      allUnpaidOrders.ultrasound.map(order => renderOrderCard(order, 'ultrasound'))
                    )
                  )}
                  
                  {activeCategory === "pharmacy" && (
                    allUnpaidOrders.pharmacy.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-700 rounded-full flex items-center justify-center">
                          <PharmacyIcon className="text-emerald-600 dark:text-emerald-300" size={28} />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No pending pharmacy payments</h3>
                        <p className="text-sm text-gray-500">All pharmacy orders paid</p>
                      </div>
                    ) : (
                      allUnpaidOrders.pharmacy.map(order => renderOrderCard(order, 'pharmacy'))
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
              <CardHeader className="bg-gradient-to-r from-green-50/80 via-green-50/40 to-transparent dark:from-green-950/80 dark:via-green-950/40 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg shadow-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Payment Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-center py-12">
                  <div className="relative inline-block mb-3">
                    <DollarSign className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">All Payments Up to Date!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No pending payments at this time. Great work!
                    <span className="inline-block ml-1" aria-hidden="true">🎉</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* PAYMENT HISTORY TAB CONTENT */}
      {activeMainTab === "history" && (
        <Card className="border-gray-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(20,184,166,0.15)] transition-all duration-300">
          <CardContent className="pt-4">
            {/* Date Range Filter Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto mb-4">
              <button
                onClick={() => setPaymentHistoryTab("today")}
                className={`relative px-4 py-2.5 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  paymentHistoryTab === "today"
                    ? "text-teal-700 dark:text-teal-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                }`}
              >
                Today
                {paymentHistoryTab === "today" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                )}
              </button>
              
              <button
                onClick={() => setPaymentHistoryTab("yesterday")}
                className={`relative px-4 py-2.5 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  paymentHistoryTab === "yesterday"
                    ? "text-teal-700 dark:text-teal-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                }`}
              >
                Yesterday
                {paymentHistoryTab === "yesterday" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                )}
              </button>
              
              <button
                onClick={() => setPaymentHistoryTab("last7days")}
                className={`relative px-3 sm:px-4 py-2.5 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  paymentHistoryTab === "last7days"
                    ? "text-teal-700 dark:text-teal-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                }`}
              >
                <span className="hidden sm:inline">Last 7 Days</span>
                <span className="sm:hidden">7 Days</span>
                {paymentHistoryTab === "last7days" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                )}
              </button>
              
              <button
                onClick={() => setPaymentHistoryTab("last30days")}
                className={`relative px-3 sm:px-4 py-2.5 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  paymentHistoryTab === "last30days"
                    ? "text-teal-700 dark:text-teal-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                }`}
              >
                <span className="hidden sm:inline">Last 30 Days</span>
                <span className="sm:hidden">30 Days</span>
                {paymentHistoryTab === "last30days" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                )}
              </button>
              
              <button
                onClick={() => setPaymentHistoryTab("all")}
                className={`relative px-4 py-2.5 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  paymentHistoryTab === "all"
                    ? "text-teal-700 dark:text-teal-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                }`}
              >
                All
                {paymentHistoryTab === "all" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                )}
              </button>
            </div>

            {/* Stats Cards - Premium KPIs */}
            {paymentHistory.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* Total Collected */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                      <Wallet className="w-5 h-5 text-green-700 dark:text-green-300" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300 tabular-nums">
                        SSP {paymentHistory.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Total Collected
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Count */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 p-4 rounded-lg border border-teal-200 dark:border-teal-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-200 dark:bg-teal-800 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-teal-700 dark:text-teal-300" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-teal-700 dark:text-teal-300 tabular-nums">
                        {paymentHistory.length}
                      </div>
                      <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                        Transactions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                      <CreditCard className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {paymentHistory.filter(p => p.paymentMethod === 'cash').length} Cash Transactions
                        {paymentHistory.filter(p => p.paymentMethod !== 'cash').length > 0 && 
                          `, ${paymentHistory.filter(p => p.paymentMethod !== 'cash').length} Other`
                        }
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        Payment Methods
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment List */}
            {historyLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-teal-600"></div>
                <span className="ml-3 text-sm text-gray-600">Loading...</span>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No payments found</h3>
                <p className="text-sm text-gray-500">
                  {paymentHistoryTab === "today" ? "No payments today yet" :
                   paymentHistoryTab === "yesterday" ? "No payments yesterday" :
                   paymentHistoryTab === "last7days" ? "No payments in last 7 days" :
                   paymentHistoryTab === "last30days" ? "No payments in last 30 days" :
                   "No payment history"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {paymentHistory.map((payment) => {
                  const patientName = payment.patient 
                    ? `${payment.patient.firstName} ${payment.patient.lastName}` 
                    : payment.patientId;
                  
                  // Safe fallback for avatar generation
                  let patientFirstName = 'P';
                  let patientLastName = 'T';
                  
                  if (payment.patient) {
                    patientFirstName = payment.patient.firstName;
                    patientLastName = payment.patient.lastName;
                  } else if (payment.patientId && payment.patientId.length >= 2) {
                    patientFirstName = payment.patientId.substring(0, 1);
                    patientLastName = payment.patientId.substring(1, 2);
                  }
                  
                  return (
                    <div key={payment.id} className="p-3 border border-gray-200/70 rounded-lg hover:border-teal-300 hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-transparent dark:hover:from-teal-950/30 dark:hover:to-transparent hover:shadow-[0_2px_8px_rgba(20,184,166,0.15)] hover:-translate-y-0.5 transition-all duration-300 ease-out group">
                      {/* Compact 2-row layout for payment history */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Patient Avatar */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0 ${getAvatarColor(patientFirstName + patientLastName)}`}
                          >
                            {getInitials(patientFirstName, patientLastName)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Row 1: Patient info and time */}
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {patientName}
                              </h4>
                              <span className="text-gray-400 text-xs">•</span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">{payment.patientId}</Badge>
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            
                            {/* Row 2: Service breakdown and payment method */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Service Breakdown with Icons */}
                              {payment.breakdown && Object.keys(payment.breakdown).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(payment.breakdown).map(([category, details]: [string, any]) => {
                                    const colors = getServiceColors(category);
                                    const icon = getMedicalIcon(category, { className: colors.iconColor, size: 14 });
                                    return (
                                      <div key={category} className={`flex items-center gap-1 text-xs ${colors.chipBg} ${colors.chipText} border ${colors.chipBorder} px-2 py-0.5 rounded`}>
                                        {icon}
                                        <span>{category} {details.count > 1 ? `(${details.count})` : ''}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                {payment.paymentMethod === 'cash' ? '💵 Cash' : 
                                 payment.paymentMethod === 'mobile_money' ? '📱 Mobile' : 
                                 '🏦 Bank'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Processed by <span className="font-medium capitalize">{payment.receivedBy}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Right side: Amount and actions */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="text-xl font-bold text-teal-700 dark:text-teal-300 tabular-nums">
                            SSP {payment.totalAmount.toLocaleString()}
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm font-semibold text-xs">PAID</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPaymentForView(payment);
                                setIsReceiptViewOpen(true);
                              }}
                              className="h-7 text-xs border-gray-200/70 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950 transition-all"
                              data-testid={`button-view-receipt-${payment.paymentId}`}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Processing Modal - Premium */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-3 sm:p-5 border-gray-200/70 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-200/70">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm">
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 dark:text-slate-300 flex-shrink-0" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Process Payment</span>
              </div>
              {selectedPatient && (
                <div className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                  {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mt-3">
              {/* SECTION 1: Unpaid Orders - Premium */}
              <Card className="lg:col-span-1 border-2 border-red-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.15)] transition-all">
                <CardHeader className="bg-gradient-to-r from-red-50/80 via-red-50/50 to-transparent dark:from-red-950/80 dark:via-red-950/50 pb-2 pt-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-lg shadow-sm">
                        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="font-bold">Unpaid Orders</span>
                    </div>
                    {unpaidOrders.length > 0 && (
                      <Badge variant="destructive" className="text-xs font-semibold shadow-sm">{unpaidOrders.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 px-3 sm:px-4">
                  {unpaidOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="relative inline-block mb-2">
                        <CheckCircle className="h-14 w-14 mx-auto text-green-500" />
                      </div>
                      <p className="text-green-600 dark:text-green-400 font-bold text-base">All Paid!</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No unpaid orders</p>
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={addAllUnpaidItems}
                        className="w-full mb-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-[0_4px_20px_rgba(59,130,246,0.3)] transition-all duration-300 min-h-[44px]"
                        size="lg"
                        data-testid="button-add-all-unpaid"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add All Unpaid Items
                      </Button>
                      
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {unpaidOrders.map((order) => {
                          const isAdded = paymentItems.some(item => item.relatedId === order.id);
                          
                          // Use order.price directly (now always present from backend)
                          const displayPrice = order.price || 0;
                          
                          // Create service object from order data
                          const serviceForPayment = {
                            id: order.serviceId || 0,
                            name: order.serviceName || order.description,
                            category: order.type === 'lab_test_item' ? 'laboratory' : 
                                     order.type === 'xray_exam' ? 'radiology' :
                                     order.type === 'ultrasound_exam' ? 'ultrasound' : 'pharmacy',
                            price: displayPrice,
                            description: order.description
                          };
                          
                          const serviceIcon = getServiceIcon(order.type);
                          
                          return (
                            <div 
                              key={order.id} 
                              className={`p-2.5 border-2 rounded-lg transition-all duration-300 ${
                                isAdded 
                                  ? 'bg-green-50 border-green-300 dark:bg-green-950' 
                                  : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1.5">
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-sm">{serviceIcon}</span>
                                    <h4 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">
                                      {order.description}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatDateNice(order.date)}
                                  </p>
                                  {order.bodyPart && (
                                    <p className="text-xs text-gray-500">Part: {order.bodyPart}</p>
                                  )}
                                </div>
                                <Badge variant={isAdded ? "default" : "destructive"} className="text-xs flex-shrink-0">
                                  {isAdded ? "ADDED" : "UNPAID"}
                                </Badge>
                              </div>
                              {!isAdded && displayPrice > 0 && (
                                <Button
                                  size="sm"
                                  className="w-full mt-1.5 min-h-[36px] text-xs"
                                  onClick={() => addServiceToPayment(serviceForPayment, order)}
                                  data-testid={`button-add-service-${order.id}`}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Add (SSP {displayPrice.toLocaleString()})
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* SECTION 2: Selected Items to Pay - Premium */}
              <Card className="lg:col-span-1 border-2 border-green-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(34,197,94,0.15)] transition-all">
                <CardHeader className="bg-gradient-to-r from-green-50/80 via-green-50/50 to-transparent dark:from-green-950/80 dark:via-green-950/50 pb-2 pt-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg shadow-sm">
                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-bold">Selected Items</span>
                    </div>
                    {paymentItems.length > 0 && (
                      <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white text-xs shadow-sm font-semibold">{paymentItems.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 px-3 sm:px-4">
                  {paymentItems.length === 0 ? (
                    <div className="text-center py-6">
                      <Receipt className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">No items selected</p>
                      <p className="text-xs text-gray-400 mt-0.5">Add items from left</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto mb-3">
                        {paymentItems.map((item, index) => (
                          <div key={index} className="p-2.5 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">
                                  {item.serviceName}
                                </div>
                                {item.description !== item.serviceName && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 break-words">
                                    {item.description}
                                  </div>
                                )}
                                <div className="text-sm font-bold text-green-700 dark:text-green-400 mt-0.5 tabular-nums">
                                  SSP {item.unitPrice.toLocaleString()}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-7 w-7 p-0"
                                onClick={() => removePaymentItem(index)}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t-2 border-green-600 pt-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-950 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 sticky bottom-0 rounded-b-lg shadow-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm sm:text-base text-green-800 dark:text-green-200">Total:</span>
                          <span className="font-bold text-xl sm:text-2xl text-green-700 dark:text-green-400 tabular-nums">
                            SSP {Math.round(getTotalAmount()).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Add More Services - Collapsible */}
                  <div className="mt-3 border-t pt-3">
                    <h4 className="font-semibold mb-2 text-xs sm:text-sm">Add More Services:</h4>
                    
                    {/* Service Search */}
                    <Input
                      placeholder="Search services..."
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      className="mb-2 text-xs h-9"
                      data-testid="input-search-services"
                    />
                    
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {["consultation", "laboratory", "radiology", "ultrasound", "pharmacy"].map(category => {
                        const categoryServices = getServiceByCategory(category).filter(s => 
                          !serviceSearchQuery || 
                          s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                        );
                        
                        if (categoryServices.length === 0) return null;
                        
                        const isOpen = openServiceCategories.includes(category);
                        
                        return (
                          <Collapsible key={category} open={isOpen} onOpenChange={() => toggleServiceCategory(category)}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left">
                              <span className="font-medium text-xs capitalize">{category}</span>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-xs">{categoryServices.length}</Badge>
                                {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-1 pl-1.5 space-y-1">
                              {categoryServices.map(service => (
                                <Button
                                  key={service.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-between text-xs min-h-[36px]"
                                  onClick={() => addServiceToPayment(service)}
                                  data-testid={`button-add-service-manual-${service.id}`}
                                >
                                  <span className="truncate">{service.name}</span>
                                  <span className="font-semibold ml-2 flex-shrink-0">SSP {service.price}</span>
                                </Button>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 3: Payment Details & Summary - Premium */}
              <Card className="lg:col-span-1 border-2 border-blue-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] transition-all">
                <CardHeader className="bg-gradient-to-r from-blue-50/80 via-blue-50/50 to-transparent dark:from-blue-950/80 dark:via-blue-950/50 pb-2 pt-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg shadow-sm">
                      <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-bold">Payment Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 px-3 sm:px-4">
                  {paymentItems.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertCircle className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">Add items to continue</p>
                      <p className="text-xs text-gray-400 mt-0.5">Select items to pay first</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Payment Summary - Compact Premium */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-950 p-3 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                        <h4 className="font-bold mb-2 text-xs sm:text-sm text-blue-800 dark:text-blue-200">Summary</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center p-1.5 bg-white/50 dark:bg-black/20 rounded">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Items:</span>
                            <span className="font-bold text-blue-700 dark:text-blue-300">{paymentItems.length}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold border-t-2 border-blue-300 dark:border-blue-700 pt-2">
                            <span className="text-blue-800 dark:text-blue-200">Total:</span>
                            <span className="text-base text-blue-700 dark:text-blue-400 tabular-nums">SSP {Math.round(getTotalAmount()).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Receipt Preview Button - Compact */}
                      <Button
                        variant="outline"
                        className="w-full min-h-[36px] text-xs border-2 border-blue-200/70 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all shadow-sm hover:shadow-md"
                        onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                        data-testid="button-toggle-receipt-preview"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        {showReceiptPreview ? "Hide" : "Show"} Receipt
                      </Button>

                      {/* Receipt Preview */}
                      {showReceiptPreview && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white dark:bg-gray-950 text-xs">
                          <div className="text-center mb-3">
                            <h3 className="font-bold text-sm">Bahr El Ghazal Clinic</h3>
                            <p className="text-xs text-gray-600">Payment Receipt</p>
                          </div>
                          <div className="border-b pb-2 mb-2">
                            <p><strong>Patient:</strong> {selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                            <p><strong>ID:</strong> {selectedPatient?.patientId}</p>
                            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                          </div>
                          <div className="border-b pb-2 mb-2">
                            <p className="font-semibold mb-1">Services:</p>
                            {paymentItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs mb-1">
                                <span className="truncate">{item.serviceName}</span>
                                <span>SSP {item.unitPrice.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="font-bold flex justify-between text-sm">
                            <span>TOTAL:</span>
                            <span className="tabular-nums">SSP {Math.round(getTotalAmount()).toLocaleString()}</span>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <p>Method: {paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'mobile_money' ? 'Mobile' : 'Bank'}</p>
                            <p>By: {receivedBy || '(Not entered)'}</p>
                          </div>
                        </div>
                      )}

                      {/* Payment Form - Compact */}
                      <div className="space-y-3 border-t pt-3">
                        <div>
                          <label className="block text-xs font-medium mb-1.5">Payment Method *</label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="min-h-[40px] text-sm" data-testid="select-payment-method">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">💵 Cash</SelectItem>
                              <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                              <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1.5">Received By *</label>
                          <Input
                            placeholder="Enter your name"
                            value={receivedBy}
                            onChange={(e) => setReceivedBy(e.target.value)}
                            className="min-h-[40px] text-sm"
                            data-testid="input-received-by"
                          />
                          <p className="text-xs text-gray-500 mt-1">Who is receiving this payment?</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1.5">Notes (Optional)</label>
                          <Textarea
                            placeholder="Any additional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="text-xs"
                            data-testid="textarea-notes"
                          />
                        </div>

                        <Button
                          onClick={handleProcessPayment}
                          disabled={createPaymentMutation.isPending || !receivedBy.trim()}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-[0_4px_20px_rgba(34,197,94,0.3)] text-white font-bold min-h-[48px] text-sm sm:text-base shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          size="lg"
                          data-testid="button-process-payment"
                        >
                          {createPaymentMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span className="tabular-nums">Complete (SSP {Math.round(getTotalAmount()).toLocaleString()})</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Confirm Payment
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm">
                <p className="font-semibold mb-2">Please confirm payment details:</p>
                <div className="space-y-1 text-xs">
                  <p><strong>Patient:</strong> {selectedPatient?.firstName} {selectedPatient?.lastName} ({selectedPatient?.patientId})</p>
                  <p><strong>Total Amount:</strong> <span className="text-green-600 font-bold text-base tabular-nums">SSP {Math.round(getTotalAmount()).toLocaleString()}</span></p>
                  <p><strong>Items:</strong> {paymentItems.length} service(s)</p>
                  <p><strong>Payment Method:</strong> {paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}</p>
                  <p><strong>Received By:</strong> {receivedBy}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Once confirmed, this payment will be recorded and cannot be easily undone. Make sure all details are correct.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-payment">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAndProcessPayment}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-payment"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm & Process
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt View Dialog */}
      <Dialog open={isReceiptViewOpen} onOpenChange={setIsReceiptViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>

          {paymentDetails && (
            <div className="space-y-6">
              {/* Formatted Receipt */}
              <div className="border-2 border-gray-200 rounded-lg p-6 bg-white dark:bg-gray-950">
                <div className="text-center mb-6 pb-4 border-b-2 border-dashed">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Bahr El Ghazal Clinic</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payment Receipt</p>
                  <p className="text-xs text-gray-500 mt-2">Receipt #: {paymentDetails.paymentId}</p>
                </div>

                {/* Patient Information */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Patient Name</p>
                    <p className="font-semibold">
                      {paymentDetails.patient ? `${paymentDetails.patient.firstName} ${paymentDetails.patient.lastName}` : paymentDetails.patientId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Patient ID</p>
                    <p className="font-semibold">{paymentDetails.patientId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payment Date</p>
                    <p className="font-semibold">{new Date(paymentDetails.paymentDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payment Time</p>
                    <p className="font-semibold">
                      {new Date(paymentDetails.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Services Paid</h3>
                  <div className="space-y-2">
                    {paymentDetails.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex-1">
                          <p className="font-medium">{item.serviceName}</p>
                          {item.relatedId && (
                            <p className="text-xs text-gray-500">Ref: {item.relatedId}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">SSP {item.unitPrice.toLocaleString()}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL PAID:</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      SSP {paymentDetails.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                    <p className="font-semibold capitalize">
                      {paymentDetails.paymentMethod === 'cash' ? '💵 Cash' : 
                       paymentDetails.paymentMethod === 'mobile_money' ? '📱 Mobile Money' : 
                       '🏦 Bank Transfer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Received By</p>
                    <p className="font-semibold">{paymentDetails.receivedBy}</p>
                  </div>
                </div>

                {paymentDetails.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                    <p className="text-sm">{paymentDetails.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
                  <p>Thank you for your payment!</p>
                  <p className="mt-1">For questions, please contact the clinic reception</p>
                </div>
              </div>

              {/* Print Button */}
              <Button
                className="w-full"
                onClick={() => window.print()}
                data-testid="button-print-receipt"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
