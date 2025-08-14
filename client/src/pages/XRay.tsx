import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Printer, Check, Clock, AlertTriangle } from "lucide-react";
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
import ClinicHeader from "@/components/ClinicHeader";
import { insertXrayExamSchema, type InsertXrayExam, type Patient, type XrayExam } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

export default function XRay() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedXrayExam, setSelectedXrayExam] = useState<XrayExam | null>(null);
  const [safetyChecklist, setSafetyChecklist] = useState({
    notPregnant: false,
    metalRemoved: false,
    canCooperate: false,
  });
  const [showXrayRequest, setShowXrayRequest] = useState(false);
  const [showXrayReport, setShowXrayReport] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertXrayExam>({
    resolver: zodResolver(insertXrayExamSchema),
    defaultValues: {
      patientId: "",
      examType: "chest",
      bodyPart: "",
      clinicalIndication: "",
      specialInstructions: "",
      priority: "routine",
      requestedDate: new Date().toISOString().split('T')[0],
    },
  });

  const resultsForm = useForm({
    defaultValues: {
      technicalQuality: "good" as "excellent" | "good" | "adequate" | "limited",
      findings: "",
      impression: "",
      recommendations: "",
      reportStatus: "normal" as "normal" | "abnormal" | "urgent",
      reportDate: new Date().toISOString().split('T')[0],
      radiologist: "",
    },
  });

  const { data: pendingXrays } = useQuery({
    queryKey: ["/api/xray-exams", "pending"],
  });

  const createXrayExamMutation = useMutation({
    mutationFn: async (data: InsertXrayExam) => {
      const response = await apiRequest("POST", "/api/xray-exams", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "X-Ray examination request submitted successfully",
      });
      form.reset();
      setSelectedPatient(null);
      setSafetyChecklist({ notPregnant: false, metalRemoved: false, canCooperate: false });
      queryClient.invalidateQueries({ queryKey: ["/api/xray-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'xray_exam',
          action: 'create',
          data: form.getValues(),
        });
        toast({
          title: "Saved Offline",
          description: "X-Ray request saved locally. Will sync when online.",
        });
        form.reset();
        setSelectedPatient(null);
        setSafetyChecklist({ notPregnant: false, metalRemoved: false, canCooperate: false });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit X-Ray request",
          variant: "destructive",
        });
      }
    },
  });

  const updateXrayExamMutation = useMutation({
    mutationFn: async ({ examId, data }: { examId: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/xray-exams/${examId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "X-Ray report saved successfully",
      });
      resultsForm.reset();
      setSelectedXrayExam(null);
      queryClient.invalidateQueries({ queryKey: ["/api/xray-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'xray_exam',
          action: 'update',
          data: { examId: selectedXrayExam?.examId, ...resultsForm.getValues() },
        });
        toast({
          title: "Saved Offline",
          description: "X-Ray report saved locally. Will sync when online.",
        });
        resultsForm.reset();
        setSelectedXrayExam(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to save X-Ray report",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmitRequest = (data: InsertXrayExam) => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }
    
    // Check safety requirements for certain patient types
    const isPregnancyRelevant = selectedPatient.gender === 'female' && 
      selectedPatient.dateOfBirth && 
      (new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()) >= 12;
    
    if (isPregnancyRelevant && !safetyChecklist.notPregnant) {
      toast({
        title: "Safety Check Required",
        description: "Please confirm pregnancy status for female patients",
        variant: "destructive",
      });
      return;
    }
    
    createXrayExamMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
    });
  };

  const onSubmitResults = (data: any) => {
    if (!selectedXrayExam) return;
    
    updateXrayExamMutation.mutate({
      examId: selectedXrayExam.examId,
      data: {
        ...data,
        status: "completed",
      },
    });
  };

  const handleXrayExamSelect = (xrayExam: XrayExam) => {
    setSelectedXrayExam(xrayExam);
    resultsForm.reset({
      technicalQuality: xrayExam.technicalQuality || "good",
      findings: xrayExam.findings || "",
      impression: xrayExam.impression || "",
      recommendations: xrayExam.recommendations || "",
      reportStatus: xrayExam.reportStatus || "normal",
      reportDate: xrayExam.reportDate || new Date().toISOString().split('T')[0],
      radiologist: xrayExam.radiologist || "",
    });
  };

  // Isolated window printing helper
  const printIsolated = (html: string, title = "Print") => {
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return;

    const css = `
      <style>
        @page { size: A4; margin: 12mm; }
        html, body { margin: 0; padding: 0; }
        .rx-print {
          width: 210mm;
          min-height: calc(297mm - 24mm); /* inside page margins */
          padding: 10mm;
          box-sizing: border-box;
          display: flex; flex-direction: column;
        }
        .mt-auto { margin-top: auto !important; } /* pin footer to bottom */
        /* Safety: if content is just a tad tall, gently scale to fit */
        .fit { transform: scale(0.98); transform-origin: top left; }
      </style>
    `;

    w.document.write(`<html><head><title>${title}</title>${css}</head><body>${html}</body></html>`);
    w.document.close();

    // Give the new window a tick to render before printing
    setTimeout(() => { w.focus(); w.print(); w.close(); }, 200);
  };

  const printXrayRequest = () => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient before printing", variant: "destructive" });
      return;
    }
    setShowXrayRequest(true);
    setTimeout(() => {
      const node = document.getElementById("xray-request-print");
      if (node) printIsolated(`<div class="rx-print fit">${node.innerHTML}</div>`, "X-Ray Request");
      setShowXrayRequest(false);
    }, 50);
  };

  const printXrayReport = () => {
    if (!selectedXrayExam) {
      toast({ title: "Error", description: "Please select an X-ray examination to print the report", variant: "destructive" });
      return;
    }
    setShowXrayReport(true);
    setTimeout(() => {
      const node = document.getElementById("xray-report-print");
      if (node) printIsolated(`<div class="rx-print fit">${node.innerHTML}</div>`, "X-Ray Report");
      setShowXrayReport(false);
    }, 50);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* X-Ray Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>X-Ray Examination Request</CardTitle>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {selectedPatient.patientId} | Gender: {selectedPatient.gender || 'Unknown'}
                    </p>
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
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Examination Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="chest">Chest X-Ray</SelectItem>
                        <SelectItem value="abdomen">Abdominal X-Ray</SelectItem>
                        <SelectItem value="spine">Spine X-Ray</SelectItem>
                        <SelectItem value="extremities">Extremities</SelectItem>
                        <SelectItem value="pelvis">Pelvis X-Ray</SelectItem>
                        <SelectItem value="skull">Skull X-Ray</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyPart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Area/Body Part</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Left ankle, Right shoulder, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clinicalIndication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Indication</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Reason for X-ray, symptoms, suspected condition..."
                        rows={3}
                        {...field}
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
                        placeholder="Any special positioning or techniques required..."
                        rows={2}
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

              {/* Safety Checklist */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                  Safety Checklist
                </h4>
                <div className="space-y-2">
                  {selectedPatient?.gender === 'female' && selectedPatient.dateOfBirth && 
                   (new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()) >= 12 && (
                    <label className="flex items-center">
                      <Checkbox
                        checked={safetyChecklist.notPregnant}
                        onCheckedChange={(checked) => 
                          setSafetyChecklist(prev => ({ ...prev, notPregnant: !!checked }))
                        }
                      />
                      <span className="ml-2 text-sm">Patient not pregnant (if applicable)</span>
                    </label>
                  )}
                  <label className="flex items-center">
                    <Checkbox
                      checked={safetyChecklist.metalRemoved}
                      onCheckedChange={(checked) => 
                        setSafetyChecklist(prev => ({ ...prev, metalRemoved: !!checked }))
                      }
                    />
                    <span className="ml-2 text-sm">Metal objects removed</span>
                  </label>
                  <label className="flex items-center">
                    <Checkbox
                      checked={safetyChecklist.canCooperate}
                      onCheckedChange={(checked) => 
                        setSafetyChecklist(prev => ({ ...prev, canCooperate: !!checked }))
                      }
                    />
                    <span className="ml-2 text-sm">Patient can cooperate with positioning</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createXrayExamMutation.isPending}
                  className="bg-medical-blue hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createXrayExamMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
                <Button type="button" variant="outline" onClick={printXrayRequest}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* X-Ray Results & Reports */}
      <Card>
        <CardHeader>
          <CardTitle>X-Ray Results & Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pending X-Rays */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Pending X-Ray Examinations</h3>
            <div className="space-y-2">
              {pendingXrays?.map((xray: XrayExam) => (
                <div 
                  key={xray.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleXrayExamSelect(xray)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        Patient ID: {xray.patientId} - {xray.examType.charAt(0).toUpperCase() + xray.examType.slice(1)} X-Ray
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requested: {xray.requestedDate}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {xray.examId}
                      </p>
                      {xray.bodyPart && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Area: {xray.bodyPart}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-attention-orange text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
              
              {!pendingXrays?.length && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No pending X-ray examinations
                </p>
              )}
            </div>
          </div>

          {/* Report Entry Form */}
          {selectedXrayExam && (
            <div>
              <h3 className="font-medium text-gray-800 mb-4 dark:text-gray-200">
                X-Ray Report - {selectedXrayExam.examId}
              </h3>
              <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Technical Quality
                  </label>
                  <Select 
                    value={resultsForm.watch("technicalQuality")}
                    onValueChange={(value) => resultsForm.setValue("technicalQuality", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="adequate">Adequate</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Findings
                  </label>
                  <Textarea
                    rows={6}
                    placeholder="Detailed radiological findings..."
                    {...resultsForm.register("findings")}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Impression/Diagnosis
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Radiological impression and diagnosis..."
                    {...resultsForm.register("impression")}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommendations
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Follow-up recommendations..."
                    {...resultsForm.register("recommendations")}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Report Status
                    </label>
                    <Select 
                      value={resultsForm.watch("reportStatus")}
                      onValueChange={(value) => resultsForm.setValue("reportStatus", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="abnormal">Abnormal</SelectItem>
                        <SelectItem value="urgent">Urgent - Immediate attention needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Report Date
                    </label>
                    <Input 
                      type="date" 
                      {...resultsForm.register("reportDate")}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Radiologist/Reporter
                  </label>
                  <Input 
                    placeholder="Name of reporting physician"
                    {...resultsForm.register("radiologist")}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateXrayExamMutation.isPending}
                    className="bg-health-green hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {updateXrayExamMutation.isPending ? "Saving..." : "Save Report"}
                  </Button>
                  <Button type="button" variant="outline" onClick={printXrayReport}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* X-Ray Request Print Modal */}
      {showXrayRequest && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-xl">
            <div
              id="xray-request-print"
              className="rx-print"
            >
                <ClinicHeader title="X-RAY EXAMINATION REQUEST" />

                {/* Patient Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</div>
                    <div><strong>Patient ID:</strong> {selectedPatient.patientId}</div>
                    <div><strong>Age:</strong> {selectedPatient.dateOfBirth ? 
                      (new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()) : 'Not specified'} years</div>
                    <div><strong>Gender:</strong> {selectedPatient.gender}</div>
                    <div><strong>Phone:</strong> {selectedPatient.phoneNumber || 'Not provided'}</div>
                    <div><strong>Village:</strong> {selectedPatient.village || 'Not specified'}</div>
                  </div>
                </div>

                {/* Examination Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Examination Information</h3>
                  <div className="text-sm space-y-2">
                    <div><strong>Examination Type:</strong> {form.watch("examType")?.charAt(0).toUpperCase() + form.watch("examType")?.slice(1)} X-Ray</div>
                    <div><strong>Body Part:</strong> {form.watch("bodyPart")}</div>
                    <div><strong>Clinical Indication:</strong> {form.watch("clinicalIndication")}</div>
                    <div><strong>Priority:</strong> {form.watch("priority")?.charAt(0).toUpperCase() + form.watch("priority")?.slice(1)}</div>
                    <div><strong>Requested Date:</strong> {form.watch("requestedDate")}</div>
                    {form.watch("specialInstructions") && (
                      <div><strong>Special Instructions:</strong> {form.watch("specialInstructions")}</div>
                    )}
                  </div>
                </div>

                {/* Safety Checklist */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Safety Checklist</h3>
                  <div className="text-sm space-y-1">
                    <div>✓ Patient not pregnant (if applicable): {safetyChecklist.notPregnant ? 'Confirmed' : 'N/A'}</div>
                    <div>✓ Metal objects removed: {safetyChecklist.metalRemoved ? 'Yes' : 'No'}</div>
                    <div>✓ Patient can cooperate: {safetyChecklist.canCooperate ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t">
                  <p className="mt-6">Requesting Doctor: ____________________</p>
                  <p className="text-xs text-gray-500 mt-4 text-center">Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
                </div>
              </div>

            {/* Print Button */}
            <div className="flex gap-3 pt-4 print:hidden bg-gray-50 p-4 border-t">
              <Button onClick={() => window.print()} className="bg-medical-blue hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" />
                Print Request
              </Button>
              <Button variant="outline" onClick={() => setShowXrayRequest(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* X-Ray Report Print Modal */}
      {showXrayReport && selectedXrayExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-xl">
            <div
              id="xray-report-print"
              className="rx-print"
            >
                <ClinicHeader title="X-RAY EXAMINATION REPORT" />

                {/* Patient and Exam Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Patient ID:</strong> {selectedXrayExam.patientId}</div>
                    <div><strong>Exam ID:</strong> {selectedXrayExam.examId}</div>
                    <div><strong>Examination Type:</strong> {selectedXrayExam.examType?.charAt(0).toUpperCase() + selectedXrayExam.examType?.slice(1)} X-Ray</div>
                    <div><strong>Body Part:</strong> {selectedXrayExam.bodyPart}</div>
                    <div><strong>Requested Date:</strong> {selectedXrayExam.requestedDate}</div>
                    <div><strong>Report Date:</strong> {resultsForm.watch("reportDate")}</div>
                  </div>
                </div>

                {/* Clinical Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Clinical Information</h3>
                  <div className="text-sm space-y-2">
                    <div><strong>Clinical Indication:</strong> {selectedXrayExam.clinicalIndication}</div>
                    <div><strong>Technical Quality:</strong> {resultsForm.watch("technicalQuality")?.charAt(0).toUpperCase() + resultsForm.watch("technicalQuality")?.slice(1)}</div>
                  </div>
                </div>

                {/* Findings & Report */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">Radiological Report</h3>
                  <div className="text-sm space-y-4">
                    <div>
                      <strong>Findings:</strong>
                      <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50 whitespace-pre-wrap">
                        {resultsForm.watch("findings") || "No significant findings reported."}
                      </div>
                    </div>
                    
                    <div>
                      <strong>Impression:</strong>
                      <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50 whitespace-pre-wrap">
                        {resultsForm.watch("impression") || "Normal examination."}
                      </div>
                    </div>

                    {resultsForm.watch("recommendations") && (
                      <div>
                        <strong>Recommendations:</strong>
                        <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50 whitespace-pre-wrap">
                          {resultsForm.watch("recommendations")}
                        </div>
                      </div>
                    )}

                    <div><strong>Report Status:</strong> {resultsForm.watch("reportStatus")?.charAt(0).toUpperCase() + resultsForm.watch("reportStatus")?.slice(1)}</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p>Radiologist: {resultsForm.watch("radiologist") || "____________________"}</p>
                      <p className="mt-4">Signature: ____________________</p>
                    </div>
                    <div>
                      <p>Date: {resultsForm.watch("reportDate")}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
                </div>
              </div>

            {/* Print Button */}
            <div className="flex gap-3 pt-4 print:hidden bg-gray-50 p-4 border-t">
              <Button onClick={() => window.print()} className="bg-medical-blue hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button variant="outline" onClick={() => setShowXrayReport(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
