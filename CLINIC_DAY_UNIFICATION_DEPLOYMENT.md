# Clinic Day Unification - Deployment Instructions

## Overview

This update unifies date filtering across all modules (Patients, Laboratory, X-Ray, Ultrasound, Treatment) to use a single canonical `clinic_day` field. All presets (Today/Yesterday/Last7/Last30) now filter consistently by clinic day (creation date in Africa/Juba timezone).

## Database Migration (Required for Production)

### For Neon/Postgres (Production - Render backend)

**Prerequisites:**
- Access to the database connection string (DATABASE_URL)
- `psql` command-line tool installed

**Steps to Run Migration:**

1. **Set the DATABASE_URL environment variable:**
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

2. **Run the migration script:**
   ```bash
   psql "$DATABASE_URL" < sql/2025-11-10_clinic_day_unification_pg.sql
   ```

   **Alternative method (from within psql):**
   ```bash
   psql "$DATABASE_URL"
   # Then in the psql prompt:
   \i sql/2025-11-10_clinic_day_unification_pg.sql
   ```

3. **Verify the migration:**
   Run the verification queries (included at the end of the migration script) to confirm:
   - All records have `clinic_day` values
   - Indexes were created successfully
   - Sample records show correct clinic_day values

   ```sql
   -- Check for missing clinic_day values (should return 0 for all)
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
   ```

### Migration Details

The migration script performs the following operations:

1. **Adds clinic_day columns** (DATE type) to all relevant tables:
   - patients
   - encounters
   - treatments
   - lab_tests
   - xray_exams
   - ultrasound_exams

2. **Backfills clinic_day** from existing `created_at` timestamps using Africa/Juba timezone:
   ```sql
   UPDATE table_name 
   SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date
   WHERE clinic_day IS NULL;
   ```

3. **Sets default values** so new records automatically get the current clinic day:
   ```sql
   ALTER TABLE table_name 
   ALTER COLUMN clinic_day SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;
   ```

4. **Creates indexes** (CONCURRENTLY to avoid blocking production):
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_table_name_clinic_day ON table_name(clinic_day);
   ```

## Application Changes

### Server-Side Changes

- **New preset utility** (`server/utils/preset.ts`):
  - Parses standard presets: `today`, `yesterday`, `last7`, `last30`
  - Returns date ranges as YYYY-MM-DD strings in Africa/Juba timezone
  - Supports legacy parameter mapping for backward compatibility

- **Updated dashboard** to always show TODAY only (ignores any client preset):
  - `/api/dashboard/stats` hard-coded to `preset=today`

- **Storage layer** already uses `clinic_day` for filtering:
  - All list methods filter by `clinic_day` with inclusive bounds
  - Soft-deleted patients excluded via `patients.isDeleted = 0`
  - All create methods set `clinic_day` server-side

### Client-Side Changes

All client pages (Patients, Laboratory, XRay, Ultrasound, Treatment) already:
- Pass `preset` parameter to API endpoints
- Include `{ preset }` in React Query keys for proper cache invalidation
- Rely on server-side filtering (no client-side date filtering)
- Use "Patients in Range" label showing current list count

### API Usage

**Standard presets:**
```
GET /api/patients?preset=today
GET /api/lab-tests?preset=yesterday
GET /api/xray-exams?preset=last7
GET /api/ultrasound-exams?preset=last30
GET /api/treatments?preset=today
```

**Custom range:**
```
GET /api/patients?preset=custom&from=2025-11-01&to=2025-11-09
```

**Legacy parameters (deprecated but supported):**
```
GET /api/patients?today=1  → mapped to preset=today
GET /api/lab-tests?date=2025-11-09  → mapped to preset=custom&from=2025-11-09&to=2025-11-09
```

## Testing & Verification

### Acceptance Tests

1. **Preset consistency:** With `preset=today`, the same patient/test set appears on Patients, Lab, X-ray, Ultrasound, and Treatment pages.

2. **Refetch on preset change:** Switching Today ↔ Yesterday triggers new network requests (check Network tab for `preset` parameter changes).

3. **Dashboard TODAY-only:** Dashboard shows only TODAY counts and matches each module's Today count.

4. **Soft delete enforcement:** Soft-deleted patients never appear in lists or counts.

5. **No off-by-one errors:** Records at day boundaries (midnight) are correctly classified into the right clinic day.

### Manual Testing Steps

1. **Create a test patient today:**
   - Register a new patient
   - Verify it appears under "Today" on Patients page
   - Switch to "Yesterday" → should NOT appear
   - Switch back to "Today" → should appear

2. **Order lab test for patient:**
   - Order a lab test
   - Verify it appears under "Today" on Laboratory page
   - Check that the patient also appears in Lab module's patient dropdown

3. **Check dashboard consistency:**
   - Note the "Today" count on Dashboard
   - Go to Patients page with "Today" preset → count should match
   - Go to Lab page with "Today" preset → count should match

4. **Test soft delete:**
   - Soft-delete a test patient
   - Verify they don't appear in any lists
   - Verify counts don't include them

5. **Test date boundary:**
   - Near midnight (11:58 PM Africa/Juba time), create a test record
   - Verify it appears under the correct clinic day (not off by one)

### Database Verification

**Check index usage (performance):**
```sql
EXPLAIN SELECT * FROM lab_tests 
WHERE clinic_day >= '2025-11-10' AND clinic_day <= '2025-11-10';
```
Should show "Index Scan using idx_lab_tests_clinic_day" in the query plan.

**Check default values work:**
```sql
-- Insert without specifying clinic_day
INSERT INTO patients (patient_id, first_name, last_name, created_at)
VALUES ('TEST001', 'Test', 'Patient', NOW());

