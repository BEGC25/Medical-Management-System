import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  TestTube,
  Filter,
  Calendar,
  Search,
  Plus,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  Printer
} from 'lucide-react';
import { PatientSearch } from '@/components/PatientSearch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type { Patient, LabTest } from '@shared/schema';
import { createInsertSchema } from 'drizzle-zod';
import { labTests } from '@shared/schema';

type LabTestInsert = typeof labTests.$inferInsert;

// Common test categories and tests
const commonTests = {
  hematology: [
    "Complete Blood Count (CBC)",
    "Hemoglobin (Hb)",
    "Hematocrit (Hct)",
    "White Blood Cell Count (WBC)",
    "Platelet Count",
    "Erythrocyte Sedimentation Rate (ESR)",
    "Blood Group & Rh Type",
    "Cross Match",
    "Reticulocyte Count",
    "Peripheral Blood Smear"
  ],
  serology: [
    "Hepatitis B Surface Antigen (HBsAg)",
    "Hepatitis C Antibody",
    "HIV Rapid Test",
    "Syphilis (VDRL/RPR)",
    "Rheumatoid Factor (RF)",
    "Antistreptolysin O (ASO)",
    "C-Reactive Protein (CRP)",
    "Widal Test (Typhoid)",
    "Pregnancy Test (Beta-hCG)",
    "Malaria Rapid Test"
  ],
  urine: [
    "Urinalysis (Complete)",
    "Urine Microscopy",
    "Urine Culture",
    "Protein in Urine",
    "Glucose in Urine",
    "Ketones",
    "Specific Gravity",
    "pH",
    "Nitrites",
    "Leukocyte Esterase"
  ],
  parasitology: [
    "Stool for Ova & Parasites",
    "Stool for Occult Blood",
    "Malaria Blood Smear (Thick & Thin)",
    "Schistosomiasis",
    "Filariasis",
    "Leishmaniasis",
    "Trypanosomiasis"
  ],
  biochemistry: [
    "Fasting Blood Sugar (FBS)",
    "Random Blood Sugar (RBS)",
    "Urea",
    "Creatinine",
    "Total Cholesterol",
    "HDL Cholesterol",
    "LDL Cholesterol",
    "Triglycerides",
    "ALT (SGPT)",
    "AST (SGOT)",
    "Alkaline Phosphatase",
    "Total Bilirubin",
    "Direct Bilirubin",
    "Total Protein",
    "Albumin"
  ],
  hormones: [
    "Thyroid Stimulating Hormone (TSH)",
    "Free T3",
    "Free T4",
    "Insulin",
    "Cortisol",
    "Testosterone",
    "Estradiol",
    "Progesterone",
    "Prolactin",
    "Growth Hormone"
  ]
};

const TestResultsModal = ({ testName, onClose }: { testName: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>Test Results - {testName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testName === "Complete Blood Count (CBC)" && (
          <CBCResults />
        )}
        {testName === "Urinalysis (Complete)" && (
          <UrinalysisResults />
        )}
        <div className="pt-8 border-t">
          <p className="mb-4">Lab Technician: ____________________</p>
          <p className="text-xs text-gray-500 text-center">Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Results
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const CBCResults = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Complete Blood Count (CBC)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { test: "Hemoglobin (Hb)", result: "____", unit: "g/dL", normal: "M: 13.8-17.2, F: 12.1-15.1" },
          { test: "Hematocrit (Hct)", result: "____", unit: "%", normal: "M: 40.7-50.3, F: 36.1-44.3" },
          { test: "RBC Count", result: "____", unit: "×10⁶/μL", normal: "M: 4.7-6.1, F: 4.2-5.4" },
          { test: "WBC Count", result: "____", unit: "×10³/μL", normal: "5.0-10.0" },
          { test: "Platelet Count", result: "____", unit: "×10³/μL", normal: "150-450" },
          { test: "MCV", result: "____", unit: "fL", normal: "82-98" },
          { test: "MCH", result: "____", unit: "pg", normal: "27-32" },
          { test: "MCHC", result: "____", unit: "g/dL", normal: "32-36" }
        ].map((item, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <h4 className="font-medium">{item.test}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Result:</span>
                <span className="font-medium">{item.result} {item.unit}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Normal:</span>
                <span className="text-xs text-gray-500 dark:text-gray-500">{item.normal}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
        <p className="font-medium mb-2">Clinical Interpretation:</p>
        <p className="text-sm">_________________________________________________</p>
      </div>
    </div>
  );
};

const UrinalysisResults = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Urinalysis (Complete)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { test: "Color", result: "____", normal: "Pale Yellow" },
          { test: "Clarity", result: "____", normal: "Clear" },
          { test: "Specific Gravity", result: "____", normal: "1.003-1.030" },
          { test: "pH", result: "____", normal: "4.8-8.0" },
          { test: "Protein", result: "____", normal: "Negative" },
          { test: "Glucose", result: "____", normal: "Negative" },
          { test: "Ketones", result: "____", normal: "Negative" },
          { test: "Blood", result: "____", normal: "Negative" },
          { test: "Nitrites", result: "____", normal: "Negative" },
          { test: "Leukocyte Esterase", result: "____", normal: "Negative" },
          { test: "WBC/hpf", result: "____", normal: "<5" },
          { test: "RBC/hpf", result: "____", normal: "<3" },
          { test: "Epithelial cells", result: "____", normal: "Few" },
          { test: "Bacteria", result: "____", normal: "None-Few" }
        ].map((item, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <span className="font-medium">{item.test}:</span>
              <span className="text-sm font-medium">{item.result}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Normal: {item.normal}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
        <p className="font-medium mb-2">Clinical Interpretation:</p>
        <p className="text-sm">_________________________________________________</p>
      </div>
    </div>
  );
};

