# Clinical Alerts & Safety Suite - Visual Guide

This guide provides visual examples of how each feature appears in the user interface.

## 🚨 Critical Lab Value Alerts

### Feature Overview
When a lab technician enters a critical value (like dangerously low hemoglobin), the system automatically detects it and displays an alert.

### Example 1: Critical Hemoglobin Alert

**Scenario:** Lab technician enters Hemoglobin value of 6.5 g/dL (severe anemia)

**UI Display:**
```
┌────────────────────────────────────────────────────────────────┐
│ 🚨 CRITICAL VALUE DETECTED                                     │
│                                                                 │
│ Hemoglobin: 6.5 g/dL (below 7 g/dL)                           │
│ Normal: 13-17 (M), 12-16 (F)                                  │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Action Required:                                          │  │
│ │ Severe anemia - Consider blood transfusion.              │  │
│ │ Investigate cause (malaria, bleeding, nutritional)       │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ [Acknowledge & Continue]                                       │
└────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Red background, bold text, pulsing border

**Field Indicator:**
```
Hemoglobin [ 6.5 ] [🔴 CRITICAL]
```

### Example 2: Warning Level WBC Alert

**Scenario:** Lab technician enters WBC of 12.5 ×10³/µL (elevated but not critical)

**UI Display:**
```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️ Abnormal Value                                              │
│                                                                 │
│ WBC: 12.5 ×10³/µL (above 11 ×10³/µL)                          │
│ Normal: 4-11 ×10³/µL                                           │
│                                                                 │
│ Leukocytosis - Investigate infection/inflammation             │
│                                                                 │
│ [Acknowledge & Continue]                                       │
└────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Orange background, moderate emphasis

---

## 💊 Smart Medication Dosage Calculator

### Feature Overview
When a doctor selects a medication and the patient's weight is recorded, the system automatically calculates the appropriate dose.

### Example 1: Pediatric Paracetamol

**Scenario:** 5-year-old child, 18 kg, needs paracetamol for fever

**UI Display:**
```
┌────────────────────────────────────────────────────────────────┐
│ 💊 Smart Dosage Calculator                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Age: 5 years    Weight: 18 kg    Allergies: None              │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ ✅ Paracetamol: 270mg per dose                           │  │
│ │ Calculation: 18kg × 15mg/kg = 270mg                      │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ 📋 Prescription Instructions:                                  │
│ Give: Paracetamol Suspension 120mg/5ml                        │
│ Dose: 11.25ml every 6 hours                                   │
│      (270mg ÷ 120mg/5ml = 11.25ml)                            │
│                                                                 │
│ Instructions: Shake well before use                            │
│                                                                 │
│ ⚠️ Warnings:                                                   │
│ • Do not exceed maximum daily dose                            │
│ • Avoid alcohol                                               │
│ Maximum daily dose: 4000mg/day                                │
└────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Blue border, green success indicators

### Example 2: Malaria Treatment (Weight-Based)

**Scenario:** Child, 20 kg, diagnosed with uncomplicated malaria

**UI Display:**
```
┌────────────────────────────────────────────────────────────────┐
│ 💊 Smart Dosage Calculator                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Age: 6 years    Weight: 20 kg    Allergies: None              │
│                                                                 │
│ ✅ Artemether-Lumefantrine (AL, Coartem): 2 tablets per dose  │
│                                                                 │
│ 📋 Prescription Instructions:                                  │
│ Give: AL Tablet 20mg/120mg                                    │
│ Dose: 2 tablets at 0, 8, 24, 36, 48, 60 hours (6 doses)      │
│                                                                 │
│ Instructions: Take with fatty food/milk for better absorption │
│                                                                 │
│ ⚠️ Warnings:                                                   │
│ • Complete all 6 doses                                        │
│ • Take with food                                              │
│ • Avoid grapefruit juice                                      │
└────────────────────────────────────────────────────────────────┘
```

### Example 3: Contraindication Alert

**Scenario:** Patient with documented penicillin allergy, doctor selects Amoxicillin

**UI Display:**
```
┌────────────────────────────────────────────────────────────────┐
│ 💊 Smart Dosage Calculator                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Age: 35 years   Weight: 65 kg   Allergies: Penicillin ⚠️      │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ ⚠️ CONTRAINDICATION ALERT                                 │  │
│ │                                                           │  │
│ │ Patient has documented allergy to Amoxicillin or         │  │
│ │ related medications.                                      │  │
│ │                                                           │  │
│ │ Contraindications: Penicillin allergy                    │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Red background, animated pulse, critical priority

