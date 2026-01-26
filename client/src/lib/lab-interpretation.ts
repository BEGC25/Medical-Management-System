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
 * Interpret Random Blood Sugar (RBS) results
 */
function interpretRBS(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const glucose = parseFloat(testData["Blood Glucose"]);
  
  if (!isNaN(glucose) && glucose > 200) {
    warnings.push(`Elevated random blood glucose (${glucose} mg/dL) - Suggestive of diabetes; confirmatory fasting test recommended; correlate clinically`);
  } else if (!isNaN(glucose) && glucose < 70) {
    critical.push(`Hypoglycemia detected (${glucose} mg/dL) - URGENT: Consider immediate glucose administration if symptomatic; investigate underlying cause`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Fasting Blood Sugar (FBS) results
 */
function interpretFBS(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const glucose = parseFloat(testData["Blood Glucose"]);
  
  if (!isNaN(glucose) && glucose >= 126) {
    warnings.push(`Fasting glucose ${glucose} mg/dL meets diabetes criteria - Consider HbA1c and clinical correlation; diabetes management plan recommended`);
  } else if (!isNaN(glucose) && glucose >= 100 && glucose < 126) {
    warnings.push(`Impaired fasting glucose (${glucose} mg/dL) - Suggestive of prediabetes; lifestyle modifications and monitoring recommended`);
  } else if (!isNaN(glucose) && glucose < 70) {
    critical.push(`Fasting hypoglycemia (${glucose} mg/dL) - URGENT: Investigate cause; consider immediate treatment if symptomatic`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret HIV Test results
 */
function interpretHIV(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["HIV Antibody"];
  if (result === "Positive") {
    critical.push(`HIV antibody POSITIVE - Confirmatory testing required; refer to specialist for counseling, CD4 count, and management plan`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Hepatitis C Test (HCV) results
 */
function interpretHCV(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["HCV Antibody"];
  if (result === "Positive") {
    critical.push(`Hepatitis C antibody POSITIVE - Confirmatory HCV RNA testing recommended; refer to hepatology`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret H. Pylori Test results
 */
function interpretHPylori(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["H. Pylori Antigen"];
  if (result === "Positive") {
    warnings.push(`H. Pylori POSITIVE - Active infection; treatment indicated per guidelines`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Rheumatoid Factor results
 */
function interpretRheumatoidFactor(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["RF"];
  const titer = testData["Titer"];
  
  if (result === "Positive") {
    if (titer === ">80") {
      warnings.push(`Rheumatoid Factor strongly positive (titer >80) - Suggests rheumatoid arthritis; correlate clinically with joint symptoms`);
    } else if (titer === "40-80" || titer === "20-40") {
      warnings.push(`Rheumatoid Factor positive (titer ${titer}) - May indicate rheumatoid arthritis or other autoimmune conditions; clinical correlation needed`);
    }
  }
  
  return { critical, warnings };
}

/**
 * Interpret ESR (Erythrocyte Sedimentation Rate) results
 */
function interpretESR(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const esr = parseFloat(testData["ESR (1 hour)"]);
  
  if (!isNaN(esr) && esr > 100) {
    warnings.push(`Markedly elevated ESR (${esr} mm/hr) - Suggestive of significant inflammation, infection, or malignancy; further workup needed`);
  } else if (!isNaN(esr) && esr > 50) {
    warnings.push(`Elevated ESR (${esr} mm/hr) - Suggestive of inflammation or infection; correlate clinically with patient presentation`);
  } else if (!isNaN(esr) && esr > 20) {
    warnings.push(`Mildly elevated ESR (${esr} mm/hr) - Consider inflammation; correlate with clinical findings`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Blood Group & Rh results
 */
function interpretBloodGroup(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  // Blood group is informational; no clinical interpretation needed
  // Return empty arrays to avoid fallback message
  return { critical, warnings };
}

/**
 * Interpret Hemoglobin (HB) standalone test results
 */
function interpretHemoglobin(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const hb = parseFloat(testData["Hemoglobin"]);
  
  if (!isNaN(hb) && hb < 7) {
    critical.push(`SEVERE anemia (Hb: ${hb} g/dL) - Urgent transfusion consideration; investigate underlying cause`);
  } else if (!isNaN(hb) && hb < 10) {
    warnings.push(`Moderate anemia (Hb: ${hb} g/dL) - Iron studies, nutritional assessment, and treatment indicated`);
  } else if (!isNaN(hb) && hb > 18) {
    warnings.push(`Elevated hemoglobin (${hb} g/dL) - Consider polycythemia; evaluate for chronic hypoxia or bone marrow disorder`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Total White Blood Count (TWBC) standalone test results
 */
function interpretTWBC(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const wbc = parseFloat(testData["WBC"]);
  
  if (!isNaN(wbc) && wbc > 15) {
    warnings.push(`Markedly elevated WBC (${wbc} x10³/µL) - Rule out severe infection, leukemia, or inflammatory process`);
  } else if (!isNaN(wbc) && wbc > 11) {
    warnings.push(`Elevated WBC (${wbc} x10³/µL) - Suggests infection or inflammation; clinical correlation required`);
  } else if (!isNaN(wbc) && wbc < 4) {
    warnings.push(`Low WBC (${wbc} x10³/µL) - Immunosuppression possible; evaluate for viral infection, bone marrow disorder, or medication effect`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Pregnancy Test (HCG) results
 */
function interpretPregnancyTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["β-hCG"];
  if (result === "Positive") {
    warnings.push(`Pregnancy test POSITIVE - Confirm pregnancy; prenatal care initiation recommended`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Gonorrhea Test results
 */
function interpretGonorrheaTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["Gonorrhea"];
  if (result === "Positive") {
    critical.push(`Gonorrhea test POSITIVE - Sexually transmitted infection detected; treatment indicated and partner notification required`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Chlamydia Test results
 */
function interpretChlamydiaTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["Chlamydia"];
  if (result === "Positive") {
    critical.push(`Chlamydia test POSITIVE - Sexually transmitted infection detected; treatment indicated and partner notification required`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Reproductive Hormones results
 */
function interpretReproductiveHormones(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  // This is a complex panel - provide general guidance for abnormal values
  // Individual hormone levels would need specific reference ranges by age/gender
  warnings.push(`Reproductive hormone panel completed - Results should be interpreted by specialist considering patient age, gender, menstrual cycle phase, and clinical context`);
  
  return { critical, warnings };
}

/**
 * Interpret Thyroid Hormones results
 */
function interpretThyroidHormones(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const tsh = parseFloat(testData["TSH"]);
  const t3 = parseFloat(testData["T3"]);
  const t4 = parseFloat(testData["T4"]);
  
  if (!isNaN(tsh) && tsh > 10) {
    warnings.push(`Markedly elevated TSH (${tsh} μIU/mL) - Suggestive of hypothyroidism; consider thyroid hormone replacement`);
  } else if (!isNaN(tsh) && tsh > 4) {
    warnings.push(`Elevated TSH (${tsh} μIU/mL) - Consider subclinical hypothyroidism; correlate with free T4 levels`);
  } else if (!isNaN(tsh) && tsh < 0.4) {
    warnings.push(`Suppressed TSH (${tsh} μIU/mL) - Suggestive of hyperthyroidism; correlate with free T4 and T3 levels`);
  }
  
  if (!isNaN(t4) && t4 < 5) {
    warnings.push(`Low T4 (${t4} μg/dL) - Suggestive of hypothyroidism; confirm with repeat testing`);
  } else if (!isNaN(t4) && t4 > 12) {
    warnings.push(`Elevated T4 (${t4} μg/dL) - Suggestive of hyperthyroidism; confirm with clinical correlation`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Cardiac & Other Markers results
 */
function interpretCardiacMarkers(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  // Generic interpretation for cardiac markers panel
  warnings.push(`Cardiac marker panel completed - Results should be interpreted in context of patient symptoms, ECG findings, and clinical presentation; urgent cardiology consultation if acute coronary syndrome suspected`);
  
  return { critical, warnings };
}

/**
 * Interpret Toxoplasma Test results
 */
function interpretToxoplasmaTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["Toxoplasma IgG"] || testData["Toxoplasma IgM"] || testData["Toxoplasma"];
  if (result === "Positive") {
    warnings.push(`Toxoplasma antibody POSITIVE - May indicate past or current infection; correlate with clinical presentation, especially in pregnant women and immunocompromised patients`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Filariasis Tests results
 */
function interpretFilariasisTests(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["Filaria Antigen"] || testData["Microfilaria"];
  if (result === "Positive" || result === "Seen") {
    warnings.push(`Filariasis test POSITIVE - Parasitic infection detected; treatment indicated per guidelines`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Schistosomiasis Test results
 */
function interpretSchistosomiasisTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["Schistosoma Antibody"] || testData["Schistosoma Ova"];
  if (result === "Positive" || result === "Seen") {
    warnings.push(`Schistosomiasis test POSITIVE - Parasitic infection detected; treatment indicated and monitor for complications`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Leishmaniasis Test results
 */
function interpretLeishmaniasisTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["Leishmania Antibody"] || testData["Leishmania"];
  if (result === "Positive") {
    critical.push(`Leishmaniasis test POSITIVE - Parasitic infection detected; specialist consultation for appropriate treatment required`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Tuberculosis Tests results
 */
function interpretTuberculosisTests(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["TB GeneXpert"] || testData["Mantoux Test"] || testData["TB Antibody"];
  if (result === "Positive" || result === "Detected") {
    critical.push(`Tuberculosis test POSITIVE - Mycobacterial infection detected; treatment per national guidelines required and ensure infection control measures`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Meningitis Tests results
 */
function interpretMeningitisTests(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["CSF Analysis"] || testData["Meningitis PCR"];
  if (result && result.toLowerCase().includes("positive")) {
    critical.push(`Meningitis test suggests infection - URGENT: Immediate treatment required pending culture results; specialist consultation required`);
  } else {
    warnings.push(`Meningitis panel completed - Interpret CSF findings (WBC, protein, glucose) in clinical context; consider repeat lumbar puncture if high clinical suspicion`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Yellow Fever Test results
 */
function interpretYellowFeverTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["Yellow Fever IgM"] || testData["Yellow Fever"];
  if (result === "Positive") {
    critical.push(`Yellow Fever test POSITIVE - Viral hemorrhagic fever detected; URGENT: Isolate patient, supportive care, and notify public health authorities immediately`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Typhus Test results
 */
function interpretTyphusTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const result = testData["Typhus Antibody"] || testData["Rickettsia"];
  if (result === "Positive") {
    warnings.push(`Typhus test POSITIVE - Rickettsial infection detected; treatment indicated promptly`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Urine Microscopy results
 */
function interpretUrineMicroscopy(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const wbc = testData["WBC/HPF"] || testData["Pus Cells"];
  const rbc = testData["RBC/HPF"] || testData["Red Cells"];
  const bacteria = testData["Bacteria"];
  const casts = testData["Casts"];
  
  if (wbc && wbc !== "0-2" && wbc !== "Negative" && wbc !== "None") {
    warnings.push(`Pyuria detected (${wbc}) - Suggestive of urinary tract infection; consider urine culture and treatment`);
  }
  
  if (rbc && rbc !== "0-2" && rbc !== "Negative" && rbc !== "None") {
    warnings.push(`Hematuria detected (${rbc}) - Consider renal pathology, stones, infection, or malignancy; further workup needed`);
  }
  
  if (bacteria === "Positive" || bacteria === "Many") {
    warnings.push(`Bacteriuria detected - Suggestive of urinary tract infection; consider urine culture for sensitivity`);
  }
  
  if (casts && casts !== "None" && casts !== "Negative") {
    warnings.push(`Urinary casts present (${casts}) - Suggestive of renal parenchymal disease; nephrology consultation may be needed`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Stool Examination results
 */
function interpretStoolExamination(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const appearance = testData["Appearance"];
  const ova = testData["Ova/Parasites"];
  const occultBlood = testData["Occult Blood"];
  
  if (appearance === "Bloody") {
    critical.push(`Bloody stool detected - URGENT: Rule out severe colitis, dysentery, or gastrointestinal bleeding; immediate evaluation needed`);
  }
  
  if (ova && ova !== "None seen" && ova !== "Negative") {
    warnings.push(`Intestinal parasites detected (${ova}) - Treatment indicated per guidelines`);
  }
  
  if (occultBlood === "Positive") {
    warnings.push(`Occult blood POSITIVE - Suggestive of gastrointestinal bleeding; consider endoscopy and further workup for source`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Custom Test results
 */
function interpretCustomTest(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  // Custom test - provide generic guidance
  warnings.push(`Custom test panel completed - Clinical interpretation should be based on test-specific reference ranges and patient clinical context`);
  
  return { critical, warnings };
}

/**
 * Interpret Alkaline Phosphatase (ALP) results
 */
function interpretALP(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const alp = parseFloat(testData["ALP"]);
  
  if (isNaN(alp) || alp === 0) return { critical, warnings };
  
  if (alp > 500) {
    critical.push(`Markedly elevated ALP (${alp} U/L) - Suggests biliary obstruction, Paget's disease, or metastatic bone disease; urgent imaging recommended`);
  } else if (alp > 300) {
    warnings.push(`Significantly elevated ALP (${alp} U/L) - Evaluate for cholestatic liver disease, bone disorders, or malignancy`);
  } else if (alp > 147) {
    warnings.push(`Mildly elevated ALP (${alp} U/L) - Consider hepatobiliary disease, bone growth/healing, or pregnancy`);
  } else if (alp < 35) {
    warnings.push(`Low ALP (${alp} U/L) - May indicate malnutrition, hypothyroidism, or zinc deficiency`);
  }
  
  return { critical, warnings };
}

/**
 * Interpret Testosterone results
 */
function interpretTestosterone(testData: Record<string, string>, patient?: { gender?: string; age?: string }): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  const total = parseFloat(testData["Total Testosterone"] || testData["Testosterone"] || "0");
  const free = parseFloat(testData["Free Testosterone"] || "0");
  
  // Return early if no valid testosterone values
  if ((total === 0 || isNaN(total)) && (free === 0 || isNaN(free))) {
    return { critical, warnings };
  }
  
  // Check if gender is specified for proper interpretation
  if (!patient?.gender) {
    warnings.push(`Testosterone level recorded (${total} ng/dL) - Gender-specific interpretation requires patient gender information`);
    return { critical, warnings };
  }
  
  const isMale = patient.gender.toLowerCase().startsWith('m');
  
  if (isMale) {
    // Male reference: 300-1000 ng/dL
    if (total < 200) {
      warnings.push(`Low testosterone (${total} ng/dL) - Hypogonadism likely; evaluate for primary vs secondary cause, consider endocrine referral`);
    } else if (total < 300) {
      warnings.push(`Borderline low testosterone (${total} ng/dL) - Monitor symptoms (fatigue, low libido, mood changes); repeat testing if symptomatic`);
    } else if (total > 1000) {
      warnings.push(`Elevated testosterone (${total} ng/dL) - Evaluate for exogenous testosterone use or androgen-secreting tumor`);
    }
  } else {
    // Female reference: 15-70 ng/dL
    if (total > 100) {
      warnings.push(`Significantly elevated testosterone (${total} ng/dL) - Evaluate for PCOS, androgen-secreting tumor, or congenital adrenal hyperplasia`);
    } else if (total > 70) {
      warnings.push(`Mildly elevated testosterone (${total} ng/dL) - Consider PCOS; correlate with clinical features (hirsutism, acne, irregular menses)`);
    } else if (total < 10) {
      warnings.push(`Low testosterone (${total} ng/dL) - May contribute to low libido, fatigue; consider if symptomatic`);
    }
  }
  
  return { critical, warnings };
}

/**
 * Interpret Stool Analysis results (alias for Stool Examination)
 */
function interpretStoolAnalysis(testData: Record<string, string>): { critical: string[]; warnings: string[] } {
  const critical: string[] = [];
  const warnings: string[] = [];
  
  // Parasites
  const parasites = testData["Ova/Parasites"] || testData["Parasites"];
  if (parasites && parasites !== "None seen" && parasites !== "Negative") {
    warnings.push(`Intestinal parasite detected: ${parasites} - Treatment indicated`);
  }
  
  // Occult blood
  if (testData["Occult Blood"] === "Positive") {
    warnings.push(`Fecal occult blood POSITIVE - Evaluate for GI bleeding; consider upper/lower endoscopy if age >45 or symptoms present`);
  }
  
  // Bloody stool
  if (testData["Appearance"] === "Bloody" || testData["Color"] === "Red" || testData["Color"] === "Black") {
    critical.push(`Abnormal stool appearance (${testData["Appearance"] || testData["Color"]}) - Urgent GI evaluation for active bleeding`);
  }
  
  // Mucoid stool
  if (testData["Appearance"] === "Mucoid") {
    warnings.push(`Mucoid stool - Consider inflammatory bowel disease, infection, or irritable bowel syndrome`);
  }
  
  // Consistency
  if (testData["Consistency"] === "Watery") {
    warnings.push(`Watery stool - Assess for acute gastroenteritis, ensure adequate hydration`);
  }
  
  return { critical, warnings };
}

/**
 * Main function to interpret all lab test results
 * 
 * @param results Object containing all lab test results, keyed by test name
 * @param patient Optional patient information for gender/age-specific interpretations
 * @returns LabInterpretation object with critical findings and warnings
 */
export function interpretLabResults(
  results: Record<string, Record<string, string>>,
  patient?: { gender?: string; age?: string }
): LabInterpretation {
  const allCritical: string[] = [];
  const allWarnings: string[] = [];
  const unknownPanels: string[] = [];
  
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
    } else if (testName === "Random Blood Sugar (RBS)") {
      interpretation = interpretRBS(testData);
    } else if (testName === "Fasting Blood Sugar (FBS)") {
      interpretation = interpretFBS(testData);
    } else if (testName === "HIV Test") {
      interpretation = interpretHIV(testData);
    } else if (testName === "Hepatitis C Test (HCV)") {
      interpretation = interpretHCV(testData);
    } else if (testName === "H. Pylori Test") {
      interpretation = interpretHPylori(testData);
    } else if (testName === "Rheumatoid Factor") {
      interpretation = interpretRheumatoidFactor(testData);
    } else if (testName === "ESR (Erythrocyte Sedimentation Rate)") {
      interpretation = interpretESR(testData);
    } else if (testName === "Blood Group & Rh") {
      interpretation = interpretBloodGroup(testData);
    } else if (testName === "Hemoglobin (HB)") {
      interpretation = interpretHemoglobin(testData);
    } else if (testName === "Total White Blood Count (TWBC)") {
      interpretation = interpretTWBC(testData);
    } else if (testName === "Pregnancy Test (HCG)") {
      interpretation = interpretPregnancyTest(testData);
    } else if (testName === "Gonorrhea Test") {
      interpretation = interpretGonorrheaTest(testData);
    } else if (testName === "Chlamydia Test") {
      interpretation = interpretChlamydiaTest(testData);
    } else if (testName === "Reproductive Hormones") {
      interpretation = interpretReproductiveHormones(testData);
    } else if (testName === "Thyroid Hormones") {
      interpretation = interpretThyroidHormones(testData);
    } else if (testName === "Cardiac & Other Markers") {
      interpretation = interpretCardiacMarkers(testData);
    } else if (testName === "Toxoplasma Test") {
      interpretation = interpretToxoplasmaTest(testData);
    } else if (testName === "Filariasis Tests") {
      interpretation = interpretFilariasisTests(testData);
    } else if (testName === "Schistosomiasis Test") {
      interpretation = interpretSchistosomiasisTest(testData);
    } else if (testName === "Leishmaniasis Test") {
      interpretation = interpretLeishmaniasisTest(testData);
    } else if (testName === "Tuberculosis Tests") {
      interpretation = interpretTuberculosisTests(testData);
    } else if (testName === "Meningitis Tests") {
      interpretation = interpretMeningitisTests(testData);
    } else if (testName === "Yellow Fever Test") {
      interpretation = interpretYellowFeverTest(testData);
    } else if (testName === "Typhus Test") {
      interpretation = interpretTyphusTest(testData);
    } else if (testName === "Urine Microscopy") {
      interpretation = interpretUrineMicroscopy(testData);
    } else if (testName === "Stool Examination") {
      interpretation = interpretStoolExamination(testData);
    } else if (testName === "Stool Analysis") {
      interpretation = interpretStoolAnalysis(testData);
    } else if (testName === "Hemoglobin (Hb)") {
      interpretation = interpretHemoglobin(testData);
    } else if (testName === "Alkaline Phosphatase (ALP)") {
      interpretation = interpretALP(testData);
    } else if (testName === "Testosterone") {
      interpretation = interpretTestosterone(testData, patient);
    } else if (testName === "Custom Test") {
      interpretation = interpretCustomTest(testData);
    } else {
      // Unknown panel - track it
      unknownPanels.push(testName);
    }
    
    if (interpretation) {
      allCritical.push(...interpretation.critical);
      allWarnings.push(...interpretation.warnings);
    }
  });
  
  // Add a neutral fallback message for unknown panels (even if there are other findings)
  if (unknownPanels.length > 0) {
    allWarnings.push(`Note: Automated interpretation not yet available for: ${unknownPanels.join(", ")}. Please review results clinically and correlate with patient presentation.`);
  }
  
  return {
    criticalFindings: allCritical,
    warnings: allWarnings,
  };
}
