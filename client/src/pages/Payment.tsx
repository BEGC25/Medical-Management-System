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
import { Search, DollarSign, Receipt, AlertCircle, Users, TestTube, XCircle as XRayIcon, ActivitySquare, Pill, X, CheckCircle, Plus, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      
      // Find matching service
      const matchingService = services.find(s => 
        (order.type === 'lab_test' && s.category === 'laboratory') ||
        (order.type === 'xray_exam' && s.category === 'radiology') ||
        (order.type === 'ultrasound_exam' && s.category === 'ultrasound') ||
        (order.type === 'pharmacy_order' && s.category === 'pharmacy')
      );
      
      if (matchingService) {
        newItems.push({
          serviceId: matchingService.id,
          serviceName: matchingService.name,
          unitPrice: matchingService.price,
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

    return (
      <div key={order.id} className="p-4 border rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer" 
           data-testid={`unpaid-order-${order.id}`}
           onClick={() => {
             if (patient) {
               handleSelectPatient(patient);
             }
           }}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {patient ? (
                <>
                  <span className="font-semibold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </span>
                  <Badge variant="outline" className="text-xs">{patient.patientId}</Badge>
                </>
              ) : (
                <span className="font-semibold text-gray-900">{order.patientId}</span>
              )}
            </div>
            <h4 className="font-medium text-red-800">{order.description}</h4>
            <p className="text-sm text-red-600">Date: {new Date(order.date).toLocaleDateString()}</p>
            {order.bodyPart && <p className="text-sm text-red-600">Body Part: {order.bodyPart}</p>}
            {order.dosage && <p className="text-sm text-red-600">Dosage: {order.dosage}</p>}
            {order.quantity && <p className="text-sm text-red-600">Quantity: {order.quantity}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="destructive">UNPAID</Badge>
            <span className="text-xs text-gray-500 mt-1">Click to process</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">Payment Processing</h1>
        </div>
        {allUnpaidOrders && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {getTotalUnpaidCount()} Pending Payments
          </Badge>
        )}
      </div>

      {/* Quick Patient Search - Moved to TOP */}
      <Card className="border-2 border-blue-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Search className="h-6 w-6" />
            Quick Patient Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search patients by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base border-2"
                data-testid="input-search-patients"
              />
            </div>
            
            {searchQuery.length >= 2 && (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {patientsLoading && (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Searching patients...</span>
                  </div>
                )}
                {patientsError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{patientsError.message}</span>
                    </div>
                  </div>
                )}
                {!patientsLoading && !patientsError && patients.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No patients found matching "{searchQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1">Try different search terms</p>
                  </div>
                )}
                {!patientsLoading && !patientsError && patients.map((patient: Patient) => (
                  <Button
                    key={patient.id}
                    variant="outline"
                    className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-300 transition-all"
                    onClick={() => handleSelectPatient(patient)}
                    data-testid={`patient-result-${patient.patientId}`}
                  >
                    <div className="text-left">
                      <div className="font-semibold">
                        {patient.firstName} {patient.lastName} ({patient.patientId})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {patient.age} years old • {patient.gender}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">Enter at least 2 characters to search for patients</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments Overview */}
      {allUnpaidLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading pending payments...</span>
            </div>
          </CardContent>
        </Card>
      ) : allUnpaidOrders && getTotalUnpaidCount() > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              Patients with Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="laboratory" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="laboratory" className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Laboratory
                  {allUnpaidOrders.laboratory.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{allUnpaidOrders.laboratory.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="xray" className="flex items-center gap-2">
                  <XRayIcon className="h-4 w-4" />
                  X-Ray
                  {allUnpaidOrders.xray.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{allUnpaidOrders.xray.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ultrasound" className="flex items-center gap-2">
                  <ActivitySquare className="h-4 w-4" />
                  Ultrasound
                  {allUnpaidOrders.ultrasound.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{allUnpaidOrders.ultrasound.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pharmacy" className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Pharmacy
                  {allUnpaidOrders.pharmacy.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{allUnpaidOrders.pharmacy.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="laboratory" className="mt-4">
                <div className="space-y-3">
                  {allUnpaidOrders.laboratory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pending laboratory payments</p>
                  ) : (
                    allUnpaidOrders.laboratory.map(order => renderOrderCard(order, 'laboratory'))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="xray" className="mt-4">
                <div className="space-y-3">
                  {allUnpaidOrders.xray.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pending X-ray payments</p>
                  ) : (
                    allUnpaidOrders.xray.map(order => renderOrderCard(order, 'xray'))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ultrasound" className="mt-4">
                <div className="space-y-3">
                  {allUnpaidOrders.ultrasound.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pending ultrasound payments</p>
                  ) : (
                    allUnpaidOrders.ultrasound.map(order => renderOrderCard(order, 'ultrasound'))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pharmacy" className="mt-4">
                <div className="space-y-3">
                  {allUnpaidOrders.pharmacy.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pending pharmacy payments</p>
                  ) : (
                    allUnpaidOrders.pharmacy.map(order => renderOrderCard(order, 'pharmacy'))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-green-600">
              <DollarSign className="h-16 w-16 mx-auto mb-3 opacity-50" />
              <p className="text-xl font-semibold">All Payments Up to Date! ✓</p>
              <p className="text-sm text-gray-500 mt-2">No pending payments at this time</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Processing Modal - Redesigned for Mobile */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                <span className="text-lg sm:text-xl">Process Payment</span>
              </div>
              {selectedPatient && (
                <div className="text-sm sm:text-base font-normal text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">
                  {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
              {/* SECTION 1: Unpaid Orders */}
              <Card className="lg:col-span-1 border-red-200">
                <CardHeader className="bg-red-50 dark:bg-red-950 pb-3">
                  <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      <span>Unpaid Orders</span>
                    </div>
                    {unpaidOrders.length > 0 && (
                      <Badge variant="destructive" className="text-xs">{unpaidOrders.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-3 sm:px-6">
                  {unpaidOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      <p className="text-green-600 font-semibold">All Paid!</p>
                      <p className="text-sm text-gray-500 mt-1">No unpaid orders</p>
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={addAllUnpaidItems}
                        className="w-full mb-4 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                        size="lg"
                        data-testid="button-add-all-unpaid"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add All Unpaid Items
                      </Button>
                      
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {unpaidOrders.map((order) => {
                          const matchingService = services.find(s => 
                            (order.type === 'lab_test' && s.category === 'laboratory') ||
                            (order.type === 'xray_exam' && s.category === 'radiology') ||
                            (order.type === 'ultrasound_exam' && s.category === 'ultrasound') ||
                            (order.type === 'pharmacy_order' && s.category === 'pharmacy')
                          );
                          
                          const isAdded = paymentItems.some(item => item.relatedId === order.id);
                          
                          return (
                            <div 
                              key={order.id} 
                              className={`p-3 border-2 rounded-lg transition-all ${
                                isAdded 
                                  ? 'bg-green-50 border-green-300 dark:bg-green-950' 
                                  : 'bg-red-50 border-red-200 dark:bg-red-950'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0 pr-2">
                                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words">
                                    {order.description}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    {order.date}
                                  </p>
                                  {order.bodyPart && (
                                    <p className="text-xs text-gray-500">Body Part: {order.bodyPart}</p>
                                  )}
                                </div>
                                <Badge variant={isAdded ? "default" : "destructive"} className="text-xs flex-shrink-0">
                                  {isAdded ? "ADDED" : "UNPAID"}
                                </Badge>
                              </div>
                              {matchingService && !isAdded && (
                                <Button
                                  size="sm"
                                  className="w-full mt-2 min-h-[36px] text-xs sm:text-sm"
                                  onClick={() => addServiceToPayment(matchingService, order)}
                                  data-testid={`button-add-service-${order.id}`}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add (SSP {matchingService.price})
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

              {/* SECTION 2: Selected Items to Pay */}
              <Card className="lg:col-span-1 border-green-200">
                <CardHeader className="bg-green-50 dark:bg-green-950 pb-3">
                  <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      <span>Selected Items to Pay</span>
                    </div>
                    {paymentItems.length > 0 && (
                      <Badge className="bg-green-600 text-xs">{paymentItems.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-3 sm:px-6">
                  {paymentItems.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 font-medium">No items selected</p>
                      <p className="text-xs text-gray-400 mt-1">Add items from unpaid orders or services below</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                        {paymentItems.map((item, index) => (
                          <div key={index} className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words">
                                  {item.serviceName}
                                </div>
                                {item.description !== item.serviceName && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 break-words">
                                    {item.description}
                                  </div>
                                )}
                                <div className="text-sm font-bold text-green-700 dark:text-green-400 mt-1">
                                  SSP {item.unitPrice.toLocaleString()}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                onClick={() => removePaymentItem(index)}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t-2 border-green-600 pt-3 bg-green-100 dark:bg-green-900 -mx-3 sm:-mx-6 px-3 sm:px-6 py-3 sticky bottom-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-base sm:text-lg">Total Amount:</span>
                          <span className="font-bold text-lg sm:text-2xl text-green-700 dark:text-green-400">
                            SSP {Math.round(getTotalAmount()).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Add More Services - Collapsible */}
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold mb-3 text-sm sm:text-base">Add More Services:</h4>
                    
                    {/* Service Search */}
                    <Input
                      placeholder="Search services..."
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      className="mb-3 text-sm"
                      data-testid="input-search-services"
                    />
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {["consultation", "laboratory", "radiology", "ultrasound", "pharmacy"].map(category => {
                        const categoryServices = getServiceByCategory(category).filter(s => 
                          !serviceSearchQuery || 
                          s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                        );
                        
                        if (categoryServices.length === 0) return null;
                        
                        const isOpen = openServiceCategories.includes(category);
                        
                        return (
                          <Collapsible key={category} open={isOpen} onOpenChange={() => toggleServiceCategory(category)}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left">
                              <span className="font-medium text-sm capitalize">{category}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{categoryServices.length}</Badge>
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-2 pl-2 space-y-1">
                              {categoryServices.map(service => (
                                <Button
                                  key={service.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-between text-xs sm:text-sm min-h-[36px]"
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

              {/* SECTION 3: Payment Details & Summary */}
              <Card className="lg:col-span-1 border-blue-200">
                <CardHeader className="bg-blue-50 dark:bg-blue-950 pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span>Payment Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-3 sm:px-6">
                  {paymentItems.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 font-medium">Add items to continue</p>
                      <p className="text-xs text-gray-400 mt-1">Select items to pay before entering payment details</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Payment Summary */}
                      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold mb-3 text-sm sm:text-base">Payment Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Number of Items:</span>
                            <span className="font-semibold">{paymentItems.length}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total Amount:</span>
                            <span className="text-blue-700 dark:text-blue-400">SSP {Math.round(getTotalAmount()).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Receipt Preview Button */}
                      <Button
                        variant="outline"
                        className="w-full min-h-[44px]"
                        onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                        data-testid="button-toggle-receipt-preview"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showReceiptPreview ? "Hide" : "Show"} Receipt Preview
                      </Button>

                      {/* Receipt Preview */}
                      {showReceiptPreview && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-950 text-sm">
                          <div className="text-center mb-4">
                            <h3 className="font-bold text-lg">Bahr El Ghazal Clinic</h3>
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
                                <span>{item.serviceName}</span>
                                <span>SSP {item.unitPrice.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="font-bold flex justify-between">
                            <span>TOTAL:</span>
                            <span>SSP {Math.round(getTotalAmount()).toLocaleString()}</span>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <p>Payment Method: {paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}</p>
                            <p>Received By: {receivedBy || '(Not entered yet)'}</p>
                          </div>
                        </div>
                      )}

                      {/* Payment Form */}
                      <div className="space-y-4 border-t pt-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Payment Method *</label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="min-h-[44px]" data-testid="select-payment-method">
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
                          <label className="block text-sm font-medium mb-2">Received By *</label>
                          <Input
                            placeholder="Enter your name"
                            value={receivedBy}
                            onChange={(e) => setReceivedBy(e.target.value)}
                            className="min-h-[44px]"
                            data-testid="input-received-by"
                          />
                          <p className="text-xs text-gray-500 mt-1">Who is receiving this payment?</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                          <Textarea
                            placeholder="Any additional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="text-sm"
                            data-testid="textarea-notes"
                          />
                        </div>

                        <Button
                          onClick={handleProcessPayment}
                          disabled={createPaymentMutation.isPending || !receivedBy.trim()}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold min-h-[50px] text-base sm:text-lg"
                          size="lg"
                          data-testid="button-process-payment"
                        >
                          {createPaymentMutation.isPending ? (
                            <>Processing...</>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Complete Payment (SSP {Math.round(getTotalAmount()).toLocaleString()})
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
                  <p><strong>Total Amount:</strong> <span className="text-green-600 font-bold text-base">SSP {Math.round(getTotalAmount()).toLocaleString()}</span></p>
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
    </div>
  );
}