---

## ⚠️ Drug Interaction Checker

### Feature Overview
When prescribing multiple medications, the system checks for harmful interactions.

### Example 1: Critical Interaction - Malaria Drugs

**Scenario:** Doctor tries to prescribe both AL (Artemether-Lumefantrine) and Quinine

**UI Display:**
```
┌────────────────────────────────────────────────────────────────┐
│ 🚫 CRITICAL DRUG INTERACTION DETECTED                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Interaction:                                                    │
│ Artemether-Lumefantrine + Quinine                             │
│                                                                 │
│ Effect:                                                         │
│ ⚡ Cardiotoxicity - Both prolong QT interval, risk of fatal    │
│    arrhythmias                                                 │
│                                                                 │
│ Mechanism: Both prolong QT interval, risk of fatal arrhythmias│
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ ✅ Management:                                            │  │
│ │ NEVER combine these medications. Use Artemether-         │  │
│ │ Lumefantrine OR Quinine for malaria, not both.           │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Reference: WHO Malaria Guidelines                              │
│                                                                 │
│ [Remove Conflicting Medication]  [Override (with reason)]     │
└────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Red border, animated pulse, blocking action required

### Example 2: Major Interaction - Anticoagulant

**Scenario:** Patient on Warfarin, doctor prescribes Ciprofloxacin

**UI Display:**
```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️ MAJOR Drug Interaction Warning                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Interaction:                                                    │
│ Warfarin + Ciprofloxacin                                      │
│                                                                 │
│ Effect:                                                         │
│ Increased risk of bleeding                                     │
│                                                                 │
│ Mechanism: Ciprofloxacin inhibits warfarin metabolism,        │
│           increasing INR                                        │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ ✅ Management:                                            │  │
│ │ Monitor INR closely. Consider dose reduction or           │  │
│ │ alternative antibiotic (Amoxicillin)                      │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Reference: BMJ 2008                                            │
│                                                                 │
│ [Remove Conflicting Medication]  [Override (with reason)]     │
└────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Orange border, high priority

### Example 3: Moderate Interaction - NSAIDs

**Scenario:** Patient on low-dose Aspirin, doctor prescribes Ibuprofen

