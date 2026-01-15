/**
 * Clinical Alerts - Critical Lab Value Definitions
 * 
 * This module provides critical and warning thresholds for laboratory values
 * to enable real-time clinical decision support in the Laboratory page.
 * 
 * All values are based on international clinical standards adapted for
 * resource-limited settings in South Sudan.
 */

export interface CriticalRange {
  parameter: string;
  criticalLow?: number;
  criticalHigh?: number;
  warningLow?: number;
  warningHigh?: number;
  unit: string;
  severity: 'critical' | 'warning';
  action: string;
  context?: string;
}

export const CRITICAL_LAB_VALUES: CriticalRange[] = [
  // Hematology
  {
    parameter: 'Hemoglobin',
    criticalLow: 7,
    warningLow: 10,
    criticalHigh: 20,
    unit: 'g/dL',
    severity: 'critical',
    action: 'Severe anemia - Consider blood transfusion. Investigate cause (malaria, bleeding, nutritional)',
    context: 'Normal: 13-17 (M), 12-16 (F)'
  },
  {
    parameter: 'White Blood Cell Count',
    criticalLow: 2,
    warningLow: 4,
    criticalHigh: 20,
    warningHigh: 15,
    unit: '×10³/µL',
    severity: 'critical',
    action: 'Leukopenia: Risk of infection. Leukocytosis: Investigate infection/inflammation',
    context: 'Normal: 4-11 ×10³/µL'
  },
  {
    parameter: 'WBC Count',
    criticalLow: 2,
    warningLow: 4,
    criticalHigh: 20,
    warningHigh: 15,
    unit: '×10³/µL',
    severity: 'critical',
    action: 'Leukopenia: Risk of infection. Leukocytosis: Investigate infection/inflammation',
    context: 'Normal: 4-11 ×10³/µL'
  },
  {
    parameter: 'WBC',
    criticalLow: 2,
    warningLow: 4,
    criticalHigh: 20,
    warningHigh: 15,
    unit: '×10³/µL',
    severity: 'critical',
    action: 'Leukopenia: Risk of infection. Leukocytosis: Investigate infection/inflammation',
    context: 'Normal: 4-11 ×10³/µL'
  },
  {
    parameter: 'Platelet Count',
    criticalLow: 50,
    warningLow: 150,
    unit: '×10³/µL',
    severity: 'critical',
    action: 'Thrombocytopenia - Bleeding risk. Check for dengue, malaria, sepsis',
    context: 'Normal: 150-400 ×10³/µL'
  },
  {
    parameter: 'Platelets',
    criticalLow: 50,
    warningLow: 150,
    unit: '×10³/µL',
    severity: 'critical',
    action: 'Thrombocytopenia - Bleeding risk. Check for dengue, malaria, sepsis',
    context: 'Normal: 150-400 ×10³/µL'
  },
  
  // Chemistry
  {
    parameter: 'Blood Glucose',
    criticalLow: 50,
    warningLow: 70,
    criticalHigh: 400,
    warningHigh: 200,
    unit: 'mg/dL',
    severity: 'critical',
    action: 'Hypoglycemia: Give glucose/food immediately. Hyperglycemia: Risk of DKA - check ketones, start insulin',
    context: 'Normal fasting: 70-100 mg/dL'
  },
  {
    parameter: 'Random Blood Sugar',
    criticalLow: 50,
    warningLow: 70,
    criticalHigh: 400,
    warningHigh: 200,
    unit: 'mg/dL',
    severity: 'critical',
    action: 'Hypoglycemia: Give glucose/food immediately. Hyperglycemia: Risk of DKA - check ketones, start insulin',
    context: 'Normal: <140 mg/dL (random)'
  },
  {
    parameter: 'Fasting Blood Sugar',
    criticalLow: 50,
    warningLow: 70,
    criticalHigh: 400,
    warningHigh: 126,
    unit: 'mg/dL',
    severity: 'critical',
    action: 'Hypoglycemia: Give glucose/food immediately. Hyperglycemia: Risk of DKA - check ketones, start insulin',
    context: 'Normal fasting: 70-100 mg/dL'
  },
  {
    parameter: 'Creatinine',
    criticalHigh: 3,
    warningHigh: 1.5,
    unit: 'mg/dL',
    severity: 'critical',
    action: 'Acute kidney injury - Check hydration, stop nephrotoxic drugs, monitor urine output',
    context: 'Normal: 0.6-1.2 mg/dL'
  },
  {
    parameter: 'Sodium',
    criticalLow: 120,
    warningLow: 135,
    criticalHigh: 160,
    warningHigh: 145,
    unit: 'mEq/L',
    severity: 'critical',
    action: 'Severe electrolyte imbalance - Risk of seizures/coma. Correct slowly',
    context: 'Normal: 135-145 mEq/L'
  },
  {
    parameter: 'Potassium',
    criticalLow: 2.5,
    warningLow: 3.5,
    criticalHigh: 6,
    warningHigh: 5.5,
    unit: 'mEq/L',
    severity: 'critical',
    action: 'Cardiac arrhythmia risk - ECG monitoring, correct imbalance urgently',
    context: 'Normal: 3.5-5.0 mEq/L'
  },
  
  // Malaria-specific
  {
    parameter: 'Malaria Parasitemia',
    warningHigh: 2,
    criticalHigh: 5,
    unit: '%',
    severity: 'critical',
    action: 'Severe malaria (>2% parasitemia) - IV artesunate, monitor for complications (cerebral malaria, renal failure)',
    context: 'Uncomplicated: <2%'
  },
];

