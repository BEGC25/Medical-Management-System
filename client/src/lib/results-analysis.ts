/**
 * Results Analysis Utility Module
 * 
 * Provides utilities for analyzing diagnostic results including:
 * - Aging calculations for pending results
 * - Overdue detection based on department thresholds
 * - Abnormal/critical result detection
 * - Turnaround time (TAT) calculations
 */

import { interpretLabResults } from './lab-interpretation';

export interface AgingInfo {
  daysOld: number;
  isOverdue: boolean;
  threshold: number;
}

export interface TATStats {
  lab: number;
  xray: number;
  ultrasound: number;
  overall: number;
}

/**
 * Calculate how many days old a result is based on requested date
 */
export function calculateAging(requestedDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const requested = new Date(requestedDate);
  requested.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - requested.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Get overdue threshold for a department
 */
export function getOverdueThreshold(type: 'lab' | 'xray' | 'ultrasound'): number {
  switch (type) {
    case 'lab':
      return 3; // Lab tests overdue after 3 days
    case 'xray':
      return 5; // X-Ray overdue after 5 days
    case 'ultrasound':
      return 7; // Ultrasound overdue after 7 days
    default:
      return 3;
  }
}

/**
 * Check if a pending result is overdue
 */
export function isOverdue(requestedDate: string, type: 'lab' | 'xray' | 'ultrasound', status: string): boolean {
  if (status !== 'pending') {
    return false;
  }
  
  const daysOld = calculateAging(requestedDate);
  const threshold = getOverdueThreshold(type);
  
  return daysOld > threshold;
}

/**
 * Get aging information for a result
 */
export function getAgingInfo(requestedDate: string, type: 'lab' | 'xray' | 'ultrasound', status: string): AgingInfo {
  const daysOld = calculateAging(requestedDate);
  const threshold = getOverdueThreshold(type);
  const overdue = status === 'pending' && daysOld > threshold;
  
  return {
    daysOld,
    isOverdue: overdue,
    threshold
  };
}

/**
 * Calculate turnaround time (TAT) in days for a completed result
 */
export function calculateTAT(requestedDate: string, completedDate: string | null): number | null {
  if (!completedDate) {
    return null;
  }
  
  const requested = new Date(requestedDate);
  requested.setHours(0, 0, 0, 0);
  
  const completed = new Date(completedDate);
  completed.setHours(0, 0, 0, 0);
  
  const diffTime = completed.getTime() - requested.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return Math.max(0, diffDays);
}

/**
 * Check if a lab result has abnormal/critical findings
 */
export function hasAbnormalFindings(results: string | null): boolean {
  if (!results) {
    return false;
  }
  
  try {
    const parsedResults = JSON.parse(results);
    const interpretation = interpretLabResults(parsedResults);
    
    // Consider it abnormal if there are any critical findings or warnings
    return interpretation.criticalFindings.length > 0 || interpretation.warnings.length > 0;
  } catch (error) {
    // If results can't be parsed, assume not abnormal
    return false;
  }
}

/**
 * Check if a lab result has critical findings (not just warnings)
 */
export function hasCriticalFindings(results: string | null): boolean {
  if (!results) {
    return false;
  }
  
  try {
    const parsedResults = JSON.parse(results);
    const interpretation = interpretLabResults(parsedResults);
    
    // Only critical findings, not warnings
    return interpretation.criticalFindings.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get critical/abnormal findings for a lab result
 */
export function getAbnormalFindings(results: string | null): { critical: string[]; warnings: string[] } {
  if (!results) {
    return { critical: [], warnings: [] };
  }
  
  try {
    const parsedResults = JSON.parse(results);
    const interpretation = interpretLabResults(parsedResults);
    
    return {
      critical: interpretation.criticalFindings,
      warnings: interpretation.warnings
    };
  } catch (error) {
    return { critical: [], warnings: [] };
  }
}

/**
 * Check if an X-Ray or Ultrasound result has abnormal findings
 * (Based on keywords in findings/impression)
 */
export function hasAbnormalImagingFindings(findings: string | null, impression: string | null): boolean {
  const text = `${findings || ''} ${impression || ''}`.toLowerCase();
  
  // Keywords that suggest abnormal findings
  const abnormalKeywords = [
    'fracture', 'mass', 'tumor', 'abnormal', 'pathological',
    'infection', 'inflammation', 'fluid', 'effusion', 'pneumonia',
    'consolidation', 'opacity', 'nodule', 'lesion', 'stricture',
    'obstruction', 'dilation', 'enlarged', 'thickening', 'atrophy'
  ];
  
  return abnormalKeywords.some(keyword => text.includes(keyword));
}
