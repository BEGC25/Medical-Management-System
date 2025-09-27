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
import { Search, DollarSign, Receipt, AlertCircle } from "lucide-react";

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

  // Search patients
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients", searchQuery],
    enabled: searchQuery.length > 0,
  });

  // Get services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Get unpaid orders for selected patient
  const { data: unpaidOrders = [], refetch: refetchUnpaidOrders } = useQuery<UnpaidOrder[]>({
    queryKey: [`/api/patients/${selectedPatient?.patientId}/unpaid-orders`],
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
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/xray-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ultrasound-exams"] });
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-8 w-8 text-green-600" />
        <h1 className="text-3xl font-bold">Payment Processing</h1>
      </div>

      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select Patient
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
              />
            </div>
            
            {searchQuery.length > 0 && (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {patients.map((patient: Patient) => (
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