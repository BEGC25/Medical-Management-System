# Testing Guide - Laboratory Gender-Based Reference Ranges

## Overview
This guide provides step-by-step instructions to test the Laboratory page fixes and gender-based reference range features.

## Prerequisites
- Application running locally or in test environment
- Access to Laboratory module
- Test patients with different genders

## Test Cases

### 1. Critical Error Fix - Laboratory Page Loads

**Objective**: Verify that the "fields is not defined" error is resolved

**Steps**:
1. Navigate to the Laboratory page
2. Select any completed lab test
3. Click "View Results"

**Expected Results**:
- ✅ No JavaScript errors in console
- ✅ Results modal opens successfully
- ✅ All test results display correctly
- ✅ Reference ranges show properly

**Status**: Should be fixed by adding `const fields = findResultFields(testName);`

---

### 2. Gender-Specific Abnormality Detection - Hemoglobin

**Objective**: Verify hemoglobin uses correct gender-specific ranges

**Test Data**:
- Male patient (gender: "Male" or "M")
- Female patient (gender: "Female" or "F")

**Test Case 2A - Male Patient, Low Hemoglobin**:
```
Patient: Male
Test: Hemoglobin (Hb)
Value: 12 g/dL
Expected: ABNORMAL (below male range 13.5-17.5)
Reference Range: 13.5-17.5 g/dL
```

**Test Case 2B - Female Patient, Same Value**:
```
Patient: Female
Test: Hemoglobin (Hb)
Value: 12 g/dL
Expected: NORMAL (within female range 12-16)
Reference Range: 12-16 g/dL
```

**Test Case 2C - Male Patient, Normal Hemoglobin**:
```
Patient: Male
Test: Hemoglobin (Hb)
Value: 15 g/dL
Expected: NORMAL (within male range 13.5-17.5)
Reference Range: 13.5-17.5 g/dL
```

---

### 3. Gender-Specific Abnormality Detection - ESR

**Objective**: Verify ESR uses correct gender-specific ranges

**Test Case 3A - Male Patient, Elevated ESR**:
```
Patient: Male
Test: ESR (Erythrocyte Sedimentation Rate)
Field: ESR (1 hour)
Value: 18 mm/hr
Expected: ABNORMAL (above male range 0-15)
Reference Range: 0-15 mm/hr
```

**Test Case 3B - Female Patient, Same Value**:
```
Patient: Female
Test: ESR (Erythrocyte Sedimentation Rate)
Field: ESR (1 hour)
Value: 18 mm/hr
Expected: NORMAL (within female range 0-20)
Reference Range: 0-20 mm/hr
```

---

### 4. Gender-Specific Abnormality Detection - Creatinine

**Objective**: Verify Creatinine in RFT uses correct gender-specific ranges

**Test Case 4A - Male Patient**:
```
Patient: Male
Test: Renal Function Test (RFT)
Field: Creatinine
Value: 1.2 mg/dL
Expected: NORMAL (within male range 0.7-1.3)
Reference Range: 0.7-1.3 mg/dL
```

**Test Case 4B - Female Patient, Same Value**:
```
Patient: Female
Test: Renal Function Test (RFT)
Field: Creatinine
Value: 1.2 mg/dL
Expected: ABNORMAL (above female range 0.6-1.1)
Reference Range: 0.6-1.1 mg/dL
```

---

### 5. Gender-Specific Abnormality Detection - Uric Acid

**Objective**: Verify Uric Acid uses correct gender-specific ranges

**Test Case 5A - Male Patient**:
```
Patient: Male
Test: Uric Acid
Value: 3.5 mg/dL
Expected: NORMAL (within male range 3.4-7.0)
Reference Range: 3.4-7.0 mg/dL
```

**Test Case 5B - Female Patient**:
```
Patient: Female
Test: Uric Acid
Value: 3.5 mg/dL
Expected: ABNORMAL (above female range 2.4-6.0, but value is within)
Actually Expected: NORMAL (within female range 2.4-6.0)
Reference Range: 2.4-6.0 mg/dL
```

---

### 6. Gender-Specific Abnormality Detection - Ferritin

**Objective**: Verify Ferritin uses correct gender-specific ranges

**Test Case 6A - Male Patient**:
```
Patient: Male
Test: Ferritin
Value: 250 ng/mL
Expected: NORMAL (within male range 20-500)
Reference Range: 20-500 ng/mL
```

