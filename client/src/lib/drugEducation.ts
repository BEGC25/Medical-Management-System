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
};

/**
 * Get comprehensive educational information for a drug
 * @param genericName - The generic name of the drug (case-insensitive, partial match supported)
 * @returns DrugEducationalInfo object with all educational content
 */
export function getDrugEducationalInfo(genericName: string): DrugEducationalInfo {
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

  if (DRUG_DATABASE[normalizedKey]) {
    return DRUG_DATABASE[normalizedKey];
  }

  // Pattern matching for partial names
  for (const [key, info] of Object.entries(DRUG_DATABASE)) {
    // Check if the search term is contained in the key or vice versa
    if (searchName.includes(key) || key.includes(searchName)) {
      return info;
    }
    
    // Special handling for common aliases and combinations
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
    if (searchName.includes("sp") && key === "sulfadoxine-pyrimethamine") {
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

  // No match found, return default
  return DEFAULT_INFO;
}

/**
 * Get a quick summary of a drug for tooltips
 * @param genericName - The generic name of the drug
 * @returns A brief summary string suitable for tooltips
 */
export function getDrugQuickSummary(genericName: string): string {
  const info = getDrugEducationalInfo(genericName);
  
  // For default info, return a generic message
  if (info === DEFAULT_INFO) {
    return "Consult with healthcare provider for information about this medication.";
  }
  
  // Extract the first sentence from whatItDoes for a concise summary
  const firstSentence = info.whatItDoes.split('.')[0] + '.';
  
  return firstSentence;
}
