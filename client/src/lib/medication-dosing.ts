/**
 * Medication Dosing Calculator
 * 
 * This module provides automatic weight/age-based dosage calculations
 * for common medications used in South Sudan clinical settings.
 * 
 * All dosing recommendations are based on WHO guidelines and
 * standard pediatric/adult dosing protocols.
 */

export interface MedicationFormulation {
  form: string;
  strength: string;
  instructions: string;
}

export interface MedicationDosing {
  name: string;
  genericName: string;
  category: string;
  adultDose: {
    standard: string;
    calculation?: (weight: number) => number;
    maxDose?: number;
  };
  pediatricDose: {
    calculation: (weight: number, age?: number) => number;
    maxDose: number;
    minAge?: number; // months
  };
  availableFormulations: MedicationFormulation[];
  contraindications: string[];
  warnings: string[];
}

export const MEDICATION_DATABASE: MedicationDosing[] = [
  {
    name: 'Paracetamol (Acetaminophen)',
    genericName: 'Paracetamol',
    category: 'Analgesic/Antipyretic',
    adultDose: {
      standard: '500-1000mg every 4-6 hours',
      maxDose: 4000 // mg/day
    },
    pediatricDose: {
      calculation: (weight) => weight * 15, // 15mg/kg/dose
      maxDose: 1000 // mg/dose
    },
    availableFormulations: [
      { form: 'Tablet', strength: '500mg', instructions: 'Take with water' },
      { form: 'Suspension', strength: '120mg/5ml', instructions: 'Shake well before use' }
    ],
    contraindications: ['Severe liver disease'],
    warnings: ['Do not exceed maximum daily dose', 'Avoid alcohol']
  },
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'Antibiotic (Penicillin)',
    adultDose: {
      standard: '500mg TDS (three times daily) for 7 days'
    },
    pediatricDose: {
      calculation: (weight) => weight * 25, // 25mg/kg/dose TDS
      maxDose: 500
    },
    availableFormulations: [
      { form: 'Capsule', strength: '250mg', instructions: 'Complete full course' },
      { form: 'Capsule', strength: '500mg', instructions: 'Complete full course' },
      { form: 'Suspension', strength: '125mg/5ml', instructions: 'Shake well, refrigerate after opening' }
    ],
    contraindications: ['Penicillin allergy'],
    warnings: ['Complete full course even if feeling better', 'May cause diarrhea']
  },
  {
    name: 'Artemether-Lumefantrine (AL, Coartem)',
    genericName: 'Artemether-Lumefantrine',
    category: 'Antimalarial',
    adultDose: {
      standard: '4 tablets at 0, 8, 24, 36, 48, 60 hours (6 doses)'
    },
    pediatricDose: {
      calculation: (weight) => {
        if (weight < 15) return 1; // 1 tablet per dose
        if (weight < 25) return 2; // 2 tablets per dose
        if (weight < 35) return 3; // 3 tablets per dose
        return 4; // 4 tablets per dose
      },
      maxDose: 4
    },
    availableFormulations: [
      { form: 'Tablet', strength: '20mg/120mg', instructions: 'Take with fatty food/milk for better absorption' }
    ],
    contraindications: ['First trimester pregnancy', 'Severe malaria'],
    warnings: ['Complete all 6 doses', 'Take with food', 'Avoid grapefruit juice']
  },
  {
    name: 'ORS (Oral Rehydration Solution)',
    genericName: 'Oral Rehydration Salts',
    category: 'Rehydration',
    adultDose: {
      standard: '200-400ml after each loose stool'
    },
    pediatricDose: {
      calculation: (weight) => weight * 75, // 75ml/kg over 4 hours for moderate dehydration
      maxDose: 2000
    },
    availableFormulations: [
      { form: 'Sachet', strength: '1L when mixed', instructions: 'Dissolve in 1 liter clean water' }
    ],
    contraindications: ['Severe dehydration requiring IV', 'Intestinal obstruction'],
    warnings: ['Use within 24 hours of mixing', 'Boil water before mixing if unsafe']
  },
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'Analgesic/Anti-inflammatory',
    adultDose: {
      standard: '400-600mg every 6-8 hours',
      maxDose: 2400 // mg/day
    },
    pediatricDose: {
      calculation: (weight) => weight * 10, // 10mg/kg/dose
      maxDose: 600,
      minAge: 6 // months
    },
    availableFormulations: [
      { form: 'Tablet', strength: '200mg', instructions: 'Take with food' },
      { form: 'Tablet', strength: '400mg', instructions: 'Take with food' },
      { form: 'Suspension', strength: '100mg/5ml', instructions: 'Shake well, take with food' }
    ],
    contraindications: ['Active peptic ulcer', 'Severe kidney disease', 'Aspirin allergy'],
    warnings: ['Take with food to reduce stomach upset', 'Avoid in late pregnancy']
  },
  {
    name: 'Metronidazole',
    genericName: 'Metronidazole',
    category: 'Antibiotic/Antiprotozoal',
    adultDose: {
      standard: '400-500mg TDS for 7 days'
    },
    pediatricDose: {
      calculation: (weight) => weight * 7.5, // 7.5mg/kg/dose TDS
      maxDose: 500
    },
    availableFormulations: [
      { form: 'Tablet', strength: '200mg', instructions: 'Complete full course' },
      { form: 'Tablet', strength: '400mg', instructions: 'Complete full course' },
      { form: 'Suspension', strength: '200mg/5ml', instructions: 'Shake well before use' }
    ],
    contraindications: ['First trimester pregnancy', 'Severe liver disease'],
    warnings: ['NO alcohol during treatment and 48 hours after', 'May cause metallic taste']
  },
  {
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin',
    category: 'Antibiotic (Fluoroquinolone)',
    adultDose: {
      standard: '500mg BD (twice daily) for 7-14 days'
    },
    pediatricDose: {
      calculation: (weight) => weight * 15, // 15mg/kg/dose BD
      maxDose: 500,
      minAge: 12 // months - use with caution in children
    },
    availableFormulations: [
      { form: 'Tablet', strength: '250mg', instructions: 'Complete full course' },
      { form: 'Tablet', strength: '500mg', instructions: 'Complete full course' }
    ],
    contraindications: ['Pregnancy', 'Children <1 year'],
    warnings: ['Avoid in children when possible', 'May cause tendon problems', 'Complete full course']
  },
  {
    name: 'Albendazole',
    genericName: 'Albendazole',
    category: 'Anthelmintic (Deworming)',
    adultDose: {
      standard: '400mg single dose'
    },
    pediatricDose: {
      calculation: (weight, age) => {
        if (age && age < 24) return 200; // Children <2 years: 200mg
        return 400; // Children ≥2 years: 400mg
      },
      maxDose: 400,
      minAge: 12 // months
    },
    availableFormulations: [
      { form: 'Tablet', strength: '400mg', instructions: 'Can be chewed or swallowed with water' }
    ],
    contraindications: ['Pregnancy (first trimester)', 'Children <1 year'],
    warnings: ['Repeat dose after 2-4 weeks for some infections']
  },
];

