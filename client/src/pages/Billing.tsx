import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Users, Receipt, FileText, Plus, Eye, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getClinicDayKey } from "@/lib/date-utils";
import type { Encounter, Patient, OrderLine } from "@shared/schema";

interface EncounterWithPatient extends Encounter {
  patient?: Patient;
  orderLines?: OrderLine[];
  totalAmount?: number;
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
  const [selectedDate, setSelectedDate] = useState(getClinicDayKey());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterWithPatient | null>(null);
  const [showNewEncounterDialog, setShowNewEncounterDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Get encounters
  const { data: encounters = [], isLoading } = useQuery<Encounter[]>({
    queryKey: ["/api/encounters", { status: statusFilter, date: selectedDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append('status', statusFilter);
      if (selectedDate) params.append('date', selectedDate);
      
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
          visitDate: selectedDate,
          attendingClinician: data.attendingClinician,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create encounter");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      setShowNewEncounterDialog(false);
      setSelectedPatient(null);
      toast({
        title: "Encounter Created",
        description: "New patient encounter has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Encounter",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async (encounterId: string) => {
      const response = await fetch(`/api/encounters/${encounterId}/generate-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedBy: "admin" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate invoice");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice Generated",
        description: "Invoice has been generated successfully.",
      });
    },
    onError: (error: Error) => {
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
        description: "Please select a patient to create an encounter.",
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
      setSelectedEncounter({
        ...encounter,
        orderLines: details.orderLines,
        totalAmount: details.orderLines.reduce((sum: number, line: OrderLine) => sum + line.totalPrice, 0)
      });
    } catch (error) {
      toast({
        title: "Failed to Load Encounter",
        description: "Could not load encounter details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Billing Management</h1>
        </div>
        
        <Dialog open={showNewEncounterDialog} onOpenChange={setShowNewEncounterDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Encounter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Encounter</DialogTitle>
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
                  {createEncounterMutation.isPending ? "Creating..." : "Create Encounter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Encounters List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enhancedEncounters.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Encounters Found</h3>
              <p className="text-gray-600 mb-4">
                No encounters found for the selected date and status.
              </p>
              <Button onClick={() => setShowNewEncounterDialog(true)}>
                Create New Encounter
              </Button>
            </CardContent>
          </Card>
        ) : (
          enhancedEncounters.map((encounter) => (
            <Card key={encounter.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {encounter.patient 
                          ? `${encounter.patient.firstName} ${encounter.patient.lastName}`
                          : `Patient ID: ${encounter.patientId}`
                        }
                      </h3>
                      <Badge variant={encounter.status === 'open' ? 'default' : 'secondary'}>
                        {encounter.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Encounter ID: {encounter.encounterId}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(encounter.visitDate).toLocaleDateString()}
                    </p>
                    {encounter.attendingClinician && (
                      <p className="text-sm text-gray-600">
                        Clinician: {encounter.attendingClinician}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewEncounter(encounter)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {encounter.status === 'open' && (
                      <Button 
                        size="sm"
                        onClick={() => generateInvoiceMutation.mutate(encounter.encounterId)}
                        disabled={generateInvoiceMutation.isPending}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Generate Invoice
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Encounter Details Dialog */}
      <Dialog open={!!selectedEncounter} onOpenChange={() => setSelectedEncounter(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Encounter Details</DialogTitle>
          </DialogHeader>
          {selectedEncounter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Patient Information</h4>
                  <p>{selectedEncounter.patient?.firstName} {selectedEncounter.patient?.lastName}</p>
                  <p className="text-sm text-gray-600">ID: {selectedEncounter.patientId}</p>
                </div>
                <div>
                  <h4 className="font-medium">Encounter Information</h4>
                  <p>ID: {selectedEncounter.encounterId}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(selectedEncounter.visitDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Status: {selectedEncounter.status}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Order Lines</h4>
                {selectedEncounter.orderLines && selectedEncounter.orderLines.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEncounter.orderLines.map((line) => (
                      <div key={line.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{line.description}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {line.quantity} × {line.unitPriceSnapshot} SSP
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {line.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{line.totalPrice} SSP</p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between items-center font-medium">
                      <span>Total:</span>
                      <span>{selectedEncounter.totalAmount} SSP</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No order lines found for this encounter.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}