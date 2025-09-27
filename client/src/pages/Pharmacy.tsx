import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, Check, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { PharmacyOrder } from "@shared/schema";

export default function Pharmacy() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch pharmacy orders with default filter for today to improve performance
  const { data: pharmacyOrders = [], isLoading } = useQuery<PharmacyOrder[]>({
    queryKey: ['/api/pharmacy-orders', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/pharmacy-orders?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch today\'s pharmacy orders');
      return response.json();
    },
  });

  // Filter orders based on search
  const filteredOrders = pharmacyOrders.filter((order: PharmacyOrder) => 
    order.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate orders by status and payment
  const pendingOrders = filteredOrders.filter((order: PharmacyOrder) => 
    order.status === 'prescribed' && order.paymentStatus === 'paid'
  );
  const unpaidOrders = filteredOrders.filter((order: PharmacyOrder) => 
    order.paymentStatus === 'unpaid'
  );
  const dispensedOrders = filteredOrders.filter((order: PharmacyOrder) => 
    order.status === 'dispensed'
  );

  // Dispense medication mutation
  const dispenseMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/pharmacy-orders/${orderId}/dispense`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to dispense medication');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy-orders'] });
      toast({
        title: "Medication Dispensed",
        description: "The prescription has been successfully dispensed.",
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

  const handleDispense = (orderId: string) => {
    if (window.confirm('Are you sure you want to dispense this medication?')) {
      dispenseMutation.mutate(orderId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Pill className="w-6 h-6 animate-pulse text-medical-blue" />
          <span className="text-gray-600 dark:text-gray-300">Loading pharmacy orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-medical-blue rounded-xl">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pharmacy</h1>
            <p className="text-gray-600 dark:text-gray-300">Prescription Management & Dispensing</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Label htmlFor="search" className="sr-only">Search prescriptions</Label>
            <Input
              id="search"
              placeholder="Search by Patient ID or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              data-testid="input-search-prescriptions"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* Ready to Dispense - Paid Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Ready to Dispense - Paid ({pendingOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingOrders.map((order: any) => (
                <div 
                  key={order.id} 
                  className="border border-green-200 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  data-testid={`order-paid-${order.orderId}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Patient: {order.patientId}
                        </h3>
                        <Badge className="bg-green-600 text-white">
                          ✓ PAID
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        Order ID: {order.orderId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Dosage: {order.dosage || 'As prescribed'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Quantity: {order.quantity}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Prescribed: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        onClick={() => handleDispense(order.orderId)}
                        disabled={dispenseMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`button-dispense-${order.orderId}`}
                      >
                        <Pill className="w-4 h-4 mr-2" />
                        {dispenseMutation.isPending ? "Dispensing..." : "Dispense"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingOrders.length === 0 && (
                <div className="text-center py-8">
                  <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No paid prescriptions ready for dispensing</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Awaiting Payment ({unpaidOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unpaidOrders.map((order: any) => (
                <div 
                  key={order.id} 
                  className="border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 opacity-75"
                  data-testid={`order-unpaid-${order.orderId}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Patient: {order.patientId}
                        </h3>
                        <Badge className="bg-red-600 text-white">
                          ✗ UNPAID
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        Order ID: {order.orderId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Dosage: {order.dosage || 'As prescribed'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Quantity: {order.quantity}
                      </p>
                      <p className="text-sm text-red-600 font-medium mt-2">
                        ⚠️ Patient must pay at reception before dispensing
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {unpaidOrders.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No unpaid prescriptions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recently Dispensed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Recently Dispensed ({dispensedOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dispensedOrders.slice(0, 10).map((order: any) => (
                <div 
                  key={order.id} 
                  className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
                  data-testid={`order-dispensed-${order.orderId}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Patient: {order.patientId}
                        </h3>
                        <Badge className="bg-blue-600 text-white">
                          <Check className="w-3 h-3 mr-1" />
                          DISPENSED
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        Order ID: {order.orderId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Dosage: {order.dosage || 'As prescribed'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Quantity: {order.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {dispensedOrders.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No recently dispensed medications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}