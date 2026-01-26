/**
 * Comprehensive Age + Gender Based Reference Ranges System
 * 
 * This module provides age and gender-specific reference ranges for all laboratory tests.
 * It replaces the simple gender-based ranges with comprehensive age+gender ranges.
 */

export interface AgeGenderRange {
  ageMin: number;      // Age in years (use decimals for months: 1 month = 0.08)
  ageMax: number;      // Age in years
  gender: "male" | "female" | "all";
  min?: number;
  max?: number;
  unit: string;
  label: string;       // Human readable label
  normalValues?: string[];   // For non-numeric tests
  abnormalValues?: string[]; // For non-numeric tests
}

export interface TestReferenceConfig {
  fieldName: string;
  ranges: AgeGenderRange[];
  criticalLow?: number;
  criticalHigh?: number;
}

export const LAB_REFERENCE_RANGES: Record<string, Record<string, TestReferenceConfig>> = {
  "Hemoglobin (Hb)": {
    "Hemoglobin": {
      fieldName: "Hemoglobin",
      ranges: [
        // Newborns
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 14, max: 24, unit: "g/dL", label: "Newborn (0-1 month)" },
        // Infants
        { ageMin: 0.08, ageMax: 1, gender: "all", min: 10, max: 13, unit: "g/dL", label: "Infant (1-12 months)" },
        // Children 1-5 years
        { ageMin: 1, ageMax: 5, gender: "all", min: 11, max: 13, unit: "g/dL", label: "Child (1-5 years)" },
        // Children 6-12 years
        { ageMin: 6, ageMax: 12, gender: "all", min: 11.5, max: 14.5, unit: "g/dL", label: "Child (6-12 years)" },
        // Adolescent Male
        { ageMin: 13, ageMax: 17, gender: "male", min: 13, max: 16, unit: "g/dL", label: "Adolescent Male" },
        // Adolescent Female
        { ageMin: 13, ageMax: 17, gender: "female", min: 12, max: 16, unit: "g/dL", label: "Adolescent Female" },
        // Adult Male
        { ageMin: 18, ageMax: 120, gender: "male", min: 13.5, max: 17.5, unit: "g/dL", label: "Adult Male" },
        // Adult Female
        { ageMin: 18, ageMax: 120, gender: "female", min: 12, max: 16, unit: "g/dL", label: "Adult Female" },
      ],
      criticalLow: 7,
      criticalHigh: 20,
    }
  },
  "Hemoglobin (HB)": {
    "Hemoglobin": {
      fieldName: "Hemoglobin",
      ranges: [
        // Same as "Hemoglobin (Hb)" - alias
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 14, max: 24, unit: "g/dL", label: "Newborn (0-1 month)" },
        { ageMin: 0.08, ageMax: 1, gender: "all", min: 10, max: 13, unit: "g/dL", label: "Infant (1-12 months)" },
        { ageMin: 1, ageMax: 5, gender: "all", min: 11, max: 13, unit: "g/dL", label: "Child (1-5 years)" },
        { ageMin: 6, ageMax: 12, gender: "all", min: 11.5, max: 14.5, unit: "g/dL", label: "Child (6-12 years)" },
        { ageMin: 13, ageMax: 17, gender: "male", min: 13, max: 16, unit: "g/dL", label: "Adolescent Male" },
        { ageMin: 13, ageMax: 17, gender: "female", min: 12, max: 16, unit: "g/dL", label: "Adolescent Female" },
        { ageMin: 18, ageMax: 120, gender: "male", min: 13.5, max: 17.5, unit: "g/dL", label: "Adult Male" },
        { ageMin: 18, ageMax: 120, gender: "female", min: 12, max: 16, unit: "g/dL", label: "Adult Female" },
      ],
      criticalLow: 7,
      criticalHigh: 20,
    }
  },
  "Complete Blood Count (CBC)": {
    "Hemoglobin": {
      fieldName: "Hemoglobin",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 14, max: 24, unit: "g/dL", label: "Newborn (0-1 month)" },
        { ageMin: 0.08, ageMax: 1, gender: "all", min: 10, max: 13, unit: "g/dL", label: "Infant (1-12 months)" },
        { ageMin: 1, ageMax: 5, gender: "all", min: 11, max: 13, unit: "g/dL", label: "Child (1-5 years)" },
        { ageMin: 6, ageMax: 12, gender: "all", min: 11.5, max: 14.5, unit: "g/dL", label: "Child (6-12 years)" },
        { ageMin: 13, ageMax: 17, gender: "male", min: 13, max: 16, unit: "g/dL", label: "Adolescent Male" },
        { ageMin: 13, ageMax: 17, gender: "female", min: 12, max: 16, unit: "g/dL", label: "Adolescent Female" },
        { ageMin: 18, ageMax: 120, gender: "male", min: 13.5, max: 17.5, unit: "g/dL", label: "Adult Male" },
        { ageMin: 18, ageMax: 120, gender: "female", min: 12, max: 16, unit: "g/dL", label: "Adult Female" },
      ],
      criticalLow: 7,
      criticalHigh: 20,
    },
    "WBC Count": {
      fieldName: "WBC Count",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 9, max: 30, unit: "×10³/µL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 1, gender: "all", min: 6, max: 17.5, unit: "×10³/µL", label: "Infant" },
        { ageMin: 1, ageMax: 5, gender: "all", min: 5, max: 15.5, unit: "×10³/µL", label: "Child (1-5 years)" },
        { ageMin: 6, ageMax: 12, gender: "all", min: 4.5, max: 13.5, unit: "×10³/µL", label: "Child (6-12 years)" },
        { ageMin: 13, ageMax: 120, gender: "all", min: 4.5, max: 11, unit: "×10³/µL", label: "Adult" },
      ],
      criticalLow: 2,
      criticalHigh: 30,
    },
    "WBC": {
      fieldName: "WBC",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 9, max: 30, unit: "×10³/µL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 1, gender: "all", min: 6, max: 17.5, unit: "×10³/µL", label: "Infant" },
        { ageMin: 1, ageMax: 5, gender: "all", min: 5, max: 15.5, unit: "×10³/µL", label: "Child (1-5 years)" },
        { ageMin: 6, ageMax: 12, gender: "all", min: 4.5, max: 13.5, unit: "×10³/µL", label: "Child (6-12 years)" },
        { ageMin: 13, ageMax: 120, gender: "all", min: 4.5, max: 11, unit: "×10³/µL", label: "Adult" },
      ],
      criticalLow: 2,
      criticalHigh: 30,
    },
    "Platelets": {
      fieldName: "Platelets",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 150, max: 450, unit: "×10³/µL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 120, gender: "all", min: 150, max: 400, unit: "×10³/µL", label: "Child/Adult" },
      ],
      criticalLow: 50,
      criticalHigh: 1000,
    },
  },
  "ESR (Erythrocyte Sedimentation Rate)": {
    "ESR (1 hour)": {
      fieldName: "ESR (1 hour)",
      ranges: [
        { ageMin: 0, ageMax: 12, gender: "all", min: 0, max: 10, unit: "mm/hr", label: "Child" },
        { ageMin: 13, ageMax: 50, gender: "male", min: 0, max: 15, unit: "mm/hr", label: "Adult Male <50" },
        { ageMin: 50, ageMax: 120, gender: "male", min: 0, max: 20, unit: "mm/hr", label: "Adult Male >50" },
        { ageMin: 13, ageMax: 50, gender: "female", min: 0, max: 20, unit: "mm/hr", label: "Adult Female <50" },
        { ageMin: 50, ageMax: 120, gender: "female", min: 0, max: 30, unit: "mm/hr", label: "Adult Female >50" },
      ],
    }
  },
  "Fasting Blood Sugar (FBS)": {
    "Blood Glucose": {
      fieldName: "Blood Glucose",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 40, max: 60, unit: "mg/dL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 12, gender: "all", min: 60, max: 100, unit: "mg/dL", label: "Child" },
        { ageMin: 13, ageMax: 120, gender: "all", min: 70, max: 110, unit: "mg/dL", label: "Adult (fasting)" },
      ],
      criticalLow: 40,
      criticalHigh: 400,
    }
  },
  "Random Blood Sugar (RBS)": {
    "Blood Glucose": {
      fieldName: "Blood Glucose",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 40, max: 100, unit: "mg/dL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 120, gender: "all", min: 70, max: 200, unit: "mg/dL", label: "Child/Adult" },
      ],
      criticalLow: 40,
      criticalHigh: 400,
    }
  },
  "Renal Function Test (RFT)": {
    "Creatinine": {
      fieldName: "Creatinine",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 0.3, max: 1.0, unit: "mg/dL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 1, gender: "all", min: 0.2, max: 0.4, unit: "mg/dL", label: "Infant" },
        { ageMin: 1, ageMax: 5, gender: "all", min: 0.3, max: 0.5, unit: "mg/dL", label: "Child (1-5 years)" },
        { ageMin: 6, ageMax: 12, gender: "all", min: 0.5, max: 0.8, unit: "mg/dL", label: "Child (6-12 years)" },
        { ageMin: 13, ageMax: 17, gender: "all", min: 0.6, max: 1.0, unit: "mg/dL", label: "Adolescent" },
        { ageMin: 18, ageMax: 120, gender: "male", min: 0.7, max: 1.3, unit: "mg/dL", label: "Adult Male" },
        { ageMin: 18, ageMax: 120, gender: "female", min: 0.6, max: 1.1, unit: "mg/dL", label: "Adult Female" },
      ],
      criticalHigh: 10,
    },
    "BUN": {
      fieldName: "BUN",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 3, max: 12, unit: "mg/dL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 12, gender: "all", min: 5, max: 18, unit: "mg/dL", label: "Child" },
        { ageMin: 13, ageMax: 120, gender: "all", min: 7, max: 20, unit: "mg/dL", label: "Adult" },
      ],
      criticalHigh: 100,
    },
    "Blood Urea Nitrogen": {
      fieldName: "Blood Urea Nitrogen",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 3, max: 12, unit: "mg/dL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 12, gender: "all", min: 5, max: 18, unit: "mg/dL", label: "Child" },
        { ageMin: 13, ageMax: 120, gender: "all", min: 7, max: 20, unit: "mg/dL", label: "Adult" },
      ],
      criticalHigh: 100,
    },
  },
  "Alkaline Phosphatase (ALP)": {
    "ALP": {
      fieldName: "ALP",
      ranges: [
        { ageMin: 0, ageMax: 1, gender: "all", min: 150, max: 420, unit: "U/L", label: "Infant" },
        { ageMin: 1, ageMax: 9, gender: "all", min: 100, max: 400, unit: "U/L", label: "Child (1-9 years)" },
        { ageMin: 10, ageMax: 17, gender: "male", min: 100, max: 500, unit: "U/L", label: "Adolescent Male" },
        { ageMin: 10, ageMax: 17, gender: "female", min: 50, max: 350, unit: "U/L", label: "Adolescent Female" },
        { ageMin: 18, ageMax: 120, gender: "all", min: 44, max: 147, unit: "U/L", label: "Adult" },
      ],
    }
  },
  "Liver Function Test (LFT)": {
    "Total Bilirubin": {
      fieldName: "Total Bilirubin",
      ranges: [
        { ageMin: 0, ageMax: 0.003, gender: "all", min: 0, max: 6, unit: "mg/dL", label: "Newborn (Day 1)" },
        { ageMin: 0.003, ageMax: 0.006, gender: "all", min: 0, max: 8, unit: "mg/dL", label: "Newborn (Day 2)" },
        { ageMin: 0.006, ageMax: 0.014, gender: "all", min: 0, max: 12, unit: "mg/dL", label: "Newborn (Day 3-5)" },
        { ageMin: 0.014, ageMax: 0.08, gender: "all", min: 0, max: 1.5, unit: "mg/dL", label: "Newborn (>1 week)" },
        { ageMin: 0.08, ageMax: 120, gender: "all", min: 0.1, max: 1.2, unit: "mg/dL", label: "Child/Adult" },
      ],
      criticalHigh: 15,
    },
    "ALT (SGPT)": {
      fieldName: "ALT (SGPT)",
      ranges: [
        { ageMin: 0, ageMax: 1, gender: "all", min: 5, max: 50, unit: "U/L", label: "Infant" },
        { ageMin: 1, ageMax: 12, gender: "all", min: 5, max: 45, unit: "U/L", label: "Child" },
        { ageMin: 13, ageMax: 120, gender: "male", min: 7, max: 56, unit: "U/L", label: "Adult Male" },
        { ageMin: 13, ageMax: 120, gender: "female", min: 7, max: 45, unit: "U/L", label: "Adult Female" },
      ],
    },
    "AST (SGOT)": {
      fieldName: "AST (SGOT)",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 25, max: 75, unit: "U/L", label: "Newborn" },
        { ageMin: 0.08, ageMax: 1, gender: "all", min: 15, max: 60, unit: "U/L", label: "Infant" },
        { ageMin: 1, ageMax: 12, gender: "all", min: 10, max: 40, unit: "U/L", label: "Child" },
        { ageMin: 13, ageMax: 120, gender: "all", min: 10, max: 40, unit: "U/L", label: "Adult" },
      ],
    },
  },
  "Testosterone": {
    "Total Testosterone": {
      fieldName: "Total Testosterone",
      ranges: [
        { ageMin: 0, ageMax: 9, gender: "all", min: 0, max: 20, unit: "ng/dL", label: "Prepubertal" },
        { ageMin: 10, ageMax: 13, gender: "male", min: 10, max: 300, unit: "ng/dL", label: "Early Puberty Male" },
        { ageMin: 14, ageMax: 17, gender: "male", min: 100, max: 800, unit: "ng/dL", label: "Late Puberty Male" },
        { ageMin: 18, ageMax: 50, gender: "male", min: 300, max: 1000, unit: "ng/dL", label: "Adult Male" },
        { ageMin: 50, ageMax: 120, gender: "male", min: 200, max: 800, unit: "ng/dL", label: "Adult Male >50" },
        { ageMin: 10, ageMax: 120, gender: "female", min: 15, max: 70, unit: "ng/dL", label: "Female" },
      ],
    }
  },
  "Estrogen (E2)": {
    "Estradiol": {
      fieldName: "Estradiol",
      ranges: [
        { ageMin: 0, ageMax: 9, gender: "all", min: 0, max: 20, unit: "pg/mL", label: "Prepubertal" },
        { ageMin: 10, ageMax: 17, gender: "female", min: 10, max: 300, unit: "pg/mL", label: "Puberty Female" },
        { ageMin: 18, ageMax: 50, gender: "female", min: 20, max: 400, unit: "pg/mL", label: "Adult Female (mid-cycle)" },
        { ageMin: 50, ageMax: 120, gender: "female", min: 0, max: 30, unit: "pg/mL", label: "Postmenopausal Female" },
        { ageMin: 10, ageMax: 120, gender: "male", min: 10, max: 40, unit: "pg/mL", label: "Male" },
      ],
    },
    "E2": {
      fieldName: "E2",
      ranges: [
        { ageMin: 0, ageMax: 9, gender: "all", min: 0, max: 20, unit: "pg/mL", label: "Prepubertal" },
        { ageMin: 10, ageMax: 17, gender: "female", min: 10, max: 300, unit: "pg/mL", label: "Puberty Female" },
        { ageMin: 18, ageMax: 50, gender: "female", min: 20, max: 400, unit: "pg/mL", label: "Adult Female (mid-cycle)" },
        { ageMin: 50, ageMax: 120, gender: "female", min: 0, max: 30, unit: "pg/mL", label: "Postmenopausal Female" },
        { ageMin: 10, ageMax: 120, gender: "male", min: 10, max: 40, unit: "pg/mL", label: "Male" },
      ],
    },
  },
  "Uric Acid": {
    "Uric Acid": {
      fieldName: "Uric Acid",
      ranges: [
        { ageMin: 0, ageMax: 12, gender: "all", min: 2.0, max: 5.5, unit: "mg/dL", label: "Child" },
        { ageMin: 13, ageMax: 120, gender: "male", min: 3.4, max: 7.0, unit: "mg/dL", label: "Adult Male" },
        { ageMin: 13, ageMax: 120, gender: "female", min: 2.4, max: 6.0, unit: "mg/dL", label: "Adult Female" },
      ],
    }
  },
  "Ferritin": {
    "Ferritin": {
      fieldName: "Ferritin",
      ranges: [
        { ageMin: 0, ageMax: 0.08, gender: "all", min: 25, max: 200, unit: "ng/mL", label: "Newborn" },
        { ageMin: 0.08, ageMax: 1, gender: "all", min: 50, max: 200, unit: "ng/mL", label: "Infant" },
        { ageMin: 1, ageMax: 12, gender: "all", min: 7, max: 140, unit: "ng/mL", label: "Child" },
        { ageMin: 13, ageMax: 120, gender: "male", min: 20, max: 500, unit: "ng/mL", label: "Adult Male" },
        { ageMin: 13, ageMax: 50, gender: "female", min: 20, max: 200, unit: "ng/mL", label: "Adult Female" },
        { ageMin: 50, ageMax: 120, gender: "female", min: 20, max: 300, unit: "ng/mL", label: "Postmenopausal Female" },
      ],
    }
  },
  "TSH": {
    "TSH": {
      fieldName: "TSH",
      ranges: [
        { ageMin: 0, ageMax: 0.014, gender: "all", min: 1, max: 39, unit: "mIU/L", label: "Newborn (0-5 days)" },
        { ageMin: 0.014, ageMax: 1, gender: "all", min: 0.7, max: 6.4, unit: "mIU/L", label: "Infant" },
        { ageMin: 1, ageMax: 12, gender: "all", min: 0.6, max: 5.5, unit: "mIU/L", label: "Child" },
        { ageMin: 13, ageMax: 120, gender: "all", min: 0.4, max: 4.5, unit: "mIU/L", label: "Adult" },
      ],
    }
  },
};

