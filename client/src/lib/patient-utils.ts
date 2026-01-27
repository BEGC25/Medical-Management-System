/**
 * Utility functions for patient data processing
 */

import type { PatientWithStatus } from "@shared/schema";

/**
 * Check if a patient has pending (unprocessed) diagnostic orders
 * 
 * @param patient - Patient object with serviceStatus
 * @returns true if patient has any pending lab/xray/ultrasound orders
 * 
 * Note: "Pending" means the order is waiting to be processed by the department (clinical concern),
 * not to be confused with "Unpaid" which is a billing concern.
 * 
 * Implementation: We check both the boolean flag and count for robustness.
 * The boolean flag is the primary check, but we also verify the count as a fallback
 * in case the flag is not set correctly due to database inconsistencies.
 */
export function hasPendingOrders(patient: PatientWithStatus): boolean {
  const serviceStatus = patient.serviceStatus;
  if (!serviceStatus) return false;
  
  // Check both flag and count for robustness - either indicates pending orders exist
  return serviceStatus.hasPendingServices === true || (serviceStatus.pendingServices ?? 0) > 0;
}

/**
 * Check if a patient has diagnostic orders waiting (Lab/X-ray/Ultrasound only)
 * 
 * This is doctor-centric and excludes pharmacy orders. Used for the "Orders Waiting" 
 * stat card to help doctors identify patients whose diagnostic tests need review.
 * 
 * @param patient - Patient object with serviceStatus
 * @returns true if patient has pending Lab, X-ray, or Ultrasound orders
 */
export function hasDiagnosticOrdersWaiting(patient: PatientWithStatus): boolean {
  const serviceStatus = patient.serviceStatus;
  if (!serviceStatus) return false;
  
  // Use the new diagnosticPending field if available
  if (serviceStatus.diagnosticPending !== undefined) {
    return serviceStatus.diagnosticPending > 0;
  }
  
  // Fallback: use getTotalDiagnosticPending for consistency
  return getTotalDiagnosticPending(patient) > 0;
}

/**
 * Get a human-readable summary of which diagnostic departments have pending orders
 * 
 * @param patient - Patient object with serviceStatus
 * @returns Array of department names with pending orders (e.g., ["Lab", "X-ray"])
 */
export function getDiagnosticPendingDepartments(patient: PatientWithStatus): string[] {
  const serviceStatus = patient.serviceStatus;
  if (!serviceStatus) return [];
  
  const departments: string[] = [];
  
  if ((serviceStatus.labPending ?? 0) > 0) {
    departments.push(`Lab (${serviceStatus.labPending})`);
  }
  if ((serviceStatus.xrayPending ?? 0) > 0) {
    departments.push(`X-ray (${serviceStatus.xrayPending})`);
  }
  if ((serviceStatus.ultrasoundPending ?? 0) > 0) {
    departments.push(`Ultrasound (${serviceStatus.ultrasoundPending})`);
  }
  
  return departments;
}

/**
 * Get the total count of pending diagnostic orders across all departments
 * 
 * @param patient - Patient object with serviceStatus
 * @returns Total number of pending diagnostic orders
 */
export function getTotalDiagnosticPending(patient: PatientWithStatus): number {
  const serviceStatus = patient.serviceStatus;
  if (!serviceStatus) return 0;
  
  const labPending = serviceStatus.labPending ?? 0;
  const xrayPending = serviceStatus.xrayPending ?? 0;
  const ultrasoundPending = serviceStatus.ultrasoundPending ?? 0;
  
  return labPending + xrayPending + ultrasoundPending;
}

/**
 * Pluralize a word based on count
 * 
 * @param count - Number to check for pluralization
 * @param singular - Singular form of the word
 * @param plural - Optional plural form (defaults to singular + 's')
 * @returns Pluralized word
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

/**
 * Get department route path from department name
 * 
 * @param departmentName - Name of the department (e.g., "Lab", "X-ray", "Ultrasound")
 * @returns Route path for the department
 */
export function getDepartmentPath(departmentName: string): string {
  const normalizedName = departmentName.toLowerCase();
  
  if (normalizedName.includes('lab')) return '/laboratory';
  if (normalizedName.includes('x-ray') || normalizedName.includes('xray')) return '/x-ray';
  if (normalizedName.includes('ultrasound')) return '/ultrasound';
  
  // Default fallback (should not happen with current department names)
  return '/';
}

/**
 * Map of ready results by patient ID
 * 
 * This structure holds completed diagnostic results grouped by patient.
 * Each patient can have ready results in Lab, X-ray, and/or Ultrasound departments.
 */
export interface ResultsReadyMap {
  [patientId: string]: {
    lab?: number;
    xray?: number;
    ultrasound?: number;
  };
}

/**
 * Helper to add a department indicator with count to an array
 * 
 * @param indicators - Array to append to
 * @param count - Count of items in this department
 * @param departmentName - Name of the department
 */
function addDepartmentIndicator(indicators: string[], count: number | undefined, departmentName: string): void {
  if ((count ?? 0) > 0) {
    indicators.push(`${departmentName} (${count})`);
  }
}

/**
 * Get compact indicator badges for the patient table
 * 
 * Returns an object with both waiting and ready indicators for doctor workflow.
 * This helps doctors quickly identify:
 * - Which patients have pending diagnostic orders (waiting)
 * - Which patients have completed results ready for review (ready)
 * 
 * @param patient - Patient object with serviceStatus
 * @param resultsReadyMap - Optional map of completed results by patient ID
 * @returns Object with 'waiting' and 'ready' arrays of department names with counts
 */
export function getPatientIndicators(
  patient: PatientWithStatus,
  resultsReadyMap?: ResultsReadyMap
): { 
  waiting: string[];
  ready: string[];
} {
  const serviceStatus = patient.serviceStatus;
  const indicators = { waiting: [] as string[], ready: [] as string[] };
  
  if (!serviceStatus) return indicators;
  
  // Waiting indicators (pending orders)
  addDepartmentIndicator(indicators.waiting, serviceStatus.labPending, 'Lab');
  addDepartmentIndicator(indicators.waiting, serviceStatus.xrayPending, 'X-ray');
  addDepartmentIndicator(indicators.waiting, serviceStatus.ultrasoundPending, 'Ultrasound');
  
  // Ready indicators (completed results)
  if (resultsReadyMap && resultsReadyMap[patient.patientId]) {
    const ready = resultsReadyMap[patient.patientId];
    addDepartmentIndicator(indicators.ready, ready.lab, 'Lab');
    addDepartmentIndicator(indicators.ready, ready.xray, 'X-ray');
    addDepartmentIndicator(indicators.ready, ready.ultrasound, 'Ultrasound');
  }
  
  return indicators;
}
