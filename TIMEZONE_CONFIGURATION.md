# Timezone Configuration Guide

## Overview

The Medical Management System uses timezone-aware date handling to ensure consistent filtering and date stamping across all pages. This is particularly important for "Today" filters and when creating new records, which should consistently use the clinic's local day in Africa/Juba (UTC+2).

## Clinic Day Key Concept

A **Clinic Day Key** is the single source of truth for determining what day it is at the clinic. It is:

- A string in `YYYY-MM-DD` format
- Always computed in the clinic's timezone (Africa/Juba, UTC+2)
- Used for stamping all new records (patients, lab orders, treatments, etc.)
- **Never derived from UTC** (which would cause midnight boundary errors)

### Why Not Use `new Date().toISOString().split('T')[0]`?

❌ **WRONG**: `new Date().toISOString().split('T')[0]` returns the UTC day, not the clinic day.

```javascript
// At 2025-11-08 00:30 Africa/Juba time (2025-11-07 22:30 UTC)
const utcDay = new Date().toISOString().split('T')[0];
// Returns "2025-11-07" ❌ Wrong! It's already Nov 8 in Juba!
```

✅ **CORRECT**: Use `getClinicDayKey()` from shared/clinic-date.ts:

```javascript
import { getClinicDayKey } from '@shared/clinic-date';

// At 2025-11-08 00:30 Africa/Juba time
const clinicDay = getClinicDayKey();
// Returns "2025-11-08" ✅ Correct!
```

## How "Today" is Computed

The system uses the following approach:

1. **Clinic Timezone**: All date computations use the configured clinic timezone (default: `Africa/Juba` UTC+2 for South Sudan)
2. **UTC Storage**: All timestamps are stored in UTC in the database
3. **Date Range Definition**: Date ranges use **[start, end)** format - inclusive start, exclusive end - to avoid off-by-one errors at midnight
4. **Conversion**: Dates are converted to/from the clinic timezone only when:
   - Computing date ranges for filters
   - Displaying dates to users

### Example

For a clinic in Juba (UTC+2), on 2025-01-15:
- "Today" means: `[2025-01-15T00:00:00+02:00, 2025-01-16T00:00:00+02:00)`
- In UTC, this is: `[2025-01-14T22:00:00Z, 2025-01-15T22:00:00Z)`
- Any record with a timestamp in this UTC range is included in "Today"

## Configuration

### Environment Variables

Set the clinic timezone in your `.env` file:

```bash
# Clinic timezone (IANA timezone identifier)
# Default: Africa/Juba (UTC+2) - recommended for South Sudan clinics
# Note: South Sudan switched from UTC+3 to UTC+2 on February 1, 2021
CLINIC_TZ=Africa/Juba

# Client-side timezone (must match CLINIC_TZ)
VITE_CLINIC_TZ=Africa/Juba

# Optional: Enable debug time banner for QA validation
# Shows current time in multiple timezones at top of app
# Default: false (off)
VITE_SHOW_TIME_DEBUG=false
```

### Supported Timezones

Use IANA timezone identifiers. Examples:

- `Africa/Juba` - South Sudan (UTC+2) ⭐ **Recommended for South Sudan**
- `Africa/Khartoum` - Sudan (UTC+2)
- `Africa/Cairo` - Egypt (UTC+2)
- `Africa/Nairobi` - Kenya (UTC+3)
- `Africa/Kampala` - Uganda (UTC+3)

> **Note**: South Sudan uses UTC+2 (Central Africa Time - CAT) since February 1, 2021.

## Date Filters

### Presets

All date filter presets are computed using the clinic timezone:

- **Today**: Current day from 00:00:00 to 23:59:59 in clinic timezone
- **Yesterday**: Previous day from 00:00:00 to 23:59:59 in clinic timezone
- **Last 7 Days**: Last 7 days including today
- **This Month**: From start of current month to now
- **All**: No date filtering

### Field Mapping

Different pages use different timestamp fields for filtering:

| Page | Primary Field | Fallback Field | Notes |
|------|--------------|----------------|-------|
| **Patients** | `createdAt` | - | Filters by registration date |
| **Lab Requests** | `requestedDate` | `createdAt` | Filters by when test was requested |
| **Treatments** | `visitDate` | `createdAt` | Filters by visit/encounter date |

This ensures that:
- Patients page shows patients registered today
- Lab Requests page shows lab tests requested today
- Treatment page shows visits/encounters that occurred today

## Technical Details

### Clinic Day Key Utilities (Phase 1)

The system provides centralized clinic day utilities in `shared/clinic-date.ts`:

```typescript
// Clinic timezone constant
export const CLINIC_TZ = 'Africa/Juba';

// Get current time in clinic timezone
getClinicNow(): Date

// Get clinic day key (YYYY-MM-DD) for current or specific date
getClinicDayKey(date?: Date): string

// Convert clinic day key to UTC boundaries
clinicDayKeyStartUtc(dayKey: string): Date
clinicDayKeyEndUtcExclusive(dayKey: string): Date

// Get date range for presets or custom ranges
getPresetRange(preset: DatePreset | string, from?: string, to?: string): { start: Date; end: Date } | null

// Parse range parameters from query/props
parseRangeParams(params: { preset?: string; from?: string; to?: string }): { start: Date; end: Date } | null
```

### Legacy Date Utilities (Backward Compatibility)

