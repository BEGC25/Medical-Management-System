import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, FileText, Printer, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { insertTreatmentSchema, type InsertTreatment, type Patient, type Treatment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

export default function Treatment() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [savedTreatment, setSavedTreatment] = useState<Treatment | null>(null);
  const [filterToday, setFilterToday] = useState(false);
  
  // Patient search state for PatientSearch component
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for filter parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    if (filter === 'today') {
      setFilterToday(true);
    }
  }, []);

  // Query for today's treatments if filtering
  const { data: todaysTreatments = [] } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments", "today"],
    enabled: filterToday,
  });

  const form = useForm<InsertTreatment>({
    resolver: zodResolver(insertTreatmentSchema),
    defaultValues: {
      patientId: "",
      visitDate: new Date().toISOString().split('T')[0],
      visitType: "consultation",
      priority: "routine",
      chiefComplaint: "",
      temperature: null,
      bloodPressure: "",
      heartRate: null,
      weight: null,
      examination: "",
      diagnosis: "",
      treatmentPlan: "",
      followUpDate: "",
      followUpType: "",
    },
  });

  const generatePrescription = () => {
    const formData = form.getValues();
    if (!selectedPatient || !formData.treatmentPlan) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in patient and treatment plan before generating prescription.",
        variant: "destructive",
      });
      return;
    }
    
    if (!savedTreatment) {
      toast({
        title: "Save Treatment First",
        description: "Please save the treatment record before generating prescription.",
        variant: "destructive",
      });
      return;
    }
    
    setShowPrescription(true);
  };

  const printPrescription = () => {
    // Create a new window for printing with proper title
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const prescriptionContent = document.getElementById('prescription-print')?.innerHTML;
    const originalTitle = document.title;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${savedTreatment?.treatmentId || 'BGC'}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              body { margin: 0; }
              .prescription-container {
                width: 210mm;
                min-height: 297mm;
                max-height: 297mm;
                padding: 20mm;
                box-sizing: border-box;
                page-break-after: avoid;
                display: flex;
                flex-direction: column;
              }
              .content { flex: 1; }
              .footer { margin-top: auto; }
            }
            body {
              font-family: 'Roboto', sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .text-center { text-align: center; }
            .text-medical-blue { color: #1e40af; }
            .text-medical-green { color: #16a34a; }
            .text-gray-600 { color: #6b7280; }
            .text-gray-500 { color: #9ca3af; }
            .text-2xl { font-size: 1.5rem; font-weight: bold; }
            .text-lg { font-size: 1.125rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .pb-4 { padding-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            .pt-8 { padding-top: 2rem; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .pl-4 { padding-left: 1rem; }
            .p-3 { padding: 0.75rem; }
            .whitespace-pre-line { white-space: pre-line; }
            .rounded { border-radius: 0.25rem; }
            .border { border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="prescription-container">
            ${prescriptionContent}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const createTreatmentMutation = useMutation({
    mutationFn: async (data: InsertTreatment): Promise<Treatment> => {
      const response = await apiRequest("POST", "/api/treatments", data);
      return response.json();
    },
    onSuccess: (treatment: Treatment) => {
      setSavedTreatment(treatment);
      toast({
        title: "Success",
        description: `Treatment record saved successfully (ID: ${treatment.treatmentId})`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'treatment',
          action: 'create',
          data: form.getValues(),
        });
        toast({
          title: "Saved Offline",
          description: "Treatment record saved locally. Will sync when online.",
        });
        setSavedTreatment(null);
        form.reset();
        setSelectedPatient(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to save treatment record",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }
    
    createTreatmentMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
    });
  });

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSavedTreatment(null);
    toast({
      title: "Patient Selected",
      description: `${patient.firstName} ${patient.lastName} (${patient.patientId})`,
    });
  };

  const handleNewTreatment = () => {
    form.reset();
    setSelectedPatient(null);
    setSavedTreatment(null);
    setShowPrescription(false);
  };

  const getAge = (age: string) => {
    return age || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Today's Treatments List (when filtering) */}
      {filterToday && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Today's Treatment Visits</span>
                <Badge className="bg-blue-600 text-white">
                  <Filter className="w-3 h-3 mr-1" />
                  Today Only
                </Badge>
              </div>
              <Button 
                variant="outline"
                onClick={() => setFilterToday(false)}
              >
                Back to New Treatment
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysTreatments && todaysTreatments.length > 0 ? (
                todaysTreatments.map((treatment: any) => (
                  <div key={treatment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          Patient: {treatment.patientId} | Visit: {treatment.treatmentId}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Type: {treatment.visitType} | Priority: {treatment.priority}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Chief Complaint: {treatment.chiefComplaint}
                        </p>
                        {treatment.diagnosis && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Diagnosis: {treatment.diagnosis}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-green-600 text-white">
                        <Calendar className="w-3 h-3 mr-1" />
                        {treatment.visitDate}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No treatment visits recorded today
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment Entry Form */}
      {!filterToday && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Treatment Records</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Patient Selection */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Select Patient</h3>
            
            {!selectedPatient ? (
              <PatientSearch 
                onSelectPatient={handlePatientSelect} 
                showActions={false}
                viewMode="all"
                selectedDate=""
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                shouldSearch={shouldSearch}
                onShouldSearchChange={setShouldSearch}
              />
            ) : (
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                      {savedTreatment && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          Saved: {savedTreatment.treatmentId}
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {selectedPatient.patientId} | 
                      Age: {getAge(selectedPatient.age || '')} | 
                      {selectedPatient.gender && ` ${selectedPatient.gender}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Contact: {selectedPatient.phoneNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-health-green text-white">Selected</Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => setSelectedPatient(null)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Treatment Form */}
          {selectedPatient && (
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Visit Information */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Visit Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="visitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visit Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="visitType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visit Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="consultation">Consultation</SelectItem>
                              <SelectItem value="follow-up">Follow-up</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="preventive">Preventive Care</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="routine">Routine</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Chief Complaint */}
                <FormField
                  control={form.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What brings the patient in today?"
                          rows={3}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vital Signs */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Vital Signs
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              placeholder="36.5"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bloodPressure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Pressure</FormLabel>
                          <FormControl>
                            <Input placeholder="120/80" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="heartRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heart Rate (bpm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="72"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              placeholder="65.0"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Examination Findings */}
                <FormField
                  control={form.control}
                  name="examination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Examination</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed examination findings..."
                          rows={4}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Diagnosis */}
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Primary and secondary diagnoses..."
                          rows={3}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Treatment Plan */}
                <FormField
                  control={form.control}
                  name="treatmentPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Plan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Medications, procedures, recommendations..."
                          rows={4}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Follow-up */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="followUpType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Visit Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No follow-up needed" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No follow-up needed</SelectItem>
                            <SelectItem value="routine">Routine Follow-up</SelectItem>
                            <SelectItem value="urgent">Urgent Follow-up</SelectItem>
                            <SelectItem value="lab-results">Lab Results Review</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button 
                    type="submit" 
                    disabled={createTreatmentMutation.isPending}
                    className="bg-medical-blue hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {createTreatmentMutation.isPending ? "Saving..." : "Save Treatment Record"}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={generatePrescription}
                    className="bg-health-green hover:bg-green-700"
                    disabled={!selectedPatient || !form.watch("treatmentPlan")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Prescription
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleNewTreatment}
                    className="ml-auto"
                  >
                    New Treatment
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        </Card>
      )}

      {/* Prescription Modal */}
      {showPrescription && selectedPatient && (
        <div>
          <Card className="border-2 border-medical-green">
            <CardContent className="p-6">
              <div
                id="prescription-print"
                className="flex flex-col min-h-[100vh] print:min-h-[100vh] print:w-[210mm] print:h-[297mm] p-8"
              >
                {/* Header */}
                <div className="text-center border-b pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-medical-blue">
                    BAHR EL GHAZAL CLINIC
                  </h1>
                  <p className="text-sm text-gray-600">
                    Your Health, Our Priority
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com
                  </p>
                  <p className="text-lg font-semibold text-medical-green mt-2">
                    PRESCRIPTION
                  </p>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  {/* Patient Information */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b mb-6">
                    <div>
                      <p><strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                      <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
                      <p><strong>Age:</strong> {selectedPatient.age || 'Not specified'}</p>
                    </div>
                    <div>
                      <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                      <p><strong>Treatment ID:</strong> {savedTreatment?.treatmentId || 'Not available'}</p>
                      <p><strong>Phone:</strong> {selectedPatient.phoneNumber || 'Not provided'}</p>
                      <p><strong>Village:</strong> {selectedPatient.village || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Clinical Information */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-medical-blue mb-2">Rx (Treatment Plan):</h4>
                      <div className="pl-4 whitespace-pre-line bg-gray-50 print:bg-white p-3 rounded border">
                        {form.getValues("treatmentPlan")}
                      </div>
                    </div>

                    {form.getValues("followUpDate") && (
                      <div>
                        <h4 className="font-semibold text-medical-blue mb-2">Follow-up:</h4>
                        <p className="pl-4">Next visit: {form.getValues("followUpDate")} 
                          {form.getValues("followUpType") && ` (${form.getValues("followUpType")})`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t">
                  <p className="mt-6">Doctor's Signature: ____________________</p>
                  <p className="text-xs text-gray-500 mt-4 text-center">Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 print:hidden">
                <Button 
                  onClick={printPrescription}
                  className="bg-medical-blue hover:bg-blue-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Prescription
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowPrescription(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
