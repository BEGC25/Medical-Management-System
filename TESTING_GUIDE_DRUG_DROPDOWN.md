# Testing Guide: Enhanced Drug Dropdown in Doctor's Consultation

## Overview
This guide provides comprehensive testing procedures for the enhanced drug prescription dropdown in the Doctor's Consultation workspace.

## Prerequisites
- System running with database populated
- At least one patient created
- Pharmacy inventory with various drugs (different stock levels)
- Doctor/physician user account with access to Treatment page

## Test Environment Setup

### Required Test Data

#### 1. Drugs in Inventory
You should have drugs with:
- ✅ **High stock** (e.g., Paracetamol: 500 tablets)
- ✅ **Low stock** (e.g., Ampicillin: 15 tablets - below reorder level)
- ✅ **Out of stock** (e.g., some drug with 0 units)
- ✅ **Different forms** (tablets, capsules, injections, syrups, creams)
- ✅ **Different categories** (Antibiotics, Antimalarials, Analgesics, Other)

#### 2. Patient Data
- At least one patient registered
- Patient with allergy documented (optional, for allergy alert testing)

---

## Test Cases

### Test Suite 1: Basic Dropdown Functionality

#### TC1.1: Open Drug Dropdown
**Steps:**
1. Navigate to Doctor's Consultation page
2. Select a patient
3. Click on "Medications" tab
4. Click "Select Drug" button

**Expected Result:**
- ✅ Dropdown opens
- ✅ Shows search input at top
- ✅ Shows categorized drug list
- ✅ Category headers visible (🔬 ANTIBIOTICS, 🦟 ANTIMALARIALS, etc.)
- ✅ Each category shows drug count badge

**Status:** ⬜ Pass ⬜ Fail

---

#### TC1.2: Search Functionality
**Steps:**
1. Open drug dropdown
2. Type "amox" in search box

**Expected Result:**
- ✅ Filters to show only drugs matching "amox" (e.g., Amoxicillin)
- ✅ Updates in real-time as you type
- ✅ Categories with no matches are hidden
- ✅ Empty state shows if no matches

**Status:** ⬜ Pass ⬜ Fail

---

#### TC1.3: Drug Selection
**Steps:**
1. Open drug dropdown
2. Click on a drug (e.g., Amoxicillin 500mg)

**Expected Result:**
- ✅ Dropdown closes
- ✅ Selected drug displays in trigger button
- ✅ Shows drug name and strength in button
- ✅ Form fields become enabled/visible

**Status:** ⬜ Pass ⬜ Fail

---

### Test Suite 2: Educational Information Display

#### TC2.1: Educational Summary for Common Drug
**Steps:**
1. Open drug dropdown
2. Find "Paracetamol" in the list

**Expected Result:**
- ✅ Shows drug name: "Paracetamol 500mg"
- ✅ Shows generic name and form: "Paracetamol • Tablet"
- ✅ Shows 📝 icon with educational text
- ✅ Educational text reads: "Reduces pain and fever. Works by blocking pain signals in the brain and lowering body temperature."
- ✅ Text is in italic, gray color
- ✅ Text limited to 2 lines (line-clamp-2)

**Status:** ⬜ Pass ⬜ Fail

---

#### TC2.2: Educational Summary for Antibiotic
**Steps:**
1. Open drug dropdown
2. Find "Amoxicillin" in the list

**Expected Result:**
- ✅ Shows educational summary
- ✅ Text describes antibiotic action (e.g., "Kills bacteria causing infections...")
- ✅ Information is clinically accurate
- ✅ Formatted consistently with other drugs

**Status:** ⬜ Pass ⬜ Fail

---

#### TC2.3: Drug Without Educational Info
**Steps:**
1. Open drug dropdown
2. Find a drug not in the educational database (if any)

**Expected Result:**
- ✅ Shows drug name and details
- ✅ No educational summary section displayed (graceful omission)
- ✅ Stock status still shown
- ✅ No error messages

**Status:** ⬜ Pass ⬜ Fail

---

### Test Suite 3: Stock Status Indicators

