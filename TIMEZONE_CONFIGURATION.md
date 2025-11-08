# Timezone Configuration Guide

## Overview

The Medical Management System uses comprehensive timezone-aware date handling with Africa/Juba (UTC+2) as the clinic timezone. This ensures consistent filtering and day classification across all pages.

## Architecture

### Core Module: `shared/clinic-date.ts`

This module provides a single source of truth for all date/time operations:

```typescript
import { getClinicDayKey, getClinicNow, getPresetRange, CLINIC_TZ } from '@shared/clinic-date';

// Get today's clinic day key
const today = getClinicDayKey(); // "2025-11-08"

// Get current time in clinic timezone
const now = getClinicNow();

// Get date range for filtering
const range = getPresetRange('today');
// Returns: { 
//   startUtc: Date(...),
//   endUtc: Date(...),
//   startClinicDayKey: "2025-11-08",
//   endClinicDayKey: "2025-11-09"
// }
```

### Key Concepts

1. **Clinic Day Key**: A string in `YYYY-MM-DD` format representing a day in Africa/Juba timezone
2. **Date Ranges**: Always `[start, end)` - inclusive start, exclusive end
3. **UTC Storage**: All timestamps stored in UTC, converted to/from clinic timezone as needed
4. **Two-Column Strategy**:
   - Date-only columns (`requestedDate`, `visitDate`): Store clinic day keys (YYYY-MM-DD)
   - Timestamp columns (`createdAt`, `completedDate`): Store UTC timestamps

## How "Today" is Computed

The system uses the clinic timezone for all day computations:

1. **Clinic Timezone**: Africa/Juba (UTC+2) - South Sudan's timezone since Feb 1, 2021
2. **UTC Storage**: All timestamps are stored in UTC in the database
3. **Date Range Definition**: Date ranges use `[start, end)` format - inclusive start, exclusive end
4. **Conversion**: Dates are converted to/from the clinic timezone only when:
   - Computing date ranges for filters
   - Displaying dates to users
   - Storing clinic day keys

### Example

For a clinic in Juba (UTC+2), on 2025-11-08:
- "Today" means: `[2025-11-08T00:00:00+02:00, 2025-11-09T00:00:00+02:00)`
- In UTC, this is: `[2025-11-07T22:00:00Z, 2025-11-08T22:00:00Z)`
- Any record with a timestamp in this UTC range is included in "Today"

### Last 7 Days Logic

"Last 7 Days" means today minus 6 previous days (7 full days total including today):
- If today is Nov 8, Last 7 Days includes: Nov 2, 3, 4, 5, 6, 7, 8
- Range: `[2025-11-02T00:00:00+02:00, 2025-11-09T00:00:00+02:00)` in clinic time
- This is a proper superset of "Today" and "Yesterday"

## Configuration

### Environment Variables

Set the clinic timezone in your `.env` file:

```bash
# Server-side clinic timezone (IANA timezone identifier)
# Default: Africa/Juba (UTC+2) - recommended for South Sudan clinics
CLINIC_TZ=Africa/Juba

# Client-side timezone (must match CLINIC_TZ)
VITE_CLINIC_TZ=Africa/Juba

# Enable debug mode (optional)
DEBUG_TIMEZONE=true
VITE_DEBUG_TIMEZONE=true
```

### Debug Mode

When debug mode is enabled, a banner appears showing:
- Browser Local Time
- UTC Time
- Africa/Juba Time
- Current Clinic Day Key

Access the debug endpoint at: `GET /api/debug/time` (requires `DEBUG_TIMEZONE=true`)

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

- **today**: Current day from 00:00:00 to 23:59:59 in clinic timezone
- **yesterday**: Previous day from 00:00:00 to 23:59:59 in clinic timezone
- **last7**: Last 7 days including today (today minus 6 days)
- **last30**: Last 30 days including today (today minus 29 days)
- **all**: No date filtering
- **custom**: Custom date range with from/to parameters

### API Parameters

Endpoints accept these query parameters:

```typescript
// Using presets
GET /api/lab-tests?preset=today
GET /api/xray-exams?preset=last7

// Using custom ranges (clinic day keys)
GET /api/lab-tests?preset=custom&from=2025-11-01&to=2025-11-07

// Legacy support (ISO timestamps)
GET /api/lab-tests?startDate=2025-11-01T00:00:00Z&endDate=2025-11-07T23:59:59Z
```

### Field Mapping

Different pages use different fields for filtering:

| Page | Primary Field | Column Type | Notes |
|------|--------------|-------------|-------|
| **Patients** | `createdAt` | Timestamp (UTC) | Filters by registration date |
| **Lab Requests** | `requestedDate` | Clinic Day Key | Filters by when test was requested |
| **X-Ray** | `requestedDate` | Clinic Day Key | Filters by when exam was requested |
| **Ultrasound** | `requestedDate` | Clinic Day Key | Filters by when exam was requested |
| **Treatments** | `visitDate` | Clinic Day Key | Filters by visit/encounter date |

