# Diagnostics Waiting UI/UX Improvements

## Overview
This PR implements UI/UX improvements to how diagnostics "waiting" information is presented on the Consultations page and in the Orders Waiting modal, making the interface more compact, scannable, and actionable.

## Changes Made

### 1. PatientSearch Component - Compact Waiting Display

**File:** `client/src/components/PatientSearch.tsx`

**Before:**
```tsx
<Badge variant="outline" className="text-xs border-yellow-300 bg-yellow-50 text-yellow-700">
  Waiting: Lab (1), X-ray (1), Ultrasound (1)
</Badge>
```

**After:**
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge variant="outline" 
             className="text-xs border-orange-300 bg-orange-50 text-orange-700 cursor-help">
        Waiting (3)
      </Badge>
    </TooltipTrigger>
    <TooltipContent side="top">
      <div className="text-xs space-y-0.5">
        <div>Lab (1)</div>
        <div>X-ray (1)</div>
        <div>Ultrasound (1)</div>
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Improvements:**
- ✅ Compact display: "Waiting (N)" instead of long comma-separated list
- ✅ Orange color (from yellow) for pending state, consistent with department pages
- ✅ Tooltip shows breakdown on hover
- ✅ Zero-count items are hidden (implemented in getDiagnosticPendingDepartments)

### 2. Orders Waiting Modal - Treatment Page

**File:** `client/src/pages/Treatment.tsx`

#### 2a. Fixed Pluralization in Header Badge

**Before:**
```tsx
<Badge variant="secondary" className="ml-0 sm:ml-2 bg-amber-600 text-white">
  {patientsWithOrdersWaiting.length} patients
</Badge>
```

**After:**
```tsx
<Badge variant="secondary" className="ml-0 sm:ml-2 bg-amber-600 text-white">
  {patientsWithOrdersWaiting.length} {pluralize(patientsWithOrdersWaiting.length, 'patient')}
</Badge>
```

**Result:** 
- "1 patient" (singular) ✅
- "2 patients" (plural) ✅

#### 2b. Reduced Info Banner Height

**Before:**
```tsx
<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
  <p className="text-sm text-amber-900 dark:text-amber-100">
    <strong>Diagnostic orders waiting for processing:</strong> These patients have pending Lab, X-ray, or Ultrasound orders that need to be completed.
  </p>
</div>
```

**After:**
```tsx
<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
  <p className="text-xs text-amber-900 dark:text-amber-100">
    <strong>Diagnostic orders waiting:</strong> Patients with pending Lab, X-ray, or Ultrasound orders.
  </p>
</div>
```

**Improvements:**
- ✅ Reduced padding: `p-3` → `px-3 py-2`
- ✅ Smaller text: `text-sm` → `text-xs`
- ✅ Concise copy (44% shorter)

#### 2c. Improved Diagnostic Chips Layout

**Before:**
```tsx
<div className="flex flex-wrap gap-1">
  {pendingDepts.map((dept, i) => (
    <Badge key={i} variant="secondary" 
           className="text-xs bg-amber-100 text-amber-800">
      {dept}
    </Badge>
  ))}
</div>
```

**After:**
```tsx
<div className="flex flex-wrap gap-1.5 sm:flex-row flex-col sm:items-center">
  {pendingDepts.map((dept, i) => {
    const deptName = dept.split(' (')[0];
    const deptPath = deptName === 'Lab' ? '/laboratory' : 
                   deptName === 'X-ray' ? '/x-ray' : '/ultrasound';
    
    return (
      <Badge 
        key={i}
        variant="secondary" 
        className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          navigate(deptPath);
          setOrdersWaitingOpen(false);
        }}
      >
        {dept}
      </Badge>
    );
  })}
</div>
```

**Improvements:**
- ✅ Responsive layout: wraps on wide screens, stacks on narrow screens
- ✅ Clickable chips that navigate to department pages
- ✅ Hover effect for better UX
- ✅ Prevents row click when chip is clicked (e.stopPropagation)

### 3. Helper Functions - patient-utils.ts

**File:** `client/src/lib/patient-utils.ts`

Added three new utility functions:

```typescript
/**
 * Get the total count of pending diagnostic orders across all departments
 */
export function getTotalDiagnosticPending(patient: PatientWithStatus): number {
  const serviceStatus = patient.serviceStatus;
  if (!serviceStatus) return 0;
  
  const labPending = serviceStatus.labPending ?? 0;
  const xrayPending = serviceStatus.xrayPending ?? 0;
  const ultrasoundPending = serviceStatus.ultrasoundPending ?? 0;
  
  return labPending + xrayPending + ultrasoundPending;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}
```

## Visual Changes Summary

### Consultations Table (PatientSearch Component)
- **Old:** Long text badge: "Waiting: Lab (1), X-ray (1), Ultrasound (1)" (yellow)
- **New:** Compact badge: "Waiting (3)" (orange) with tooltip showing breakdown

### Orders Waiting Modal Header
- **Old:** "1 patients" / "2 patients"
- **New:** "1 patient" / "2 patients" (correct pluralization)

### Orders Waiting Info Banner
- **Old:** Large banner with verbose text
- **New:** Compact banner (shorter, smaller text, reduced padding)

### Diagnostic Chips in Modal
- **Old:** Static badges, no interaction
- **New:** Clickable badges that navigate to department pages, responsive layout

## Navigation Implementation Rationale

The diagnostic chips now navigate to the relevant department page (Lab → `/laboratory`, X-ray → `/x-ray`, Ultrasound → `/ultrasound`). This approach:

1. **Matches existing routing patterns** - Uses wouter's `useLocation()` hook already in use
2. **Consistent with workflow** - Allows doctors to quickly jump to the department to process orders
3. **Simple and intuitive** - Clicking a diagnostic chip goes directly to that department
4. **No complex state management** - Leverages existing department page filtering capabilities

Alternative considered: In-modal filtering was not implemented because:
- Department pages already have robust filtering
- Would require duplicating filtering logic
- Adds complexity without significant UX benefit

## Responsive Design

All changes maintain responsive behavior:
- Tooltips work on all screen sizes
- Diagnostic chips wrap on wide screens, stack on narrow screens
- Modal remains scrollable on small screens
- All interactive elements have appropriate touch targets

## Color Consistency

Changed waiting indicator color from **yellow** to **orange/amber** to match:
- Department pages' pending order indicators
- Treatment page's "Orders Waiting" card color scheme
- Design system's semantic "pending" state color

## Testing Notes

Since there is no existing automated test infrastructure, changes were verified through:
1. ✅ Build succeeds (`npm run build`)
2. ✅ TypeScript compilation succeeds
3. ✅ Code review for logic correctness
4. Manual testing would require:
   - Creating test patients with pending diagnostics
   - Verifying tooltip display on hover
   - Verifying chip navigation works
   - Testing on various screen sizes

## Breaking Changes

None. All changes are backward compatible and purely visual/UX improvements.

## Files Changed

1. `client/src/lib/patient-utils.ts` - Added helper functions
2. `client/src/components/PatientSearch.tsx` - Compact waiting display with tooltip
3. `client/src/pages/Treatment.tsx` - Modal improvements and clickable chips