export interface DoseCalculation {
  medication: MedicationDosing;
  calculatedDose: number;
  recommendedFormulation: MedicationFormulation;
  administrationAmount: string;
  frequencyInstructions: string;
  warnings: string[];
  contraindications: string[];
  maxDailyDose?: string;
}

/**
 * Calculate appropriate dose for a patient
 * @param medicationName Name of the medication
 * @param weight Patient weight in kg
 * @param age Patient age in months (optional)
 * @param isAdult Whether the patient is an adult
 * @returns DoseCalculation object or null if medication not found
 */
export function calculateDose(
  medicationName: string,
  weight: number,
  age?: number,
  isAdult: boolean = false
): DoseCalculation | null {
  const medication = MEDICATION_DATABASE.find(
    m => m.name.toLowerCase().includes(medicationName.toLowerCase()) ||
         m.genericName.toLowerCase().includes(medicationName.toLowerCase())
  );

  if (!medication) {
    return null;
  }

  let calculatedDose: number;
  let frequencyInstructions: string;

  if (isAdult) {
    if (medication.adultDose.calculation) {
      calculatedDose = medication.adultDose.calculation(weight);
      if (medication.adultDose.maxDose) {
        calculatedDose = Math.min(calculatedDose, medication.adultDose.maxDose);
      }
    } else {
      // Return standard adult dose
      return {
        medication,
        calculatedDose: 0,
        recommendedFormulation: medication.availableFormulations[0],
        administrationAmount: medication.adultDose.standard,
        frequencyInstructions: medication.adultDose.standard,
        warnings: medication.warnings,
        contraindications: medication.contraindications,
      };
    }
    frequencyInstructions = medication.adultDose.standard;
  } else {
    // Pediatric dosing
    calculatedDose = medication.pediatricDose.calculation(weight, age);
    calculatedDose = Math.min(calculatedDose, medication.pediatricDose.maxDose);
    
    // Default frequency for most pediatric medications
    frequencyInstructions = 'per dose';
  }

  // Select best formulation based on dose
  const formulation = selectBestFormulation(medication, calculatedDose, isAdult);
  const administrationAmount = calculateAdministrationAmount(calculatedDose, formulation);

  return {
    medication,
    calculatedDose: Math.round(calculatedDose * 10) / 10, // Round to 1 decimal
    recommendedFormulation: formulation,
    administrationAmount,
    frequencyInstructions,
    warnings: medication.warnings,
    contraindications: medication.contraindications,
    maxDailyDose: medication.adultDose.maxDose ? `${medication.adultDose.maxDose}mg/day` : undefined,
  };
}

