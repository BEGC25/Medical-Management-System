# Consultation Fee Duplication Fix - Verification Guide

## Problem Summary
**Issue:** Consultation fee was being added multiple times (95,000 SSP from 70,000 SSP)
**Root Cause:** Race condition where orders check ran before data was loaded from API

## Fix Implementation

### Client-Side Changes (Treatment.tsx)
```typescript
// BEFORE (Broken):
const { data: orders = [] } = useQuery<any[]>({ /* ... */ });

useEffect(() => {
  if (!currentEncounter || !services.length) return;
  if (consultationAddedRef.current.has(encounterId)) return;
  
  const hasConsult = orders.some((o: any) => o.type === "consultation");
  // ❌ orders is [] during initial load, so hasConsult is always false!
  
  if (!hasConsult && !addConsultationMutation.isPending) {
    consultationAddedRef.current.add(encounterId);
    addConsultationMutation.mutate();
  }
}, [currentEncounter?.encounterId, services.length]); // ❌ orders not in deps!
```

```typescript
// AFTER (Fixed):
const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({ /* ... */ });

// Memoized check for performance
const hasConsultationOrder = useMemo(() => 
  orders.some((o) => o.type === "consultation"), 
  [orders]
);

useEffect(() => {
  if (!currentEncounter || !services.length) return;
  
  // ✅ CRITICAL: Wait for orders to load
  if (ordersLoading) return;
  
  // ✅ Check database first
  if (hasConsultationOrder) return;
  
  // ✅ Check session state
  if (consultationAddedRef.current.has(encounterId)) return;
  
  // ✅ Check mutation state
  if (addConsultationMutation.isPending) return;
  
  consultationAddedRef.current.add(encounterId);
  addConsultationMutation.mutate();
}, [currentEncounter?.encounterId, services.length, hasConsultationOrder, ordersLoading]);
// ✅ All necessary deps included
```

### Server-Side Changes (routes.ts)
```typescript
// NEW: Server-side validation in POST /api/order-lines
if (normalizedRelatedType === "consultation") {
  const existingOrderLines = await storage.getOrderLinesByEncounter(result.data.encounterId);
  const hasExistingConsultation = existingOrderLines.some(
    (ol) => ol.relatedType === "consultation"
  );
  
  if (hasExistingConsultation) {
    console.log(`[ORDER-LINES] Blocked duplicate consultation for encounter ${result.data.encounterId}`);
    return res.status(400).json({ 
      error: "Duplicate consultation order",
      details: "A consultation order already exists for this encounter. Cannot add another consultation." 
    });
  }
}
```

## Testing Steps

### Test 1: Multiple Page Loads
**Scenario:** Navigate to Treatment page multiple times
1. Start the application
2. Go to Treatment page and select a patient
3. Navigate away (e.g., to Dashboard)
4. Navigate back to Treatment page
5. **Expected:** Only ONE consultation fee in orders
6. **Check:** Total should NOT increase

### Test 2: Page Refresh
**Scenario:** Refresh page with patient selected
1. Open Treatment page with a patient
2. Press F5 or Ctrl+R to refresh
3. **Expected:** Only ONE consultation fee remains
4. **Check:** No duplicate added on refresh

### Test 3: Queue Selection
**Scenario:** Open patient from "Open Visits" queue
1. Open Treatment page
2. Click "Open Visits (Today)" stat card
3. Select a patient from the queue
4. **Expected:** Only ONE consultation fee
5. **Check:** Counter in billing shows correct amount

### Test 4: New Encounter Navigation
**Scenario:** Create encounter, navigate away, come back
1. Create a new encounter for a patient
2. Navigate to another page
3. Navigate back to Treatment page
4. Select same patient
5. **Expected:** Consultation count stays at 1
6. **Check:** No second consultation added

### Test 5: Server-Side Protection
**Scenario:** Verify server blocks duplicates
1. With browser dev tools open (F12)
2. Go to Network tab
3. Try to manually create duplicate consultation via API (if possible)
4. **Expected:** Server returns 400 error
5. **Check:** Console shows "Blocked duplicate consultation"

## Verification Checklist

- [ ] Single consultation fee on initial visit
- [ ] No duplicate on page refresh
- [ ] No duplicate on navigation (away and back)
- [ ] No duplicate when selecting from queue
- [ ] Server logs show blocking if duplicate attempted
- [ ] Patient billing total is correct (not inflated)
- [ ] Order count badge shows correct number

## Expected Behavior

### Before Fix:
- ❌ 70,000 SSP → 95,000 SSP (added 25,000 SSP duplicate)
- ❌ Every page load adds another consultation
- ❌ Billing integrity compromised

### After Fix:
- ✅ Only ONE consultation fee per encounter
- ✅ Amount stays consistent across page loads
- ✅ Server blocks any duplicate attempts
- ✅ Billing integrity maintained

## Key Technical Points

1. **Orders Loading State**: Must wait for `ordersLoading === false`
2. **Memoization**: `hasConsultationOrder` prevents unnecessary effect re-runs
3. **Proper Dependencies**: Include all values used in effect
4. **Two-Layer Defense**: Client prevents, server rejects
5. **Database as Source of Truth**: Check actual orders, not just client state

## What to Watch For

### Success Indicators:
✅ Console shows: "Order Added - General Consultation" only ONCE per encounter
✅ Network tab shows: Only ONE POST to /api/order-lines for consultation
✅ Billing shows: Correct total without duplicate fees

### Failure Indicators:
❌ Multiple "Order Added - General Consultation" toasts
❌ Multiple POST requests to /api/order-lines with same encounter
❌ Server logs show "Blocked duplicate consultation" on normal usage
❌ Total fee increases on page refresh

## Debug Information

If issues occur, check:
1. Browser console for errors
2. Network tab for duplicate API calls
3. Server logs for "[ORDER-LINES] Blocked duplicate consultation"
4. Database: `SELECT * FROM order_lines WHERE relatedType = 'consultation' AND encounterId = 'XXX'`

## Rollback Plan

If this fix causes issues:
1. Revert to commit: `cd58e45` (before this PR)
2. Or disable auto-consultation in Treatment.tsx by commenting out the useEffect

## Contact

For issues or questions about this fix, refer to:
- PR: #[PR_NUMBER]
- Issue: Consultation Fee STILL Being Added Multiple Times
- Commits: 74d24a7, 8841041
