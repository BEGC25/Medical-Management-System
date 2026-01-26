# Billing Page Fixes - Summary

## Issues Fixed

### Issue 1: Date Formatting - South Sudan Timezone ✅
**Problem:** The Billing page used `'en-US'` locale with JavaScript's `toLocaleDateString()` and `toLocaleTimeString()`, showing dates/times in the browser's local timezone rather than the clinic's timezone (Africa/Juba, UTC+2).

**Solution:** Replaced all date/time formatting with clinic timezone utilities:
- `formatClinicDay(dateValue, 'd MMM yyyy')` for short dates
- `formatClinicDay(dateValue, 'MMMM d, yyyy')` for long dates
- `formatClinicDateTime(dateValue, 'hh:mm a')` for times

**Files Changed:**
- `client/src/pages/Billing.tsx`

**Locations Updated:**
1. Line 125-129: EncounterCard visit date
2. Line 140-143: EncounterCard creation time
3. Line 602-606: Visit Details date (long format)
4. Line 608-611: Visit Details time

---

### Issue 2: Payment Information Display ✅
**Problem:** The Billing page showed incorrect totals for existing data because:
- Order line data stored before PR #455 had incorrect prices
- Only "Charges" were shown, not actual "Payments"
- No way to see discrepancies between what was charged vs what was paid

**Solution (Option A):** Display actual payment amounts alongside charges:
- Added new API endpoint to fetch payment totals for encounters
- Modified UI to show both "Charges" and "Paid" amounts
- Display outstanding balance when they don't match
- Show warning message for data discrepancies

**Files Changed:**
- `client/src/pages/Billing.tsx`
- `server/routes.ts`

---

## Implementation Details

### New API Endpoint
**GET** `/api/encounters/:encounterId/payments`

**Purpose:** Returns payment totals and details for a specific encounter

**Response:**
```json
{
  "totalPaid": 63000,
  "payments": [
    {
      "paymentId": "PAY-001",
      "totalAmount": 63000,
      "paymentDate": "2026-01-26",
      ...
    }
  ]
}
```

**Implementation:**
1. Fetches all order_lines for the encounter
2. Queries payment_items linked to those order_lines
3. Sums up payment amounts
4. Returns payment details (optimized to avoid N+1 queries)

---

### UI Changes

#### EncounterCard Component
**Before:**
- Showed service count and total charges only
- Single green amount display

**After:**
- Shows service count
- **Charges:** Total from order_lines (orange)
- **Paid:** Total from payments (green)
- **Balance:** Difference if any (amber for outstanding, blue for overpayment)

#### Visit Details Modal
**Before:**
- Single "Grand Total" showing charges

**After:**
- **Total Charges:** Sum of all order_lines (orange gradient)
- **Amount Paid:** Sum of all payments (green gradient)
- **Outstanding Balance:** If charges ≠ paid (amber/blue gradient)
- **Discrepancy Warning:** Explains legacy data issues

**Warning Message Example:**
> ⚠️ **Payment Discrepancy Detected**
> 
> The amount paid exceeds the total charges. This may be due to data from before the billing system was updated.

---

## Technical Details

### Date Formatting
```typescript
// Before
{new Date(encounter.visitDate).toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'short', 
  day: 'numeric' 
})}

// After
{formatClinicDay(encounter.visitDate, 'd MMM yyyy')}
```

### Payment Fetching
```typescript
// Fetch payment totals
const paymentsResponse = await fetch(`/api/encounters/${encounter.encounterId}/payments`);
if (paymentsResponse.ok) {
  const paymentsData = await paymentsResponse.json();
  setTotalPaid(paymentsData.totalPaid || 0);
}
```

---

## Code Quality

### Code Review Results
✅ All issues addressed:
- Fixed N+1 query pattern in payment endpoint
- Optimized to fetch all payments once, then filter

### Security Scan Results
✅ CodeQL Analysis: **0 alerts**
- No security vulnerabilities detected
- No sensitive data exposure
- Parameterized queries used throughout

---

## Testing Notes

### Build Status
✅ **Successful** - No TypeScript errors

### Manual Testing Required
To test these changes:
1. Start the application with a database containing test data
2. Navigate to Billing page
3. Verify dates display in Africa/Juba timezone
4. Check that EncounterCards show Charges, Paid, and Balance
5. Open Visit Details modal
6. Verify financial summary shows all three amounts
7. Confirm discrepancy warning appears when charges ≠ paid

### Test Data Needed
- Encounters with order_lines (for charges)
- Payment records linked to those order_lines (for paid amounts)
- Mix of fully paid, partially paid, and overpaid encounters

---

## Expected Behavior After Fix

### Date/Time Display
- All dates/times on Billing page show in **Africa/Juba timezone (UTC+2)**
- Consistent with other parts of the system
- No more browser timezone confusion

### Financial Data
**EncounterCard shows:**
- 2 services
- **Charges:** 10,000 SSP (from order_lines)
- **Paid:** 63,000 SSP (from payments)
- **Balance:** 53,000 SSP overpayment

**Visit Details shows:**
- Individual service line items
- **Total Charges:** 10,000 SSP
- **Amount Paid:** 63,000 SSP
- **Overpayment:** 53,000 SSP
- ⚠️ Warning about data discrepancy

This allows users to:
1. See accurate payment information
2. Identify discrepancies in legacy data
3. Make informed decisions about billing

---

## Future Enhancements (Not in This PR)

### Option B: Data Migration
Could add a script to fix historical order line prices:
- Calculate correct totals for lab test order lines
- Update `unitPriceSnapshot` and `totalPrice` fields
- Requires careful testing and backup

### Option C: Real-time Recalculation
Could recalculate lab test totals on display:
- For order lines with `relatedType: "lab_test"`
- Parse description to count tests
- Recalculate price on-the-fly
- More complex, might impact performance

For now, **Option A** (showing both values) is the safest and most transparent approach.

---

## Files Modified

1. `client/src/pages/Billing.tsx` - 136 lines changed
   - Date formatting updates
   - Payment data fetching
   - UI enhancements

2. `server/routes.ts` - New endpoint added
   - GET `/api/encounters/:encounterId/payments`
   - Optimized query performance

## Commits

1. `Fix date/time formatting to use South Sudan timezone in Billing page`
2. `Add payment totals display to Billing page with charges vs paid comparison`
3. `Optimize payment endpoint to avoid N+1 query pattern`

---

## References

- Issue: PR #455 correctly fixed lab test price calculation in Treatment.tsx
- Problem: Billing page still shows incorrect totals for existing data
- Solution: Display both charges and payments to show accurate financial picture
