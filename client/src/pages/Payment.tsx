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
import { Search, DollarSign, Receipt, AlertCircle, Users, TestTube, XCircle as XRayIcon, ActivitySquare, Pill, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

    createPaymentMutation.mutate({
      patientId: selectedPatient.patientId,
      items: paymentItems,
      paymentMethod,
      receivedBy: receivedBy.trim(),
      notes: notes.trim(),
    });
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

      {/* Payment Processing Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-blue-600" />
                <span>Process Payment</span>
              </div>
              {selectedPatient && (
                <div className="text-sm font-normal text-blue-600">
                  Patient: {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="grid lg:grid-cols-2 gap-6 mt-4">
              {/* Unpaid Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Unpaid Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {unpaidOrders.length === 0 ? (
                    <p className="text-green-600 font-semibold">No unpaid orders found! ✓</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {unpaidOrders.map((order) => {
                        const matchingService = services.find(s => 
                          (order.type === 'lab_test' && s.category === 'laboratory') ||
                          (order.type === 'xray_exam' && s.category === 'radiology') ||
                          (order.type === 'ultrasound_exam' && s.category === 'ultrasound') ||
                          (order.type === 'pharmacy_order' && s.category === 'pharmacy')
                        );
                        
                        return (
                          <div key={order.id} className="p-3 border rounded-lg bg-red-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-red-800">{order.description}</h4>
                                <p className="text-sm text-red-600">Date: {order.date}</p>
                                {order.bodyPart && (
                                  <p className="text-sm text-red-600">Body Part: {order.bodyPart}</p>
                                )}
                                {order.dosage && (
                                  <p className="text-sm text-red-600">Dosage: {order.dosage}</p>
                                )}
                                {order.quantity && (
                                  <p className="text-sm text-red-600">Quantity: {order.quantity}</p>
                                )}
                              </div>
                              <Badge variant="destructive">UNPAID</Badge>
                            </div>
                            {matchingService ? (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => addServiceToPayment(matchingService, order)}
                                data-testid={`button-add-service-${order.id}`}
                              >
                                Add to Payment (SSP {matchingService.price})
                              </Button>
                            ) : order.type === 'pharmacy_order' ? (
                              <p className="text-xs text-orange-600 mt-2 italic">
                                → Manually add pharmacy services from the list below
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-5 w-5" />
                    Payment Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add services manually */}
                    <div>
                      <h4 className="font-semibold mb-2">Add Services:</h4>
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {["consultation", "laboratory", "radiology", "ultrasound", "pharmacy"].map(category => (
                          <div key={category}>
                            <h5 className="text-sm font-medium text-gray-600 mb-1 capitalize">{category}</h5>
                            {getServiceByCategory(category).map(service => (
                              <Button
                                key={service.id}
                                variant="outline"
                                size="sm"
                                className="mr-2 mb-1"
                                onClick={() => addServiceToPayment(service)}
                                data-testid={`button-add-service-manual-${service.id}`}
                              >
                                {service.name} (SSP {service.price})
                              </Button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment items list */}
                    {paymentItems.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Items to Pay:</h4>
                        {paymentItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2">
                            <div>
                              <div className="font-medium">{item.serviceName}</div>
                              <div className="text-sm text-gray-600">{item.description}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">SSP {item.unitPrice}</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removePaymentItem(index)}
                                data-testid={`button-remove-item-${index}`}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total Amount:</span>
                            <span className="text-green-600">SSP {getTotalAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment details */}
                    {paymentItems.length > 0 && (
                      <div className="border-t pt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Payment Method</label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger data-testid="select-payment-method">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Received By *</label>
                          <Input
                            placeholder="Enter staff name who received payment"
                            value={receivedBy}
                            onChange={(e) => setReceivedBy(e.target.value)}
                            data-testid="input-received-by"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Notes</label>
                          <Textarea
                            placeholder="Additional notes (optional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            data-testid="textarea-notes"
                          />
                        </div>

                        <Button
                          onClick={handleProcessPayment}
                          disabled={createPaymentMutation.isPending}
                          className="w-full"
                          size="lg"
                          data-testid="button-process-payment"
                        >
                          {createPaymentMutation.isPending ? "Processing..." : `Process Payment (SSP ${getTotalAmount().toFixed(2)})`}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
