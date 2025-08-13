import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Printer, Check, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { insertUltrasoundExamSchema, type InsertUltrasoundExam, type Patient, type UltrasoundExam } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

export default function Ultrasound() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedUltrasoundExam, setSelectedUltrasoundExam] = useState<UltrasoundExam | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertUltrasoundExam>({
    resolver: zodResolver(insertUltrasoundExamSchema),
    defaultValues: {
      patientId: "",
      examType: "abdominal",
      clinicalIndication: "",
      specialInstructions: "",
      priority: "routine",
      requestedDate: new Date().toISOString().split('T')[0],
    },
  });

  const resultsForm = useForm({
    defaultValues: {
      imageQuality: "good" as "excellent" | "good" | "adequate" | "limited",
      findings: "",
      impression: "",
      recommendations: "",
      reportStatus: "normal" as "normal" | "abnormal" | "urgent",
      reportDate: new Date().toISOString().split('T')[0],
      sonographer: "",
    },
  });

  const { data: pendingUltrasounds = [] } = useQuery({
    queryKey: ["/api/ultrasound-exams"],
    select: (data: UltrasoundExam[]) => data.filter(exam => exam.status === 'pending'),
  });

  const createUltrasoundExamMutation = useMutation({
    mutationFn: async (data: InsertUltrasoundExam) => {
      const response = await apiRequest("POST", "/api/ultrasound-exams", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ultrasound examination request submitted successfully",
      });
      form.reset();
      setSelectedPatient(null);
      queryClient.invalidateQueries({ queryKey: ["/api/ultrasound-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'ultrasound_exam',
          action: 'create',
          data: form.getValues(),
        });
        toast({
          title: "Saved Offline",
          description: "Ultrasound request saved locally. Will sync when online.",
        });
        form.reset();
        setSelectedPatient(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to submit ultrasound request",
          variant: "destructive",
        });
      }
    },
  });

  const updateUltrasoundExamMutation = useMutation({
    mutationFn: async ({ examId, data }: { examId: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/ultrasound-exams/${examId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ultrasound report saved successfully",
      });
      resultsForm.reset();
      setSelectedUltrasoundExam(null);
      queryClient.invalidateQueries({ queryKey: ["/api/ultrasound-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'ultrasound_exam',
          action: 'update',
          data: { examId: selectedUltrasoundExam?.examId, ...resultsForm.getValues() },
        });
        toast({
          title: "Saved Offline",
          description: "Ultrasound report saved locally. Will sync when online.",
        });
        resultsForm.reset();
        setSelectedUltrasoundExam(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to save ultrasound report",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmitRequest = (data: InsertUltrasoundExam) => {
    createUltrasoundExamMutation.mutate({
      ...data,
      patientId: selectedPatient!.patientId,
    });
  };

  const onSubmitResults = (data: any) => {
    if (selectedUltrasoundExam) {
      updateUltrasoundExamMutation.mutate({
        examId: selectedUltrasoundExam.examId,
        data: {
          ...data,
          status: "completed",
        },
      });
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    form.setValue("patientId", patient.patientId);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-medical-blue dark:text-blue-400">Ultrasound Department</h1>
          <p className="text-gray-600 dark:text-gray-300">Request and manage ultrasound examinations</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {pendingUltrasounds?.length || 0} Pending
          </Badge>
        </div>
      </div>

      {/* Request New Ultrasound */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-blue dark:text-blue-400">New Ultrasound Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Patient Selection */}
            <div>
              <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200">Select Patient</h4>
              <PatientSearch onSelectPatient={handlePatientSelect} />
              {selectedPatient && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Selected: {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {selectedPatient.gender} • {selectedPatient.village} • Phone: {selectedPatient.phoneNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Ultrasound Request Form */}
            {selectedPatient && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="examType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Examination Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select exam type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="abdominal">Abdominal</SelectItem>
                              <SelectItem value="pelvic">Pelvic</SelectItem>
                              <SelectItem value="obstetric">Obstetric/Pregnancy</SelectItem>
                              <SelectItem value="cardiac">Cardiac/Echo</SelectItem>
                              <SelectItem value="vascular">Vascular/Doppler</SelectItem>
                              <SelectItem value="thyroid">Thyroid</SelectItem>
                              <SelectItem value="renal">Renal/Kidney</SelectItem>
                              <SelectItem value="hepatobiliary">Liver/Gallbladder</SelectItem>
                              <SelectItem value="gynecological">Gynecological</SelectItem>
                              <SelectItem value="urological">Urological/Bladder</SelectItem>
                              <SelectItem value="pediatric">Pediatric</SelectItem>
                              <SelectItem value="musculoskeletal">Musculoskeletal</SelectItem>
                              <SelectItem value="breast">Breast</SelectItem>
                              <SelectItem value="scrotal">Scrotal/Testicular</SelectItem>
                              <SelectItem value="carotid">Carotid Doppler</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
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

                    <FormField
                      control={form.control}
                      name="requestedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requested Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="clinicalIndication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinical Indication</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Reason for ultrasound examination..."
                            rows={3}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special instructions or patient preparation..."
                            rows={2}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={createUltrasoundExamMutation.isPending}
                      className="bg-medical-blue hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {createUltrasoundExamMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handlePrint}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Request
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Ultrasounds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-blue dark:text-blue-400">Pending Ultrasound Examinations</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUltrasounds && pendingUltrasounds.length > 0 ? (
            <div className="space-y-4">
              {pendingUltrasounds.map((exam: UltrasoundExam) => (
                <div key={exam.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{exam.examId}</Badge>
                        <Badge variant={exam.priority === 'emergency' ? 'destructive' : exam.priority === 'urgent' ? 'default' : 'secondary'}>
                          {exam.priority}
                        </Badge>
                      </div>
                      <p className="font-medium">Patient: {exam.patientId}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Type: {exam.examType} • Requested: {exam.requestedDate}
                      </p>
                      {exam.clinicalIndication && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">{exam.clinicalIndication}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          console.log('Clicked ultrasound exam:', exam);
                          setSelectedUltrasoundExam(exam);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Enter Results
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No pending ultrasound examinations</p>
          )}
        </CardContent>
      </Card>

      {/* Results Entry Modal */}
      {selectedUltrasoundExam && (
        <Card className="border-2 border-medical-blue">
          <CardHeader>
            <CardTitle className="text-medical-blue dark:text-blue-400">
              Enter Ultrasound Results - {selectedUltrasoundExam.examId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...resultsForm}>
              <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={resultsForm.control}
                    name="imageQuality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Quality</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select quality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="adequate">Adequate</SelectItem>
                            <SelectItem value="limited">Limited</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resultsForm.control}
                    name="reportStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="abnormal">Abnormal</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resultsForm.control}
                    name="reportDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resultsForm.control}
                    name="sonographer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sonographer</FormLabel>
                        <FormControl>
                          <Input placeholder="Sonographer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={resultsForm.control}
                  name="findings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Findings</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed ultrasound findings..."
                          rows={4}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resultsForm.control}
                  name="impression"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impression</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Clinical impression and conclusion..."
                          rows={3}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resultsForm.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendations</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Follow-up recommendations..."
                          rows={2}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4 border-t">
                  <Button 
                    type="submit" 
                    disabled={updateUltrasoundExamMutation.isPending}
                    className="bg-medical-green hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {updateUltrasoundExamMutation.isPending ? "Saving..." : "Save Report"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setSelectedUltrasoundExam(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handlePrint}
                    className="ml-auto"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}