For backward compatibility, `shared/date-utils.ts` still exists and provides:

```typescript
// Get current date/time in clinic timezone
getZonedNow(tz?: string): Date

// Get start of day in clinic timezone
startOfDayZoned(date: Date, tz?: string): Date

// Get end of day (exclusive) in clinic timezone
endOfDayZonedExclusive(date: Date, tz?: string): Date

// Get date range for a preset
getPresetRange(preset: DatePreset, tz?: string): { start: Date; end: Date } | null
```

**Client-side wrapper** (`client/src/lib/date-utils.ts`) re-exports both legacy and new utilities:
```typescript
// New Phase 1 utilities
export { CLINIC_TZ, getClinicNow, getClinicDayKey, parseRangeParams } from '@shared/clinic-date';

// Legacy utilities (backward compatibility)
export { formatDateInZone, getZonedNow } from '@shared/date-utils';
```

### Usage Examples

**Stamping new records:**
```typescript
import { getClinicDayKey } from '@/lib/date-utils';

// When creating lab order, treatment, etc.
const newLabOrder = {
  patientId: patient.id,
  requestedDate: getClinicDayKey(), // ✅ Uses clinic day
  // ... other fields
};
```

**Date filtering in components:**
```typescript
import { getClinicDayKey } from '@/lib/date-utils';

// Get today's clinic day for filtering
const today = getClinicDayKey();
const params = new URLSearchParams({ date: today });
```

### Debug Time Banner

Enable the debug time banner for QA validation:

```bash
# In .env file
VITE_SHOW_TIME_DEBUG=true
```

This shows a yellow banner at the top of the app displaying:
- Browser local time
- UTC time
- Africa/Juba time
- Current **Clinic Day Key**

Use this during testing to validate that day boundaries are computed correctly.

### API Endpoints

Both frontend and backend use the same date range computation:

**Frontend** (using `getDateRangeForAPI`):
```typescript
const range = getDateRangeForAPI('today');
// Returns: { startDate: "2025-01-14T21:00:00.000Z", endDate: "2025-01-15T21:00:00.000Z" }
```

**Backend** (Phase 2, using `parseClinicRangeParams`):
```typescript
import { parseClinicRangeParams } from '@/server/utils/clinic-range';

// In route handler
const range = parseClinicRangeParams(req.query);
// Returns: { start: Date, end: Date } in UTC
```

### Database Queries

Date range queries use the `[start, end)` pattern:

```typescript
// Inclusive start, exclusive end
WHERE timestamp >= startDate AND timestamp < endDate
```

This ensures:
- No gaps at midnight boundaries
- No double-counting of records
- Consistent behavior across all queries

## Phase 1 vs Phase 2 Implementation

### Phase 1 (Current) - Foundation

**Objectives:**
- Introduce centralized clinic-date utilities (`shared/clinic-date.ts`)
- Replace all client-side UTC date stamping with clinic day keys
- Add debug time banner for QA validation
- Prepare server utilities (not yet wired to endpoints)

**What's Fixed:**
- All new records (lab orders, treatments, X-rays, etc.) now stamp with the correct clinic day
- Client-side date filtering uses clinic day keys
- No more UTC midnight boundary errors in new data

**What's NOT Changed Yet:**
- Server route filtering still varies by endpoint (to be unified in Phase 2)
- Historical data may still have UTC day stamps (will be backfilled in Phase 2)
- Pending counts and aggregations use different logic across pages (Phase 2)

### Phase 2 (Planned) - Full Backend Unification

**Objectives:**
- Update all server routes to use `parseClinicRangeParams`
- Standardize query parameter handling (`preset`, `from`, `to`)
- Unify pending count calculations across Lab/X-ray/Ultrasound
- Run data migration/backfill to fix historical UTC day stamps
- Consolidate backend range filtering logic

**Expected Outcome:**
After Phase 2, filters on all pages will be fully consistent, and historical data will align with clinic days.

## Troubleshooting

### "Today" shows different results on different pages

**Cause**: Different timestamp fields being compared or timezone mismatch

**Solution**: 
1. Verify `CLINIC_TZ` and `VITE_CLINIC_TZ` match in `.env`
2. Clear browser cache and restart server
3. Check that timestamps are stored in UTC in the database

### Records appear one day early/late

**Cause**: Timezone offset not applied correctly

**Solution**:
1. Verify `CLINIC_TZ` is set correctly (use `Africa/Juba` for South Sudan)
2. Ensure database stores timestamps in UTC
3. Check server logs for timezone warnings

### Custom date range not working

**Cause**: Date picker returns local browser time instead of clinic time

**Solution**: The system automatically converts date picker values to clinic timezone. Ensure you're using the shared `parseCustomRange()` function.

## Migration Notes

If you're upgrading from a version without timezone support:

1. **Backup your database** before upgrading
2. Existing timestamps in UTC are compatible - no data migration needed
3. Update your `.env` file with `CLINIC_TZ` settings
4. Restart both client and server
5. Test "Today" filters on Patients and Lab Requests pages

## References

- Issue #7: Laboratory test requests not appearing due to default 'Today' filter
- Issue #8: Inconsistent "Today" filters across pages
- PR #6: Fix laboratory test requests not appearing due to default 'Today' filter

## See Also

- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [date-fns-tz Documentation](https://github.com/marnusw/date-fns-tz)
