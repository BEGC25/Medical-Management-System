import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Printer, Check, Clock, Camera, FileImage } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
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

// Simple test categories for doctors to order
const commonTests = {
  hematology: [
    "Blood Film for Malaria (BFFM)",
    "Complete Blood Count (CBC)",
    "Hemoglobin (HB)",
    "Total White Blood Count (TWBC)", 
    "Blood Sugar (RBS/FBS)",
    "Blood Group & Rh",
    "ESR (Erythrocyte Sedimentation Rate)",
    "Rheumatoid Factor"
  ],
  serology: [
    "Widal Test (Typhoid)",
    "Brucella Test (B.A.T)",
    "VDRL (Syphilis)",
    "H. Pylori Test",
    "Hepatitis B Test (HBsAg)",
    "Hepatitis C Test (HCV)",
    "Pregnancy Test (HCG)",
    "HIV Test (RCT P24)"
  ],
  urine: [
    "Urine Analysis",
    "Urine Microscopy"
  ],
  parasitology: [
    "Stool Examination"
  ],
  biochemistry: [
    "Renal Function Test (RFT)",
    "Liver Function Test (LFT)",
    "Serum Cholesterol",
    "Serum Electrolytes",
    "Serum Uric Acid"
  ],
  hormones: [
    "Thyroid Function Test (T3, T4, TSH)",
    "Diabetes Panel",
    "Reproductive Hormones",
    "Cardiac Enzymes"
  ]
};

// Modern result fields with dropdown options and normal ranges
const resultFields = {
  "Urine Analysis": {
    "Appearance": {
      type: "select",
      options: ["Clear", "Slightly Cloudy", "Cloudy", "Turbid", "Bloody"],
      normal: "Clear"
    },
    "Protein": {
      type: "select", 
      options: ["Negative", "Trace", "+", "++", "+++", "++++"],
      normal: "Negative"
    },
    "Glucose": {
      type: "select",
      options: ["Negative", "Trace", "+", "++", "+++", "++++"],
      normal: "Negative"
    },
    "Acetone": {
      type: "select",
      options: ["Negative", "Trace", "+", "++", "+++"],
      normal: "Negative"
    },
    "Hb pigment": {
      type: "select",
      options: ["Negative", "Trace", "+", "++", "+++"],
      normal: "Negative"
    },
    "Leucocytes": {
      type: "select",
      options: ["Negative", "+", "++", "+++"],
      normal: "Negative"
    },
    "Nitrite": {
      type: "select",
      options: ["Negative", "Positive"],
      normal: "Negative"
    },
    "PH": {
      type: "number",
      range: "5.0-8.0",
      normal: "6.0-7.5"
    },
    "Specific Gravity": {
      type: "number",
      range: "1.003-1.030",
      normal: "1.010-1.025"
    },
    "Bilirubin": {
      type: "select",
      options: ["Negative", "+", "++", "+++"],
      normal: "Negative"
    }
  },
  "Urine Microscopy": {
    "Pus Cells": {
      type: "text",
      unit: "/hpf",
      normal: "0-5/hpf"
    },
    "RBC": {
      type: "text", 
      unit: "/hpf",
      normal: "0-2/hpf"
    },
    "Casts": {
      type: "select",
      options: ["None seen", "Hyaline", "Granular", "Cellular", "Waxy"],
      normal: "None seen"
    },
    "Crystals": {
      type: "select",
      options: ["None seen", "Uric acid", "Calcium oxalate", "Triple phosphate", "Amorphous"],
      normal: "None seen"
    },
    "Epithelial cells": {
      type: "select",
      options: ["Few", "Moderate", "Many"],
      normal: "Few"
    },
    "Yeast cells": {
      type: "select",
      options: ["None seen", "Few", "Moderate", "Many"],
      normal: "None seen"
    },
    "Trichomonas": {
      type: "select",
      options: ["Not seen", "Seen"],
      normal: "Not seen"
    },
    "Ova": {
      type: "select",
      options: ["None seen", "S. haematobium", "S. mansoni", "Other"],
      normal: "None seen"
    }
  },
  "Stool Examination": {
    "Appearance": {
      type: "select",
      options: ["Normal", "Loose", "Watery", "Bloody", "Mucoid", "Fatty"],
      normal: "Normal"
    },
    "Consistency": {
      type: "select",
      options: ["Formed", "Semi-formed", "Loose", "Watery"],
      normal: "Formed"
    },
    "Puss Cells": {
      type: "text",
      unit: "/hpf",
      normal: "0-2/hpf"
    },
    "RBC": {
      type: "text",
      unit: "/hpf", 
      normal: "0-2/hpf"
    },
    "Ova/Cyst": {
      type: "select",
      options: ["None seen", "Ascaris", "Hookworm", "E. histolytica", "G. lamblia", "Other"],
      normal: "None seen"
    },
    "Trophozoites": {
      type: "select",
      options: ["None seen", "E. histolytica", "G. lamblia", "Other"],
      normal: "None seen"
    }
  },
  "Complete Blood Count (CBC)": {
    "WBC Count": {
      type: "number",
      unit: "/μL",
      normal: "4,500-11,000"
    },
    "RBC Count": {
      type: "number", 
      unit: "million/μL",
      normal: "4.5-5.5 (M), 4.0-5.0 (F)"
    },
    "Hemoglobin": {
      type: "number",
      unit: "g/dL",
      normal: "14-18 (M), 12-16 (F)"
    },
    "Platelets": {
      type: "number",
      unit: "/μL", 
      normal: "150,000-450,000"
    }
  }
};

