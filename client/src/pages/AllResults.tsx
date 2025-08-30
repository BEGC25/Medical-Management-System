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
  Eye,
  Printer,
  Plus
} from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  age: string;
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" id="lab-result-detail">
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
                  <span className="font-medium">Age:</span> {patient?.dateOfBirth ? 
                    `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years` : 
                    'Not provided'}
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

                {/* Clinical Summary & Interpretation */}
                {result.status === 'completed' && result.results && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Clinical Interpretation
                    </h4>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      {(() => {
                        try {
                          const parsed = JSON.parse(result.results);
                          const findings = [];
                          
                          // Check Blood Film for Malaria
                          if (parsed['Blood Film for Malaria (BFFM)']) {
                            const malaria = parsed['Blood Film for Malaria (BFFM)'];
                            if (malaria['Malaria Parasites'] && !malaria['Malaria Parasites'].includes('Not seen')) {
                              const parasites = malaria['Malaria Parasites'];
                              if (parasites.includes('P. falciparum')) {
                                findings.push('🚨 POSITIVE for Plasmodium falciparum malaria - Requires immediate treatment');
                              }
                              if (parasites.includes('P. vivax')) {
                                findings.push('🚨 POSITIVE for Plasmodium vivax malaria - Requires treatment');
                              }
                              if (parasites.includes('P. malariae')) {
                                findings.push('🚨 POSITIVE for Plasmodium malariae malaria - Requires treatment');
                              }
                              if (parasites.includes('P. ovale')) {
                                findings.push('🚨 POSITIVE for Plasmodium ovale malaria - Requires treatment');
                              }
                            }
                            if (malaria['Gametocytes'] && malaria['Gametocytes'].includes('Seen')) {
                              findings.push('⚠️ Gametocytes present - Patient is infectious');
                            }
                          }
                          
                          // Check Complete Blood Count (CBC)
                          if (parsed['Complete Blood Count (CBC)']) {
                            const cbc = parsed['Complete Blood Count (CBC)'];
                            if (cbc['Hemoglobin (Hb)']) {
                              const hb = parseFloat(cbc['Hemoglobin (Hb)']);
                              if (hb < 8.0) {
                                findings.push('🚨 Severe anemia detected - Immediate intervention required');
                              } else if (hb < 10.0) {
                                findings.push('⚠️ Moderate anemia - Treatment recommended');
                              }
                            }
                          }
                          
                          // Check Hemoglobin (HB) as standalone test
                          if (parsed['Hemoglobin (HB)']) {
                            const hb = parsed['Hemoglobin (HB)'];
                            // Check multiple possible field names for hemoglobin value
                            const hbValue = hb['Hemoglobin Level'] || hb['Hemoglobin'] || hb['Hb Level'] || hb['Hb'] || hb['Value'];
                            if (hbValue) {
                              const hbLevel = parseFloat(hbValue);
                              if (hbLevel < 6.0) {
                                findings.push('🚨 CRITICALLY LOW hemoglobin (' + hbLevel + ' g/dL) - Life-threatening anemia, requires immediate blood transfusion');
                              } else if (hbLevel < 8.0) {
                                findings.push('🚨 Severe anemia (' + hbLevel + ' g/dL) - Immediate intervention required');
                              } else if (hbLevel < 10.0) {
                                findings.push('⚠️ Moderate anemia (' + hbLevel + ' g/dL) - Treatment recommended');
                              } else if (hbLevel < 12.0) {
                                findings.push('⚠️ Mild anemia (' + hbLevel + ' g/dL) - Monitor and treat underlying cause');
                              }
                            }
                          }
                          
                          // Check Widal Test
                          if (parsed['Widal Test (Typhoid)']) {
                            const widal = parsed['Widal Test (Typhoid)'];
                            if (widal['S. Typhi (O)Ag']?.includes('1:160') || widal['S. Typhi (H)Ag']?.includes('1:160') ||
                                widal['S. Typhi (O)Ag']?.includes('1:320') || widal['S. Typhi (H)Ag']?.includes('1:320')) {
                              findings.push('⚠️ Elevated typhoid titers - Consider typhoid fever');
                            }
                            if (widal['S. Paratyphi A']?.includes('1:160') || widal['S. Paratyphi B']?.includes('1:160') ||
                                widal['S. Paratyphi A']?.includes('1:320') || widal['S. Paratyphi B']?.includes('1:320')) {
                              findings.push('⚠️ Elevated paratyphoid titers - Consider paratyphoid infection');
                            }
                          }
                          
                          // Check Brucella Test
                          if (parsed['Brucella Test (B.A.T)']) {
                            const brucella = parsed['Brucella Test (B.A.T)'];
                            if (brucella['B. Abortus']?.includes('1:160') || brucella['B. Malitensis']?.includes('1:160') ||
                                brucella['B. Abortus']?.includes('1:320') || brucella['B. Malitensis']?.includes('1:320')) {
                              findings.push('🚨 Brucella infection detected - Requires antibiotic treatment and contact tracing');
                            }
                          }
                          
                          // Check VDRL (Syphilis)
                          if (parsed['VDRL (Syphilis)']) {
                            const vdrl = parsed['VDRL (Syphilis)'];
                            if (vdrl['VDRL Result']?.includes('Reactive') || vdrl['VDRL Result']?.includes('Positive')) {
                              findings.push('🚨 Syphilis positive - Requires immediate treatment and partner notification');
                            }
                          }

                          // Check Urine Analysis - COMPREHENSIVE
                          if (parsed['Urine Analysis']) {
                            const urine = parsed['Urine Analysis'];
                            
                            // Appearance
                            if (urine['Appearance']?.includes('Bloody') || urine['Appearance']?.includes('Red')) {
                              findings.push('🚨 Bloody urine - Requires immediate investigation');
                            }
                            if (urine['Appearance']?.includes('Turbid') || urine['Appearance']?.includes('Cloudy')) {
                              findings.push('⚠️ Cloudy urine - Possible infection');
                            }
                            
                            // Protein levels
                            if (urine['Protein']?.includes('+++')) {
                              findings.push('🚨 Severe proteinuria - Serious kidney disease suspected');
                            } else if (urine['Protein']?.includes('++')) {
                              findings.push('⚠️ Moderate proteinuria - Kidney function needs assessment');
                            } else if (urine['Protein']?.includes('+')) {
                              findings.push('⚠️ Mild proteinuria - Monitor kidney function');
                            }
                            
                            // Glucose
                            if (urine['Glucose']?.includes('+++')) {
                              findings.push('🚨 Severe glucosuria - Diabetes likely, check blood glucose urgently');
                            } else if (urine['Glucose']?.includes('++')) {
                              findings.push('⚠️ Moderate glucosuria - Check blood glucose levels');
                            } else if (urine['Glucose']?.includes('+')) {
                              findings.push('⚠️ Mild glucosuria - Monitor blood glucose');
                            }
                            
                            // Acetone (Ketones)
                            if (urine['Acetone']?.includes('++') || urine['Acetone']?.includes('+++')) {
                              findings.push('🚨 High ketones in urine - Diabetic ketoacidosis risk');
                            } else if (urine['Acetone']?.includes('+')) {
                              findings.push('⚠️ Ketones detected - Monitor for diabetes complications');
                            }
                            
                            // Hemoglobin pigment
                            if (urine['Hb pigment']?.includes('++') || urine['Hb pigment']?.includes('+++')) {
                              findings.push('🚨 High hemoglobin in urine - Severe hemolysis or bleeding');
                            } else if (urine['Hb pigment']?.includes('+')) {
                              findings.push('⚠️ Hemoglobin in urine - Blood in urine detected');
                            }
                            
                            // Leucocytes
                            if (urine['Leucocytes']?.includes('++') || urine['Leucocytes']?.includes('+++')) {
                              findings.push('⚠️ High leucocytes in urine - Urinary tract infection likely');
                            } else if (urine['Leucocytes']?.includes('+')) {
                              findings.push('⚠️ Leucocytes in urine - Possible UTI');
                            }
                            
                            // Nitrite
                            if (urine['Nitrite']?.includes('Positive')) {
                              findings.push('⚠️ Nitrite positive - Bacterial infection confirmed');
                            }
                            
                            // Bilirubin
                            if (urine['Bilirubin']?.includes('+') || urine['Bilirubin']?.includes('++')) {
                              findings.push('⚠️ Bilirubin in urine - Liver dysfunction or bile duct obstruction');
                            }
                          }

                          // Check Urine Microscopy - COMPREHENSIVE
                          if (parsed['Urine Microscopy']) {
                            const microscopy = parsed['Urine Microscopy'];
                            
                            // Casts (very important)
                            if (microscopy['Casts']?.includes('Cellular')) {
                              findings.push('🚨 Cellular casts - Acute kidney injury or glomerulonephritis');
                            }
                            if (microscopy['Casts']?.includes('Granular')) {
                              findings.push('⚠️ Granular casts - Chronic kidney disease');
                            }
                            if (microscopy['Casts']?.includes('Hyaline')) {
                              findings.push('⚠️ Hyaline casts - Mild kidney stress');
                            }
                            
                            // Parasites
                            if (microscopy['Trichomonas']?.includes('Seen')) {
                              findings.push('🚨 Trichomonas infection - Sexually transmitted infection requires treatment');
                            }
                            
                            // Cell counts
                            if (microscopy['Pus Cells']) {
                              const pusCells = parseInt(microscopy['Pus Cells']);
                              if (pusCells > 20) {
                                findings.push('🚨 Very high pus cells in urine - Severe urinary tract infection');
                              } else if (pusCells > 10) {
                                findings.push('🚨 High pus cells in urine - Urinary tract infection');
                              } else if (pusCells > 5) {
                                findings.push('⚠️ Elevated pus cells - Possible UTI');
                              }
                            }
                            
                            if (microscopy['RBC']) {
                              const rbc = parseInt(microscopy['RBC']);
                              if (rbc > 10) {
                                findings.push('🚨 High red blood cells in urine - Significant hematuria');
                              } else if (rbc > 5) {
                                findings.push('🚨 Blood cells in urine - Hematuria requires investigation');
                              } else if (rbc > 2) {
                                findings.push('⚠️ Red blood cells in urine - Mild hematuria');
                              }
                            }
                            
                            // Crystals
                            if (microscopy['Crystals']?.includes('Uric acid')) {
                              findings.push('⚠️ Uric acid crystals - Risk of kidney stones');
                            }
                            if (microscopy['Crystals']?.includes('Calcium oxalate')) {
                              findings.push('⚠️ Calcium oxalate crystals - Risk of kidney stones');
                            }
                            
                            if (microscopy['Epithelial cells']?.includes('Many')) {
                              findings.push('⚠️ Many epithelial cells - Possible contamination or urogenital inflammation');
                            }
                          }
                          
                          // Check Stool Examination - COMPREHENSIVE
                          if (parsed['Stool Examination']) {
                            const stool = parsed['Stool Examination'];
                            
                            // Appearance
                            if (stool['Appearance']?.includes('Bloody')) {
                              findings.push('🚨 Blood in stool - Serious gastrointestinal bleeding requires investigation');
                            }
                            if (stool['Consistency']?.includes('Loose') || stool['Consistency']?.includes('Watery')) {
                              findings.push('⚠️ Diarrhea present - Monitor for dehydration');
                            }
                            
                            // Parasites - Ova/Cyst
                            if (stool['Ova/Cyst']?.includes('Ascaris')) {
                              findings.push('🚨 Ascaris worms detected - Requires immediate deworming treatment');
                            }
                            if (stool['Ova/Cyst']?.includes('Hookworm')) {
                              findings.push('🚨 Hookworm infection - Requires deworming and iron supplementation');
                            }
                            if (stool['Ova/Cyst']?.includes('Trichuris')) {
                              findings.push('🚨 Whipworm infection - Requires deworming treatment');
                            }
                            if (stool['Ova/Cyst']?.includes('S. mansoni')) {
                              findings.push('🚨 Schistosomiasis detected - Requires specialized treatment');
                            }
                            
                            // Trophozoites
                            if (stool['Trophozoites']?.includes('E. histolytica')) {
                              findings.push('🚨 E. histolytica detected - Serious parasitic infection causing dysentery');
                            }
                            if (stool['Trophozoites']?.includes('G. lamblia')) {
                              findings.push('⚠️ Giardia detected - Requires antiparasitic treatment');
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
                            if (hepC['HCV Ab']?.includes('Positive')) {
                              findings.push('🚨 Hepatitis C positive - Requires specialist consultation');
                            }
                          }
                          
                          // Check HIV
                          if (parsed['HIV Test (RCT P24)']) {
                            const hiv = parsed['HIV Test (RCT P24)'];
                            if (hiv['HIV Result']?.includes('Positive')) {
                              findings.push('🚨 HIV positive - Requires counseling and specialist care');
                            }
                          }
                          
                          // Check Pregnancy Test
                          if (parsed['Pregnancy Test (HCG)']) {
                            const pregnancy = parsed['Pregnancy Test (HCG)'];
                            if (pregnancy['Beta HCG']?.includes('Positive')) {
                              findings.push('✅ Pregnancy detected - Prenatal care recommended');
                            }
                          }
                          
                          // Check Blood Sugar levels - RBS and FBS separately
                          if (parsed['Random Blood Sugar (RBS)']) {
                            const rbs = parsed['Random Blood Sugar (RBS)'];
                            if (rbs['Blood Glucose']) {
                              const glucose = parseFloat(rbs['Blood Glucose']);
                              if (glucose > 250) {
                                findings.push('🚨 Extremely high random blood glucose (' + glucose + ' mg/dL) - Severe diabetes, immediate treatment');
                              } else if (glucose > 200) {
                                findings.push('🚨 Very high random blood glucose (' + glucose + ' mg/dL) - Diabetes likely');
                              } else if (glucose > 140) {
                                findings.push('⚠️ Elevated random blood glucose (' + glucose + ' mg/dL) - Monitor for diabetes');
                              } else if (glucose < 70) {
                                findings.push('🚨 Low blood glucose (' + glucose + ' mg/dL) - Hypoglycemia, immediate treatment needed');
                              }
                            }
                          }
                          
                          if (parsed['Fasting Blood Sugar (FBS)']) {
                            const fbs = parsed['Fasting Blood Sugar (FBS)'];
                            if (fbs['Blood Glucose']) {
                              const glucose = parseFloat(fbs['Blood Glucose']);
                              if (glucose > 140) {
                                findings.push('🚨 High fasting blood glucose (' + glucose + ' mg/dL) - Diabetes confirmed');
                              } else if (glucose > 110) {
                                findings.push('⚠️ Elevated fasting blood glucose (' + glucose + ' mg/dL) - Pre-diabetes');
                              } else if (glucose < 70) {
                                findings.push('🚨 Low fasting blood glucose (' + glucose + ' mg/dL) - Hypoglycemia');
                              }
                            }
                          }
                          
                          // Legacy check for combined Blood Sugar (RBS/FBS)
                          if (parsed['Blood Sugar (RBS/FBS)']) {
                            const sugar = parsed['Blood Sugar (RBS/FBS)'];
                            if (sugar['Blood Glucose']) {
                              const glucose = parseFloat(sugar['Blood Glucose']);
                              if (glucose > 200) {
                                findings.push('🚨 Very high blood glucose - Diabetes likely, immediate treatment needed');
                              } else if (glucose > 140) {
                                findings.push('⚠️ Elevated blood glucose - Diabetes risk, further testing needed');
                              } else if (glucose < 70) {
                                findings.push('🚨 Low blood glucose - Hypoglycemia, immediate treatment needed');
                              }
                            }
                          }

                          // Check NEW TROPICAL DISEASE TESTS
                          // Check Toxoplasma Test
                          if (parsed['Toxoplasma Test']) {
                            const toxo = parsed['Toxoplasma Test'];
                            if (toxo['Toxoplasma IgM']?.includes('Positive')) {
                              findings.push('🚨 Acute toxoplasmosis detected - Dangerous for pregnant women and immunocompromised patients');
                            }
                            if (toxo['Toxoplasma IgG']?.includes('Positive')) {
                              findings.push('⚠️ Previous toxoplasmosis exposure detected - Monitor if pregnant');
                            }
                          }

                          // Check Filariasis Tests
                          if (parsed['Filariasis Tests']) {
                            const filaria = parsed['Filariasis Tests'];
                            if (filaria['Skin Snip for Onchocerca']?.includes('Microfilariae present')) {
                              findings.push('🚨 Onchocerciasis (River blindness) detected - Requires ivermectin treatment');
                            }
                            if (filaria['Wet Mount for Microfilariae']?.includes('W. bancrofti') || 
                                filaria['Wet Mount for Microfilariae']?.includes('Loa loa') ||
                                filaria['Wet Mount for Microfilariae']?.includes('O. volvulus')) {
                              findings.push('🚨 Lymphatic filariasis detected - Requires antihelminthic treatment');
                            }
                            if (filaria['Diethylcarbamazine (DEC) Test']?.includes('Positive')) {
                              findings.push('🚨 Filariasis confirmed by DEC test - Treatment required');
                            }
                          }

                          // Check Schistosomiasis Test
                          if (parsed['Schistosomiasis Test']) {
                            const schisto = parsed['Schistosomiasis Test'];
                            if (schisto['Urine Microscopy for Ova']?.includes('S. haematobium ova present')) {
                              findings.push('🚨 Urogenital schistosomiasis detected - Requires praziquantel treatment');
                            }
                            if (schisto['Stool for S. mansoni']?.includes('S. mansoni ova present')) {
                              findings.push('🚨 Intestinal schistosomiasis detected - Requires praziquantel treatment');
                            }
                          }

                          // Check Leishmaniasis Test
                          if (parsed['Leishmaniasis Test']) {
                            const leish = parsed['Leishmaniasis Test'];
                            if (leish['Skin Scraping']?.includes('Leishmania amastigotes present')) {
                              findings.push('🚨 Leishmaniasis detected by skin scraping - Requires specialized treatment');
                            }
                            if (leish['rK39 Rapid Test']?.includes('Positive')) {
                              findings.push('🚨 Leishmaniasis confirmed by rapid test - Specialized treatment needed');
                            }
                          }

                          // Check STI Tests
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

                          // Check Tuberculosis Tests
                          if (parsed['Tuberculosis Tests']) {
                            const tb = parsed['Tuberculosis Tests'];
                            if (tb['AFB Smear']?.includes('+ AFB')) {
                              findings.push('🚨 Tuberculosis detected by AFB smear - Requires immediate isolation and treatment');
                            }
                            if (tb['GeneXpert MTB/RIF']?.includes('MTB detected')) {
                              findings.push('🚨 Tuberculosis confirmed by GeneXpert - Start anti-TB treatment immediately');
                              if (tb['GeneXpert MTB/RIF']?.includes('RIF resistant')) {
                                findings.push('🚨 Drug-resistant tuberculosis detected - Requires specialist consultation');
                              }
                            }
                          }

                          // Check Emergency Disease Tests
                          if (parsed['Yellow Fever Test']) {
                            const yf = parsed['Yellow Fever Test'];
                            if (yf['Yellow Fever IgM']?.includes('Positive')) {
                              findings.push('🚨 Acute yellow fever detected - Report to health authorities immediately');
                            }
                          }

                          if (parsed['Meningitis Tests']) {
                            const csf = parsed['Meningitis Tests'];
                            if (csf['Bacterial Antigen'] && !csf['Bacterial Antigen'].includes('Negative')) {
                              findings.push('🚨 Bacterial meningitis confirmed - Medical emergency requiring immediate treatment');
                            }
                            if (csf['CSF Protein'] && parseFloat(csf['CSF Protein']) > 100) {
                              findings.push('🚨 Very high CSF protein - Likely bacterial meningitis');
                            }
                          }
                          
                          // Check Renal Function Test
                          if (parsed['Renal Function Test (RFT)']) {
                            const rft = parsed['Renal Function Test (RFT)'];
                            if (rft['Urea']) {
                              const urea = parseFloat(rft['Urea']);
                              if (urea > 50) {
                                findings.push('🚨 Very high urea - Severe kidney dysfunction');
                              } else if (urea > 20) {
                                findings.push('⚠️ Elevated urea - Kidney function impaired');
                              }
                            }
                            if (rft['Creatinine']) {
                              const creatinine = parseFloat(rft['Creatinine']);
                              if (creatinine > 3.0) {
                                findings.push('🚨 Very high creatinine - Severe kidney failure');
                              } else if (creatinine > 1.5) {
                                findings.push('⚠️ Elevated creatinine - Kidney function reduced');
                              }
                            }
                            if (rft['BUN']) {
                              const bun = parseFloat(rft['BUN']);
                              if (bun > 30) {
                                findings.push('🚨 Very high BUN - Severe kidney dysfunction');
                              } else if (bun > 20) {
                                findings.push('⚠️ Elevated BUN - Kidney function needs evaluation');
                              }
                            }
                          }


                          
                          if (findings.length === 0) {
                            return <span className="text-green-700 dark:text-green-300">✓ No significant abnormal findings detected</span>;
                          }
                          
                          return (
                            <div className="space-y-2">
                              <div className="font-medium text-red-700 dark:text-red-300">Critical Findings Requiring Attention:</div>
                              {findings.map((finding, index) => (
                                <div key={index} className="text-sm bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-red-500">{finding}</div>
                              ))}
                            </div>
                          );
                        } catch (e) {
                          return <span className="text-gray-600 dark:text-gray-400">Results available - Please review detailed findings below</span>;
                        }
                      })()}
                    </div>
                  </div>
                )}

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
                
                {/* Follow-up Test Ordering for Doctors */}
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Order Follow-up Tests
                      </h5>
                      <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                        Based on these findings, order additional tests for this patient
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        // Navigate to Laboratory page with pre-filled patient data
                        window.location.href = `/laboratory?patientId=${result.patientId}&followUp=true`;
                      }}
                      size="sm" 
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Order Tests
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Print Button for Lab Reports */}
            {result.type === 'lab' && result.status === 'completed' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Print Laboratory Report</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Generate a printable medical report for patient records</p>
                  </div>
                  <Button 
                    onClick={() => {
                      // Create printable content
                      const printContent = `
                        <html>
                          <head>
                            <title>Laboratory Report - ${result.testId}</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                              .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                              .clinic-name { font-size: 24px; font-weight: bold; color: #2563eb; }
                              .clinic-subtitle { color: #666; margin-top: 5px; }
                              .section { margin-bottom: 25px; }
                              .section-title { font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
                              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                              .info-item { margin-bottom: 8px; }
                              .test-section { border: 1px solid #e5e5e5; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
                              .test-title { font-size: 16px; font-weight: bold; color: #2563eb; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                              .result-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
                              .abnormal { color: #dc2626; font-weight: bold; }
                              .normal { color: #16a34a; }
                              .critical-findings { background-color: #fef2f2; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                              .critical-title { color: #dc2626; font-weight: bold; margin-bottom: 10px; font-size: 16px; }
                              .finding { color: #991b1b; margin-bottom: 8px; font-weight: 500; }
                              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
                              @media print { body { margin: 0; } }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div class="clinic-name">BAHR EL GHAZAL CLINIC</div>
                              <div class="clinic-subtitle">Your Health, Our Priority</div>
                              <div style="font-size: 12px; color: #666; margin-top: 10px;">
                                Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com
                              </div>
                              <div style="font-size: 18px; font-weight: bold; color: #16a34a; margin-top: 15px;">
                                LABORATORY REPORT
                              </div>
                            </div>
                            
                            <div class="section">
                              <div class="section-title">Patient Information</div>
                              <div class="info-grid">
                                <div class="info-item"><strong>Name:</strong> ${patient?.firstName} ${patient?.lastName}</div>
                                <div class="info-item"><strong>Patient ID:</strong> ${patient?.patientId}</div>
                                <div class="info-item"><strong>Age:</strong> ${patient?.age || 'Not provided'}</div>
                                <div class="info-item"><strong>Gender:</strong> ${patient?.gender || 'Not provided'}</div>
                              </div>
                            </div>
                            
                            <div class="section">
                              <div class="section-title">Test Information</div>
                              <div class="info-grid">
                                <div class="info-item"><strong>Test ID:</strong> ${result.testId}</div>
                                <div class="info-item"><strong>Category:</strong> ${result.category}</div>
                                <div class="info-item"><strong>Requested:</strong> ${format(new Date(result.requestedDate + 'T14:47:00'), 'MMM dd, yyyy')}</div>
                                <div class="info-item"><strong>Completed:</strong> ${result.completedDate ? format(new Date(result.completedDate + 'T19:00:00'), 'MMM dd, yyyy') : 'N/A'}</div>
                              </div>
                              <div style="margin-top: 15px;">
                                <strong>Tests Performed:</strong>
                                <ul style="margin-top: 5px; margin-left: 20px;">
                                  ${JSON.parse(result.tests || "[]").map((test: string) => `<li>${test}</li>`).join('')}
                                </ul>
                              </div>
                            </div>
                            
                            ${(() => {
                              try {
                                const parsed = JSON.parse(result.results);
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
                                
                                // Check Hepatitis B
                                if (parsed['Hepatitis B Test (HBsAg)']) {
                                  const hepB = parsed['Hepatitis B Test (HBsAg)'];
                                  if (hepB['HBsAg']?.includes('Positive')) {
                                    findings.push('🚨 Hepatitis B positive - Requires specialist consultation and monitoring');
                                  }
                                }
                                
                                if (findings.length > 0) {
                                  return `
                                    <div class="critical-findings">
                                      <div class="critical-title">CRITICAL FINDINGS REQUIRING ATTENTION</div>
                                      ${findings.map(finding => `<div class="finding">${finding}</div>`).join('')}
                                    </div>
                                  `;
                                }
                                return '';
                              } catch (e) {
                                return '';
                              }
                            })()}
                            
                            <div class="section">
                              <div class="section-title">Laboratory Results</div>
                              ${(() => {
                                try {
                                  const parsed = JSON.parse(result.results);
                                  return Object.entries(parsed).map(([testName, testData]: [string, any]) => `
                                    <div class="test-section">
                                      <div class="test-title">${testName}</div>
                                      ${Object.entries(testData).map(([field, value]: [string, any]) => `
                                        <div class="result-row">
                                          <span>${field}:</span>
                                          <span class="${
                                            (value as string).includes('+') || (value as string).includes('P. falciparum') || 
                                            (value as string).includes('Positive') || (value as string).includes('Seen') || 
                                            (value as string).includes('Turbid') || (value as string).includes('1:160')
                                              ? 'abnormal' : 'normal'
                                          }">${value}</span>
                                        </div>
                                      `).join('')}
                                    </div>
                                  `).join('');
                                } catch (e) {
                                  return `<div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px;">Results: ${result.results}</div>`;
                                }
                              })()}
                            </div>
                            
                            <div class="footer">
                              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                                <div>
                                  <div>Lab Technician: _________________________</div>
                                  <div style="margin-top: 10px;">Date: _________________________</div>
                                </div>
                                <div>
                                  <div>Reviewed by Doctor: _________________________</div>
                                  <div style="margin-top: 10px;">Date: _________________________</div>
                                </div>
                              </div>
                              <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
                                Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com
                              </div>
                            </div>
                          </body>
                        </html>
                      `;
                      
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(printContent);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => printWindow.print(), 500);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </Button>
                </div>
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