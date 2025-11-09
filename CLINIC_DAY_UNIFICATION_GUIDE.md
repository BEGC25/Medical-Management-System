# Clinic Day Unification - Deployment Guide

## Overview

This update unifies date filtering across all modules (Patients, Laboratory, X-Ray, Ultrasound, Treatment) to use a single canonical `clinic_day` field based on Africa/Juba timezone. This ensures consistent preset results (Today/Yesterday/Last7/Last30) everywhere.

## What Changed

### Database Schema
- Added `clinic_day` TEXT column to: `encounters`, `treatments`, `lab_tests`, `xray_exams`, `ultrasound_exams`
- All new records automatically set `clinic_day` on creation
- Existing records backfilled from `created_at` timestamps

### Server-Side
- All create operations now set `clinic_day` using Africa/Juba timezone
- All preset queries filter by `clinic_day` instead of `requested_date`/`visit_date`
- Preset parameters: `today`, `yesterday`, `last7`, `last30`, `custom`
- Custom ranges use `from`/`to` parameters with YYYY-MM-DD format

### Client-Side
- Laboratory, XRay, Ultrasound, Treatment pages use server-side preset filtering
- No more client-side date slicing or timezone conversion
- Query keys include preset parameters for proper cache invalidation
- All pages show consistent results for the same preset

## Deployment Steps

### 1. Apply Database Migration

**SQLite (local development):**
```bash
# From the project root
sqlite3 clinic.db < sql/2025-11-09_clinic_day_unification.sql
```

**Neon/PostgreSQL (production):**
```sql
-- Run the commands in sql/2025-11-09_clinic_day_unification.sql
-- Adjust for PostgreSQL syntax if needed
```

### 2. Verify Migration

Run these queries to confirm the migration succeeded:

```sql
-- Check all records have clinic_day
SELECT 'patients' as table_name, COUNT(*) as missing FROM patients WHERE clinic_day IS NULL
UNION ALL
SELECT 'encounters', COUNT(*) FROM encounters WHERE clinic_day IS NULL
UNION ALL
SELECT 'treatments', COUNT(*) FROM treatments WHERE clinic_day IS NULL
UNION ALL
SELECT 'lab_tests', COUNT(*) FROM lab_tests WHERE clinic_day IS NULL
UNION ALL
SELECT 'xray_exams', COUNT(*) FROM xray_exams WHERE clinic_day IS NULL
UNION ALL
SELECT 'ultrasound_exams', COUNT(*) FROM ultrasound_exams WHERE clinic_day IS NULL;

-- Should return 0 for all tables
```

### 3. Deploy Backend

```bash
npm run build
npm start
# Or your production deployment command
```

### 4. Deploy Frontend

If using separate frontend deployment, rebuild and deploy the client:

```bash
npm run build
# Deploy dist/public/* to your hosting
```

### 5. Verification Testing

After deployment, test the following scenarios:

#### Test 1: Create New Patient Today
1. Register a new patient
2. Verify it appears under "Today" in Patients page
3. Verify the patient appears in SQL with today's clinic_day:
   ```sql
   SELECT patient_id, clinic_day, created_at FROM patients 
   ORDER BY created_at DESC LIMIT 1;
   ```

#### Test 2: Create Lab Test Today
1. Order a lab test for a patient
2. Verify it appears under "Today" in Laboratory page
3. Check SQL:
   ```sql
   SELECT test_id, clinic_day, created_at FROM lab_tests 
   ORDER BY created_at DESC LIMIT 1;
   ```

#### Test 3: Preset Consistency
1. Go to Patients page, select "Today" → note count
2. Go to Laboratory page, select "Today" → count should match new records created today
3. Go to XRay page, select "Today" → count should match
4. Go to Ultrasound page, select "Today" → count should match
5. Go to Treatment page, open queue → should show today's visits

#### Test 4: Yesterday/Last7/Last30
1. Select "Yesterday" preset on each page
2. Verify results are consistent across modules
3. Select "Last 7 Days" - should show records from last 7 clinic days
4. Select "Last 30 Days" - should show records from last 30 clinic days

#### Test 5: Custom Range
1. Select "Custom Range" on any page
2. Choose date range (e.g., last week)
3. Verify network request shows `preset=custom&from=YYYY-MM-DD&to=YYYY-MM-DD`
4. Verify results are filtered correctly

### 6. Validate Specific Patient (Lam K / BGC54)

If testing with the patient mentioned in the issue (Lam K / BGC54):

```sql
-- Check Lam K's records across all tables
SELECT 'patients' as source, patient_id, clinic_day, created_at 
FROM patients WHERE patient_id = 'BGC54'
UNION ALL
SELECT 'encounters', patient_id, clinic_day, created_at 
FROM encounters WHERE patient_id = 'BGC54'
UNION ALL
SELECT 'treatments', patient_id, clinic_day, created_at 
FROM treatments WHERE patient_id = 'BGC54'
UNION ALL
SELECT 'lab_tests', patient_id, clinic_day, created_at 
FROM lab_tests WHERE patient_id = 'BGC54'
UNION ALL
SELECT 'xray_exams', patient_id, clinic_day, created_at 
FROM xray_exams WHERE patient_id = 'BGC54'
UNION ALL
SELECT 'ultrasound_exams', patient_id, clinic_day, created_at 
FROM ultrasound_exams WHERE patient_id = 'BGC54';
```

All records should have the same `clinic_day` value. Then verify this patient appears under the correct preset on all pages.

## Rollback Plan

If issues occur, you can rollback by:

1. **Revert code changes**: Check out previous commit
2. **Database**: The migration is additive and safe - columns can remain
3. **Clients**: Clear browser cache to remove new query patterns

The migration doesn't remove any existing columns, so old code will continue to work with `requested_date`/`visit_date` if you rollback.

## Important Notes

### Scheduled Future Items
- `requested_date` and `visit_date` are still stored for display and scheduling purposes
- However, preset filters use `clinic_day` (creation date) only
- Future-dated items will NOT appear under "Today" unless created today
- This is intentional per Option A design

### Timezone Consistency
- All `clinic_day` values use Africa/Juba timezone (UTC+2, no DST)
- SQLite backfill adds 2 hours to UTC timestamps before extracting date
- New records automatically use correct timezone via `getClinicDayKey()`

### Performance
- New indexes on `clinic_day` columns ensure fast filtering
- No performance degradation expected
- If using PostgreSQL, consider analyzing tables after migration

## Troubleshooting

### Records not appearing under "Today"
- Check server time: `SELECT CURRENT_TIMESTAMP;`
- Check clinic day calculation: Visit `/api/debug/time` endpoint
- Verify record has correct clinic_day in database
- Check browser timezone doesn't matter (server timezone is authoritative)

### Inconsistent counts across pages
- Clear browser cache and reload
- Check network tab for query parameters
- Verify all API calls use `preset=` parameter
- Check server logs for any filtering errors

### Migration errors
- Check database permissions
- Verify SQLite/PostgreSQL syntax compatibility
- Try running commands one at a time
- Check for any database locks

## Support

For issues or questions:
1. Check server logs for errors
2. Verify SQL migration completed successfully
3. Test with fresh browser session (incognito)
4. Review network requests in browser DevTools
5. Check this repository's issues for similar problems
