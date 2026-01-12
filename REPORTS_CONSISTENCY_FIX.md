# Reports Page Consistency Fix

## Summary
Fixed inconsistencies in the Reports page where widgets showed contradictory data under the same date range.

## Issues Fixed

### 1. Inconsistent Visit Counts
**Problem**: KPIs showed "Total Visits=2" but Visits Trend chart displayed "No visit data available" for the same period.

**Root Cause**: The dashboard endpoint was using the `treatments` table for trends while `getDashboardStats` used the `encounters` table for counting visits. Since encounters and treatments have a many-to-one relationship, counts didn't match.

**Fix**: Changed `/api/reports/dashboard` endpoint (line 3711 in `server/routes.ts`) to use `encounters` table for trends data, matching the KPI calculation.

### 2. Confusing Pending Backlog Scope
**Problem**: "Pending Backlog" widget showed global/current pending counts, but users thought it was period-scoped because it appeared next to period-filtered widgets.

**Fix**: 
- Updated PendingBacklog component title to "Pending Backlog (Current)"
- Changed subtitle to "All pending items right now" 
- Removed pending stats from "Period Summary" section (was showing global counts mixed with period stats)
- Created dedicated `/api/reports/backlog` endpoint for explicit current backlog queries

### 3. Ambiguous Recent Activity
**Problem**: "Recent Activity" widget showed patients from any time period, not filtered by selected date range, causing confusion.

**Fix**: Updated label to "Recent Activity (Overall)" to clearly indicate it's not period-filtered.

### 4. Export Clarity
**Problem**: CSV and PDF exports mixed period-scoped stats with current/global backlog without clear labels.

**Fix**: 
- Added section headers: "Summary Statistics (Period-Scoped)" and "Current Pending Backlog (All Pending Right Now)"
- Separated the two categories in exports

## API Changes

### New Endpoint: `/api/reports/backlog`
Returns current pending backlog (all pending items system-wide right now).

**Response**:
```json
{
  "total": 9,
  "labResults": 5,
  "xrayReports": 3,
  "ultrasoundReports": 1,
  "metadata": {
    "scope": "current",
    "description": "All pending items system-wide right now",
    "generatedAt": "2026-01-12T05:45:00.000Z"
  }
}
```

### Modified Endpoint: `/api/reports/dashboard`
- Now uses `encounters` table for both visit counts and trends (consistency fix)
- Trends array always includes all days in the selected range (including zero-visit days)

## Design Decisions

1. **Visits = Encounters**: Defined visits consistently as encounters, not treatments
2. **Pending = Current/Global**: Pending backlog always reflects current state (all pending right now), independent of date filters
3. **Clear Labeling**: All widgets and exports clearly indicate whether data is period-scoped or current/global

## Testing Recommendations

1. Test with "Today" filter and no data - should show all zeros, no contradictions
2. Test with "Today" filter and real encounters - Total Visits should match Visits Trend chart
3. Verify Pending Backlog shows same count regardless of date filter selection
4. Check CSV/PDF exports clearly separate period stats from current backlog

## Files Modified

- `server/routes.ts`: Fixed dashboard endpoint to use encounters, added backlog endpoint
- `client/src/pages/Reports.tsx`: Updated labels, removed pending from Period Summary, fixed exports
- `client/src/components/reports/PendingBacklog.tsx`: Updated title and subtitle to clarify scope

## Notes

- Old endpoints (`/api/reports/summary`, `/api/reports/trends`, `/api/reports/insights`) are still present but unused by Reports page
- These could potentially be removed in a future cleanup if confirmed unused elsewhere
- AI Insights generation is server-side only (no client-side fallback) - already correct
