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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const printXrayRequest = () => {
    if (!selectedPatient || !form.getValues("examType")) {
      toast({
        title: "Incomplete Information",
        description: "Please select a patient and examination type before printing.",
        variant: "destructive",
      });
      return;
    }

    console.log("X-ray Print: selectedPatient data:", selectedPatient);
    console.log("X-ray Print: Patient age:", selectedPatient.age);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formData = form.getValues();
    const currentDate = new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>X-Ray Request - ${selectedPatient.patientId}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              body { margin: 0; }
              .request-container {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                box-sizing: border-box;
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
              }
            }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .clinic-subtitle { font-size: 14px; color: #666; margin-bottom: 10px; }
            .request-title { font-size: 20px; font-weight: bold; color: #16a34a; margin-top: 15px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="request-container">
            <div class="header">
              <div class="clinic-name">BAHR EL GHAZAL CLINIC</div>
              <div class="clinic-subtitle">Your Health, Our Priority</div>
              <div class="clinic-subtitle">Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com</div>
              <div class="request-title">X-RAY EXAMINATION REQUEST</div>
            </div>

            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-grid">
                <div>
                  <div class="info-item"><span class="label">Patient Name:</span> ${selectedPatient.firstName} ${selectedPatient.lastName}</div>
                  <div class="info-item"><span class="label">Patient ID:</span> ${selectedPatient.patientId}</div>
                  <div class="info-item"><span class="label">Age:</span> ${selectedPatient.age || 'Age not found'}</div>
                  <div class="info-item"><span class="label">Gender:</span> ${selectedPatient.gender || 'Not specified'}</div>
                </div>
                <div>
                  <div class="info-item"><span class="label">Phone:</span> ${selectedPatient.phoneNumber || 'Not provided'}</div>
                  <div class="info-item"><span class="label">Village:</span> ${selectedPatient.village || 'Not specified'}</div>
                  <div class="info-item"><span class="label">Request Date:</span> ${currentDate}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Examination Details</div>
              <div class="info-item"><span class="label">Examination Type:</span> ${formData.examType?.charAt(0).toUpperCase() + formData.examType?.slice(1)} X-Ray</div>
              ${formData.bodyPart ? `<div class="info-item"><span class="label">Body Part/Area:</span> ${formData.bodyPart}</div>` : ''}

              <div class="info-item"><span class="label">Requested Date:</span> ${formData.requestedDate}</div>
            </div>

            ${formData.clinicalIndication ? `
            <div class="section">
              <div class="section-title">Clinical Indication</div>
              <div style="background: #f9fafb; padding: 15px; border-radius: 5px; white-space: pre-line;">${formData.clinicalIndication}</div>
            </div>
            ` : ''}

            ${formData.specialInstructions ? `
            <div class="section">
              <div class="section-title">Special Instructions</div>
              <div style="background: #f9fafb; padding: 15px; border-radius: 5px; white-space: pre-line;">${formData.specialInstructions}</div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Safety Checklist</div>
              <div class="info-item">☐ Patient pregnancy status confirmed (if applicable)</div>
              <div class="info-item">☐ Metal objects removed</div>
              <div class="info-item">☐ Patient can cooperate with positioning</div>
            </div>

            <div class="footer">
              <p>Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const printXrayReport = () => {
    if (!selectedXrayExam) {
      toast({
        title: "No Report Selected",
        description: "Please select an X-ray examination to print the report.",
        variant: "destructive",
      });
      return;
    }

    console.log("X-ray Report Print: selectedPatient data:", selectedPatient);
    console.log("X-ray Report Print: Patient age:", selectedPatient?.age);
    console.log("X-ray Report Print: selectedXrayExam:", selectedXrayExam);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportData = resultsForm.getValues();
    const currentDate = new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>X-Ray Report - ${selectedXrayExam.examId}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              body { margin: 0; }
              .report-container {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                box-sizing: border-box;
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
              }
            }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .clinic-subtitle { font-size: 14px; color: #666; margin-bottom: 10px; }
            .report-title { font-size: 20px; font-weight: bold; color: #16a34a; margin-top: 15px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
            .findings-box { background: #f9fafb; padding: 15px; border-radius: 5px; white-space: pre-line; min-height: 100px; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div class="clinic-name">BAHR EL GHAZAL CLINIC</div>
              <div class="clinic-subtitle">Your Health, Our Priority</div>
              <div class="clinic-subtitle">Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com</div>
              <div class="report-title">X-RAY EXAMINATION REPORT</div>
            </div>

            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-grid">
                <div>
                  <div class="info-item"><span class="label">Patient Name:</span> ${selectedPatient?.firstName} ${selectedPatient?.lastName}</div>
                  <div class="info-item"><span class="label">Patient ID:</span> ${selectedXrayExam.patientId}</div>
                  <div class="info-item"><span class="label">Age:</span> ${selectedPatient?.age || 'Not provided'}</div>
                </div>
                <div>
                  <div class="info-item"><span class="label">Gender:</span> ${selectedPatient?.gender || 'Not specified'}</div>
                  <div class="info-item"><span class="label">Phone:</span> ${selectedPatient?.phoneNumber || 'Not provided'}</div>
                  <div class="info-item"><span class="label">Village:</span> ${selectedPatient?.village || 'Not specified'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Examination Information</div>
              <div class="info-grid">
                <div>
                  <div class="info-item"><span class="label">Exam ID:</span> ${selectedXrayExam.examId}</div>
                  <div class="info-item"><span class="label">Examination Type:</span> ${selectedXrayExam.examType?.charAt(0).toUpperCase() + selectedXrayExam.examType?.slice(1)} X-Ray</div>
                  <div class="info-item"><span class="label">Body Part:</span> ${selectedXrayExam.bodyPart || 'Not specified'}</div>
                </div>
                <div>
                  <div class="info-item"><span class="label">Requested Date:</span> ${selectedXrayExam.requestedDate}</div>
                  <div class="info-item"><span class="label">Report Date:</span> ${reportData.reportDate || currentDate}</div>

                </div>
              </div>
            </div>

            ${selectedXrayExam.clinicalIndication ? `
            <div class="section">
              <div class="section-title">Clinical Indication</div>
              <div class="findings-box">${selectedXrayExam.clinicalIndication}</div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Findings</div>
              <div class="findings-box">${reportData.findings || 'No findings recorded'}</div>
            </div>

            <div class="section">
              <div class="section-title">Impression</div>
              <div class="findings-box">${reportData.impression || 'No impression recorded'}</div>
            </div>

            ${reportData.recommendations ? `
            <div class="section">
              <div class="section-title">Recommendations</div>
              <div class="findings-box">${reportData.recommendations}</div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Reporting Physician</div>
              <div class="info-item">
                <span class="label">Radiologist:</span> ${reportData.radiologist || '_________________________'}
              </div>
              <div style="margin-top: 30px;">
                <span class="label">Signature:</span> ___________________________ 
                <span style="margin-left: 40px;"><span class="label">Date:</span> ${reportData.reportDate || currentDate}</span>
              </div>
            </div>

            <div class="footer">
              <p>Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

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

  const { data: pendingXrays = [] } = useQuery({
    queryKey: ["/api/xray-exams"],
    select: (data: XrayExam[]) => data.filter(exam => exam.status === 'pending'),
  });

  const { data: completedXrays = [] } = useQuery({
    queryKey: ["/api/xray-exams"],
    select: (data: XrayExam[]) => data.filter(exam => exam.status === 'completed'),
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
      selectedPatient.age && 
      parseInt(selectedPatient.age) >= 12;
    
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

  const handleXrayExamSelect = async (xrayExam: XrayExam) => {
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
    
    // Load patient data for the selected exam
    try {
      const response = await fetch(`/api/patients`);
      const patients = await response.json();
      const patient = patients.find((p: Patient) => p.patientId === xrayExam.patientId);
      if (patient) {
        setSelectedPatient(patient);
        console.log("Loaded patient for X-ray exam:", patient);
      }
    } catch (error) {
      console.error("Failed to load patient for X-ray exam:", error);
    }
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
                      ID: {selectedPatient.patientId} | Age: {selectedPatient.age || 'Unknown'} | Gender: {selectedPatient.gender || 'Unknown'}
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
                      <Input placeholder="e.g., Left ankle, Right shoulder, etc." {...field} value={field.value || ""} />
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
                        placeholder="Any special positioning or techniques required..."
                        rows={2}
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

              {/* Safety Checklist */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                  Safety Checklist
                </h4>
                <div className="space-y-2">
                  {selectedPatient?.gender === 'female' && selectedPatient.age && 
                   parseInt(selectedPatient.age) >= 12 && (
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

          {/* Completed X-Rays - For Review and Edit */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Completed X-Ray Reports (Click to Edit)</h3>
            <div className="space-y-2">
              {completedXrays?.map((xray: XrayExam) => (
                <div 
                  key={xray.id}
                  className="border border-green-200 dark:border-green-700 rounded-lg p-3 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                  onClick={() => handleXrayExamSelect(xray)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        Patient ID: {xray.patientId} - {xray.examType.charAt(0).toUpperCase() + xray.examType.slice(1)} X-Ray
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requested: {xray.requestedDate} | Completed: {xray.reportDate}
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
                    <Badge className="bg-green-600 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </div>
              ))}
              
              {!completedXrays?.length && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No completed X-ray reports
                </p>
              )}
            </div>
          </div>

          {/* Report Entry Form */}
          {selectedXrayExam && (
            <div>
              <h3 className="font-medium text-gray-800 mb-4 dark:text-gray-200">
                X-Ray Report - {selectedXrayExam.examId}
                {selectedXrayExam.status === 'completed' && (
                  <Badge className="ml-2 bg-blue-600 text-white">Editing Completed Report</Badge>
                )}
              </h3>
              <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-4">

                
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Date
                  </label>
                  <Input 
                    type="date" 
                    {...resultsForm.register("reportDate")}
                  />
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
    </div>
  );
}