**UI Display:**
```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️ Drug Interaction Warning                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Aspirin + Ibuprofen: Reduced cardioprotective effect          │
│                                                                 │
│ Management: Take aspirin 2 hours before ibuprofen, or use     │
│            paracetamol instead                                 │
│                                                                 │
│ [Acknowledge & Continue]                                       │
└────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Yellow border, moderate priority

---

## 🎨 Visual Design Elements

### Color Coding

**Critical Alerts:**
- Background: Red (#FEF2F2)
- Border: Dark Red (#DC2626)
- Text: Dark Red (#991B1B)
- Icon: Red Alert Triangle (pulsing animation)

**Major Warnings:**
- Background: Orange (#FFF7ED)
- Border: Orange (#F97316)
- Text: Dark Orange (#9A3412)
- Icon: Orange Alert Triangle

**Moderate Warnings:**
- Background: Yellow (#FEFCE8)
- Border: Yellow (#EAB308)
- Text: Dark Yellow (#854D0E)
- Icon: Yellow Alert Circle

**Success/Calculated:**
- Background: Green (#F0FDF4)
- Border: Green (#22C55E)
- Text: Dark Green (#166534)
- Icon: Green Check Circle

**Information:**
- Background: Blue (#EFF6FF)
- Border: Blue (#3B82F6)
- Text: Dark Blue (#1E40AF)
- Icon: Blue Information Circle

### Typography

**Alert Headers:**
- Font: Bold
- Size: 18px (1.125rem)
- Emoji prefix for quick recognition

**Values:**
- Font: Bold
- Size: 16-18px
- Highlighted in alert color

**Actions/Management:**
- Font: Medium
- Size: 14-16px
- Clear, directive language

**References:**
- Font: Regular
- Size: 12px
- Muted color for secondary information

### Animations

**Critical Alerts:**
- Pulse animation on border (1s cycle)
- Appears with slide-down effect
- Attention-grabbing but not distracting

**Field Indicators:**
- Fade-in effect when alert triggered
- Pulse on critical values
- Static on warnings

---

## 📱 Mobile Responsiveness

All alerts and calculators are fully responsive:

- Stack vertically on small screens
- Touch-friendly button sizes (minimum 44px height)
- Readable text sizes (minimum 14px)
- Proper spacing for touch targets
- Scrollable content areas

---

## 🎯 User Workflow Examples

### Lab Technician Workflow:

1. Open pending lab test
2. Enter CBC results field by field
3. When entering Hemoglobin: 6.8 g/dL
4. **Alert appears immediately** (no delay)
5. Technician reads action: "Severe anemia - Consider transfusion"
6. Technician clicks "Acknowledge"
7. Alert remains visible but allows proceeding
8. Complete other results
9. Save test - all acknowledged

### Doctor Workflow:

1. Select patient from queue
2. Record weight: 18 kg
3. Enter vital signs
4. Navigate to Medications tab
5. Search and select "Paracetamol"
6. **Dosage calculator appears automatically**
7. Review calculated dose: 270mg (11.25ml)
8. Click "Add Medication"
9. Select "Amoxicillin" for infection
10. **No interaction alert** (safe combination)
11. Add to order
12. Try to add "Artemether-Lumefantrine"
13. **Interaction alert appears** (redundant with Amoxicillin)
14. Remove conflicting medication
15. Submit prescription to pharmacy

---

## 💡 Tips for Users

**Lab Technicians:**
- Enter values carefully - system will alert if critical
- Don't ignore alerts - they indicate serious conditions
- Acknowledge after reading the recommendation
- Inform the requesting doctor about critical values

**Doctors:**
- Always record patient weight for accurate dosing
- Review dosage calculator suggestions but use clinical judgment
- Pay attention to interaction alerts - they prevent errors
- Override only when clinically justified with documentation

**Pharmacists:**
- Double-check calculated doses match what's dispensed
- Educate patients on proper administration
- Flag any dosing concerns to prescribing doctor
- Monitor for adverse reactions

---

## ✅ Testing Checklist

Use these test cases to verify the system works correctly:

### Lab Alerts:
- [ ] Enter Hemoglobin 6.0 g/dL → Critical alert appears
- [ ] Enter WBC 2.0 ×10³/µL → Critical alert (leukopenia)
- [ ] Enter Glucose 500 mg/dL → Critical alert (hyperglycemia)
- [ ] Enter normal Hemoglobin 14.0 g/dL → No alert
- [ ] Acknowledge alert → Alert clears, can proceed

### Dosage Calculator:
- [ ] Enter weight 20kg, select Paracetamol → Shows 300mg dose
- [ ] Enter weight 15kg, select AL → Shows 1 tablet per dose
- [ ] Patient with penicillin allergy + Amoxicillin → Contraindication alert
- [ ] Adult patient → Shows standard adult dosing

### Drug Interactions:
- [ ] Add AL then Quinine → Critical interaction blocked
- [ ] Add Warfarin then Ciprofloxacin → Major interaction warning
- [ ] Add Aspirin then Ibuprofen → Moderate interaction info
- [ ] Add Paracetamol then Amoxicillin → No interaction (safe)

---

**Last Updated:** January 15, 2026
**Version:** 1.0
**Status:** Production Ready
