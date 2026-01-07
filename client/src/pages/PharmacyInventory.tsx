import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, AlertTriangle, Clock, TrendingDown, FileText, Eye, Edit, Download, BarChart3, ShoppingCart, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Drug, DrugBatch, InventoryLedger } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClinicDayKey } from "@/lib/date-utils";
import PharmacyInventoryHelp from "@/components/PharmacyInventoryHelp";
import { DateFilter, DateFilterPreset } from "@/components/pharmacy/DateFilter";

// Helper function to check if a date is within the filter range
function isDateInRange(dateStr: string | null | undefined, preset: DateFilterPreset, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return true;
  if (preset === "all") return true;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return true;
  
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
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }
  
  return true;
}

// Common drugs list for quick selection
const COMMON_DRUGS = [
  { name: "Paracetamol 500mg", strength: "500mg", form: "tablet" },
  { name: "Amoxicillin 500mg", strength: "500mg", form: "tablet" },
  { name: "Ampicillin 500mg", strength: "500mg", form: "tablet" },
  { name: "Metronidazole 400mg", strength: "400mg", form: "tablet" },
  { name: "Ciprofloxacin 500mg", strength: "500mg", form: "tablet" },
  { name: "Doxycycline 100mg", strength: "100mg", form: "capsule" },
  { name: "Artemether+Lumefantrine (Coartem)", strength: "20mg/120mg", form: "tablet" },
  { name: "Quinine 300mg", strength: "300mg", form: "tablet" },
  { name: "Chloroquine 250mg", strength: "250mg", form: "tablet" },
  { name: "Ibuprofen 400mg", strength: "400mg", form: "tablet" },
  { name: "Diclofenac 50mg", strength: "50mg", form: "tablet" },
  { name: "Omeprazole 20mg", strength: "20mg", form: "capsule" },
  { name: "Albendazole 400mg", strength: "400mg", form: "tablet" },
  { name: "Mebendazole 100mg", strength: "100mg", form: "tablet" },
  { name: "ORS (Oral Rehydration Salts)", strength: "20.5g", form: "other" },
  { name: "Zinc Sulfate 20mg", strength: "20mg", form: "tablet" },
  { name: "Vitamin B Complex", strength: "various", form: "tablet" },
  { name: "Folic Acid 5mg", strength: "5mg", form: "tablet" },
  { name: "Ferrous Sulfate 200mg", strength: "200mg", form: "tablet" },
  { name: "Cotrimoxazole 960mg", strength: "960mg", form: "tablet" },
  { name: "Cough Syrup", strength: "100ml", form: "syrup" },
  { name: "Salbutamol Inhaler", strength: "100mcg", form: "inhaler" },
  { name: "Hydrocortisone Cream 1%", strength: "1%", form: "cream" },
  { name: "Gentian Violet Solution", strength: "0.5%", form: "other" },
  { name: "Eye Drops (Chloramphenicol)", strength: "0.5%", form: "drops" },
].sort((a, b) => a.name.localeCompare(b.name));