-- Verify clinic_day was set automatically
SELECT patient_id, clinic_day, created_at FROM patients WHERE patient_id = 'TEST001';
```

## Rollback Plan (If Needed)

The migration is additive-only and safe:

1. **Code rollback:** Revert to previous commit
2. **Database:** No rollback needed - new columns can remain (old code will ignore them)
3. **Client cache:** Clear browser cache to remove new query patterns

The migration does NOT remove or alter existing columns, so old code continues to work with `requested_date`/`visit_date` if you rollback.

## Important Notes

### Scheduled Future Items

- `requested_date` and `visit_date` are still stored for display and scheduling
- However, preset filters use `clinic_day` (creation date) only
- Future-dated items will NOT appear under "Today" unless created today
- This is intentional per the unified filtering design

### Timezone Consistency

- All `clinic_day` values use Africa/Juba timezone (UTC+2, no DST)
- Postgres uses `AT TIME ZONE 'Africa/Juba'` for correct conversion
- New records automatically use correct timezone via database default

### Performance

- New indexes on `clinic_day` ensure fast filtering
- Indexes created CONCURRENTLY avoid blocking production queries
- No performance degradation expected

## Troubleshooting

### Records not appearing under "Today"

- Check server time: `SELECT CURRENT_TIMESTAMP;`
- Check clinic day: `SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;`
- Verify record has correct clinic_day in database
- Browser timezone doesn't matter (server timezone is authoritative)

### Inconsistent counts across pages

- Clear browser cache and reload
- Check Network tab for query parameters
- Verify all API calls use `preset=` parameter
- Check server logs for filtering errors

### Migration errors

- Ensure DATABASE_URL is correct
- Check database permissions
- Try running commands one at a time manually
- For CREATE INDEX CONCURRENTLY errors, run indexes separately outside transaction

### CREATE INDEX CONCURRENTLY fails

If you encounter errors with `CREATE INDEX CONCURRENTLY`:

1. The migration script is safe to run in a transaction, BUT
2. `CREATE INDEX CONCURRENTLY` cannot be run inside a transaction block
3. **Solution:** Run the index creation commands separately:

```bash
# Run migration without indexes
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<EOF
-- Run ALTER TABLE and UPDATE commands here
EOF

# Then run indexes separately (outside transaction)
psql "$DATABASE_URL" -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_day ON patients(clinic_day);"
psql "$DATABASE_URL" -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_encounters_clinic_day ON encounters(clinic_day);"
# ... etc for other tables
```

## Support & Questions

For issues or questions:
1. Check server logs for errors
2. Verify SQL migration completed successfully
3. Test with fresh browser session (incognito)
4. Review network requests in browser DevTools
5. Check this repository's issues for similar problems

## Summary

This hotfix provides:
- ✅ Unified `clinic_day` filtering across all modules
- ✅ Consistent preset behavior (Today/Yesterday/Last7/Last30)
- ✅ Server-authoritative date filtering (no client-side timezone issues)
- ✅ Dashboard always shows TODAY only
- ✅ Soft-deleted patients properly excluded
- ✅ Production-safe migration (additive-only, idempotent)
- ✅ Legacy parameter support for backward compatibility
- ✅ Indexed queries for optimal performance