/**
 * Calculate age from date of birth in years (with decimal for months)
 */
export function calculateAgeInYears(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  
  // Check if date is valid
  if (isNaN(dob.getTime())) {
    return 30; // Default to adult age if invalid
  }
  
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  // Calculate decimal for months
  const months = (today.getMonth() - dob.getMonth() + 12) % 12;
  const decimalAge = age + (months / 12);
  
  return Math.round(decimalAge * 100) / 100; // Round to 2 decimal places
}

/**
 * Get the appropriate reference range for a patient based on age and gender
 */
export function getPatientReferenceRange(
  testName: string,
  fieldName: string,
  patientAge: number,
  patientGender: string
): AgeGenderRange | null {
  const testConfig = LAB_REFERENCE_RANGES[testName];
  if (!testConfig || !testConfig[fieldName]) return null;
  
  const config = testConfig[fieldName];
  const gender = patientGender?.toLowerCase().startsWith('m') ? 'male' : 
                 patientGender?.toLowerCase().startsWith('f') ? 'female' : 'all';
  
  // Find matching range (gender-specific first, then "all")
  let matchingRange = config.ranges.find(r => 
    patientAge >= r.ageMin && 
    patientAge < r.ageMax && 
    r.gender === gender
  );
  
  // Fallback to "all" gender if no specific match
  if (!matchingRange) {
    matchingRange = config.ranges.find(r => 
      patientAge >= r.ageMin && 
      patientAge < r.ageMax && 
      r.gender === "all"
    );
  }
  
  return matchingRange || null;
}