**Test Case 6B - Female Patient, Same Value**:
```
Patient: Female
Test: Ferritin
Value: 250 ng/mL
Expected: ABNORMAL (above female range 20-200)
Reference Range: 20-200 ng/mL
```

---

### 7. Fallback Behavior - Unknown Gender

**Objective**: Verify system handles missing gender gracefully

**Test Case 7A - Patient Without Gender**:
```
Patient: Gender not specified
Test: Hemoglobin (Hb)
Value: 14 g/dL
Expected: Uses generic range
Reference Range: M: 13.5-17.5, F: 12-16 (shows full text)
Status: Should NOT error
```

---

### 8. Multiple Tests in Result View

**Objective**: Verify summary counts are accurate with gender-specific detection

**Steps**:
1. Create a lab order with multiple tests for a male patient
2. Enter results:
   - Hemoglobin: 12 g/dL (ABNORMAL for male)
   - ESR: 18 mm/hr (ABNORMAL for male)
   - Blood Glucose: 95 mg/dL (NORMAL)

**Expected Results**:
- ✅ Summary shows: 2 Abnormal, 1 Normal
- ✅ Cards color-coded correctly (red/amber for abnormal, green for normal)
- ✅ Reference ranges show male-specific values

---

### 9. Print Report with Gender-Specific Ranges

**Objective**: Verify printed reports show correct gender-specific ranges

**Steps**:
1. View lab results for a patient
2. Click "Print" button
3. Review print preview

**Expected Results**:
- ✅ Reference ranges match patient gender
- ✅ Abnormal values highlighted correctly
- ✅ All data displays properly

---

### 10. Result Entry Form

**Objective**: Verify entering new results works correctly

**Steps**:
1. Select pending lab test
2. Enter results for multiple tests
3. Save results

**Expected Results**:
- ✅ No errors during result entry
- ✅ Form accepts all values
- ✅ Results save successfully
- ✅ View mode shows correct abnormality detection

---

## Visual Verification Checklist

### UI Elements to Check:
- [ ] Results modal opens without errors
- [ ] Status badges display (NORMAL, ABNORMAL, CRITICAL)
- [ ] Color coding is correct:
  - 🟢 Green for normal values
  - 🟡 Amber for abnormal values
  - 🔴 Red for critical values
- [ ] Reference ranges show next to each value
- [ ] Gender-specific ranges display correctly
- [ ] All test fields render properly

### Console to Check:
- [ ] No "fields is not defined" errors
- [ ] No "Cannot read property of null/undefined" errors
- [ ] No TypeScript compilation errors

---

## Automated Test Scenarios

If you have automated testing:

```javascript
// Test 1: Fields variable exists
test('Laboratory view should define fields variable', () => {
  // Navigate to results view
  // Verify no ReferenceError
});

// Test 2: Gender-specific Hemoglobin detection
test('Male patient with Hb 12 should be abnormal', () => {
  const patient = { gender: 'Male' };
  const result = isFieldAbnormal('Hemoglobin (Hb)', 'Hemoglobin', 12, patient);
  expect(result).toBe(true);
});

test('Female patient with Hb 12 should be normal', () => {
  const patient = { gender: 'Female' };
  const result = isFieldAbnormal('Hemoglobin (Hb)', 'Hemoglobin', 12, patient);
  expect(result).toBe(false);
});

// Test 3: Null safety
test('Should handle null gender gracefully', () => {
  const patient = { gender: null };
  const result = isFieldAbnormal('Hemoglobin (Hb)', 'Hemoglobin', 12, patient);
  // Should not throw error
  expect(result).toBeDefined();
});
```

---

## Known Issues & Limitations

### Out of Scope:
- Non-binary gender values (uses fallback ranges)
- Pediatric reference ranges (uses adult ranges)
- Age-adjusted reference ranges

### Future Enhancements:
- Add age-based reference ranges
- Support for additional gender identities
- Pregnancy-adjusted reference ranges

---

## Sign-Off

### Test Results:
- [ ] All critical error tests passed
- [ ] All gender-specific detection tests passed
- [ ] All UI verification checks passed
- [ ] No console errors observed
- [ ] Print functionality works correctly

### Tested By:
Name: ________________  
Date: ________________  
Environment: ________________  

### Approved For Production:
Name: ________________  
Date: ________________  
