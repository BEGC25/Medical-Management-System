# Clinic Day Unification - Technical Summary

## Problem Statement

The system had inconsistent preset results across different modules (Patients, Laboratory, X-Ray, Ultrasound, Treatment) when using date filters like "Today", "Yesterday", "Last 7 Days", etc. 

**Root Causes:**
1. Different modules filtered by different date fields:
   - Patients: `created_at` or `clinic_day`
   - Lab/XRay/Ultrasound: `requested_date` (user-scheduled date, not creation date)
   - Encounters/Treatment: `visit_date` (user-scheduled date, not creation date)
2. Some pages performed client-side date filtering using browser timezone
3. Inconsistent range logic (inclusive vs exclusive end dates)
4. Missing `clinic_day` column on most tables

**Result:** The same patient record (e.g., Lam K / BGC54) created on clinic day 2025-11-09 would appear under "Today" on one page but not another, depending on which date field was used for filtering.

## Solution: Option A - Canonical Clinic Day

Unify all modules to filter by a single `clinic_day` field representing the date (in Africa/Juba timezone) when the record was created, regardless of user-input scheduling dates.

### Key Principles

1. **Creation Date, Not Scheduled Date:** Presets filter by when the record was created, not when services are scheduled
2. **Server-Side Filtering Only:** No client-side date slicing or timezone conversion
3. **Single Timezone:** All clinic days calculated in Africa/Juba (UTC+2, no DST)
4. **Consistent Range Logic:** Inclusive start and end for date columns

## Technical Implementation

### 1. Database Schema Changes

Added `clinic_day` TEXT column to all clinical activity tables:
- `patients` (already existed, verified)
- `encounters` (new)
- `treatments` (new)
- `lab_tests` (new)
- `xray_exams` (new)
- `ultrasound_exams` (new)

**Format:** YYYY-MM-DD string (e.g., "2025-11-09")

**Backfill:** Extracted from `created_at` timestamps:
```sql
-- SQLite
UPDATE lab_tests 
SET clinic_day = DATE(DATETIME(SUBSTR(created_at, 1, 19), '+2 hours'))
WHERE clinic_day IS NULL;
```

**Indexes:** Created on each `clinic_day` column for performance

### 2. Server-Side Changes

#### Storage Layer (`server/storage.ts`)

**Import:**
```typescript
import { getClinicDayKey } from "@shared/clinic-date";
```

**Create Operations:** All create functions now set `clinic_day`:
```typescript
async createLabTest(data: schema.InsertLabTest): Promise<schema.LabTest> {
  const testId = await generateLabId();
  const now = new Date().toISOString();
  const clinicDay = getClinicDayKey(new Date()); // Sets to Africa/Juba date

  const insertData: any = {
    ...data,
    testId,
    status: "pending",
    clinicDay, // NEW: Set clinic day for filtering
    createdAt: now,
  };

  const [labTest] = await db.insert(labTests).values(insertData).returning();
  return labTest;
}
```

**Query Operations:** Changed filtering from `requestedDate` to `clinicDay`:
```typescript
async getLabTests(status?: string, date?: string, startDate?: string, endDate?: string) {
  // ...
  
  // OLD: conditions.push(gte(labTests.requestedDate, startDate))
  // NEW: Filter by clinic_day instead
  if (startDate && endDate) {
    conditions.push(
      and(
        gte(labTests.clinicDay, startDate),
        lte(labTests.clinicDay, endDate)  // Inclusive end for date columns
      )
    );
  }
  
  // ...
  const results = await query.orderBy(desc(labTests.createdAt)); // Order by creation time
}
```

**Applied to:** `createLabTest`, `getLabTests`, `createXrayExam`, `getXrayExams`, `createUltrasoundExam`, `getUltrasoundExams`, `createTreatment`, `getTreatments`, `createEncounter`, `createPatient` (already done)

#### Routes Layer (`server/routes.ts`)

