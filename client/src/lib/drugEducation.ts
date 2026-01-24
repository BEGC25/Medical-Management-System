/**
 * Drug Educational Information Module
 * 
 * Provides comprehensive, clinically accurate drug information
 * for display in DrugInfoModal and DrugInfoTooltip components.
 * 
 * Content is tailored for South Sudan healthcare context.
 */

// Drug educational information interface
export interface DrugEducationalInfo {
  whatItDoes: string;
  commonUses: string[];
  importantSafety: {
    dos: string[];
    donts: string[];
  };
  howFastItWorks: {
    onset: string;
    duration: string;
  };
  specialGroups: {
    pregnancy: string;
    breastfeeding: string;
    children: string;
    elderly: string;
  };
}

// Default fallback for unknown drugs
const DEFAULT_INFO: DrugEducationalInfo = {
  whatItDoes: "This medication is used to treat specific medical conditions. Consult with healthcare provider for specific uses.",
  commonUses: ["As prescribed by healthcare provider"],
  importantSafety: {
    dos: ["Take as prescribed", "Follow dosage instructions", "Store in cool, dry place"],
    donts: ["Do not share medication", "Do not exceed recommended dose", "Do not use if expired"]
  },
  howFastItWorks: {
    onset: "Varies by medication",
    duration: "Follow prescribed schedule"
  },
  specialGroups: {
    pregnancy: "Consult healthcare provider",
    breastfeeding: "Consult healthcare provider",
    children: "Use as directed by healthcare provider",
    elderly: "May require dose adjustment"
  }
};

