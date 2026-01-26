/**
 * Centralized Lab Test Abnormality Detection
 * This SINGLE file determines normal/abnormal for ALL pages
 * to ensure 100% consistency across Lab Department, Consultation, and Print views
 */

export interface AbnormalityResult {
  isAbnormal: boolean;
  isCritical: boolean;
  reason?: string;
}

// Reference ranges for all tests
export const LAB_REFERENCE_RANGES: Record<string, Record<string, { 
  normal: string; 
  unit?: string;
  min?: number;
  max?: number;
  abnormalValues?: string[];
  normalValues?: string[];
}>> = {
  "Blood Film for Malaria (BFFM)": {
    "Malaria Parasites": { normal: "Not seen", abnormalValues: ["P. falciparum", "P. vivax", "P. malariae", "P. ovale", "Mixed"] },
    "Parasitemia": { normal: "None", abnormalValues: ["+", "++", "+++", "++++"] },
    "Gametocytes": { normal: "Not seen", abnormalValues: ["Seen"] },
  },
  "ESR (Erythrocyte Sedimentation Rate)": {
    "ESR (1 hour)": { normal: "0-20", unit: "mm/hr", min: 0, max: 20 },
  },
  "Fasting Blood Sugar (FBS)": {
    "Blood Glucose": { normal: "70-110", unit: "mg/dL", min: 70, max: 110 },
  },
  "Random Blood Sugar (RBS)": {
    "Blood Glucose": { normal: "<200", unit: "mg/dL", max: 200 },
  },
  "Hemoglobin (Hb)": {
    "Hemoglobin": { normal: "12-16", unit: "g/dL", min: 12, max: 16 },
  },
  "Hemoglobin (HB)": {
    "Hemoglobin": { normal: "12-16", unit: "g/dL", min: 12, max: 16 },
  },
  "Widal Test (Typhoid)": {
    "S. Typhi (O)Ag": { normal: "<1:80", normalValues: ["Negative", "<1:20", "1:20", "1:40", "1:80"], abnormalValues: ["1:160", "1:320", "1:640", "1:1280"] },
    "S. Typhi (H)Ag": { normal: "<1:80", normalValues: ["Negative", "<1:20", "1:20", "1:40", "1:80"], abnormalValues: ["1:160", "1:320", "1:640", "1:1280"] },
    "S. Paratyphi A": { normal: "<1:80", normalValues: ["Negative", "<1:20", "1:20", "1:40", "1:80"], abnormalValues: ["1:160", "1:320", "1:640", "1:1280"] },
    "S. Paratyphi B": { normal: "<1:80", normalValues: ["Negative", "<1:20", "1:20", "1:40", "1:80"], abnormalValues: ["1:160", "1:320", "1:640", "1:1280"] },
  },
  "Stool Analysis": {
    "Appearance": { normal: "Normal", normalValues: ["Normal", "Formed"], abnormalValues: ["Bloody", "Mucoid", "Tarry", "Watery"] },
    "Consistency": { normal: "Formed", normalValues: ["Formed", "Soft"], abnormalValues: ["Loose", "Watery", "Hard"] },
    "Color": { normal: "Brown", normalValues: ["Brown", "Yellow"], abnormalValues: ["Red", "Black", "Green", "Pale", "Clay"] },
    "Ova/Parasites": { normal: "None seen", normalValues: ["None seen", "Negative"], abnormalValues: ["E. histolytica", "G. lamblia", "Ascaris", "Hookworm", "Trichuris", "Other"] },
    "Occult Blood": { normal: "Negative", normalValues: ["Negative"], abnormalValues: ["Positive"] },
  },
  "Stool Examination": {
    "Appearance": { normal: "Normal", normalValues: ["Normal", "Formed"], abnormalValues: ["Bloody", "Mucoid", "Tarry", "Watery"] },
    "Consistency": { normal: "Formed", normalValues: ["Formed", "Soft"], abnormalValues: ["Loose", "Watery", "Hard"] },
    "Color": { normal: "Brown", normalValues: ["Brown", "Yellow"], abnormalValues: ["Red", "Black", "Green", "Pale", "Clay"] },
    "Ova/Parasites": { normal: "None seen", normalValues: ["None seen", "Negative"], abnormalValues: ["E. histolytica", "G. lamblia", "Ascaris", "Hookworm", "Trichuris", "Other"] },
    "Occult Blood": { normal: "Negative", normalValues: ["Negative"], abnormalValues: ["Positive"] },
  },
  "Alkaline Phosphatase (ALP)": {
    "ALP": { normal: "44-147", unit: "U/L", min: 44, max: 147 },
  },
  "Liver Function Test (LFT)": {
    "Total Bilirubin": { normal: "0.1-1.2", unit: "mg/dL", min: 0.1, max: 1.2 },
    "Direct Bilirubin": { normal: "0-0.3", unit: "mg/dL", min: 0, max: 0.3 },
    "Indirect Bilirubin": { normal: "0.1-0.9", unit: "mg/dL", min: 0.1, max: 0.9 },
    "ALT (SGPT)": { normal: "7-56", unit: "U/L", min: 7, max: 56 },
    "AST (SGOT)": { normal: "10-40", unit: "U/L", min: 10, max: 40 },
    "Albumin": { normal: "3.5-5.0", unit: "g/dL", min: 3.5, max: 5.0 },
    "Total Protein": { normal: "6.0-8.3", unit: "g/dL", min: 6.0, max: 8.3 },
  },
  "Estrogen (E2)": {
    "Estradiol": { normal: "Varies by cycle", unit: "pg/mL" },
    "E2": { normal: "Varies by cycle", unit: "pg/mL" },
  },
  "Testosterone": {
    "Total Testosterone": { normal: "Male: 300-1000, Female: 15-70", unit: "ng/dL" },
    "Free Testosterone": { normal: "Male: 50-210, Female: 1-8.5", unit: "pg/mL" },
  },
  "Urine Analysis": {
    "Appearance": { normal: "Clear", normalValues: ["Clear"], abnormalValues: ["Turbid", "Cloudy", "Bloody"] },
    "Protein": { normal: "Negative", normalValues: ["Negative"], abnormalValues: ["Trace", "+", "++", "+++"] },
    "Glucose": { normal: "Negative", normalValues: ["Negative"], abnormalValues: ["+", "++", "+++"] },
    "Nitrite": { normal: "Negative", normalValues: ["Negative"], abnormalValues: ["Positive"] },
    "Leucocytes": { normal: "Negative", normalValues: ["Negative"], abnormalValues: ["+", "++", "+++"] },
  },
  "Complete Blood Count (CBC)": {
    "Hemoglobin": { normal: "12-16", unit: "g/dL", min: 12, max: 16 },
    "WBC Count": { normal: "4.0-11.0", unit: "x10³/µL", min: 4.0, max: 11.0 },
    "WBC": { normal: "4.0-11.0", unit: "x10³/µL", min: 4.0, max: 11.0 },
    "Platelets": { normal: "150-450", unit: "x10³/µL", min: 150, max: 450 },
    "RBC": { normal: "4.5-5.5", unit: "x10⁶/µL", min: 4.5, max: 5.5 },
    "Hematocrit": { normal: "37-47", unit: "%", min: 37, max: 47 },
  },
  "Renal Function Test (RFT)": {
    "Creatinine": { normal: "0.6-1.2", unit: "mg/dL", min: 0.6, max: 1.2 },
    "Blood Urea Nitrogen": { normal: "7-20", unit: "mg/dL", min: 7, max: 20 },
    "BUN": { normal: "7-20", unit: "mg/dL", min: 7, max: 20 },
  },
};