**Treatment Endpoint:** Updated to use unified clinic-range filtering:
```typescript
router.get("/api/treatments", async (req, res) => {
  // Parse date range using unified utilities
  const range = parseClinicRangeParams(req.query, true);
  const dayKeys = rangeToDayKeys(range);

  // Apply date range filtering if provided
  if (dayKeys) {
    const treatments = await storage.getTreatments(limit, dayKeys.start, dayKeys.end);
    res.json(treatments);
    return;
  }

  // Default: return all treatments
  const treatments = await storage.getTreatments(limit);
  res.json(treatments);
});
```

Lab, XRay, and Ultrasound endpoints already used the unified pattern.

#### Utilities (`server/utils/clinic-range.ts`)

**Enhanced `rangeToDayKeys`:** Fixed to return inclusive end date:
```typescript
export function rangeToDayKeys(
  range: { start: Date; end: Date } | null
): { start: string; end: string } | null {
  if (!range) return null;
  
  // For date-only columns, we want inclusive bounds
  // range.end is exclusive in timestamp terms, so subtract 1ms to get last inclusive day
  const startDayKey = getClinicDayKey(range.start);
  const endDayKey = getClinicDayKey(new Date(range.end.getTime() - 1));
  
  return {
    start: startDayKey,
    end: endDayKey,
  };
}
```

**Added `getCurrentClinicDayKey`:** Helper for getting current clinic day.

### 3. Client-Side Changes

#### Query Hooks

Updated query hooks to pass preset parameters to server:

**Before (XRay):**
```typescript
function useXrayExams() {
  return useQuery<XrayExam[]>({
    queryKey: ['/api/xray-exams'],
  });
}
```

**After:**
```typescript
function useXrayExams(preset: string, customStart?: Date, customEnd?: Date) {
  return useQuery<XrayExam[]>({
    queryKey: ['/api/xray-exams', { preset, customStart, customEnd }],
    queryFn: async () => {
      const url = new URL("/api/xray-exams", window.location.origin);
      
      if (preset && preset !== 'custom') {
        url.searchParams.set("preset", preset);
      } else if (preset === 'custom' && customStart && customEnd) {
        const fromKey = getClinicDayKey(customStart);
        const toKey = getClinicDayKey(customEnd);
        url.searchParams.set("preset", "custom");
        url.searchParams.set("from", fromKey);
        url.searchParams.set("to", toKey);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch xray exams");
      return response.json();
    },
  });
}
```

**Applied to:** `useXrayExams`, `useUltrasoundExams`, Treatment queue query

#### Removed Client-Side Filtering

**Before (XRay):**
```typescript
// Calculate date range and filter exams client-side
const dateFilteredExams = useMemo(() => {
  if (!getDateRange) return allXrayExams;
  return allXrayExams.filter((e) => {
    const examDate = new Date(e.requestedDate);
    return examDate >= getDateRange.start && examDate < getDateRange.end;
  });
}, [allXrayExams, getDateRange]);
```

**After:**
```typescript
// Server handles all filtering - just split by status
const { data: allXrayExams = [] } = useXrayExams(dateFilter, customStartDate, customEndDate);
const dateFilteredPending = allXrayExams.filter((e) => e.status === 'pending');
const dateFilteredCompleted = allXrayExams.filter((e) => e.status === 'completed');
```

**Applied to:** XRay page, Ultrasound page

### 4. Migration Script

Created `sql/2025-11-09_clinic_day_unification.sql`:
- Adds `clinic_day` columns (nullable initially)
- Backfills from `created_at` timestamps using Africa/Juba timezone
- Creates indexes on `clinic_day` columns
- Includes verification queries

Safe for production: All changes are additive, no data loss.

## API Contract Changes

### Request Parameters

**Standard Presets:**
```
GET /api/patients?preset=today
GET /api/lab-tests?preset=yesterday
GET /api/xray-exams?preset=last7
GET /api/ultrasound-exams?preset=last30
```

