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
import { Search, DollarSign, Receipt, AlertCircle, Users, TestTube, XCircle as XRayIcon, ActivitySquare, Pill } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    enabled: searchQuery.length >= 2, // Require at least 2 characters
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

  const handleSelectPatientFromOrder = (order: UnpaidOrder) => {
    if (order.patient) {
      setSelectedPatient(order.patient);
      setSearchQuery("");
    }
  };

  const addOrderToPayment = (order: UnpaidOrder) => {
    // Use the service information from the backend response
    if (order.serviceId && order.serviceName && order.price !== undefined) {
      const matchingService: Service = {
        id: order.serviceId,
        name: order.serviceName,
        category: order.type === 'lab_test' ? 'laboratory' :
                  order.type === 'xray_exam' ? 'radiology' :
                  order.type === 'ultrasound_exam' ? 'ultrasound' : 'pharmacy',
        description: order.description,
        price: order.price,
      };
      
      handleSelectPatientFromOrder(order);
      addServiceToPayment(matchingService, order);
    } else {
      toast({
        title: "Service Not Found",
        description: "Could not find pricing information for this service",
        variant: "destructive",
      });
    }
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
    const hasValidService = order.serviceId && order.price !== undefined;

    return (
      <div key={order.id} className="p-4 border rounded-lg bg-red-50 hover:bg-red-100 transition-colors" data-testid={`unpaid-order-${order.id}`}>
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
          <Badge variant="destructive">UNPAID</Badge>
        </div>
        {hasValidService ? (
          <Button
            size="sm"
            className="mt-2"
            onClick={() => addOrderToPayment(order)}
            data-testid={`btn-process-payment-${order.id}`}
          >
            Process Payment (SSP {order.price})
          </Button>
        ) : (
          <p className="text-xs text-red-600 mt-2">Service pricing not available</p>
        )}
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

      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Patient Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search patients by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4"
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
                    variant={selectedPatient?.id === patient.id ? "default" : "outline"}
                    className="justify-start h-auto p-4"
                    onClick={() => setSelectedPatient(patient)}
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

            {selectedPatient && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">Selected Patient:</h3>
                <p className="text-blue-700">
                  {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Unpaid Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Unpaid Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unpaidOrders.length === 0 ? (
                <p className="text-green-600 font-semibold">No unpaid orders found! ✓</p>
              ) : (
                <div className="space-y-3">
                  {unpaidOrders.map((order) => {
                    const matchingService = services.find(s => 
                      (order.type === 'lab_test' && s.category === 'laboratory') ||
                      (order.type === 'xray_exam' && s.category === 'radiology') ||
                      (order.type === 'ultrasound_exam' && s.category === 'ultrasound')
                    );
                    
                    return (
                      <div key={order.id} className="p-3 border rounded-lg bg-red-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-red-800">{order.description}</h4>
                            <p className="text-sm text-red-600">Date: {order.date}</p>
                            {order.bodyPart && (
                              <p className="text-sm text-red-600">Body Part: {order.bodyPart}</p>
                            )}
                          </div>
                          <Badge variant="destructive">UNPAID</Badge>
                        </div>
                        {matchingService && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => addServiceToPayment(matchingService, order)}
                          >
                            Add to Payment (SSP {matchingService.price})
                          </Button>
                        )}
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
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add services manually */}
                <div>
                  <h4 className="font-semibold mb-2">Add Services:</h4>
                  <div className="grid gap-2">
                    {["consultation", "laboratory", "radiology", "ultrasound"].map(category => (
                      <div key={category}>
                        <h5 className="text-sm font-medium text-gray-600 mb-1 capitalize">{category}</h5>
                        {getServiceByCategory(category).map(service => (
                          <Button
                            key={service.id}
                            variant="outline"
                            size="sm"
                            className="mr-2 mb-1"
                            onClick={() => addServiceToPayment(service)}
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
                        <SelectTrigger>
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
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <Textarea
                        placeholder="Additional notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <Button
                      onClick={handleProcessPayment}
                      disabled={createPaymentMutation.isPending}
                      className="w-full"
                      size="lg"
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
    </div>
  );
}