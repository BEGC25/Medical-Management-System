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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { insertLabTestSchema, type InsertLabTest, type Patient, type LabTest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

const commonTests = [
  "Complete Blood Count (CBC)",
  "Blood Sugar (Random/Fasting)",
  "Malaria Test",
  "HIV Test",
  "Tuberculosis Test",
  "Urine Analysis",
  "Hepatitis B Test",
  "Pregnancy Test",
  "Blood Group & Rh",
  "ESR (Erythrocyte Sedimentation Rate)"
];

export default function Laboratory() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedLabTest, setSelectedLabTest] = useState<LabTest | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertLabTest>({
    resolver: zodResolver(insertLabTestSchema),
    defaultValues: {
      patientId: "",
      category: "blood",
      tests: "",
      clinicalInfo: "",
      priority: "routine",
      requestedDate: new Date().toISOString().split('T')[0],
    },
  });

  const resultsForm = useForm({
    defaultValues: {
      results: "",
      normalValues: "",
      resultStatus: "normal" as "normal" | "abnormal" | "critical",
      completedDate: new Date().toISOString().split('T')[0],
      technicianNotes: "",
    },
  });

  const { data: pendingTests } = useQuery({
    queryKey: ["/api/lab-tests", "pending"],
  });

  const createLabTestMutation = useMutation({
    mutationFn: async (data: InsertLabTest) => {
      const response = await apiRequest("POST", "/api/lab-tests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lab test request submitted successfully",
      });
      form.reset();
      setSelectedPatient(null);
      setSelectedTests([]);
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'lab_test',
          action: 'create',
          data: { ...form.getValues(), tests: JSON.stringify(selectedTests) },
        });
        toast({
          title: "Saved Offline",
          description: "Lab test request saved locally. Will sync when online.",
        });
        form.reset();
        setSelectedPatient(null);
        setSelectedTests([]);
      } else {
        toast({
          title: "Error",
          description: "Failed to submit lab test request",
          variant: "destructive",
        });
      }
    },
  });

  const updateLabTestMutation = useMutation({
    mutationFn: async ({ testId, data }: { testId: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/lab-tests/${testId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lab test results saved successfully",
      });
      resultsForm.reset();
      setSelectedLabTest(null);
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'lab_test',
          action: 'update',
          data: { testId: selectedLabTest?.testId, ...resultsForm.getValues() },
        });
        toast({
          title: "Saved Offline",
          description: "Lab test results saved locally. Will sync when online.",
        });
        resultsForm.reset();
        setSelectedLabTest(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to save lab test results",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmitRequest = (data: InsertLabTest) => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive",
      });
      return;
    }
    
    createLabTestMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
      tests: JSON.stringify(selectedTests),
    });
  };

  const onSubmitResults = (data: any) => {
    if (!selectedLabTest) return;
    
    updateLabTestMutation.mutate({
      testId: selectedLabTest.testId,
      data: {
        ...data,
        status: "completed",
      },
    });
  };

  const handleTestToggle = (test: string) => {
    setSelectedTests(prev => 
      prev.includes(test) 
        ? prev.filter(t => t !== test)
        : [...prev, test]
    );
  };

  const handleLabTestSelect = (labTest: LabTest) => {
    setSelectedLabTest(labTest);
    resultsForm.reset({
      results: labTest.results || "",
      normalValues: labTest.normalValues || "",
      resultStatus: labTest.resultStatus || "normal",
      completedDate: labTest.completedDate || new Date().toISOString().split('T')[0],
      technicianNotes: labTest.technicianNotes || "",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lab Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Laboratory Test Request</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Patient Selection */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Patient</h3>
            {!selectedPatient ? (
              <PatientSearch onSelectPatient={setSelectedPatient} showActions={false} />
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ID: {selectedPatient.patientId}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="blood">Blood Tests</SelectItem>
                        <SelectItem value="urine">Urine Tests</SelectItem>
                        <SelectItem value="stool">Stool Tests</SelectItem>
                        <SelectItem value="microbiology">Microbiology</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Specific Tests</FormLabel>
                <div className="space-y-2 mt-2">
                  {commonTests.map((test) => (
                    <label key={test} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedTests.includes(test)}
                        onCheckedChange={() => handleTestToggle(test)}
                      />
                      <span className="text-sm">{test}</span>
                    </label>
                  ))}
                </div>
                {selectedTests.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Selected: {selectedTests.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="clinicalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Information</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Symptoms, suspected diagnosis, relevant clinical information..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="stat">STAT</SelectItem>
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

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createLabTestMutation.isPending}
                  className="bg-medical-blue hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createLabTestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
                <Button type="button" variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Lab Results Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Laboratory Results</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pending Tests */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Pending Tests</h3>
            <div className="space-y-2">
              {pendingTests?.map((test: LabTest) => {
                const tests = JSON.parse(test.tests || "[]");
                return (
                  <div 
                    key={test.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleLabTestSelect(test)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          Patient ID: {test.patientId} - {tests.join(", ")}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested: {test.requestedDate}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {test.testId}
                        </p>
                      </div>
                      <Badge className="bg-attention-orange text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </div>
                );
              })}
              
              {!pendingTests?.length && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No pending tests
                </p>
              )}
            </div>
          </div>

          {/* Results Entry Form */}
          {selectedLabTest && (
            <div>
              <h3 className="font-medium text-gray-800 mb-4 dark:text-gray-200">
                Enter Test Results - {selectedLabTest.testId}
              </h3>
              <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Results
                  </label>
                  <Textarea
                    rows={6}
                    placeholder="Enter detailed test results..."
                    {...resultsForm.register("results")}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Normal Values Reference
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Reference ranges for normal values..."
                    {...resultsForm.register("normalValues")}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Result Status
                    </label>
                    <Select 
                      value={resultsForm.watch("resultStatus")}
                      onValueChange={(value) => resultsForm.setValue("resultStatus", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="abnormal">Abnormal</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Completed Date
                    </label>
                    <Input 
                      type="date" 
                      {...resultsForm.register("completedDate")}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lab Technician Notes
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Additional notes or observations..."
                    {...resultsForm.register("technicianNotes")}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateLabTestMutation.isPending}
                    className="bg-health-green hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {updateLabTestMutation.isPending ? "Saving..." : "Save Results"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