/**
 * Check if a single field value is abnormal
 */
export function isFieldAbnormal(testName: string, fieldName: string, value: string | number): boolean {
  const testConfig = LAB_REFERENCE_RANGES[testName];
  if (!testConfig) return false;
  
  const fieldConfig = testConfig[fieldName];
  if (!fieldConfig) return false;
  
  const strValue = String(value).trim();
  
  // Check abnormal values list (exact match to avoid false positives)
  if (fieldConfig.abnormalValues) {
    if (fieldConfig.abnormalValues.some(av => strValue.toLowerCase() === av.toLowerCase())) {
      return true;
    }
  }
  
  // Check normal values list (if not in list, it's abnormal)
  if (fieldConfig.normalValues) {
    if (!fieldConfig.normalValues.some(nv => strValue.toLowerCase() === nv.toLowerCase())) {
      return true;
    }
  }
  
  // Check numeric ranges
  if (fieldConfig.min !== undefined || fieldConfig.max !== undefined) {
    const numValue = parseFloat(strValue);
    if (!isNaN(numValue)) {
      if (fieldConfig.min !== undefined && numValue < fieldConfig.min) return true;
      if (fieldConfig.max !== undefined && numValue > fieldConfig.max) return true;
    }
  }
  
  return false;
}

/**
 * Check if an entire test panel has any abnormal results
 * This is the SINGLE function that ALL pages must use
 */
export function isTestAbnormal(testName: string, results: Record<string, string>): AbnormalityResult {
  let hasAbnormal = false;
  let hasCritical = false;
  const reasons: string[] = [];
  
  // Normalize test name (handle aliases)
  const normalizedTestName = normalizeTestName(testName);
  
  for (const [fieldName, value] of Object.entries(results)) {
    if (isFieldAbnormal(normalizedTestName, fieldName, value)) {
      hasAbnormal = true;
      reasons.push(`${fieldName}: ${value}`);
      
      // Check for critical values
      if (isCriticalValue(normalizedTestName, fieldName, value)) {
        hasCritical = true;
      }
    }
  }
  
  return {
    isAbnormal: hasAbnormal,
    isCritical: hasCritical,
    reason: reasons.join(", "),
  };
}

