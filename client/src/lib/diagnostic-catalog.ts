/**
 * Shared Diagnostic Test Catalog
 * 
 * This module provides a centralized catalog of all diagnostic tests available in the clinic.
 * It ensures consistency between Treatment page ordering and department pages (Lab, X-Ray, Ultrasound).
 * 
 * Usage:
 * - Import LAB_TEST_CATALOG for laboratory test categories and tests
 * - Import XRAY_EXAM_TYPES for X-Ray examination types and body parts
 * - Import ULTRASOUND_EXAM_TYPES for Ultrasound examination types and specific exams
 */

/* ===================================================================
 * LABORATORY TEST CATALOG
 * Aligned with database schema categories:
 * "blood", "urine", "stool", "microbiology", "chemistry", "hormonal", "other"
 * =================================================================== */

export const LAB_TEST_CATALOG = {
  blood: [
    "Blood Film for Malaria (BFFM)",
    "Complete Blood Count (CBC)",
    "Hemoglobin (HB)",
    "Total White Blood Count (TWBC)",
    "Blood Group & Rh",
    "ESR (Erythrocyte Sedimentation Rate)",
    "Rheumatoid Factor",
    "Widal Test (Typhoid)",
    "Brucella Test (B.A.T)",
    "Hepatitis B Test (HBsAg)",
    "Hepatitis C Test (HCV)",
    "H. Pylori Test",
    "VDRL Test (Syphilis)",
  ],
  hormonal: [
    "Pregnancy Test (HCG)",
    "Gonorrhea Test",
    "Chlamydia Test",
    "Reproductive Hormones",
    "Thyroid Hormones",
    "Cardiac & Other Markers",
  ],
  microbiology: [
    "Toxoplasma Test",
    "Filariasis Tests",
    "Schistosomiasis Test",
    "Leishmaniasis Test",
    "Tuberculosis Tests",
    "Meningitis Tests",
    "Yellow Fever Test",
    "Typhus Test",
  ],
  urine: [
    "Urine Analysis",
    "Urine Microscopy",
  ],
  chemistry: [
    "Renal Function Test (RFT)",
    "Liver Function Test (LFT)",
    "Random Blood Sugar (RBS)",
    "Fasting Blood Sugar (FBS)",
  ],
  stool: [
    "Stool Examination",
  ],
  other: [
    "Custom Test",
  ],
} as const;

export type LabTestCategory = keyof typeof LAB_TEST_CATALOG;

/* ===================================================================
 * X-RAY EXAMINATION CATALOG
 * =================================================================== */

export const XRAY_EXAM_TYPES = [
  { value: 'chest', label: 'Chest X-Ray', icon: '🫁', description: 'Thoracic imaging' },
  { value: 'extremities', label: 'Extremity', icon: '🦴', description: 'Arms, legs, joints' },
  { value: 'abdomen', label: 'Abdominal', icon: '🫄', description: 'Abdomen & pelvis' },
  { value: 'spine', label: 'Spine', icon: '🦴', description: 'Cervical to lumbar' },
  { value: 'skull', label: 'Skull/Head', icon: '💀', description: 'Cranial imaging' },
  { value: 'pelvis', label: 'Pelvic', icon: '🦴', description: 'Hip & pelvis' },
] as const;

export const XRAY_BODY_PARTS = {
  extremities: [
    'Hand', 'Wrist', 'Forearm', 'Elbow', 'Humerus', 'Shoulder',
    'Foot', 'Ankle', 'Tibia/Fibula', 'Knee', 'Femur', 'Hip'
  ],
  spine: [
    'Cervical spine', 'Thoracic spine', 'Lumbar spine', 'Sacrum/Coccyx'
  ],
  chest: [
    'Chest PA & Lateral', 'Chest AP', 'Ribs'
  ],
  abdomen: [
    'Abdomen (KUB)', 'Abdomen (Upright)'
  ],
  skull: [
    'Skull', 'Facial bones', 'Mandible', 'Sinuses'
  ],
  pelvis: [
    'Pelvis AP', 'Hip'
  ],
} as const;

