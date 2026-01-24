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
  
  "acetylsalicylic-acid": {
    whatItDoes: "Aspirin is a non-steroidal anti-inflammatory drug (NSAID) that reduces pain, fever, inflammation, and prevents blood clots. Low doses prevent heart attacks and strokes. Higher doses treat pain and inflammation.",
    commonUses: [
      "Prevention of heart attack and stroke (low dose 75-100mg daily)",
      "Acute heart attack treatment",
      "Pain and fever relief (higher doses)",
      "Anti-inflammatory for arthritis",
      "Prevention of blood clots after surgery"
    ],
    importantSafety: {
      dos: ["Take with food to reduce stomach irritation", "Low-dose aspirin (75-100mg) for heart protection", "Swallow enteric-coated tablets whole", "Continue daily for cardiovascular protection as prescribed"],
      donts: ["Do not give to children under 16 (risk of Reye's syndrome)", "Avoid if history of stomach ulcers or bleeding", "Not in late pregnancy (may cause bleeding)", "Stop 5-7 days before surgery unless instructed otherwise"]
    },
    howFastItWorks: {
      onset: "Pain relief: 30 minutes, Antiplatelet effect: within hours",
      duration: "Pain relief: 4-6 hours, Antiplatelet effect: lasts days after stopping"
    },
    specialGroups: {
      pregnancy: "Avoid especially in 3rd trimester - risk of bleeding and premature closure of ductus",
      breastfeeding: "Use with caution - passes into milk, risk in infant",
      children: "Contraindicated under 16 years - risk of Reye's syndrome",
      elderly: "Use with caution - increased bleeding and stomach ulcer risk"
    }
  },

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

  "cefotaxime": {
    whatItDoes: "Third-generation cephalosporin antibiotic effective against many gram-negative and gram-positive bacteria. Injectable antibiotic for serious infections. Excellent penetration into cerebrospinal fluid makes it ideal for meningitis.",
    commonUses: [
      "Bacterial meningitis",
      "Severe pneumonia and respiratory infections",
      "Septicemia and bloodstream infections",
      "Complicated urinary tract infections",
      "Intra-abdominal infections"
    ],
    importantSafety: {
      dos: ["Given by intramuscular or intravenous injection", "Administer every 6-12 hours depending on severity", "Complete full prescribed course", "Monitor for hypersensitivity reactions"],
      donts: ["Use with extreme caution if penicillin allergy (10% cross-reactivity)", "Report any rash, fever or difficulty breathing", "Avoid rapid IV injection", "Do not mix with aminoglycosides in same syringe"]
    },
    howFastItWorks: {
      onset: "Peak blood levels in 30 minutes (IV) or 30-60 minutes (IM)",
      duration: "Usually given every 6-12 hours for 7-14 days"
    },
    specialGroups: {
      pregnancy: "Safe when needed - no evidence of harm",
      breastfeeding: "Safe - small amounts in milk",
      children: "Safe including neonates - widely used for pediatric meningitis",
      elderly: "Safe - adjust dose if severe kidney impairment"
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

  "cefuroxime": {
    whatItDoes: "Second-generation cephalosporin antibiotic effective against respiratory, skin, and urinary infections. Available in both oral and injectable forms with good activity against common community-acquired bacteria.",
    commonUses: [
      "Community-acquired pneumonia",
      "Acute bacterial sinusitis and otitis media",
      "Skin and soft tissue infections",
      "Urinary tract infections",
      "Perioperative surgical prophylaxis"
    ],
    importantSafety: {
      dos: ["Take oral form with food for better absorption", "Complete full course even if feeling better", "Space doses evenly (every 8-12 hours)", "Store oral suspension in refrigerator"],
      donts: ["Use with caution if penicillin allergy", "Report persistent diarrhea or abdominal pain", "Do not crush or split tablets", "Avoid alcohol during treatment"]
    },
    howFastItWorks: {
      onset: "Oral: 2-3 hours for peak effect, Improvement in 48-72 hours",
      duration: "Usually 7-10 days depending on infection type"
    },
    specialGroups: {
      pregnancy: "Safe when needed - no evidence of harm",
      breastfeeding: "Safe - minimal amounts in milk",
      children: "Safe from 3 months - commonly prescribed",
      elderly: "Safe - reduce dose if kidney problems"
    }
  },

  "amikacin": {
    whatItDoes: "Aminoglycoside antibiotic reserved for serious gram-negative bacterial infections resistant to other antibiotics. Injected medication requiring monitoring of kidney function and hearing due to potential toxicity.",
    commonUses: [
      "Severe hospital-acquired pneumonia",
      "Complicated urinary tract infections",
      "Septicemia and bacteremia",
      "Intra-abdominal infections",
      "Infections caused by multidrug-resistant organisms"
    ],
    importantSafety: {
      dos: ["Given only by injection (IM or IV)", "Requires monitoring of kidney function and hearing", "Ensure adequate hydration during treatment", "Monitor blood levels to optimize dosing"],
      donts: ["High risk of kidney damage and hearing loss", "Avoid concurrent use with other nephrotoxic drugs", "Report decreased urine output or hearing changes", "Not for routine infections - reserve for resistant organisms"]
    },
    howFastItWorks: {
      onset: "Peak levels in 30-90 minutes after injection",
      duration: "Usually given once daily, treatment 7-10 days"
    },
    specialGroups: {
      pregnancy: "Avoid if possible - risk of fetal hearing damage",
      breastfeeding: "Use with caution - limited data available",
      children: "Use with extreme caution - monitor kidney and hearing closely",
      elderly: "High risk group - use lower doses and monitor closely"
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

  "benzathine-penicillin": {
    whatItDoes: "Long-acting penicillin given as single intramuscular injection providing sustained antibiotic levels for weeks. Primarily used for streptococcal infections and syphilis treatment requiring prolonged penicillin exposure.",
    commonUses: [
      "Primary, secondary, and latent syphilis",
      "Prevention of rheumatic fever recurrence",
      "Streptococcal pharyngitis (single-dose treatment)",
      "Prevention of post-streptococcal glomerulonephritis",
      "Yaws and other treponemal infections"
    ],
    importantSafety: {
      dos: ["Given as deep intramuscular injection only", "Ensure correct dose for syphilis stage", "Monitor for allergic reactions after injection", "Complete follow-up for syphilis treatment verification"],
      donts: ["Never give intravenously - can cause severe reactions", "Do not use if penicillin allergy", "Injection site may be painful for several days", "Report severe injection site reactions"]
    },
    howFastItWorks: {
      onset: "Peak levels in 12-24 hours, sustained for 2-4 weeks",
      duration: "Single injection provides coverage for 2-4 weeks"
    },
    specialGroups: {
      pregnancy: "Safe and preferred for syphilis treatment in pregnancy",
      breastfeeding: "Safe",
      children: "Safe for rheumatic fever prevention and syphilis",
      elderly: "Safe"
    }
  },

  "chloramphenicol": {
    whatItDoes: "Broad-spectrum antibiotic reserved for serious infections due to bone marrow toxicity risk. Excellent for meningitis, typhoid, and serious eye infections. Inhibits bacterial protein synthesis.",
    commonUses: [
      "Bacterial meningitis (when other antibiotics fail)",
      "Typhoid fever",
      "Severe rickettsial infections",
      "Brain abscess",
      "Bacterial conjunctivitis (eye drops/ointment)"
    ],
    importantSafety: {
      dos: ["Take on empty stomach 1 hour before meals", "Complete full course for systemic infections", "Monitor blood counts regularly", "Eye preparations are safer than oral/IV forms"],
      donts: ["Risk of serious bone marrow suppression", "Avoid prolonged or repeated use", "Do not use for minor infections", "Report unusual bruising, bleeding, or fatigue"]
    },
    howFastItWorks: {
      onset: "Eye infections: 1-2 days, Systemic: 2-3 days",
      duration: "Usually 7-10 days for eye infections, 14-21 days for systemic"
    },
    specialGroups: {
      pregnancy: "Avoid especially near term - risk of gray baby syndrome",
      breastfeeding: "Avoid - can cause bone marrow toxicity in infant",
      children: "Avoid in neonates - risk of gray baby syndrome, use cautiously in older children",
      elderly: "Use with caution - monitor blood counts"
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

  "artemether": {
    whatItDoes: "Injectable artemisinin derivative for severe malaria treatment. Oil-based intramuscular formulation provides rapid parasite clearance. Alternative to artesunate when IV access difficult.",
    commonUses: [
      "Severe malaria when IV access unavailable",
      "Cerebral malaria",
      "Life-threatening Plasmodium falciparum infection",
      "Severe malaria in remote settings",
      "Complicated malaria with multi-organ dysfunction"
    ],
    importantSafety: {
      dos: ["Give by deep intramuscular injection", "Initial dose: 3.2mg/kg, then 1.6mg/kg daily", "Switch to oral ACT when patient can swallow", "Continue for minimum 3 days"],
      donts: ["Artesunate IV preferred if available", "Do not give intravenously", "Monitor for delayed hemolytic anemia", "Report dark urine days after treatment"]
    },
    howFastItWorks: {
      onset: "Rapid parasite clearance within 12-24 hours",
      duration: "Minimum 3 days then switch to oral completion"
    },
    specialGroups: {
      pregnancy: "Safe for severe malaria - benefits outweigh risks",
      breastfeeding: "Safe",
      children: "Safe and effective in pediatric severe malaria",
      elderly: "Safe with appropriate dosing"
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

  "artesunate-mefloquine": {
    whatItDoes: "Artemisinin-based combination therapy (ACT) combining fast-acting artesunate with long-acting mefloquine. Alternative first-line treatment for uncomplicated falciparum malaria in areas where it remains effective.",
    commonUses: [
      "Uncomplicated Plasmodium falciparum malaria",
      "Malaria in areas with artemether-lumefantrine resistance",
      "Mixed Plasmodium species infections",
      "Multidrug-resistant malaria areas",
      "Treatment failure with other ACTs"
    ],
    importantSafety: {
      dos: ["Take once daily for 3 days", "Take with food or milk to improve absorption", "Complete full 3-day course", "Mefloquine component given on days 2-3 or day 2 only depending on protocol"],
      donts: ["Avoid if history of psychiatric disorders (mefloquine can cause neuropsychiatric effects)", "Do not use if seizure disorder", "Report vivid dreams, anxiety, or mood changes", "Avoid in first trimester if possible"]
    },
    howFastItWorks: {
      onset: "Fever reduction within 24-48 hours",
      duration: "3-day treatment course, mefloquine provides weeks of post-treatment prophylaxis"
    },
    specialGroups: {
      pregnancy: "Use in 2nd and 3rd trimester when benefits outweigh risks",
      breastfeeding: "Safe - small amounts in milk",
      children: "Safe from 5kg body weight",
      elderly: "Use with caution - monitor for neuropsychiatric effects"
    }
  },

  "artesunate-sp": {
    whatItDoes: "Artemisinin-based combination therapy combining artesunate with sulfadoxine-pyrimethamine (SP). Used where SP resistance is low. Provides rapid parasite clearance plus longer-acting partner drug.",
    commonUses: [
      "Uncomplicated falciparum malaria",
      "Areas with low SP resistance",
      "Alternative ACT when others unavailable",
      "Mixed Plasmodium infections",
      "Combination therapy for improved cure rates"
    ],
    importantSafety: {
      dos: ["Take artesunate daily for 3 days", "Take SP as single dose on day 1", "Complete full 3-day artesunate course", "Can take with or without food"],
      donts: ["Avoid if sulfa drug allergy", "Do not use in severe malaria (needs injectable)", "Report skin rash or blistering", "Avoid in late pregnancy near delivery"]
    },
    howFastItWorks: {
      onset: "Rapid fever reduction within 24-36 hours",
      duration: "3-day treatment, SP provides extended protection"
    },
    specialGroups: {
      pregnancy: "Use in 2nd and 3rd trimester, avoid near delivery",
      breastfeeding: "Safe - avoid if infant has jaundice or G6PD deficiency",
      children: "Safe from 6 months with appropriate dosing",
      elderly: "Safe with normal kidney/liver function"
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

  "metformin-extended-release": {
    whatItDoes: "Extended-release formulation of metformin providing once-daily dosing with improved GI tolerance. Slowly releases metformin over 24 hours, reducing stomach upset while maintaining blood sugar control throughout the day.",
    commonUses: [
      "Type 2 diabetes management",
      "Patients who cannot tolerate immediate-release metformin",
      "Improved medication compliance with once-daily dosing",
      "Polycystic ovary syndrome (PCOS)",
      "Diabetes prevention in high-risk individuals"
    ],
    importantSafety: {
      dos: ["Take once daily with evening meal for best tolerance", "Swallow tablets whole - do not crush, cut, or chew", "Start with low dose and increase gradually", "Continue diet and exercise program"],
      donts: ["May see ghost tablet in stool - this is normal empty shell", "Stop 48 hours before surgery or contrast imaging", "Avoid excessive alcohol consumption", "Report severe stomach pain, unusual fatigue, or breathing difficulty"]
    },
    howFastItWorks: {
      onset: "Blood sugar effects within days, full benefit in 2-4 weeks",
      duration: "Once-daily dosing provides 24-hour coverage"
    },
    specialGroups: {
      pregnancy: "Safe - often used for gestational diabetes",
      breastfeeding: "Safe",
      children: "Immediate-release usually preferred in children",
      elderly: "Safe - monitor kidney function closely"
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

  "aluminum-magnesium-hydroxide": {
    whatItDoes: "Antacid combining aluminum and magnesium hydroxides to neutralize stomach acid. Aluminum causes constipation while magnesium causes diarrhea - combination balances these effects for better tolerance.",
    commonUses: [
      "Heartburn and acid indigestion",
      "Gastroesophageal reflux disease (GERD)",
      "Stomach upset and hyperacidity",
      "Peptic ulcer disease (symptomatic relief)",
      "Prevention of stress ulcers"
    ],
    importantSafety: {
      dos: ["Take 1-3 hours after meals and at bedtime", "Shake liquid form well before use", "Can use as needed for symptom relief", "Chew tablets thoroughly before swallowing"],
      donts: ["Do not take within 2 hours of other medications (reduces absorption)", "Avoid prolonged use without medical supervision", "May cause constipation or diarrhea", "Not recommended with kidney disease"]
    },
    howFastItWorks: {
      onset: "Works within 5-15 minutes",
      duration: "Relief lasts 20-60 minutes when taken on empty stomach, 3 hours when taken after meals"
    },
    specialGroups: {
      pregnancy: "Safe for occasional use - preferred antacid in pregnancy",
      breastfeeding: "Safe - minimal systemic absorption",
      children: "Safe over 12 years, use caution in younger children",
      elderly: "Use with caution if kidney impairment - risk of aluminum accumulation"
    }
  },

  "dicyclomine": {
    whatItDoes: "Anticholinergic antispasmodic that reduces intestinal cramping and spasm. Relaxes smooth muscle in gastrointestinal tract to relieve abdominal pain and discomfort from IBS and intestinal disorders.",
    commonUses: [
      "Irritable bowel syndrome (IBS) with cramping",
      "Functional bowel disorders",
      "Abdominal cramping and pain",
      "Intestinal spasm",
      "Infant colic (in some countries, not recommended in others)"
    ],
    importantSafety: {
      dos: ["Take 30 minutes before meals", "Start with low dose and increase gradually", "Take with water", "May take up to 4 times daily"],
      donts: ["May cause dry mouth, blurred vision, and drowsiness", "Avoid in glaucoma or urinary retention", "Do not use in infants under 6 months", "Avoid driving if drowsy"]
    },
    howFastItWorks: {
      onset: "Relief within 30-60 minutes",
      duration: "4-6 hours per dose"
    },
    specialGroups: {
      pregnancy: "Use only if clearly needed - limited safety data",
      breastfeeding: "Use with caution - may reduce milk production",
      children: "Contraindicated under 6 months, use caution in older children",
      elderly: "Use low doses - increased risk of confusion and side effects"
    }
  },

  "domperidone": {
    whatItDoes: "Prokinetic and antiemetic medication that speeds gastric emptying and blocks dopamine receptors to reduce nausea and vomiting. Does not cross blood-brain barrier well, fewer neurological side effects than metoclopramide.",
    commonUses: [
      "Nausea and vomiting",
      "Gastric emptying disorders (gastroparesis)",
      "Functional dyspepsia",
      "Increasing breast milk production (off-label)",
      "GERD symptoms"
    ],
    importantSafety: {
      dos: ["Take 15-30 minutes before meals", "Maximum 30mg daily (10mg three times)", "Use lowest effective dose", "Short-term use preferred"],
      donts: ["May prolong heart rhythm (QT interval) - avoid in heart disease", "Do not exceed recommended dose", "Avoid with certain antifungals and antibiotics", "Report palpitations or fainting"]
    },
    howFastItWorks: {
      onset: "30-60 minutes for nausea relief",
      duration: "6-8 hours per dose"
    },
    specialGroups: {
      pregnancy: "Limited data - use only if needed",
      breastfeeding: "Safe - often used to increase milk supply",
      children: "Safe - commonly used for vomiting in children",
      elderly: "Use with caution - monitor for cardiac effects"
    }
  },

  "esomeprazole": {
    whatItDoes: "Proton pump inhibitor (S-isomer of omeprazole) that potently reduces stomach acid production. More effective acid suppression than omeprazole at equivalent doses. Heals erosive esophagitis and treats GERD.",
    commonUses: [
      "Gastroesophageal reflux disease (GERD)",
      "Erosive esophagitis",
      "H. pylori eradication (with antibiotics)",
      "Prevention of NSAID-induced ulcers",
      "Zollinger-Ellison syndrome"
    ],
    importantSafety: {
      dos: ["Take 1 hour before meals for best effect", "Swallow capsules whole, do not crush", "Can open capsule and sprinkle on applesauce if swallowing difficult", "Complete full course for ulcer healing"],
      donts: ["Long-term use may reduce magnesium and vitamin B12", "May increase risk of bone fractures with prolonged use", "Avoid with certain HIV medications", "Report persistent abdominal pain or bloody stools"]
    },
    howFastItWorks: {
      onset: "Acid suppression within 1-2 hours, full effect in 5 days",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Probably safe - use if benefit outweighs risk",
      breastfeeding: "Probably safe - minimal passage into milk",
      children: "Safe from 1 month for GERD",
      elderly: "Safe - no dose adjustment needed"
    }
  },

  "hyoscine-butylbromide": {
    whatItDoes: "Antispasmodic medication that relaxes smooth muscle in gastrointestinal and urinary tracts. Relieves cramping pain from IBS, menstruation, and urinary spasms. Does not cross blood-brain barrier.",
    commonUses: [
      "Irritable bowel syndrome cramping",
      "Abdominal colic and spasms",
      "Menstrual cramps",
      "Urinary bladder spasms",
      "Biliary and renal colic (adjunct treatment)"
    ],
    importantSafety: {
      dos: ["Take as needed for spasm relief", "Can take up to 4 times daily", "Works best when taken at onset of symptoms", "Available as tablets or injection"],
      donts: ["Avoid in glaucoma or urinary retention", "May cause dry mouth and constipation", "Do not use in intestinal obstruction", "Avoid if enlarged prostate with urinary symptoms"]
    },
    howFastItWorks: {
      onset: "Oral: 30-60 minutes, Injection: 10-15 minutes",
      duration: "4-6 hours per dose"
    },
    specialGroups: {
      pregnancy: "Use with caution - limited data but widely used",
      breastfeeding: "Probably safe - minimal systemic absorption",
      children: "Safe over 6 years",
      elderly: "Use with caution - watch for urinary retention and confusion"
    }
  },

  "lansoprazole": {
    whatItDoes: "Proton pump inhibitor that blocks acid production in stomach by inhibiting the proton pump in gastric parietal cells. Highly effective for acid-related disorders and ulcer healing.",
    commonUses: [
      "Gastroesophageal reflux disease (GERD)",
      "Peptic ulcer disease",
      "H. pylori eradication therapy",
      "NSAID-associated ulcer prevention",
      "Zollinger-Ellison syndrome"
    ],
    importantSafety: {
      dos: ["Take in morning before breakfast for best effect", "Swallow capsules whole or open and sprinkle on soft food", "Complete full course for ulcer healing", "Can use short-term for heartburn"],
      donts: ["Prolonged use may decrease magnesium and vitamin B12", "May mask symptoms of gastric cancer", "Increased infection risk with long-term use", "May interact with clopidogrel (Plavix)"]
    },
    howFastItWorks: {
      onset: "Acid suppression within 2 hours, maximum effect in 4 days",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Use only if needed - limited data",
      breastfeeding: "Use with caution - may pass into milk",
      children: "Safe from 1 year for GERD",
      elderly: "Safe - no dose adjustment needed"
    }
  },

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

  "pantoprazole": {
    whatItDoes: "Proton pump inhibitor that reduces gastric acid secretion by blocking the hydrogen-potassium pump in gastric parietal cells. Available in oral and IV forms for flexible treatment of acid-related disorders.",
    commonUses: [
      "Gastroesophageal reflux disease (GERD)",
      "Erosive esophagitis",
      "Zollinger-Ellison syndrome",
      "Prevention of stress ulcers (IV form)",
      "H. pylori eradication (combination therapy)"
    ],
    importantSafety: {
      dos: ["Take 30 minutes before first meal of day", "Swallow tablets whole, do not crush or chew", "IV form for patients unable to take oral medications", "Complete prescribed course for ulcer healing"],
      donts: ["Long-term use may reduce vitamin B12 and magnesium", "May increase fracture risk with prolonged use", "Avoid abrupt withdrawal after long-term use", "Report severe diarrhea that persists"]
    },
    howFastItWorks: {
      onset: "Acid suppression within 2.5 hours, maximum effect in 5 days",
      duration: "24 hours per dose"
    },
    specialGroups: {
      pregnancy: "Use only if clearly needed - limited human data",
      breastfeeding: "Use with caution - unknown if passes into milk",
      children: "Safe from 5 years for GERD",
      elderly: "Safe - no dose adjustment needed"
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

  "ascorbic-acid": {
    whatItDoes: "Vitamin C is essential water-soluble vitamin and powerful antioxidant. Critical for immune function, collagen synthesis, iron absorption, and wound healing. Cannot be stored in body so requires daily intake.",
    commonUses: [
      "Vitamin C deficiency and scurvy prevention",
      "Enhancement of iron absorption (taken with iron supplements)",
      "Immune system support during infections",
      "Wound healing",
      "Antioxidant supplementation"
    ],
    importantSafety: {
      dos: ["Take with food to reduce stomach upset", "Increases iron absorption when taken together", "Safe for long-term daily use", "Chewable tablets available for better compliance"],
      donts: ["Excess vitamin C may cause diarrhea and stomach cramps", "Doses above 2000mg daily not beneficial", "May increase kidney stone risk in susceptible individuals", "Generally very safe vitamin"]
    },
    howFastItWorks: {
      onset: "Immediate absorption, therapeutic effects develop over days to weeks",
      duration: "Excreted within hours - requires daily intake"
    },
    specialGroups: {
      pregnancy: "Safe and recommended - 85mg daily",
      breastfeeding: "Safe and recommended - 120mg daily",
      children: "Safe - age-appropriate dosing essential",
      elderly: "Safe - may have increased requirements"
    }
  },

  "calcium-gluconate": {
    whatItDoes: "Calcium supplement in readily absorbable form. Treats and prevents calcium deficiency, hypocalcemia, and related conditions. Injectable form used for urgent treatment of low calcium and magnesium toxicity.",
    commonUses: [
      "Hypocalcemia (low blood calcium)",
      "Calcium deficiency prevention",
      "Eclampsia and pre-eclampsia (IV form)",
      "Magnesium sulfate toxicity antidote",
      "Osteoporosis prevention"
    ],
    importantSafety: {
      dos: ["Oral: take with food for better absorption", "IV form must be given slowly to prevent cardiac complications", "Adequate vitamin D needed for calcium absorption", "Space from iron and certain antibiotics by 2 hours"],
      donts: ["Rapid IV injection can cause cardiac arrest", "May cause constipation with oral form", "Do not exceed recommended dose", "Monitor calcium levels with IV therapy"]
    },
    howFastItWorks: {
      onset: "IV: immediate for acute hypocalcemia, Oral: days to weeks",
      duration: "Oral: daily supplementation, IV: hours"
    },
    specialGroups: {
      pregnancy: "Safe and often needed especially for eclampsia prevention/treatment",
      breastfeeding: "Safe - calcium needs increased during lactation",
      children: "Safe - essential for bone development",
      elderly: "Safe and beneficial for bone health"
    }
  },

  "ferrous-fumarate": {
    whatItDoes: "Iron supplement containing 33% elemental iron (higher than ferrous sulfate). Treats and prevents iron deficiency anemia by providing iron needed for hemoglobin production. May cause less GI upset than ferrous sulfate.",
    commonUses: [
      "Iron deficiency anemia treatment",
      "Pregnancy iron supplementation",
      "Chronic blood loss (heavy periods, GI bleeding)",
      "Poor dietary iron intake",
      "Anemia of chronic disease"
    ],
    importantSafety: {
      dos: ["Take on empty stomach for best absorption (1 hour before meals)", "Take with vitamin C to enhance absorption", "Black stools are normal and expected", "Continue for 3-6 months to replenish iron stores"],
      donts: ["May cause constipation, nausea, and abdominal pain", "Take with food if GI upset occurs (reduces absorption)", "Space from tea, coffee, dairy, antacids by 2 hours", "Extremely dangerous in children if overdosed - keep locked away"]
    },
    howFastItWorks: {
      onset: "Hemoglobin increases in 2-4 weeks, symptoms improve gradually",
      duration: "Usually 3-6 months to fully replenish iron stores"
    },
    specialGroups: {
      pregnancy: "Safe and essential - recommended supplementation in 2nd and 3rd trimesters",
      breastfeeding: "Safe - needs may be increased",
      children: "Safe with proper dosing - liquid forms available, toxic in overdose",
      elderly: "Safe - may worsen constipation, consider with food"
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

  "multivitamin": {
    whatItDoes: "Combination supplement containing essential vitamins and minerals to prevent nutritional deficiencies. Provides broad nutritional insurance especially during illness, poor diet, pregnancy, or increased needs.",
    commonUses: [
      "Prevention of vitamin and mineral deficiencies",
      "Nutritional support during illness or recovery",
      "Pregnancy and lactation supplementation",
      "Poor dietary intake or malabsorption",
      "Elderly nutritional support"
    ],
    importantSafety: {
      dos: ["Take once daily with food for better absorption", "Choose pregnancy-specific formulation if pregnant", "Store in cool, dry place away from children", "Consistent daily use provides best benefit"],
      donts: ["More is not better - excess fat-soluble vitamins can be harmful", "Do not replace healthy balanced diet", "Iron in multivitamins may cause constipation", "Some may interact with medications - inform healthcare provider"]
    },
    howFastItWorks: {
      onset: "Immediate absorption, therapeutic benefits develop over weeks to months",
      duration: "Requires daily intake for sustained benefit"
    },
    specialGroups: {
      pregnancy: "Recommended - use prenatal formulation with folic acid and iron",
      breastfeeding: "Beneficial - needs are increased during lactation",
      children: "Safe with age-appropriate formulation and dosing",
      elderly: "Beneficial - may prevent deficiencies common in older adults"
    }
  },

  "zinc-sulfate": {
    whatItDoes: "Zinc supplement in sulfate form providing essential mineral for immune function, growth, and development. WHO recommended treatment for childhood diarrhea. Supports enzyme function and wound healing.",
    commonUses: [
      "Acute diarrhea in children (with ORS)",
      "Zinc deficiency treatment",
      "Growth retardation from zinc deficiency",
      "Immune system support",
      "Chronic diarrhea and malabsorption"
    ],
    importantSafety: {
      dos: ["Give 20mg daily for 10-14 days for diarrhea in children", "Take with food or juice to reduce stomach upset", "Continue full course even when diarrhea stops", "Dispersible tablets can be dissolved in water"],
      donts: ["May cause nausea and vomiting if taken on empty stomach", "Do not exceed recommended dose", "High doses can interfere with copper and iron absorption", "Not a substitute for ORS - use together"]
    },
    howFastItWorks: {
      onset: "Reduces diarrhea duration by 25% when started early",
      duration: "Give for 10-14 days regardless of diarrhea resolution"
    },
    specialGroups: {
      pregnancy: "Safe - increased requirements during pregnancy",
      breastfeeding: "Safe - passes into milk and important for infant",
      children: "Essential for diarrhea treatment - reduces severity and duration",
      elderly: "Safe - may have increased requirements"
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

  "theophylline": {
    whatItDoes: "Bronchodilator that relaxes airways in asthma and COPD by inhibiting phosphodiesterase and reducing airway inflammation. Long-acting formulation for maintenance therapy with narrow therapeutic index requiring careful dosing.",
    commonUses: [
      "Chronic asthma maintenance therapy",
      "COPD and chronic bronchitis",
      "Prevention of nocturnal asthma symptoms",
      "Apnea in premature infants",
      "Severe asthma requiring additional controller medication"
    ],
    importantSafety: {
      dos: ["Take at same time daily for steady blood levels", "Take extended-release tablets whole, do not crush", "Regular blood level monitoring essential", "Take with food if stomach upset occurs"],
      donts: ["Avoid smoking as it increases drug clearance", "Limit caffeine intake (similar effects)", "Do not suddenly stop medication", "Report nausea, vomiting, rapid heartbeat or seizures immediately"]
    },
    howFastItWorks: {
      onset: "Extended-release: 4-8 hours, Immediate-release: 1-2 hours",
      duration: "Extended-release: 12-24 hours, Immediate-release: 6-8 hours"
    },
    specialGroups: {
      pregnancy: "Use with caution - monitor levels closely as clearance increases",
      breastfeeding: "Use with caution - passes into milk, may cause irritability in infant",
      children: "Safe with careful weight-based dosing and monitoring",
      elderly: "Reduce dose - slower metabolism requires lower doses and close monitoring"
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

  "atropine": {
    whatItDoes: "Anticholinergic medication that blocks acetylcholine receptors. Increases heart rate, dilates pupils, dries secretions. Life-saving in organophosphate poisoning and during resuscitation for bradycardia.",
    commonUses: [
      "Organophosphate poisoning antidote",
      "Severe bradycardia during resuscitation",
      "Pre-operative medication to reduce secretions",
      "Eye dilation for examination (ophthalmologic use)",
      "Reversal of nerve agent poisoning"
    ],
    importantSafety: {
      dos: ["Give IV in emergencies - rapid onset needed", "Repeat doses may be needed for severe poisoning", "Monitor heart rate and pupil size", "Store in emergency medications"],
      donts: ["Causes dilated pupils, blurred vision, dry mouth", "May cause confusion especially in elderly", "Avoid in glaucoma (eye drops)", "Can cause urinary retention"]
    },
    howFastItWorks: {
      onset: "IV: 1-2 minutes, IM: 10-15 minutes, Eye drops: 30-40 minutes",
      duration: "IV/IM: 4 hours, Eye dilation: 7-14 days"
    },
    specialGroups: {
      pregnancy: "Safe when needed for life-threatening conditions",
      breastfeeding: "Safe for occasional use",
      children: "Safe - carefully dose by weight",
      elderly: "Use with caution - increased risk of confusion and urinary retention"
    }
  },

  "levothyroxine": {
    whatItDoes: "Synthetic thyroid hormone (T4) used to treat hypothyroidism (underactive thyroid). Replaces missing thyroid hormone to restore normal metabolism, energy, and bodily functions. Lifelong treatment for most patients.",
    commonUses: [
      "Hypothyroidism (underactive thyroid)",
      "Hashimoto's thyroiditis",
      "Post-thyroidectomy hormone replacement",
      "Thyroid suppression in thyroid cancer",
      "Congenital hypothyroidism in newborns"
    ],
    importantSafety: {
      dos: ["Take on empty stomach 30-60 minutes before breakfast", "Take at same time daily", "Wait 4 hours before calcium, iron, or antacids", "Regular thyroid function monitoring every 6-12 months"],
      donts: ["Do not stop suddenly", "Many medications interfere with absorption", "May take weeks to feel full effect", "Report chest pain, palpitations, or rapid weight loss"]
    },
    howFastItWorks: {
      onset: "Initial effects in 3-5 days, full effect in 4-6 weeks",
      duration: "Requires daily lifelong replacement"
    },
    specialGroups: {
      pregnancy: "Essential to continue - increased dose often needed",
      breastfeeding: "Safe and important to continue",
      children: "Critical for normal growth and development",
      elderly: "Start with lower doses, increase gradually"
    }
  },

  "lidocaine-with-epinephrine": {
    whatItDoes: "Local anesthetic lidocaine combined with epinephrine (adrenaline). Lidocaine numbs area while epinephrine constricts blood vessels to prolong anesthesia and reduce bleeding. Standard for minor surgery and dental procedures.",
    commonUses: [
      "Local anesthesia for minor surgical procedures",
      "Dental procedures and tooth extractions",
      "Wound repair and suturing",
      "Skin lesion removal",
      "Nerve blocks for regional anesthesia"
    ],
    importantSafety: {
      dos: ["Inject slowly to reduce pain and detect intravascular injection", "Wait 5-10 minutes for full anesthetic effect", "Use appropriate concentration (typically 1% or 2% lidocaine)", "Aspirate before injecting to avoid blood vessels"],
      donts: ["Never use on fingers, toes, penis, nose, or ears (epinephrine causes ischemia)", "Avoid if patient has cardiac arrhythmias", "Do not exceed maximum safe dose (7mg/kg with epi)", "Not for IV regional anesthesia"]
    },
    howFastItWorks: {
      onset: "2-5 minutes for full anesthesia",
      duration: "1.5-3 hours (longer than plain lidocaine)"
    },
    specialGroups: {
      pregnancy: "Safe for local procedures - preferred local anesthetic",
      breastfeeding: "Safe",
      children: "Safe - calculate maximum dose carefully by weight",
      elderly: "Safe - may use reduced doses"
    }
  },

  "lorazepam": {
    whatItDoes: "Intermediate-acting benzodiazepine used for anxiety, agitation, and seizures. More potent than diazepam for seizure control. Causes sedation and amnesia. Risk of dependence with prolonged use.",
    commonUses: [
      "Status epilepticus (prolonged seizures)",
      "Severe anxiety and panic attacks",
      "Pre-operative sedation",
      "Agitation in psychiatric emergencies",
      "Alcohol withdrawal seizures"
    ],
    importantSafety: {
      dos: ["Use lowest effective dose for shortest time", "Can give IV, IM, or orally", "Excellent for seizure control when IV access available", "Monitor breathing and consciousness"],
      donts: ["Risk of respiratory depression especially with other sedatives", "High risk of dependence - avoid long-term use", "Causes drowsiness and impaired coordination", "Do not stop suddenly after prolonged use (taper)"]
    },
    howFastItWorks: {
      onset: "IV: 1-5 minutes, IM: 15-30 minutes, Oral: 20-30 minutes",
      duration: "6-8 hours per dose"
    },
    specialGroups: {
      pregnancy: "Avoid if possible - use only for seizure emergencies",
      breastfeeding: "Avoid - causes sedation in infant",
      children: "Safe for seizure emergencies - careful dosing",
      elderly: "Use very low doses - high risk of falls, confusion, and paradoxical agitation"
    }
  },

  "magnesium-sulfate": {
    whatItDoes: "Essential mineral used as anticonvulsant in eclampsia and pre-eclampsia. Also treats severe asthma, prevents preterm birth, and replaces magnesium deficiency. Life-saving in obstetric emergencies.",
    commonUses: [
      "Eclampsia and severe pre-eclampsia treatment and prevention",
      "Tocolysis (preventing preterm labor)",
      "Severe asthma exacerbation (IV)",
      "Hypomagnesemia (low magnesium)",
      "Cardiac arrhythmias from magnesium deficiency"
    ],
    importantSafety: {
      dos: ["Loading dose 4-6g IV over 15-20 minutes, then 1-2g/hour infusion", "Monitor reflexes, respirations, and urine output hourly", "Have calcium gluconate available as antidote", "Continue for 24 hours after delivery or last seizure"],
      donts: ["Overdose causes respiratory depression and cardiac arrest", "Stop if respirations <12/min or loss of reflexes", "Reduce dose if kidney impairment", "Report muscle weakness or difficulty breathing"]
    },
    howFastItWorks: {
      onset: "Immediate when given IV, seizure control within minutes",
      duration: "Therapeutic levels maintained during continuous infusion"
    },
    specialGroups: {
      pregnancy: "Safe and essential for eclampsia - drug of choice",
      breastfeeding: "Safe",
      children: "Safe for specific indications like severe asthma",
      elderly: "Use with caution - reduce dose if kidney problems"
    }
  },

  "methylprednisolone": {
    whatItDoes: "Potent corticosteroid with strong anti-inflammatory and immunosuppressive effects. Available in high-dose IV form for severe conditions. More potent than prednisolone, less than dexamethasone.",
    commonUses: [
      "Severe asthma exacerbations",
      "Spinal cord injury (within 8 hours)",
      "Severe allergic reactions",
      "Multiple sclerosis relapses",
      "Severe COVID-19 (alternative to dexamethasone)"
    ],
    importantSafety: {
      dos: ["High-dose IV pulses for acute severe conditions", "Oral form for maintenance therapy", "Taper dose when discontinuing after prolonged use", "Monitor blood sugar and blood pressure"],
      donts: ["Raises blood sugar significantly", "Suppresses immune system", "May cause psychiatric effects at high doses", "Long-term use causes osteoporosis and weight gain"]
    },
    howFastItWorks: {
      onset: "IV: Within hours, Oral: 1-2 hours",
      duration: "12-36 hours depending on dose"
    },
    specialGroups: {
      pregnancy: "Use when benefits outweigh risks",
      breastfeeding: "Safe for short courses - may reduce milk supply temporarily",
      children: "Safe for acute use - monitor growth with prolonged use",
      elderly: "Increased side effects including diabetes, osteoporosis, and infections"
    }
  },

  "midazolam": {
    whatItDoes: "Short-acting benzodiazepine used for sedation, seizure control, and anesthesia. Causes amnesia and sedation. Rapid onset and offset make it ideal for procedures. Buccal form excellent for seizures in children.",
    commonUses: [
      "Procedural sedation (endoscopy, minor surgery)",
      "Seizure control especially in children (buccal/intranasal)",
      "Induction and maintenance of anesthesia",
      "ICU sedation for ventilated patients",
      "Status epilepticus when IV access available"
    ],
    importantSafety: {
      dos: ["Have reversal agent (flumazenil) and resuscitation equipment available", "Monitor oxygen saturation and breathing", "Buccal form easy for caregivers to give during seizures", "Titrate IV dose carefully to effect"],
      donts: ["Risk of respiratory depression - ensure monitoring", "Avoid in patients with severe respiratory disease", "Do not drive or operate machinery after use", "Paradoxical agitation possible especially in children"]
    },
    howFastItWorks: {
      onset: "IV: 1-3 minutes, IM: 5-15 minutes, Buccal/Intranasal: 5-10 minutes",
      duration: "15-30 minutes (IV), 1-2 hours (IM/buccal)"
    },
    specialGroups: {
      pregnancy: "Avoid if possible - use only when necessary",
      breastfeeding: "Avoid for 4 hours after dose if possible",
      children: "Safe and effective - buccal form excellent for seizures",
      elderly: "Use reduced doses - increased sensitivity and risk of respiratory depression"
    }
  },

  "dextrose-saline": {
    whatItDoes: "Intravenous fluid combining glucose (dextrose) and sodium chloride. Provides calories, hydration, and electrolytes simultaneously. Common formulations include 5% dextrose in 0.45% saline (D5½NS) or 0.9% saline (D5NS).",
    commonUses: [
      "Maintenance IV fluids in hospitalized patients",
      "Hypoglycemia prevention during IV therapy",
      "Dehydration with low blood sugar",
      "Post-operative fluid replacement",
      "Fluid and electrolyte maintenance"
    ],
    importantSafety: {
      dos: ["Appropriate for most general maintenance needs", "Monitor blood sugar levels in diabetics", "Adjust rate based on patient needs and losses", "More physiologic than pure saline for maintenance"],
      donts: ["Not for resuscitation - use crystalloid or blood products", "Risk of hyperglycemia in diabetics", "May cause hyponatremia with excessive use", "Monitor for fluid overload in cardiac/renal patients"]
    },
    howFastItWorks: {
      onset: "Immediate plasma expansion and glucose availability",
      duration: "Continuous infusion as needed"
    },
    specialGroups: {
      pregnancy: "Safe for IV hydration",
      breastfeeding: "Safe",
      children: "Safe - commonly used for pediatric maintenance fluids",
      elderly: "Safe - monitor for fluid overload"
    }
  },

  "potassium-chloride": {
    whatItDoes: "Essential electrolyte supplement used to treat and prevent low potassium (hypokalemia). Critical for heart function, muscle contraction, and nerve transmission. IV form requires careful administration to avoid cardiac arrest.",
    commonUses: [
      "Hypokalemia (low potassium) from diuretics, vomiting, diarrhea",
      "Prevention of low potassium in high-risk patients",
      "Diabetic ketoacidosis treatment",
      "Renal tubular acidosis",
      "IV fluids supplementation"
    ],
    importantSafety: {
      dos: ["Oral: take with meals and full glass of water", "IV: Must dilute and give slowly (max 10-20 mEq/hour peripheral line)", "Monitor potassium levels and EKG", "Take slow-release tablets whole - do not crush"],
      donts: ["Never give IV potassium as bolus - causes immediate cardiac arrest", "Do not give if kidney failure without monitoring", "Oral forms may cause GI upset and ulceration", "Report muscle weakness, palpitations, or tingling"]
    },
    howFastItWorks: {
      onset: "Oral: absorbed over hours, IV: immediate effect",
      duration: "Requires ongoing supplementation if losses continue"
    },
    specialGroups: {
      pregnancy: "Safe when needed for documented hypokalemia",
      breastfeeding: "Safe",
      children: "Safe - dose carefully by weight",
      elderly: "Use with caution - kidney function may be reduced"
    }
  },

  "ringer's-lactate": {
    whatItDoes: "Crystalloid intravenous fluid solution containing sodium, potassium, calcium, chloride, and lactate. Closely resembles blood plasma electrolyte composition. Ideal for resuscitation and replacement of fluid losses.",
    commonUses: [
      "Hypovolemic shock and trauma resuscitation",
      "Surgical fluid replacement",
      "Burn resuscitation",
      "Dehydration requiring IV fluids",
      "Diabetic ketoacidosis (along with normal saline)"
    ],
    importantSafety: {
      dos: ["Rapid infusion safe in hemorrhagic shock", "Warm fluids for massive transfusion to prevent hypothermia", "Monitor for fluid overload in cardiac/renal patients", "Excellent for most resuscitation scenarios"],
      donts: ["Avoid in severe liver failure (cannot metabolize lactate)", "Use with caution if hyperkalemia (contains potassium)", "May cause metabolic alkalosis with large volumes", "Contains calcium - do not mix with blood products in same line"]
    },
    howFastItWorks: {
      onset: "Immediate plasma expansion",
      duration: "Redistributes to interstitial space over 30-60 minutes"
    },
    specialGroups: {
      pregnancy: "Safe - commonly used in labor and delivery",
      breastfeeding: "Safe",
      children: "Safe and preferred for pediatric resuscitation",
      elderly: "Safe - monitor for fluid overload"
    }
  },

  "sodium-chloride": {
    whatItDoes: "Normal saline (0.9% sodium chloride) is isotonic IV fluid used for hydration, resuscitation, and as medication diluent. Most commonly used IV fluid worldwide. Also available as concentrated form for severe hyponatremia.",
    commonUses: [
      "Hypovolemia and dehydration",
      "Resuscitation in shock",
      "IV medication dilution and flushing",
      "Diabetic ketoacidosis initial fluid",
      "Severe hyponatremia (hypertonic 3% saline)"
    ],
    importantSafety: {
      dos: ["Safe for most indications", "Monitor for fluid overload", "0.9% is isotonic and safe for most uses", "3% hypertonic saline only in ICU with monitoring"],
      donts: ["Large volumes may cause hyperchloremic acidosis", "Avoid as sole fluid in children (use balanced solutions)", "Monitor sodium levels with large volumes", "Hypertonic saline can cause rapid sodium rise - dangerous"]
    },
    howFastItWorks: {
      onset: "Immediate plasma expansion",
      duration: "Redistributes over 30-60 minutes"
    },
    specialGroups: {
      pregnancy: "Safe",
      breastfeeding: "Safe",
      children: "Safe but balanced solutions often preferred",
      elderly: "Safe - monitor for fluid overload"
    }
  },

  "various": {
    whatItDoes: "Generic cough syrup containing combination of expectorant, cough suppressant, and sometimes antihistamine. Helps relieve cough and cold symptoms. Multiple formulations available with different active ingredients.",
    commonUses: [
      "Dry, irritating cough",
      "Productive cough with chest congestion",
      "Cold and flu symptoms",
      "Post-nasal drip cough",
      "Temporary cough relief"
    ],
    importantSafety: {
      dos: ["Check ingredients - avoid duplicating medications", "Follow age-appropriate dosing", "Take with water", "May help cough to allow sleep"],
      donts: ["Not recommended under 2 years", "Do not combine with other cold medications", "Avoid if contains codeine in children", "Many contain sugar - caution in diabetes"]
    },
    howFastItWorks: {
      onset: "30-60 minutes for cough suppression",
      duration: "4-6 hours depending on formulation"
    },
    specialGroups: {
      pregnancy: "Check specific ingredients - many are safe",
      breastfeeding: "Check ingredients - avoid if contains sedating antihistamines",
      children: "Not under 2 years, careful dosing 2-6 years",
      elderly: "Safe - check for drug interactions"
    }
  },

  "warfarin": {
    whatItDoes: "Oral anticoagulant (blood thinner) that prevents blood clot formation by blocking vitamin K. Requires regular monitoring with INR blood tests. Used for atrial fibrillation, mechanical heart valves, and clot prevention.",
    commonUses: [
      "Atrial fibrillation (prevent stroke)",
      "Mechanical heart valve anticoagulation",
      "Deep vein thrombosis (DVT) and pulmonary embolism treatment/prevention",
      "After heart attack in selected patients",
      "Recurrent blood clots"
    ],
    importantSafety: {
      dos: ["Take at same time daily (usually evening)", "Regular INR monitoring every 1-4 weeks", "Consistent vitamin K intake in diet", "Inform all healthcare providers and dentists"],
      donts: ["Narrow therapeutic window - bleeding risk if too high", "Many drug and food interactions", "Avoid activities with high injury risk", "Report any unusual bleeding or bruising immediately"]
    },
    howFastItWorks: {
      onset: "Full anticoagulant effect in 3-5 days",
      duration: "Effects persist 2-5 days after stopping"
    },
    specialGroups: {
      pregnancy: "Contraindicated - causes fetal abnormalities (use heparin instead)",
      breastfeeding: "Safe - minimal passage into milk",
      children: "Difficult to manage - requires expert monitoring",
      elderly: "Higher bleeding risk - often use lower doses"
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

  "bcg-vaccine": {
    whatItDoes: "Live attenuated vaccine against tuberculosis. Given at birth as single intradermal injection in left upper arm. Provides protection against severe forms of TB especially TB meningitis in children.",
    commonUses: [
      "Prevention of tuberculosis in infants",
      "Protection against severe TB and TB meningitis",
      "Routine immunization in TB-endemic areas",
      "Given at birth or first contact with health services",
      "Part of WHO Expanded Programme on Immunization"
    ],
    importantSafety: {
      dos: ["Give single intradermal injection in left upper arm", "Forms small ulcer then scar - this is normal", "No need for repeated doses", "Administer to all infants in TB-endemic areas"],
      donts: ["Do not give to immunocompromised infants (HIV with symptoms)", "Do not massage injection site", "Local ulceration and scarring are expected", "Do not give if active TB or severe skin infection at site"]
    },
    howFastItWorks: {
      onset: "Immunity develops over 6-8 weeks",
      duration: "Protection lasts 10-15 years, most important in early childhood"
    },
    specialGroups: {
      pregnancy: "Not applicable - infant vaccine",
      breastfeeding: "Safe for breastfed infants",
      children: "Recommended at birth in TB-endemic areas",
      elderly: "Not applicable"
    }
  },

  "hepatitis-b-vaccine": {
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

  "measles-vaccine": {
    whatItDoes: "Live attenuated vaccine preventing measles - a highly contagious viral illness causing fever, rash, and potentially fatal complications. One of most effective vaccines available with dramatic reduction in child mortality.",
    commonUses: [
      "Routine childhood immunization at 9 months and 18 months",
      "Prevention of measles outbreaks",
      "Part of MMR (measles-mumps-rubella) vaccine in some countries",
      "Mass vaccination campaigns",
      "Post-exposure prophylaxis within 72 hours"
    ],
    importantSafety: {
      dos: ["Give first dose at 9 months in endemic areas", "Second dose at 18 months for optimal protection", "Administer subcutaneously", "Can give during minor illness"],
      donts: ["Do not give if severely immunocompromised (symptomatic HIV)", "Temporary mild fever and rash may occur (7-10 days after)", "Do not give if severe egg allergy (rare concern)", "Postpone if moderate to severe illness"]
    },
    howFastItWorks: {
      onset: "Immunity develops within 2 weeks",
      duration: "Usually lifelong after 2 doses"
    },
    specialGroups: {
      pregnancy: "Contraindicated - avoid pregnancy for 1 month after vaccination",
      breastfeeding: "Safe for breastfed infants to receive vaccine",
      children: "Essential childhood vaccine - prevents serious complications",
      elderly: "Not routinely given - most already immune"
    }
  },

  "oral-polio-vaccine": {
    whatItDoes: "Live attenuated oral vaccine preventing poliomyelitis. Administered as drops by mouth. Provides intestinal immunity and population-level protection through virus shedding. Key to global polio eradication efforts.",
    commonUses: [
      "Routine childhood immunization",
      "Polio eradication campaigns",
      "Prevention of paralytic poliomyelitis",
      "Mass immunization during outbreaks",
      "Primary series and booster doses"
    ],
    importantSafety: {
      dos: ["Give 2 drops by mouth at 6, 10, and 14 weeks plus birth dose", "No injection needed - oral administration", "Safe to give with other vaccines", "Additional doses during campaigns are beneficial"],
      donts: ["Do not give to severely immunocompromised children", "Rare risk of vaccine-associated paralytic polio (extremely rare)", "If child vomits within 5-10 minutes, give another dose", "Not for adults in polio-free areas"]
    },
    howFastItWorks: {
      onset: "Immunity develops after 2-3 doses",
      duration: "Long-lasting protection, boosters enhance immunity"
    },
    specialGroups: {
      pregnancy: "Generally avoid, but can give during outbreak",
      breastfeeding: "Safe for infant to receive - breastfeeding does not interfere",
      children: "Essential for routine immunization starting at birth",
      elderly: "Not routinely needed in adults"
    }
  },

  "pentavalent-vaccine": {
    whatItDoes: "Combination vaccine protecting against five diseases: diphtheria, tetanus, pertussis (whooping cough), hepatitis B, and Haemophilus influenzae type b (Hib). Reduces number of injections needed for infant immunization.",
    commonUses: [
      "Routine infant immunization at 6, 10, and 14 weeks",
      "Prevention of five major childhood diseases",
      "Part of WHO Expanded Programme on Immunization",
      "Reduces injection burden on infants",
      "Primary immunization series"
    ],
    importantSafety: {
      dos: ["Give intramuscularly at 6, 10, and 14 weeks of age", "Administer in anterolateral thigh in infants", "Can give simultaneously with other vaccines", "Complete all 3 doses for optimal protection"],
      donts: ["Mild fever and irritability common after vaccination", "Local swelling and tenderness at injection site expected", "Severe allergic reaction to previous dose is contraindication", "Do not postpone for minor illness"]
    },
    howFastItWorks: {
      onset: "Protection develops after 2-3 doses",
      duration: "Requires boosters - DTP boosters at 18 months and 5 years"
    },
    specialGroups: {
      pregnancy: "Not applicable - infant vaccine",
      breastfeeding: "Safe for breastfed infants",
      children: "Essential part of routine infant immunization",
      elderly: "Not applicable"
    }
  },

  "rabies-vaccine": {
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

  "tetanus-toxoid": {
    whatItDoes: "Vaccine preventing tetanus (lockjaw) by stimulating antibody production against tetanus toxin. Given to pregnant women to protect mother and baby from neonatal tetanus. Essential after contaminated wounds to prevent fatal muscle spasms.",
    commonUses: [
      "Prevention of maternal and neonatal tetanus",
      "Wound prophylaxis after contaminated injuries",
      "Primary immunization series in children",
      "Booster doses every 10 years",
      "Part of antenatal care in pregnancy"
    ],
    importantSafety: {
      dos: ["Give at least 2 doses 4 weeks apart during pregnancy", "Additional dose after dirty wounds if >5 years since last dose", "Safe in all trimesters of pregnancy", "Protects newborn from neonatal tetanus"],
      donts: ["Pain and swelling at injection site is common", "Previous severe allergic reaction is contraindication", "Low risk of side effects - very safe vaccine", "Fever and malaise may occur but uncommon"]
    },
    howFastItWorks: {
      onset: "Protection after 2 doses (at least 80% protection)",
      duration: "Boosters recommended every 10 years or after high-risk wounds"
    },
    specialGroups: {
      pregnancy: "Safe and essential - recommended for all pregnant women",
      breastfeeding: "Safe",
      children: "Part of routine immunization (in pentavalent vaccine)",
      elderly: "Safe and important for wound prophylaxis"
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

  // ==================== FLUOROQUINOLONES ====================

  "levofloxacin": {
    whatItDoes: "Levofloxacin is a powerful fluoroquinolone antibiotic that kills bacteria by blocking their DNA replication. Effective against respiratory, urinary, skin, and sinus infections caused by susceptible bacteria.",
    commonUses: [
      "Pneumonia and respiratory tract infections",
      "Urinary tract infections (UTIs)",
      "Skin and soft tissue infections",
      "Sinusitis and chronic bronchitis",
      "Prostatitis in men"
    ],
    importantSafety: {
      dos: ["Take once daily with plenty of water", "Can take with or without food", "Complete full course even if feeling better", "Drink extra fluids while taking"],
      donts: ["Avoid direct sunlight - may cause severe sunburn", "Do not take antacids or vitamins with iron/zinc within 2 hours", "May cause tendon rupture - stop if joint pain occurs", "Not for children under 18 (damages growing bones)"]
    },
    howFastItWorks: {
      onset: "Symptom improvement in 1-3 days",
      duration: "Usually 5-14 days treatment depending on infection"
    },
    specialGroups: {
      pregnancy: "Avoid - may harm fetal bone development",
      breastfeeding: "Avoid - passes into breast milk",
      children: "Not recommended under 18 - can damage growing bones and joints",
      elderly: "Use with caution - increased risk of tendon problems"
    }
  },

  "ofloxacin": {
    whatItDoes: "Ofloxacin is a fluoroquinolone antibiotic effective against many types of bacteria. Works by stopping bacterial DNA replication. Used for urinary, respiratory, eye, and ear infections.",
    commonUses: [
      "Urinary tract infections",
      "Respiratory infections",
      "Sexually transmitted infections (gonorrhea, chlamydia)",
      "Skin and soft tissue infections",
      "Ear infections (when used as ear drops)"
    ],
    importantSafety: {
      dos: ["Take twice daily 12 hours apart", "Take with full glass of water", "Finish all medicine even if feeling better", "Can take with or without food"],
      donts: ["Avoid excessive sun exposure", "Do not take dairy products or antacids within 2 hours", "Stop if tendon pain or swelling occurs", "Not for children (damages growing cartilage)"]
    },
    howFastItWorks: {
      onset: "Improvement in 1-2 days",
      duration: "Usually 7-10 days treatment"
    },
    specialGroups: {
      pregnancy: "Avoid - may harm developing baby",
      breastfeeding: "Avoid - passes into breast milk",
      children: "Not recommended - can damage growing bones",
      elderly: "Use cautiously - higher risk of side effects"
    }
  },

  "norfloxacin": {
    whatItDoes: "Norfloxacin is a fluoroquinolone antibiotic specifically concentrated in urine, making it excellent for urinary tract infections. Also effective for gastrointestinal and prostate infections.",
    commonUses: [
      "Urinary tract infections (UTIs)",
      "Bacterial gastroenteritis and travelers' diarrhea",
      "Prostatitis",
      "Gonorrhea (uncomplicated)",
      "Prevention of infection in neutropenic patients"
    ],
    importantSafety: {
      dos: ["Take on empty stomach 1 hour before or 2 hours after meals", "Take with full glass of water", "Drink plenty of fluids throughout the day", "Complete full course"],
      donts: ["Avoid dairy products, antacids, vitamins with minerals within 2 hours", "Avoid excessive sunlight", "Do not take if history of tendon problems", "Not for children under 18"]
    },
    howFastItWorks: {
      onset: "UTI symptoms improve in 1-2 days",
      duration: "Usually 3-7 days for UTI, longer for other infections"
    },
    specialGroups: {
      pregnancy: "Avoid - may damage fetal bones",
      breastfeeding: "Avoid - passes into milk",
      children: "Contraindicated - damages growing cartilage",
      elderly: "Use with caution - monitor kidney function"
    }
  },

  // ==================== MACROLIDES ====================

  "clarithromycin": {
    whatItDoes: "Clarithromycin is a macrolide antibiotic that stops bacterial growth. Excellent for respiratory infections and often used to treat H. pylori stomach ulcers in combination therapy. Better tolerated than older macrolides.",
    commonUses: [
      "Pneumonia and bronchitis",
      "Sinusitis and pharyngitis",
      "Skin and soft tissue infections",
      "H. pylori eradication (with other drugs for ulcers)",
      "Mycobacterial infections in HIV patients"
    ],
    importantSafety: {
      dos: ["Take twice daily with food to reduce stomach upset", "Complete full course", "Good alternative for penicillin-allergic patients", "Can take extended-release version once daily"],
      donts: ["Do not take with certain heart medications", "May cause bitter taste", "Avoid if history of heart rhythm problems", "Do not combine with certain cholesterol drugs"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-14 days depending on infection"
    },
    specialGroups: {
      pregnancy: "Use only if clearly needed - limited safety data",
      breastfeeding: "Use with caution - small amounts in milk",
      children: "Safe - commonly used for ear and throat infections",
      elderly: "Safe - monitor for drug interactions"
    }
  },

  "erythromycin": {
    whatItDoes: "Erythromycin is a macrolide antibiotic that prevents bacterial protein synthesis. Good alternative for penicillin-allergic patients. Used for respiratory, skin infections, and as a gut motility agent.",
    commonUses: [
      "Respiratory tract infections (pneumonia, bronchitis)",
      "Skin infections (acne, cellulitis)",
      "Whooping cough (pertussis)",
      "Chlamydia and mycoplasma infections",
      "Gastric motility (helps stomach empty)"
    ],
    importantSafety: {
      dos: ["Take on empty stomach 1 hour before or 2 hours after meals", "Take with full glass of water", "Complete full course", "Good for penicillin-allergic patients"],
      donts: ["May cause stomach upset and nausea", "Do not crush enteric-coated tablets", "Avoid certain heart medications", "May interact with many drugs"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-14 days for infections"
    },
    specialGroups: {
      pregnancy: "Generally safe - preferred macrolide in pregnancy",
      breastfeeding: "Safe - small amounts in milk",
      children: "Safe - commonly used",
      elderly: "Safe but watch for drug interactions"
    }
  },

  // ==================== OTHER ANTIBIOTICS ====================

  "gentian-violet": {
    whatItDoes: "Topical antiseptic dye with antifungal and antibacterial properties. Used primarily for oral thrush in infants and superficial skin infections. Stains tissues purple but highly effective.",
    commonUses: [
      "Oral thrush (candidiasis) in infants",
      "Candida diaper rash",
      "Superficial skin infections",
      "Minor cuts and abrasions",
      "Fungal skin infections"
    ],
    importantSafety: {
      dos: ["Apply to affected area once or twice daily", "Use 0.5-1% solution for oral thrush", "Staining is normal and temporary", "Effective and inexpensive treatment"],
      donts: ["Will stain skin, clothing, and surfaces purple", "Do not swallow large amounts", "Avoid use on large open wounds", "Do not use near eyes"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days for thrush",
      duration: "Usually 3-7 days treatment"
    },
    specialGroups: {
      pregnancy: "Safe for external use",
      breastfeeding: "Safe - commonly used for nipple thrush",
      children: "Safe - widely used for infant thrush",
      elderly: "Safe"
    }
  },

  "meropenem": {
    whatItDoes: "Ultra-broad-spectrum carbapenem antibiotic reserved for severe, life-threatening infections or multidrug-resistant bacteria. Injectable medication effective against nearly all bacteria including those resistant to other antibiotics.",
    commonUses: [
      "Complicated intra-abdominal infections",
      "Severe hospital-acquired pneumonia",
      "Bacterial meningitis",
      "Septicemia from multidrug-resistant organisms",
      "Febrile neutropenia in cancer patients"
    ],
    importantSafety: {
      dos: ["Given only by intravenous infusion", "Infuse over 15-30 minutes for best tolerance", "Monitor for seizures especially with CNS infections", "Reserve for serious infections to prevent resistance"],
      donts: ["Risk of seizures especially in CNS infections or renal impairment", "Do not use for minor infections", "Report any seizure activity immediately", "May cause severe diarrhea including C. difficile"]
    },
    howFastItWorks: {
      onset: "Rapid bactericidal effect within hours",
      duration: "Usually given every 8 hours for 7-14 days or longer"
    },
    specialGroups: {
      pregnancy: "Use only if clearly needed - limited safety data",
      breastfeeding: "Use with caution - limited data",
      children: "Safe including neonates - dose by weight",
      elderly: "Safe - adjust dose for kidney function"
    }
  },

  "nitrofurantoin": {
    whatItDoes: "Nitrofurantoin is a specialized antibiotic that concentrates in urine, making it highly effective for urinary tract infections. Works by damaging bacterial DNA and proteins.",
    commonUses: [
      "Uncomplicated urinary tract infections (UTIs)",
      "Prevention of recurrent UTIs",
      "Acute cystitis in women",
      "Long-term UTI prevention in susceptible patients"
    ],
    importantSafety: {
      dos: ["Take with food or milk to improve absorption", "Drink plenty of fluids", "Complete full course even if symptoms improve", "Urine may turn dark yellow or brown (normal)"],
      donts: ["Do not use if kidney disease (doesn't work)", "May cause nausea - take with food", "Rare lung problems with long-term use", "Not for kidney infections (pyelonephritis)"]
    },
    howFastItWorks: {
      onset: "UTI symptoms improve in 1-2 days",
      duration: "Usually 5-7 days for treatment, months for prevention"
    },
    specialGroups: {
      pregnancy: "Safe in early pregnancy, avoid near delivery (may cause infant anemia)",
      breastfeeding: "Avoid in first month, safe after if baby healthy",
      children: "Safe over 1 month old for UTI treatment",
      elderly: "Use with caution - check kidney function first"
    }
  },

  "cephalexin": {
    whatItDoes: "Cephalexin is a first-generation cephalosporin antibiotic that kills bacteria by disrupting cell wall formation. Safe and effective for skin, bone, respiratory and urinary infections.",
    commonUses: [
      "Skin and soft tissue infections (cellulitis, abscesses)",
      "Bone infections (osteomyelitis)",
      "Respiratory tract infections",
      "Urinary tract infections",
      "Otitis media (ear infections)"
    ],
    importantSafety: {
      dos: ["Take 4 times daily (every 6 hours) for best results", "Can take with or without food", "Complete full course", "Safe for most patients including pregnant women"],
      donts: ["Use caution if penicillin allergy (10% cross-reaction)", "May cause diarrhea", "Rare allergic reactions possible", "Store liquid in refrigerator"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-14 days depending on infection"
    },
    specialGroups: {
      pregnancy: "Safe - commonly used in pregnancy",
      breastfeeding: "Safe - minimal amounts in milk",
      children: "Safe - commonly used for ear and skin infections",
      elderly: "Safe - adjust dose if kidney problems"
    }
  },

  "penicillin-g": {
    whatItDoes: "Crystalline penicillin given by injection for serious streptococcal and other bacterial infections. Narrow spectrum antibiotic highly effective against susceptible organisms including syphilis and meningococcal disease.",
    commonUses: [
      "Severe streptococcal infections",
      "Neurosyphilis and congenital syphilis",
      "Meningococcal meningitis",
      "Gas gangrene and clostridial infections",
      "Severe pneumococcal infections"
    ],
    importantSafety: {
      dos: ["Given only by injection (IM or IV)", "Administer every 4-6 hours for most infections", "Test for penicillin allergy before first dose", "Ensure adequate hydration"],
      donts: ["Never give benzathine form intravenously", "Do not use if penicillin allergy", "Watch for allergic reactions during administration", "Aqueous form must be given frequently"]
    },
    howFastItWorks: {
      onset: "Rapid onset within 30 minutes of injection",
      duration: "Short duration - requires dosing every 4-6 hours"
    },
    specialGroups: {
      pregnancy: "Safe - drug of choice for syphilis in pregnancy",
      breastfeeding: "Safe",
      children: "Safe including neonates",
      elderly: "Safe - adjust for kidney function"
    }
  },

  "tetracycline": {
    whatItDoes: "Broad-spectrum antibiotic that inhibits bacterial protein synthesis. Effective against many bacteria, rickettsiae, and some parasites. Used for respiratory, skin, and sexually transmitted infections.",
    commonUses: [
      "Acne and rosacea",
      "Respiratory tract infections",
      "Chlamydia and other STIs",
      "Rickettsial infections (typhus, Rocky Mountain spotted fever)",
      "H. pylori eradication in ulcer treatment"
    ],
    importantSafety: {
      dos: ["Take on empty stomach 1 hour before or 2 hours after meals", "Take with full glass of water", "Remain upright for 30 minutes after dose", "Protect skin from sun exposure"],
      donts: ["Do not take with dairy products, antacids, or iron supplements", "Avoid in pregnancy and children under 8 (tooth staining)", "Do not lie down immediately after taking", "May cause photosensitivity - use sunscreen"]
    },
    howFastItWorks: {
      onset: "Improvement in acne: 6-8 weeks, Infections: 2-3 days",
      duration: "Infections: 7-14 days, Acne: several months"
    },
    specialGroups: {
      pregnancy: "Contraindicated - causes permanent tooth discoloration in fetus",
      breastfeeding: "Avoid - may affect infant bone and tooth development",
      children: "Contraindicated under 8 years - permanent tooth staining",
      elderly: "Safe - ensure adequate fluid intake"
    }
  },

  "tranexamic-acid": {
    whatItDoes: "Antifibrinolytic medication that prevents excessive bleeding by stabilizing blood clots. Reduces blood loss in surgery, trauma, heavy menstrual bleeding, and postpartum hemorrhage.",
    commonUses: [
      "Postpartum hemorrhage treatment and prevention",
      "Heavy menstrual bleeding (menorrhagia)",
      "Trauma-related bleeding",
      "Surgical bleeding reduction",
      "Bleeding in hemophilia patients"
    ],
    importantSafety: {
      dos: ["Administer IV slowly over 10 minutes for hemorrhage", "Oral: take 3-4 times daily for menstrual bleeding", "Most effective when given within 3 hours of bleeding onset", "Safe and life-saving medication"],
      donts: ["Do not use if history of blood clots or stroke", "Avoid in patients with kidney failure without dose adjustment", "May cause nausea if given IV too rapidly", "Not for patients with active clotting disorders"]
    },
    howFastItWorks: {
      onset: "IV: within 15-30 minutes, Oral: 2-3 hours",
      duration: "Effects last 6-8 hours per dose"
    },
    specialGroups: {
      pregnancy: "Safe - WHO essential medicine for postpartum hemorrhage",
      breastfeeding: "Safe - minimal passage into milk",
      children: "Safe for bleeding disorders and trauma",
      elderly: "Safe - adjust dose if kidney impairment"
    }
  },

  "vancomycin": {
    whatItDoes: "Reserved antibiotic for serious gram-positive infections including MRSA. Given IV for bloodstream infections or orally for severe C. difficile colitis. Last-line antibiotic requiring monitoring.",
    commonUses: [
      "MRSA infections (skin, bone, bloodstream)",
      "Bacterial endocarditis",
      "Severe C. difficile colitis (oral form)",
      "Meningitis from resistant organisms",
      "Sepsis from gram-positive bacteria"
    ],
    importantSafety: {
      dos: ["Given by slow IV infusion over at least 60 minutes", "Monitor blood levels for optimal dosing", "Requires kidney function monitoring", "Oral form only for intestinal infections"],
      donts: ["Rapid infusion causes red man syndrome (flushing, rash)", "May damage hearing and kidneys", "Report ringing in ears or decreased urine", "Do not use oral form for bloodstream infections"]
    },
    howFastItWorks: {
      onset: "IV: Hours for bactericidal effect, Oral: 1-2 days for C. diff",
      duration: "Usually 7-14 days or longer for severe infections"
    },
    specialGroups: {
      pregnancy: "Use only if no alternative - potential hearing toxicity to fetus",
      breastfeeding: "Probably safe - poor oral absorption in infant",
      children: "Safe with careful monitoring - dose by weight",
      elderly: "High risk group - monitor kidney function and levels closely"
    }
  },

  "clindamycin": {
    whatItDoes: "Clindamycin is a lincosamide antibiotic effective against anaerobic bacteria and many skin bacteria. Excellent for skin, bone, dental, and abdominal infections. Good alternative for penicillin-allergic patients.",
    commonUses: [
      "Skin and soft tissue infections (MRSA, cellulitis)",
      "Bone and joint infections",
      "Dental and periodontal infections",
      "Intra-abdominal infections (with other antibiotics)",
      "Bacterial vaginosis"
    ],
    importantSafety: {
      dos: ["Take with full glass of water", "Can take with or without food", "Complete full course", "Good for penicillin-allergic patients"],
      donts: ["May cause severe diarrhea (C. difficile colitis) - report immediately", "Do not lie down for 30 minutes after taking", "Stop if severe diarrhea develops", "May cause metallic taste"]
    },
    howFastItWorks: {
      onset: "Improvement in 2-3 days",
      duration: "Usually 7-10 days"
    },
    specialGroups: {
      pregnancy: "Generally safe - use if benefit outweighs risk",
      breastfeeding: "Use with caution - monitor infant for diarrhea",
      children: "Safe - commonly used for skin and bone infections",
      elderly: "Safe but higher risk of C. difficile diarrhea"
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
