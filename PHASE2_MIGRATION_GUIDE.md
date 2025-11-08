# Phase 2 Migration Guide

This guide walks through deploying Phase 2 changes that standardize date handling across the Medical Management System.

## Pre-Migration Checklist

- [ ] Back up database: `cp clinic.db clinic.db.backup-phase2-$(date +%Y%m%d)`
- [ ] Review current system state using debug endpoints
- [ ] Test migration script in dry-run mode
- [ ] Schedule migration during low-traffic period
- [ ] Notify users of scheduled maintenance (if applicable)

## Step 1: Deploy Code Changes

```bash
# Pull latest changes
git checkout copilot/standardize-date-handling
git pull origin copilot/standardize-date-handling

# Install dependencies (if needed)
npm install

# Verify TypeScript compilation
npm run check

# Build production assets
npm run build
```

## Step 2: Apply Database Indexes

The indexes improve query performance for date-range filtering and prevent duplicate open encounters.

```bash
# Apply the migration
sqlite3 clinic.db < migrations/0001_phase2_indexes.sql

# Verify indexes were created
sqlite3 clinic.db "SELECT name, sql FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;"
```

Expected output should include:
- `idx_lab_tests_requested_date`
- `idx_treatments_visit_date`
- `idx_encounters_visit_date`
- `idx_xray_exams_requested_date`
- `idx_ultrasound_exams_requested_date`
- `idx_encounters_unique_open_visit`

## Step 3: Run Data Migration (Dry Run)

Preview what changes will be made to historical data:

```bash
# Dry run - no changes will be applied
tsx server/migrations/backfill-clinic-days.ts --dry-run

# Review the output carefully
# Check example changes to ensure they look correct
```

Expected output:
```
╔════════════════════════════════════════════════════════╗
║  Phase 2: Clinic Day Backfill Migration               ║
╚════════════════════════════════════════════════════════╝

⚙️  Configuration:
   Mode: 🔍 DRY RUN (no changes will be made)
   Window: Last 60 days

⚠️  DRY RUN MODE: No data will be modified

📊 Backfilling lab_tests.requestedDate...
   Looking at records created after: 2025-09-09
   Found 245 records to check

   Example changes:
   1. BGC-LAB123: 2025-11-07 → 2025-11-08 (created: 2025-11-08)
   2. BGC-LAB124: 2025-11-07 → 2025-11-08 (created: 2025-11-08)
   ...

✅ Dry run complete. 18 records would be updated.
   Run without --dry-run to apply changes.
```

### Common Scenarios

**No records need updating:**
```
✅ Dry run complete. 0 records would be updated.
```
This is normal if:
- Phase 1 was already running and stamping correct clinic days
- No records were created near midnight UTC (when drift occurs)

**Many records need updating:**
If a large percentage of records need updating, this indicates:
- System was using UTC day stamping before Phase 1
- Records were created during hours when UTC day ≠ clinic day (22:00-23:59 UTC)

## Step 4: Apply Data Migration

After reviewing dry-run output and confirming it looks correct:

```bash
# Apply the migration
tsx server/migrations/backfill-clinic-days.ts

# Expected: same output as dry run, but with "Updated" instead of "Would update"
```

### Migration Output

```
╔════════════════════════════════════════════════════════╗
║  Migration Summary                                     ║
╚════════════════════════════════════════════════════════╝

📊 Lab Tests:
   Checked: 245
   Updated: 12

🏥 Treatments:
   Checked: 189
   Updated: 8

🎫 Encounters:
   Checked: 156
   Updated: 6

✅ Migration complete. 26 records updated.
```

### If Migration Fails

If the migration encounters an error:

1. **Database locked error**: Wait a moment and retry (active connections may be holding locks)
2. **Other errors**: Review error message, check database connectivity
3. **Restore from backup**: `cp clinic.db.backup-phase2-YYYYMMDD clinic.db`

## Step 5: Verify Migration Results

### 5.1 Check Debug Endpoints

```bash
# Verify clinic time info
curl http://localhost:5000/api/debug/time | jq .

# Test range parsing
curl http://localhost:5000/api/debug/range?preset=today | jq .
curl http://localhost:5000/api/debug/range?preset=last7 | jq .
```