export default function PharmacyInventory() {
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [drugSearch, setDrugSearch] = useState("");
  const [showEditDrug, setShowEditDrug] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [showBatchesModal, setShowBatchesModal] = useState(false);
  const [batchesDrug, setBatchesDrug] = useState<Drug | null>(null);
  
  // Help panel state
  const [helpCollapsed, setHelpCollapsed] = useState(() => {
    const saved = localStorage.getItem("pharmacyInventoryHelpCollapsed");
    return saved === "true";
  });
  
  // Transaction history date filter
  const [transactionDateFilter, setTransactionDateFilter] = useState<DateFilterPreset>("all");
  const [transactionStartDate, setTransactionStartDate] = useState<string>();
  const [transactionEndDate, setTransactionEndDate] = useState<string>();
  const [newDrug, setNewDrug] = useState({
    name: "",
    genericName: "",
    category: "",
    unitOfMeasure: "tablet",
    form: "tablet" as "tablet" | "capsule" | "syrup" | "injection" | "cream" | "ointment" | "drops" | "inhaler" | "other",
    strength: "",
    reorderLevel: 10,
  });
  const [newBatch, setNewBatch] = useState({
    drugId: 0,
    lotNumber: "",
    expiryDate: "",
    quantityOnHand: 0,
    unitsPerCarton: 0,
    cartonsReceived: 0,
    unitCost: 0,
    supplier: "",
    receivedBy: "Pharmacist",
    receivedAt: getClinicDayKey(),
  });
  const { toast } = useToast();

  // Persist help collapsed state
  useEffect(() => {
    localStorage.setItem("pharmacyInventoryHelpCollapsed", String(helpCollapsed));
  }, [helpCollapsed]);

  // Fetch drugs
  const { data: drugs = [] } = useQuery<Drug[]>({
    queryKey: ['/api/pharmacy/drugs'],
  });

  // Fetch all drugs with stock levels for Stock Overview
  const { data: drugsWithStock = [] } = useQuery<(Drug & { stockOnHand: number })[]>({
    queryKey: ['/api/pharmacy/stock/all'],
  });

  // Fetch low stock alerts
  const { data: lowStockDrugs = [] } = useQuery<(Drug & { stockOnHand: number })[]>({
    queryKey: ['/api/pharmacy/alerts/low-stock'],
  });

  // Fetch expiring drugs
  const { data: expiringDrugs = [] } = useQuery<(DrugBatch & { drugName: string })[]>({
    queryKey: ['/api/pharmacy/alerts/expiring'],
    queryFn: async () => {
      const response = await fetch('/api/pharmacy/alerts/expiring?days=90');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch inventory ledger
  const { data: ledgerEntries = [] } = useQuery<InventoryLedger[]>({
    queryKey: ['/api/pharmacy/ledger'],
  });

  // Fetch all batches to get pricing info
  const { data: allBatches = [] } = useQuery<DrugBatch[]>({
    queryKey: ['/api/pharmacy/batches'],
  });

  // Create drug mutation
  const createDrugMutation = useMutation({
    mutationFn: async (data: typeof newDrug) => {
      const response = await apiRequest('POST', '/api/pharmacy/drugs', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/drugs'] });
      setShowAddDrug(false);
      setNewDrug({
        name: "",
        genericName: "",
        category: "",
        unitOfMeasure: "tablet",
        form: "tablet" as "tablet" | "capsule" | "syrup" | "injection" | "cream" | "ointment" | "drops" | "inhaler" | "other",
        strength: "",
        reorderLevel: 10,
      });
      toast({
        title: "Drug Added",
        description: "New drug has been added to the catalog.",
      });
    },
  });

  // Receive stock mutation
  const receiveStockMutation = useMutation({
    mutationFn: async (data: typeof newBatch) => {
      const response = await apiRequest('POST', '/api/pharmacy/batches', {
        ...data,
        receivedAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      const drug = drugs.find(d => d.id === newBatch.drugId);
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/stock/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/alerts/low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/ledger'] });
      
      toast({
        title: "✅ Stock Received Successfully",
        description: drug 
          ? `${drug.name}: ${newBatch.quantityOnHand} units received (Expires: ${new Date(newBatch.expiryDate).toLocaleDateString()})` 
          : "New stock has been received and added to inventory.",
      });
      
      setShowReceiveStock(false);
      setNewBatch({
        drugId: 0,
        lotNumber: "",
        expiryDate: "",
        quantityOnHand: 0,
        unitsPerCarton: 0,
        cartonsReceived: 0,
        unitCost: 0,
        supplier: "",
        receivedBy: "Pharmacist",
        receivedAt: "",
      });
      setSelectedDrug(null);
    },
  });

  const handleAddDrug = () => {
    if (!newDrug.name || !newDrug.unitOfMeasure) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in required fields",
      });
      return;
    }
    createDrugMutation.mutate(newDrug);
  };

  const handleReceiveStock = () => {
    if (!newBatch.drugId || !newBatch.expiryDate || newBatch.quantityOnHand <= 0 || newBatch.unitCost <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields (Drug, Expiry Date, Quantity, Unit Cost)",
      });
      return;
    }
    receiveStockMutation.mutate(newBatch);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${helpCollapsed ? 'pr-0' : 'pr-96'}`}>
      {/* Right-side help panel - rendered as a fixed sidebar */}
      <PharmacyInventoryHelp collapsed={helpCollapsed} onCollapsedChange={setHelpCollapsed} />

      {/* Main content */}
      <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-premium-md 
                        hover:shadow-premium-lg transition-all duration-200 hover:scale-105">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pharmacy Inventory</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage drugs, stock, and inventory</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDrug(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                     shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105"
            data-testid="button-add-drug"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Drug
          </Button>
          <Button
            onClick={() => setShowReceiveStock(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                     shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105"
            data-testid="button-receive-stock"
          >
            <Package className="w-4 h-4 mr-2" />
            Receive Stock
          </Button>
        </div>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner-premium">
          <TabsTrigger 
            value="stock" 
            data-testid="tab-stock"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 
                     data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200
                     data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
          >
            <Package className="w-4 h-4 mr-2" />
            Stock Overview
          </TabsTrigger>
          <TabsTrigger 
            value="catalog" 
            data-testid="tab-catalog"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 
                     data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200
                     data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
          >
            <Archive className="w-4 h-4 mr-2" />
            Drug Catalog ({drugs.length})
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            data-testid="tab-alerts"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 
                     data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200
                     data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Alerts ({lowStockDrugs.length + expiringDrugs.length})
          </TabsTrigger>
          <TabsTrigger 
            value="ledger" 
            data-testid="tab-ledger"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 
                     data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200
                     data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-400"
          >
            <FileText className="w-4 h-4 mr-2" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Premium Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Drugs */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:-translate-y-0.5
                           border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Drugs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{drugs.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-premium-sm">
                    <Archive className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Count */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:-translate-y-0.5
                           border-red-200 dark:border-red-800/50 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Low Stock</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{lowStockDrugs.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl shadow-premium-sm">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:-translate-y-0.5
                           border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Expiring Soon</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{expiringDrugs.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-premium-sm">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Inventory Value */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:-translate-y-0.5
                           border-green-200 dark:border-green-800/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {(() => {
                        const totalValue = allBatches.reduce((sum, batch) => {
                          return sum + (batch.quantityOnHand * batch.unitCost);
                        }, 0);
                        return Math.round(totalValue).toLocaleString();
                      })()} SSP
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-premium-sm">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-premium-md border-gray-200 dark:border-gray-700 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <CardTitle>Current Stock & Prices</CardTitle>
              <CardDescription>See all drugs, quantities in stock, and current prices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead className="text-right">Stock on Hand</TableHead>
                    <TableHead className="text-right">Current Price (SSP)</TableHead>
                    <TableHead>Nearest Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drugsWithStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 
                                        rounded-2xl shadow-premium-sm">
                            <Package className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Drugs in Inventory</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                              Get started by adding drugs to your catalog and receiving stock.
                            </p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              onClick={() => setShowAddDrug(true)}
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Drug
                            </Button>
                            <Button
                              onClick={() => setShowReceiveStock(true)}
                              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Receive Stock
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    drugsWithStock.map((drug) => {
                    const stockLevel = drug.stockOnHand;
                    const isOutOfStock = stockLevel === 0;
                    const isLowStock = stockLevel > 0 && stockLevel <= drug.reorderLevel;
                    
                    // Find most recent batch with stock to get current price
                    const drugBatches = allBatches
                      .filter(b => b.drugId === drug.id && b.quantityOnHand > 0)
                      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
                    const currentPrice = drugBatches[0]?.unitCost;
                    
                    // Find nearest expiry date
                    const nearestExpiry = allBatches
                      .filter(b => b.drugId === drug.id && b.quantityOnHand > 0)
                      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0]?.expiryDate;
                    
                    return (
                      <TableRow key={drug.id} className={isLowStock ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        <TableCell className="font-semibold">{drug.name}</TableCell>
                        <TableCell>{drug.strength || '-'}</TableCell>
                        <TableCell className="capitalize">{drug.form}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${isOutOfStock ? "text-gray-400" : isLowStock ? "text-red-600" : "text-green-600"}`}>
                            {stockLevel}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {currentPrice ? `${Math.round(currentPrice).toLocaleString()} SSP` : '-'}
                        </TableCell>
                        <TableCell>
                          {nearestExpiry || '-'}
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <Badge variant="outline" className="border-gray-400">OUT OF STOCK</Badge>
                          ) : isLowStock ? (
                            <Badge variant="destructive">LOW STOCK</Badge>
                          ) : (
                            <Badge className="bg-green-600">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDrug(drug);
                                setNewBatch({ ...newBatch, drugId: drug.id });
                                setShowReceiveStock(true);
                              }}
                              className="h-8 px-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                                       hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Receive Stock"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setBatchesDrug(drug);
                                setShowBatchesModal(true);
                              }}
                              className="h-8 px-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
                                       hover:bg-gray-50 dark:hover:bg-gray-800"
                              title="View Batches"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <Card className="shadow-premium-md border-gray-200 dark:border-gray-700 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <CardTitle>Drug Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Generic Name</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drugs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 
                                        rounded-2xl shadow-premium-sm">
                            <Archive className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Drugs in Catalog</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                              Start by adding drugs to your catalog. Click "Add Drug" to get started.
                            </p>
                          </div>
                          <Button
                            onClick={() => setShowAddDrug(true)}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 mt-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Drug
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    drugs.map((drug) => (
                    <TableRow key={drug.id} data-testid={`drug-row-${drug.id}`}>
                      <TableCell className="font-medium">{drug.drugCode}</TableCell>
                      <TableCell>{drug.name}</TableCell>
                      <TableCell>{drug.genericName || '-'}</TableCell>
                      <TableCell>{drug.strength || '-'}</TableCell>
                      <TableCell className="capitalize">{drug.form}</TableCell>
                      <TableCell>{drug.reorderLevel}</TableCell>
                      <TableCell>
                        <Badge className={drug.isActive ? "bg-green-600" : "bg-gray-600"}>
                          {drug.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDrug(drug);
                              setShowEditDrug(true);
                            }}
                            className="h-8 px-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400
                                     hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            title="Edit Drug"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDrug(drug);
                              setNewBatch({ ...newBatch, drugId: drug.id });
                              setShowReceiveStock(true);
                            }}
                            className="h-8 px-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                                     hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Receive Stock"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBatchesDrug(drug);
                              setShowBatchesModal(true);
                            }}
                            className="h-8 px-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
                                     hover:bg-gray-50 dark:hover:bg-gray-800"
                            title="View Batches"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Low Stock Alerts */}
          <Card className="shadow-premium-md border-red-200 dark:border-red-800/50 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Low Stock Alerts ({lowStockDrugs?.length || 0})
              </CardTitle>
              <CardDescription>Drugs below reorder level - take action now</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockDrugs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 
                                  rounded-2xl shadow-premium-sm">
                      <Package className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Stock Levels Good!</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No drugs are currently below reorder level.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="space-y-3">
                {lowStockDrugs.map((drug) => (
                  <div
                    key={drug.id}
                    className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 
                             rounded-lg p-4 shadow-premium-sm hover:shadow-premium-md transition-all duration-200"
                    data-testid={`alert-low-stock-${drug.id}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{drug.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Code: {drug.drugCode} | Strength: {drug.strength || 'N/A'}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                            <span className="font-bold text-red-600 dark:text-red-400 text-base">
                              {drug.stockOnHand}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Reorder Level:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {drug.reorderLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className="bg-red-600 text-white shadow-premium-sm"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          LOW STOCK
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDrug(drug);
                            setNewBatch({ ...newBatch, drugId: drug.id });
                            setShowReceiveStock(true);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                                   shadow-premium-sm hover:shadow-premium-md transition-all duration-200"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                          Receive Stock
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>

          {/* Expiring Soon Alerts */}
          <Card className="shadow-premium-md border-amber-200 dark:border-amber-800/50 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Expiring Soon (90 days) - ({expiringDrugs?.length || 0})
              </CardTitle>
              <CardDescription>Priority: use these batches first (FEFO)</CardDescription>
            </CardHeader>
            <CardContent>
              {(!expiringDrugs || expiringDrugs.length === 0) ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 
                                  rounded-2xl shadow-premium-sm">
                      <Clock className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Expiring Items</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No batches expiring in the next 90 days.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="space-y-3">
                {Array.isArray(expiringDrugs) && expiringDrugs.map((batch) => {
                  const expiryDate = new Date(batch.expiryDate);
                  const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isExpired = daysToExpiry < 0;
                  
                  return (
                    <div
                      key={batch.batchId}
                      className={`border-2 rounded-lg p-4 shadow-premium-sm hover:shadow-premium-md transition-all duration-200 ${
                        isExpired 
                          ? "border-red-500 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30" 
                          : "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
                      }`}
                      data-testid={`alert-expiring-${batch.batchId}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{batch.drugName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Lot: {batch.lotNumber} | Batch ID: {batch.batchId}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                              <span className="ml-2 font-semibold text-gray-900 dark:text-white">{batch.quantityOnHand}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Expiry:</span>
                              <span className={`ml-2 font-semibold ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {expiryDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${isExpired ? "bg-red-600" : "bg-amber-600"} text-white shadow-premium-sm`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {isExpired ? "EXPIRED" : `${daysToExpiry}d`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          {/* Date Filter */}
          <DateFilter 
            onFilterChange={(preset, start, end) => {
              setTransactionDateFilter(preset);
              setTransactionStartDate(start);
              setTransactionEndDate(end);
            }}
            defaultPreset="all"
          />
          
          <Card className="shadow-premium-md border-gray-200 dark:border-gray-700 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Inventory Transaction History
                  </CardTitle>
                  <CardDescription>Complete log of all inventory movements</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // CSV export functionality
                    const csvData = ledgerEntries.map(entry => ({
                      'Transaction ID': entry.transactionId,
                      'Type': entry.transactionType,
                      'Quantity': entry.quantity,
                      'Value (SSP)': Math.round(entry.totalValue || 0),
                      'Performed By': entry.performedBy,
                      'Date': new Date(entry.createdAt).toLocaleDateString()
                    }));
                    const csv = [
                      Object.keys(csvData[0] || {}).join(','),
                      ...csvData.map(row => Object.values(row).join(','))
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `inventory-transactions-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                  className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                           hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredLedger = ledgerEntries.filter(entry => 
                  isDateInRange(entry.createdAt, transactionDateFilter, transactionStartDate, transactionEndDate)
                );
                
                return filteredLedger.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 
                                    rounded-2xl shadow-premium-sm">
                        <FileText className="w-16 h-16 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Transactions Found</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md">
                          {ledgerEntries.length === 0 
                            ? "No transactions recorded yet. Start by receiving stock."
                            : "No transactions match the selected date range. Try adjusting the filter."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLedger.map((entry) => (
                    <TableRow key={entry.id} data-testid={`ledger-${entry.transactionId}`}>
                      <TableCell className="font-medium">{entry.transactionId}</TableCell>
                      <TableCell>
                        <Badge className={entry.transactionType === 'receive' ? "bg-green-600" : "bg-blue-600"}>
                          {entry.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className={entry.quantity < 0 ? "text-red-600" : "text-green-600"}>
                        {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                      </TableCell>
                      <TableCell>SSP {Math.round(entry.totalValue || 0).toLocaleString()}</TableCell>
                      <TableCell>{entry.performedBy}</TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Drug Dialog - Modernized */}
      <Dialog open={showAddDrug} onOpenChange={setShowAddDrug}>
        <DialogContent className="max-w-2xl shadow-premium-2xl" data-testid="dialog-add-drug">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-premium-md">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Add New Drug</DialogTitle>
                <DialogDescription>Add a new drug to the catalog (one-time setup)</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                        p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-premium-sm">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg mt-0.5">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">ℹ️ What is "Add Drug"?</h4>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  This adds the drug to your catalog <strong>once</strong>. You don't set prices or expiry here - 
                  those come later when you "Receive Stock" (when you actually buy the drugs).
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {/* Quick Select from Common Drugs */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Label htmlFor="commonDrug">Quick Select (Common Drugs)</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  const drug = COMMON_DRUGS.find(d => d.name === value);
                  if (drug) {
                    setNewDrug({
                      ...newDrug,
                      name: drug.name,
                      strength: drug.strength,
                      form: drug.form as any,
                      unitOfMeasure: drug.form,
                    });
                  }
                }}
              >
                <SelectTrigger id="commonDrug" data-testid="select-common-drug">
                  <SelectValue placeholder="Select from common drugs list..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_DRUGS.map((drug) => (
                    <SelectItem key={drug.name} value={drug.name}>
                      {drug.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Or type custom drug name below
              </p>
            </div>

            <div>
              <Label htmlFor="name">Drug Name *</Label>
              <Input
                id="name"
                value={newDrug.name}
                onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                placeholder="Type custom drug name or select above"
                data-testid="input-drug-name"
              />
              <p className="text-xs text-gray-500 mt-1">What the drug is called</p>
            </div>
            <div>
              <Label htmlFor="genericName">Generic Name (Optional)</Label>
              <Input
                id="genericName"
                value={newDrug.genericName}
                onChange={(e) => setNewDrug({ ...newDrug, genericName: e.target.value })}
                placeholder="e.g., Acetaminophen"
                data-testid="input-generic-name"
              />
              <p className="text-xs text-gray-500 mt-1">Scientific/chemical name (optional)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="strength">Strength</Label>
                <Input
                  id="strength"
                  value={newDrug.strength}
                  onChange={(e) => setNewDrug({ ...newDrug, strength: e.target.value })}
                  placeholder="e.g., 500mg"
                  data-testid="input-strength"
                />
                <p className="text-xs text-gray-500 mt-1">How strong (500mg, 10ml, etc.)</p>
              </div>
              <div>
                <Label htmlFor="form">Form</Label>
                <Select
                  value={newDrug.form}
                  onValueChange={(value: any) => setNewDrug({ ...newDrug, form: value })}
                >
                  <SelectTrigger id="form" data-testid="select-form">
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="capsule">Capsule</SelectItem>
                    <SelectItem value="syrup">Syrup</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="cream">Cream</SelectItem>
                    <SelectItem value="ointment">Ointment</SelectItem>
                    <SelectItem value="drops">Drops</SelectItem>
                    <SelectItem value="inhaler">Inhaler</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newDrug.category}
                  onChange={(e) => setNewDrug({ ...newDrug, category: e.target.value })}
                  placeholder="e.g., Analgesic"
                  data-testid="input-category"
                />
              </div>
              <div>
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={newDrug.reorderLevel}
                  onChange={(e) => setNewDrug({ ...newDrug, reorderLevel: parseInt(e.target.value) || 10 })}
                  data-testid="input-reorder-level"
                />
                <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDrug(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddDrug}
                disabled={createDrugMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                         shadow-premium-md hover:shadow-premium-lg transition-all duration-200"
                data-testid="button-save-drug"
              >
                {createDrugMutation.isPending ? "Adding..." : "Add Drug"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Stock Dialog - Modernized */}
      <Dialog open={showReceiveStock} onOpenChange={setShowReceiveStock}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-premium-2xl" data-testid="dialog-receive-stock">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-premium-md">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Receive Stock</DialogTitle>
                <DialogDescription>Record drugs you just bought/received</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 
                        p-4 rounded-xl border border-green-200 dark:border-green-800 shadow-premium-sm">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-green-600 rounded-lg mt-0.5">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-1">ℹ️ What is "Receive Stock"?</h4>
                <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                  Use this when you <strong>actually receive/buy drugs</strong>. Each time you buy drugs, they have a new batch 
                  with their own expiry date, quantity, and price. This tracks each purchase separately.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="drug">Select Drug *</Label>
              <Select
                value={newBatch.drugId.toString()}
                onValueChange={(value) => setNewBatch({ ...newBatch, drugId: parseInt(value) })}
              >
                <SelectTrigger id="drug" data-testid="select-drug">
                  <SelectValue placeholder="Select a drug" />
                </SelectTrigger>
                <SelectContent>
                  {drugs.map((drug) => (
                    <SelectItem key={drug.id} value={drug.id.toString()}>
                      {drug.name} - {drug.strength || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Which drug did you receive?</p>
            </div>
            
            {/* Drug Context Display */}
            {newBatch.drugId > 0 && (() => {
              const drug = drugs.find(d => d.id === newBatch.drugId);
              const drugWithStock = drugsWithStock.find(d => d.id === newBatch.drugId);
              const drugBatches = allBatches.filter(b => b.drugId === newBatch.drugId && b.quantityOnHand > 0);
              const latestBatch = drugBatches.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())[0];
              const nearestExpiry = drugBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
              
              return drug ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                              p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-premium-sm">
                  <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Drug Information
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {drugWithStock?.stockOnHand || 0}
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Reorder Level:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {drug.reorderLevel}
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Nearest Expiry:</span>
                      <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                        {nearestExpiry ? new Date(nearestExpiry.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Last Unit Cost:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        {latestBatch ? `${Math.round(latestBatch.unitCost)} SSP` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lotNumber">Lot Number (Optional)</Label>
                <Input
                  id="lotNumber"
                  value={newBatch.lotNumber}
                  onChange={(e) => setNewBatch({ ...newBatch, lotNumber: e.target.value })}
                  placeholder="e.g., LOT12345"
                  data-testid="input-lot-number"
                />
                <p className="text-xs text-gray-500 mt-1">Batch number from box (optional)</p>
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newBatch.expiryDate}
                  onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                  data-testid="input-expiry-date"
                />
                <p className="text-xs text-gray-500 mt-1">When these drugs expire</p>
              </div>
            </div>

            {/* Bulk Quantity Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Bulk Purchase (Optional)</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">If you bought in cartons/boxes, fill this to auto-calculate total quantity</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="unitsPerCarton" className="text-xs">Units per Carton</Label>
                  <Input
                    id="unitsPerCarton"
                    type="number"
                    value={newBatch.unitsPerCarton || ''}
                    onChange={(e) => {
                      const units = parseInt(e.target.value) || 0;
                      const cartons = newBatch.cartonsReceived || 0;
                      setNewBatch({ 
                        ...newBatch, 
                        unitsPerCarton: units,
                        quantityOnHand: units > 0 && cartons > 0 ? units * cartons : newBatch.quantityOnHand 
                      });
                    }}
                    placeholder="e.g., 100"
                    data-testid="input-units-per-carton"
                  />
                </div>
                <div>
                  <Label htmlFor="cartonsReceived" className="text-xs">Cartons Received</Label>
                  <Input
                    id="cartonsReceived"
                    type="number"
                    value={newBatch.cartonsReceived || ''}
                    onChange={(e) => {
                      const cartons = parseInt(e.target.value) || 0;
                      const units = newBatch.unitsPerCarton || 0;
                      setNewBatch({ 
                        ...newBatch, 
                        cartonsReceived: cartons,
                        quantityOnHand: units > 0 && cartons > 0 ? units * cartons : newBatch.quantityOnHand 
                      });
                    }}
                    placeholder="e.g., 5"
                    data-testid="input-cartons-received"
                  />
                </div>
                <div>
                  <Label htmlFor="autoQuantity" className="text-xs">Total Quantity</Label>
                  <Input
                    id="autoQuantity"
                    type="number"
                    value={(newBatch.unitsPerCarton && newBatch.cartonsReceived) ? (newBatch.unitsPerCarton * newBatch.cartonsReceived) : newBatch.quantityOnHand}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                    data-testid="display-auto-quantity"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 Use bulk fields for carton purchases OR enter manual quantity below (entering one clears the other).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Manual Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newBatch.quantityOnHand}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0;
                    setNewBatch({ 
                      ...newBatch, 
                      quantityOnHand: qty,
                      unitsPerCarton: 0,
                      cartonsReceived: 0
                    });
                  }}
                  placeholder="Enter quantity"
                  data-testid="input-quantity"
                />
                <p className="text-xs text-gray-500 mt-1">How many tablets/bottles you got</p>
              </div>
              <div>
                <Label htmlFor="unitCost">Unit Cost (SSP) *</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={newBatch.unitCost}
                  onChange={(e) => setNewBatch({ ...newBatch, unitCost: parseFloat(e.target.value) || 0 })}
                  placeholder="Cost per unit"
                  data-testid="input-unit-cost"
                />
                <p className="text-xs text-gray-500 mt-1">Price per one tablet/bottle</p>
              </div>
            </div>

            <div>
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Input
                id="supplier"
                value={newBatch.supplier}
                onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })}
                placeholder="Supplier name"
                data-testid="input-supplier"
              />
              <p className="text-xs text-gray-500 mt-1">Where you bought from (optional)</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowReceiveStock(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReceiveStock}
                disabled={
                  receiveStockMutation.isPending ||
                  !newBatch.drugId ||
                  !newBatch.expiryDate ||
                  newBatch.quantityOnHand <= 0 ||
                  newBatch.unitCost <= 0
                }
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500
                         shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105
                         disabled:hover:scale-100 disabled:hover:shadow-premium-md"
                data-testid="button-save-stock"
              >
                {receiveStockMutation.isPending ? "Receiving..." : "Receive Stock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
