import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, Check, AlertCircle, Search, AlertTriangle, Package, ArrowRight } from "lucide-react";
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

interface PaidPrescription extends PharmacyOrder {
  patient: Patient;
}

export default function Pharmacy() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PaidPrescription | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const { toast } = useToast();

  // Fetch paid prescriptions ready for dispensing
  const { data: paidPrescriptions = [], isLoading } = useQuery<PaidPrescription[]>({
    queryKey: ['/api/pharmacy/prescriptions/paid'],
  });

  // Fetch batches for selected drug (FEFO sorted)
  const { data: batches = [] } = useQuery<DrugBatch[]>({
    queryKey: ['/api/pharmacy/batches/fefo', selectedOrder?.drugId],
    enabled: !!selectedOrder?.drugId,
  });

  // Filter orders based on search
  const filteredOrders = paidPrescriptions.filter((order) => 
    order.patient?.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.drugName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dispense medication mutation
  const dispenseMutation = useMutation({
    mutationFn: async (data: { orderId: string; batchId: string; quantity: number; dispensedBy: string }) => {
      const response = await apiRequest('POST', '/api/pharmacy/dispense', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/prescriptions/paid'] });
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

  const handleDispenseClick = (order: PaidPrescription) => {
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

    dispenseMutation.mutate({
      orderId: selectedOrder.orderId,
      batchId: selectedBatch,
      quantity: selectedOrder.quantity || 1,
      dispensedBy: 'Pharmacist', // TODO: Get from auth context
    });
  };

  const hasAllergies = selectedOrder?.patient?.allergies && selectedOrder.patient.allergies.trim() !== '';

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
        <Link href="/pharmacy-inventory">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-manage-inventory">
            <Package className="w-4 h-4 mr-2" />
            Manage Inventory
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Getting Started with Pharmacy</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                To dispense medications, you first need to <strong>add drugs to your inventory</strong>. 
                Click the "Manage Inventory" button above to:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 ml-4 list-disc space-y-1">
                <li>Add drugs to your catalog (name, strength, form)</li>
                <li>Receive stock batches with lot numbers and expiry dates</li>
                <li>Set prices for each batch</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Label htmlFor="search" className="sr-only">Search prescriptions</Label>
            <Input
              id="search"
              placeholder="Search by Patient ID, Name, Order ID, or Drug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              data-testid="input-search-prescriptions"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ready to Dispense - Paid Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Ready to Dispense - Paid ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className="border border-green-200 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                data-testid={`order-paid-${order.orderId}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {order.patient?.firstName} {order.patient?.lastName}
                      </h3>
                      <Badge className="bg-gray-600 text-white">
                        {order.patient?.patientId}
                      </Badge>
                      <Badge className="bg-green-600 text-white">
                        ✓ PAID
                      </Badge>
                      {order.patient?.allergies && order.patient.allergies.trim() !== '' && (
                        <Badge className="bg-red-600 text-white">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          ALLERGIES
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Order: {order.orderId} | Drug: {order.drugName || <span className="text-orange-600 font-semibold">Not specified</span>}
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
                      onClick={() => handleDispenseClick(order)}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`button-dispense-${order.orderId}`}
                    >
                      <Pill className="w-4 h-4 mr-2" />
                      Dispense
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No paid prescriptions ready for dispensing</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dispense Dialog with Batch Selection */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-dispense">
          <DialogHeader>
            <DialogTitle>Dispense Medication</DialogTitle>
            <DialogDescription>
              Select batch and confirm dispensing for {selectedOrder?.patient?.firstName} {selectedOrder?.patient?.lastName}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Patient ID:</span>
                    <span className="ml-2 font-medium" data-testid="text-patient-id">{selectedOrder.patient?.patientId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Age:</span>
                    <span className="ml-2 font-medium">{selectedOrder.patient?.age || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-300">Gender:</span>
                    <span className="ml-2 font-medium">{selectedOrder.patient?.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Allergy Warning */}
              {hasAllergies && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 p-4 rounded-lg" data-testid="alert-allergies">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">⚠️ ALLERGY WARNING</h3>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Patient has known allergies: <strong>{selectedOrder.patient?.allergies}</strong>
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Please verify drug compatibility before dispensing
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescription Details */}
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prescription Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600 dark:text-gray-300">Drug:</span> <span className="font-medium ml-2" data-testid="text-drug-name">{selectedOrder.drugName}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-300">Dosage:</span> <span className="font-medium ml-2">{selectedOrder.dosage || 'As prescribed'}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-300">Quantity:</span> <span className="font-medium ml-2" data-testid="text-quantity">{selectedOrder.quantity}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-300">Instructions:</span> <span className="font-medium ml-2">{selectedOrder.instructions || 'Follow prescription'}</span></p>
                </div>
              </div>

              {/* Batch Selection (FEFO) */}
              <div>
                <Label htmlFor="batch" className="text-sm font-medium mb-2 block">
                  Select Batch (First Expiry First Out)
                </Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger id="batch" data-testid="select-batch">
                    <SelectValue placeholder="Select a batch to dispense" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => {
                      const expiryDate = new Date(batch.expiryDate);
                      const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpiringSoon = daysToExpiry < 90;
                      
                      return (
                        <SelectItem key={batch.batchId} value={batch.batchId} data-testid={`batch-option-${batch.batchId}`}>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>Lot: {batch.lotNumber}</span>
                            <span className="text-xs text-gray-500">
                              | Exp: {expiryDate.toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              | Stock: {batch.quantityOnHand}
                            </span>
                            {isExpiringSoon && (
                              <Badge className="bg-amber-500 text-white text-xs">
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
                {batches.length === 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg mt-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">No stock available for this drug</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          Go to <Link href="/pharmacy-inventory" className="underline font-semibold">Pharmacy Inventory</Link> to add this drug and receive stock batches.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  data-testid="button-cancel-dispense"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDispense}
                  disabled={!selectedBatch || dispenseMutation.isPending || batches.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-confirm-dispense"
                >
                  {dispenseMutation.isPending ? "Dispensing..." : "Confirm Dispense"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