**Custom Range:**
```
GET /api/treatments?preset=custom&from=2025-11-01&to=2025-11-09
```

**Legacy Support (deprecated):**
```
GET /api/patients?today=1  → mapped to preset=today
GET /api/lab-tests?date=2025-11-09  → mapped to preset=custom&from=...&to=...
```

### Query Keys (React Query)

**Before:**
```typescript
queryKey: ['/api/xray-exams']
```

**After:**
```typescript
queryKey: ['/api/xray-exams', { preset: 'today', customStart: undefined, customEnd: undefined }]
```

This ensures proper cache invalidation when preset changes.

## Benefits

1. **Consistency:** Same record appears under same preset everywhere
2. **Simplicity:** Single source of truth for date filtering
3. **Performance:** Indexed `clinic_day` columns enable fast queries
4. **Maintainability:** No client-side timezone logic or date slicing
5. **Correctness:** Server authoritative for timezone, eliminates browser timezone issues
6. **Testability:** Easy to verify with SQL queries

## Trade-offs

### Scheduled Future Items

Records scheduled for future dates (via `requested_date` or `visit_date`) will NOT appear under "Today" unless they were created today.

**Example:**
- Lab test ordered today for tomorrow: Appears under "Today" (created today)
- Future appointment scheduled last week for today: Does NOT appear under "Today" (created last week)

This is **intentional** per Option A design. If future scheduling visibility is needed, a separate "Scheduled" view can be added that filters by `requested_date`/`visit_date`.

### Historical Data

Existing records backfilled from `created_at` timestamps. If original timezone was not Africa/Juba, there may be ±1 day variance for records created near midnight UTC. This is acceptable as it's a one-time migration issue.

## Testing Recommendations

1. **SQL Verification:** Run verification queries in migration script
2. **Cross-Module Consistency:** Test same patient appears under same preset on all pages
3. **Edge Cases:** Test records created at 23:59 and 00:01 Africa/Juba time
4. **Custom Ranges:** Verify from/to parameters work correctly
5. **Performance:** Check query times on large datasets with indexes

## Future Enhancements

1. **Scheduled View:** Add separate tab/filter for future-scheduled items
2. **Date Display:** Show both `clinic_day` and `requested_date` in UI where relevant
3. **Audit Trail:** Log when records are created vs scheduled dates
4. **Analytics:** Report on scheduling vs creation day patterns

## Files Changed

### Schema & Migration
- `shared/schema.ts` - Added `clinicDay` field to tables
- `sql/2025-11-09_clinic_day_unification.sql` - Migration script

### Server
- `server/storage.ts` - Updated create/get functions
- `server/routes.ts` - Updated treatment endpoint
- `server/utils/clinic-range.ts` - Enhanced utilities

### Client
- `client/src/pages/XRay.tsx` - Preset-based queries
- `client/src/pages/Ultrasound.tsx` - Preset-based queries
- `client/src/pages/Treatment.tsx` - Preset-based queue

### Documentation
- `CLINIC_DAY_UNIFICATION_GUIDE.md` - Deployment guide
- `CLINIC_DAY_UNIFICATION_TECHNICAL.md` - This file

## Validation Checklist

- [ ] Migration applied successfully
- [ ] All tables have indexes on `clinic_day`
- [ ] No NULL `clinic_day` values after migration
- [ ] New patient registration sets `clinic_day`
- [ ] Lab test creation sets `clinic_day`
- [ ] XRay exam creation sets `clinic_day`
- [ ] Ultrasound exam creation sets `clinic_day`
- [ ] Treatment creation sets `clinic_day`
- [ ] "Today" shows same records across all pages
- [ ] "Yesterday" shows consistent results
- [ ] "Last 7 Days" shows 7 days of records
- [ ] Custom range works correctly
- [ ] Network requests show preset parameters
- [ ] No client-side date filtering in console logs
