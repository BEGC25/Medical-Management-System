import { useState, useMemo } from 'react';
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
  X,
  Filter,
  Calendar,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Zap,
  Printer
} from 'lucide-react';
import PatientSearch from '@/components/PatientSearch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { Patient, XrayExam } from '@shared/schema';
import { createInsertSchema } from 'drizzle-zod';
import { xrayExams } from '@shared/schema';

type XrayExamInsert = typeof xrayExams.$inferInsert;

const xrayExamSchema = createInsertSchema(xrayExams).omit({
  id: true,
  createdAt: true,
  examId: true,
  reportDate: true,
  findings: true,
  impression: true,
  recommendations: true,
  radiologist: true
});

type XrayExamFormData = z.infer<typeof xrayExamSchema>;

// Common X-ray exam types and body parts
const examTypes = [
  { value: 'chest', label: 'Chest X-Ray', description: 'Thoracic cavity, lungs, heart' },
  { value: 'abdomen', label: 'Abdominal X-Ray', description: 'Abdominal organs, intestines' },
  { value: 'spine', label: 'Spine X-Ray', description: 'Cervical, thoracic, lumbar spine' },
  { value: 'extremities', label: 'Extremities', description: 'Arms, legs, joints' },
  { value: 'pelvis', label: 'Pelvis X-Ray', description: 'Hip bones, pelvis structure' },
  { value: 'skull', label: 'Skull X-Ray', description: 'Cranium, facial bones' }
];

// Utility function to get StatusBadge variant
const getStatusBadgeVariant = (status: string, type: 'status' | 'payment' | 'priority') => {
  if (type === 'status') {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'neutral';
    }
  }
  
  if (type === 'payment') {
    switch (status) {
      case 'paid': return 'success';
      case 'unpaid': return 'destructive';
      default: return 'neutral';
    }
  }
  
  if (type === 'priority') {
    switch (status) {
      case 'routine': return 'neutral';
      case 'urgent': return 'warning';
      case 'stat': return 'destructive';
      default: return 'info';
    }
  }
  
  return 'neutral';
};