#### TC3.1: In-Stock Drug Display
**Steps:**
1. Open drug dropdown
2. Find a drug with high stock (e.g., 500 units)

**Expected Result:**
- ✅ Shows ✅ icon
- ✅ Text: "In Stock"
- ✅ Color: Green (`text-green-600`)
- ✅ Shows quantity with proper unit (e.g., "(500 tablets)" not "(500 units)")
- ✅ Unit is pluralized correctly

**Status:** ⬜ Pass ⬜ Fail

---

#### TC3.2: Low-Stock Drug Display
**Steps:**
1. Open drug dropdown
2. Find a drug with stock below reorder level (e.g., 15 units, reorder level = 20)

**Expected Result:**
- ✅ Shows ⚠️ icon
- ✅ Text: "Low Stock"
- ✅ Color: Orange/Amber (`text-orange-600`)
- ✅ Shows quantity with proper unit (e.g., "(15 tablets)")

**Status:** ⬜ Pass ⬜ Fail

---

#### TC3.3: Out-of-Stock Drug Display
**Steps:**
1. Open drug dropdown
2. Find a drug with 0 stock

**Expected Result:**
- ✅ Shows ⊘ icon (prohibition/null symbol)
- ✅ Text: "Out of Stock"
- ✅ Color: Muted Gray (`text-gray-400`)
- ✅ No quantity displayed (since it's 0)
- ✅ Styling is professional, not alarming (gray, not red)

**Status:** ⬜ Pass ⬜ Fail

---

### Test Suite 4: Unit Pluralization

#### TC4.1: Tablets
**Steps:**
1. Find a drug with form = "tablet"
2. Check stock display

**Expected Result:**
- ✅ Shows "tablets" (plural) not "units"
- ✅ Example: "(50 tablets)"

**Status:** ⬜ Pass ⬜ Fail

---

#### TC4.2: Capsules
**Steps:**
1. Find a drug with form = "capsule"
2. Check stock display

**Expected Result:**
- ✅ Shows "capsules" (plural) not "units"
- ✅ Example: "(100 capsules)"

**Status:** ⬜ Pass ⬜ Fail

---

#### TC4.3: Injections
**Steps:**
1. Find a drug with form = "injection"
2. Check stock display

**Expected Result:**
- ✅ Shows "vials" not "units"
- ✅ Example: "(20 vials)"

**Status:** ⬜ Pass ⬜ Fail

---

#### TC4.4: Syrups
**Steps:**
1. Find a drug with form = "syrup"
2. Check stock display

**Expected Result:**
- ✅ Shows "bottles" not "units"
- ✅ Example: "(30 bottles)"

**Status:** ⬜ Pass ⬜ Fail

---

#### TC4.5: Creams/Ointments
**Steps:**
1. Find a drug with form = "cream" or "ointment"
2. Check stock display

**Expected Result:**
- ✅ Shows "tubes" not "units"
- ✅ Example: "(25 tubes)"

**Status:** ⬜ Pass ⬜ Fail

---

### Test Suite 5: Category Grouping

#### TC5.1: Antibiotic Category
**Steps:**
1. Open drug dropdown
2. Scroll to ANTIBIOTICS section

**Expected Result:**
- ✅ Shows 🔬 icon
- ✅ Header text: "ANTIBIOTICS"
- ✅ Shows count badge (e.g., [12])
- ✅ Lists antibiotic drugs (Amoxicillin, Ampicillin, etc.)
- ✅ Educational info mentions "bacteria" or "infection"

**Status:** ⬜ Pass ⬜ Fail

---

#### TC5.2: Antimalarial Category
**Steps:**
1. Open drug dropdown
2. Scroll to ANTIMALARIALS section

**Expected Result:**
- ✅ Shows 🦟 icon (mosquito)
- ✅ Header text: "ANTIMALARIALS"
- ✅ Shows count badge
- ✅ Lists antimalarial drugs (Artesunate, Coartem, Quinine, etc.)
- ✅ Educational info mentions "malaria"

**Status:** ⬜ Pass ⬜ Fail

---

#### TC5.3: Analgesic Category
**Steps:**
1. Open drug dropdown
2. Scroll to ANALGESICS section

**Expected Result:**
- ✅ Shows 💊 icon
- ✅ Header text: "ANALGESICS"
- ✅ Shows count badge
- ✅ Lists pain relief drugs (Paracetamol, Ibuprofen, etc.)
- ✅ Educational info mentions "pain" or "fever"

**Status:** ⬜ Pass ⬜ Fail

---

#### TC5.4: Other Category
**Steps:**
1. Open drug dropdown
2. Scroll to OTHER section

**Expected Result:**
- ✅ Shows 🩺 icon (stethoscope)
- ✅ Header text: "OTHER"
- ✅ Shows count badge
- ✅ Lists drugs not in other categories

**Status:** ⬜ Pass ⬜ Fail

---

### Test Suite 6: Integration with Existing Features

#### TC6.1: Allergy Alert System
**Steps:**
1. Select a patient with documented allergy (e.g., Penicillin)
2. Open drug dropdown
3. Select a drug matching the allergy (e.g., Amoxicillin)

**Expected Result:**
- ✅ Dropdown closes and drug is selected
- ✅ Allergy alert appears below dropdown
- ✅ Shows red warning box with pulsing animation
- ✅ Alert text: "⚠️ ALLERGY ALERT!"
- ✅ Shows allergy details
- ✅ New dropdown functionality doesn't break allergy system

**Status:** ⬜ Pass ⬜ Fail

---

#### TC6.2: Stock Warning Below Dropdown
**Steps:**
1. Select a drug with 0 stock

**Expected Result:**
- ✅ Out-of-stock warning appears below dropdown
- ✅ Red background with XCircle icon
- ✅ Text: "Out of Stock - Cannot prescribe"
- ✅ Warning is separate from dropdown stock indicator
- ✅ Both indicators work together

**Status:** ⬜ Pass ⬜ Fail

---

#### TC6.3: Low Stock Warning Below Dropdown
**Steps:**
1. Select a drug with low stock (< 20 units)

**Expected Result:**
- ✅ Low stock warning appears below dropdown
- ✅ Amber/orange background with AlertTriangle icon
- ✅ Text: "Low Stock Warning - Only X units available"
- ✅ Warning complements dropdown stock indicator

**Status:** ⬜ Pass ⬜ Fail

---

#### TC6.4: Prescription Creation Flow
**Steps:**
1. Select a drug from enhanced dropdown
2. Fill in dosage, quantity, instructions
3. Click "Add Medication"

**Expected Result:**
- ✅ Medication adds to list
- ✅ Shows in "Current Medications" section
- ✅ All prescription data saved correctly
- ✅ No errors in console
- ✅ Enhanced dropdown doesn't break prescription flow

**Status:** ⬜ Pass ⬜ Fail

---

### Test Suite 7: UI/UX Quality

#### TC7.1: Visual Design Quality
**Steps:**
1. Open drug dropdown
2. Review overall appearance

**Expected Result:**
- ✅ Clean, professional design
- ✅ Proper spacing and alignment
- ✅ Icons render correctly
- ✅ Colors are appropriate and accessible
- ✅ Text is readable
- ✅ Matches pharmacy dropdown style
- ✅ Looks premium (10+ quality)

**Status:** ⬜ Pass ⬜ Fail

---

#### TC7.2: Dark Mode Compatibility
**Steps:**
1. Switch to dark mode
2. Open drug dropdown

**Expected Result:**
- ✅ All colors adapt to dark theme
- ✅ Text remains readable
- ✅ Stock status colors still distinguishable
- ✅ Icons visible in dark mode
- ✅ No white flashes or harsh contrasts

**Status:** ⬜ Pass ⬜ Fail

---

#### TC7.3: Responsive Design
**Steps:**
1. Test on different screen sizes:
   - Desktop (1920x1080)
   - Laptop (1366x768)
   - Tablet (768x1024)
   - Mobile (375x667)

**Expected Result:**
- ✅ Dropdown adjusts width appropriately
- ✅ All content visible on small screens
- ✅ Scrolling works on all devices
- ✅ Touch targets adequate on mobile
- ✅ No horizontal scrolling required

**Status:** ⬜ Pass ⬜ Fail

---

#### TC7.4: Performance
**Steps:**
1. Open dropdown with 100+ drugs
2. Type in search box
3. Scroll through categories

**Expected Result:**
- ✅ Dropdown opens quickly (< 300ms)
- ✅ Search filters instantly (real-time)
- ✅ Scrolling is smooth
- ✅ No lag or stuttering
- ✅ No console errors
- ✅ Memory usage acceptable

**Status:** ⬜ Pass ⬜ Fail

---

### Test Suite 8: Edge Cases

#### TC8.1: Empty Drug Database
**Steps:**
1. Clear all drugs from pharmacy inventory
2. Open drug dropdown

**Expected Result:**
- ✅ Shows "No drugs found" message
- ✅ Shows Package icon
- ✅ No errors
- ✅ Graceful empty state

**Status:** ⬜ Pass ⬜ Fail

---

#### TC8.2: Search with No Matches
**Steps:**
1. Open dropdown
2. Type "ZZZZZ" (no drug matches)

**Expected Result:**
- ✅ Shows "No drugs found" message
- ✅ All categories hidden
- ✅ Can clear search to see all drugs again

**Status:** ⬜ Pass ⬜ Fail

---

#### TC8.3: Very Long Drug Names
**Steps:**
1. Add a drug with a very long name (50+ characters)
2. View in dropdown

**Expected Result:**
- ✅ Name displays without breaking layout
- ✅ Text wraps appropriately
- ✅ No overflow issues

**Status:** ⬜ Pass ⬜ Fail

---

#### TC8.4: Special Characters in Drug Names
**Steps:**
1. View drug with special characters (e.g., "Co-trimoxazole")
2. Search for it

**Expected Result:**
- ✅ Displays correctly
- ✅ Search finds it
- ✅ No encoding issues

**Status:** ⬜ Pass ⬜ Fail

---

## Automated Testing Checklist

### Console Errors
- ⬜ No errors when opening dropdown
- ⬜ No errors when searching
- ⬜ No errors when selecting drug
- ⬜ No errors when closing dropdown
- ⬜ No React warnings

### Browser Compatibility
- ⬜ Chrome (latest)
- ⬜ Firefox (latest)
- ⬜ Safari (latest)
- ⬜ Edge (latest)
- ⬜ Mobile browsers

### Accessibility
- ⬜ Keyboard navigation works
- ⬜ Tab order is logical
- ⬜ Enter key selects drug
- ⬜ Escape key closes dropdown
- ⬜ Screen reader compatible
- ⬜ Color contrast meets WCAG AA

---

## Test Results Summary

**Total Test Cases:** 34

**Passed:** _____ / 34  
**Failed:** _____ / 34  
**Skipped:** _____ / 34  
**Blocked:** _____ / 34

**Pass Rate:** _____%

---

## Bug Reporting Template

If you find issues, report using this format:

```
**Test Case:** TC X.X - [Name]
**Status:** FAIL
**Severity:** Critical/High/Medium/Low

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots:**
[Attach if relevant]

**Browser/Device:**
Chrome 120 / Windows 11

**Notes:**
Additional context
```

---

## Sign-Off

**Testing Completed By:** ________________  
**Date:** ________________  
**Environment:** ________________  
**Overall Status:** ⬜ Pass ⬜ Fail ⬜ Pass with Minor Issues

**Recommendation:**
⬜ Ready for Production  
⬜ Needs Minor Fixes  
⬜ Needs Major Rework  

**Comments:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Quick Test (5 Minutes)

For quick verification, run these essential tests:

1. ✅ Open dropdown - shows drugs
2. ✅ Search works
3. ✅ Select a drug
4. ✅ See educational info (📝)
5. ✅ See stock status (✅/⚠️/⊘)
6. ✅ Stock colors correct (green/orange/gray)
7. ✅ Units display properly (tablets/capsules/etc.)
8. ✅ Categories show with icons
9. ✅ Prescription still creates successfully
10. ✅ No console errors

If all pass: ✅ **BASIC FUNCTIONALITY VERIFIED**

---

*Good luck with testing! Report any issues found so they can be addressed promptly.*
