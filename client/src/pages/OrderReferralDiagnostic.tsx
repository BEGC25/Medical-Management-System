import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ClipboardList, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PatientSearch from "@/components/PatientSearch";
import { type Patient, type Service, type Encounter } from "@shared/schema";
import { ROLES } from "@shared/auth-roles";
import { apiRequest } from "@/lib/queryClient";
import { getClinicDayKey } from "@/lib/date-utils";

function money(n?: number) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return `${Math.round(v).toLocaleString()} SSP`;
}

export default function OrderReferralDiagnostic() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Redirect non-admins
  if (user?.role !== ROLES.ADMIN) {
    navigate("/");
    return null;
  }

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<"lab" | "xray" | "ultrasound" | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");

  // Query services for each department
  const { data: laboratoryServices = [] } = useQuery<Service[]>({
    queryKey: ["/api/services", { category: "laboratory" }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/services?category=laboratory&isActive=true");
      return await response.json();
    },
  });

  const { data: radiologyServices = [] } = useQuery<Service[]>({
    queryKey: ["/api/services", { category: "radiology" }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/services?category=radiology&isActive=true");
      return await response.json();
    },
  });

  const { data: ultrasoundServices = [] } = useQuery<Service[]>({
    queryKey: ["/api/services", { category: "ultrasound" }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/services?category=ultrasound&isActive=true");
      return await response.json();
    },
  });

  // Order mutation
  const orderReferralDiagnosticMutation = useMutation({
    mutationFn: async ({
      patient,
      department,
      service,
      notes,
    }: {
      patient: Patient;
      department: "lab" | "xray" | "ultrasound";
      service: Service;
      notes: string;
    }) => {
      // 1. Create diagnostics_only encounter
      const encounterData = {
        patientId: patient.patientId,
        visitDate: getClinicDayKey(), // Current clinic day in YYYY-MM-DD format (Africa/Juba timezone)
        notes: `Referral for ${department === "lab" ? "Laboratory" : department === "xray" ? "X-Ray" : "Ultrasound"} (Diagnostics Only)`,
        // status defaults to "open" if not specified
      };
      const encounterResponse = await apiRequest("POST", "/api/encounters", encounterData);
      const encounter: Encounter = await encounterResponse.json();

      // 2. Create order line via order-lines endpoint (server auto-creates diagnostic record)
      let relatedType: string;
      let departmentName: string;
      let diagnosticData: any;
      
      if (department === "lab") {
        relatedType = "lab_test";
        departmentName = "laboratory";
        // Infer category from service name or use 'other' as default
        const serviceName = service.name.toLowerCase();
        let category = "other";
        if (serviceName.includes("blood") || serviceName.includes("cbc") || serviceName.includes("hemoglobin") || serviceName.includes("malaria")) {
          category = "blood";
        } else if (serviceName.includes("urine")) {
          category = "urine";
        } else if (serviceName.includes("stool")) {
          category = "stool";
        } else if (serviceName.includes("hormone") || serviceName.includes("pregnancy") || serviceName.includes("hcg")) {
          category = "hormonal";
        } else if (serviceName.includes("chemistry") || serviceName.includes("liver") || serviceName.includes("renal") || serviceName.includes("sugar")) {
          category = "chemistry";
        } else if (serviceName.includes("micro") || serviceName.includes("culture") || serviceName.includes("tuberculosis")) {
          category = "microbiology";
        }
        
        diagnosticData = {
          category: category,
          tests: JSON.stringify([service.name]),
          clinicalInfo: notes,
          priority: "routine",
        };
      } else if (department === "xray") {
        relatedType = "xray";
        departmentName = "radiology";
        diagnosticData = {
          examType: "chest",
          clinicalIndication: notes,
          bodyPart: service.name,
        };
      } else {
        relatedType = "ultrasound";
        departmentName = "ultrasound";
        diagnosticData = {
          examType: "abdominal",
          clinicalIndication: notes,
          specificExam: service.name,
        };
      }
      
      const orderLineData = {
        encounterId: encounter.encounterId,
        serviceId: service.id,
        relatedType: relatedType,
        description: `${department === "lab" ? "Lab Test" : department === "xray" ? "X-Ray" : "Ultrasound"}: ${service.name}`,
        quantity: 1,
        unitPriceSnapshot: service.price || 0,
        totalPrice: service.price || 0,
        department: departmentName,
        orderedBy: user?.username || "Admin",
        diagnosticData: diagnosticData,
      };
      const orderResponse = await apiRequest("POST", "/api/order-lines", orderLineData);
      return await orderResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Referral Order Created",
        description: "Diagnostic referral order created successfully.",
      });
      // Reset form
      setSelectedPatient(null);
      setSelectedDepartment(null);
      setSelectedService(null);
      setClinicalNotes("");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/xray-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ultrasound-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create referral order",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedPatient || !selectedDepartment || !selectedService) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }
    orderReferralDiagnosticMutation.mutate({
      patient: selectedPatient,
      department: selectedDepartment,
      service: selectedService,
      notes: clinicalNotes,
    });
  };

  // Get services for selected department
  const availableServices = 
    selectedDepartment === "lab" ? laboratoryServices :
    selectedDepartment === "xray" ? radiologyServices :
    selectedDepartment === "ultrasound" ? ultrasoundServices : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Referral Diagnostic</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create diagnostic orders for referral/walk-in patients</p>
        </div>
      </div>

      {/* Information Notice */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> This form is for ordering diagnostics for referral or walk-in patients who need tests without a full consultation. 
          For regular patient visits, doctors should order tests from the <strong>Treatment page</strong> during consultations.
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Referral Order Form
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Step 1: Select Patient */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              1. Select Patient <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <PatientSearch
                onViewPatient={(patient) => setSelectedPatient(patient)}
                viewMode="search"
                selectedDate=""
                searchTerm=""
                showActions={false}
              />
            </div>
            {selectedPatient && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-100">
                  <strong>Selected:</strong> {selectedPatient.firstName} {selectedPatient.lastName} (ID: {selectedPatient.patientId})
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Select Department */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              2. Select Department <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedDepartment || ""}
              onValueChange={(value) => {
                setSelectedDepartment(value as "lab" | "xray" | "ultrasound");
                setSelectedService(null); // Reset service when department changes
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose department..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lab">Laboratory</SelectItem>
                <SelectItem value="xray">X-Ray (Radiology)</SelectItem>
                <SelectItem value="ultrasound">Ultrasound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Select Service */}
          {selectedDepartment && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                3. Select Service <span className="text-red-500">*</span>
              </label>
              {availableServices.length === 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  No active services available for this department. Please add services in Service Management.
                </p>
              )}
              {availableServices.length > 0 && (
                <Select
                  value={selectedService?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const service = availableServices.find((s) => s.id === parseInt(value));
                    setSelectedService(service || null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} - {money(service.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Step 4: Clinical Notes */}
          {selectedService && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                4. Clinical Notes (Optional)
              </label>
              <Textarea
                placeholder="Enter any clinical indication or notes..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleSubmit}
              disabled={!selectedPatient || !selectedDepartment || !selectedService || orderReferralDiagnosticMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              size="lg"
            >
              {orderReferralDiagnosticMutation.isPending ? "Creating Order..." : "Create Referral Order"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
