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
  
  // Use the new diagnosticPending field if available, otherwise fall back to individual counts
  if (serviceStatus.diagnosticPending !== undefined) {
    return serviceStatus.diagnosticPending > 0;
  }
  
  // Fallback: check individual diagnostic service pending counts
  const labPending = serviceStatus.labPending ?? 0;
  const xrayPending = serviceStatus.xrayPending ?? 0;
  const ultrasoundPending = serviceStatus.ultrasoundPending ?? 0;
  
  return (labPending + xrayPending + ultrasoundPending) > 0;
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
 * Get compact indicator badges for the patient table
 * 
 * Returns an object with waiting indicators for doctor workflow.
 * This helps doctors quickly identify which patients have pending diagnostic orders.
 * 
 * Note: "Results Ready" indicators are calculated separately in Treatment.tsx 
 * based on completed diagnostic queries.
 * 
 * @param patient - Patient object with serviceStatus
 * @returns Object with 'waiting' array of department names
 */
export function getPatientIndicators(patient: PatientWithStatus): { 
  waiting: string[]
} {
  const serviceStatus = patient.serviceStatus;
  const indicators = { waiting: [] as string[] };
  
  if (!serviceStatus) return indicators;
  
  // Waiting indicators (pending orders)
  if ((serviceStatus.labPending ?? 0) > 0) {
    indicators.waiting.push('Lab');
  }
  if ((serviceStatus.xrayPending ?? 0) > 0) {
    indicators.waiting.push('X-ray');
  }
  if ((serviceStatus.ultrasoundPending ?? 0) > 0) {
    indicators.waiting.push('Ultrasound');
  }
  
  return indicators;
}
