import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Users, Receipt, FileText, Plus, Eye, Clock, Activity, CheckCircle, AlertCircle, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import type { Encounter, Patient, OrderLine } from "@shared/schema";
import { getClinicDayKey } from "@/lib/date-utils";
import { PrintableInvoice } from "@/components/PrintableInvoice";
import { formatCurrency, calculateOrderLinesTotal } from "@/lib/utils";
import { format } from "date-fns";

interface EncounterWithPatient extends Encounter {
  patient?: Patient;
  orderLines?: OrderLine[];
  totalAmount?: number;
  serviceCount?: number;
}

// Visit Card Component with Total Display
function EncounterCard({ 
  encounter, 
  onViewDetails, 
  onGenerateInvoice, 
  isGenerating 
}: { 
  encounter: EncounterWithPatient; 
  onViewDetails: () => void; 
  onGenerateInvoice: () => void; 
  isGenerating: boolean;
}) {
  const [total, setTotal] = useState<number | null>(null);
  const [serviceCount, setServiceCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch encounter totals
  useEffect(() => {
    const fetchTotal = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/encounters/${encounter.encounterId}`);
        if (response.ok) {
          const details = await response.json();
          const calculatedTotal = calculateOrderLinesTotal(details.orderLines || []);
          setTotal(calculatedTotal);
          setServiceCount(details.orderLines?.length || 0);
        }
      } catch (error) {
        console.error('Failed to fetch encounter total:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTotal();
  }, [encounter.encounterId]);

  const statusConfig = (() => {
    switch (encounter.status) {
      case 'open':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          borderColor: '#3b82f6',
          icon: Activity, 
          label: 'Open' 
        };
      case 'ready_to_bill':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          borderColor: '#10b981',
          icon: CheckCircle, 
          label: 'Ready to Bill' 
        };
      case 'closed':
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          borderColor: '#6b7280',
          icon: CheckCircle, 
          label: 'Closed' 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          borderColor: '#6b7280',
          icon: AlertCircle, 
          label: encounter.status 
        };
    }
  })();

  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4" style={{ borderLeftColor: statusConfig.borderColor }}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Patient and encounter info */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-lg">
                {encounter.patient 
                  ? `${encounter.patient.firstName} ${encounter.patient.lastName}`
                  : `Patient ID: ${encounter.patientId}`
                }
              </h3>
              <Badge className={`${statusConfig.color} border flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <p className="flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5" />
                ID: {encounter.encounterId}
              </p>
              <p className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(encounter.visitDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
              {encounter.attendingClinician && (
                <p className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {encounter.attendingClinician}
                </p>
              )}
              {encounter.createdAt && (
                <p className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(encounter.createdAt).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              )}
            </div>

            {/* Service count and total */}
            <div className="flex gap-4 mt-3 pt-3 border-t">
              {isLoading ? (
                <div className="flex gap-4">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-sm">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{serviceCount}</span>
                    <span className="text-gray-600">service{serviceCount !== 1 ? 's' : ''}</span>
                  </div>
                  {total !== null && (
                    <div className="flex items-center gap-1 text-sm">
                      <Receipt className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700">{formatCurrency(total)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex flex-col gap-2 min-w-fit">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewDetails}
              className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            {encounter.status === 'open' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button 
                        size="sm"
                        onClick={onGenerateInvoice}
                        disabled={isGenerating || serviceCount === 0}
                        className="bg-green-600 hover:bg-green-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {isGenerating ? "Generating..." : "Generate Invoice"}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {serviceCount === 0 && (
                    <TooltipContent>
                      <p>Cannot generate invoice: This visit has no services</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple patient search component for billing
function BillingPatientSearch({ onPatientSelect }: { onPatientSelect: (patient: Patient) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["/api/patients", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/patients?${params}`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    },
    enabled: searchTerm.length > 2 || searchTerm === "",
  });

  return (
    <div className="space-y-2">
      <Input
        type="text"
        placeholder="Search patient by name or ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {isLoading && <div className="text-sm text-gray-500">Searching...</div>}
      {patients.length > 0 && (
        <div className="max-h-40 overflow-y-auto border rounded">
          {patients.map((patient: Patient) => (
            <button
              key={patient.id}
              className="w-full text-left p-2 hover:bg-gray-100 border-b last:border-b-0"
              onClick={() => onPatientSelect(patient)}
            >
              <div className="font-medium">{patient.firstName} {patient.lastName}</div>
              <div className="text-sm text-gray-600">ID: {patient.patientId}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Billing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterWithPatient | null>(null);
  const [showNewEncounterDialog, setShowNewEncounterDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [encounterToInvoice, setEncounterToInvoice] = useState<string | null>(null);

  // Get encounters
  const { data: encounters = [], isLoading } = useQuery<Encounter[]>({
    queryKey: ["/api/encounters", { status: statusFilter, date: format(selectedDate, 'yyyy-MM-dd') }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append('status', statusFilter);
      if (selectedDate) params.append('date', format(selectedDate, 'yyyy-MM-dd'));
      
      const response = await fetch(`/api/encounters?${params}`);
      if (!response.ok) throw new Error('Failed to fetch encounters');
      return response.json();
    }
  });

  // Get patients for encounter lookup
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    }
  });

  // Create encounter mutation
  const createEncounterMutation = useMutation({
    mutationFn: async (data: { patientId: string; attendingClinician: string }) => {
      const response = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: data.patientId,
          visitDate: format(selectedDate, 'yyyy-MM-dd'),
          attendingClinician: data.attendingClinician,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create visit");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      setShowNewEncounterDialog(false);
      setSelectedPatient(null);
      toast({
        title: "✓ Visit Created",
        description: "New patient visit has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Visit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate invoice mutation with validation
  const generateInvoiceMutation = useMutation({
    mutationFn: async (encounterId: string) => {
      // Pre-validation: Check if encounter has order lines
      const response = await fetch(`/api/encounters/${encounterId}`);
      if (!response.ok) throw new Error('Failed to fetch encounter details');
      
      const details = await response.json();
      
      if (!details.orderLines || details.orderLines.length === 0) {
        throw new Error("Cannot generate invoice: This visit has no services. Please add services before generating an invoice.");
      }

      // Generate the invoice
      const invoiceResponse = await fetch(`/api/encounters/${encounterId}/generate-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedBy: "admin" }),
      });

      if (!invoiceResponse.ok) {
        const error = await invoiceResponse.json();
        throw new Error(error.error || "Failed to generate invoice");
      }

      return invoiceResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setEncounterToInvoice(null);
      toast({
        title: "✓ Invoice Generated",
        description: "Invoice has been generated successfully.",
        className: "bg-green-50 border-green-200",
      });
    },
    onError: (error: Error) => {
      setEncounterToInvoice(null);
      toast({
        title: "Failed to Generate Invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enhanced encounters with patient data and totals
  const enhancedEncounters: EncounterWithPatient[] = (encounters as Encounter[]).map((encounter: Encounter) => {
    const patient = patients.find((p: Patient) => p.patientId === encounter.patientId);
    return {
      ...encounter,
      patient,
    };
  });

  const handleCreateEncounter = () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient to create a visit.",
        variant: "destructive",
      });
      return;
    }

    createEncounterMutation.mutate({
      patientId: selectedPatient.patientId,
      attendingClinician: "Dr. Admin", // In real app, get from auth
    });
  };

  const handleViewEncounter = async (encounter: EncounterWithPatient) => {
    try {
      const response = await fetch(`/api/encounters/${encounter.encounterId}`);
      if (!response.ok) throw new Error('Failed to fetch encounter details');
      
      const details = await response.json();
      
      // Calculate total using shared utility
      const totalAmount = calculateOrderLinesTotal(details.orderLines || []);
      
      setSelectedEncounter({
        ...encounter,
        orderLines: details.orderLines,
        totalAmount,
        serviceCount: details.orderLines?.length || 0
      });
    } catch (error) {
      toast({
        title: "Failed to Load Visit",
        description: "Could not load visit details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Receipt className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Billing & Invoices</h1>
              <p className="text-blue-100 mt-1">Manage patient visits and generate invoices</p>
            </div>
          </div>
          
          <Dialog open={showNewEncounterDialog} onOpenChange={setShowNewEncounterDialog}>
            <DialogTrigger asChild>
              <Button className="bg-white text-blue-700 hover:bg-blue-50 shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                New Visit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Visit</DialogTitle>
                <DialogDescription>
                  Select a patient to create a new visit record for billing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Patient</label>
                  <BillingPatientSearch onPatientSelect={setSelectedPatient} />
                  {selectedPatient && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                      <p className="text-sm text-gray-600">ID: {selectedPatient.patientId}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewEncounterDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateEncounter}
                    disabled={!selectedPatient || createEncounterMutation.isPending}
                  >
                    {createEncounterMutation.isPending ? "Creating..." : "Create Visit"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters with improved styling */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <DatePicker
              date={selectedDate}
              onDateChange={(date) => date && setSelectedDate(date)}
              placeholder="Select visit date"
              className="w-[240px]"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="ready_to_bill">Ready to Bill</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Quick Stats */}
            <div className="ml-auto flex gap-4">
              <div className="text-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 font-medium">Today's Visits</p>
                <p className="text-2xl font-bold text-blue-700">{enhancedEncounters.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="space-y-3 animate-pulse">
                    <div className="flex justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/3 animate-shimmer"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2 animate-shimmer"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/4 animate-shimmer"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-9 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer"></div>
                        <div className="h-9 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enhancedEncounters.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Visits Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                No visits found for the selected date and status. Create a new visit to get started.
              </p>
              <Button onClick={() => setShowNewEncounterDialog(true)} size="lg" className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Create New Visit
              </Button>
            </CardContent>
          </Card>
        ) : (
          enhancedEncounters.map((encounter) => (
            <EncounterCard
              key={encounter.id}
              encounter={encounter}
              onViewDetails={() => handleViewEncounter(encounter)}
              onGenerateInvoice={() => setEncounterToInvoice(encounter.encounterId)}
              isGenerating={generateInvoiceMutation.isPending}
            />
          ))
        )}
      </div>

      {/* Visit Details Dialog */}
      <Dialog open={!!selectedEncounter} onOpenChange={() => setSelectedEncounter(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print-invoice">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Visit Details</DialogTitle>
            <DialogDescription>
              Complete breakdown of services and charges for this visit
            </DialogDescription>
          </DialogHeader>
          {selectedEncounter && (
            <div className="space-y-6">
              {/* Patient and Encounter Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-900">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="font-semibold text-lg">{selectedEncounter.patient?.firstName} {selectedEncounter.patient?.lastName}</p>
                    <p className="text-sm text-gray-700">ID: {selectedEncounter.patientId}</p>
                    {selectedEncounter.patient?.phoneNumber && (
                      <p className="text-sm text-gray-700">Phone: {selectedEncounter.patient.phoneNumber}</p>
                    )}
                    {selectedEncounter.patient?.email && (
                      <p className="text-sm text-gray-700">Email: {selectedEncounter.patient.email}</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-900">Visit Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Visit ID:</span> {selectedEncounter.encounterId}</p>
                    <p className="text-sm"><span className="font-medium">Date:</span> {new Date(selectedEncounter.visitDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    {selectedEncounter.createdAt && (
                      <p className="text-sm"><span className="font-medium">Time:</span> {new Date(selectedEncounter.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</p>
                    )}
                    <p className="text-sm"><span className="font-medium">Status:</span> <Badge className="ml-1">{selectedEncounter.status}</Badge></p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Lines Section */}
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  Services & Charges
                </h4>
                {selectedEncounter.orderLines && selectedEncounter.orderLines.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEncounter.orderLines.map((line, index) => (
                      <div key={line.id} className={`flex justify-between items-start p-4 rounded-lg border-l-4 ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } border-blue-400 hover:shadow-sm transition-shadow`}>
                        <div className="flex-1">
                          <p className="font-semibold text-base">{line.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Quantity: <span className="font-medium text-gray-900">{line.quantity}</span></span>
                            <span>Unit Price: <span className="font-medium text-gray-900">{formatCurrency(line.unitPriceSnapshot)}</span></span>
                          </div>
                          <Badge variant="outline" className="mt-2">
                            {line.status}
                          </Badge>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600 mb-1">Total</p>
                          <p className="font-bold text-lg text-blue-700">{formatCurrency(line.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Grand Total */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg mt-4 flex justify-between items-center">
                      <span className="text-lg font-semibold">Grand Total:</span>
                      <span className="text-2xl font-bold">{formatCurrency(selectedEncounter.totalAmount || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">No services found for this visit.</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Print Button */}
              <div className="flex justify-end gap-2 mt-6 print:hidden">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
                <Button onClick={() => setSelectedEncounter(null)}>Close</Button>
              </div>
            </div>
          )}
          
          {/* Hidden printable invoice component */}
          {selectedEncounter && selectedEncounter.patient && selectedEncounter.orderLines && (
            <PrintableInvoice
              visit={selectedEncounter}
              patient={selectedEncounter.patient}
              orderLines={selectedEncounter.orderLines}
              invoiceId={selectedEncounter.encounterId}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except the invoice */
          body > *:not(#printable-invoice) {
            display: none !important;
          }
          
          #printable-invoice {
            display: block !important;
          }
          
          /* Hide all dialog overlays and backgrounds */
          [role="dialog"],
          [data-radix-dialog-overlay],
          .print\\:hidden {
            display: none !important;
          }
          
          /* Reset page margins for clean print */
          @page {
            margin: 0.5in;
            size: letter;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          /* Ensure the printable invoice shows properly */
          .hidden.print\\:block {
            display: block !important;
          }
        }
      `}</style>

      {/* Confirmation Dialog for Invoice Generation */}
      <AlertDialog open={!!encounterToInvoice} onOpenChange={(open) => !open && setEncounterToInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to generate an invoice for this visit? This action will create a billing record and mark the visit as ready for payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => encounterToInvoice && generateInvoiceMutation.mutate(encounterToInvoice)}
              className="bg-green-600 hover:bg-green-700"
            >
              Generate Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}