### 5.2 Verify Data Consistency

```bash
# Check for any remaining mismatches (should be 0 or very few)
sqlite3 clinic.db << 'EOF'
SELECT COUNT(*) as mismatches 
FROM lab_tests 
WHERE requestedDate != date(createdAt, '+2 hours')
  AND datetime(createdAt) >= datetime('now', '-60 days');
EOF
```

Expected: 0 mismatches (or very few edge cases)

### 5.3 Test Frontend

1. Open Laboratory page
2. Select "Today" filter
3. Verify pending count badge matches number of pending items in list
4. Switch to "Last 7 Days"
5. Verify count increases (superset property)
6. Create a new lab test and verify it appears immediately in "Today" view

### 5.4 Test Legacy Parameter Support

```bash
# These should all work (with deprecation warnings in server logs)
curl http://localhost:5000/api/lab-tests?today=1
curl http://localhost:5000/api/lab-tests?date=2025-11-08
curl http://localhost:5000/api/lab-tests?startDate=2025-11-01&endDate=2025-11-08
```

## Step 6: Restart Server

```bash
# Stop current server
# Start with new code
npm start

# Or in development
npm run dev
```

## Step 7: Monitor System

### Check Server Logs

Watch for:
- ✅ No errors during startup
- ⚠️ Deprecation warnings (expected when legacy params used)
- ✅ Successful API requests with new parameters

### Monitor Performance

The new indexes should improve query performance:

```sql
-- Check query plan uses indexes
EXPLAIN QUERY PLAN 
SELECT * FROM lab_tests 
WHERE requestedDate >= '2025-11-01' AND requestedDate < '2025-11-08';
```

Expected to see: `USING INDEX idx_lab_tests_requested_date`

## Rollback Procedure

If issues are encountered and you need to rollback:

### Option 1: Restore Database Backup

```bash
# Stop server
# Restore backup
cp clinic.db.backup-phase2-YYYYMMDD clinic.db
# Restart server with previous code version
```

### Option 2: Revert Code Only

If only code issues (not data):

```bash
git checkout main  # or previous working branch
npm install
npm run build
# Restart server
```

Note: The database changes (indexes) are safe to keep even if rolling back code.

## Post-Migration Tasks

- [ ] Monitor system for 24 hours
- [ ] Verify all date filters work correctly across all pages
- [ ] Check that pending counts align with list views
- [ ] Test boundary conditions (records created near midnight)
- [ ] Update any deployment documentation
- [ ] Delete old backup files after confirming stability

## Troubleshooting

### Issue: Pending counts don't match list view

**Symptom**: Dashboard shows different pending count than Laboratory page

**Solution**: 
1. Check that both are using same date filter
2. Verify browser cache is cleared
3. Check API responses in Network tab

### Issue: Legacy parameters not working

**Symptom**: API returns no data with old parameter format

**Solution**:
1. Check server logs for deprecation warnings
2. Verify `parseClinicRangeParams` is being called with `logDeprecation=true`
3. Check that legacy parameter mapping is correct

### Issue: Records appear under wrong day

**Symptom**: Record created today appears in yesterday's list

**Solution**:
1. Verify `CLINIC_TZ` environment variable is set correctly
2. Check server time: `curl http://localhost:5000/api/debug/time`
3. Verify `clinicDayKey` matches expected value
4. Check database value: `SELECT requestedDate FROM lab_tests WHERE testId='...'`

## Support

For issues or questions:
1. Check server logs for error messages
2. Use debug endpoints to verify time calculations
3. Review TIMEZONE_CONFIGURATION.md for detailed documentation
4. Check database directly for data consistency

## Success Criteria

After migration, you should observe:

✅ All date filters use preset parameters (today, yesterday, last7, etc.)
✅ Pending counts match filtered list lengths
✅ Records created near midnight appear under correct clinic day
✅ Last 7 Days filter shows superset of Today (more or equal records)
✅ Dashboard stats align with individual page counts
✅ No TypeScript compilation errors
✅ No runtime errors in browser console
✅ Server logs show no unexpected errors (deprecation warnings are OK)