/**
 * Check if a value is abnormal for a specific patient
 */
export function isValueAbnormalForPatient(
  testName: string,
  fieldName: string,
  value: string | number,
  patientAge: number,
  patientGender: string
): { isAbnormal: boolean; isCritical: boolean; reason?: string } {
  const range = getPatientReferenceRange(testName, fieldName, patientAge, patientGender);
  if (!range) return { isAbnormal: false, isCritical: false };
  
  const numValue = parseFloat(String(value));
  const testConfig = LAB_REFERENCE_RANGES[testName]?.[fieldName];
  
  if (!isNaN(numValue)) {
    // Numeric check
    if (range.min !== undefined && numValue < range.min) {
      const isCritical = testConfig?.criticalLow !== undefined && numValue < testConfig.criticalLow;
      return { isAbnormal: true, isCritical, reason: `Below ${range.label} range (${range.min}-${range.max} ${range.unit})` };
    }
    if (range.max !== undefined && numValue > range.max) {
      const isCritical = testConfig?.criticalHigh !== undefined && numValue > testConfig.criticalHigh;
      return { isAbnormal: true, isCritical, reason: `Above ${range.label} range (${range.min}-${range.max} ${range.unit})` };
    }
  } else {
    // Non-numeric check (e.g., parasites, qualitative tests)
    if (range.abnormalValues?.some(v => String(value).toLowerCase().includes(v.toLowerCase()))) {
      return { isAbnormal: true, isCritical: false, reason: `Abnormal value detected` };
    }
  }
  
  return { isAbnormal: false, isCritical: false };
}

/**
 * Format reference range for display
 */
export function formatReferenceRange(
  testName: string,
  fieldName: string,
  patientAge: number,
  patientGender: string
): string {
  const range = getPatientReferenceRange(testName, fieldName, patientAge, patientGender);
  if (!range) return "N/A";
  
  if (range.min !== undefined && range.max !== undefined) {
    return `${range.min}-${range.max} ${range.unit}`;
  }
  if (range.min !== undefined) {
    return `>${range.min} ${range.unit}`;
  }
  if (range.max !== undefined) {
    return `<${range.max} ${range.unit}`;
  }
  
  return range.unit || "N/A";
}
