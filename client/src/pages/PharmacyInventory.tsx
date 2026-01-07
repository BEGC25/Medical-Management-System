import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Plus, AlertTriangle, Clock, TrendingDown, FileText, Eye, Edit, Download, BarChart3, ShoppingCart, Archive, HelpCircle, Filter as FilterIcon } from "lucide-react";
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
import { FilterBar, FilterConfig, ActiveFilter } from "@/components/pharmacy/FilterBar";
import { BulkActionBar, getStockBulkActions, getCatalogBulkActions } from "@/components/pharmacy/BulkActionBar";
import { QuickAdjustModal } from "@/components/pharmacy/QuickAdjustModal";
import { ExportModal, ExportColumn } from "@/components/pharmacy/ExportModal";
import { AnalyticsDashboard } from "@/components/pharmacy/AnalyticsDashboard";
import { exportData } from "@/lib/export-utils";

// Constants
const DEFAULT_REORDER_LEVEL = 10;
const EXPIRY_WARNING_DAYS = 90;

// Drug form types
type DrugForm = "tablet" | "capsule" | "syrup" | "injection" | "cream" | "ointment" | "drops" | "inhaler" | "other";

/**
 * Helper function to check if a date is within the specified filter range
 * @param dateStr - The date string to check (can be null/undefined)
 * @param preset - The date filter preset (all, today, last7days, last30days, custom)
 * @param startDate - Start date for custom range (optional)
 * @param endDate - End date for custom range (optional)
 * @returns true if the date is within the filter range, false otherwise
 */
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
  
  // Bulk action states
  const [selectedStockItems, setSelectedStockItems] = useState<Set<number>>(new Set());
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<Set<number>>(new Set());
  
  // Filter states
  const [stockFilters, setStockFilters] = useState<ActiveFilter[]>([]);
  const [catalogFilters, setCatalogFilters] = useState<ActiveFilter[]>([]);
  
  // Modal states
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);
  const [quickAdjustDrug, setQuickAdjustDrug] = useState<(Drug & { stockOnHand: number }) | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportContext, setExportContext] = useState<"stock" | "catalog" | "ledger">("stock");
  
  const [newDrug, setNewDrug] = useState({
    name: "",
    genericName: "",
    category: "",
    unitOfMeasure: "tablet",
    form: "tablet" as DrugForm,
    strength: "",
    reorderLevel: DEFAULT_REORDER_LEVEL,
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
      const response = await fetch(`/api/pharmacy/alerts/expiring?days=${EXPIRY_WARNING_DAYS}`);
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
        form: "tablet" as DrugForm,
        strength: "",
        reorderLevel: DEFAULT_REORDER_LEVEL,
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

  // Filter ledger entries based on date filter
  const filteredLedgerEntries = useMemo(() => {
    return ledgerEntries.filter(entry => 
      isDateInRange(entry.createdAt, transactionDateFilter, transactionStartDate, transactionEndDate)
    );
  }, [ledgerEntries, transactionDateFilter, transactionStartDate, transactionEndDate]);

  // Filter drugs with stock based on filters
  const filteredStockDrugs = useMemo(() => {
    let filtered = [...drugsWithStock];
    
    stockFilters.forEach((filter) => {
      switch (filter.id) {
        case "status":
          if (filter.value === "in_stock") {
            filtered = filtered.filter(d => d.stockOnHand > d.reorderLevel);
          } else if (filter.value === "low_stock") {
            filtered = filtered.filter(d => d.stockOnHand > 0 && d.stockOnHand <= d.reorderLevel);
          } else if (filter.value === "out_of_stock") {
            filtered = filtered.filter(d => d.stockOnHand === 0);
          }
          break;
        case "form":
          if (filter.value) {
            filtered = filtered.filter(d => d.form === filter.value);
          }
          break;
        case "stock_range":
          const stockRange = filter.value as { min?: string; max?: string };
          if (stockRange.min) {
            filtered = filtered.filter(d => d.stockOnHand >= parseInt(stockRange.min!));
          }
          if (stockRange.max) {
            filtered = filtered.filter(d => d.stockOnHand <= parseInt(stockRange.max!));
          }
          break;
      }
    });
    
    return filtered;
  }, [drugsWithStock, stockFilters]);

  // Filter catalog drugs based on filters
  const filteredCatalogDrugs = useMemo(() => {
    let filtered = [...drugs];
    
    catalogFilters.forEach((filter) => {
      switch (filter.id) {
        case "status":
          if (filter.value === "active") {
            filtered = filtered.filter(d => d.isActive === 1);
          } else if (filter.value === "inactive") {
            filtered = filtered.filter(d => d.isActive === 0);
          }
          break;
        case "form":
          if (filter.value) {
            filtered = filtered.filter(d => d.form === filter.value);
          }
          break;
      }
    });
    
    return filtered;
  }, [drugs, catalogFilters]);

  // Bulk action handlers
  const handleSelectAllStock = () => {
    if (selectedStockItems.size === filteredStockDrugs.length) {
      setSelectedStockItems(new Set());
    } else {
      setSelectedStockItems(new Set(filteredStockDrugs.map(d => d.id)));
    }
  };

  const handleSelectAllCatalog = () => {
    if (selectedCatalogItems.size === filteredCatalogDrugs.length) {
      setSelectedCatalogItems(new Set());
    } else {
      setSelectedCatalogItems(new Set(filteredCatalogDrugs.map(d => d.id)));
    }
  };

  const handleSelectLowStock = () => {
    const lowStockIds = drugsWithStock
      .filter(d => d.stockOnHand > 0 && d.stockOnHand <= d.reorderLevel)
      .map(d => d.id);
    setSelectedStockItems(new Set(lowStockIds));
  };

  const handleSelectOutOfStock = () => {
    const outOfStockIds = drugsWithStock
      .filter(d => d.stockOnHand === 0)
      .map(d => d.id);
    setSelectedStockItems(new Set(outOfStockIds));
  };

  const handleStockFilterChange = (filterId: string, value: any) => {
    if (!value || value === "") {
      setStockFilters(stockFilters.filter(f => f.id !== filterId));
      return;
    }

    const existingIndex = stockFilters.findIndex(f => f.id === filterId);
    let display = String(value);
    
    // Format display based on filter type
    if (filterId === "stock_range" && typeof value === "object") {
      const range = value as { min?: string; max?: string };
      if (range.min && range.max) {
        display = `${range.min} - ${range.max}`;
      } else if (range.min) {
        display = `≥ ${range.min}`;
      } else if (range.max) {
        display = `≤ ${range.max}`;
      }
    }

    const newFilter: ActiveFilter = {
      id: filterId,
      label: getFilterLabel(filterId),
      value,
      display,
    };

    if (existingIndex >= 0) {
      const updated = [...stockFilters];
      updated[existingIndex] = newFilter;
      setStockFilters(updated);
    } else {
      setStockFilters([...stockFilters, newFilter]);
    }
  };

  const handleCatalogFilterChange = (filterId: string, value: any) => {
    if (!value || value === "") {
      setCatalogFilters(catalogFilters.filter(f => f.id !== filterId));
      return;
    }

    const existingIndex = catalogFilters.findIndex(f => f.id === filterId);
    const newFilter: ActiveFilter = {
      id: filterId,
      label: getFilterLabel(filterId),
      value,
      display: String(value),
    };

    if (existingIndex >= 0) {
      const updated = [...catalogFilters];
      updated[existingIndex] = newFilter;
      setCatalogFilters(updated);
    } else {
      setCatalogFilters([...catalogFilters, newFilter]);
    }
  };

  const getFilterLabel = (filterId: string): string => {
    const labels: Record<string, string> = {
      status: "Status",
      form: "Form",
      stock_range: "Stock Range",
    };
    return labels[filterId] || filterId;
  };

  const getStockFilters = (): FilterConfig[] => [
    {
      id: "form",
      label: "Form",
      type: "select",
      options: [
        { value: "tablet", label: "Tablet" },
        { value: "capsule", label: "Capsule" },
        { value: "syrup", label: "Syrup" },
        { value: "injection", label: "Injection" },
        { value: "cream", label: "Cream" },
        { value: "ointment", label: "Ointment" },
        { value: "drops", label: "Drops" },
        { value: "inhaler", label: "Inhaler" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "in_stock", label: "In Stock" },
        { value: "low_stock", label: "Low Stock" },
        { value: "out_of_stock", label: "Out of Stock" },
      ],
    },
    {
      id: "stock_range",
      label: "Stock Level Range",
      type: "range",
    },
  ];

  const getCatalogFilters = (): FilterConfig[] => [
    {
      id: "form",
      label: "Form",
      type: "select",
      options: [
        { value: "tablet", label: "Tablet" },
        { value: "capsule", label: "Capsule" },
        { value: "syrup", label: "Syrup" },
        { value: "injection", label: "Injection" },
        { value: "cream", label: "Cream" },
        { value: "ointment", label: "Ointment" },
        { value: "drops", label: "Drops" },
        { value: "inhaler", label: "Inhaler" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const handleQuickAdjust = (adjustment: {
    drugId: number;
    type: "receive" | "dispense" | "adjust";
    quantity: number;
    reason?: string;
  }) => {
    // TODO: Implement API call for quick adjustment
    toast({
      title: "Stock Adjusted",
      description: `${adjustment.type === "receive" ? "Added" : "Removed"} ${adjustment.quantity} units`,
    });
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/stock/all'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/ledger'] });
  };

  const handleExport = (options: {
    format: "csv" | "excel" | "pdf";
    scope: "current" | "all" | "selected";
    columns: string[];
    filename: string;
  }) => {
    let data: any[] = [];
    let columnLabels: Record<string, string> = {};

    if (exportContext === "stock") {
      data = filteredStockDrugs.map(drug => {
        const drugBatches = allBatches
          .filter(b => b.drugId === drug.id && b.quantityOnHand > 0)
          .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
        const currentPrice = drugBatches[0]?.unitCost;
        const nearestExpiry = allBatches
          .filter(b => b.drugId === drug.id && b.quantityOnHand > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0]?.expiryDate;

        return {
          name: drug.name,
          strength: drug.strength || "-",
          form: drug.form,
          stockOnHand: drug.stockOnHand,
          currentPrice: currentPrice ? Math.round(currentPrice) : "-",
          nearestExpiry: nearestExpiry ? new Date(nearestExpiry).toLocaleDateString() : "-",
          status: drug.stockOnHand === 0 ? "OUT OF STOCK" : drug.stockOnHand <= drug.reorderLevel ? "LOW STOCK" : "In Stock",
        };
      });
      columnLabels = {
        name: "Drug Name",
        strength: "Strength",
        form: "Form",
        stockOnHand: "Stock on Hand",
        currentPrice: "Current Price (SSP)",
        nearestExpiry: "Nearest Expiry",
        status: "Status",
      };
    } else if (exportContext === "catalog") {
      data = filteredCatalogDrugs.map(drug => ({
        drugCode: drug.drugCode,
        name: drug.name,
        genericName: drug.genericName || "-",
        strength: drug.strength || "-",
        form: drug.form,
        reorderLevel: drug.reorderLevel,
        status: drug.isActive ? "Active" : "Inactive",
      }));
      columnLabels = {
        drugCode: "Drug Code",
        name: "Name",
        genericName: "Generic Name",
        strength: "Strength",
        form: "Form",
        reorderLevel: "Reorder Level",
        status: "Status",
      };
    } else if (exportContext === "ledger") {
      data = filteredLedgerEntries.map(entry => ({
        transactionId: entry.transactionId,
        type: entry.transactionType,
        quantity: entry.quantity,
        value: Math.round(entry.totalValue || 0),
        performedBy: entry.performedBy,
        date: new Date(entry.createdAt).toLocaleDateString(),
      }));
      columnLabels = {
        transactionId: "Transaction ID",
        type: "Type",
        quantity: "Quantity",
        value: "Value (SSP)",
        performedBy: "Performed By",
        date: "Date",
      };
    }

    exportData(data, options.columns, columnLabels, options.format, options.filename);
    
    toast({
      title: "Export Complete",
      description: `${data.length} records exported successfully.`,
    });
  };

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

  const getExportColumns = (): ExportColumn[] => {
    if (exportContext === "stock") {
      return [
        { id: "name", label: "Drug Name", enabled: true },
        { id: "strength", label: "Strength", enabled: true },
        { id: "form", label: "Form", enabled: true },
        { id: "stockOnHand", label: "Stock on Hand", enabled: true },
        { id: "currentPrice", label: "Current Price (SSP)", enabled: true },
        { id: "nearestExpiry", label: "Nearest Expiry", enabled: true },
        { id: "status", label: "Status", enabled: true },
      ];
    } else if (exportContext === "catalog") {
      return [
        { id: "drugCode", label: "Drug Code", enabled: true },
        { id: "name", label: "Name", enabled: true },
        { id: "genericName", label: "Generic Name", enabled: true },
        { id: "strength", label: "Strength", enabled: true },
        { id: "form", label: "Form", enabled: true },
        { id: "reorderLevel", label: "Reorder Level", enabled: true },
        { id: "status", label: "Status", enabled: true },
      ];
    } else {
      return [
        { id: "transactionId", label: "Transaction ID", enabled: true },
        { id: "type", label: "Type", enabled: true },
        { id: "quantity", label: "Quantity", enabled: true },
        { id: "value", label: "Value (SSP)", enabled: true },
        { id: "performedBy", label: "Performed By", enabled: true },
        { id: "date", label: "Date", enabled: true },
      ];
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${helpCollapsed ? 'pr-0' : 'pr-96'}`}>
      {/* Right-side help panel - rendered as a fixed sidebar */}
      <PharmacyInventoryHelp collapsed={helpCollapsed} onCollapsedChange={setHelpCollapsed} />

      {/* Main content */}
      <div className="space-y-6 p-6 animate-in fade-in duration-500">
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
            onClick={() => setHelpCollapsed(!helpCollapsed)}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 
                     transition-all duration-200 hover:shadow-premium-sm hover:scale-105"
            data-testid="button-help"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
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
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectLowStock}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Select All Low Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectOutOfStock}
                className="text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Select All Out of Stock
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExportContext("stock");
                setShowExportModal(true);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Stock
            </Button>
          </div>

          {/* Filters */}
          <Card className="shadow-premium-sm">
            <CardContent className="pt-6">
              <FilterBar
                filters={getStockFilters()}
                activeFilters={stockFilters}
                onFilterChange={handleStockFilterChange}
                onClearAll={() => setStockFilters([])}
                onClearFilter={(id) => setStockFilters(stockFilters.filter(f => f.id !== id))}
              />
            </CardContent>
          </Card>

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
                <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                  <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStockItems.size === filteredStockDrugs.length && filteredStockDrugs.length > 0}
                        onCheckedChange={handleSelectAllStock}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Drug Name</TableHead>
                    <TableHead className="font-semibold">Strength</TableHead>
                    <TableHead className="font-semibold">Form</TableHead>
                    <TableHead className="text-right font-semibold">Stock on Hand</TableHead>
                    <TableHead className="text-right font-semibold">Current Price (SSP)</TableHead>
                    <TableHead className="font-semibold">Nearest Expiry</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStockDrugs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
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
                    filteredStockDrugs.map((drug, index) => {
                    const stockLevel = drug.stockOnHand;
                    const isOutOfStock = stockLevel === 0;
                    const isLowStock = stockLevel > 0 && stockLevel <= drug.reorderLevel;
                    const isSelected = selectedStockItems.has(drug.id);
                    
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
                      <TableRow 
                        key={drug.id} 
                        className={`
                          transition-all duration-150 ease-in-out cursor-pointer
                          border-b border-gray-100 dark:border-gray-800
                          ${index % 2 === 0 
                            ? "bg-white dark:bg-gray-900" 
                            : "bg-slate-50 dark:bg-gray-800/50"
                          }
                          ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                          ${isLowStock 
                            ? "hover:bg-red-100/70 dark:hover:bg-red-900/20" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }
                        `}
                      >
                        <TableCell className="py-5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedStockItems);
                              if (checked) {
                                newSet.add(drug.id);
                              } else {
                                newSet.delete(drug.id);
                              }
                              setSelectedStockItems(newSet);
                            }}
                            aria-label={`Select ${drug.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white py-5">{drug.name}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 py-5">{drug.strength || '-'}</TableCell>
                        <TableCell className="capitalize text-gray-700 dark:text-gray-300 py-5">{drug.form}</TableCell>
                        <TableCell className="text-right tabular-nums py-5">
                          <span className={`font-bold text-base ${isOutOfStock ? "text-gray-400 dark:text-gray-600" : isLowStock ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                            {stockLevel}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-gray-900 dark:text-white font-semibold py-5">
                          {currentPrice ? `${Math.round(currentPrice).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 py-5">
                          {nearestExpiry ? new Date(nearestExpiry).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="py-5">
                          {isOutOfStock ? (
                            <Badge 
                              variant="outline" 
                              className="border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 
                                       shadow-premium-sm transition-all duration-150 hover:shadow-premium-md font-medium"
                            >
                              OUT OF STOCK
                            </Badge>
                          ) : isLowStock ? (
                            <Badge 
                              className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-premium-sm 
                                       transition-all duration-150 hover:shadow-premium-md hover:from-red-700 hover:to-red-600 font-medium"
                            >
                              LOW STOCK
                            </Badge>
                          ) : (
                            <Badge 
                              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-premium-sm 
                                       transition-all duration-150 hover:shadow-premium-md hover:from-green-700 hover:to-emerald-700 font-medium"
                            >
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-5">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setQuickAdjustDrug(drug);
                                setShowQuickAdjust(true);
                              }}
                              className="h-8 px-2.5 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400
                                       hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150
                                       hover:shadow-premium-sm hover:scale-105"
                              title="Quick Adjust"
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
                              className="h-8 px-2.5 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                                       hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150
                                       hover:shadow-premium-sm hover:scale-105"
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
                              className="h-8 px-2.5 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
                                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150
                                       hover:shadow-premium-sm hover:scale-105"
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
                <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                  <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                    <TableHead className="font-semibold">Drug Code</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Generic Name</TableHead>
                    <TableHead className="font-semibold">Strength</TableHead>
                    <TableHead className="font-semibold">Form</TableHead>
                    <TableHead className="text-right font-semibold">Reorder Level</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
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
                    drugs.map((drug, index) => (
                    <TableRow 
                      key={drug.id} 
                      data-testid={`drug-row-${drug.id}`}
                      className={`transition-all duration-150 ease-in-out cursor-pointer border-b border-gray-100 dark:border-gray-800
                               ${index % 2 === 0 
                                 ? "bg-white dark:bg-gray-900" 
                                 : "bg-slate-50 dark:bg-gray-800/50"
                               }
                               hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-l-4 hover:border-l-purple-500`}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white py-5">{drug.drugCode}</TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-white py-5">{drug.name}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 py-5">{drug.genericName || '-'}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 py-5">{drug.strength || '-'}</TableCell>
                      <TableCell className="capitalize text-gray-700 dark:text-gray-300 py-5">{drug.form}</TableCell>
                      <TableCell className="text-right tabular-nums text-gray-900 dark:text-white font-semibold py-5">{drug.reorderLevel}</TableCell>
                      <TableCell className="py-5">
                        <Badge 
                          className={drug.isActive 
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-premium-sm transition-all duration-150 hover:shadow-premium-md hover:from-green-700 hover:to-emerald-700 font-medium" 
                            : "bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-premium-sm transition-all duration-150 hover:shadow-premium-md hover:from-gray-700 hover:to-slate-700 font-medium"
                          }
                        >
                          {drug.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-5">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDrug(drug);
                              setShowEditDrug(true);
                            }}
                            className="h-8 px-2.5 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400
                                     hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150
                                     hover:shadow-premium-sm hover:scale-105"
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
                            className="h-8 px-2.5 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                                     hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150
                                     hover:shadow-premium-sm hover:scale-105"
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
                            className="h-8 px-2.5 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
                                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150
                                     hover:shadow-premium-sm hover:scale-105"
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
                                  rounded-2xl shadow-premium-sm animate-float">
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
                    className="border-2 border-red-200 dark:border-red-800/50 rounded-xl p-4 
                             bg-gradient-to-br from-red-50 via-pink-50 to-red-50 dark:from-red-900/20 dark:via-pink-900/15 dark:to-red-900/20
                             shadow-premium-md hover:shadow-premium-lg transition-all duration-200 
                             hover:-translate-y-0.5 animate-slide-in-up"
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
                        <Badge 
                          className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-premium-md
                                   hover:shadow-premium-lg transition-all duration-150 hover:scale-105 font-medium"
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
                Expiring Soon ({EXPIRY_WARNING_DAYS} days) - ({expiringDrugs?.length || 0})
              </CardTitle>
              <CardDescription>Priority: use these batches first (FEFO)</CardDescription>
            </CardHeader>
            <CardContent>
              {(!expiringDrugs || expiringDrugs.length === 0) ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 
                                  rounded-2xl shadow-premium-sm animate-float">
                      <Clock className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Expiring Items</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No batches expiring in the next {EXPIRY_WARNING_DAYS} days.
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
                      className={`border-2 rounded-xl p-4 shadow-premium-md hover:shadow-premium-lg 
                               transition-all duration-200 hover:-translate-y-0.5 animate-slide-in-up ${
                        isExpired 
                          ? "border-red-500 dark:border-red-700/70 bg-gradient-to-br from-red-100 via-pink-100 to-red-100 dark:from-red-900/30 dark:via-pink-900/25 dark:to-red-900/30" 
                          : "border-amber-300 dark:border-amber-700/70 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-amber-900/20"
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
                        <Badge 
                          className={`${isExpired 
                            ? "bg-gradient-to-r from-red-600 to-red-500 shadow-premium-md" 
                            : "bg-gradient-to-r from-amber-600 to-orange-600 shadow-premium-md"
                          } text-white hover:shadow-premium-lg transition-all duration-150 hover:scale-105 font-medium`}
                        >
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

          {/* Analytics Dashboard */}
          <AnalyticsDashboard ledgerEntries={filteredLedgerEntries} />
          
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
                    if (ledgerEntries.length === 0) {
                      toast({
                        variant: "destructive",
                        title: "No Data to Export",
                        description: "There are no transactions to export.",
                      });
                      return;
                    }
                    
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
                      Object.keys(csvData[0]).join(','),
                      ...csvData.map(row => Object.values(row).join(','))
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `inventory-transactions-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    
                    toast({
                      title: "Export Complete",
                      description: `${ledgerEntries.length} transactions exported successfully.`,
                    });
                  }}
                  className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                           hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150
                           hover:shadow-premium-sm hover:scale-105"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLedgerEntries.length === 0 ? (
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
                  <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                    <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                      <TableHead className="font-semibold">Transaction ID</TableHead>
                      <TableHead className="font-semibold">Drug Name</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="text-right font-semibold">Quantity</TableHead>
                      <TableHead className="text-right font-semibold">Value (SSP)</TableHead>
                      <TableHead className="font-semibold">Performed By</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLedgerEntries.map((entry, index) => {
                      const drugDisplay = entry.drugName 
                        ? `${entry.drugName}${entry.drugStrength ? ' ' + entry.drugStrength : ''}`
                        : 'Unknown Drug';
                      
                      return (
                      <TableRow 
                        key={entry.id} 
                        data-testid={`ledger-${entry.transactionId}`}
                        className={`
                          transition-all duration-150 ease-in-out cursor-pointer border-b border-gray-100 dark:border-gray-800
                          ${index % 2 === 0 
                            ? "bg-white dark:bg-gray-900 hover:bg-slate-100 dark:hover:bg-slate-800" 
                            : "bg-slate-50 dark:bg-gray-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                          }
                        `}
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-white py-5">{entry.transactionId}</TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white py-5" title={drugDisplay}>
                          <div className="max-w-[200px] truncate">
                            {drugDisplay}
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge 
                            className={entry.transactionType === 'receive' 
                              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-premium-sm transition-all duration-150 hover:shadow-premium-md font-medium" 
                              : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-premium-sm transition-all duration-150 hover:shadow-premium-md font-medium"
                            }
                          >
                            {entry.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right tabular-nums font-semibold py-5 ${entry.quantity < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                        </TableCell>
                        <TableCell className={`text-right font-mono tabular-nums font-semibold py-5 ${(entry.totalValue || 0) < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {(entry.totalValue || 0) > 0 ? '+' : ''}{Math.round(entry.totalValue || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 py-5">{entry.performedBy}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 py-5">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
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
                  onValueChange={(value: DrugForm) => setNewDrug({ ...newDrug, form: value })}
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
                  onChange={(e) => setNewDrug({ ...newDrug, reorderLevel: parseInt(e.target.value) || DEFAULT_REORDER_LEVEL })}
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

      {/* Edit Drug Dialog */}
      <Dialog open={showEditDrug} onOpenChange={setShowEditDrug}>
        <DialogContent className="max-w-2xl shadow-premium-2xl" data-testid="dialog-edit-drug">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-premium-md">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Edit Drug</DialogTitle>
                <DialogDescription>Update drug information in the catalog</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editingDrug && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Drug Name *</Label>
                <Input
                  id="edit-name"
                  value={editingDrug.name}
                  onChange={(e) => setEditingDrug({ ...editingDrug, name: e.target.value })}
                  placeholder="Drug name"
                  data-testid="input-edit-drug-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-genericName">Generic Name (Optional)</Label>
                <Input
                  id="edit-genericName"
                  value={editingDrug.genericName || ""}
                  onChange={(e) => setEditingDrug({ ...editingDrug, genericName: e.target.value })}
                  placeholder="e.g., Acetaminophen"
                  data-testid="input-edit-generic-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-strength">Strength</Label>
                  <Input
                    id="edit-strength"
                    value={editingDrug.strength || ""}
                    onChange={(e) => setEditingDrug({ ...editingDrug, strength: e.target.value })}
                    placeholder="e.g., 500mg"
                    data-testid="input-edit-strength"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-form">Form</Label>
                  <Select
                    value={editingDrug.form}
                    onValueChange={(value: DrugForm) => setEditingDrug({ ...editingDrug, form: value })}
                  >
                    <SelectTrigger id="edit-form" data-testid="select-edit-form">
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
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editingDrug.category || ""}
                    onChange={(e) => setEditingDrug({ ...editingDrug, category: e.target.value })}
                    placeholder="e.g., Analgesic"
                    data-testid="input-edit-category"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-reorderLevel">Reorder Level</Label>
                  <Input
                    id="edit-reorderLevel"
                    type="number"
                    value={editingDrug.reorderLevel}
                    onChange={(e) => setEditingDrug({ ...editingDrug, reorderLevel: parseInt(e.target.value) || DEFAULT_REORDER_LEVEL })}
                    data-testid="input-edit-reorder-level"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditDrug(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await apiRequest('PUT', `/api/pharmacy/drugs/${editingDrug.id}`, {
                        name: editingDrug.name,
                        genericName: editingDrug.genericName,
                        category: editingDrug.category,
                        form: editingDrug.form,
                        strength: editingDrug.strength,
                        reorderLevel: editingDrug.reorderLevel,
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/drugs'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/stock/all'] });
                      setShowEditDrug(false);
                      toast({
                        title: "Drug Updated",
                        description: "Drug information has been updated successfully.",
                      });
                    } catch (error) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to update drug information.",
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                           shadow-premium-md hover:shadow-premium-lg transition-all duration-200"
                  data-testid="button-save-edit-drug"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Drug Batches Dialog */}
      <Dialog open={showBatchesModal} onOpenChange={setShowBatchesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-premium-2xl" data-testid="dialog-view-batches">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-premium-md">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {batchesDrug?.name || "Drug"} - Batch Details
                </DialogTitle>
                <DialogDescription>View all batches and inventory details</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {batchesDrug && (
            <div className="space-y-6">
              {/* Drug Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                            p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-premium-sm">
                <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Drug Information
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Code:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {batchesDrug.drugCode}
                    </span>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {batchesDrug.strength || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Form:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white capitalize">
                      {batchesDrug.form}
                    </span>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Reorder Level:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {batchesDrug.reorderLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batches Table */}
              <div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Active Batches</h5>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Lot Number</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Cost (SSP)</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBatches
                      .filter(b => b.drugId === batchesDrug.id && b.quantityOnHand > 0)
                      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                      .map((batch) => {
                        const expiryDate = new Date(batch.expiryDate);
                        const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = daysToExpiry <= EXPIRY_WARNING_DAYS;
                        const isExpired = daysToExpiry < 0;

                        return (
                          <TableRow 
                            key={batch.batchId}
                            className={`
                              transition-colors duration-150
                              ${isExpired 
                                ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30" 
                                : isExpiringSoon 
                                  ? "bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30" 
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              }
                            `}
                          >
                            <TableCell className="font-medium">{batch.batchId}</TableCell>
                            <TableCell>{batch.lotNumber || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={isExpired ? "text-red-600 dark:text-red-400 font-semibold" : isExpiringSoon ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                                  {expiryDate.toLocaleDateString()}
                                </span>
                                {isExpired ? (
                                  <Badge className="bg-red-600 text-white text-xs">EXPIRED</Badge>
                                ) : isExpiringSoon ? (
                                  <Badge className="bg-amber-600 text-white text-xs">{daysToExpiry}d</Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{batch.quantityOnHand}</TableCell>
                            <TableCell className="text-right font-mono">{Math.round(batch.unitCost).toLocaleString()}</TableCell>
                            <TableCell>{batch.supplier || 'N/A'}</TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(batch.receivedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
                {allBatches.filter(b => b.drugId === batchesDrug.id && b.quantityOnHand > 0).length === 0 && (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 
                                    rounded-2xl shadow-premium-sm">
                        <Package className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Active Batches</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          This drug has no batches with stock currently.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedDrug(batchesDrug);
                          setNewBatch({ ...newBatch, drugId: batchesDrug.id });
                          setShowBatchesModal(false);
                          setShowReceiveStock(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 mt-2"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Receive Stock
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Adjust Modal */}
      <QuickAdjustModal
        drug={quickAdjustDrug}
        open={showQuickAdjust}
        onOpenChange={setShowQuickAdjust}
        onConfirm={handleQuickAdjust}
      />

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        title={`Export ${exportContext === "stock" ? "Stock Overview" : exportContext === "catalog" ? "Drug Catalog" : "Transaction History"}`}
        columns={getExportColumns()}
        rowCount={exportContext === "stock" ? filteredStockDrugs.length : exportContext === "catalog" ? filteredCatalogDrugs.length : filteredLedgerEntries.length}
        selectedCount={exportContext === "stock" ? selectedStockItems.size : selectedCatalogItems.size}
        defaultFilename={`pharmacy-${exportContext}-${new Date().toISOString().split('T')[0]}`}
        onExport={handleExport}
      />

      {/* Bulk Action Bar for Stock */}
      <BulkActionBar
        selectedCount={selectedStockItems.size}
        onClearSelection={() => setSelectedStockItems(new Set())}
        actions={getStockBulkActions(
          () => toast({ title: "Bulk Receive", description: "Feature coming soon" }),
          () => toast({ title: "Bulk Price Update", description: "Feature coming soon" }),
          () => {
            setExportContext("stock");
            setShowExportModal(true);
          }
        )}
      />

      {/* Bulk Action Bar for Catalog */}
      {selectedCatalogItems.size > 0 && (
        <BulkActionBar
          selectedCount={selectedCatalogItems.size}
          onClearSelection={() => setSelectedCatalogItems(new Set())}
          actions={getCatalogBulkActions(
            () => toast({ title: "Bulk Edit", description: "Feature coming soon" }),
            () => {
              setExportContext("catalog");
              setShowExportModal(true);
            }
          )}
        />
      )}
      </div>
    </div>
  );
}
