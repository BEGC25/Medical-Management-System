import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, Check, AlertCircle, Search, AlertTriangle, Package, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
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
import PharmacyHelpPanel from "@/components/PharmacyHelpPanel";
import ExpiryIndicator from "@/components/ExpiryIndicator";

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

export default function Pharmacy() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PrescriptionWithPatient | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const { toast } = useToast();

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
  
  // Filter prescriptions by search term
  const filteredPaidOrders = paidPrescriptions.filter((order) => 
    (order.patient?.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.drugName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredUnpaidOrders = unpaidPrescriptions.filter((order) => 
    (order.patient?.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.drugName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDispensedOrders = dispensedPrescriptions.filter((order) => 
    (order.patient?.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.patient?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.drugName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  const isLoading = isLoadingPaid || isLoadingUnpaid || isLoadingDispensed;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3"
        >
          <Pill className="w-8 h-8 animate-pulse text-blue-600" />
          <span className="text-lg text-gray-600 dark:text-gray-300">Loading pharmacy orders...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-24"
    >
      {/* Premium Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-premium-xl"
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg"
            >
              <Pill className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Pharmacy
                <Sparkles className="w-6 h-6" />
              </h1>
              <p className="text-blue-100">Prescription Management & Dispensing</p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm bg-white/10"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </motion.div>
            <Link href="/pharmacy-inventory">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg" 
                  data-testid="button-manage-inventory"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Manage Inventory
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Unified Help Panel */}
      <PharmacyHelpPanel />

      {/* Premium Search Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="border-0 shadow-premium-md overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/30">
          <CardContent className="pt-6">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <Search className="w-5 h-5 text-blue-500" />
              </div>
              <Label htmlFor="search" className="sr-only">Search prescriptions</Label>
              <Input
                id="search"
                placeholder="Search by Patient ID, Name, Order ID, or Drug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 border-2 border-blue-100 dark:border-blue-900 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300"
                data-testid="input-search-prescriptions"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Premium Tabs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Tabs defaultValue="ready" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-900 p-1.5 rounded-xl shadow-premium-md border border-gray-200 dark:border-gray-800 inline-flex">
            <TabsTrigger 
              value="ready" 
              data-testid="tab-ready"
              className="relative rounded-lg px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle className="w-4 h-4" />
                Ready to Dispense 
                <Badge className="ml-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {filteredPaidOrders.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
            <TabsTrigger 
              value="dispensed" 
              data-testid="tab-dispensed"
              className="relative rounded-lg px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Package className="w-4 h-4" />
                Dispensed History 
                <Badge className="ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {filteredDispensedOrders.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
            {filteredUnpaidOrders.length > 0 && (
              <TabsTrigger 
                value="unpaid" 
                data-testid="tab-unpaid"
                className="relative rounded-lg px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="w-4 h-4" />
                  Awaiting Payment 
                  <Badge className="ml-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                    {filteredUnpaidOrders.length}
                  </Badge>
                </motion.div>
              </TabsTrigger>
            )}
          </TabsList>

        {/* Ready to Dispense Tab */}
        <TabsContent value="ready">
          {filteredPaidOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-0 shadow-premium-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="p-12 text-center">
                  <Check className="w-16 h-16 text-green-300 dark:text-green-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">No prescriptions ready to dispense</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">All caught up! 🎉</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredPaidOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <Card 
                    className="relative overflow-hidden border-0 shadow-premium-md hover:shadow-premium-lg transition-all duration-300 bg-gradient-to-br from-green-50 via-white to-emerald-50/50 dark:from-green-950/20 dark:via-gray-900 dark:to-emerald-950/20"
                    data-testid={`order-paid-${order.orderId}`}
                  >
                    {/* Left accent border */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-600" />
                    
                    <CardContent className="p-6 pl-8">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Header with patient info */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Patient avatar placeholder */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                              {order.patient?.firstName?.charAt(0)}{order.patient?.lastName?.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                {order.patient?.firstName} {order.patient?.lastName}
                              </h3>
                            </div>
                            <Badge className="bg-gray-600 text-white shadow-sm">
                              {order.patient?.patientId}
                            </Badge>
                            <Badge className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md">
                              <Check className="w-3 h-3 mr-1" />
                              PAID
                            </Badge>
                            {order.patient?.allergies && order.patient.allergies.trim() !== '' && (
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <Badge className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  ALLERGIES
                                </Badge>
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Prescription details */}
                          <div className="space-y-1.5 text-sm">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Order:</span> {order.orderId} | 
                              <span className="font-medium"> Drug:</span> {order.drugName || <span className="text-red-600 font-semibold">Not specified</span>}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Dosage:</span> {order.dosage || 'As prescribed'}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Quantity:</span> {order.quantity}
                            </p>
                            {order.route && (
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Route:</span> {order.route}
                              </p>
                            )}
                            {order.duration && (
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Duration:</span> {order.duration}
                              </p>
                            )}
                            {order.instructions && (
                              <p className="text-gray-700 dark:text-gray-300 mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                                <span className="font-medium">Instructions:</span> {order.instructions}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Prescribed: {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action button */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => handleDispenseClick(order)}
                            className="bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            data-testid={`button-dispense-${order.orderId}`}
                          >
                            <Pill className="w-4 h-4 mr-2" />
                            Dispense
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Dispensed History Tab */}
        <TabsContent value="dispensed">
          {filteredDispensedOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-0 shadow-premium-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-blue-300 dark:text-blue-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">No dispensed medications yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">History will appear here</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredDispensedOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <Card 
                    className="relative overflow-hidden border-0 shadow-premium-md hover:shadow-premium-lg transition-all duration-300 bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20"
                    data-testid={`order-dispensed-${order.orderId}`}
                  >
                    {/* Left accent border */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600" />
                    
                    <CardContent className="p-6 pl-8">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                              {order.patient?.firstName?.charAt(0)}{order.patient?.lastName?.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                {order.patient?.firstName} {order.patient?.lastName}
                              </h3>
                            </div>
                            <Badge className="bg-gray-600 text-white shadow-sm">
                              {order.patient?.patientId}
                            </Badge>
                            <Badge className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                              <Check className="w-3 h-3 mr-1" />
                              DISPENSED
                            </Badge>
                          </div>
                          
                          {/* Details */}
                          <div className="space-y-1.5 text-sm">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Order:</span> {order.orderId} | 
                              <span className="font-medium"> Drug:</span> {order.drugName}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Dosage:</span> {order.dosage || 'As prescribed'}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Quantity:</span> {order.quantity}
                            </p>
                            {order.route && (
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Route:</span> {order.route}
                              </p>
                            )}
                            {order.duration && (
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Duration:</span> {order.duration}
                              </p>
                            )}
                            {order.instructions && (
                              <p className="text-gray-700 dark:text-gray-300 mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                                <span className="font-medium">Instructions:</span> {order.instructions}
                              </p>
                            )}
                            <div className="flex gap-4 mt-3 text-xs">
                              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Prescribed: {formatDate(order.createdAt)}
                              </p>
                              {order.dispensedAt && (
                                <p className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Dispensed: {formatDateTime(order.dispensedAt)}
                                </p>
                              )}
                            </div>
                            {order.dispensedBy && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                By: {order.dispensedBy}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Unpaid Orders Tab */}
        <TabsContent value="unpaid">
          <div className="space-y-4">
            {filteredUnpaidOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
              >
                <Card 
                  className="relative overflow-hidden border-0 shadow-premium-md hover:shadow-premium-lg transition-all duration-300 bg-gradient-to-br from-orange-50 via-white to-amber-50/50 dark:from-orange-950/20 dark:via-gray-900 dark:to-amber-950/20"
                  data-testid={`order-unpaid-${order.orderId}`}
                >
                  {/* Left accent border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-600" />
                  
                  <CardContent className="p-6 pl-8">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold shadow-md">
                            {order.patient?.firstName?.charAt(0)}{order.patient?.lastName?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {order.patient?.firstName} {order.patient?.lastName}
                            </h3>
                          </div>
                          <Badge className="bg-gray-600 text-white shadow-sm">
                            {order.patient?.patientId}
                          </Badge>
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Badge className="bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md">
                              <Clock className="w-3 h-3 mr-1" />
                              UNPAID
                            </Badge>
                          </motion.div>
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-1.5 text-sm">
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Order:</span> {order.orderId} | 
                            <span className="font-medium"> Drug:</span> {order.drugName || <span className="text-orange-600 font-semibold">Not specified</span>}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Dosage:</span> {order.dosage || 'As prescribed'}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Quantity:</span> {order.quantity}
                          </p>
                          {order.route && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Route:</span> {order.route}
                            </p>
                          )}
                          {order.duration && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Duration:</span> {order.duration}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Prescribed: {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Payment notice */}
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg text-center">
                          <AlertCircle className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">Payment Required</p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">At Reception</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>

      {/* Premium Dispense Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-0 shadow-premium-2xl" data-testid="dialog-dispense">
          <DialogHeader className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-800">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Dispense Medication
            </DialogTitle>
            <DialogDescription className="text-base">
              Select batch and confirm dispensing for <strong className="text-gray-900 dark:text-white">{selectedOrder?.patient?.firstName} {selectedOrder?.patient?.lastName}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* Patient Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {selectedOrder.patient?.firstName?.charAt(0)}{selectedOrder.patient?.lastName?.charAt(0)}
                  </div>
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Patient ID:</span>
                    <Badge className="bg-gray-600 text-white" data-testid="text-patient-id">
                      {selectedOrder.patient?.patientId}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedOrder.patient?.age || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedOrder.patient?.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Allergy Warning with Premium Styling */}
              {hasAllergies && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-2 border-red-500 dark:border-red-600 p-5 rounded-xl shadow-lg" 
                  data-testid="alert-allergies"
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-lg text-red-900 dark:text-red-100 mb-2">⚠️ ALLERGY WARNING</h3>
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                        Patient has known allergies: <strong className="text-red-900 dark:text-red-100">{selectedOrder.patient?.allergies}</strong>
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                        Please verify drug compatibility before dispensing
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Prescription Details Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-blue-600" />
                  Prescription Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Drug:</span>
                    <span className="font-semibold text-gray-900 dark:text-white" data-testid="text-drug-name">{selectedOrder.drugName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.dosage || 'As prescribed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                    <Badge className="bg-blue-600 text-white" data-testid="text-quantity">{selectedOrder.quantity} units</Badge>
                  </div>
                  {selectedOrder.instructions && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">Instructions:</span>
                      <p className="font-medium text-gray-900 dark:text-white italic">{selectedOrder.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Batch Selection with Premium Styling */}
              <div>
                <Label htmlFor="batch" className="text-sm font-semibold mb-3 block text-gray-900 dark:text-white">
                  Select Batch (First Expiry First Out)
                  <span className="ml-2 text-xs text-gray-500">FEFO - Batches sorted by expiry date</span>
                </Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger 
                    id="batch" 
                    data-testid="select-batch"
                    className="h-12 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  >
                    <SelectValue placeholder="Select a batch to dispense" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => {
                      const expiryDate = new Date(batch.expiryDate);
                      const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpiringSoon = daysToExpiry < 90;
                      
                      return (
                        <SelectItem key={batch.batchId} value={batch.batchId} data-testid={`batch-option-${batch.batchId}`}>
                          <div className="flex items-center gap-3 py-1">
                            <Package className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Lot: {batch.lotNumber}</span>
                                <ExpiryIndicator expiryDate={batch.expiryDate} showText={true} showIcon={false} />
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                <span>Stock: <strong className={batch.quantityOnHand > 10 ? "text-green-600" : "text-amber-600"}>{batch.quantityOnHand}</strong> units</span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                {/* Selected Batch Info */}
                {selectedBatch && batches.length > 0 && (() => {
                  const batch = batches.find(b => b.batchId === selectedBatch);
                  if (!batch) return null;
                  
                  const expiryDate = new Date(batch.expiryDate);
                  const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = daysToExpiry < 90;
                  const hasInsufficientStock = selectedOrder.quantity > batch.quantityOnHand;
                  
                  return (
                    <div className={`mt-3 p-3 rounded-lg border ${
                      hasInsufficientStock 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800' 
                        : isExpiringSoon 
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
                    }`}>
                      <h5 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Selected Batch Details</h5>
                      <div className="space-y-1 text-sm">
                        <p className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Lot Number:</span>
                          <span className="font-medium">{batch.lotNumber}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Expiry Date:</span>
                          <span className={`font-medium ${isExpiringSoon ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                            {expiryDate.toLocaleDateString()} {isExpiringSoon && `(${daysToExpiry} days)`}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Available Stock:</span>
                          <span className={`font-medium ${hasInsufficientStock ? 'text-red-700 dark:text-red-400' : ''}`}>
                            {batch.quantityOnHand} units
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Required:</span>
                          <span className="font-medium">{selectedOrder.quantity} units</span>
                        </p>
                      </div>
                      
                      {hasInsufficientStock && (
                        <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-800">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 dark:text-red-300 font-semibold">
                              ⚠️ INSUFFICIENT STOCK: This batch only has {batch.quantityOnHand} units available, 
                              but {selectedOrder.quantity} units are required. Dispensing is blocked.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {isExpiringSoon && !hasInsufficientStock && (
                        <div className="mt-2 pt-2 border-t border-amber-300 dark:border-amber-800">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              This batch expires in less than 90 days. Consider dispensing it first (FEFO principle).
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {batches.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-orange-300 dark:border-orange-700 p-4 rounded-xl mt-3 shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">No stock available for this drug</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          Go to <Link href="/pharmacy-inventory" className="underline font-semibold hover:text-orange-900">Pharmacy Inventory</Link> to add this drug and receive stock batches.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Premium Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrder(null)}
                    data-testid="button-cancel-dispense"
                    className="px-6"
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleConfirmDispense}
                    disabled={
                      !selectedBatch || 
                      dispenseMutation.isPending || 
                      batches.length === 0 ||
                      (selectedBatch && batches.find(b => b.batchId === selectedBatch)?.quantityOnHand < selectedOrder.quantity)
                    }
                    className="px-8 bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                    data-testid="button-confirm-dispense"
                  >
                    {dispenseMutation.isPending ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </motion.div>
                        Dispensing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirm Dispense
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
