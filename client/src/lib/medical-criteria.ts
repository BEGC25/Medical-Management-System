/**
 * Medical criteria and thresholds for key finding detection
 * These values can be updated as medical standards evolve
 */

export const MEDICAL_THRESHOLDS = {
  // Hemoglobin thresholds (g/dL)
  SEVERE_ANEMIA: 7,
  MODERATE_ANEMIA: 10,
  
  // Test names for consistent matching
  TEST_NAMES: {
    MALARIA: "Blood Film for Malaria (BFFM)",
    CBC: "Complete Blood Count (CBC)",
    HEPATITIS_B: "Hepatitis B Test (HBsAg)",
    HIV: "HIV Test",
    TYPHOID: "Widal Test (Typhoid)",
    BRUCELLA: "Brucella Test (B.A.T)",
    VDRL: "VDRL Test (Syphilis)",
    HCV: "Hepatitis C Test (HCV)",
  },
  
  // Field names within tests
  FIELD_NAMES: {
    MALARIA_PARASITES: "Malaria Parasites",
    HEMOGLOBIN: "Hemoglobin",
    HBSAG: "HBsAg",
    HIV_ANTIBODY: "HIV Antibody",
  },
  
  // Result values indicating positive/abnormal
  POSITIVE_VALUES: ["Positive", "Reactive"],
  NEGATIVE_VALUES: ["Negative", "Not seen"],
} as const;

/**
 * Extract key finding from lab test results
 */
export function extractLabKeyFinding(
  parsedResults: Record<string, Record<string, string>>
): string | null {
  const { TEST_NAMES, FIELD_NAMES, POSITIVE_VALUES, SEVERE_ANEMIA } = MEDICAL_THRESHOLDS;
  
  // Check for malaria parasites
  const bffm = parsedResults[TEST_NAMES.MALARIA];
  if (bffm && bffm[FIELD_NAMES.MALARIA_PARASITES]) {
    const parasites = bffm[FIELD_NAMES.MALARIA_PARASITES];
    if (!MEDICAL_THRESHOLDS.NEGATIVE_VALUES.includes(parasites)) {
      return `Positive for ${parasites} malaria – requires immediate treatment.`;
    }
  }
  
  // Check for severe anemia
  const cbc = parsedResults[TEST_NAMES.CBC];
  if (cbc && cbc[FIELD_NAMES.HEMOGLOBIN]) {
    const hb = parseFloat(cbc[FIELD_NAMES.HEMOGLOBIN]);
    if (!isNaN(hb) && hb < SEVERE_ANEMIA) {
      return `Severe anemia (Hb: ${hb} g/dL) – urgent care needed.`;
    }
  }
  
  // Check for Hepatitis B
  const hbsag = parsedResults[TEST_NAMES.HEPATITIS_B];
  if (hbsag && POSITIVE_VALUES.includes(hbsag[FIELD_NAMES.HBSAG])) {
    return "Hepatitis B positive – patient is infectious.";
  }
  
  // Check for HIV
  const hiv = parsedResults[TEST_NAMES.HIV];
  if (hiv && hiv[FIELD_NAMES.HIV_ANTIBODY] === "Positive") {
    return "HIV positive – requires confirmatory testing and counseling.";
  }
  
  // No critical findings
  return null;
}
