/**
 * Display utility functions for medical orders
 * 
 * These functions generate consistent, human-readable display names for
 * diagnostic orders across the application (Treatment, X-Ray, Ultrasound, Payment pages).
 */

import type { XrayExam, UltrasoundExam } from '@shared/schema';

/**
 * Convert a string to Title Case
 * Exported for use in other utility functions
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format department name with consistent Title Case
 * Handles special cases like "xray" → "X-Ray", "lab" → "Lab"
 * 
 * @param departmentType - The department type (e.g., "lab", "xray", "ultrasound", "laboratory", "radiology")
 * @param includeSuffix - Whether to include "Department" suffix (default: true)
 * @returns Formatted department name (e.g., "Lab Department", "X-Ray Department")
 */
export function formatDepartmentName(departmentType: string, includeSuffix: boolean = true): string {
  if (!departmentType) return '';
  
  const type = departmentType.toLowerCase().trim();
  let formatted = '';
  
  // Map department types to their display names
  switch (type) {
    case 'lab':
    case 'laboratory':
    case 'lab_test_item':
      formatted = 'Lab';
      break;
    case 'xray':
    case 'x-ray':
    case 'radiology':
    case 'xray_exam':
      formatted = 'X-Ray';
      break;
    case 'ultrasound':
    case 'ultrasound_exam':
      formatted = 'Ultrasound';
      break;
    case 'pharmacy':
    case 'pharmacy_order':
      formatted = 'Pharmacy';
      break;
    default:
      // Use title case for unknown types, replacing underscores with spaces
      formatted = toTitleCase(type.replace(/_/g, ' '));
  }
  
  return includeSuffix ? `${formatted} Department` : formatted;
}

/**
 * Get human-readable label for X-Ray exam type
 */
function getExamTypeLabel(examType: string): string {
  const labels: Record<string, string> = {
    'chest': 'Chest',
    'abdomen': 'Abdomen',
    'spine': 'Spine',
    'extremities': 'Extremities',
    'pelvis': 'Pelvis',
    'skull': 'Skull',
  };
  return labels[examType.toLowerCase()] || toTitleCase(examType);
}

/**
 * Type for X-Ray exam data needed for display
 * Uses Partial to allow any object with at least examType and bodyPart
 */
export type XrayDisplayData = {
  examType: string;
  bodyPart?: string | null;
};

/**
 * Type for Ultrasound exam data needed for display
 * Uses Partial to allow any object with at least examType
 */
export type UltrasoundDisplayData = {
  examType: string;
  specificExam?: string | null;
};

/**
 * Generate complete display name for X-Ray exam
 * Format: "{Exam Type} X-Ray - {Body Part/View}"
 * Example: "Chest X-Ray - AP & Lateral"
 */
export function getXrayDisplayName(exam: XrayDisplayData): string {
  const examTypeLabel = getExamTypeLabel(exam.examType);
  const bodyPart = exam.bodyPart;
  
  if (bodyPart) {
    return `${examTypeLabel} X-Ray - ${bodyPart}`;
  }
  return `${examTypeLabel} X-Ray`;
}

/**
 * Generate complete display name for Ultrasound exam
 * Format: "{Exam Type} Ultrasound - {Specific Exam}" or "{Exam Type} - {Specific Exam}"
 * Example: "Abdominal Ultrasound - Complete Abdomen"
 */
export function getUltrasoundDisplayName(exam: UltrasoundDisplayData): string {
  const examTypeLabel = toTitleCase(exam.examType);
  
  if (exam.specificExam) {
    // If examType already contains "Ultrasound", don't duplicate it
    if (examTypeLabel.toLowerCase().includes('ultrasound')) {
      return `${examTypeLabel} - ${exam.specificExam}`;
    }
    return `${examTypeLabel} Ultrasound - ${exam.specificExam}`;
  }
  
  // If examType already contains "Ultrasound", use as-is
  if (examTypeLabel.toLowerCase().includes('ultrasound')) {
    return examTypeLabel;
  }
  
  return `${examTypeLabel} Ultrasound`;
}