export const XRAY_PRESETS = [
  { 
    name: 'Trauma Screen', 
    icon: '🚑',
    examType: 'extremities' as const,
    bodyPart: 'Multiple',
    indication: 'Suspected fracture or dislocation following trauma'
  },
  { 
    name: 'Respiratory Assessment', 
    icon: '🫁',
    examType: 'chest' as const,
    bodyPart: 'Chest PA & Lateral',
    indication: 'Evaluation of cough, dyspnea, or suspected pneumonia'
  },
  { 
    name: 'Back Pain Evaluation', 
    icon: '🦴',
    examType: 'spine' as const,
    bodyPart: 'Lumbar spine',
    indication: 'Chronic or acute lower back pain assessment'
  },
  { 
    name: 'Post-Operative Check', 
    icon: '✅',
    examType: 'chest' as const,
    bodyPart: 'Chest AP',
    indication: 'Post-operative monitoring'
  },
] as const;

export type XrayExamType = typeof XRAY_EXAM_TYPES[number]['value'];

/* ===================================================================
 * ULTRASOUND EXAMINATION CATALOG
 * =================================================================== */

export const ULTRASOUND_EXAM_TYPES = [
  { value: 'abdominal', label: 'Abdominal', icon: '🫄', description: 'Liver, gallbladder, kidneys, spleen' },
  { value: 'obstetric', label: 'Obstetric', icon: '🤰', description: 'Pregnancy & fetal assessment' },
  { value: 'pelvic', label: 'Pelvic', icon: '🩻', description: 'Uterus, ovaries, bladder' },
  { value: 'cardiac', label: 'Cardiac (Echo)', icon: '❤️', description: 'Heart structure & function' },
  { value: 'renal', label: 'Renal', icon: '🫘', description: 'Kidneys & urinary tract' },
  { value: 'thyroid', label: 'Thyroid', icon: '🦴', description: 'Thyroid gland assessment' },
  { value: 'breast', label: 'Breast', icon: '🩺', description: 'Breast tissue evaluation' },
  { value: 'musculoskeletal', label: 'Musculoskeletal', icon: '🦴', description: 'Joints, tendons, soft tissue' },
  { value: 'vascular', label: 'Vascular (Doppler)', icon: '🩸', description: 'Blood vessel assessment' },
  { value: 'soft_tissue', label: 'Soft Tissue', icon: '🔬', description: 'Superficial masses & lesions' },
  { value: 'scrotal', label: 'Scrotal', icon: '🔵', description: 'Testicular assessment' },
  { value: 'neck', label: 'Neck', icon: '🦴', description: 'Neck masses & lymph nodes' },
] as const;

