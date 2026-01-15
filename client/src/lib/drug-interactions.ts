/**
 * Drug Interaction Checker
 * 
 * This module provides a local database of common drug interactions
 * relevant to South Sudan clinical practice.
 * 
 * Interactions are classified by severity:
 * - Critical: Contraindicated - should never be combined
 * - Major: Significant interaction - requires close monitoring or alternative
 * - Moderate: May require dose adjustment or timing separation
 * - Minor: Usually clinically insignificant
 */

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  effect: string;
  mechanism: string;
  management: string;
  references?: string;
}

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    drug1: 'Warfarin',
    drug2: 'Ciprofloxacin',
    severity: 'major',
    effect: 'Increased risk of bleeding',
    mechanism: 'Ciprofloxacin inhibits warfarin metabolism, increasing INR',
    management: 'Monitor INR closely. Consider dose reduction or alternative antibiotic (Amoxicillin)',
    references: 'BMJ 2008'
  },
  {
    drug1: 'Metformin',
    drug2: 'Contrast Media',
    severity: 'critical',
    effect: 'Lactic acidosis risk',
    mechanism: 'Contrast can cause acute kidney injury, leading to metformin accumulation',
    management: 'STOP metformin 48 hours before contrast study. Resume only after confirming normal kidney function',
    references: 'FDA Warning'
  },
  {
    drug1: 'ACE Inhibitors',
    drug2: 'Potassium',
    severity: 'major',
    effect: 'Hyperkalemia (high potassium)',
    mechanism: 'Both increase potassium retention',
    management: 'Avoid combination. Monitor potassium levels if unavoidable',
  },
  {
    drug1: 'Artemether-Lumefantrine',
    drug2: 'Quinine',
    severity: 'critical',
    effect: 'Cardiotoxicity - QT prolongation',
    mechanism: 'Both prolong QT interval, risk of fatal arrhythmias',
    management: 'NEVER combine. Use one OR the other for malaria treatment',
    references: 'WHO Malaria Guidelines'
  },
  {
    drug1: 'Artemether',
    drug2: 'Quinine',
    severity: 'critical',
    effect: 'Cardiotoxicity - QT prolongation',
    mechanism: 'Both prolong QT interval, risk of fatal arrhythmias',
    management: 'NEVER combine. Use one OR the other for malaria treatment',
    references: 'WHO Malaria Guidelines'
  },
  {
    drug1: 'Coartem',
    drug2: 'Quinine',
    severity: 'critical',
    effect: 'Cardiotoxicity - QT prolongation',
    mechanism: 'Both prolong QT interval, risk of fatal arrhythmias',
    management: 'NEVER combine. Use one OR the other for malaria treatment',
    references: 'WHO Malaria Guidelines'
  },
  {
    drug1: 'Metronidazole',
    drug2: 'Alcohol',
    severity: 'major',
    effect: 'Disulfiram-like reaction (severe nausea, vomiting, flushing)',
    mechanism: 'Metronidazole blocks alcohol metabolism',
    management: 'Advise patient: NO alcohol during treatment and 48 hours after',
  },
  {
    drug1: 'Aspirin',
    drug2: 'Ibuprofen',
    severity: 'moderate',
    effect: 'Reduced cardioprotective effect of aspirin',
    mechanism: 'Ibuprofen blocks aspirin\'s platelet inhibition',
    management: 'Take aspirin 2 hours before ibuprofen, or use paracetamol instead',
  },
  {
    drug1: 'Rifampicin',
    drug2: 'Oral Contraceptives',
    severity: 'major',
    effect: 'Contraceptive failure - risk of pregnancy',
    mechanism: 'Rifampicin induces metabolism of contraceptive hormones',
    management: 'Use additional barrier contraception during TB treatment',
    references: 'WHO TB Guidelines'
  },
  {
    drug1: 'Rifampin',
    drug2: 'Oral Contraceptives',
    severity: 'major',
    effect: 'Contraceptive failure - risk of pregnancy',
    mechanism: 'Rifampicin induces metabolism of contraceptive hormones',
    management: 'Use additional barrier contraception during TB treatment',
    references: 'WHO TB Guidelines'
  },
  {
    drug1: 'Gentamicin',
    drug2: 'Furosemide',
    severity: 'major',
    effect: 'Increased ototoxicity and nephrotoxicity',
    mechanism: 'Synergistic toxic effects on kidney and hearing',
    management: 'Avoid if possible. If necessary, monitor kidney function and hearing closely',
  },
  {
    drug1: 'Amoxicillin',
    drug2: 'Penicillin',
    severity: 'minor',
    effect: 'Redundant therapy',
    mechanism: 'Both are beta-lactam antibiotics with similar action',
    management: 'No significant interaction, but using both is unnecessary. Choose one.',
  },
  {
    drug1: 'Paracetamol',
    drug2: 'Alcohol',
    severity: 'moderate',
    effect: 'Increased liver toxicity risk',
    mechanism: 'Both metabolized by liver; alcohol increases toxic metabolite formation',
    management: 'Avoid excessive alcohol consumption when taking paracetamol regularly',
  },
  {
    drug1: 'Ciprofloxacin',
    drug2: 'Antacids',
    severity: 'moderate',
    effect: 'Reduced antibiotic absorption',
    mechanism: 'Metal ions in antacids bind to ciprofloxacin',
    management: 'Take ciprofloxacin 2 hours before or 6 hours after antacids',
  },
  {
    drug1: 'Tetracycline',
    drug2: 'Calcium',
    severity: 'moderate',
    effect: 'Reduced antibiotic absorption',
    mechanism: 'Calcium binds to tetracycline in the gut',
    management: 'Avoid dairy products 2 hours before/after tetracycline',
  },
  {
    drug1: 'Doxycycline',
    drug2: 'Calcium',
    severity: 'moderate',
    effect: 'Reduced antibiotic absorption',
    mechanism: 'Calcium binds to doxycycline in the gut',
    management: 'Avoid dairy products 2 hours before/after doxycycline',
  },
  {
    drug1: 'Isoniazid',
    drug2: 'Paracetamol',
    severity: 'moderate',
    effect: 'Increased liver toxicity risk',
    mechanism: 'Both can cause hepatotoxicity',
    management: 'Use paracetamol cautiously. Monitor liver function during TB treatment',
  },
  {
    drug1: 'NSAIDs',
    drug2: 'ACE Inhibitors',
    severity: 'moderate',
    effect: 'Reduced blood pressure control, increased kidney risk',
    mechanism: 'NSAIDs counteract ACE inhibitor effects',
    management: 'Monitor blood pressure and kidney function. Use paracetamol instead if possible',
  },
  {
    drug1: 'Ibuprofen',
    drug2: 'ACE Inhibitors',
    severity: 'moderate',
    effect: 'Reduced blood pressure control, increased kidney risk',
    mechanism: 'NSAIDs counteract ACE inhibitor effects',
    management: 'Monitor blood pressure and kidney function. Use paracetamol instead if possible',
  },
];

