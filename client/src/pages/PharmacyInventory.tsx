import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, AlertTriangle, Clock, TrendingDown, FileText } from "lucide-react";
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
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/stock/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/alerts/low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/ledger'] });
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
      toast({
        title: "Stock Received",
        description: "New stock has been received and added to inventory.",
      });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-600 rounded-xl">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pharmacy Inventory</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage drugs, stock, and inventory</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDrug(true)}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-add-drug"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Drug
          </Button>
          <Button
            onClick={() => setShowReceiveStock(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-receive-stock"
          >
            <Package className="w-4 h-4 mr-2" />
            Receive Stock
          </Button>
        </div>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock" data-testid="tab-stock">📦 Stock Overview</TabsTrigger>
          <TabsTrigger value="catalog" data-testid="tab-catalog">Drug Catalog ({drugs.length})</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            ⚠️ Alerts ({lowStockDrugs.length + expiringDrugs.length})
          </TabsTrigger>
          <TabsTrigger value="ledger" data-testid="tab-ledger">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📦 What is "Stock Overview"?</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This shows <strong>all your drugs at a glance</strong> - how many you have in stock, current selling prices, 
              when they expire, and if any are running low. Use this to quickly check what's available in your pharmacy.
            </p>
          </div>
          <Card>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drugsWithStock.map((drug) => {
                    const stockLevel = drug.stockOnHand;
                    const isLowStock = stockLevel <= drug.reorderLevel;
                    
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
                          <span className={`font-bold ${isLowStock ? "text-red-600" : stockLevel === 0 ? "text-gray-400" : "text-green-600"}`}>
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
                          {isLowStock ? (
                            <Badge variant="destructive">LOW STOCK</Badge>
                          ) : stockLevel === 0 ? (
                            <Badge variant="outline" className="border-gray-400">OUT OF STOCK</Badge>
                          ) : (
                            <Badge className="bg-green-600">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {drugs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No drugs in catalog. Click "Add Drug" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 What is "Drug Catalog"?</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This is your <strong>master list of all drugs</strong> your pharmacy can sell. It shows basic information 
              like drug names, forms (tablet/syrup), and strength. Think of it as your pharmacy's menu of available medicines.
            </p>
          </div>
          <Card>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drugs.map((drug) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {drugs.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No drugs in catalog</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">⚠️ What are "Alerts"?</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This shows <strong>warnings about your drugs</strong>. It tells you when drugs are running low (need to reorder) 
              or will expire soon. Check this regularly to avoid running out of important medicines or selling expired drugs.
            </p>
          </div>
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Low Stock Alerts ({lowStockDrugs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockDrugs.map((drug) => (
                  <div
                    key={drug.id}
                    className="border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg p-4"
                    data-testid={`alert-low-stock-${drug.id}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{drug.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Code: {drug.drugCode} | Strength: {drug.strength || 'N/A'}
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">
                          Stock: {drug.stockOnHand} | Reorder Level: {drug.reorderLevel}
                        </p>
                      </div>
                      <Badge className="bg-red-600 text-white">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        LOW STOCK
                      </Badge>
                    </div>
                  </div>
                ))}
                {lowStockDrugs.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400">No low stock alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expiring Soon Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Expiring Soon (90 days) - ({expiringDrugs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(expiringDrugs) && expiringDrugs.map((batch) => {
                  const expiryDate = new Date(batch.expiryDate);
                  const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isExpired = daysToExpiry < 0;
                  
                  return (
                    <div
                      key={batch.batchId}
                      className={`border rounded-lg p-4 ${
                        isExpired 
                          ? "border-red-500 bg-red-100 dark:bg-red-900/30" 
                          : "border-amber-200 bg-amber-50 dark:bg-amber-900/20"
                      }`}
                      data-testid={`alert-expiring-${batch.batchId}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{batch.drugName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Lot: {batch.lotNumber} | Batch: {batch.batchId}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Stock: {batch.quantityOnHand} | Expiry: {expiryDate.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={isExpired ? "bg-red-600 text-white" : "bg-amber-600 text-white"}>
                          <Clock className="w-3 h-3 mr-1" />
                          {isExpired ? "EXPIRED" : `${daysToExpiry}d`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {(!expiringDrugs || expiringDrugs.length === 0) && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400">No expiring items in the next 90 days</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📝 What is "Transaction History"?</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This shows <strong>every drug movement</strong> in your pharmacy - when you received new stock, when drugs were 
              dispensed to patients, and any adjustments. It's like a logbook that tracks all inventory changes with dates and who did them.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Inventory Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  {ledgerEntries.slice(0, 50).map((entry) => (
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
              {ledgerEntries.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Drug Dialog */}
      <Dialog open={showAddDrug} onOpenChange={setShowAddDrug}>
        <DialogContent data-testid="dialog-add-drug">
          <DialogHeader>
            <DialogTitle>Add New Drug</DialogTitle>
            <DialogDescription>Add a new drug to the catalog (one-time setup)</DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4">
            <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-1">ℹ️ What is "Add Drug"?</h4>
            <p className="text-xs text-green-800 dark:text-green-200">
              This adds the drug to your catalog <strong>once</strong>. You don't set prices or expiry here - 
              those come later when you "Receive Stock" (when you actually buy the drugs).
            </p>
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
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-save-drug"
              >
                {createDrugMutation.isPending ? "Adding..." : "Add Drug"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Stock Dialog */}
      <Dialog open={showReceiveStock} onOpenChange={setShowReceiveStock}>
        <DialogContent data-testid="dialog-receive-stock">
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
            <DialogDescription>Record drugs you just bought/received</DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4">
            <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-1">ℹ️ What is "Receive Stock"?</h4>
            <p className="text-xs text-green-800 dark:text-green-200">
              Use this when you <strong>actually receive/buy drugs</strong>. Each time you buy drugs, they have a new batch 
              with their own expiry date, quantity, and price. This tracks each purchase separately.
            </p>
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
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowReceiveStock(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReceiveStock}
                disabled={receiveStockMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-stock"
              >
                {receiveStockMutation.isPending ? "Receiving..." : "Receive Stock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