const labTestSchema = createInsertSchema(labTests).omit({
  id: true,
  createdAt: true,
  testId: true,
  completedDate: true,
  results: true,
  normalValues: true,
  resultStatus: true,
  technicianNotes: true,
  attachments: true
});

type LabTestFormData = z.infer<typeof labTestSchema>;

export default function Laboratory() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<keyof typeof commonTests>('hematology');
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [showLabReport, setShowLabReport] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState<LabTest | null>(null);
  const [selectedTestResults, setSelectedTestResults] = useState<string | null>(null);
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<LabTestFormData>({
    resolver: zodResolver(labTestSchema),
    defaultValues: {
      patientId: '',
      category: 'blood',
      tests: '',
      clinicalInfo: '',
      priority: 'routine',
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      paymentStatus: 'unpaid',
    },
  });

  // Query for lab tests
  const { data: labTestsData, isLoading } = useQuery({
    queryKey: ['/api/lab-tests'],
  });

  const labTestsList = labTestsData as LabTest[] || [];

  // Apply filtering based on active metric filter
  const filteredTests = useMemo(() => {
    if (!activeMetricFilter) return labTestsList;
    
    switch (activeMetricFilter) {
      case 'total':
        return labTestsList;
      case 'pending':
        return labTestsList.filter(test => test.status === 'pending');
      case 'completed':
        return labTestsList.filter(test => test.status === 'completed');
      case 'critical':
        return labTestsList.filter(test => test.resultStatus === 'critical');
      case 'turnaround':
        // Filter by quick turnaround tests (less than 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        return labTestsList.filter(test => 
          test.requestedDate > twentyFourHoursAgo && test.status === 'completed'
        );
      default:
        return labTestsList;
    }
  }, [labTestsList, activeMetricFilter]);

  // Statistics
  const totalTests = labTestsList.length;
  const pendingTests = labTestsList.filter(test => test.status === 'pending');
  const completedTests = labTestsList.filter(test => test.status === 'completed');
  const criticalTests = labTestsList.filter(test => test.resultStatus === 'critical');

  // Mutations for creating lab tests
  const createLabTestMutation = useMutation({
    mutationFn: async (data: LabTestFormData & { tests: string }) => {
      const response = await fetch('/api/lab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create lab test');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-tests'] });
      toast({ title: "Success", description: "Lab test request created successfully" });
      form.reset();
      setSelectedTests([]);
      setSelectedPatient(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create lab test request", variant: "destructive" });
    },
  });

  const onSubmitRequest = (data: LabTestFormData) => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient", variant: "destructive" });
      return;
    }
    if (selectedTests.length === 0) {
      toast({ title: "Error", description: "Please select at least one test", variant: "destructive" });
      return;
    }

    createLabTestMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
      tests: JSON.stringify(selectedTests),
    });
  };

  const handleTestToggle = (testName: string) => {
    setSelectedTests(prev =>
      prev.includes(testName)
        ? prev.filter(t => t !== testName)
        : [...prev, testName]
    );
  };

  const handleLabTestSelect = (test: LabTest) => {
    setSelectedLabTest(test);
    setShowLabReport(true);
  };

  const autoResize = (element: HTMLTextAreaElement) => {
    setTimeout(() => {
      if (element) {
        element.style.height = 'auto';
        element.style.height = Math.max(100, element.scrollHeight) + 'px';
      }
    }, 50);
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
    <div>
      {/* Premium Laboratory Interface */}
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              Laboratory Department
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 dark:text-gray-400 mt-1"
            >
              Comprehensive laboratory testing and results management
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              size="lg" 
              className="shadow-lg"
              onClick={() => setShowNewRequestModal(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Test Request
            </Button>
          </motion.div>
        </div>

        {/* Summary Metric Cards - Interactive Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card 
              className={`p-4 hover:shadow-md transition-all cursor-pointer border-0 shadow-sm ${
                activeMetricFilter === 'total' 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveMetricFilter(activeMetricFilter === 'total' ? null : 'total')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <TestTube className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTests}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card 
              className={`p-4 hover:shadow-md transition-all cursor-pointer border-0 shadow-sm ${
                activeMetricFilter === 'pending' 
                  ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/30' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveMetricFilter(activeMetricFilter === 'pending' ? null : 'pending')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTests.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card 
              className={`p-4 hover:shadow-md transition-all cursor-pointer border-0 shadow-sm ${
                activeMetricFilter === 'completed' 
                  ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/30' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveMetricFilter(activeMetricFilter === 'completed' ? null : 'completed')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTests.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className={`p-4 hover:shadow-md transition-all cursor-pointer border-0 shadow-sm ${
                activeMetricFilter === 'turnaround' 
                  ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveMetricFilter(activeMetricFilter === 'turnaround' ? null : 'turnaround')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg. TAT</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">12h</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Premium Tabbed Interface */}
        <Tabs defaultValue="requests" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid w-auto grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger value="requests" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all">
                Test Requests
              </TabsTrigger>
              <TabsTrigger value="results" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all">
                Results
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all">
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

        {/* Requests Tab Content */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filter Bar */}
          <Card className="border-0 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                      placeholder="Search tests by patient, test name, or ID..." 
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline" size="default">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="default">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </div>

              {/* Active Filter Chips */}
              {activeMetricFilter && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active filter:</span>
                  <Badge 
                    variant="secondary" 
                    className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {activeMetricFilter === 'total' && 'All Tests'}
                    {activeMetricFilter === 'pending' && 'Pending Tests'}
                    {activeMetricFilter === 'completed' && 'Completed Tests'}
                    {activeMetricFilter === 'turnaround' && 'Quick Turnaround'}
                    <button 
                      onClick={() => setActiveMetricFilter(null)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </Badge>
                  <span className="text-sm text-gray-500">({filteredTests.length} results)</span>
                </div>
              )}
            </div>

            {/* Laboratory Tests Table */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Test ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <Activity className="animate-spin w-5 h-5 text-gray-400 mr-2" />
                            Loading tests...
                          </div>
                        </td>
                      </tr>
                    ) : filteredTests.map((test) => {
                      const tests = JSON.parse(test.tests || "[]");
                      return (
                        <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {test.testId}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-medical-blue/10 text-medical-blue text-sm font-medium">
                                  {test.patientId?.substring(0, 2).toUpperCase() || 'UN'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  Patient {test.patientId || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{test.patientId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="flex flex-wrap gap-1">
                                {tests.slice(0, 2).map((testName: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {testName}
                                  </Badge>
                                ))}
                                {tests.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{tests.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="capitalize">
                              {test.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={test.priority} type="priority" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={test.status} type="status" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={test.paymentStatus} type="payment" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(test.requestedDate).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Empty state when no filtered results */}
                    {filteredTests?.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                            <TestTube className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium">No tests found</p>
                            <p className="text-sm">
                              {activeMetricFilter 
                                ? `No tests match the current filter "${activeMetricFilter}"`
                                : 'No laboratory tests have been submitted yet'
                              }
                            </p>
                            {activeMetricFilter && (
                              <Button
                                variant="ghost"
                                onClick={() => setActiveMetricFilter(null)}
                                className="mt-4"
                              >
                                Clear filter
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Results Tab Content */}
        <TabsContent value="results" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Results</h3>
              <p className="text-gray-600 dark:text-gray-400">Manage and review laboratory test results</p>
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab Content */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Laboratory Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">Performance metrics and insights</p>
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab Content */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Laboratory Settings</h3>
              <p className="text-gray-600 dark:text-gray-400">Configure laboratory preferences and workflows</p>
            </div>
          </Card>
        </TabsContent>
        </Tabs>

      </div>

      <div className="hidden">
        {/* Keep original lab request form for now - will be moved to modal later */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <p>Original lab request form content (temporarily simplified to fix JSX structure)</p>
        </div>
      </div>
      {/* Original form content removed to fix JSX structure - will be implemented in modal */}
      
      {/* Lab Request Print Modal */}
      {showLabRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:static print:bg-white">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none">
            <CardHeader className="print:text-center">
              <CardTitle>Laboratory Test Request</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Laboratory test request content will be implemented here</p>
              <div className="text-center mt-6 print:hidden">
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
      {showLabReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:static print:bg-white">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none">
            <CardHeader className="print:text-center">
              <CardTitle>Laboratory Test Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Laboratory test report content will be implemented here</p>
              <div className="text-center mt-6 print:hidden">
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

      {/* New Test Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-medical-blue dark:text-blue-400">New Laboratory Test Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    🔬 New Lab Request Form
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                    Please select a patient and specify the required laboratory tests
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Laboratory test request form will be fully implemented here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Including patient selection, test categories, and clinical information
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowNewRequestModal(false)}
              >
                Cancel
              </Button>
              <Button className="bg-medical-blue hover:bg-blue-700">
                Submit Test Request
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}