export default function Laboratory() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedLabTest, setSelectedLabTest] = useState<LabTest | null>(null);
  const [currentCategory, setCurrentCategory] = useState<keyof typeof commonTests>("hematology");
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [showLabReport, setShowLabReport] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertLabTest>({
    resolver: zodResolver(insertLabTestSchema),
    defaultValues: {
      patientId: "",
      category: "hematology",
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

  const { data: completedTests = [] } = useQuery({
    queryKey: ["/api/lab-tests"],
    select: (data: LabTest[]) => data.filter(test => test.status === 'completed'),
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

  const printLabRequest = () => {
    if (!selectedPatient || selectedTests.length === 0) {
      toast({ title: "Error", description: "Please select a patient and tests before printing", variant: "destructive" });
      return;
    }
    setShowLabRequest(true);
    setTimeout(() => {
      const done = () => setShowLabRequest(false);
      window.addEventListener("afterprint", done, { once: true });
      window.print();
    }, 50);
  };

  const printLabReport = () => {
    if (!selectedLabTest) {
      toast({ title: "Error", description: "Please select a lab test to print the report", variant: "destructive" });
      return;
    }
    setShowLabReport(true);
    setTimeout(() => {
      const done = () => setShowLabReport(false);
      window.addEventListener("afterprint", done, { once: true });
      window.print();
    }, 50);
  };

  return (
    <>

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
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      setCurrentCategory(value as keyof typeof commonTests);
                      setSelectedTests([]); // Clear selected tests when category changes
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hematology">Hematology</SelectItem>
                        <SelectItem value="serology">Serology</SelectItem>
                        <SelectItem value="urine">Urine Analysis</SelectItem>
                        <SelectItem value="parasitology">Parasitology</SelectItem>
                        <SelectItem value="biochemistry">Biochemistry</SelectItem>
                        <SelectItem value="hormones">Hormones</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Specific Tests</FormLabel>
                <div className="space-y-2 mt-2">
                  {commonTests[currentCategory].map((test) => (
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
                        value={field.value || ""}
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
                <Button type="button" variant="outline" onClick={() => printLabRequest()}>
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
              {(pendingTests as LabTest[] || []).map((test: LabTest) => {
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
              
              {!(pendingTests as LabTest[] || []).length && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No pending tests
                </p>
              )}
            </div>
          </div>

          {/* Completed Tests - For Review and Edit */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Completed Lab Tests (Click to Edit)</h3>
            <div className="space-y-2">
              {(completedTests as LabTest[] || []).map((test: LabTest) => {
                const tests = JSON.parse(test.tests || "[]");
                return (
                  <div 
                    key={test.id}
                    className="border border-green-200 dark:border-green-700 rounded-lg p-3 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                    onClick={() => handleLabTestSelect(test)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          Patient ID: {test.patientId} - {tests.join(", ")}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested: {test.requestedDate} | Completed: {test.reportDate}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {test.testId}
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </div>
                );
              })}
              
              {!(completedTests as LabTest[] || []).length && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No completed lab tests
                </p>
              )}
            </div>
          </div>

          {/* Results Entry Form */}
          {selectedLabTest && (
            <div>
              <h3 className="font-medium text-gray-800 mb-4 dark:text-gray-200">
                Enter Test Results - {selectedLabTest.testId}
                {selectedLabTest.status === 'completed' && (
                  <Badge className="ml-2 bg-blue-600 text-white">Editing Completed Results</Badge>
                )}
              </h3>
              
              {/* Photo Upload Section */}
              <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Lab Printout Photos
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Upload photos of CBC, chemistry, or other machine printouts to reduce manual typing. 
                  You can then type only the key abnormal values in the results section below.
                </p>
                
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760}
                  accept="image/*"
                  onGetUploadParameters={async () => {
                    const response = await fetch("/api/objects/upload", { method: "POST" });
                    const data = await response.json();
                    return { method: "PUT" as const, url: data.uploadURL };
                  }}
                  onComplete={async (uploadedFiles) => {
                    const attachments = uploadedFiles.map(file => ({
                      url: file.url,
                      name: file.name,
                      type: "lab_printout"
                    }));
                    
                    try {
                      const response = await fetch(`/api/lab-tests/${selectedLabTest.testId}/attachments`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ attachments })
                      });
                      
                      if (response.ok) {
                        toast({
                          title: "Success",
                          description: "Lab printout photos uploaded successfully!"
                        });
                        
                        queryClient.invalidateQueries({ queryKey: ["/api/lab-tests", "pending"] });
                      } else {
                        throw new Error("Upload failed");
                      }
                    } catch (error) {
                      console.error("Upload error:", error);
                      toast({
                        title: "Error",
                        description: "Failed to save uploaded photos",
                        variant: "destructive"
                      });
                    }
                  }}
                  buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Lab Photos
                </ObjectUploader>
                
                {/* Display existing attachments */}
                {selectedLabTest.attachments && (
                  <div className="mt-4">
                    <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Uploaded Photos:
                    </h6>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedLabTest.attachments).map((attachment: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 bg-white dark:bg-gray-700 p-2 rounded border">
                          <FileImage className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{attachment.name}</span>
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-4">
                {/* Detailed Result Fields based on ordered tests */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detailed Test Results
                  </label>
                  {JSON.parse(selectedLabTest.tests || "[]").map((orderedTest: string) => {
                    const fields = resultFields[orderedTest as keyof typeof resultFields];
                    if (!fields) return null;
                    
                    return (
                      <div key={orderedTest} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          {orderedTest}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(fields).map(([fieldName, config]) => (
                            <div key={fieldName} className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                {fieldName}
                                {config.normal && (
                                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                    Normal: {config.normal}
                                  </span>
                                )}
                              </label>
                              
                              {config.type === "select" ? (
                                <Select>
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select value..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {config.options?.map((option) => (
                                      <SelectItem 
                                        key={option} 
                                        value={option}
                                        className={option === config.normal ? "bg-green-50 dark:bg-green-900/30" : ""}
                                      >
                                        {option === config.normal && "✓ "}{option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="relative">
                                  <Input 
                                    type={config.type}
                                    placeholder={config.type === "number" ? "Enter value..." : "Enter result..."}
                                    className="text-sm pr-12"
                                  />
                                  {config.unit && (
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                      {config.unit}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {config.range && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Range: {config.range}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Quick action buttons for common results */}
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"
                            >
                              ✓ All Normal
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                            >
                              📋 Copy Previous
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall Summary / Additional Results
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Enter overall summary or any additional findings not covered above..."
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
                  <Button type="button" variant="outline" onClick={() => printLabReport()}>
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

      {/* Lab Request Print Modal */}
      {showLabRequest && selectedPatient && (
        <div>
          <Card className="border-2 border-medical-green">
            <CardContent className="p-6">
              <div
                id="lab-request-print"
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
                    LABORATORY TEST REQUEST
                  </p>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  {/* Patient Info */}
                  <div className="avoid-break mb-6">
                    <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Patient Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</div>
                      <div><strong>Patient ID:</strong> {selectedPatient.patientId}</div>
                      <div><strong>Phone:</strong> {selectedPatient.phoneNumber}</div>
                      <div><strong>Date of Birth:</strong> {selectedPatient.dateOfBirth}</div>
                    </div>
                  </div>

                  {/* Test Details */}
                  <div className="avoid-break mb-6">
                    <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Test Information</h3>
                    <div className="text-sm space-y-2">
                      <div><strong>Category:</strong> {form.watch("category")}</div>
                      <div><strong>Priority:</strong> {form.watch("priority")}</div>
                      <div><strong>Requested Date:</strong> {form.watch("requestedDate")}</div>
                      <div><strong>Tests Requested:</strong></div>
                      <ul className="ml-6 list-disc avoid-break">
                        {selectedTests.map((test, index) => (
                          <li key={index}>{test}</li>
                        ))}
                      </ul>
                      {form.watch("clinicalInfo") && (
                        <div><strong>Clinical Information:</strong> {form.watch("clinicalInfo")}</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t">
                  <p className="mt-6">Requesting Doctor: ____________________</p>
                  <p className="text-xs text-gray-500 mt-4 text-center">Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
                </div>
              </div>
              <div className="text-center mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="mr-4"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Request
                </Button>
                <Button variant="outline" onClick={() => setShowLabRequest(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lab Report Print Modal */}
      {showLabReport && selectedLabTest && (
        <div>
          <Card className="border-2 border-medical-green">
            <CardContent className="p-6">
              <div
                id="lab-report-print"
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
                    LABORATORY REPORT
                  </p>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  {/* Patient and Test Info */}
                  <div className="avoid-break mb-6">
                    <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Patient Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Patient ID:</strong> {selectedLabTest.patientId}</div>
                      <div><strong>Test ID:</strong> {selectedLabTest.testId}</div>
                      <div><strong>Requested Date:</strong> {selectedLabTest.requestedDate}</div>
                      <div><strong>Completed Date:</strong> {resultsForm.watch("completedDate")}</div>
                    </div>
                  </div>

                  {/* Tests Performed */}
                  <div className="avoid-break mb-6">
                    <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Tests Performed</h3>
                    <ul className="ml-6 list-disc text-sm avoid-break">
                      {JSON.parse(selectedLabTest.tests || "[]").map((test: string, index: number) => (
                        <li key={index}>{test}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Results */}
                  <div className="avoid-break mb-6">
                    <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Results</h3>
                    <div className="text-sm space-y-4">
                      <div>
                        <strong>Test Results:</strong>
                        <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50 whitespace-pre-wrap">
                          {resultsForm.watch("results")}
                        </div>
                      </div>
                      
                      {resultsForm.watch("normalValues") && (
                        <div>
                          <strong>Normal Values Reference:</strong>
                          <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50 whitespace-pre-wrap">
                            {resultsForm.watch("normalValues")}
                          </div>
                        </div>
                      )}

                      <div><strong>Result Status:</strong> {resultsForm.watch("resultStatus")}</div>

                      {resultsForm.watch("technicianNotes") && (
                        <div>
                          <strong>Technician Notes:</strong>
                          <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50 whitespace-pre-wrap">
                            {resultsForm.watch("technicianNotes")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t">
                  <p className="mt-6">Lab Technician: ____________________</p>
                  <p className="text-xs text-gray-500 mt-4 text-center">Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
                </div>
              </div>
              <div className="text-center mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="mr-4"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
                <Button variant="outline" onClick={() => setShowLabReport(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