/**
 * Normalize drug name for comparison (remove common variations)
 */
function normalizeDrugName(name: string): string {
  return name.toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheses and content
    .replace(/[,-]/g, ' ') // Replace hyphens and commas with spaces
    .trim();
}

/**
 * Minimum word length for partial matching in drug names
 */
const MIN_WORD_LENGTH_FOR_MATCH = 3;

/**
 * Check if two drug names match (accounting for variations)
 */
function drugsMatch(drug1: string, drug2: string): boolean {
  const normalized1 = normalizeDrugName(drug1);
  const normalized2 = normalizeDrugName(drug2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // One contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  // Check for partial word matches (for compound drug names)
  const words1 = normalized1.split(/\s+/);
  const words2 = normalized2.split(/\s+/);
  
  return words1.some(w1 => words2.some(w2 => w1 === w2 && w1.length > MIN_WORD_LENGTH_FOR_MATCH));
}

/**
 * Find interaction between two drugs
 */
export function findInteraction(drug1: string, drug2: string): DrugInteraction | null {
  const interaction = DRUG_INTERACTIONS.find(interaction => 
    (drugsMatch(interaction.drug1, drug1) && drugsMatch(interaction.drug2, drug2)) ||
    (drugsMatch(interaction.drug1, drug2) && drugsMatch(interaction.drug2, drug1))
  );
  
  return interaction || null;
}

/**
 * Check a drug against a list of other drugs
 * @param newDrug The drug being added
 * @param existingDrugs List of drugs already prescribed
 * @returns Array of interactions found
 */
export function checkDrugInteractions(newDrug: string, existingDrugs: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  for (const existingDrug of existingDrugs) {
    const interaction = findInteraction(newDrug, existingDrug);
    if (interaction) {
      interactions.push(interaction);
    }
  }
  
  // Sort by severity (critical first)
  const severityOrder = { critical: 0, major: 1, moderate: 2, minor: 3 };
  interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  return interactions;
}

/**
 * Check multiple new drugs against existing prescriptions
 */
export function checkMultipleDrugInteractions(
  newDrugs: string[],
  existingDrugs: string[]
): Map<string, DrugInteraction[]> {
  const interactionMap = new Map<string, DrugInteraction[]>();
  
  for (const newDrug of newDrugs) {
    const interactions = checkDrugInteractions(newDrug, existingDrugs);
    if (interactions.length > 0) {
      interactionMap.set(newDrug, interactions);
    }
  }
  
  return interactionMap;
}

/**
 * Get all interactions within a list of drugs
 */
export function findAllInteractions(drugs: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const interaction = findInteraction(drugs[i], drugs[j]);
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }
  
  // Sort by severity
  const severityOrder = { critical: 0, major: 1, moderate: 2, minor: 3 };
  interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  return interactions;
}

/**
 * Get severity color for UI rendering
 */
export function getSeverityColor(severity: DrugInteraction['severity']): {
  bg: string;
  border: string;
  text: string;
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-600',
        text: 'text-red-900',
      };
    case 'major':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-500',
        text: 'text-orange-900',
      };
    case 'moderate':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-500',
        text: 'text-yellow-900',
      };
    case 'minor':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-400',
        text: 'text-blue-900',
      };
  }
}
