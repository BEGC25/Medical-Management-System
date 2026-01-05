/**
 * Display utility functions for medical orders
 * 
 * These functions generate consistent, human-readable display names for
 * diagnostic orders across the application (Treatment, X-Ray, Ultrasound, Payment pages).
 */

import type { XrayExam, UltrasoundExam } from '@shared/schema';

/**
 * Convert a string to Title Case
 */
function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
 */
export type XrayDisplayData = Pick<XrayExam, 'examType' | 'bodyPart'>;

/**
 * Type for Ultrasound exam data needed for display
 */
export type UltrasoundDisplayData = Pick<UltrasoundExam, 'examType'> & {
  specificExam?: string;
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
