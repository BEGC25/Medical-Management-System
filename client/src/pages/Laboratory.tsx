import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Printer, Check, Clock, Camera, FileImage, Save, AlertCircle } from "lucide-react";
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
// Professional lab results formatter
const formatLabResults = (results: string) => {
  if (!results) return null;
  
  try {
    const parsed = JSON.parse(results);
    
    return (
      <div className="space-y-4">
        {Object.entries(parsed).map(([testName, testData]: [string, any]) => (
          <div key={testName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <h5 className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-700 pb-2">
              {testName}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(testData).map(([field, value]: [string, any]) => (
                <div key={field} className="flex justify-between items-center py-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {field}:
                  </span>
                  <span className={`font-mono text-right ${
                    // Highlight abnormal values
                    (value as string).includes('+') || (value as string).includes('P. falciparum') || 
                    (value as string).includes('Positive') || (value as string).includes('Seen') || 
                    (value as string).includes('Turbid') || (value as string).includes('1:160') ||
                    (value as string).includes('Bloody') || (value as string).includes('F. histolytica') ||
                    (value as string).includes('G. lamblia')
                      ? 'text-red-600 dark:text-red-400 font-bold' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {value as string}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  } catch (e) {
    // Fallback for non-JSON results
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
        <pre className="whitespace-pre-wrap text-sm font-mono">{results}</pre>
      </div>
    );
  }
};

// Clinical interpretation function
const getClinicalInterpretation = (results: string) => {
  if (!results) return null;
  
  try {
    const parsed = JSON.parse(results);
    const findings = [];
    
    // Check for malaria
    if (parsed['Blood Film for Malaria (BFFM)']) {
      const malaria = parsed['Blood Film for Malaria (BFFM)'];
      if (malaria['Malaria Parasites']?.includes('P. falciparum')) {
        findings.push('🚨 POSITIVE for Plasmodium falciparum malaria - Requires immediate treatment');
      }
      if (malaria['Gametocytes']?.includes('Seen')) {
        findings.push('⚠️ Gametocytes present - Patient is infectious');
      }
    }
    
    // Check for typhoid
    if (parsed['Widal Test (Typhoid)']) {
      const widal = parsed['Widal Test (Typhoid)'];
      if (widal['S. Typhi (O)Ag']?.includes('1:160') || widal['S. Typhi (H)Ag']?.includes('1:160')) {
        findings.push('⚠️ Elevated typhoid titers - Consider typhoid fever');
      }
    }
    
    // Check for Brucella
    if (parsed['Brucella Test (B.A.T)']) {
      const brucella = parsed['Brucella Test (B.A.T)'];
      if (brucella['B. Abortus']?.includes('1:160') || brucella['B. Malitensis']?.includes('1:320')) {
        findings.push('🚨 Brucella infection detected - Requires antibiotic treatment and contact tracing');
      }
    }
    
    // Check urine analysis
    if (parsed['Urine Analysis']) {
      const urine = parsed['Urine Analysis'];
      if (urine['Appearance']?.includes('Turbid') || urine['Appearance']?.includes('Bloody')) {
        findings.push('🚨 Abnormal urine appearance - Requires immediate evaluation');
      }
      if (urine['Protein']?.includes('+')) {
        findings.push('⚠️ Proteinuria detected - Kidney function needs assessment');
      }
      if (urine['Glucose']?.includes('+')) {
        findings.push('⚠️ Glucosuria - Check blood glucose levels');
      }
      if (urine['Leucocytes']?.includes('+')) {
        findings.push('⚠️ Leucocytes in urine - Urinary tract infection likely');
      }
    }
    
    // Check urine microscopy
    if (parsed['Urine Microscopy']) {
      const microscopy = parsed['Urine Microscopy'];
      if (microscopy['Casts']?.includes('Granular') || microscopy['Casts']?.includes('Cellular')) {
        findings.push('⚠️ Abnormal casts present - Kidney damage or disease');
      }
      if (microscopy['Trichomonas']?.includes('Seen')) {
        findings.push('🚨 Trichomonas infection - Sexually transmitted infection requires treatment');
      }
      if (microscopy['Epithelial cells']?.includes('Many')) {
        findings.push('⚠️ Many epithelial cells - Possible contamination or urogenital inflammation');
      }
      if (microscopy['Pus Cells'] && parseInt(microscopy['Pus Cells']) > 10) {
        findings.push('🚨 High pus cells in urine - Severe urinary tract infection');
      }
      if (microscopy['RBC'] && parseInt(microscopy['RBC']) > 5) {
        findings.push('🚨 Blood cells in urine - Hematuria requires investigation');
      }
    }
    
    // Check stool examination
    if (parsed['Stool Examination']) {
      const stool = parsed['Stool Examination'];
      if (stool['Ova/Cyst']?.includes('Ascaris')) {
        findings.push('🚨 Ascaris worms detected - Requires immediate deworming treatment');
      }
      if (stool['Ova/Cyst']?.includes('F. histolytica') || stool['Trophozoites']?.includes('E. histolytica')) {
        findings.push('🚨 E. histolytica detected - Serious parasitic infection causing dysentery');
      }
      if (stool['Trophozoites']?.includes('G. lamblia')) {
        findings.push('⚠️ Giardia detected - Requires antiparasitic treatment');
      }
      if (stool['Appearance']?.includes('Bloody')) {
        findings.push('🚨 Blood in stool - Serious gastrointestinal bleeding requires investigation');
      }
    }
    
    // Check H. Pylori
    if (parsed['H. Pylori Test']) {
      const hPylori = parsed['H. Pylori Test'];
      if (hPylori['H. Pylori Antigen']?.includes('Positive')) {
        findings.push('⚠️ H. Pylori positive - Consider treatment for gastric ulcers');
      }
    }
    
    // Check Hepatitis B
    if (parsed['Hepatitis B Test (HBsAg)']) {
      const hepB = parsed['Hepatitis B Test (HBsAg)'];
      if (hepB['HBsAg']?.includes('Positive')) {
        findings.push('🚨 Hepatitis B positive - Requires specialist consultation and monitoring');
      }
    }
    
    // Check Hepatitis C
    if (parsed['Hepatitis C Test (HCV)']) {
      const hepC = parsed['Hepatitis C Test (HCV)'];
      if (hepC['HCV Antibody']?.includes('Positive')) {
        findings.push('🚨 Hepatitis C positive - Requires specialist consultation and monitoring');
      }
    }
    
    // Check STI tests
    if (parsed['Gonorrhea Test']) {
      const gonorrhea = parsed['Gonorrhea Test'];
      if (gonorrhea['Neisseria Gonorrhoeae']?.includes('Positive')) {
        findings.push('🚨 Gonorrhea detected - Requires antibiotic treatment and partner notification');
      }
    }
    
    if (parsed['Chlamydia Test']) {
      const chlamydia = parsed['Chlamydia Test'];
      if (chlamydia['Chlamydia Trachomatis']?.includes('Positive')) {
        findings.push('🚨 Chlamydia detected - Requires antibiotic treatment and partner notification');
      }
    }
    
    if (parsed['VDRL Test (Syphilis)']) {
      const vdrl = parsed['VDRL Test (Syphilis)'];
      if (vdrl['VDRL Result']?.includes('Reactive')) {
        findings.push('🚨 Syphilis positive - Requires penicillin treatment and partner notification');
      }
    }
    
    // Check parasitic tests
    if (parsed['Toxoplasma Test']) {
      const toxo = parsed['Toxoplasma Test'];
      if (toxo['Toxoplasma IgM']?.includes('Positive')) {
        findings.push('🚨 Acute toxoplasmosis - Dangerous for pregnant women and immunocompromised');
      }
      if (toxo['Toxoplasma IgG']?.includes('Positive')) {
        findings.push('⚠️ Previous toxoplasmosis exposure - Monitor if pregnant');
      }
    }
    
    if (parsed['Filariasis Tests']) {
      const filaria = parsed['Filariasis Tests'];
      if (filaria['Skin Snip for Onchocerca']?.includes('Microfilariae present')) {
        findings.push('🚨 Onchocerciasis (River blindness) detected - Requires ivermectin treatment');
      }
      if (filaria['Wet Mount for Microfilariae']?.includes('W. bancrofti') || 
          filaria['Wet Mount for Microfilariae']?.includes('Loa loa')) {
        findings.push('🚨 Lymphatic filariasis detected - Requires antihelminthic treatment');
      }
    }
    
    // Check Yellow Fever
    if (parsed['Yellow Fever Test']) {
      const yellowFever = parsed['Yellow Fever Test'];
      if (yellowFever['Yellow Fever IgM']?.includes('Positive')) {
        findings.push('🚨 Acute Yellow Fever infection - Medical emergency requiring immediate isolation');
      }
    }
    
    // Check Dengue
    if (parsed['Dengue Test']) {
      const dengue = parsed['Dengue Test'];
      if (dengue['Dengue IgM']?.includes('Positive') || dengue['Dengue NS1']?.includes('Positive')) {
        findings.push('🚨 Dengue fever detected - Monitor for severe complications and bleeding');
      }
    }
    
    // Check Rheumatoid Factor
    if (parsed['Rheumatoid Factor Test']) {
      const rf = parsed['Rheumatoid Factor Test'];
      if (rf['RF Level'] && parseInt(rf['RF Level']) > 20) {
        findings.push('⚠️ Elevated Rheumatoid Factor - Consider rheumatoid arthritis or other autoimmune conditions');
      }
    }
    
    // Check blood group results
    if (parsed['Blood Group & Rh Factor']) {
      const bloodGroup = parsed['Blood Group & Rh Factor'];
      if (bloodGroup['Blood Group'] && bloodGroup['Rh Factor']) {
        const group = bloodGroup['Blood Group'];
        const rh = bloodGroup['Rh Factor'];
        
        // Clinical notes for blood grouping
        if (rh === 'Negative') {
          findings.push('ℹ️ Rh Negative blood type - Important for pregnancy and transfusion compatibility');
        }
        
        // Universal donor/recipient information
        if (group === 'O' && rh === 'Negative') {
          findings.push('ℹ️ Universal red blood cell donor (O-) - Can donate to all blood types');
        }
        if (group === 'AB' && rh === 'Positive') {
          findings.push('ℹ️ Universal plasma recipient (AB+) - Can receive red cells from all blood types');
        }
      }
    }
    
    if (findings.length === 0) {
      findings.push('✅ No significant abnormalities detected in the analyzed parameters');
    }
    
    return findings;
  } catch (e) {
    return null;
  }
};

const testCategories = {
  "Blood Tests": [
    "Complete Blood Count (CBC)",
    "Hematocrit (Hct)",
    "Hemoglobin (Hb)",
    "Blood Group & Rh Factor"
  ],
  "Urine Tests": [
    "Urine Analysis",
    "Urine Microscopy",
    "Urine Culture & Sensitivity"
  ],
  "Stool Tests": [
    "Stool Examination",
    "Stool Culture",
    "Stool for Occult Blood"
  ],
  "Microbiology Tests": [
    "Blood Film for Malaria (BFFM)",
    "Widal Test (Typhoid)",
    "Brucella Test (B.A.T)",
    "Blood Culture & Sensitivity"
  ],
  "Chemistry Tests": [
    "Blood Sugar (Random/Fasting)",
    "Liver Function Tests",
    "Kidney Function Tests",
    "Lipid Profile",
    "Electrolytes (Na, K, Cl)"
  ],
  "Hormonal Tests": [
    "Thyroid Function Tests (TSH, T3, T4)",
    "Pregnancy Test (β-hCG)",
    "Insulin Level",
    "Cortisol Level"
  ],
  "STI/Reproductive Health": [
    "VDRL Test (Syphilis)",
    "Hepatitis B Test (HBsAg)",
    "Hepatitis C Test (HCV)",
    "HIV Test",
    "Gonorrhea Test",
    "Chlamydia Test",
    "Pregnancy Test"
  ],
  "Parasitic/Tropical Disease Tests": [
    "Toxoplasma Test",
    "Filariasis Tests",
    "Yellow Fever Test",
    "Dengue Test",
    "Schistosomiasis Test",
    "Leishmaniasis Test",
    "Trypanosomiasis Test"
  ],
  "Tuberculosis Tests": [
    "Sputum for AFB",
    "TB Skin Test (TST)",
    "GeneXpert MTB/RIF",
    "Chest X-ray for TB"
  ],
  "Other Tests": [
    "H. Pylori Test",
    "C-Reactive Protein (CRP)",
    "Erythrocyte Sedimentation Rate (ESR)",
    "Rheumatoid Factor Test",
    "Coagulation Studies (PT, PTT)"
  ]
};

export default function Laboratory() {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [showLabReport, setShowLabReport] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState<LabTest | null>(null);
  const [showResultEntry, setShowResultEntry] = useState(false);
  const [resultFormData, setResultFormData] = useState({
    results: '',
    normalValues: '',
    resultStatus: 'normal' as 'normal' | 'abnormal' | 'critical',
    technicianNotes: '',
    completedDate: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for lab test request
  const form = useForm<InsertLabTest>({
    resolver: zodResolver(insertLabTestSchema),
    defaultValues: {
      patientId: "",
      category: "other",
      tests: "[]",
      priority: "routine",
      requestedDate: new Date().toISOString().split('T')[0],
      clinicalInfo: ""
    }
  });

  // Fetch lab tests with default filter for today to improve performance
  const { data: labTests, isLoading: isLoadingLabTests } = useQuery({
    queryKey: ["/api/lab-tests", "today"],
    queryFn: async () => {
      // Default to today's tests for better performance
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/lab-tests?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch today\'s lab tests');
      return response.json();
    },
  });

  // Create lab test mutation
  const createLabTest = useMutation({
    mutationFn: async (data: InsertLabTest) => {
      const response = await apiRequest("POST", "/api/lab-tests", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      form.reset();
      setSelectedTests([]);
      setSelectedPatient(null);
      toast({
        title: "Success",
        description: "Laboratory test request created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lab test request",
        variant: "destructive",
      });
    },
  });

  // Update lab test mutation for result entry
  const updateLabTest = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/lab-tests/${data.testId}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      toast({
        title: "Success",
        description: "Lab test results updated successfully",
      });
      setShowResultEntry(false);
      setShowLabReport(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lab test",
        variant: "destructive",
      });
    },
  });

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabTest) return;

    const updateData = {
      testId: selectedLabTest.testId,
      ...resultFormData,
      status: 'completed',
      completedDate: resultFormData.completedDate
    };

    updateLabTest.mutate(updateData);
  };

  const handleTestToggle = (testName: string) => {
    setSelectedTests(prev => 
      prev.includes(testName)
        ? prev.filter(t => t !== testName)
        : [...prev, testName]
    );
  };

  const handleSubmit = async (data: any) => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
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

    const labTestData = {
      ...data,
      patientId: selectedPatient.patientId,
      tests: JSON.stringify(selectedTests),
    };

    try {
      // Add to pending sync for offline capability
      addToPendingSync(labTestData);
      
      await createLabTest.mutateAsync(labTestData);
      
      // Close the modal and reset form
      setShowLabRequest(false);
      
    } catch (error) {
      console.error("Failed to create lab test:", error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    form.setValue("patientId", patient.patientId);
  };

  const handleLabTestSelect = (labTest: LabTest) => {
    setSelectedLabTest(labTest);
    if (labTest.status === 'pending') {
      setShowResultEntry(true);
    } else {
      setShowLabReport(true);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'routine':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Filter tests by status
  const labTestsArray = Array.isArray(labTests) ? labTests : [];
  const pendingTests = labTestsArray.filter((test: LabTest) => test.status === 'pending');
  const completedTests = labTestsArray.filter((test: LabTest) => test.status === 'completed');
  const inProgressTests = labTestsArray.filter((test: LabTest) => test.status === 'pending'); // Using 'pending' as closest match

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Laboratory Department
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive laboratory testing and results management
          </p>
        </div>
        <Button 
          onClick={() => setShowLabRequest(true)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="button-new-test-request"
        >
          <Send className="w-4 h-4 mr-2" />
          New Test Request
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Tests</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {labTestsArray.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-300">Pending</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {pendingTests.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600 dark:text-green-300">Completed</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {completedTests.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Abnormal</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {completedTests.filter((test: LabTest) => test.results && test.results.includes('P. falciparum')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Tests Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 dark:text-white">Laboratory Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Test ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Tests</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingLabTests ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Loading lab tests...
                    </td>
                  </tr>
                ) : labTestsArray.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No lab tests found
                    </td>
                  </tr>
                ) : (
                  labTestsArray.map((test: LabTest) => (
                    <tr 
                      key={test.id} 
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => handleLabTestSelect(test)}
                      title="Click to view test details and results"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                          {test.testId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {test.patientId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(test.tests || '[]').slice(0, 2).map((testName: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {testName.length > 20 ? `${testName.substring(0, 20)}...` : testName}
                            </Badge>
                          ))}
                          {JSON.parse(test.tests || '[]').length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{JSON.parse(test.tests || '[]').length - 2} more
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${getPriorityColor(test.priority)}`}>
                          {test.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadgeColor(test.status)}>
                          {test.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLabTestSelect(test);
                          }}
                        >
                          <FileImage className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lab Request Modal */}
      {showLabRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">New Laboratory Test Request</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Patient Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Step 1: Select Patient</h4>
                      {!selectedPatient && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          Required
                        </Badge>
                      )}
                    </div>
                    {selectedPatient ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-green-900 dark:text-green-100">
                              {selectedPatient.firstName} {selectedPatient.lastName}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              ID: {selectedPatient.patientId} | Age: {selectedPatient.age} | Gender: {selectedPatient.gender}
                            </p>
                          </div>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(null);
                              setPatientSearchOpen(true);
                            }}
                            data-testid="button-change-patient"
                          >
                            Change Patient
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setPatientSearchOpen(true)}
                        className="w-full p-4 h-auto border-dashed"
                        data-testid="button-select-patient"
                      >
                        <div className="text-center">
                          <p className="font-medium text-gray-700 dark:text-gray-300">Select a Patient</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to search and select patient</p>
                        </div>
                      </Button>
                    )}
                  </div>

                  {/* Test Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Step 2: Select Tests</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {selectedTests.length} selected
                        </Badge>
                        {selectedTests.length === 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(testCategories).map(([category, tests]) => (
                        <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                          <h5 className="font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                            {category}
                          </h5>
                          <div className="space-y-2">
                            {tests.map((test) => (
                              <div key={test} className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded transition-colors">
                                <Checkbox
                                  id={test}
                                  checked={selectedTests.includes(test)}
                                  onCheckedChange={() => handleTestToggle(test)}
                                  data-testid={`checkbox-test-${test.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                />
                                <label 
                                  htmlFor={test}
                                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                                >
                                  {test}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
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
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blood">Blood Tests</SelectItem>
                              <SelectItem value="urine">Urine Tests</SelectItem>
                              <SelectItem value="stool">Stool Tests</SelectItem>
                              <SelectItem value="microbiology">Microbiology</SelectItem>
                              <SelectItem value="chemistry">Chemistry</SelectItem>
                              <SelectItem value="hormonal">Hormonal</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="clinicalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinical Information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Relevant symptoms, clinical findings, or suspected diagnosis..."
                            className="min-h-[100px]"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={createLabTest.isPending || !selectedPatient || selectedTests.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-submit-request"
                    >
                      {createLabTest.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowLabRequest(false)}
                      data-testid="button-cancel-request"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Search Modal */}
      {patientSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Patient</CardTitle>
                <Button variant="outline" onClick={() => setPatientSearchOpen(false)} data-testid="button-close-patient-search">Close</Button>
              </div>
            </CardHeader>
            <CardContent>
              <PatientSearch
                viewMode="all"
                selectedDate=""
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                shouldSearch={shouldSearch}
                onShouldSearchChange={setShouldSearch}
                onSelectPatient={(patient) => {
                  handlePatientSelect(patient);
                  setPatientSearchOpen(false);
                  setSearchTerm("");
                  setShouldSearch(false);
                }}
                onViewPatient={(patient) => {
                  handlePatientSelect(patient);
                  setPatientSearchOpen(false);
                  setSearchTerm("");
                  setShouldSearch(false);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result Entry Modal */}
      {showResultEntry && selectedLabTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                Enter Lab Results - {selectedLabTest.testId}
              </CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Patient: <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedLabTest.patientId}</span> | 
                Priority: <span className={`font-semibold ${getPriorityColor(selectedLabTest.priority)}`}>
                  {selectedLabTest.priority}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Test Information */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-300">Requested Tests</h4>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(selectedLabTest.tests || '[]').map((testName: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-2">
                      {testName}
                    </Badge>
                  ))}
                </div>
                {selectedLabTest.clinicalInfo && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Clinical Information:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedLabTest.clinicalInfo}</p>
                  </div>
                )}
              </div>

              {/* Result Entry Form */}
              <form onSubmit={handleResultSubmit} className="space-y-6">
                {/* Test Results */}
                <div>
                  <label htmlFor="results" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Results *
                  </label>
                  <textarea
                    id="results"
                    value={resultFormData.results}
                    onChange={(e) => setResultFormData(prev => ({ ...prev, results: e.target.value }))}
                    placeholder="Enter detailed test results here..."
                    className="w-full min-h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    data-testid="textarea-results"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter all test results with values and units
                  </p>
                </div>

                {/* Normal Values Reference */}
                <div>
                  <label htmlFor="normalValues" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Normal Values Reference
                  </label>
                  <textarea
                    id="normalValues"
                    value={resultFormData.normalValues}
                    onChange={(e) => setResultFormData(prev => ({ ...prev, normalValues: e.target.value }))}
                    placeholder="Enter normal value ranges for reference..."
                    className="w-full min-h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="textarea-normal-values"
                  />
                </div>

                {/* Result Status and Completion Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="resultStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Result Status *
                    </label>
                    <select
                      id="resultStatus"
                      value={resultFormData.resultStatus}
                      onChange={(e) => setResultFormData(prev => ({ ...prev, resultStatus: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      data-testid="select-result-status"
                    >
                      <option value="normal">Normal</option>
                      <option value="abnormal">Abnormal</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="completedDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Completion Date *
                    </label>
                    <input
                      type="date"
                      id="completedDate"
                      value={resultFormData.completedDate}
                      onChange={(e) => setResultFormData(prev => ({ ...prev, completedDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      data-testid="input-completion-date"
                    />
                  </div>
                </div>

                {/* Technician Notes */}
                <div>
                  <label htmlFor="technicianNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Technician Notes
                  </label>
                  <textarea
                    id="technicianNotes"
                    value={resultFormData.technicianNotes}
                    onChange={(e) => setResultFormData(prev => ({ ...prev, technicianNotes: e.target.value }))}
                    placeholder="Add any additional notes or observations..."
                    className="w-full min-h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="textarea-technician-notes"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    type="submit" 
                    disabled={updateLabTest.isPending || !resultFormData.results}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-save-results"
                  >
                    {updateLabTest.isPending ? "Saving..." : "Save Results & Complete Test"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowResultEntry(false);
                      setResultFormData({
                        results: '',
                        normalValues: '',
                        resultStatus: 'normal',
                        technicianNotes: '',
                        completedDate: new Date().toISOString().split('T')[0]
                      });
                    }}
                    data-testid="button-cancel-results"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowResultEntry(false);
                      setShowLabReport(true);
                    }}
                    data-testid="button-view-report"
                  >
                    View Report
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lab Report Modal */}
      {showLabReport && selectedLabTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:static print:bg-white">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none">
            <CardHeader className="print:text-center border-b">
              <div className="flex items-center justify-between print:block">
                <div>
                  <CardTitle className="text-2xl text-blue-700 dark:text-blue-300">
                    Laboratory Test Report - {selectedLabTest.testId}
                  </CardTitle>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Patient: <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedLabTest.patientId}</span> | 
                    Status: <span className={`font-semibold ${
                      selectedLabTest.status === 'completed' ? 'text-green-600' : 
                      selectedLabTest.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>{selectedLabTest.status}</span> |
                    Priority: <span className={`font-semibold ${getPriorityColor(selectedLabTest.priority)}`}>
                      {selectedLabTest.priority}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 print:p-4">
              {/* Test Information */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-300">Test Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Test ID:</p>
                    <p className="font-mono text-blue-600 dark:text-blue-400">{selectedLabTest.testId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Requested:</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {new Date(selectedLabTest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedLabTest.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Requested Date:</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedLabTest.requestedDate}</p>
                  </div>
                </div>
              </div>

              {/* Requested Tests */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-300">Requested Tests</h4>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(selectedLabTest.tests || '[]').map((testName: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-2">
                      {testName}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Clinical Information */}
              {selectedLabTest.clinicalInfo && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2 text-blue-700 dark:text-blue-300">Clinical Information</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedLabTest.clinicalInfo}</p>
                </div>
              )}

              {/* Lab Results */}
              {selectedLabTest.results ? (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-4 text-blue-700 dark:text-blue-300">Laboratory Results</h4>
                  {formatLabResults(selectedLabTest.results)}
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Results pending - Test has not been completed yet
                  </p>
                </div>
              )}

              {/* Clinical Interpretation */}
              {selectedLabTest.results && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-4 text-blue-700 dark:text-blue-300">Clinical Interpretation</h4>
                  <div className="space-y-2">
                    {getClinicalInterpretation(selectedLabTest.results)?.map((finding, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border-l-4 ${
                          finding.includes('🚨') 
                            ? 'bg-red-50 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-200'
                            : finding.includes('⚠️')
                            ? 'bg-yellow-50 dark:bg-yellow-900 border-yellow-500 text-yellow-800 dark:text-yellow-200'
                            : finding.includes('ℹ️')
                            ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-800 dark:text-blue-200'
                            : 'bg-green-50 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-200'
                        }`}
                      >
                        {finding}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedLabTest.technicianNotes && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2 text-blue-700 dark:text-blue-300">Technician Notes</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedLabTest.technicianNotes}</p>
                </div>
              )}

              {/* Attachments */}
              {selectedLabTest.attachments && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-4 text-blue-700 dark:text-blue-300">Attachments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {JSON.parse(selectedLabTest.attachments).map((attachment: {url: string, name: string, type: string}, index: number) => (
                      attachment.type.startsWith('image/') ? (
                        <img 
                          key={index} 
                          src={attachment.url} 
                          alt={attachment.name} 
                          className="rounded-lg border shadow-sm max-h-64 object-contain"
                        />
                      ) : (
                        <div key={index} className="p-4 border rounded-lg">
                          <p className="text-sm font-medium">{attachment.name}</p>
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View File
                          </a>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Report Footer */}
              <div className="border-t pt-6 mt-8 print:mt-4 print:pt-4">
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <p>Report generated on: {new Date().toLocaleDateString()}</p>
                    <p>Bahr El Ghazal Clinic Laboratory Department</p>
                  </div>
                  <div className="text-right">
                    <p>Laboratory Technician</p>
                    <p className="mt-8">_______________________</p>
                    <p>Signature & Date</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="text-center mt-8 print:hidden border-t pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="mr-4"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowLabReport(false)}
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