import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  FileText, 
  Microscope, 
  Stethoscope, 
  Camera,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
}

interface LabTest {
  id: number;
  testId: string;
  patientId: string;
  category: string;
  tests: string;
  clinicalInfo: string;
  priority: string;
  requestedDate: string;
  status: string;
  results: string | null;
  normalValues: string | null;
  resultStatus: string | null;
  completedDate: string | null;
  technicianNotes: string | null;
  attachments: string | null;
  createdAt: string;
  patient?: Patient;
}

interface XRayExam {
  id: number;
  examId: string;
  patientId: string;
  examType: string;
  bodyPart: string;
  clinicalIndication: string;
  urgency: string;
  requestedDate: string;
  status: string;
  findings: string | null;
  impression: string | null;
  recommendations: string | null;
  completedDate: string | null;
  radiologistNotes: string | null;
  createdAt: string;
  patient?: Patient;
}

interface UltrasoundExam {
  id: number;
  examId: string;
  patientId: string;
  examType: string;
  indication: string;
  urgency: string;
  requestedDate: string;
  status: string;
  findings: string | null;
  impression: string | null;
  recommendations: string | null;
  completedDate: string | null;
  sonographerNotes: string | null;
  createdAt: string;
  patient?: Patient;
}

export default function AllResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: labTests = [] } = useQuery<LabTest[]>({
    queryKey: ["/api/lab-tests"],
  });

  const { data: xrayExams = [] } = useQuery<XRayExam[]>({
    queryKey: ["/api/xray-exams"],
  });

  const { data: ultrasoundExams = [] } = useQuery<UltrasoundExam[]>({
    queryKey: ["/api/ultrasound-exams"],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Combine all results for a unified view
  const allResults = [
    ...labTests.map(test => ({
      ...test,
      type: 'lab' as const,
      date: test.completedDate || test.requestedDate,
      patient: patients.find(p => p.patientId === test.patientId)
    })),
    ...xrayExams.map(exam => ({
      ...exam,
      type: 'xray' as const,
      date: exam.completedDate || exam.requestedDate,
      patient: patients.find(p => p.patientId === exam.patientId)
    })),
    ...ultrasoundExams.map(exam => ({
      ...exam,
      type: 'ultrasound' as const,
      date: exam.completedDate || exam.requestedDate,
      patient: patients.find(p => p.patientId === exam.patientId)
    }))
  ];

  // Filter results
  const filteredResults = allResults.filter(result => {
    const matchesSearch = 
      result.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.type === 'lab' && (result as any).testId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (result.type === 'xray' && (result as any).examId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (result.type === 'ultrasound' && (result as any).examId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPatient = selectedPatient === "" || result.patientId === selectedPatient;
    const matchesStatus = statusFilter === "all" || result.status === statusFilter;

    return matchesSearch && matchesPatient && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lab':
        return <Microscope className="h-4 w-4 text-blue-600" />;
      case 'xray':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'ultrasound':
        return <Stethoscope className="h-4 w-4 text-teal-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

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
                      (value as string).includes('Turbid') || (value as string).includes('1:160')
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

  const renderResultDetails = (result: any) => {
    const patient = result.patient;
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getTypeIcon(result.type)}
              {result.type === 'lab' && `Lab Test: ${result.testId}`}
              {result.type === 'xray' && `X-Ray: ${result.examId}`}
              {result.type === 'ultrasound' && `Ultrasound: ${result.examId}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {patient?.firstName} {patient?.lastName}
                </div>
                <div>
                  <span className="font-medium">Patient ID:</span> {patient?.patientId}
                </div>
                <div>
                  <span className="font-medium">Date of Birth:</span> {patient?.dateOfBirth || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Gender:</span> {patient?.gender || 'Not provided'}
                </div>
              </div>
            </div>

            {/* Test/Exam Specific Information */}
            {result.type === 'lab' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Test Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span> {result.category}
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span> {result.priority}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Tests Ordered:</span>
                      <div className="mt-1">
                        {JSON.parse(result.tests || "[]").map((test: string, index: number) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {test}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {result.clinicalInfo && (
                      <div className="col-span-2">
                        <span className="font-medium">Clinical Information:</span>
                        <p className="mt-1 text-gray-700 dark:text-gray-300">{result.clinicalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lab Results */}
                {result.status === 'completed' && (
                  <div>
                    <h4 className="font-medium mb-4 text-lg">Laboratory Results</h4>
                    {result.results && formatLabResults(result.results)}
                    {result.normalValues && (
                      <div className="mt-2">
                        <span className="font-medium text-sm">Normal Values:</span>
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded mt-1">
                          <pre className="whitespace-pre-wrap text-sm">{result.normalValues}</pre>
                        </div>
                      </div>
                    )}
                    {result.technicianNotes && (
                      <div className="mt-2">
                        <span className="font-medium text-sm">Technician Notes:</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{result.technicianNotes}</p>
                      </div>
                    )}
                    
                    {/* Photo Attachments */}
                    {result.attachments && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Lab Printout Photos
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {JSON.parse(result.attachments).map((attachment: any, index: number) => (
                            <div key={index} className="border rounded p-2">
                              <img 
                                src={attachment.url} 
                                alt={attachment.name}
                                className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={() => window.open(attachment.url, '_blank')}
                              />
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                {attachment.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* X-Ray Results */}
            {result.type === 'xray' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Examination Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Exam Type:</span> {result.examType}
                    </div>
                    <div>
                      <span className="font-medium">Body Part:</span> {result.bodyPart}
                    </div>
                    <div>
                      <span className="font-medium">Urgency:</span> {result.urgency}
                    </div>
                    <div>
                      <span className="font-medium">Requested Date:</span> {format(new Date(result.requestedDate), 'MMM dd, yyyy')}
                    </div>
                    {result.clinicalIndication && (
                      <div className="col-span-2">
                        <span className="font-medium">Clinical Indication:</span>
                        <p className="mt-1 text-gray-700 dark:text-gray-300">{result.clinicalIndication}</p>
                      </div>
                    )}
                  </div>
                </div>

                {result.status === 'completed' && (
                  <div>
                    <h4 className="font-medium mb-2">Results</h4>
                    {result.findings && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Findings:</span>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-1">
                          <p className="text-sm">{result.findings}</p>
                        </div>
                      </div>
                    )}
                    {result.impression && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Impression:</span>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded mt-1">
                          <p className="text-sm">{result.impression}</p>
                        </div>
                      </div>
                    )}
                    {result.recommendations && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Recommendations:</span>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded mt-1">
                          <p className="text-sm">{result.recommendations}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ultrasound Results */}
            {result.type === 'ultrasound' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Examination Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Exam Type:</span> {result.examType}
                    </div>
                    <div>
                      <span className="font-medium">Urgency:</span> {result.urgency}
                    </div>
                    <div>
                      <span className="font-medium">Requested Date:</span> {format(new Date(result.requestedDate), 'MMM dd, yyyy')}
                    </div>
                    {result.indication && (
                      <div className="col-span-2">
                        <span className="font-medium">Indication:</span>
                        <p className="mt-1 text-gray-700 dark:text-gray-300">{result.indication}</p>
                      </div>
                    )}
                  </div>
                </div>

                {result.status === 'completed' && (
                  <div>
                    <h4 className="font-medium mb-2">Results</h4>
                    {result.findings && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Findings:</span>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-1">
                          <p className="text-sm">{result.findings}</p>
                        </div>
                      </div>
                    )}
                    {result.impression && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Impression:</span>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded mt-1">
                          <p className="text-sm">{result.impression}</p>
                        </div>
                      </div>
                    )}
                    {result.recommendations && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Recommendations:</span>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded mt-1">
                          <p className="text-sm">{result.recommendations}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Requested:</span> {format(new Date(result.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
                {result.completedDate && (
                  <div>
                    <span className="font-medium">Completed:</span> {format(new Date(result.completedDate), 'MMM dd, yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          All Patient Results
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Digital-Only Viewing • No Printer Required
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="">All Patients</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.patientId}>
                  {patient.firstName} {patient.lastName} ({patient.patientId})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Results</p>
                <p className="text-2xl font-bold">{filteredResults.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lab Tests</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredResults.filter(r => r.type === 'lab').length}
                </p>
              </div>
              <Microscope className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">X-Rays</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredResults.filter(r => r.type === 'xray').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ultrasounds</p>
                <p className="text-2xl font-bold text-teal-600">
                  {filteredResults.filter(r => r.type === 'ultrasound').length}
                </p>
              </div>
              <Stethoscope className="h-8 w-8 text-teal-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>All Results ({filteredResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No results found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((result, index) => (
                <div key={`${result.type}-${result.id}`} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getTypeIcon(result.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {result.patient?.firstName} {result.patient?.lastName}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {result.patient?.patientId}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-medium">
                            {result.type === 'lab' && `Lab: ${(result as any).testId}`}
                            {result.type === 'xray' && `X-Ray: ${(result as any).examId}`}
                            {result.type === 'ultrasound' && `US: ${(result as any).examId}`}
                          </span>
                          <span>•</span>
                          <span>{format(new Date(result.date), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(result.status)}
                        <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                          {result.status}
                        </Badge>
                      </div>
                      {renderResultDetails(result)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}