/**
 * Select the most appropriate formulation based on dose and patient age
 */
function selectBestFormulation(
  medication: MedicationDosing,
  dose: number,
  isAdult: boolean
): MedicationFormulation {
  // Prefer suspensions for pediatric doses < 100mg or young patients
  if (!isAdult && dose < 100) {
    const suspension = medication.availableFormulations.find(f => 
      f.form.toLowerCase().includes('suspension') || f.form.toLowerCase().includes('syrup')
    );
    if (suspension) return suspension;
  }

  // Otherwise, prefer tablets/capsules
  return medication.availableFormulations[0];
}

/**
 * Regex pattern for parsing medication strength (e.g., "500mg", "120mg/5ml")
 */
const STRENGTH_PATTERN = /(\d+)mg(?:\/(\d+)ml)?/;

/**
 * Calculate the amount to administer based on formulation strength
 */
function calculateAdministrationAmount(dose: number, formulation: MedicationFormulation): string {
  // Parse strength (e.g., "500mg", "120mg/5ml")
  const strengthMatch = formulation.strength.match(STRENGTH_PATTERN);
  
  if (!strengthMatch) {
    return `${dose}mg`;
  }

  const [, mgStr, mlStr] = strengthMatch;
  const mg = parseInt(mgStr);
  
  if (mlStr) {
    // Liquid formulation - calculate ml needed
    const ml = parseInt(mlStr);
    const mlNeeded = (dose * ml) / mg;
    return `${Math.round(mlNeeded * 10) / 10}ml`;
  } else {
    // Solid formulation - calculate number of units
    const unitsNeeded = dose / mg;
    if (unitsNeeded === 1) {
      return `1 ${formulation.form.toLowerCase()}`;
    } else if (unitsNeeded < 1) {
      return `${Math.round(unitsNeeded * 10) / 10} ${formulation.form.toLowerCase()}`;
    } else if (Number.isInteger(unitsNeeded)) {
      return `${unitsNeeded} ${formulation.form.toLowerCase()}s`;
    } else {
      return `${Math.round(unitsNeeded * 10) / 10} ${formulation.form.toLowerCase()}s`;
    }
  }
}

/**
 * Get medication by name (case-insensitive partial match)
 */
export function getMedication(name: string): MedicationDosing | null {
  return MEDICATION_DATABASE.find(
    m => m.name.toLowerCase().includes(name.toLowerCase()) ||
         m.genericName.toLowerCase().includes(name.toLowerCase())
  ) || null;
}
