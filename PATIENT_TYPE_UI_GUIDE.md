# Patient Type Feature - UI Changes Guide

## 1. Patient Registration Form

### Before (All patients were regular)
```
┌─────────────────────────────────────────┐
│  New Patient Registration              │
├─────────────────────────────────────────┤
│  First Name: [____________]             │
│  Last Name:  [____________]             │
│  Age:        [____________]             │
│  Gender:     [▼ Select  ]              │
│  Phone:      [____________]             │
│  Allergies:  [____________]             │
│  History:    [____________]             │
│                                         │
│  ┌───────────────────────────┐         │
│  │ ☑ Collect consultation fee│         │
│  │   (5,000 SSP)              │         │
│  │ Consultation Type:         │         │
│  │ [General Consultation ▼]   │         │
│  └───────────────────────────┘         │
│                                         │
│  [Register Patient]  [Cancel]          │
└─────────────────────────────────────────┘
```

### After (With patient type selection)
```
┌─────────────────────────────────────────┐
│  New Patient Registration              │
├─────────────────────────────────────────┤
│  First Name: [____________]             │
│  Last Name:  [____________]             │
│  Age:        [____________]             │
│  Gender:     [▼ Select  ]              │
│  Phone:      [____________]             │
│  Allergies:  [____________]             │
│  History:    [____________]             │
│                                         │
│  ┌────── Patient Type ──────┐          │
│  │ ⚪ Regular Patient        │          │
│  │    Full clinic workflow   │          │
│  │    with consultation      │          │
│  │                           │          │
│  │ ⚪ External Referral       │          │
│  │    (Diagnostics Only)     │          │
│  │    For patients from      │          │
│  │    other clinics          │          │
│  └───────────────────────────┘          │
│                                         │
│  ┌─ Consultation Fee (Regular only) ─┐ │
│  │ ☑ Collect consultation fee        │ │
│  │   Consultation Type:               │ │
│  │   [General Consultation ▼]         │ │
│  └────────────────────────────────────┘ │
│                                         │
│  [Register Patient]  [Cancel]          │
└─────────────────────────────────────────┘

When "External Referral" selected:
┌─────────────────────────────────────────┐
│  ┌────── Patient Type ──────┐          │
│  │ ⚪ Regular Patient        │          │
│  │                           │          │
│  │ ⚫ External Referral       │ ← Selected
│  │    (Diagnostics Only)     │          │
│  └───────────────────────────┘          │
│                                         │
│  ⚠️ Note: This patient will NOT        │
│     appear in Doctor's Treatment queue │
│     and will NOT be charged a          │
│     consultation fee. Use "Order       │
│     Referral Diagnostic" to order      │
│     tests for this patient.            │
│                                         │
│  [Consultation fee section HIDDEN]     │
│                                         │
│  [Register Patient]  [Cancel]          │
└─────────────────────────────────────────┘
```

## 2. Laboratory Page (Pending Tests)

### Before
```
┌────────────────────────────────────────────┐
│  Pending Tests (5)                         │
├────────────────────────────────────────────┤
│  John Doe               [P-0123]  3 tests  │
│  CBC, Malaria, Urinalysis                  │
│  [Ordered by Doctor] [Pending]             │
├────────────────────────────────────────────┤
```

### After (with External Referral)
```
┌────────────────────────────────────────────┐
│  Pending Tests (5)                         │
├────────────────────────────────────────────┤
│  John Doe [P-0123] [External Referral] 3   │
│                     ↑ Purple badge         │
│  CBC, Malaria, Urinalysis                  │
│  [Ordered by Doctor] [Pending]             │
├────────────────────────────────────────────┤
│  Jane Smith             [P-0124]  2 tests  │
│  Blood Sugar, HbA1c                        │
│  [Ordered by Doctor] [Pending]             │
└────────────────────────────────────────────┘
```

## 3. Treatment Page Queue

### Before (All registered patients appear)
```
┌────────────────────────────────────────────┐
│  Open Visits (10 patients)                 │
├────────────────────────────────────────────┤
│  • John Doe (P-0123) - Cough, fever        │
│  • Jane Smith (P-0124) - Check-up          │
│  • Bob Jones (P-0125) - Lab referral       │ ← Shouldn't be here
│  • Alice Brown (P-0126) - Headache         │
└────────────────────────────────────────────┘
```

### After (Referral patients filtered out)
```
┌────────────────────────────────────────────┐
│  Open Visits (9 patients)                  │
├────────────────────────────────────────────┤
│  • John Doe (P-0123) - Cough, fever        │
│  • Jane Smith (P-0124) - Check-up          │
│  [Bob Jones NOT shown - referral patient]  │
│  • Alice Brown (P-0126) - Headache         │
└────────────────────────────────────────────┘
```

## 4. X-Ray and Ultrasound Pages

Similar to Laboratory page, the "External Referral" purple badge appears:

```
┌────────────────────────────────────────────┐
│  X-Ray Exams - Pending                     │
├────────────────────────────────────────────┤
│  Sarah Lee [P-0127] [External Referral]    │
│  Chest X-Ray (AP & Lateral)                │
│  Clinical Indication: Persistent cough     │
└────────────────────────────────────────────┘
```

## Color Scheme

### Patient Type Selection
- **Regular Patient**: Default blue/teal theme
- **External Referral**: Yellow info box when selected

### Badge Colors
- **Patient ID Badge**: Blue (`bg-blue-100 text-blue-700`)
- **External Referral Badge**: Purple (`bg-purple-100 text-purple-700`)
- **Test Count Badge**: Blue (`bg-blue-100 text-blue-700`)
- **Status Badges**: 
  - Pending: Orange (`bg-orange-100 text-orange-700`)
  - Completed: Green
  - Unpaid: Red (`bg-red-100 text-red-700`)

## Visual Hierarchy

The implementation follows these principles:

1. **Clear Defaults**: Regular patient type is pre-selected
2. **Progressive Disclosure**: Consultation fee section only shows for regular patients
3. **Informative Feedback**: Yellow warning box explains implications of referral selection
4. **Consistent Badging**: Purple "External Referral" badge across all diagnostic pages
5. **Non-Intrusive**: Referral patients don't clutter the doctor's queue

## Workflow Comparison

### Regular Patient Journey
```
Registration → Treatment Queue → Doctor Consult → Diagnostics → Results → Billing → Discharge
     ↓              ↓                  ↓              ↓
  Regular     Appears in          Auto-added    Can order
   Type         queue            consultation   if needed
```

### External Referral Patient Journey
```
Registration → Diagnostic Order → Lab/X-ray/US → Results → Return to Clinic
     ↓              ↓                  ↓
  Referral    Order placed        Appears with
   Type       by reception        purple badge
              
              SKIP: Treatment Queue
              SKIP: Consultation Fee
              SKIP: Doctor Visit
```

## Benefits

1. **Reduced Confusion**: Doctors only see patients who need consultation
2. **Accurate Billing**: Referral patients not charged consultation fees
3. **Clear Identification**: Purple badges help staff identify referral patients
4. **Efficient Workflow**: Each patient type follows appropriate path
5. **User-Friendly**: Simple radio button selection with clear descriptions

## Technical Implementation Notes

- Patient type is stored in database (`patient_type` column)
- Default value ensures backward compatibility
- TypeScript types ensure type safety
- Filtering happens on frontend for responsive UI
- Backend enforces business logic (no consultation for referrals)
