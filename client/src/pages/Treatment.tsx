import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, FileText, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { insertTreatmentSchema, type InsertTreatment, type Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

export default function Treatment() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertTreatment>({
    resolver: zodResolver(insertTreatmentSchema),
    defaultValues: {
      patientId: "",
      visitDate: new Date().toISOString().split('T')[0],
      visitType: "consultation",
      priority: "routine",
      chiefComplaint: "",
      temperature: undefined,
      bloodPressure: "",
      heartRate: undefined,
      weight: undefined,
      examination: "",
      diagnosis: "",
      treatmentPlan: "",
      followUpDate: "",
      followUpType: "",
    },
  });

  const generatePrescription = () => {
    const formData = form.getValues();
    console.log("Form data:", formData); // Debug log
    if (!selectedPatient || !formData.treatmentPlan || formData.treatmentPlan.trim() === "") {
      toast({
        title: "Incomplete Information",
        description: "Please fill in patient and treatment plan before generating prescription.",
        variant: "destructive",
      });
      return;
    }
    setPrescriptionData(formData);
    setShowPrescription(true);
  };

  const printPrescription = () => {
    window.print();
  };

  const createTreatmentMutation = useMutation({
    mutationFn: (data: InsertTreatment) => apiRequest("POST", "/api/treatments", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Treatment record saved successfully",
      });
      form.reset();
      setSelectedPatient(null);
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

  const onSubmit = (data: InsertTreatment) => {
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
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    toast({
      title: "Patient Selected",
      description: `${patient.firstName} ${patient.lastName} (${patient.patientId})`,
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown';
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Treatment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Patient Selection */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Select Patient</h3>
            
            {!selectedPatient ? (
              <PatientSearch onSelectPatient={handlePatientSelect} showActions={false} />
            ) : (
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {selectedPatient.patientId} | 
                      Age: {calculateAge(selectedPatient.dateOfBirth || '')} | 
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                            <Input placeholder="120/80" {...field} />
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
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                          <Input type="date" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  <Button type="button" variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Record
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Prescription Modal */}
      {showPrescription && selectedPatient && (
        <div className="print:fixed print:inset-0 print:bg-white print:z-50">
        <Card className="border-2 border-medical-green print:shadow-none print:border-none print:m-0 print:h-full">
          <CardHeader className="text-center border-b print:border-gray-300">
            <CardTitle className="text-2xl font-bold text-medical-blue">
              BAHR EL GHAZAL CLINIC
            </CardTitle>
            <p className="text-sm text-medical-green font-medium">
              Your Health, Our Priority
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Phone: +211 91 762 3881 | +211 92 220 0691
            </p>
            <p className="text-xs text-gray-600">
              Email: bahr.ghazal.clinic@gmail.com
            </p>
            <p className="text-lg font-semibold text-medical-green mt-3">
              PRESCRIPTION
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Patient Information */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p><strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
                <p><strong>Age:</strong> {selectedPatient.dateOfBirth ? 
                  (new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()) : 'Not specified'} years</p>
              </div>
              <div>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Phone:</strong> {selectedPatient.phoneNumber || 'Not provided'}</p>
                <p><strong>Village:</strong> {selectedPatient.village || 'Not specified'}</p>
              </div>
            </div>

            {/* Clinical Information */}
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-medical-blue mb-2">Rx (Treatment Plan):</h4>
                <div className="pl-4 whitespace-pre-line bg-gray-50 p-3 rounded border min-h-[100px]">
                  {prescriptionData?.treatmentPlan || form.getValues("treatmentPlan") || 'No treatment plan specified'}
                </div>
              </div>

              {(prescriptionData?.followUpDate || form.getValues("followUpDate")) && (
                <div>
                  <h4 className="font-semibold text-medical-blue mb-2">Follow-up:</h4>
                  <p className="pl-4">Next visit: {prescriptionData?.followUpDate || form.getValues("followUpDate")} 
                    {(prescriptionData?.followUpType || form.getValues("followUpType")) && ` (${prescriptionData?.followUpType || form.getValues("followUpType")})`}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t mt-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-600">
                    This prescription is valid for 30 days from date of issue
                  </p>
                </div>
                <div className="text-right">
                  <div className="border-t border-gray-400 pt-2 mt-12 w-48">
                    <p className="text-sm">Doctor's Signature</p>
                  </div>
                </div>
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
