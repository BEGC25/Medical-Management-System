/**
 * Lab Interpretation Utility Module
 * 
 * Single source of truth for clinical interpretation of laboratory test results.
 * This ensures consistency between on-screen display and printed reports.
 * 
 * IMPORTANT: This module contains the authoritative clinical interpretation logic.
 * Any changes to interpretation criteria must be made here and will automatically
 * apply to both the UI and printed reports.
 */

export interface LabInterpretation {
  criticalFindings: string[];
  warnings: string[];
}

/**
 * Helper function to extract numeric titer value from string format
 * @param titer String in format "1:80", "1:160", etc.
 * @returns Numeric value (e.g., 80, 160) or 0 if not found
 */
function getTiterValue(titer: string): number {
  const match = titer?.match(/1:(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Interpret Complete Blood Count (CBC) results
 * 
 * @param testData Object containing CBC field values
 * @returns Array of interpretation messages
 */
function interpretCBC(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const hb = parseFloat(testData["Hemoglobin"]);
  const wbc = parseFloat(testData["WBC Count"] || testData["WBC"]);
  const platelets = parseFloat(testData["Platelets"]);
  
  // Severe anemia
  if (!isNaN(hb) && hb < 7) {
    critical.push(`SEVERE anemia (Hb: ${hb} g/dL) - Requires urgent blood transfusion consideration`);
  } else if (!isNaN(hb) && hb < 10) {
    warnings.push(`Moderate anemia (Hb: ${hb} g/dL) - Requires treatment`);
  }
  
  // WBC interpretation
  // NOTE: WBC values are stored in x10³/µL units
  // Normal range: 4.0-11.0 x10³/µL
  if (!isNaN(wbc) && wbc > 15) {
    warnings.push(`Elevated WBC (${wbc} x10³/µL) - Possible severe infection or leukemia`);
  } else if (!isNaN(wbc) && wbc > 11) {
    warnings.push(`Elevated WBC (${wbc} x10³/µL) - Possible infection`);
  }
  
  // Low WBC
  if (!isNaN(wbc) && wbc < 4) {
    warnings.push(`Low WBC (${wbc} x10³/µL) - Immunosuppression, needs evaluation`);
  }
  
  // Thrombocytopenia
  if (!isNaN(platelets) && platelets < 50) {
    critical.push(`Severe thrombocytopenia (Platelets: ${platelets} x10³/µL) - Bleeding risk, urgent care needed`);
  } else if (!isNaN(platelets) && platelets < 150) {
    warnings.push(`Low platelets (${platelets} x10³/µL) - Monitor for bleeding`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Blood Film for Malaria (BFFM) results
 */
function interpretMalaria(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const parasites = testData["Malaria Parasites"];
  if (parasites && parasites !== "Not seen" && parasites !== "Negative") {
    critical.push(`POSITIVE for ${parasites} malaria - Requires immediate treatment`);
  }
  if (testData["Gametocytes"] === "Seen") {
    warnings.push(`Gametocytes present - Patient is infectious`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Widal Test (Typhoid) results
 */
function interpretWidal(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const oAg = getTiterValue(testData["S. Typhi (O)Ag"]);
  const hAg = getTiterValue(testData["S. Typhi (H)Ag"]);
  
  if (oAg >= 320 || hAg >= 320) {
    critical.push(`VERY HIGH typhoid titers - Strongly suggests active typhoid infection`);
  } else if (oAg >= 160 || hAg >= 160) {
    warnings.push(`HIGH typhoid titers - Probable typhoid fever, start treatment`);
  } else if (oAg >= 80 || hAg >= 80) {
    warnings.push(`Elevated typhoid titers - Consider typhoid fever`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Brucella Test results
 */
function interpretBrucella(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const abortus = getTiterValue(testData["B. Abortus"]);
  const malitensis = getTiterValue(testData["B. Malitensis"]);
  
  if (abortus >= 160 || malitensis >= 160) {
    critical.push(`POSITIVE for Brucellosis - Zoonotic infection requiring treatment`);
  } else if (abortus >= 80 || malitensis >= 80) {
    warnings.push(`Possible Brucellosis - Consider patient history and clinical correlation`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret VDRL Test (Syphilis) results
 */
function interpretVDRL(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["VDRL Result"] || testData["VDRL"];
  if (result === "Reactive" || result === "Positive") {
    critical.push(`POSITIVE for Syphilis (VDRL Reactive) - Requires confirmatory testing and treatment`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Hepatitis B Test results
 */
function interpretHepatitisB(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["HBsAg Result"] || testData["HBsAg"];
  if (result === "Reactive" || result === "Positive") {
    critical.push(`POSITIVE for Hepatitis B - Patient is HBsAg positive, infectious`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Urine Analysis results
 */
function interpretUrineAnalysis(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const appearance = testData["Appearance"];
  const protein = testData["Protein"];
  
  if (appearance?.toLowerCase().includes("bloody") || appearance?.toLowerCase().includes("red")) {
    critical.push(`Bloody urine detected - Possible bleeding, trauma, or severe infection`);
  }
  
  if (protein && (protein.includes("+++") || protein.includes("++++"))) {
    critical.push(`Severe proteinuria - Kidney damage likely, needs urgent evaluation`);
  } else if (protein && protein !== "Negative" && protein !== "-") {
    warnings.push(`Proteinuria detected - Kidney function needs assessment`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Liver Function Test results
 */
function interpretLFT(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const alt = parseFloat(testData["ALT (SGPT)"]);
  const ast = parseFloat(testData["AST (SGOT)"]);
  const bilirubin = parseFloat(testData["Total Bilirubin"]);
  
  if (!isNaN(alt) && alt > 200) {
    critical.push(`Severely elevated ALT (${alt} U/L) - Significant liver damage`);
  } else if (!isNaN(alt) && alt > 100) {
    warnings.push(`Elevated ALT (${alt} U/L) - Liver function impaired`);
  }
  
  if (!isNaN(ast) && ast > 200) {
    critical.push(`Severely elevated AST (${ast} U/L) - Significant liver damage`);
  } else if (!isNaN(ast) && ast > 100) {
    warnings.push(`Elevated AST (${ast} U/L) - Liver damage possible`);
  }
  
  if (!isNaN(bilirubin) && bilirubin > 3) {
    warnings.push(`Elevated bilirubin (${bilirubin} mg/dL) - Jaundice, liver dysfunction`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Renal Function Test results
 */
function interpretRFT(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const creatinine = parseFloat(testData["Creatinine"]);
  const urea = parseFloat(testData["Urea"] || testData["Blood Urea"]);
  
  if (!isNaN(creatinine) && creatinine > 3) {
    critical.push(`Severely elevated creatinine (${creatinine} mg/dL) - Acute kidney injury or failure`);
  } else if (!isNaN(creatinine) && creatinine > 1.5) {
    warnings.push(`Elevated creatinine (${creatinine} mg/dL) - Kidney function compromised`);
  }
  
  if (!isNaN(urea) && urea > 50) {
    warnings.push(`Elevated urea (${urea} mg/dL) - Kidney dysfunction`);
  }
  
  return { critical, warnings };
}

/**
 * Main function to interpret all lab test results
 * 
 * @param results Object containing all lab test results, keyed by test name
 * @returns LabInterpretation object with critical findings and warnings
 */
export function interpretLabResults(results: Record<string, Record<string, string>>): LabInterpretation {
  const allCritical: string[] = [];
  const allWarnings: string[] = [];
  
  Object.entries(results).forEach(([testName, testData]) => {
    let interpretation: { critical: string[]; warnings: string[] } | null = null;
    
    // Match test name and call appropriate interpreter
    if (testName === "Complete Blood Count (CBC)") {
      interpretation = interpretCBC(testData);
    } else if (testName === "Blood Film for Malaria (BFFM)") {
      interpretation = interpretMalaria(testData);
    } else if (testName === "Widal Test (Typhoid)") {
      interpretation = interpretWidal(testData);
    } else if (testName === "Brucella Test (B.A.T)") {
      interpretation = interpretBrucella(testData);
    } else if (testName === "VDRL Test (Syphilis)") {
      interpretation = interpretVDRL(testData);
    } else if (testName === "Hepatitis B Test (HBsAg)") {
      interpretation = interpretHepatitisB(testData);
    } else if (testName === "Urine Analysis") {
      interpretation = interpretUrineAnalysis(testData);
    } else if (testName === "Liver Function Test (LFT)") {
      interpretation = interpretLFT(testData);
    } else if (testName === "Renal Function Test (RFT)") {
      interpretation = interpretRFT(testData);
    }
    
    if (interpretation) {
      allCritical.push(...interpretation.critical);
      allWarnings.push(...interpretation.warnings);
    }
  });
  
  return {
    criticalFindings: allCritical,
    warnings: allWarnings,
  };
}