export default function XRay() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedXrayExam, setSelectedXrayExam] = useState<XrayExam | null>(null);
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null);
  const [showXrayRequest, setShowXrayRequest] = useState(false);
  const [showXrayReport, setShowXrayReport] = useState(false);
  const [safetyChecklist, setSafetyChecklist] = useState({
    notPregnant: false,
    metalRemoved: false,
    canCooperate: false,
  });
  const { toast } = useToast();

  const form = useForm<XrayExamFormData>({
    resolver: zodResolver(xrayExamSchema),
    defaultValues: {
      patientId: '',
      examType: 'chest',
      bodyPart: '',
      clinicalIndication: '',
      specialInstructions: '',
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      paymentStatus: 'unpaid',
    },
  });

  // Query for X-ray exams
  const { data: xrayExamsData, isLoading } = useQuery({
    queryKey: ['/api/xray-exams'],
  });

  const xrayExamsList = xrayExamsData as XrayExam[] || [];

  // Apply filtering based on active metric filter
  const filteredExams = useMemo(() => {
    if (!activeMetricFilter) return xrayExamsList;
    
    switch (activeMetricFilter) {
      case 'total':
        return xrayExamsList;
      case 'pending':
        return xrayExamsList.filter(exam => exam.status === 'pending');
      case 'completed':
        return xrayExamsList.filter(exam => exam.status === 'completed');
      case 'urgent':
        return xrayExamsList.filter(exam => 
          exam.clinicalIndication?.toLowerCase().includes('urgent') ||
          exam.clinicalIndication?.toLowerCase().includes('emergency') ||
          exam.specialInstructions?.toLowerCase().includes('stat')
        );
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        return xrayExamsList.filter(exam => exam.requestedDate === today);
      default:
        return xrayExamsList;
    }
  }, [xrayExamsList, activeMetricFilter]);

  // Statistics
  const totalExams = xrayExamsList.length;
  const pendingExams = xrayExamsList.filter(exam => exam.status === 'pending');
  const completedExams = xrayExamsList.filter(exam => exam.status === 'completed');
  const urgentExams = xrayExamsList.filter(exam => 
    exam.clinicalIndication?.toLowerCase().includes('urgent') ||
    exam.clinicalIndication?.toLowerCase().includes('emergency') ||
    exam.specialInstructions?.toLowerCase().includes('stat')
  );
  const todayExams = xrayExamsList.filter(exam => 
    exam.requestedDate === new Date().toISOString().split('T')[0]
  );

  // Mutations for creating X-ray exams
  const createXrayExamMutation = useMutation({
    mutationFn: async (data: XrayExamFormData) => {
      const response = await fetch('/api/xray-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create X-ray exam');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/xray-exams'] });
      toast({ title: "Success", description: "X-Ray examination request created successfully" });
      form.reset();
      setSelectedPatient(null);
      setSafetyChecklist({ notPregnant: false, metalRemoved: false, canCooperate: false });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create X-Ray examination request", variant: "destructive" });
    },
  });

  const onSubmitRequest = (data: XrayExamFormData) => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient", variant: "destructive" });
      return;
    }

    createXrayExamMutation.mutate({
      ...data,
      patientId: selectedPatient.patientId,
    });
  };

  const handleXrayExamSelect = (exam: XrayExam) => {
    setSelectedXrayExam(exam);
    setShowXrayReport(true);
  };

  const printXrayRequest = () => {
    if (!selectedPatient || !form.getValues("examType")) {
      toast({ title: "Error", description: "Please select a patient and examination type before printing", variant: "destructive" });
      return;
    }
    setShowXrayRequest(true);
    setTimeout(() => {
      const done = () => setShowXrayRequest(false);
      window.addEventListener("afterprint", done, { once: true });
      window.print();
    }, 50);
  };

  const printXrayReport = () => {
    if (!selectedXrayExam) {
      toast({ title: "Error", description: "Please select an X-ray exam to print the report", variant: "destructive" });
      return;
    }
    setShowXrayReport(true);
    setTimeout(() => {
      const done = () => setShowXrayReport(false);
      window.addEventListener("afterprint", done, { once: true });
      window.print();
    }, 50);
  };

  return (
    <div>
      {/* Premium X-Ray Interface */}
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              X-Ray Department
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 dark:text-gray-400 mt-1"
            >
              Advanced radiological imaging and diagnostic services
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button size="lg" className="shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              New X-Ray Request
            </Button>
          </motion.div>
        </div>

        {/* Summary Metric Cards - Interactive Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <X className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Exams</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalExams}</p>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingExams.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedExams.length}</p>
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
                activeMetricFilter === 'urgent' 
                  ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/30' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveMetricFilter(activeMetricFilter === 'urgent' ? null : 'urgent')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Urgent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{urgentExams.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card 
              className={`p-4 hover:shadow-md transition-all cursor-pointer border-0 shadow-sm ${
                activeMetricFilter === 'today' 
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveMetricFilter(activeMetricFilter === 'today' ? null : 'today')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayExams.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Premium Tabbed Interface */}
        <Tabs defaultValue="examinations" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid w-auto grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger value="examinations" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all">
                Examinations
              </TabsTrigger>
              <TabsTrigger value="reports" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all">
                Reports
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all">
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

        {/* Examinations Tab Content */}
        <TabsContent value="examinations" className="space-y-6">
          {/* Filter Bar */}
          <Card className="border-0 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                      placeholder="Search exams by patient, exam type, or ID..." 
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
                    {activeMetricFilter === 'total' && 'All Exams'}
                    {activeMetricFilter === 'pending' && 'Pending Exams'}
                    {activeMetricFilter === 'completed' && 'Completed Exams'}
                    {activeMetricFilter === 'urgent' && 'Urgent Exams'}
                    {activeMetricFilter === 'today' && 'Today\'s Exams'}
                    <button 
                      onClick={() => setActiveMetricFilter(null)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </Badge>
                  <span className="text-sm text-gray-500">({filteredExams.length} results)</span>
                </div>
              )}
            </div>

            {/* X-Ray Examinations Table */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Exam ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Exam Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Body Part
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <Activity className="animate-spin w-5 h-5 text-gray-400 mr-2" />
                            Loading examinations...
                          </div>
                        </td>
                      </tr>
                    ) : filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {exam.examId}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-medical-blue/10 text-medical-blue text-sm font-medium">
                                {exam.patientId?.substring(0, 2).toUpperCase() || 'UN'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                Patient {exam.patientId || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{exam.patientId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {exam.examType} X-Ray
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {exam.bodyPart || 'General'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge variant={getStatusBadgeVariant(exam.status, 'status')}>
                            {exam.status === 'pending' ? 'Pending' : exam.status === 'completed' ? 'Completed' : 'Cancelled'}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge variant={getStatusBadgeVariant(exam.paymentStatus, 'payment')}>
                            {exam.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(exam.requestedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleXrayExamSelect(exam)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            View Report
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {/* Empty state when no filtered results */}
                    {filteredExams?.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                            <X className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium">No examinations found</p>
                            <p className="text-sm">
                              {activeMetricFilter 
                                ? `No examinations match the current filter "${activeMetricFilter}"`
                                : 'No X-ray examinations have been submitted yet'
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

        {/* Reports Tab Content */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">X-Ray Reports</h3>
              <p className="text-gray-600 dark:text-gray-400">Manage and review X-ray examination reports</p>
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab Content */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">X-Ray Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">Performance metrics and imaging insights</p>
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab Content */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">X-Ray Settings</h3>
              <p className="text-gray-600 dark:text-gray-400">Configure radiology preferences and equipment</p>
            </div>
          </Card>
        </TabsContent>
        </Tabs>

      </div>

      {/* X-Ray Request Print Modal */}
      {showXrayRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:static print:bg-white">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none">
            <CardHeader className="print:text-center">
              <CardTitle>X-Ray Examination Request</CardTitle>
            </CardHeader>
            <CardContent>
              <p>X-ray examination request content will be implemented here</p>
              <div className="text-center mt-6 print:hidden">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="mr-4"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Request
                </Button>
                <Button variant="outline" onClick={() => setShowXrayRequest(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* X-Ray Report Print Modal */}
      {showXrayReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:static print:bg-white">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none">
            <CardHeader className="print:text-center">
              <CardTitle>X-Ray Examination Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p>X-ray examination report content will be implemented here</p>
              <div className="text-center mt-6 print:hidden">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="mr-4"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
                <Button variant="outline" onClick={() => setShowXrayReport(false)}>
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