export interface LabAlert {
  severity: 'critical' | 'warning';
  parameter: string;
  value: number;
  threshold: number;
  type: 'high' | 'low';
  action: string;
  context?: string;
  unit: string;
}

/**
 * Check a lab value against critical ranges
 * @param parameter The lab parameter name (e.g., "Hemoglobin")
 * @param value The measured value
 * @returns LabAlert if value is outside normal range, null otherwise
 */
export function checkCriticalValue(parameter: string, value: number | string): LabAlert | null {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Validate numeric value
  if (isNaN(numValue) || !isFinite(numValue)) {
    return null;
  }

  // Find matching parameter (case-insensitive)
  const range = CRITICAL_LAB_VALUES.find(
    r => r.parameter.toLowerCase() === parameter.toLowerCase()
  );

  if (!range) {
    return null;
  }

  // Check critical low
  if (range.criticalLow !== undefined && numValue < range.criticalLow) {
    return {
      severity: 'critical',
      parameter: range.parameter,
      value: numValue,
      threshold: range.criticalLow,
      type: 'low',
      action: range.action,
      context: range.context,
      unit: range.unit,
    };
  }

  // Check critical high
  if (range.criticalHigh !== undefined && numValue > range.criticalHigh) {
    return {
      severity: 'critical',
      parameter: range.parameter,
      value: numValue,
      threshold: range.criticalHigh,
      type: 'high',
      action: range.action,
      context: range.context,
      unit: range.unit,
    };
  }

  // Check warning low
  if (range.warningLow !== undefined && numValue < range.warningLow) {
    return {
      severity: 'warning',
      parameter: range.parameter,
      value: numValue,
      threshold: range.warningLow,
      type: 'low',
      action: range.action,
      context: range.context,
      unit: range.unit,
    };
  }

  // Check warning high
  if (range.warningHigh !== undefined && numValue > range.warningHigh) {
    return {
      severity: 'warning',
      parameter: range.parameter,
      value: numValue,
      threshold: range.warningHigh,
      type: 'high',
      action: range.action,
      context: range.context,
      unit: range.unit,
    };
  }

  return null;
}

/**
 * Check multiple lab values for critical alerts
 * @param results Object containing lab results as key-value pairs
 * @returns Array of alerts found
 */
export function checkLabResults(results: Record<string, string | number>): LabAlert[] {
  const alerts: LabAlert[] = [];

  for (const [parameter, value] of Object.entries(results)) {
    const alert = checkCriticalValue(parameter, value);
    if (alert) {
      alerts.push(alert);
    }
  }

  return alerts;
}