// Comprehensive drug database
const DRUG_DATABASE: Record<string, DrugEducationalInfo> = {
  // ==================== ANALGESICS ====================
  
  "paracetamol": {
    whatItDoes: "Reduces pain and fever. Works by blocking pain signals in the brain and lowering body temperature. Safe for most patients including children and pregnant women.",
    commonUses: [
      "Headache and body pain",
      "Fever from malaria or infections",
      "Menstrual cramps",
      "Post-surgical pain",
      "Arthritis pain relief"
    ],
    importantSafety: {
      dos: ["Take with food or water", "Space doses 4-6 hours apart", "Safe for children and pregnancy"],
      donts: ["Maximum 8 tablets per day (4000mg)", "Avoid alcohol while taking", "Dangerous in severe liver disease", "Do not combine with other paracetamol products"]
    },
    howFastItWorks: {
      onset: "Pain relief: 30-60 minutes, Fever reduction: 1-2 hours",
      duration: "4-6 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe in all trimesters",
      breastfeeding: "Safe",
      children: "Safe from 3 months (dose by weight)",
      elderly: "Safe, use normal dose"
    }
  },

  "ibuprofen": {
    whatItDoes: "Reduces pain, fever, and inflammation. Works by blocking chemicals that cause inflammation and pain in the body.",
    commonUses: [
      "Headaches and muscle pain",
      "Arthritis and joint pain",
      "Menstrual cramps",
      "Fever reduction",
      "Dental pain"
    ],
    importantSafety: {
      dos: ["Take with food or milk", "Drink plenty of water", "Use lowest effective dose", "Can combine with paracetamol"],
      donts: ["Do not take on empty stomach", "Avoid if stomach ulcers", "Not safe in late pregnancy", "May worsen high blood pressure or heart disease"]
    },
    howFastItWorks: {
      onset: "Pain relief: 30-60 minutes",
      duration: "4-6 hours per dose"
    },
    specialGroups: {
      pregnancy: "Avoid, especially 3rd trimester",
      breastfeeding: "Safe in small amounts",
      children: "Safe from 3 months (dose by weight)",
      elderly: "Use cautiously, watch for stomach problems"
    }
  },

  "diclofenac": {
    whatItDoes: "Strong anti-inflammatory medication that reduces pain, swelling, and inflammation. More potent than ibuprofen for joint and muscle conditions.",
    commonUses: [
      "Severe arthritis and joint pain",
      "Back pain and muscle injuries",
      "Post-operative pain",
      "Gout attacks",
      "Severe menstrual pain"
    ],
    importantSafety: {
      dos: ["Always take with food", "Use lowest effective dose", "Drink plenty of water", "Use short-term if possible"],
      donts: ["Avoid if history of stomach ulcers", "Not safe in late pregnancy", "Do not use with other NSAIDs", "Avoid if heart disease or stroke history"]
    },
    howFastItWorks: {
      onset: "30-60 minutes for pain relief",
      duration: "8-12 hours per dose"
    },
    specialGroups: {
      pregnancy: "Avoid, especially 3rd trimester",
      breastfeeding: "Use with caution, small amounts in milk",
      children: "Not recommended under 14 years",
      elderly: "Use with caution, increased risk of side effects"
    }
  },

  "tramadol": {
    whatItDoes: "Moderate to strong pain reliever. Works on the brain to reduce pain sensation. Used for pain not controlled by paracetamol or ibuprofen.",
    commonUses: [
      "Moderate to severe pain",
      "Post-operative pain",
      "Chronic back pain",
      "Pain from injuries",
      "Cancer pain"
    ],
    importantSafety: {
      dos: ["Take as prescribed", "Can take with or without food", "Start with lowest effective dose", "Taper dose when stopping"],
      donts: ["Do not drive or operate machinery", "Avoid alcohol", "Risk of dependence with long-term use", "Do not stop suddenly after prolonged use"]
    },
    howFastItWorks: {
      onset: "30-60 minutes",
      duration: "4-6 hours (regular), 12-24 hours (extended release)"
    },
    specialGroups: {
      pregnancy: "Avoid, especially late pregnancy",
      breastfeeding: "Avoid, passes into breast milk",
      children: "Not recommended under 12 years",
      elderly: "Start with lower doses, monitor closely"
    }
  },

  // ==================== ANTIBIOTICS ====================

  "amoxicillin": {
    whatItDoes: "Kills bacteria causing infections. Penicillin-type antibiotic that works against many common bacteria.",
    commonUses: [
      "Chest infections (pneumonia, bronchitis)",
      "Ear infections",
      "Throat infections",
      "Skin and soft tissue infections",
      "Urinary tract infections"
    ],
    importantSafety: {
      dos: ["Take full course even if feeling better", "Take every 8 hours (3 times daily)", "Can take with or without food", "Finish all tablets"],
      donts: ["Stop if allergic rash develops", "Do not use if penicillin allergy", "May reduce birth control effectiveness", "Report severe diarrhea"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 5-7 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe in all trimesters",
      breastfeeding: "Safe",
      children: "Safe, commonly used antibiotic",
      elderly: "Safe, adjust dose if kidney problems"
    }
  },

  "ampicillin": {
    whatItDoes: "Treats chest, ear and urinary infections. Related to penicillin. Penicillin-type antibiotic effective against many common bacteria.",
    commonUses: [
      "Chest infections (pneumonia, bronchitis)",
      "Ear infections",
      "Urinary tract infections",
      "Meningitis prevention/treatment",
      "Stomach and intestinal infections"
    ],
    importantSafety: {
      dos: ["Take on empty stomach 1 hour before meals", "Take every 6 hours (4 times daily)", "Complete full course of treatment", "Finish all tablets even if feeling better"],
      donts: ["Stop if allergic rash develops", "Do not use if penicillin allergy", "Do not take with food (reduces absorption)", "Report severe diarrhea immediately"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe in all trimesters",
      breastfeeding: "Safe",
      children: "Safe, commonly used antibiotic",
      elderly: "Safe, adjust dose if kidney problems"
    }
  },

  // Form-specific variants for Amoxicillin
  "amoxicillin-syrup": {
    whatItDoes: "Kills bacteria causing infections. Penicillin-type antibiotic that works against many common bacteria. Liquid form ideal for children.",
    commonUses: [
      "Chest infections (pneumonia, bronchitis)",
      "Ear infections",
      "Throat infections",
      "Skin and soft tissue infections",
      "Urinary tract infections"
    ],
    importantSafety: {
      dos: ["Take full course even if feeling better", "Take every 8 hours (3 times daily)", "Can take with or without food", "Finish all of the liquid medicine even when feeling better"],
      donts: ["Stop if allergic rash develops", "Do not use if penicillin allergy", "May reduce birth control effectiveness", "Report severe diarrhea"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 5-7 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe in all trimesters",
      breastfeeding: "Safe",
      children: "Safe, commonly used antibiotic",
      elderly: "Safe, adjust dose if kidney problems"
    }
  },

  // Form-specific variants for Ampicillin
  "ampicillin-injection": {
    whatItDoes: "Injectable antibiotic for serious bacterial infections. Penicillin-type antibiotic given via injection when oral medication is not suitable.",
    commonUses: [
      "Severe chest infections (pneumonia)",
      "Meningitis",
      "Septicemia (blood infections)",
      "Severe urinary tract infections",
      "Perioperative prophylaxis"
    ],
    importantSafety: {
      dos: ["Given by healthcare provider via injection", "Complete full course of treatment as prescribed", "Report any injection site reactions", "Monitor for allergic reactions"],
      donts: ["Stop if allergic rash develops", "Do not use if penicillin allergy", "Report fever or worsening symptoms", "Report severe diarrhea immediately"]
    },
    howFastItWorks: {
      onset: "Rapid onset, works within hours",
      duration: "Usually given every 4-6 hours"
    },
    specialGroups: {
      pregnancy: "Safe in all trimesters",
      breastfeeding: "Safe",
      children: "Safe, commonly used antibiotic",
      elderly: "Safe, adjust dose if kidney problems"
    }
  },

  // Form-specific variants for Ciprofloxacin
  "ciprofloxacin-drops": {
    whatItDoes: "Fluoroquinolone antibiotic eye drops. Broad spectrum coverage. Excellent for bacterial conjunctivitis and corneal ulcers.",
    commonUses: [
      "Bacterial conjunctivitis",
      "Corneal ulcers",
      "Eye infection prevention post-surgery",
      "Severe eye infections"
    ],
    importantSafety: {
      dos: ["Apply every 2-4 hours for first 2 days, then 4 times daily", "Effective against many bacteria", "Good for contact lens-related infections", "Complete full course"],
      donts: ["Do not use for viral infections", "Temporary stinging on application", "Remove contact lenses before use", "Do not touch dropper to eye"]
    },
    howFastItWorks: {
      onset: "Improvement in 1-2 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe for eye use",
      breastfeeding: "Safe for eye use",
      children: "Safe",
      elderly: "Safe"
    }
  },

  // Form-specific variants for Gentamicin
  "gentamicin-injection": {
    whatItDoes: "Injectable antibiotic for serious bacterial infections. Aminoglycoside antibiotic effective against many bacteria. Requires kidney function monitoring.",
    commonUses: [
      "Severe bacterial infections",
      "Septicemia (blood infections)",
      "Complicated urinary tract infections",
      "Intra-abdominal infections",
      "Bone and joint infections"
    ],
    importantSafety: {
      dos: ["Given by healthcare provider via injection", "Requires regular kidney function monitoring", "Complete full course of treatment", "Report hearing changes immediately"],
      donts: ["Do not use without monitoring kidney function", "Report ringing in ears or hearing loss", "Report decreased urine output", "Avoid other nephrotoxic drugs"]
    },
    howFastItWorks: {
      onset: "Rapid onset, works within hours",
      duration: "Usually given once or twice daily"
    },
    specialGroups: {
      pregnancy: "Avoid unless absolutely necessary",
      breastfeeding: "Use with caution",
      children: "Use with dose adjustment and monitoring",
      elderly: "Use cautiously, monitor kidney function closely"
    }
  },

  "gentamicin-drops": {
    whatItDoes: "Strong antibiotic eye drops for serious bacterial eye infections. Broad spectrum coverage. Effective for severe conjunctivitis and corneal ulcers.",
    commonUses: [
      "Severe bacterial conjunctivitis",
      "Corneal ulcers",
      "Bacterial keratitis",
      "Post-operative eye infection prevention"
    ],
    importantSafety: {
      dos: ["Apply 1-2 drops every 4 hours initially", "Can increase to every 1-2 hours for severe infections", "Continue for 48 hours after cure", "Effective for serious infections"],
      donts: ["Do not use for viral conjunctivitis", "Do not share eye drops", "Discard 28 days after opening", "Report worsening vision"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe for eye use",
      breastfeeding: "Safe for eye use",
      children: "Safe",
      elderly: "Safe"
    }
  },

  // Form-specific variants for Metronidazole
  "metronidazole-injection": {
    whatItDoes: "Injectable medication that kills parasites and certain bacteria. Used for serious infections when oral medication is not suitable.",
    commonUses: [
      "Severe intra-abdominal infections",
      "Anaerobic bacterial infections",
      "Perioperative prophylaxis",
      "Severe pelvic infections",
      "Brain abscess"
    ],
    importantSafety: {
      dos: ["Given by healthcare provider via IV infusion", "Complete full course of treatment", "NEVER drink alcohol during treatment and 48 hours after", "Monitor for neurological symptoms"],
      donts: ["NEVER drink alcohol (severe reaction)", "Report tingling or numbness in hands/feet", "Avoid if first trimester pregnancy", "Report severe headache or vision changes"]
    },
    howFastItWorks: {
      onset: "Rapid onset, works within hours",
      duration: "Usually given every 8 hours"
    },
    specialGroups: {
      pregnancy: "Avoid first trimester, safe in 2nd and 3rd",
      breastfeeding: "Safe for short courses",
      children: "Safe, dose by weight",
      elderly: "Safe, may need lower dose"
    }
  },

  "azithromycin": {
    whatItDoes: "Treats chest, throat and ear infections. Works against bacteria resistant to penicillin. Good for patients allergic to penicillin.",
    commonUses: [
      "Chest infections and pneumonia",
      "Throat and ear infections",
      "Skin infections",
      "Sexually transmitted infections",
      "Typhoid fever"
    ],
    importantSafety: {
      dos: ["Usually short course 3-5 days", "Take once daily", "Can take with or without food", "Complete full course"],
      donts: ["Do not use if liver disease", "Avoid if heart rhythm problems", "May reduce birth control effectiveness", "Report severe diarrhea"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Stays in body for several days after last dose"
    },
    specialGroups: {
      pregnancy: "Safe, use when needed",
      breastfeeding: "Safe",
      children: "Safe, good alternative to penicillin",
      elderly: "Safe, monitor for heart rhythm changes"
    }
  },

  "ciprofloxacin": {
    whatItDoes: "Treats urinary, stomach and intestinal infections. Also treats typhoid fever. Broad-spectrum antibiotic.",
    commonUses: [
      "Urinary tract infections",
      "Typhoid fever",
      "Diarrhea and dysentery",
      "Bone and joint infections",
      "Complicated infections"
    ],
    importantSafety: {
      dos: ["Take twice daily", "Drink plenty of water", "Complete full course", "Take 2 hours before or after antacids"],
      donts: ["Avoid in children if possible", "Do not use in pregnancy", "May cause tendon damage", "Avoid excessive sun exposure"],
      },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-14 days treatment"
    },
    specialGroups: {
      pregnancy: "Avoid, use only if no alternative",
      breastfeeding: "Avoid if possible",
      children: "Avoid except for specific conditions",
      elderly: "Safe, adjust dose if kidney problems"
    }
  },

  "metronidazole": {
    whatItDoes: "Kills parasites and certain bacteria. Treats stomach infections, amoeba and giardia. Do not drink alcohol.",
    commonUses: [
      "Amoebic dysentery",
      "Giardia infection",
      "Bacterial vaginosis",
      "Dental infections",
      "Stomach ulcer (H. pylori)"
    ],
    importantSafety: {
      dos: ["Take with food", "Complete full course", "Take 3 times daily usually", "Drink plenty of fluids"],
      donts: ["NEVER drink alcohol during treatment and 48 hours after", "Avoid if first trimester pregnancy", "May cause metallic taste", "Report severe headache or vision changes"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 5-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Avoid first trimester, safe in 2nd and 3rd",
      breastfeeding: "Safe for short courses",
      children: "Safe, dose by weight",
      elderly: "Safe, may need lower dose"
    }
  },

  "doxycycline": {
    whatItDoes: "Broad-spectrum antibiotic treating many bacterial infections. Also used for malaria prevention in travelers.",
    commonUses: [
      "Chest and respiratory infections",
      "Acne and skin infections",
      "Sexually transmitted infections",
      "Malaria prevention",
      "Typhus and other rickettsial infections"
    ],
    importantSafety: {
      dos: ["Take with full glass of water", "Take with food to reduce nausea", "Stay upright 30 minutes after dose", "Use sun protection"],
      donts: ["Do not lie down immediately after taking", "Avoid in pregnancy and children under 8", "Do not take with dairy products or antacids", "May cause sun sensitivity"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-14 days treatment"
    },
    specialGroups: {
      pregnancy: "Avoid, causes teeth staining in baby",
      breastfeeding: "Avoid, passes into milk",
      children: "Avoid under 8 years (tooth discoloration)",
      elderly: "Safe, good option for infections"
    }
  },

  "ceftriaxone": {
    whatItDoes: "Powerful injectable antibiotic for severe infections. Given by injection when oral antibiotics fail or patient cannot swallow.",
    commonUses: [
      "Severe pneumonia and lung infections",
      "Meningitis",
      "Severe typhoid fever",
      "Sepsis and bloodstream infections",
      "Gonorrhea (single dose)"
    ],
    importantSafety: {
      dos: ["Given by injection (IM or IV)", "Usually once or twice daily", "Complete full course", "Monitor for allergic reactions"],
      donts: ["Do not use if severe penicillin allergy", "Avoid mixing with calcium solutions", "Report rash or difficulty breathing", "Do not give IV push too fast"]
    },
    howFastItWorks: {
      onset: "Starts working within hours",
      duration: "Usually 7-14 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe when needed for severe infections",
      breastfeeding: "Safe",
      children: "Safe, commonly used in children",
      elderly: "Safe, excellent option"
    }
  },

  "amoxicillin-clavulanate": {
    whatItDoes: "Enhanced amoxicillin that works against resistant bacteria. Clavulanate prevents bacteria from destroying amoxicillin.",
    commonUses: [
      "Resistant respiratory infections",
      "Complicated urinary infections",
      "Severe skin and soft tissue infections",
      "Dental infections",
      "Animal bites"
    ],
    importantSafety: {
      dos: ["Take with food to reduce stomach upset", "Take 2-3 times daily", "Complete full course", "Store in cool place"],
      donts: ["Stop if allergic rash develops", "Do not use if penicillin allergy", "May cause diarrhea more than plain amoxicillin", "Report severe stomach pain"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe in all trimesters",
      breastfeeding: "Safe",
      children: "Safe, good option for resistant infections",
      elderly: "Safe, may need dose adjustment"
    }
  },

  "cotrimoxazole": {
    whatItDoes: "Combination antibiotic (sulfamethoxazole + trimethoprim) treating various bacterial infections. Also prevents pneumonia in HIV patients.",
    commonUses: [
      "Urinary tract infections",
      "Respiratory infections",
      "Prevention in HIV/AIDS patients",
      "Typhoid fever",
      "Traveler's diarrhea"
    ],
    importantSafety: {
      dos: ["Take twice daily", "Drink plenty of water", "Take full course", "Can take with food"],
      donts: ["Stop if severe rash develops", "Do not use if sulfa allergy", "Avoid in late pregnancy", "Report yellowing of skin/eyes"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 5-14 days treatment"
    },
    specialGroups: {
      pregnancy: "Avoid in 1st and 3rd trimester",
      breastfeeding: "Avoid in newborns",
      children: "Safe from 6 weeks (except newborns)",
      elderly: "Use with caution, monitor blood counts"
    }
  },

  // ==================== ANTIMALARIALS ====================

  "artemether-lumefantrine": {
    whatItDoes: "First-line treatment for uncomplicated malaria. Kills malaria parasites in the blood quickly. Combination therapy prevents resistance.",
    commonUses: [
      "Uncomplicated malaria (P. falciparum)",
      "First-line treatment in South Sudan",
      "All age groups"
    ],
    importantSafety: {
      dos: ["Take twice daily for 3 days", "Take with food or milk for best absorption", "Complete full 6-dose course", "Take at regular intervals (morning and evening)"],
      donts: ["Do not skip doses", "Do not stop if feeling better", "Avoid grapefruit juice", "Report persistent fever after treatment"]
    },
    howFastItWorks: {
      onset: "Fever reduction: 24-48 hours",
      duration: "3-day treatment course"
    },
    specialGroups: {
      pregnancy: "Safe in 2nd and 3rd trimester, consult for 1st trimester",
      breastfeeding: "Safe",
      children: "Safe from 5kg body weight, dose by weight",
      elderly: "Safe, monitor for side effects"
    }
  },

  "artesunate-amodiaquine": {
    whatItDoes: "First-line malaria treatment in South Sudan. Combination of fast-acting artesunate and longer-acting amodiaquine. Highly effective cure rate (95%).",
    commonUses: [
      "Uncomplicated malaria (first-line in South Sudan)",
      "All Plasmodium species",
      "Pediatric and adult malaria"
    ],
    importantSafety: {
      dos: ["Take once daily for 3 days", "Take at same time each day", "Complete full 3-day course", "Can take with or without food"],
      donts: ["Do not use if severe liver disease", "Avoid in severe malaria (use injectable)", "Report yellowing of eyes", "Do not skip days"]
    },
    howFastItWorks: {
      onset: "Fever reduction: 24-36 hours",
      duration: "3-day treatment course"
    },
    specialGroups: {
      pregnancy: "Safe in 2nd and 3rd trimester",
      breastfeeding: "Safe",
      children: "Safe from 6 months, multiple pediatric formulations available",
      elderly: "Safe with normal kidney/liver function"
    }
  },

  "artesunate": {
    whatItDoes: "EMERGENCY treatment for severe malaria. Most effective medication for severe malaria. Can save lives within hours when given promptly.",
    commonUses: [
      "Severe malaria (first-line)",
      "Cerebral malaria",
      "Life-threatening malaria",
      "When patient cannot swallow"
    ],
    importantSafety: {
      dos: ["Give by IV or IM injection", "Give at 0, 12, and 24 hours, then daily", "Switch to oral ACT when patient can swallow", "Monitor for delayed hemolysis"],
      donts: ["Do not delay if severe malaria suspected", "Not for mild malaria", "Monitor blood count for 4 weeks after", "Report dark urine after treatment"]
    },
    howFastItWorks: {
      onset: "Fastest-acting antimalarial (hours)",
      duration: "Minimum 3 doses, then switch to oral"
    },
    specialGroups: {
      pregnancy: "Safe, preferred for severe malaria",
      breastfeeding: "Safe",
      children: "Safe, preferred in severe malaria",
      elderly: "Safe, highly effective"
    }
  },

  "quinine": {
    whatItDoes: "EMERGENCY treatment for severe malaria. Given by slow IV infusion when patient cannot swallow or has severe disease. Life-saving medication.",
    commonUses: [
      "Severe malaria with complications",
      "Cerebral malaria",
      "When patient cannot take oral medication",
      "Alternative when artesunate unavailable"
    ],
    importantSafety: {
      dos: ["Give slowly by IV drip (over 4 hours)", "Monitor blood sugar closely", "Monitor for irregular heartbeat", "Switch to oral when patient can swallow"],
      donts: ["Never give as rapid injection", "Monitor for dangerous low blood sugar", "Watch for ringing in ears", "Do not use if heart problems without monitoring"]
    },
    howFastItWorks: {
      onset: "Starts working within hours",
      duration: "Given every 8 hours until oral possible"
    },
    specialGroups: {
      pregnancy: "Safe, monitor closely",
      breastfeeding: "Safe",
      children: "Safe, calculate dose by weight carefully",
      elderly: "Use with caution, monitor heart and blood sugar"
    }
  },

  "dihydroartemisinin-piperaquine": {
    whatItDoes: "Alternative first-line malaria treatment. Long-acting combination that provides extended protection after treatment. Single daily dose.",
    commonUses: [
      "Uncomplicated malaria",
      "Alternative to AL when not available",
      "Areas with specific resistance patterns"
    ],
    importantSafety: {
      dos: ["Take once daily for 3 days", "Take with water", "Complete full course", "Take at same time each day"],
      donts: ["Avoid if heart rhythm problems", "Do not use with other drugs affecting heart rhythm", "Report dizziness or fainting", "Avoid grapefruit juice"]
    },
    howFastItWorks: {
      onset: "Fever reduction: 24-48 hours",
      duration: "3-day treatment, protection for weeks"
    },
    specialGroups: {
      pregnancy: "Safe in 2nd and 3rd trimester",
      breastfeeding: "Safe",
      children: "Safe from 6 months",
      elderly: "Safe, monitor for heart effects"
    }
  },

  "chloroquine": {
    whatItDoes: "Older antimalarial, still effective for P. vivax malaria and malaria prevention in areas without resistance. Not effective for falciparum malaria in most of Africa.",
    commonUses: [
      "P. vivax malaria",
      "Prevention in areas without resistance",
      "Amoebic liver abscess",
      "Some autoimmune conditions"
    ],
    importantSafety: {
      dos: ["Take with food or milk", "Complete full course", "Use sun protection", "Regular eye checks for long-term use"],
      donts: ["Not effective for P. falciparum in Africa", "Avoid in epilepsy", "May worsen psoriasis", "Report vision changes"]
    },
    howFastItWorks: {
      onset: "Improvement in 24-48 hours",
      duration: "Weekly for prevention, 3 days for treatment"
    },
    specialGroups: {
      pregnancy: "Safe in all trimesters",
      breastfeeding: "Safe",
      children: "Safe, bitter taste may need masking",
      elderly: "Safe, dose adjustment for kidney problems"
    }
  },

  "sulfadoxine-pyrimethamine": {
    whatItDoes: "Intermittent preventive treatment for malaria in pregnancy (IPTp). Single-dose treatment prevents malaria in pregnant women.",
    commonUses: [
      "Malaria prevention in pregnancy (IPTp)",
      "Toxoplasmosis in HIV patients",
      "Alternative malaria treatment in some areas"
    ],
    importantSafety: {
      dos: ["Take single dose monthly in pregnancy", "Start after quickening (16-20 weeks)", "Take with water", "At least 3 doses during pregnancy"],
      donts: ["Avoid if sulfa allergy", "Do not use in first trimester", "Stop if severe rash", "Report yellowing of skin"]
    },
    howFastItWorks: {
      onset: "Prevention starts within days",
      duration: "Protection lasts 4-6 weeks"
    },
    specialGroups: {
      pregnancy: "Recommended for malaria prevention (2nd-3rd trimester)",
      breastfeeding: "Safe",
      children: "Not commonly used",
      elderly: "Safe when indicated"
    }
  },

  // ==================== ANTIHYPERTENSIVES ====================

  "amlodipine": {
    whatItDoes: "Lowers blood pressure by relaxing blood vessels. Long-acting, once-daily medication that reduces risk of stroke and heart attack.",
    commonUses: [
      "High blood pressure (hypertension)",
      "Angina (chest pain)",
      "Prevention of heart attack and stroke"
    ],
    importantSafety: {
      dos: ["Take once daily, same time each day", "Can take with or without food", "Continue even when feeling well", "Monitor blood pressure regularly"],
      donts: ["Do not stop suddenly", "Avoid grapefruit juice", "May cause ankle swelling", "Report severe dizziness or fainting"]
    },
    howFastItWorks: {
      onset: "Full effect in 6-9 hours, maximum benefit in 4-6 weeks",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Avoid, use safer alternatives",
      breastfeeding: "Use with caution",
      children: "Safe in children over 6 years",
      elderly: "Safe, may need lower starting dose"
    }
  },

  "lisinopril": {
    whatItDoes: "ACE inhibitor that lowers blood pressure and protects kidneys. Especially good for diabetics and kidney disease. Reduces strain on heart.",
    commonUses: [
      "High blood pressure",
      "Heart failure",
      "After heart attack",
      "Diabetic kidney protection"
    ],
    importantSafety: {
      dos: ["Take once daily", "Can take with or without food", "Drink adequate fluids", "Monitor blood pressure and kidney function"],
      donts: ["NEVER use in pregnancy", "Avoid salt substitutes (high potassium)", "May cause dry cough", "Report swelling of face or tongue"]
    },
    howFastItWorks: {
      onset: "1-2 hours, maximum effect in 6-8 hours",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "NEVER use, causes severe birth defects",
      breastfeeding: "Use with caution",
      children: "Safe in children over 6 years",
      elderly: "Safe, excellent choice for kidney protection"
    }
  },

  "losartan": {
    whatItDoes: "ARB (Angiotensin Receptor Blocker) that lowers blood pressure. Good alternative to ACE inhibitors. Protects kidneys in diabetes.",
    commonUses: [
      "High blood pressure",
      "Diabetic kidney protection",
      "Heart failure",
      "Prevention of stroke"
    ],
    importantSafety: {
      dos: ["Take once daily", "Can take with or without food", "Continue even when feeling well", "Monitor blood pressure regularly"],
      donts: ["NEVER use in pregnancy", "Avoid salt substitutes", "Report dizziness when standing", "May need potassium monitoring"]
    },
    howFastItWorks: {
      onset: "6 hours, maximum benefit in 3-6 weeks",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "NEVER use, causes severe birth defects",
      breastfeeding: "Avoid, use alternative",
      children: "Safe in children over 6 years",
      elderly: "Safe, good alternative to ACE inhibitors"
    }
  },

  "atenolol": {
    whatItDoes: "Beta-blocker that slows heart rate and lowers blood pressure. Reduces workload on heart. Good for patients with fast heart rate.",
    commonUses: [
      "High blood pressure",
      "Angina (chest pain)",
      "After heart attack",
      "Fast or irregular heartbeat",
      "Prevention of migraine"
    ],
    importantSafety: {
      dos: ["Take once daily, same time", "Can take with or without food", "Check pulse regularly", "Taper when stopping"],
      donts: ["Do not stop suddenly (rebound effects)", "Avoid if severe asthma", "May mask low blood sugar in diabetics", "May cause tiredness"]
    },
    howFastItWorks: {
      onset: "1-2 hours",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Use with caution, monitor baby",
      breastfeeding: "Safe in small amounts",
      children: "Safe when needed",
      elderly: "Safe, good option for heart rate control"
    }
  },

  "hydrochlorothiazide": {
    whatItDoes: "Water pill (diuretic) that removes excess salt and water. Lowers blood pressure by reducing fluid volume. Often combined with other BP medications.",
    commonUses: [
      "High blood pressure",
      "Fluid retention (edema)",
      "Heart failure",
      "Often combined with other BP drugs"
    ],
    importantSafety: {
      dos: ["Take in morning to avoid nighttime urination", "Drink adequate fluids", "Eat potassium-rich foods", "Monitor for dehydration"],
      donts: ["Avoid excessive sun exposure", "May cause low potassium", "Report muscle cramps or weakness", "May affect blood sugar and uric acid"]
    },
    howFastItWorks: {
      onset: "2 hours, peak at 4-6 hours",
      duration: "6-12 hours per dose"
    },
    specialGroups: {
      pregnancy: "Use with caution if needed",
      breastfeeding: "Safe, may reduce milk production",
      children: "Safe when needed",
      elderly: "Safe, monitor for dehydration and dizziness"
    }
  },

  // ==================== ANTIDIABETICS ====================

  "metformin": {
    whatItDoes: "First-line medication for type 2 diabetes. Lowers blood sugar by improving insulin sensitivity. Does not cause low blood sugar when used alone.",
    commonUses: [
      "Type 2 diabetes",
      "Prevention of diabetes in high-risk patients",
      "Polycystic ovary syndrome (PCOS)"
    ],
    importantSafety: {
      dos: ["Take with meals to reduce stomach upset", "Start with low dose, increase gradually", "Continue healthy diet and exercise", "Vitamin B12 monitoring for long-term use"],
      donts: ["Stop 48 hours before surgery or imaging with contrast", "Avoid excessive alcohol", "Not for type 1 diabetes", "Report severe stomach pain or lactic acidosis symptoms"]
    },
    howFastItWorks: {
      onset: "Few days for blood sugar effect, full benefit in weeks",
      duration: "Take 1-3 times daily with meals"
    },
    specialGroups: {
      pregnancy: "Safe, often used for gestational diabetes",
      breastfeeding: "Safe",
      children: "Safe from 10 years for type 2 diabetes",
      elderly: "Safe, monitor kidney function"
    }
  },

  "glibenclamide": {
    whatItDoes: "Sulfonylurea that stimulates pancreas to release more insulin. Lowers blood sugar effectively. Can cause low blood sugar.",
    commonUses: [
      "Type 2 diabetes (when diet and metformin insufficient)",
      "Often combined with metformin"
    ],
    importantSafety: {
      dos: ["Take 30 minutes before breakfast", "Eat regular meals, don't skip", "Carry glucose source for hypoglycemia", "Monitor blood sugar regularly"],
      donts: ["Risk of low blood sugar (hypoglycemia)", "Avoid alcohol", "May cause weight gain", "Not for type 1 diabetes or diabetic coma"]
    },
    howFastItWorks: {
      onset: "1-2 hours",
      duration: "12-24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Avoid, use insulin instead",
      breastfeeding: "Avoid, may cause low blood sugar in baby",
      children: "Not recommended",
      elderly: "Use with caution, increased risk of low blood sugar"
    }
  },

  // ==================== GI MEDICATIONS ====================

  "omeprazole": {
    whatItDoes: "Proton pump inhibitor that reduces stomach acid production. Heals ulcers and treats acid reflux. Very effective for stomach protection.",
    commonUses: [
      "Stomach ulcers and GERD",
      "Protection when taking NSAIDs",
      "H. pylori treatment (with antibiotics)",
      "Severe heartburn"
    ],
    importantSafety: {
      dos: ["Take 30 minutes before breakfast", "Swallow capsule whole", "Complete full course for ulcers", "Can take with or without food"],
      donts: ["Long-term use may affect bone density", "May reduce vitamin B12 and magnesium", "May mask stomach cancer symptoms", "Report persistent stomach pain"]
    },
    howFastItWorks: {
      onset: "1 hour, full effect in 3-4 days",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe when needed",
      breastfeeding: "Safe, minimal passage into milk",
      children: "Safe from 1 year",
      elderly: "Safe, very commonly used"
    }
  },

  "ranitidine": {
    whatItDoes: "H2 blocker that reduces stomach acid. Less potent than omeprazole but works faster. Good for heartburn and minor ulcers.",
    commonUses: [
      "Heartburn and acid reflux",
      "Stomach ulcers",
      "Prevention of stress ulcers",
      "Before procedures"
    ],
    importantSafety: {
      dos: ["Can take with or without food", "Take 30-60 minutes before meals", "Safe for short-term use", "Can use as needed for heartburn"],
      donts: ["May mask serious stomach problems", "Reduce dose in kidney disease", "Report persistent symptoms", "Note: Some formulations recalled due to impurity concerns"]
    },
    howFastItWorks: {
      onset: "30-60 minutes",
      duration: "8-12 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe when needed",
      breastfeeding: "Safe",
      children: "Safe from 1 month",
      elderly: "Safe, adjust dose if kidney problems"
    }
  },

  "ors": {
    whatItDoes: "Oral Rehydration Solution replaces water and salts lost through diarrhea and vomiting. Life-saving treatment for dehydration. Contains glucose and electrolytes.",
    commonUses: [
      "Diarrhea and dehydration",
      "Cholera treatment",
      "Vomiting and dehydration",
      "Heat exhaustion"
    ],
    importantSafety: {
      dos: ["Mix entire packet with 1 liter clean water", "Give small frequent sips", "Continue breastfeeding", "Use within 24 hours of mixing"],
      donts: ["Do not add sugar or salt to prepared ORS", "Discard after 24 hours", "Not for severe dehydration (needs IV fluids)", "Seek help if worsening or bloody diarrhea"]
    },
    howFastItWorks: {
      onset: "Rehydration begins immediately",
      duration: "Give continuously until diarrhea stops"
    },
    specialGroups: {
      pregnancy: "Safe and recommended",
      breastfeeding: "Safe and recommended",
      children: "Essential for children with diarrhea",
      elderly: "Safe and important"
    }
  },

  "loperamide": {
    whatItDoes: "Slows down gut movement to reduce diarrhea. Provides symptomatic relief but does not treat underlying infection. Use short-term only.",
    commonUses: [
      "Acute diarrhea",
      "Traveler's diarrhea",
      "Chronic diarrhea (after evaluation)"
    ],
    importantSafety: {
      dos: ["Take after each loose stool", "Maximum 8 tablets per day", "Use with ORS for hydration", "Short-term use only"],
      donts: ["Do not use if fever or bloody diarrhea", "Not for children under 2 years", "Avoid in severe colitis", "Stop if no improvement in 48 hours"]
    },
    howFastItWorks: {
      onset: "1-3 hours",
      duration: "8-12 hours per dose"
    },
    specialGroups: {
      pregnancy: "Avoid, especially first trimester",
      breastfeeding: "Use with caution",
      children: "Not under 2 years, use cautiously in older children",
      elderly: "Safe, watch for constipation"
    }
  },

  "metoclopramide": {
    whatItDoes: "Anti-nausea medication that speeds up stomach emptying. Treats vomiting and nausea from various causes. Also helps with reflux.",
    commonUses: [
      "Nausea and vomiting",
      "Post-operative nausea",
      "Migraine-associated nausea",
      "Diabetic gastroparesis"
    ],
    importantSafety: {
      dos: ["Take 30 minutes before meals", "Use short-term (up to 12 weeks)", "Lower dose in kidney disease", "Can give by injection if needed"],
      donts: ["Risk of movement disorders with long-term use", "Avoid if intestinal obstruction", "May cause drowsiness", "Report involuntary movements"]
    },
    howFastItWorks: {
      onset: "30-60 minutes (oral), 10-15 minutes (injection)",
      duration: "4-6 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe when needed",
      breastfeeding: "Safe, increases milk production",
      children: "Use with caution, lower doses",
      elderly: "Use lowest dose, increased risk of side effects"
    }
  },

  // ==================== VITAMINS/SUPPLEMENTS ====================

  "vitamin-b-complex": {
    whatItDoes: "Contains all B vitamins needed for energy production, nerve function, and red blood cell formation. Prevents deficiency in poor diet or malabsorption.",
    commonUses: [
      "Vitamin B deficiency",
      "Poor nutrition",
      "Alcoholism",
      "Peripheral neuropathy",
      "Energy support during illness"
    ],
    importantSafety: {
      dos: ["Take with food for better absorption", "Usually once daily", "Safe for long-term use", "May make urine bright yellow (normal)"],
      donts: ["Generally very safe", "Excessive B6 may cause nerve problems", "No serious side effects", "Not a substitute for balanced diet"]
    },
    howFastItWorks: {
      onset: "Immediate absorption, benefits over weeks",
      duration: "Daily supplementation recommended"
    },
    specialGroups: {
      pregnancy: "Safe and beneficial",
      breastfeeding: "Safe and beneficial",
      children: "Safe with appropriate dosing",
      elderly: "Safe, often beneficial"
    }
  },

  "folic-acid": {
    whatItDoes: "Essential vitamin for cell division and DNA formation. Critical for preventing birth defects. Treats certain types of anemia.",
    commonUses: [
      "Prevention of neural tube defects in pregnancy",
      "Megaloblastic anemia",
      "Supplementation with methotrexate",
      "Malnutrition"
    ],
    importantSafety: {
      dos: ["Start before pregnancy if planning", "Take 400mcg daily in pregnancy", "Can take with or without food", "Continue through pregnancy"],
      donts: ["May mask vitamin B12 deficiency", "High doses not better", "Not for pernicious anemia without B12", "Generally very safe"]
    },
    howFastItWorks: {
      onset: "Immediate use by body, full benefit over weeks",
      duration: "Daily supplementation"
    },
    specialGroups: {
      pregnancy: "Essential, 400-800mcg daily recommended",
      breastfeeding: "Safe and recommended",
      children: "Safe, dose by age/weight",
      elderly: "Safe, may prevent cognitive decline"
    }
  },

  "ferrous-sulfate": {
    whatItDoes: "Iron supplement that treats and prevents iron deficiency anemia. Increases red blood cell production. Essential in pregnancy and blood loss.",
    commonUses: [
      "Iron deficiency anemia",
      "Pregnancy (prevention)",
      "Heavy menstrual bleeding",
      "Poor dietary iron intake"
    ],
    importantSafety: {
      dos: ["Take on empty stomach if possible", "Take with vitamin C for better absorption", "Separate from tea/coffee by 2 hours", "Stools will turn black (normal)"],
      donts: ["May cause constipation and nausea", "Take with food if upset stomach", "Separate from calcium and antacids", "Keep away from children (toxic in overdose)"]
    },
    howFastItWorks: {
      onset: "Red blood cell increase in 2-4 weeks",
      duration: "Usually 3-6 months treatment"
    },
    specialGroups: {
      pregnancy: "Essential supplement in pregnancy",
      breastfeeding: "Safe and recommended",
      children: "Safe, dose by weight, liquid forms available",
      elderly: "Safe, may worsen constipation"
    }
  },

  "zinc": {
    whatItDoes: "Essential mineral for immune function and growth. Reduces duration and severity of diarrhea in children. Supports wound healing.",
    commonUses: [
      "Treatment of diarrhea in children",
      "Zinc deficiency",
      "Immune support",
      "Wound healing"
    ],
    importantSafety: {
      dos: ["Give with food to reduce nausea", "10-20mg daily for diarrhea treatment", "Continue for 10-14 days", "Maintain adequate intake"],
      donts: ["Excess may cause nausea and vomiting", "May interfere with copper absorption", "Do not exceed recommended dose", "Not a replacement for ORS in diarrhea"]
    },
    howFastItWorks: {
      onset: "Benefits in diarrhea within 24 hours",
      duration: "Usually 10-14 days for diarrhea"
    },
    specialGroups: {
      pregnancy: "Safe at recommended doses",
      breastfeeding: "Safe at recommended doses",
      children: "Essential for diarrhea management",
      elderly: "Safe, may support immune function"
    }
  },

  "vitamin-c": {
    whatItDoes: "Antioxidant vitamin supporting immune function, wound healing, and iron absorption. Water-soluble, not stored in body.",
    commonUses: [
      "Vitamin C deficiency (scurvy)",
      "Wound healing support",
      "Enhanced iron absorption",
      "Immune support"
    ],
    importantSafety: {
      dos: ["Take with food", "Increases iron absorption when taken together", "Safe in large doses (water-soluble)", "Eat citrus fruits and vegetables"],
      donts: ["Very high doses may cause diarrhea", "May increase kidney stone risk in susceptible individuals", "Generally very safe", "Not proven to prevent colds"]
    },
    howFastItWorks: {
      onset: "Immediate absorption and use",
      duration: "Daily intake recommended"
    },
    specialGroups: {
      pregnancy: "Safe at normal doses",
      breastfeeding: "Safe, important for infant",
      children: "Safe, important for growth",
      elderly: "Safe, supports immune function"
    }
  },

  // ==================== ANTIHISTAMINES ====================

  "cetirizine": {
    whatItDoes: "Second-generation antihistamine that treats allergies without causing drowsiness in most people. Blocks histamine to reduce allergy symptoms.",
    commonUses: [
      "Hay fever and allergic rhinitis",
      "Urticaria (hives)",
      "Itching and skin allergies",
      "Allergic conjunctivitis"
    ],
    importantSafety: {
      dos: ["Take once daily", "Can take with or without food", "Safe for long-term use", "May take at bedtime if causes drowsiness"],
      donts: ["May cause drowsiness in some people", "Avoid alcohol", "Reduce dose in kidney disease", "Do not drive if drowsy"]
    },
    howFastItWorks: {
      onset: "20-60 minutes",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe when needed",
      breastfeeding: "Safe, minimal passage into milk",
      children: "Safe from 6 months",
      elderly: "Safe, may need dose reduction"
    }
  },

  "loratadine": {
    whatItDoes: "Non-sedating antihistamine for allergies. Does not cause drowsiness. Long-acting, once-daily dosing.",
    commonUses: [
      "Seasonal allergies (hay fever)",
      "Year-round allergic rhinitis",
      "Hives and itching",
      "Skin allergies"
    ],
    importantSafety: {
      dos: ["Take once daily", "Can take with or without food", "Safe for daytime use (non-sedating)", "Safe for long-term use"],
      donts: ["Generally minimal side effects", "Rare: headache, dry mouth", "Very safe profile", "Avoid in severe liver disease"]
    },
    howFastItWorks: {
      onset: "1-3 hours",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe when needed",
      breastfeeding: "Safe",
      children: "Safe from 2 years",
      elderly: "Safe, excellent choice"
    }
  },

  "chlorpheniramine": {
    whatItDoes: "First-generation antihistamine that treats allergies and allergic reactions. Causes drowsiness, useful at night. Inexpensive and effective.",
    commonUses: [
      "Allergic rhinitis and hay fever",
      "Hives and itching",
      "Allergic reactions",
      "Common cold symptoms"
    ],
    importantSafety: {
      dos: ["Take with food if upset stomach", "3-4 times daily usually", "Useful at bedtime due to sedation", "Drink plenty of fluids"],
      donts: ["Causes drowsiness", "Do not drive or operate machinery", "Avoid alcohol", "May cause dry mouth and urinary retention"]
    },
    howFastItWorks: {
      onset: "15-30 minutes",
      duration: "4-6 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe when needed",
      breastfeeding: "Safe in small amounts",
      children: "Safe from 1 year",
      elderly: "Use with caution, may cause confusion"
    }
  },

  "promethazine": {
    whatItDoes: "Antihistamine with strong anti-nausea properties. Causes significant drowsiness. Used for allergies, motion sickness, and nausea.",
    commonUses: [
      "Severe allergic reactions",
      "Motion sickness and nausea",
      "Pre-operative sedation",
      "Nighttime allergy relief"
    ],
    importantSafety: {
      dos: ["Take with food", "Use at bedtime when possible", "Good for motion sickness (30 min before travel)", "Can give by injection if needed"],
      donts: ["Causes marked drowsiness", "Do not drive", "Avoid alcohol", "Not for children under 2 years"]
    },
    howFastItWorks: {
      onset: "20 minutes (oral), 5 minutes (injection)",
      duration: "4-6 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe when needed",
      breastfeeding: "Use with caution",
      children: "Not under 2 years, use cautiously in older children",
      elderly: "Use low doses, risk of confusion"
    }
  },

  // ==================== RESPIRATORY ====================

  "salbutamol": {
    whatItDoes: "Bronchodilator that opens airways in asthma and COPD. Relieves wheezing, shortness of breath, and chest tightness. Fast-acting rescue inhaler.",
    commonUses: [
      "Asthma attacks (rescue inhaler)",
      "Prevention of exercise-induced asthma",
      "COPD and wheezing",
      "Bronchospasm"
    ],
    importantSafety: {
      dos: ["Use inhaler with spacer for better delivery", "Rinse mouth after use", "2 puffs every 4-6 hours as needed", "Shake inhaler before use"],
      donts: ["If using more than 3 times per week, see doctor", "May cause fast heartbeat and tremor", "Not for long-term control (need controller inhaler)", "Seek emergency help if no relief"]
    },
    howFastItWorks: {
      onset: "5-15 minutes",
      duration: "4-6 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe, important to control asthma",
      breastfeeding: "Safe",
      children: "Safe, essential for asthma management",
      elderly: "Safe, may need to monitor heart rate"
    }
  },

  "aminophylline": {
    whatItDoes: "Bronchodilator that opens airways in severe asthma and COPD. Given by injection or tablet for difficult breathing. Narrow therapeutic window.",
    commonUses: [
      "Severe asthma exacerbation",
      "COPD",
      "Chronic bronchitis",
      "Apnea in premature infants"
    ],
    importantSafety: {
      dos: ["Take with food to reduce nausea", "Regular blood level monitoring", "Maintain steady dose timing", "Avoid sudden changes"],
      donts: ["Many drug interactions", "Avoid excessive caffeine", "May cause nausea and headache", "Report rapid heartbeat or seizures"]
    },
    howFastItWorks: {
      onset: "30 minutes (oral), immediate (IV)",
      duration: "6-8 hours (regular), 12-24 hours (sustained release)"
    },
    specialGroups: {
      pregnancy: "Use with caution when needed",
      breastfeeding: "Use with caution, monitor baby",
      children: "Safe, dose carefully by weight",
      elderly: "Use lower doses, monitor closely"
    }
  },

  // ==================== ANTIPARASITICS ====================

  "albendazole": {
    whatItDoes: "Broad-spectrum anti-worm medication. Kills intestinal worms including roundworm, hookworm, whipworm, and tapeworm. Single or short course treatment.",
    commonUses: [
      "Intestinal worms (roundworm, hookworm, whipworm)",
      "Tapeworm infections",
      "Mass deworming programs",
      "Giardia and other parasites"
    ],
    importantSafety: {
      dos: ["Take with fatty meal for better absorption", "Single dose for most worms", "Entire family should be treated", "Repeat dose in 2-3 weeks for some worms"],
      donts: ["Avoid in first trimester of pregnancy", "May cause mild stomach upset", "Report severe stomach pain", "Generally very safe"]
    },
    howFastItWorks: {
      onset: "Worms expelled within 24-72 hours",
      duration: "Single dose or 3-day course"
    },
    specialGroups: {
      pregnancy: "Avoid first trimester, safe in 2nd and 3rd",
      breastfeeding: "Safe",
      children: "Safe from 1 year, common in mass programs",
      elderly: "Safe"
    }
  },

  "mebendazole": {
    whatItDoes: "Deworming medication for intestinal parasites. Alternative to albendazole. Kills worms by preventing their nutrition absorption.",
    commonUses: [
      "Pinworm (threadworm)",
      "Roundworm, hookworm, whipworm",
      "Mixed worm infections",
      "Mass deworming"
    ],
    importantSafety: {
      dos: ["Can take with or without food", "Chew tablet or swallow whole", "Treat entire household for pinworm", "Good hygiene to prevent reinfection"],
      donts: ["Avoid in first trimester pregnancy", "May cause mild stomach upset", "Report severe stomach pain", "Generally very safe"]
    },
    howFastItWorks: {
      onset: "Worms expelled within 24-72 hours",
      duration: "Single dose or 3-day course"
    },
    specialGroups: {
      pregnancy: "Avoid first trimester, safe in 2nd and 3rd",
      breastfeeding: "Safe",
      children: "Safe from 1 year",
      elderly: "Safe"
    }
  },

  // ==================== OTHERS ====================

  "prednisolone": {
    whatItDoes: "Corticosteroid that reduces inflammation and suppresses immune system. Powerful anti-inflammatory for many conditions. Short-term use preferred.",
    commonUses: [
      "Severe asthma exacerbation",
      "Severe allergic reactions",
      "Autoimmune conditions",
      "Severe skin conditions",
      "Inflammatory conditions"
    ],
    importantSafety: {
      dos: ["Take with food in morning", "Taper dose when stopping (do not stop suddenly)", "Short-term use when possible", "Monitor blood sugar and blood pressure"],
      donts: ["Do not stop abruptly after prolonged use", "May raise blood sugar and blood pressure", "Weakens immune system", "Long-term use causes many side effects"]
    },
    howFastItWorks: {
      onset: "Hours to days depending on condition",
      duration: "24 hours per dose, effects last beyond dosing"
    },
    specialGroups: {
      pregnancy: "Safe when needed, use lowest dose",
      breastfeeding: "Safe for short courses",
      children: "Safe for short-term use, monitor growth",
      elderly: "Safe but increases osteoporosis and diabetes risk"
    }
  },

  "dexamethasone": {
    whatItDoes: "Potent, long-acting corticosteroid. 25 times stronger than cortisol. Used for severe inflammation, cerebral edema, and severe COVID-19.",
    commonUses: [
      "Cerebral edema (brain swelling)",
      "Severe COVID-19 (hospitalized patients on oxygen)",
      "Severe allergic reactions",
      "Bacterial meningitis adjunct",
      "Severe asthma"
    ],
    importantSafety: {
      dos: ["Usually given by injection in emergencies", "Can give orally for some conditions", "Monitor blood sugar closely", "Use short-term when possible"],
      donts: ["Do not use for mild COVID-19", "May cause severe immunosuppression", "Raises blood sugar significantly", "Many drug interactions"]
    },
    howFastItWorks: {
      onset: "Hours (rapid for emergencies)",
      duration: "Long-acting, 36-72 hours"
    },
    specialGroups: {
      pregnancy: "Use when benefits outweigh risks",
      breastfeeding: "Safe for short courses",
      children: "Safe for acute use, monitor growth",
      elderly: "Increased side effects, use cautiously"
    }
  },

  "diazepam": {
    whatItDoes: "Benzodiazepine that reduces anxiety, stops seizures, and relaxes muscles. Used for emergency seizure control and severe anxiety.",
    commonUses: [
      "Status epilepticus (prolonged seizures)",
      "Febrile seizures in children",
      "Severe anxiety",
      "Muscle spasms",
      "Pre-procedure sedation"
    ],
    importantSafety: {
      dos: ["Use lowest dose for shortest time", "Given rectally for emergency seizures", "Taper when stopping", "Store rectal tubes properly"],
      donts: ["Risk of dependence with long-term use", "Causes drowsiness", "Do not drive", "Avoid alcohol", "Do not stop suddenly"]
    },
    howFastItWorks: {
      onset: "1-5 minutes (IV), 10 minutes (rectal), 30-60 minutes (oral)",
      duration: "Variable, long-acting (12-24 hours)"
    },
    specialGroups: {
      pregnancy: "Avoid, use only for seizure emergencies",
      breastfeeding: "Avoid, causes sedation in baby",
      children: "Safe for seizure emergencies",
      elderly: "Use very low doses, risk of falls and confusion"
    }
  },

  "phenobarbital": {
    whatItDoes: "Long-acting anti-seizure medication. Prevents seizures in epilepsy. Also used for neonatal seizures. Requires monitoring.",
    commonUses: [
      "Epilepsy (long-term control)",
      "Neonatal seizures",
      "Status epilepticus (after other treatments)",
      "Febrile seizures prevention"
    ],
    importantSafety: {
      dos: ["Take same time daily", "Regular blood level monitoring", "Taper very slowly when stopping", "Avoid missing doses"],
      donts: ["Do not stop suddenly (may cause seizures)", "Causes drowsiness especially initially", "Many drug interactions", "Avoid alcohol"]
    },
    howFastItWorks: {
      onset: "30-60 minutes, full effect in days to weeks",
      duration: "Very long-acting (12-24 hours)"
    },
    specialGroups: {
      pregnancy: "Use if needed for seizure control, vitamin K in late pregnancy",
      breastfeeding: "Safe, monitor baby for sedation",
      children: "Safe, commonly used in neonates",
      elderly: "Use lower doses, risk of confusion"
    }
  },

  // ==================== ANTIFUNGALS ====================
  
  "fluconazole": {
    whatItDoes: "Antifungal medication that treats yeast and fungal infections. Works by stopping fungal growth. Single dose effective for vaginal thrush.",
    commonUses: [
      "Vaginal yeast infections (thrush)",
      "Oral thrush (candidiasis)",
      "Fungal skin infections",
      "Systemic fungal infections",
      "Prevention in immunocompromised patients"
    ],
    importantSafety: {
      dos: ["Take with or without food", "Single 150mg dose for vaginal thrush", "Complete full course for serious infections", "Stay well hydrated"],
      donts: ["Avoid if severe liver disease", "May interact with many medications", "Report yellowing of skin/eyes", "Multiple doses needed for oral thrush"]
    },
    howFastItWorks: {
      onset: "Symptoms improve in 24-48 hours",
      duration: "Single dose lasts several days"
    },
    specialGroups: {
      pregnancy: "Use only if clearly needed, especially avoid first trimester",
      breastfeeding: "Safe for single dose, consult for multiple doses",
      children: "Safe, dose by weight",
      elderly: "Safe, monitor liver and kidney function"
    }
  },

  "nystatin": {
    whatItDoes: "Antifungal medication that treats yeast infections in mouth and intestines. Not absorbed into blood, works locally. Very safe.",
    commonUses: [
      "Oral thrush in babies and adults",
      "Intestinal candidiasis",
      "Prevention of fungal infections in immunocompromised",
      "Thrush in denture wearers"
    ],
    importantSafety: {
      dos: ["Swish oral suspension in mouth before swallowing", "Apply after feeds in babies", "Continue for 48 hours after symptoms clear", "Clean dentures if wearing"],
      donts: ["Not effective for systemic infections", "Do not swallow tablets whole - let dissolve in mouth", "Minimal side effects", "Safe for long-term use"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-14 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe",
      breastfeeding: "Safe",
      children: "Safe from birth, commonly used in infants",
      elderly: "Safe"
    }
  },

  "clotrimazole": {
    whatItDoes: "Antifungal cream and pessary for skin and vaginal fungal infections. Kills fungi causing athlete's foot, ringworm, and thrush.",
    commonUses: [
      "Vaginal yeast infections",
      "Athlete's foot",
      "Ringworm",
      "Jock itch",
      "Fungal skin infections"
    ],
    importantSafety: {
      dos: ["Apply cream twice daily to clean, dry skin", "Continue for 2 weeks after symptoms clear", "Pessary: single dose at bedtime for vaginal thrush", "Wash hands after application"],
      donts: ["Do not use on broken skin", "May damage latex condoms/diaphragms", "Avoid eye contact", "Do not swallow cream"]
    },
    howFastItWorks: {
      onset: "Symptoms improve in 2-3 days",
      duration: "Cream: 2-4 weeks, Pessary: single dose"
    },
    specialGroups: {
      pregnancy: "Cream safe, pessary safe but avoid applicator in pregnancy",
      breastfeeding: "Safe",
      children: "Safe for skin infections",
      elderly: "Safe"
    }
  },

  "ketoconazole": {
    whatItDoes: "Strong antifungal for systemic and resistant fungal infections. Works against many types of fungi. Requires monitoring.",
    commonUses: [
      "Severe fungal skin infections",
      "Systemic fungal infections",
      "Fungal infections resistant to other treatments",
      "Certain hormonal conditions"
    ],
    importantSafety: {
      dos: ["Take with food for better absorption", "Monitor liver function regularly", "Take full course as prescribed", "Report any nausea or jaundice"],
      donts: ["Avoid if liver disease", "Many drug interactions - check with doctor", "May cause liver damage", "Do not take with antacids"]
    },
    howFastItWorks: {
      onset: "Improvement in several days",
      duration: "Usually 2-6 weeks treatment"
    },
    specialGroups: {
      pregnancy: "Avoid",
      breastfeeding: "Avoid",
      children: "Use with caution, monitor closely",
      elderly: "Use with caution, monitor liver function"
    }
  },

  "miconazole": {
    whatItDoes: "Antifungal gel for oral thrush, especially in infants and immunocompromised patients. Safe and effective.",
    commonUses: [
      "Oral thrush in babies",
      "Oral thrush in adults",
      "Denture-related thrush",
      "Prevention in immunocompromised"
    ],
    importantSafety: {
      dos: ["Apply gel to affected areas 4 times daily", "Continue for 2 days after symptoms clear", "Apply after feeds in babies", "Avoid eating/drinking for 30 minutes after"],
      donts: ["Risk of choking in babies under 4 months", "Avoid in babies with swallowing problems", "Report difficulty breathing", "May interact with warfarin"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe",
      breastfeeding: "Safe",
      children: "Safe from 4 months, use with caution in younger babies",
      elderly: "Safe"
    }
  },

  // ==================== OBSTETRIC/GYNECOLOGY ====================
  
  "oxytocin": {
    whatItDoes: "Hormone that causes uterus to contract. Used to induce labor and prevent/treat bleeding after delivery. Life-saving medication.",
    commonUses: [
      "Postpartum hemorrhage prevention",
      "Postpartum hemorrhage treatment",
      "Labor induction",
      "Augmentation of labor",
      "Abortion management"
    ],
    importantSafety: {
      dos: ["Give immediately after delivery to prevent bleeding", "Can give by IM injection or IV drip", "Monitor contractions and bleeding", "Essential medicine for all deliveries"],
      donts: ["Must have trained healthcare provider", "Monitor for excessive contractions", "Watch for water retention", "Careful use in scarred uterus"]
    },
    howFastItWorks: {
      onset: "IM: 3-5 minutes, IV: immediate",
      duration: "30-60 minutes"
    },
    specialGroups: {
      pregnancy: "Used during labor and delivery",
      breastfeeding: "Safe, helps with milk let-down",
      children: "Not applicable",
      elderly: "Not applicable"
    }
  },

  "misoprostol": {
    whatItDoes: "Medication that causes uterine contractions. Prevents and treats postpartum bleeding. Also used for labor induction and medical abortion.",
    commonUses: [
      "Prevention of postpartum hemorrhage",
      "Treatment of postpartum hemorrhage",
      "Induction of labor",
      "Medical management of miscarriage",
      "Cervical ripening before procedures"
    ],
    importantSafety: {
      dos: ["Give 600mcg orally after delivery if no oxytocin available", "Can be given under tongue or vaginally", "Store in cool place", "Keep dry (moisture reduces effectiveness)"],
      donts: ["Do not use to induce labor in scarred uterus", "May cause fever and chills", "Diarrhea is common side effect", "Not for prevention of stomach ulcers in pregnancy"]
    },
    howFastItWorks: {
      onset: "10-40 minutes depending on route",
      duration: "Several hours"
    },
    specialGroups: {
      pregnancy: "Used during labor/delivery, causes abortion if used earlier",
      breastfeeding: "Safe",
      children: "Not applicable",
      elderly: "Not applicable for obstetric use"
    }
  },

  "ergometrine": {
    whatItDoes: "Powerful medication that contracts the uterus. Emergency treatment for severe postpartum bleeding. Helps uterus stay contracted.",
    commonUses: [
      "Severe postpartum hemorrhage",
      "Active management of third stage of labor",
      "Incomplete abortion with bleeding"
    ],
    importantSafety: {
      dos: ["Give by IM injection immediately for severe bleeding", "Can repeat dose if needed", "Monitor blood pressure", "Keep refrigerated for best storage"],
      donts: ["Do not give before delivery of baby", "Avoid if high blood pressure", "May cause nausea and vomiting", "Can cause severe hypertension"]
    },
    howFastItWorks: {
      onset: "2-5 minutes",
      duration: "3-6 hours"
    },
    specialGroups: {
      pregnancy: "Only for labor/delivery emergencies",
      breastfeeding: "Safe",
      children: "Not applicable",
      elderly: "Not applicable"
    }
  },

  "magnesium sulfate": {
    whatItDoes: "Emergency treatment for eclampsia (seizures in pregnancy). Also treats severe pre-eclampsia and certain other seizures. Life-saving medication.",
    commonUses: [
      "Eclampsia (seizures in pregnancy/postpartum)",
      "Severe pre-eclampsia prevention",
      "Magnesium deficiency",
      "Torsades de pointes (heart rhythm problem)"
    ],
    importantSafety: {
      dos: ["Loading dose then maintenance by IV drip or IM", "Monitor reflexes, breathing, urine output", "Have calcium gluconate ready as antidote", "Check magnesium levels if possible"],
      donts: ["Toxic if overdosed - monitor closely", "Stop if reflexes disappear", "Watch for breathing depression", "Reduce dose in kidney disease"]
    },
    howFastItWorks: {
      onset: "Immediate by IV, 1 hour by IM",
      duration: "30 minutes IV, several hours IM"
    },
    specialGroups: {
      pregnancy: "Safe and essential for eclampsia",
      breastfeeding: "Safe",
      children: "Used for specific conditions",
      elderly: "Use with caution, adjust for kidney function"
    }
  },

  // ==================== CONTRACEPTIVES ====================
  
  "ethinylestradiol/levonorgestrel": {
    whatItDoes: "Combined oral contraceptive pill containing estrogen and progestin. Prevents pregnancy by stopping ovulation. Very effective when taken correctly.",
    commonUses: [
      "Contraception",
      "Regulation of menstrual cycles",
      "Reduction of menstrual pain",
      "Treatment of acne",
      "Endometriosis management"
    ],
    importantSafety: {
      dos: ["Take one pill daily at same time", "Start on first day of period or Sunday", "Use backup method first 7 days", "Complete each pack before starting next"],
      donts: ["Do not smoke (especially over 35 years)", "Risk of blood clots", "Not for breastfeeding mothers", "Stop if severe headaches, leg pain, or vision changes"]
    },
    howFastItWorks: {
      onset: "Effective after 7 days if started correctly",
      duration: "Protection lasts while taking regularly"
    },
    specialGroups: {
      pregnancy: "Do not use, stop if pregnancy suspected",
      breastfeeding: "Avoid, use progestin-only pill instead",
      children: "Safe for adolescents after menarche",
      elderly: "Not typically used after menopause"
    }
  },

  "levonorgestrel": {
    whatItDoes: "Progestin-only contraception. Emergency contraception in high dose. Mini-pill safe for breastfeeding. Prevents pregnancy without estrogen.",
    commonUses: [
      "Emergency contraception (1.5mg)",
      "Daily contraception (0.03mg)",
      "Contraception while breastfeeding",
      "Contraception when estrogen contraindicated"
    ],
    importantSafety: {
      dos: ["Mini-pill: take same time daily, no pill-free days", "Emergency: take within 72 hours, sooner is better", "Can use while breastfeeding", "No 7-day break like combined pill"],
      donts: ["Emergency pill is not regular contraception", "May cause irregular bleeding", "Less effective if obese (emergency)", "Take at exact same time daily for mini-pill"]
    },
    howFastItWorks: {
      onset: "Mini-pill: effective after 48 hours, Emergency: works best if taken early",
      duration: "Must take daily for continuous protection"
    },
    specialGroups: {
      pregnancy: "Stop if pregnancy occurs",
      breastfeeding: "Safe, preferred contraceptive while breastfeeding",
      children: "Safe for adolescents",
      elderly: "Not typically needed"
    }
  },

  "medroxyprogesterone": {
    whatItDoes: "Long-acting injectable contraception (Depo-Provera). Single injection provides 3 months protection. Very effective and convenient.",
    commonUses: [
      "Long-term contraception",
      "Contraception for those who can't remember daily pills",
      "Endometriosis treatment",
      "Reduction of menstrual bleeding"
    ],
    importantSafety: {
      dos: ["Inject deep IM every 12 weeks", "Can start immediately postpartum", "Safe while breastfeeding", "Keep track of injection due dates"],
      donts: ["Delays return to fertility (average 10 months)", "May cause weight gain", "May reduce bone density with very long-term use", "Irregular bleeding common initially"]
    },
    howFastItWorks: {
      onset: "Immediate if given within 5 days of period start",
      duration: "3 months per injection"
    },
    specialGroups: {
      pregnancy: "Do not use, but safe if accidentally given early pregnancy",
      breastfeeding: "Safe and preferred",
      children: "Safe for adolescents",
      elderly: "Not typically needed, concern for bone density"
    }
  },

  // ==================== ANTIRETROVIRALS ====================
  
  "tenofovir/lamivudine/dolutegravir": {
    whatItDoes: "First-line HIV treatment combining three powerful antiretroviral medications in one pill. Most effective HIV treatment available. Suppresses virus to undetectable levels.",
    commonUses: [
      "First-line HIV treatment",
      "HIV treatment in pregnant women",
      "HIV treatment in children and adolescents",
      "Prevention of HIV transmission (when viral load suppressed)"
    ],
    importantSafety: {
      dos: ["Take one tablet daily with or without food", "Take at same time each day", "Never miss doses", "Continue even when feeling well", "Regular viral load and CD4 monitoring"],
      donts: ["Do not stop suddenly", "Do not share medications", "Report new symptoms", "May cause initial sleep problems or headache", "Inform all healthcare providers you're on ARVs"]
    },
    howFastItWorks: {
      onset: "Viral load decreases within weeks",
      duration: "Lifelong treatment needed"
    },
    specialGroups: {
      pregnancy: "Safe and preferred regimen in pregnancy",
      breastfeeding: "Safe, continues during breastfeeding",
      children: "Safe from age 6 years or weight 25kg+",
      elderly: "Safe, monitor kidney function"
    }
  },

  "tenofovir/lamivudine/efavirenz": {
    whatItDoes: "Alternative first-line HIV treatment. Three antiretroviral drugs in one pill. Effective at suppressing HIV virus.",
    commonUses: [
      "First-line HIV treatment",
      "Alternative to TDF/3TC/DTG",
      "HIV treatment when DTG not suitable"
    ],
    importantSafety: {
      dos: ["Take once daily at bedtime", "Take on empty stomach for better absorption", "Never miss doses", "Continue lifelong", "Regular monitoring needed"],
      donts: ["May cause vivid dreams, dizziness initially", "Do not drive if dizzy", "Avoid alcohol", "Not first choice in pregnancy", "May cause rash - report if severe"]
    },
    howFastItWorks: {
      onset: "Viral load decreases within weeks",
      duration: "Lifelong treatment"
    },
    specialGroups: {
      pregnancy: "Avoid in first trimester if possible, safe after",
      breastfeeding: "Safe",
      children: "Safe, dose by weight",
      elderly: "Safe, monitor closely"
    }
  },

  "zidovudine/lamivudine": {
    whatItDoes: "Antiretroviral combination used mainly for preventing mother-to-child transmission of HIV. Also part of some second-line regimens.",
    commonUses: [
      "Prevention of mother-to-child HIV transmission",
      "Part of second-line HIV treatment",
      "HIV treatment in specific situations"
    ],
    importantSafety: {
      dos: ["Take twice daily", "Take with or without food", "Essential during pregnancy for HIV+ mothers", "Continue as prescribed", "Monitor blood counts"],
      donts: ["May cause anemia - monitor blood", "May cause nausea initially", "Do not miss doses", "Report severe fatigue", "More side effects than newer regimens"]
    },
    howFastItWorks: {
      onset: "Works within weeks",
      duration: "Continue as prescribed"
    },
    specialGroups: {
      pregnancy: "Safe and important for preventing transmission to baby",
      breastfeeding: "Safe",
      children: "Safe from birth",
      elderly: "Safe, monitor blood counts"
    }
  },

  "nevirapine": {
    whatItDoes: "Antiretroviral for HIV treatment and prevention of mother-to-child transmission. Syrup form for pediatric use and infant prophylaxis.",
    commonUses: [
      "Pediatric HIV treatment",
      "Prevention of mother-to-child transmission",
      "Single-dose to HIV-exposed newborns",
      "Part of HIV treatment regimens"
    ],
    importantSafety: {
      dos: ["Give single dose to newborn of HIV+ mother", "For treatment: start with low dose then increase", "Monitor liver function", "Watch for rash carefully"],
      donts: ["Do not use if severe liver disease", "Serious rash can occur - stop if severe", "May cause hepatitis - monitor liver", "Many drug interactions"]
    },
    howFastItWorks: {
      onset: "Single dose prophylaxis works immediately",
      duration: "For treatment: lifelong"
    },
    specialGroups: {
      pregnancy: "Safe and used for PMTCT",
      breastfeeding: "Safe",
      children: "Safe from birth, commonly used in infants",
      elderly: "Safe, monitor liver"
    }
  },

  "lopinavir/ritonavir": {
    whatItDoes: "Second-line HIV treatment for patients who failed first-line therapy. Powerful protease inhibitor combination. Used for drug-resistant HIV.",
    commonUses: [
      "Second-line HIV treatment",
      "HIV treatment when first-line fails",
      "Drug-resistant HIV",
      "Pediatric HIV treatment"
    ],
    importantSafety: {
      dos: ["Take twice daily with food", "Keep refrigerated if possible", "Monitor cholesterol and blood sugar", "Regular viral load monitoring"],
      donts: ["Many drug interactions", "May cause diarrhea", "May increase cholesterol", "Taste bad - can mix with food for children"]
    },
    howFastItWorks: {
      onset: "Viral load improves within weeks",
      duration: "Lifelong treatment"
    },
    specialGroups: {
      pregnancy: "Safe second-line option in pregnancy",
      breastfeeding: "Safe",
      children: "Safe, syrup available",
      elderly: "Safe, monitor metabolism"
    }
  },

  "dolutegravir": {
    whatItDoes: "Powerful HIV medication with high barrier to resistance. Often used as part of combination therapy. Very effective integrase inhibitor.",
    commonUses: [
      "Part of first-line HIV treatment",
      "Second-line HIV treatment",
      "Treatment of drug-resistant HIV"
    ],
    importantSafety: {
      dos: ["Take once or twice daily with or without food", "Very few drug interactions", "High barrier to resistance", "Well tolerated"],
      donts: ["May cause insomnia or headache initially", "Report muscle pain or weakness", "Avoid taking with antacids", "Weight gain possible"]
    },
    howFastItWorks: {
      onset: "Viral load decreases rapidly",
      duration: "Lifelong treatment"
    },
    specialGroups: {
      pregnancy: "Safe, preferred option",
      breastfeeding: "Safe",
      children: "Safe from 6 years or 25kg",
      elderly: "Safe, well tolerated"
    }
  },

  // ==================== VACCINES ====================
  
  "tetanus toxoid": {
    whatItDoes: "Vaccine preventing tetanus (lockjaw). Given to pregnant women to protect mother and baby. Essential after dirty wounds.",
    commonUses: [
      "Prevention of tetanus in pregnancy",
      "Wound prophylaxis after injury",
      "Primary immunization series",
      "Booster doses"
    ],
    importantSafety: {
      dos: ["Give to all pregnant women (2-3 doses)", "Give after injuries with dirty wounds", "Safe in all trimesters", "Protects both mother and newborn"],
      donts: ["Pain and swelling at injection site", "Safe vaccine with minimal side effects", "Previous severe reaction is contraindication", "Low risk of allergic reaction"]
    },
    howFastItWorks: {
      onset: "Protection after 2-3 doses",
      duration: "Boosters every 10 years or after injury"
    },
    specialGroups: {
      pregnancy: "Safe and essential",
      breastfeeding: "Safe",
      children: "Part of routine immunization",
      elderly: "Safe, important for wound prophylaxis"
    }
  },

  "hepatitis b vaccine": {
    whatItDoes: "Vaccine preventing hepatitis B virus infection. Given at birth and in series. Protects liver from chronic infection.",
    commonUses: [
      "Routine infant immunization",
      "Healthcare worker immunization",
      "High-risk individuals",
      "Post-exposure prophylaxis"
    ],
    importantSafety: {
      dos: ["Give at birth, 6 weeks, and 14 weeks", "Safe from birth", "Give IM in thigh (infants) or arm", "Essential for all newborns"],
      donts: ["Minimal side effects", "Local soreness common", "Low-grade fever possible", "Safe in immunocompromised"]
    },
    howFastItWorks: {
      onset: "Protection after 3 doses",
      duration: "Long-lasting, usually lifelong"
    },
    specialGroups: {
      pregnancy: "Safe",
      breastfeeding: "Safe",
      children: "Safe from birth, essential immunization",
      elderly: "Safe, may need higher doses"
    }
  },

  "rabies vaccine": {
    whatItDoes: "Vaccine preventing rabies after animal bites. Life-saving - rabies is 100% fatal without treatment. Give immediately after dog/bat bite.",
    commonUses: [
      "Post-exposure prophylaxis after bites",
      "Pre-exposure prophylaxis for high-risk individuals",
      "Dog, bat, or wild animal bites"
    ],
    importantSafety: {
      dos: ["Give immediately after any dog/bat bite", "Series of 4-5 doses on days 0, 3, 7, 14 (and 28)", "Clean wound thoroughly first", "Give with immunoglobulin if available"],
      donts: ["Do not delay - rabies is fatal", "Local reactions common", "Complete all doses essential", "Report any bite from animal to health facility immediately"]
    },
    howFastItWorks: {
      onset: "Antibodies develop over 2 weeks",
      duration: "Protection during series and shortly after"
    },
    specialGroups: {
      pregnancy: "Safe and essential if exposed",
      breastfeeding: "Safe",
      children: "Safe from birth, critical for children",
      elderly: "Safe"
    }
  },

  "bcg vaccine": {
    whatItDoes: "Vaccine preventing severe tuberculosis in children. Given at birth. Protects against TB meningitis and disseminated TB.",
    commonUses: [
      "Prevention of childhood tuberculosis",
      "Prevention of TB meningitis",
      "Prevention of disseminated TB"
    ],
    importantSafety: {
      dos: ["Give at birth or soon after", "Intradermal injection in left upper arm", "Will leave small scar", "Single dose provides protection"],
      donts: ["Do not give if HIV+ infant with symptoms", "Do not inject intramuscularly", "Abscess at site may occur", "Safe in most HIV-exposed infants"]
    },
    howFastItWorks: {
      onset: "Protection develops over 6-8 weeks",
      duration: "Protection lasts years, decreases in adolescence"
    },
    specialGroups: {
      pregnancy: "Not given to pregnant women",
      breastfeeding: "Given to breastfeeding babies",
      children: "Essential vaccine for all newborns in TB-endemic areas",
      elderly: "Not given to elderly"
    }
  },

  "measles vaccine": {
    whatItDoes: "Vaccine preventing measles infection. Part of routine immunization. Prevents serious complications including pneumonia and encephalitis.",
    commonUses: [
      "Routine childhood immunization",
      "Measles outbreak response",
      "Catch-up immunization"
    ],
    importantSafety: {
      dos: ["Give at 9 months and 18 months", "Safe and effective", "Can give during outbreak to infants as young as 6 months", "Protects against serious disease"],
      donts: ["Mild fever common day 7-10 after vaccine", "Mild rash may occur", "Do not give if severe immunodeficiency", "Safe in HIV+ children"]
    },
    howFastItWorks: {
      onset: "Protection 2 weeks after vaccination",
      duration: "Long-lasting, likely lifelong after 2 doses"
    },
    specialGroups: {
      pregnancy: "Avoid during pregnancy",
      breastfeeding: "Safe to give to breastfeeding baby",
      children: "Essential childhood vaccine",
      elderly: "Not routinely given"
    }
  },

  "oral polio vaccine": {
    whatItDoes: "Oral vaccine preventing polio. Given as drops by mouth. Protects against paralytic polio. Easy to administer.",
    commonUses: [
      "Routine immunization against polio",
      "Polio outbreak response",
      "Supplementary immunization campaigns"
    ],
    importantSafety: {
      dos: ["Give 2 drops by mouth at birth, 6, 10, 14 weeks", "No need to repeat if baby spits or vomits within 5-10 minutes", "Safe and effective", "Can give with other vaccines"],
      donts: ["Do not give to severely immunocompromised children", "Very rare risk of vaccine-associated paralysis", "Safe in mild illness", "Safe in HIV+ children"]
    },
    howFastItWorks: {
      onset: "Protection after multiple doses",
      duration: "Long-lasting, boosters may be needed"
    },
    specialGroups: {
      pregnancy: "Generally avoid, use if high risk of exposure",
      breastfeeding: "Safe to give to breastfeeding baby",
      children: "Essential childhood vaccine",
      elderly: "Not routinely given"
    }
  },

  "pentavalent vaccine": {
    whatItDoes: "Combination vaccine protecting against 5 diseases: diphtheria, pertussis (whooping cough), tetanus, hepatitis B, and Hib. Reduces number of injections needed.",
    commonUses: [
      "Routine childhood immunization",
      "Protection against 5 serious diseases at once"
    ],
    importantSafety: {
      dos: ["Give at 6, 10, and 14 weeks of age", "Give IM in thigh", "Safe and effective", "Complete all 3 doses essential"],
      donts: ["Fever and local swelling common", "Give paracetamol for fever", "Serious reactions very rare", "Do not skip doses"]
    },
    howFastItWorks: {
      onset: "Protection after 3 doses",
      duration: "Long-lasting, boosters needed for some components"
    },
    specialGroups: {
      pregnancy: "Not given during pregnancy",
      breastfeeding: "Safe to give to breastfeeding baby",
      children: "Essential vaccine for infants",
      elderly: "Not given to elderly"
    }
  },

  // ==================== OPIOID ANALGESICS ====================
  
  "morphine": {
    whatItDoes: "Strong opioid pain reliever for severe pain. Gold standard for cancer pain and post-operative pain. Very effective when used correctly.",
    commonUses: [
      "Severe cancer pain",
      "Post-operative pain",
      "Severe injury pain",
      "Palliative care",
      "Myocardial infarction pain"
    ],
    importantSafety: {
      dos: ["Start with low dose and increase as needed", "Take regularly for chronic pain", "Laxatives needed to prevent constipation", "Safe when prescribed correctly"],
      donts: ["Risk of dependence with long-term use", "Causes constipation - prevent with laxatives", "May cause drowsiness - do not drive", "Respiratory depression if overdosed"]
    },
    howFastItWorks: {
      onset: "Oral: 30-60 minutes, IV: 5-10 minutes",
      duration: "4-6 hours (immediate release)"
    },
    specialGroups: {
      pregnancy: "Use if pain relief essential, risks of use in late pregnancy",
      breastfeeding: "Use lowest effective dose",
      children: "Safe, dose carefully by weight",
      elderly: "Start with lower doses, increased sensitivity"
    }
  },

  "codeine": {
    whatItDoes: "Moderate pain reliever and cough suppressant. Weaker than morphine. Converted to morphine in body. Good for moderate pain.",
    commonUses: [
      "Moderate pain",
      "Severe cough suppression",
      "Diarrhea (at low doses)",
      "Pain not controlled by paracetamol/ibuprofen"
    ],
    importantSafety: {
      dos: ["Take every 4-6 hours as needed", "Can combine with paracetamol", "Drink plenty of fluids", "Take with food if nausea"],
      donts: ["Causes constipation", "May cause drowsiness", "Not effective in 10% of population (poor metabolizers)", "Risk of dependence with long-term use"]
    },
    howFastItWorks: {
      onset: "30-60 minutes",
      duration: "4-6 hours"
    },
    specialGroups: {
      pregnancy: "Avoid if possible, especially near delivery",
      breastfeeding: "Avoid, can cause breathing problems in baby",
      children: "Not recommended under 12 years",
      elderly: "Start with lower doses"
    }
  },

  "pethidine": {
    whatItDoes: "Injectable opioid pain reliever. Used for labor pain and post-operative pain. Shorter acting than morphine.",
    commonUses: [
      "Labor pain relief",
      "Post-operative pain",
      "Acute severe pain",
      "Pain during procedures"
    ],
    importantSafety: {
      dos: ["Give by IM or slow IV injection", "Monitor breathing and blood pressure", "Shorter acting than morphine", "Good for labor pain"],
      donts: ["Can slow labor if given too early", "May affect baby's breathing at birth", "Nausea and vomiting common", "Avoid in kidney disease"]
    },
    howFastItWorks: {
      onset: "IM: 10-15 minutes, IV: 2-3 minutes",
      duration: "2-4 hours"
    },
    specialGroups: {
      pregnancy: "Used for labor pain, may affect baby at delivery",
      breastfeeding: "Avoid or use minimal doses",
      children: "Safe, dose by weight",
      elderly: "Use lower doses, increased side effects"
    }
  },

  // ==================== ADDITIONAL ANTIBIOTICS ====================
  
  "flucloxacillin": {
    whatItDoes: "Antibiotic specifically effective against Staphylococcus bacteria. Resistant to staphylococcal enzymes. First choice for staph skin infections.",
    commonUses: [
      "Staph skin infections and boils",
      "Cellulitis",
      "Bone infections (osteomyelitis)",
      "Joint infections",
      "Post-surgical wound infections"
    ],
    importantSafety: {
      dos: ["Take on empty stomach 30-60 minutes before meals", "Take 4 times daily (every 6 hours)", "Complete full course", "Effective for penicillin-resistant staph"],
      donts: ["Do not use if penicillin allergy", "May cause liver problems - rare", "Take on empty stomach for best absorption", "Report yellowing of skin/eyes"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-14 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe when needed",
      breastfeeding: "Safe",
      children: "Safe, commonly used",
      elderly: "Safe, monitor liver function"
    }
  },

  "phenoxymethylpenicillin": {
    whatItDoes: "Oral penicillin (Penicillin V) for throat and mild infections. Good for strep throat and prevention of rheumatic fever recurrence.",
    commonUses: [
      "Streptococcal throat infections",
      "Prevention of rheumatic fever",
      "Mild skin infections",
      "Dental infections"
    ],
    importantSafety: {
      dos: ["Take on empty stomach 30 minutes before meals", "Take 3-4 times daily", "Complete full 10-day course for strep throat", "Good for penicillin-sensitive infections"],
      donts: ["Do not use if penicillin allergy", "Less effective than amoxicillin for many infections", "Food reduces absorption", "Complete full course to prevent rheumatic fever"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 10 days for strep throat"
    },
    specialGroups: {
      pregnancy: "Safe",
      breastfeeding: "Safe",
      children: "Safe, commonly used for strep throat",
      elderly: "Safe"
    }
  },

  // ==================== ADDITIONAL INSULIN ====================
  
  "regular insulin": {
    whatItDoes: "Short-acting insulin for diabetes. Controls blood sugar after meals. Can be given IV in emergencies. Clear solution.",
    commonUses: [
      "Type 1 diabetes mealtime coverage",
      "Type 2 diabetes requiring insulin",
      "Diabetic ketoacidosis (IV)",
      "Hyperglycemia in hospital"
    ],
    importantSafety: {
      dos: ["Inject 30 minutes before meals", "Rotate injection sites", "Store in refrigerator", "Check blood sugar regularly"],
      donts: ["Risk of low blood sugar if don't eat after injection", "Clear insulin - check for particles", "Do not freeze", "Expired insulin is less effective"]
    },
    howFastItWorks: {
      onset: "30-60 minutes",
      duration: "6-8 hours"
    },
    specialGroups: {
      pregnancy: "Safe and preferred insulin in pregnancy",
      breastfeeding: "Safe",
      children: "Safe, dose carefully",
      elderly: "Safe, risk of low blood sugar"
    }
  },

  "nph insulin": {
    whatItDoes: "Intermediate-acting insulin providing basal coverage. Cloudy insulin that must be mixed. Lasts 12-18 hours.",
    commonUses: [
      "Basal insulin coverage for type 1 diabetes",
      "Type 2 diabetes requiring insulin",
      "Usually given once or twice daily"
    ],
    importantSafety: {
      dos: ["Roll vial gently to mix - cloudy appearance", "Inject 1-2 times daily", "Give before breakfast and/or bedtime", "Eat regular meals to prevent low blood sugar"],
      donts: ["Cloudy insulin - must mix well", "Peak effect 4-8 hours - risk of low sugar", "Must eat regularly", "Do not shake vigorously"]
    },
    howFastItWorks: {
      onset: "1-2 hours",
      duration: "12-18 hours, peak at 4-8 hours"
    },
    specialGroups: {
      pregnancy: "Safe",
      breastfeeding: "Safe",
      children: "Safe",
      elderly: "Safe, monitor for low blood sugar"
    }
  },

  "mixed insulin": {
    whatItDoes: "Pre-mixed combination of short and intermediate insulin (70/30 or 30/70). Convenient fixed combination. Cloudy appearance.",
    commonUses: [
      "Type 2 diabetes twice daily regimen",
      "Patients needing simple regimen",
      "Coverage of both basal and mealtime needs"
    ],
    importantSafety: {
      dos: ["Roll gently to mix before each injection", "Give 30 minutes before breakfast and dinner", "Eat meals regularly", "Rotate injection sites"],
      donts: ["Less flexible than separate insulins", "Must eat at regular times", "Cloudy - must mix well", "Do not skip meals"]
    },
    howFastItWorks: {
      onset: "30-60 minutes",
      duration: "12-16 hours"
    },
    specialGroups: {
      pregnancy: "Can be used, may need adjustment",
      breastfeeding: "Safe",
      children: "Safe",
      elderly: "Safe, simpler regimen"
    }
  },

  "gliclazide": {
    whatItDoes: "Sulfonylurea medication that stimulates pancreas to produce insulin. Good blood sugar control with lower risk of low sugar than other sulfonylureas.",
    commonUses: [
      "Type 2 diabetes not controlled by metformin alone",
      "Type 2 diabetes as add-on therapy",
      "Sometimes as first-line if metformin not tolerated"
    ],
    importantSafety: {
      dos: ["Take before breakfast", "Eat regular meals to prevent low blood sugar", "Monitor blood sugar", "Can combine with metformin"],
      donts: ["Risk of low blood sugar - eat regularly", "May cause weight gain", "Do not use in type 1 diabetes", "Avoid if severe liver or kidney disease"]
    },
    howFastItWorks: {
      onset: "Starts working within hours",
      duration: "12-24 hours"
    },
    specialGroups: {
      pregnancy: "Avoid, use insulin instead",
      breastfeeding: "Avoid",
      children: "Not recommended",
      elderly: "Use with caution, risk of low blood sugar"
    }
  },

  // ==================== ADDITIONAL OPHTHALMICS ====================
  
  "tetracycline eye ointment": {
    whatItDoes: "Antibiotic ointment for bacterial eye infections. Used for trachoma treatment. Also given to newborns to prevent eye infections.",
    commonUses: [
      "Bacterial conjunctivitis",
      "Trachoma treatment",
      "Newborn eye infection prevention",
      "Corneal infections"
    ],
    importantSafety: {
      dos: ["Apply thin strip to lower eyelid", "Use 2-4 times daily", "Continue for 48 hours after symptoms resolve", "Essential for trachoma treatment"],
      donts: ["Blurs vision temporarily after application", "Use at bedtime if vision blur is problem", "Complete full course", "Wash hands before and after"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe for eye use",
      breastfeeding: "Safe for eye use",
      children: "Safe from birth, used in newborns",
      elderly: "Safe"
    }
  },

  "gentamicin eye drops": {
    whatItDoes: "Strong antibiotic eye drops for serious bacterial eye infections. Broad spectrum coverage. Effective for severe conjunctivitis and corneal ulcers.",
    commonUses: [
      "Severe bacterial conjunctivitis",
      "Corneal ulcers",
      "Bacterial keratitis",
      "Post-operative eye infection prevention"
    ],
    importantSafety: {
      dos: ["Apply 1-2 drops every 4 hours initially", "Can increase to every 1-2 hours for severe infections", "Continue for 48 hours after cure", "Effective for serious infections"],
      donts: ["Do not use for viral conjunctivitis", "Do not share eye drops", "Discard 28 days after opening", "Report worsening vision"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe for eye use",
      breastfeeding: "Safe for eye use",
      children: "Safe",
      elderly: "Safe"
    }
  },

  "ciprofloxacin eye drops": {
    whatItDoes: "Fluoroquinolone antibiotic eye drops. Broad spectrum coverage. Excellent for bacterial conjunctivitis and corneal ulcers.",
    commonUses: [
      "Bacterial conjunctivitis",
      "Corneal ulcers",
      "Eye infection prevention post-surgery",
      "Severe eye infections"
    ],
    importantSafety: {
      dos: ["Apply every 2-4 hours for first 2 days, then 4 times daily", "Effective against many bacteria", "Good for contact lens-related infections", "Complete full course"],
      donts: ["Do not use for viral infections", "Temporary stinging on application", "Remove contact lenses before use", "Do not touch dropper to eye"]
    },
    howFastItWorks: {
      onset: "Improvement in 1-2 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe for eye use",
      breastfeeding: "Safe for eye use",
      children: "Safe",
      elderly: "Safe"
    }
  },
};

// Simple drug summaries for fallback when detailed info not available in DRUG_DATABASE
// These summaries provide basic educational information for commonly prescribed drugs
const DRUG_SUMMARIES: Record<string, string> = {
  // Antibiotics not in main database
  "ampicillin": "Treats chest, ear and urinary infections. Related to penicillin. Take on empty stomach 1 hour before meals.",
  "cephalexin": "Treats skin, bone and urinary infections. Safe for most patients. Take 4 times daily for best results.",
  "doxycycline": "Treats chest infections, cholera and some sexually transmitted infections. Take with food and plenty of water. Avoid sun exposure.",
  "clindamycin": "Strong antibiotic for skin, bone and dental infections. Can cause diarrhea - report if severe. Good for penicillin allergic patients.",
  "trimethoprim-sulfamethoxazole": "Treats urinary, chest and ear infections. Also prevents infections in HIV patients. Drink plenty of water.",
  "cotrimoxazole": "Treats urinary, chest and ear infections. Also prevents infections in HIV patients. Drink plenty of water.",
  
  // Pain relievers
  "aspirin": "Treats pain and fever. Reduces inflammation. Take with food or water to protect stomach.",
  "acetylsalicylic acid": "Treats pain and fever. Reduces inflammation. Take with food or water to protect stomach.",
  "diclofenac": "Strong pain and inflammation reliever. Good for joint pain and arthritis. Take with food.",
  
  // Blood pressure medications
  "amlodipine": "Lowers blood pressure by relaxing blood vessels. Take once daily at same time. Works slowly and gently on heart.",
  "losartan": "Lowers blood pressure and protects kidneys. Safe for diabetics. Take once daily with or without food.",
  "atenolol": "Slows heart rate and lowers blood pressure. Good for heart problems. Do not stop suddenly without doctor advice.",
  "lisinopril": "Lowers blood pressure and helps heart work better. Protects kidneys in diabetes. May cause dry cough in some people.",
  "hydrochlorothiazide": "Water pill that lowers blood pressure. Makes you urinate more. Take in morning to avoid night urination.",
  "hctz": "Water pill that lowers blood pressure. Makes you urinate more. Take in morning to avoid night urination.",
  
  // Diabetes medications
  "metformin": "Controls blood sugar in diabetes. First choice medicine for type 2 diabetes. Take with meals to reduce stomach upset.",
  "glimepiride": "Helps pancreas make more insulin. Take before breakfast. Can cause low blood sugar - eat regular meals.",
  "sitagliptin": "Helps control blood sugar without causing low sugar. Take once daily with or without food. Safe for kidneys.",
  
  // Gastrointestinal
  "omeprazole": "Reduces stomach acid for ulcers and heartburn. Take before breakfast on empty stomach. Heals stomach and prevents damage.",
  "ranitidine": "Reduces stomach acid for heartburn and ulcers. Take twice daily or at bedtime. Works quickly to relieve symptoms.",
  "loperamide": "Stops diarrhea by slowing intestines. Take after each loose stool. Drink fluids to prevent dehydration.",
  "bisacodyl": "Treats constipation. Take at bedtime for morning bowel movement. Drink plenty of water.",
  
  // Antihistamines
  "cetirizine": "Treats allergies, itching and hives. Does not cause drowsiness. Take once daily for 24-hour relief.",
  "loratadine": "Treats allergies without causing sleep. Good for hay fever and skin allergies. Take once daily.",
  "chlorpheniramine": "Treats allergies and itching. May cause drowsiness. Take at bedtime if sleepy.",
  
  // Respiratory
  "salbutamol": "Opens airways in asthma and breathing problems. Take when needed for wheezing. May cause shaking or fast heartbeat.",
  "albuterol": "Opens airways in asthma and breathing problems. Take when needed for wheezing. May cause shaking or fast heartbeat.",
  "montelukast": "Prevents asthma attacks. Take daily even when feeling well. Not for acute asthma attacks.",
  "pseudoephedrine": "Unblocks stuffy nose from colds. Take during day not at bedtime. May cause difficulty sleeping.",
  
  // Vitamins
  "vitamin c": "Boosts immunity and helps wound healing. Prevents scurvy. Take daily for general health.",
  "ascorbic acid": "Boosts immunity and helps wound healing. Prevents scurvy. Take daily for general health.",
  "vitamin d3": "Strengthens bones and immune system. Important for children and pregnant women. Take daily.",
  "cholecalciferol": "Strengthens bones and immune system. Important for children and pregnant women. Take daily.",
  "folic acid": "Essential for pregnant women to prevent birth defects. Also treats anemia. Take daily before and during pregnancy.",
  "ferrous sulfate": "Treats and prevents iron deficiency anemia. Important in pregnancy. Take on empty stomach with vitamin C for better absorption.",
  "zinc sulfate": "Boosts immunity and helps wounds heal. Important for children's growth. Take with food to avoid nausea.",
  
  // Antimalarials
  "artemether-lumefantrine": "First-line treatment for uncomplicated malaria. Take twice daily for 3 days with food or milk. Very effective when full course is completed.",
  "coartem": "First-line treatment for uncomplicated malaria. Take twice daily for 3 days with food or milk. Very effective when full course is completed.",
  "artesunate-amodiaquine": "First-line malaria treatment in South Sudan. Take once daily for 3 days. Cures malaria in 95% of cases when taken correctly.",
  "dihydroartemisinin-piperaquine": "Alternative first-line treatment for malaria. Take once daily for 3 days. Longer protection against re-infection compared to other ACTs.",
  "quinine": "Treatment for severe malaria. Now second-line. Take 3 times daily for 7 days. May cause ringing in ears and dizziness.",
  "atovaquone-proguanil": "Prevents malaria for travelers. Take daily starting 1-2 days before travel. Safe for children and short-term use.",
  "malarone": "Prevents malaria for travelers. Take daily starting 1-2 days before travel. Safe for children and short-term use.",
  "mefloquine": "Weekly malaria prevention for travelers. Start 2 weeks before travel. Not for people with mental health conditions.",
  "sulfadoxine-pyrimethamine": "Used for malaria prevention in pregnant women. Given monthly during pregnancy. Also prevents malaria in young children.",
  "fansidar": "Used for malaria prevention in pregnant women. Given monthly during pregnancy. Also prevents malaria in young children.",
  "primaquine": "Prevents malaria relapse from certain types. Requires G6PD blood test before use. Not for pregnant women.",
  "chloroquine": "Old malaria drug. Now only used where parasites remain sensitive. Also treats some autoimmune diseases.",
  
  // Antiparasitics
  "albendazole": "Kills intestinal worms. Single dose for most worms. Take with fatty food for better absorption.",
  "mebendazole": "Treats pinworms and other intestinal worms. Take twice daily for 3 days. May need to repeat after 2 weeks.",
  
  // Injectable medications
  "ceftriaxone": "Strong injectable antibiotic for severe infections. Treats pneumonia, meningitis and sepsis. Given once or twice daily.",
  "gentamicin": "Injectable antibiotic for serious infections. Effective against many bacteria. Requires kidney function monitoring.",
  "benzylpenicillin": "Injectable penicillin for severe infections. Treats pneumonia, meningitis and wound infections. Given every 4-6 hours.",
  "penicillin g": "Injectable penicillin for severe infections. Treats pneumonia, meningitis and wound infections. Given every 4-6 hours.",
  
  // IV Fluids
  "normal saline": "IV fluid to replace water and salt. Used for dehydration and low blood pressure. Given through IV drip.",
  "ringer's lactate": "IV fluid for dehydration and blood loss. Contains electrolytes. Closest to body fluids composition.",
  "dextrose": "IV fluid that provides sugar and water. Used for low blood sugar and dehydration. Contains glucose for energy.",
  
  // Emergency medications
  "adrenaline": "Emergency medicine for severe allergic reactions and cardiac arrest. Works immediately to save lives. Given by injection.",
  "epinephrine": "Emergency medicine for severe allergic reactions and cardiac arrest. Works immediately to save lives. Given by injection.",
  "hydrocortisone": "Steroid for severe allergies, asthma and shock. Reduces inflammation quickly. Given by injection or mouth.",
  "dexamethasone": "Strong steroid for severe inflammation, brain swelling and allergies. Very potent anti-inflammatory. Given by injection or mouth.",
  "furosemide": "Strong water pill for fluid overload and heart failure. Works quickly to remove excess fluid. Given by mouth or injection.",
  "lasix": "Strong water pill for fluid overload and heart failure. Works quickly to remove excess fluid. Given by mouth or injection.",
  
  // Other medications
  "prednisolone": "Steroid for inflammation, asthma and allergies. Reduces immune system activity. Take with food.",
  "hyoscine": "Treats stomach cramps and motion sickness. Stops spasms in intestines. May cause drowsiness.",
  "buscopan": "Treats stomach cramps and irritable bowel. Stops spasms in intestines. Fast-acting relief.",
  "diazepam": "Treats anxiety, muscle spasms and seizures. Calming effect on brain. Can be habit-forming.",
  "valium": "Treats anxiety, muscle spasms and seizures. Calming effect on brain. Can be habit-forming.",
  "ondansetron": "Prevents nausea and vomiting. Works for chemotherapy, surgery and stomach flu. Very effective anti-nausea medicine.",
  "promethazine": "Treats nausea, vomiting and allergies. Also helps with motion sickness. Causes drowsiness.",
  "phenergan": "Treats nausea, vomiting and allergies. Also helps with motion sickness. Causes drowsiness.",
  "metoclopramide": "Treats nausea and vomiting. Helps stomach empty. Also treats migraine nausea.",
  "lidocaine": "Local anesthetic for numbing. Used before procedures and stitches. Works within minutes.",
};

// Form mappings for dosage form normalization
const FORM_MAPPINGS: Record<string, string> = {
  "syrup": "syrup",
  "suspension": "syrup",
  "injection": "injection",
  "iv": "injection",
  "im": "injection",
  "drops": "drops",
  "eye drops": "drops",
  "ear drops": "drops",
  "tablet": "tablet",
  "capsule": "capsule",
  "cream": "cream",
  "ointment": "ointment",
  "inhaler": "inhaler"
};

/**
 * Get comprehensive educational information for a drug
 * @param genericName - The generic name of the drug (case-insensitive, partial match supported)
 * @param form - Optional dosage form (e.g., "tablet", "syrup", "injection", "drops")
 * @returns DrugEducationalInfo object with all educational content
 */
export function getDrugEducationalInfo(genericName: string, form?: string): DrugEducationalInfo {
  if (!genericName) {
    return DEFAULT_INFO;
  }

  // Normalize the input
  const searchName = genericName.toLowerCase().trim();

  // Direct lookup first (for exact matches after normalization)
  const normalizedKey = searchName
    .replace(/\s+/g, "-")
    .replace(/\//g, "-")
    .replace(/acetaminophen/i, "paracetamol"); // Handle acetaminophen alias

  // If form is provided, try form-specific lookup first
  if (form) {
    const normalizedForm = form.toLowerCase().trim();
    const mappedForm = FORM_MAPPINGS[normalizedForm] || normalizedForm;
    const formSpecificKey = `${normalizedKey}-${mappedForm}`;
    
    if (DRUG_DATABASE[formSpecificKey]) {
      return DRUG_DATABASE[formSpecificKey];
    }
  }

  if (DRUG_DATABASE[normalizedKey]) {
    return DRUG_DATABASE[normalizedKey];
  }

  // Pattern matching for partial names
  // Only match if search term is at least 4 characters to avoid false positives
  if (searchName.length >= 4) {
    for (const [key, info] of Object.entries(DRUG_DATABASE)) {
      // Check if the search term is contained in the key or vice versa
      if (searchName.includes(key) || key.includes(searchName)) {
        return info;
      }
    }
  }
  
  // Special handling for common aliases and brand names
  for (const [key, info] of Object.entries(DRUG_DATABASE)) {
    if (searchName.includes("coartem") && key === "artemether-lumefantrine") {
      return info;
    }
    if (searchName.includes("acetaminophen") && key === "paracetamol") {
      return info;
    }
    if (searchName.includes("bactrim") && key === "cotrimoxazole") {
      return info;
    }
    if (searchName.includes("augmentin") && key === "amoxicillin-clavulanate") {
      return info;
    }
    if (searchName.includes("fansidar") && key === "sulfadoxine-pyrimethamine") {
      return info;
    }
    if (searchName.includes("ventolin") && key === "salbutamol") {
      return info;
    }
    if (searchName.includes("albuterol") && key === "salbutamol") {
      return info;
    }
    if ((searchName.includes("iron") || searchName.includes("ferrous")) && key === "ferrous-sulfate") {
      return info;
    }
    if (searchName.includes("hctz") && key === "hydrochlorothiazide") {
      return info;
    }
  }

  // Check simple summaries as fallback before returning default
  for (const [key, summary] of Object.entries(DRUG_SUMMARIES)) {
    if (searchName.includes(key) || key.includes(searchName)) {
      return {
        whatItDoes: summary,
        commonUses: ["As prescribed by healthcare provider"],
        importantSafety: {
          dos: ["Take as prescribed", "Complete full course of treatment", "Store in cool, dry place"],
          donts: ["Do not share medication", "Do not exceed recommended dose", "Do not use if expired"]
        },
        howFastItWorks: {
          onset: "Varies by medication type",
          duration: "Follow prescribed schedule"
        },
        specialGroups: {
          pregnancy: "Consult healthcare provider before use",
          breastfeeding: "Consult healthcare provider before use",
          children: "Use as directed by healthcare provider",
          elderly: "May require dose adjustment"
        }
      };
    }
  }

  // No match found, return default
  return DEFAULT_INFO;
}

/**
 * Get a quick summary of a drug for tooltips
 * @param genericName - The generic name of the drug
 * @param form - Optional dosage form (e.g., "tablet", "syrup", "injection", "drops")
 * @returns A brief summary string suitable for tooltips
 */
export function getDrugQuickSummary(genericName: string, form?: string): string {
  const info = getDrugEducationalInfo(genericName, form);
  
  // For default info, return a generic message
  if (info === DEFAULT_INFO) {
    return "Consult with healthcare provider for information about this medication.";
  }
  
  // Extract the first sentence from whatItDoes for a concise summary
  const firstSentence = info.whatItDoes.split('.')[0] + '.';
  
  return firstSentence;
}
