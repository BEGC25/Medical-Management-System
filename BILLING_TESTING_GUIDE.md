# Billing & Invoices Page - Manual Testing Guide

This guide provides step-by-step instructions for manually testing all changes made to the Billing & Invoices page.

## Prerequisites

1. Start the development server: `npm run dev`
2. Ensure you have test data:
   - At least 2 patients in the system
   - At least 1 visit with services (order lines)
   - At least 1 visit without services

## Test Cases

### 1. Terminology Updates

**Test:** Verify all user-facing text uses "Visit" instead of "Encounter"

**Steps:**
1. Navigate to Billing & Invoices page
2. Check page header
3. Click "New Visit" button
4. Read modal title and description
5. Create a visit and check toast message

**Expected Results:**
- ✅ Page header shows "Billing & Invoices"
- ✅ Button shows "New Visit" (not "New Encounter")
- ✅ Modal title shows "Create New Visit"
- ✅ Modal description mentions "visit record"
- ✅ Success toast shows "✓ Visit Created"
- ✅ No instances of "Encounter" in user-facing UI

### 2. Modern Date Picker

**Test:** Verify date picker functionality and appearance

**Steps:**
1. On Billing page, locate the date filter
2. Click on the date picker button
3. Observe the calendar popover
4. Select a different date
5. Verify visits are filtered by selected date

**Expected Results:**
- ✅ Date picker shows as a button with calendar icon
- ✅ Clicking opens a popover calendar (not native browser calendar)
- ✅ Calendar has modern styling with proper month/year navigation
- ✅ Selected date is highlighted in blue
- ✅ Changing date filters the visits list
- ✅ Date picker matches style of other pages (Laboratory, Patients)

### 3. Currency Formatting

**Test:** Verify all currency displays show without decimals and use SSP

**Steps:**
1. View a visit card with services
2. Check the total amount display
3. Click "View Details" on a visit
4. Check unit prices and totals in the services list
5. Check the grand total

**Expected Results:**
- ✅ All amounts show without decimals (e.g., "7000 SSP", not "7000.00 SSP")
- ✅ No `$` symbols appear anywhere
- ✅ All amounts use "SSP" currency suffix
- ✅ Format is consistent: "[number] SSP"

**Examples of correct format:**
- "1500 SSP" ✅
- "7000 SSP" ✅
- "150000 SSP" ✅

**Examples of incorrect format (should NOT see):**
- "$1500" ❌
- "1500.00 SSP" ❌
- "1,500.00 SSP" ❌

### 4. Invoice Generation - Success Case

**Test:** Generate invoice for a visit with services

**Steps:**
1. Find a visit with "Open" status that has services
2. Click "Generate Invoice" button
3. Confirm in the dialog
4. Check toast notification
5. Verify visit status changes

**Expected Results:**
- ✅ "Generate Invoice" button is enabled and visible
- ✅ Confirmation dialog appears with clear message
- ✅ Success toast shows "✓ Invoice Generated"
- ✅ Visit status changes to "Ready to Bill"
- ✅ "Generate Invoice" button disappears after generation

### 5. Invoice Generation - No Services

**Test:** Attempt to generate invoice for visit without services

**Steps:**
1. Find a visit with "Open" status that has NO services
2. Hover over the "Generate Invoice" button
3. Try to click the button

**Expected Results:**
- ✅ "Generate Invoice" button is disabled (grayed out)
- ✅ Tooltip appears on hover: "Cannot generate invoice: This visit has no services"
- ✅ Button cannot be clicked
- ✅ No error occurs (prevented by frontend validation)

### 6. Invoice Generation - Duplicate Prevention

**Test:** Attempt to generate duplicate invoice

**Steps:**
1. Find a visit that already has an invoice (status "Ready to Bill" or "Closed")
2. Try to generate invoice again (if button is visible)

**Expected Results:**
- ✅ Either button is hidden for visits with existing invoices
- ✅ OR attempting to generate shows error toast
- ✅ Error message includes existing invoice ID
- ✅ Error message is helpful: "Invoice already exists for this visit (Invoice ID: [id])"

### 7. Print Invoice Functionality

**Test:** Print a professional invoice

**Steps:**
1. Click "View Details" on a visit with services
2. Locate "Print Invoice" button in the modal footer
3. Click "Print Invoice"
4. Review print preview
5. Check layout and content
6. Try printing to PDF

**Expected Results:**
- ✅ "Print Invoice" button is visible with printer icon
- ✅ Print dialog opens when clicked
- ✅ Print preview shows ONLY the invoice (no navigation, buttons, etc.)
- ✅ Invoice has professional layout:
  - Clinic name at top: "Bahr El Ghazal Clinic"
  - Clinic tagline: "Medical Management System"
  - Invoice details: Invoice #, Date, Visit ID
  - Patient information: Name, ID, Phone
  - Services table with headers: Service, Qty, Unit Price, Total
  - All services listed with proper formatting
  - Grand total in blue box at bottom
  - Thank you message and footer
