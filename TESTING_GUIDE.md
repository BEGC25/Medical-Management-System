# Testing Guide: Diagnostic Ordering Enhancements

## Prerequisites
- Chrome or Edge browser (for dictation testing)
- Admin or clinician account access
- Test patient data available

## Test Scenarios

### 1. X-Ray Ordering from Treatment Page

#### Test Case 1.1: Skull/Head Projections
**Steps:**
1. Navigate to Treatment page
2. Select a patient
3. Click on "Quick Order" tab
4. Select "X-ray" tab
5. Click on "Skull/Head" exam type
6. Verify **8 projection options** appear:
   - AP (Caldwell)
   - Lateral
   - Towne's View
   - Waters View (Sinuses)
   - Submentovertex (Base)
   - Skull Series (4 views)
   - Facial bones
   - Mandible

**Expected:** All 8 options displayed in quick select buttons
**Pass/Fail:** ___

#### Test Case 1.2: Spine Region Selection
**Steps:**
1. From X-ray ordering, select "Spine" exam type
2. Verify **4 spine region options** appear:
   - Cervical spine
   - Thoracic spine
   - Lumbar spine
   - Sacrum/Coccyx

**Expected:** All 4 regions displayed with proper styling
**Pass/Fail:** ___

#### Test Case 1.3: X-Ray Dictation
**Steps:**
1. In X-ray ordering, locate "Clinical Indication" field
2. Click "Dictate" button (purple, with microphone icon)
3. Speak: "Patient complains of headache after fall"
4. Click "Stop" button
5. Verify text appears in Clinical Indication textarea

**Expected:** Speech converted to text accurately
**Pass/Fail:** ___

### 2. Ultrasound Ordering from Treatment Page

#### Test Case 2.1: Complete Exam Type List
**Steps:**
1. Navigate to Treatment page > Quick Order > Ultrasound
2. Verify **14 exam type options** appear:
   - Cardiac (Echo) 🫀
   - Obstetric 🤰
   - Abdominal 🫄
   - Musculoskeletal 🦴
   - Thoracic 🫁 (NEW)
   - Vascular (Doppler) 🩸
   - Pelvic 🩻
   - Renal 🫘
   - Thyroid 🦴
   - Breast 🎀 (ICON CHANGED)
   - Soft Tissue 🔬
   - Scrotal 🔵
   - Neck ��
   - Other/Custom 🎯 (NEW)

**Expected:** All 14 types visible, Breast shows ribbon icon (not stethoscope)
**Pass/Fail:** ___

#### Test Case 2.2: Specific Exam Quick Select
**Steps:**
1. Select "Cardiac (Echo)" exam type
2. Verify specific cardiac exams appear:
   - Transthoracic Echo (TTE)
   - Limited Echo (FOCUS)
   - Stress Echo
   - Valve Assessment
   - Pericardial Effusion

**Expected:** Specific exams dynamically populated
**Pass/Fail:** ___

#### Test Case 2.3: Thoracic Exam Type (NEW)
**Steps:**
1. Select "Thoracic" exam type
2. Verify specific thoracic exams appear:
   - Pleural Effusion Assessment
   - Chest Wall Mass
   - Lung Surface Evaluation
   - Thyroid Gland Scan

**Expected:** Thoracic-specific options displayed
**Pass/Fail:** ___

#### Test Case 2.4: Ultrasound Dictation
**Steps:**
1. In Ultrasound ordering, locate "Clinical Information" field
2. Click "Dictate" button (purple, with microphone icon)
3. Speak: "Right upper quadrant pain, suspected gallstones"
4. Click "Stop" button
5. Verify text appears in Clinical Information textarea

**Expected:** Speech converted to text accurately
**Pass/Fail:** ___

### 3. Lab Ordering from Treatment Page

#### Test Case 3.1: Lab Dictation
**Steps:**
1. Navigate to Treatment page > Quick Order > Lab
2. Select any lab test
3. Locate "Clinical Information" field
4. Click "Dictate" button (purple, with microphone icon)
5. Speak: "Patient presents with fever and malaise"
6. Click "Stop" button
7. Verify text appears in Clinical Information textarea

**Expected:** Speech converted to text accurately
**Pass/Fail:** ___

### 4. X-Ray Department Page Consistency

#### Test Case 4.1: Exam Types Match Treatment
**Steps:**
1. Navigate to X-Ray department page
2. Click "Request X-Ray Exam" 
3. Compare exam types with Treatment page X-ray ordering
4. Verify both show identical 6 exam types

**Expected:** Exact match between pages
**Pass/Fail:** ___

#### Test Case 4.2: Skull Projections Match
**Steps:**
1. In X-Ray department, select "Skull/Head" exam type
2. Verify same 8 projection options as Treatment page

**Expected:** Identical options in same order
**Pass/Fail:** ___

### 5. Ultrasound Department Page Consistency

#### Test Case 5.1: Exam Types Match Treatment
**Steps:**
1. Navigate to Ultrasound department page
2. Click "Request Ultrasound"
3. Compare exam types with Treatment page ultrasound ordering
4. Verify both show identical 14 exam types (including Thoracic and Other/Custom)

**Expected:** Exact match between pages
**Pass/Fail:** ___

#### Test Case 5.2: Specific Exams Match
**Steps:**
1. In Ultrasound department, select "Cardiac/Echo"
2. Verify specific cardiac exam options match Treatment page
3. Repeat for 2-3 other exam types

**Expected:** Identical specific exam options
**Pass/Fail:** ___

### 6. Browser Compatibility

#### Test Case 6.1: Chrome/Edge Dictation
**Steps:**
1. Using Chrome or Edge browser
2. Test dictation on all three fields (Lab, X-ray, Ultrasound)
3. Verify all work correctly

**Expected:** Dictation functional
**Pass/Fail:** ___

#### Test Case 6.2: Firefox/Safari Warning
**Steps:**
1. Using Firefox or Safari browser
2. Click any "Dictate" button
3. Verify toast notification appears saying:
   "Voice dictation is not supported in this browser. Try Chrome or Edge."

**Expected:** Clear unsupported message
**Pass/Fail:** ___

### 7. Visual Verification

#### Test Case 7.1: UI Consistency
**Steps:**
1. Verify all "Dictate" buttons are styled consistently:
   - Purple border and text
   - Microphone icon
   - Hover effect (purple background)
2. Verify "Stop" state shows:
   - Animated pulse on microphone icon
   - Red color on icon
   - Button text changes to "Stop"

**Expected:** Consistent styling across all three diagnostic types
**Pass/Fail:** ___

## Regression Testing

### Test Case R.1: Existing Dictation Still Works
**Steps:**
1. Navigate to Visit Notes section
2. Test dictation on Chief Complaint field
3. Test dictation on Examination field
4. Verify both still work correctly

**Expected:** No interference with existing features
**Pass/Fail:** ___

### Test Case R.2: Order Submission
**Steps:**
1. Order X-ray with dictated clinical indication
2. Order Ultrasound with dictated clinical information
3. Order Lab with dictated clinical information
4. Verify all orders saved with dictated text

**Expected:** Text properly saved in database
**Pass/Fail:** ___

## Sign-Off

**Tester Name:** _______________
**Date:** _______________
**Overall Pass/Fail:** _______________

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
