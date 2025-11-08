# Timezone Configuration Guide

## Overview

The Medical Management System uses timezone-aware date handling to ensure consistent filtering across all pages. This is particularly important for "Today" filters, which should show the same records on the Patients page and Laboratory Requests page.

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

### Date Utility Functions

The system provides shared date utilities in `shared/date-utils.ts`:

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

### API Endpoints

Both frontend and backend use the same date range computation:

**Frontend** (using `getDateRangeForAPI`):
```typescript
const range = getDateRangeForAPI('today');
// Returns: { startDate: "2025-01-14T21:00:00.000Z", endDate: "2025-01-15T21:00:00.000Z" }
```

**Backend** (using `parseDateFilter`):
```typescript
const range = parseDateFilter({ preset: 'today' });
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