/**
 * Check for critical values that need immediate attention
 */
function isCriticalValue(testName: string, fieldName: string, value: string | number): boolean {
  const strValue = String(value).toLowerCase();
  
  // Malaria positive is critical
  if (testName.includes("Malaria") && fieldName === "Malaria Parasites") {
    if (strValue.includes("falciparum") || strValue.includes("vivax")) return true;
  }
  
  // Bloody stool is critical
  if ((testName.includes("Stool")) && 
      ((fieldName === "Appearance" && strValue === "bloody") ||
      (fieldName === "Color" && (strValue === "red" || strValue === "black")))) {
    return true;
  }
  
  // Hemoglobin < 7 is critical
  if (fieldName === "Hemoglobin") {
    const hb = parseFloat(String(value));
    if (!isNaN(hb) && hb < 7) return true;
  }
  
  // Blood glucose > 400 is critical
  if (fieldName === "Blood Glucose") {
    const glucose = parseFloat(String(value));
    if (!isNaN(glucose) && glucose > 400) return true;
  }
  
  return false;
}

/**
 * Normalize test names to handle aliases
 * Maps various test name formats to their canonical form in LAB_REFERENCE_RANGES
 */
function normalizeTestName(testName: string): string {
  const aliases: Record<string, string> = {
    "Hemoglobin (Hb)": "Hemoglobin (HB)",
    "Stool Analysis": "Stool Examination",
    "Random Blood Sugar (RBS)": "Random Blood Sugar (RBS)",
    "Fasting Blood Sugar (FBS)": "Fasting Blood Sugar (FBS)",
  };
  return aliases[testName] || testName;
}

/**
 * Get reference range for display
 */
export function getReferenceRange(testName: string, fieldName: string): string | null {
  const normalizedTestName = normalizeTestName(testName);
  const testConfig = LAB_REFERENCE_RANGES[normalizedTestName] || LAB_REFERENCE_RANGES[testName];
  if (!testConfig) return null;
  
  const fieldConfig = testConfig[fieldName];
  if (!fieldConfig) return null;
  
  if (fieldConfig.unit) {
    return `${fieldConfig.normal} ${fieldConfig.unit}`;
  }
  return fieldConfig.normal;
}

/**
 * Get unit for a field
 */
export function getUnit(testName: string, fieldName: string): string {
  const normalizedTestName = normalizeTestName(testName);
  const testConfig = LAB_REFERENCE_RANGES[normalizedTestName] || LAB_REFERENCE_RANGES[testName];
  if (!testConfig) return "";
  
  const fieldConfig = testConfig[fieldName];
  return fieldConfig?.unit || "";
}

/**
 * Count abnormal and normal tests in a results set
 * Note: Critical tests are counted separately and NOT included in the abnormal count
 */
export function countAbnormalNormal(results: Record<string, Record<string, string>>): { abnormal: number; normal: number; critical: number } {
  let abnormal = 0;
  let normal = 0;
  let critical = 0;
  
  for (const [testName, testResults] of Object.entries(results)) {
    const result = isTestAbnormal(testName, testResults);
    if (result.isCritical) {
      critical++;
      // Critical tests are NOT counted as abnormal
    } else if (result.isAbnormal) {
      abnormal++;
    } else {
      normal++;
    }
  }
  
  return { abnormal, normal, critical };
}

/**
 * Get test category label based on tests ordered
 */
export function getTestCategoryLabel(tests: string[]): string {
  if (!tests || tests.length === 0) return "Laboratory Tests";
  
  const categories = {
    blood: ["Blood Film", "Hemoglobin", "ESR", "CBC", "Blood Group", "Widal"],
    chemistry: ["FBS", "RBS", "LFT", "RFT", "ALP", "Lipid"],
    hormonal: ["Estrogen", "Testosterone", "Thyroid", "TSH", "T3", "T4", "HCG"],
    stool: ["Stool"],
    urine: ["Urine", "Urinalysis"],
    microbiology: ["Culture", "Sensitivity"],
  };
  
  const categoryCounts: Record<string, number> = {};
  
  for (const test of tests) {
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => test.toLowerCase().includes(kw.toLowerCase()))) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        break;
      }
    }
  }
  
  // If all tests are same category, use that
  const entries = Object.entries(categoryCounts);
  if (entries.length === 1) {
    const [category] = entries[0];
    const labels: Record<string, string> = {
      blood: "Blood Tests",
      chemistry: "Chemistry Tests",
      hormonal: "Hormonal Tests",
      stool: "Stool Analysis",
      urine: "Urine Analysis",
      microbiology: "Microbiology Tests",
    };
    return labels[category] || "Laboratory Tests";
  }
  
  // Mixed tests
  return "Laboratory Tests";
}