- ✅ All amounts show without decimals
- ✅ All amounts use SSP
- ✅ Proper spacing and alignment
- ✅ Text is readable and professional
- ✅ Page margins are appropriate (0.5 inch)

### 8. Visit Details Modal

**Test:** View complete visit details

**Steps:**
1. Click "View Details" on any visit
2. Review the modal layout
3. Check patient information card
4. Check visit information card
5. Review services list
6. Check grand total

**Expected Results:**
- ✅ Modal opens with title "Visit Details"
- ✅ Description: "Complete breakdown of services and charges for this visit"
- ✅ Patient info card (blue background):
  - Patient name
  - Patient ID
  - Phone number
- ✅ Visit info card (gray background):
  - Visit ID
  - Date (formatted as "Month Day, Year")
  - Time (if available)
  - Status badge
- ✅ Services section with "Services & Charges" heading
- ✅ Each service shows:
  - Description
  - Quantity
  - Unit price (formatted)
  - Status badge
  - Total price (blue, bold)
- ✅ Grand total at bottom (blue gradient background, white text)
- ✅ Print Invoice button visible
- ✅ Close button works

### 9. Empty State

**Test:** View page with no visits for selected date

**Steps:**
1. Select a date with no visits (e.g., future date)
2. Observe the empty state

**Expected Results:**
- ✅ Shows large icon (users) with gradient background
- ✅ Heading: "No Visits Found"
- ✅ Helpful message about no visits for date/status
- ✅ "Create New Visit" button is visible and works

### 10. Loading State

**Test:** Observe loading animations

**Steps:**
1. Reload the page or switch dates quickly
2. Observe the skeleton loaders

**Expected Results:**
- ✅ Shimmer animation on card placeholders
- ✅ Gradient animation effect
- ✅ Maintains layout (no layout shift)
- ✅ Transitions smoothly to actual content

### 11. Mobile Responsiveness

**Test:** Verify page works on mobile screens

**Steps:**
1. Open browser developer tools
2. Toggle device emulation (mobile view)
3. Test all functionality on mobile screen

**Expected Results:**
- ✅ Page header stacks properly on mobile
- ✅ "New Visit" button remains accessible
- ✅ Date picker and filters stack vertically
- ✅ Visit cards are full width on mobile
- ✅ Card content remains readable
- ✅ Buttons remain accessible
- ✅ Modal is responsive
- ✅ Services table scrolls if needed

### 12. Status Filter

**Test:** Filter visits by status

**Steps:**
1. Select "Open" from status dropdown
2. Verify only open visits show
3. Select "Ready to Bill"
4. Verify only ready to bill visits show
5. Select "All Status"
6. Verify all visits show

**Expected Results:**
- ✅ Filter dropdown works smoothly
- ✅ Visits are filtered correctly
- ✅ Count updates based on filter
- ✅ Empty state shows if no visits match filter

## Regression Testing

**Test:** Ensure no existing functionality is broken

**Steps:**
1. Create a new visit
2. Add services to the visit (if applicable)
3. Generate an invoice
4. View visit details
5. Navigate to other pages and back

**Expected Results:**
- ✅ All existing functionality works
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ Navigation works correctly
- ✅ Data persists correctly

## Accessibility Testing

**Test:** Basic accessibility checks

**Steps:**
1. Tab through the page using keyboard only
2. Check focus indicators
3. Try using screen reader (if available)

**Expected Results:**
- ✅ All interactive elements are keyboard accessible
- ✅ Focus indicators are visible
- ✅ Buttons have clear labels
- ✅ Modal can be closed with Escape key

## Browser Compatibility

**Test:** Verify works in different browsers

**Steps:**
1. Test in Chrome/Chromium
2. Test in Firefox
3. Test in Safari (if available)

**Expected Results:**
- ✅ Page loads and functions in all browsers
- ✅ Date picker works correctly
- ✅ Print functionality works
- ✅ Styles render consistently

## Summary Checklist

Use this checklist for quick verification:

- [ ] Page header shows "Billing & Invoices"
- [ ] No "Encounter" in user-facing text
- [ ] Date picker uses modern popover calendar
- [ ] All currency shows without decimals
- [ ] All currency uses SSP (no $ symbols)
- [ ] Generate invoice works for visits with services
- [ ] Generate invoice blocked for visits without services
- [ ] Duplicate invoice prevention works
- [ ] Print invoice button visible and functional
- [ ] Invoice prints professionally
- [ ] Visit details modal shows complete information
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No TypeScript errors

## Reporting Issues

If you find any issues during testing:

1. Document the specific test case that failed
2. Note the expected vs actual behavior
3. Capture screenshots if relevant
4. Check browser console for errors
5. Report with reproduction steps

## Test Data Setup

If you need to create test data:

```sql
-- Create test patients (if needed)
-- Create visits with services (if needed)
-- You may need to use the UI to create proper test data
```

Alternatively, use the UI:
1. Create 2-3 test patients
2. Create visits for different dates
3. Add services to some visits (use Treatment/Services pages)
4. Leave some visits without services for testing validation