export const ULTRASOUND_SPECIFIC_EXAMS = {
  abdominal: [
    'Complete Abdominal Scan',
    'Liver & Gallbladder',
    'Kidneys & Urinary Tract',
    'Spleen Assessment',
    'Pancreas Evaluation',
    'Abdominal Aorta',
    'Ascites Assessment',
  ],
  obstetric: [
    'First Trimester (Dating)',
    'Second Trimester Anatomy Scan',
    'Third Trimester Growth Scan',
    'Biophysical Profile',
    'Cervical Length',
    'Placental Location',
    'Multiple Gestation',
  ],
  pelvic: [
    'Transvaginal Scan',
    'Transabdominal Pelvic',
    'Uterine Fibroids',
    'Ovarian Cysts',
    'Endometrial Assessment',
    'IUD Localization',
  ],
  cardiac: [
    'Transthoracic Echo (TTE)',
    'Limited Echo (FOCUS)',
    'Stress Echo',
    'Valve Assessment',
    'Pericardial Effusion',
  ],
  renal: [
    'Bilateral Kidney Scan',
    'Hydronephrosis Assessment',
    'Renal Stone Detection',
    'Bladder Volume',
    'Post-Void Residual',
  ],
  thyroid: [
    'Thyroid Gland Scan',
    'Thyroid Nodule Assessment',
    'Parathyroid Scan',
  ],
  breast: [
    'Bilateral Breast Scan',
    'Targeted Breast Mass',
    'Axillary Lymph Nodes',
  ],
  musculoskeletal: [
    'Shoulder (Rotator Cuff)',
    'Knee Joint',
    'Achilles Tendon',
    'Hip Joint',
    'Elbow',
    'Ankle',
    'Soft Tissue Mass',
  ],
  vascular: [
    'Carotid Doppler',
    'Lower Extremity DVT',
    'Upper Extremity DVT',
    'Renal Artery Doppler',
    'AV Fistula Assessment',
    'Venous Insufficiency',
  ],
  soft_tissue: [
    'Superficial Mass',
    'Abscess Evaluation',
    'Foreign Body Detection',
    'Lipoma Assessment',
  ],
  scrotal: [
    'Testicular Scan',
    'Epididymitis Assessment',
    'Varicocele Detection',
    'Hydrocele Assessment',
  ],
  neck: [
    'Neck Mass Evaluation',
    'Lymph Node Assessment',
    'Salivary Gland Scan',
  ],
} as const;

export const ULTRASOUND_PRESETS = [
  { 
    name: 'Right Upper Quadrant Pain', 
    icon: '🫄',
    examType: 'abdominal' as const,
    specificExam: 'Liver & Gallbladder',
    indication: 'Evaluation for cholelithiasis, cholecystitis, or hepatobiliary disease'
  },
  { 
    name: 'Pregnancy Confirmation', 
    icon: '🤰',
    examType: 'obstetric' as const,
    specificExam: 'First Trimester (Dating)',
    indication: 'Confirm intrauterine pregnancy, assess gestational age and viability'
  },
  { 
    name: 'Renal Colic / Kidney Stone', 
    icon: '🫘',
    examType: 'renal' as const,
    specificExam: 'Renal Stone Detection',
    indication: 'Evaluate for nephrolithiasis and hydronephrosis'
  },
  { 
    name: 'Suspected DVT', 
    icon: '🩸',
    examType: 'vascular' as const,
    specificExam: 'Lower Extremity DVT',
    indication: 'Rule out deep vein thrombosis'
  },
  { 
    name: 'Pelvic Pain (Female)', 
    icon: '🩻',
    examType: 'pelvic' as const,
    specificExam: 'Transabdominal Pelvic',
    indication: 'Evaluate uterus, ovaries, and adnexa for pathology'
  },
  { 
    name: 'Cardiac Assessment', 
    icon: '❤️',
    examType: 'cardiac' as const,
    specificExam: 'Transthoracic Echo (TTE)',
    indication: 'Assess cardiac function, valves, and pericardium'
  },
] as const;

export type UltrasoundExamType = typeof ULTRASOUND_EXAM_TYPES[number]['value'];

/* ===================================================================
 * HELPER FUNCTIONS
 * =================================================================== */

/**
 * Get human-readable label for lab category
 */
export function getLabCategoryLabel(category: LabTestCategory): string {
  const labels: Record<LabTestCategory, string> = {
    blood: 'Blood Tests',
    hormonal: 'Hormonal Tests',
    microbiology: 'Microbiology',
    urine: 'Urine Tests',
    chemistry: 'Chemistry/Biochemistry',
    stool: 'Stool Tests',
    other: 'Other Tests',
  };
  return labels[category] || category;
}

/**
 * Get human-readable label for X-Ray exam type
 */
export function getXrayExamLabel(examType: string): string {
  const exam = XRAY_EXAM_TYPES.find(e => e.value === examType);
  return exam?.label || examType;
}

/**
 * Get human-readable label for Ultrasound exam type
 */
export function getUltrasoundExamLabel(examType: string): string {
  const exam = ULTRASOUND_EXAM_TYPES.find(e => e.value === examType);
  return exam?.label || examType;
}
