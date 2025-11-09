# Deployment Instructions: Patient List Hotfix

## Overview
This hotfix addresses a critical production bug where `/api/patients?today=1` returns a 500 error, preventing newly registered patients from appearing in the Patients list.

## Pre-Deployment Checklist

- [ ] Backup database before running migration
- [ ] Verify current patient count: `SELECT COUNT(*) FROM patients;`
- [ ] Test database connection: `psql "$DATABASE_URL" -c "SELECT version();"`
- [ ] Review migration script: `cat sql/2025-11-09_hotfix_patients_clinic_day.sql`

## Deployment Steps

### 1. Run Database Migration

```bash
# Connect to production database and run migration
psql "$DATABASE_URL" -f sql/2025-11-09_hotfix_patients_clinic_day.sql
```

Expected output:
```
ALTER TABLE
UPDATE 18  -- Number of patients backfilled
CREATE INDEX
ALTER TABLE
```

### 2. Verify Migration Success

```bash
# Check that clinic_day was added and backfilled
psql "$DATABASE_URL" -c "SELECT patient_id, created_at, clinic_day FROM patients ORDER BY created_at DESC LIMIT 5;"

# Verify no null values
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients WHERE clinic_day IS NULL;"
# Should return: 0

# Check today's patients
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients WHERE clinic_day = CURRENT_DATE;"
```

### 3. Deploy Backend Code

```bash
# Pull latest code
git pull origin copilot/fix-patient-list-display-issue

# Install dependencies (if needed)
npm install

# Build application
npm run build

# Restart server
# (use your production restart command)
npm start
```

### 4. Verify Backend Health

```bash
# Test the patients endpoint
curl "http://your-domain/api/patients?startDate=2025-11-09&endDate=2025-11-10&withStatus=true"

# Should return 200 with patient array (not 500)
```

### 5. Deploy Frontend (if separate)

```bash
# The frontend changes are included in the same build
# If you deploy frontend separately, ensure latest client code is deployed
```

### 6. Post-Deployment Verification

1. **Dashboard**: Verify "Registered Today" count matches reality
2. **Patients Page**: 
   - Click "Today" filter
   - Verify patients appear (no empty list)
   - Verify newly registered patient (e.g., BGC54) appears
3. **Treatment Page**: Verify patient still appears (no regression)
4. **Check Logs**: Look for any fallback warnings:
   - `[patients] clinic_day query failed, using fallback`
   - `[patients] today fetch failed, using UTC fallback`
   - These should NOT appear after migration (indicates issue)

## Rollback Plan

If issues occur, the migration is safe to rollback:

```sql
-- Remove clinic_day column (safe, no data loss to other columns)
ALTER TABLE patients DROP COLUMN IF EXISTS clinic_day;

-- Drop the index
DROP INDEX IF EXISTS idx_patients_clinic_day;
```

Then redeploy previous version of the code.

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Column was added previously. Just run the UPDATE and CREATE INDEX steps manually:
```sql
UPDATE patients 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date 
WHERE clinic_day IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_day ON patients (clinic_day);
```

### Issue: CREATE INDEX CONCURRENTLY fails
**Solution**: Remove CONCURRENTLY for small tables:
```sql
CREATE INDEX IF NOT EXISTS idx_patients_clinic_day ON patients (clinic_day);
```

### Issue: Still seeing 500 errors after deployment
**Check**:
1. Backend code was actually restarted
2. Migration completed successfully (`\d patients` shows clinic_day column)
3. Check server logs for specific error messages
4. Verify DATABASE_URL is correct

### Issue: Patients appear in wrong day
**Check**:
1. Verify CLINIC_TZ environment variable is set to `Africa/Juba`
2. Check server timezone: `SELECT NOW(), CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba';`
3. Verify clinic_day values are correct: `SELECT patient_id, created_at, clinic_day FROM patients;`

## Success Criteria

✅ `/api/patients?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&withStatus=true` returns 200
✅ Newly registered patient appears immediately in "Today" filter
✅ Dashboard "Registered Today" count matches Patients page count
✅ No 500 errors in server logs
✅ No fallback warnings in server logs

## Support

If you encounter issues during deployment:
1. Check server logs for detailed error messages
2. Verify all migration steps completed successfully
3. Test individual SQL queries to identify which step failed
4. Review the fallback logic in storage.ts (should handle most edge cases)

## Notes

- Migration is **additive only** - no data loss risk
- Small table (18 rows) means migration is fast (<1 second)
- Fallback logic ensures backward compatibility
- Client-side filtering provides additional resilience