## Technical Details

### Date Utility Functions

The `shared/clinic-date.ts` module provides:

```typescript
// Constants
export const CLINIC_TZ = 'Africa/Juba';

// Core functions
export function getClinicNow(): Date;
export function getClinicDayKey(date?: Date | string): string;
export function getPresetRange(preset: DatePreset, customFrom?: Date, customTo?: Date): ClinicDateRange | null;
export function parseRangeParams(params: { preset?, from?, to? }): ClinicDateRange | null;
export function formatDateInZone(date: Date, format?: string): string;

// Type definitions
export type DatePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'all' | 'custom';
export interface ClinicDateRange {
  startUtc: Date;
  endUtc: Date;
  startClinicDayKey: string;
  endClinicDayKey: string;
}
```

### Storage Layer Filtering

Date filtering in the storage layer:

```typescript
// For date-only columns (requestedDate, visitDate)
// Use clinic day keys with string comparison
WHERE requestedDate >= startClinicDayKey 
  AND requestedDate < endClinicDayKey

// For timestamp columns (createdAt, completedAt)
// Use UTC timestamps with date comparison
WHERE createdAt >= startUtc 
  AND createdAt < endUtc
```

### API Response Format

When requesting date ranges:

```json
{
  "startUtc": "2025-11-07T22:00:00.000Z",
  "endUtc": "2025-11-08T22:00:00.000Z",
  "startClinicDayKey": "2025-11-08",
  "endClinicDayKey": "2025-11-09"
}
```

## Troubleshooting

### "Today" shows different results on different pages

**Cause**: Different timestamp fields being compared or timezone mismatch

**Solution**: 
1. Verify `CLINIC_TZ` and `VITE_CLINIC_TZ` match in `.env`
2. Clear browser cache and restart server
3. Check that timestamps are stored correctly (UTC for timestamps, clinic day keys for dates)
4. Enable debug mode to verify clinic day key computation

### Records appear one day early/late

**Cause**: Timezone offset not applied correctly

**Solution**:
1. Verify `CLINIC_TZ` is set correctly (use `Africa/Juba` for South Sudan)
2. Ensure database stores timestamps in UTC
3. Check server logs for timezone warnings
4. Verify form submissions use `getClinicDayKey()` not `new Date().toISOString().split('T')[0]`

### Last 7 Days doesn't include Today

**Cause**: Off-by-one error in range calculation

**Solution**: This should not occur with the new implementation. Last 7 Days explicitly includes today (6 previous days + today = 7 total days). If you encounter this, check that you're using the latest version of `getPresetRange('last7')`.

### Debug banner not showing

**Cause**: Debug mode not enabled

**Solution**: Set both environment variables:
```bash
DEBUG_TIMEZONE=true
VITE_DEBUG_TIMEZONE=true
```
Then restart both client and server.

## Migration Notes

### Upgrading from Previous Version

If you're upgrading from a version without the new clinic-date module:

1. **Backup your database** before upgrading
2. Existing timestamps in UTC are compatible - no data migration needed
3. Clinic day keys (requestedDate, visitDate) should already be in YYYY-MM-DD format
4. Update your `.env` file with timezone settings
5. Restart both client and server
6. Test "Today" filters on all pages
7. Enable debug mode to verify clinic day key consistency

### Data Consistency Check

To verify your data is consistent:

1. Enable debug mode
2. Check `/api/debug/time` endpoint - verify clinicDayKey matches client
3. Create a test record and verify it appears in "Today" filter
4. Check that date-only fields contain YYYY-MM-DD strings
5. Check that timestamp fields contain ISO 8601 UTC strings

## Best Practices

### When Creating Records

Always use clinic day keys for date-only fields:

```typescript
// ✅ Correct - uses clinic timezone
const record = {
  requestedDate: getClinicDayKey(),
  createdAt: new Date().toISOString(), // UTC timestamp
};

// ❌ Wrong - uses UTC day
const record = {
  requestedDate: new Date().toISOString().split('T')[0],
  createdAt: new Date().toISOString(),
};
```

### When Filtering Records

Always use preset or clinic day key parameters:

```typescript
// ✅ Correct - uses preset
const response = await fetch('/api/lab-tests?preset=today');

// ✅ Correct - uses clinic day keys
const response = await fetch('/api/lab-tests?from=2025-11-01&to=2025-11-07');

// ⚠️ Legacy - still supported but deprecated
const response = await fetch('/api/lab-tests?startDate=2025-11-01T00:00:00Z');
```

### When Displaying Dates

Use `formatDateInZone` for user-facing dates:

```typescript
// ✅ Correct - formats in clinic timezone
const displayDate = formatDateInZone(new Date(), 'PPP'); // "November 8, 2025"

// ❌ Wrong - uses browser/server timezone
const displayDate = new Date().toLocaleDateString();
```

## See Also

- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [date-fns-tz Documentation](https://github.com/marnusw/date-fns-tz)
- Phase 2 Implementation PR: Full Date/Time Standardization
