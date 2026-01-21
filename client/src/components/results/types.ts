export interface Patient {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
}

export interface LabTest {
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

export interface XRayExam {
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

export interface UltrasoundExam {
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

export type ResultType = 'lab' | 'xray' | 'ultrasound';

export interface UnifiedResult {
  id: number;
  type: ResultType;
  patientId: string;
  status: string;
  date: string;
  createdAt: string;
  patient?: Patient;
}

export type LabResult = LabTest & UnifiedResult;
export type XRayResult = XRayExam & UnifiedResult;
export type UltrasoundResult = UltrasoundExam & UnifiedResult;
export type AnyResult = LabResult | XRayResult | UltrasoundResult;

export interface ResultsFilters {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  dateFilter: string;
  selectedDate: string;
  customStartDate?: string;
  customEndDate?: string;
  groupByPatient?: boolean;
}

export interface ResultsKPI {
  total: number;
  lab: number;
  xray: number;
  ultrasound: number;
  completed: number;
  pending: number;
  overdue: number;
  critical: number;
}
