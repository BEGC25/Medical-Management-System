# Quick Reference: Patient List Hotfix

## One-Line Summary
Add `clinic_day` column to patients table + 3-tier fallback logic to fix 500 errors on patient list.

## Quick Deploy (Production)
```bash
# 1. Backup
pg_dump "$DATABASE_URL" > backup.sql

# 2. Migrate
psql "$DATABASE_URL" -f sql/2025-11-09_hotfix_patients_clinic_day.sql

# 3. Verify
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients WHERE clinic_day IS NULL;"
# Should return: 0

# 4. Deploy code
git pull && npm install && npm run build && npm start

# 5. Test
curl "http://your-domain/api/patients?startDate=$(date -I)&endDate=$(date -I)&withStatus=true"
# Should return 200
```

## Files Modified
- `sql/2025-11-09_hotfix_patients_clinic_day.sql` - NEW migration
- `server/storage.ts` - 6 query methods updated
- `server/routes.ts` - Enhanced error handling
- `client/src/pages/Patients.tsx` - Client fallback added
- `TIMEZONE_CONFIGURATION.md` - Documentation updated

## What Changed (Code)

### Before (Broken)
```typescript
// Fails on text columns
return await db.select().from(patients)
  .where(like(patients.createdAt, `${clinicToday}%`))
```

### After (Fixed)
```typescript
try {
  // Tier 1: Use clinic_day (after migration)
  return await db.select().from(patients)
    .where(sql`clinic_day = ${clinicToday}`)
} catch {
  try {
    // Tier 2: Safe casting (before migration)
    return await db.select().from(patients)
      .where(sql`(created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date = ${clinicToday}`)
  } catch {
    // Tier 3: UTC fallback (last resort)
    return await db.select().from(patients)
      .where(sql`DATE(created_at) = ${clinicToday}`)
  }
}
```

## Rollback (If Needed)
```sql
ALTER TABLE patients DROP COLUMN IF EXISTS clinic_day;
DROP INDEX IF EXISTS idx_patients_clinic_day;
```
Then redeploy old code.

## Expected Behavior

### Before Fix
- ❌ `/api/patients?today=1` → 500 error
- ❌ Patients list shows empty
- ✅ Dashboard shows correct count (confusing!)

### After Fix
- ✅ `/api/patients?startDate=...&endDate=...` → 200 OK
- ✅ Patients list shows all registered today
- ✅ Dashboard count matches list

## Monitoring

### Good (After migration):
No log messages - clinic_day column working

### Acceptable (Before migration):
```
[patients] clinic_day query failed, using fallback casting
```

### Concerning (Shouldn't happen):
```
[patients] today fetch failed, using UTC fallback
```
→ Check if migration ran, check CLINIC_TZ env var

## Testing Commands

```bash
# Check column exists
psql "$DATABASE_URL" -c "\d patients" | grep clinic_day

# Check backfill completed
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients WHERE clinic_day IS NULL;"

# Check today's patients
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients WHERE clinic_day = CURRENT_DATE;"

# Test API endpoint
curl "http://localhost:3000/api/patients?startDate=2025-11-09&endDate=2025-11-10&withStatus=true"
```

## Success Criteria
- [ ] Migration completes in <1 second
- [ ] All patients have clinic_day populated
- [ ] API returns 200 (not 500)
- [ ] Newly registered patient appears in list
- [ ] No fallback warnings in logs

## Key Points
- ⚡ Fast: 18 rows, <1 second migration
- 🛡️ Safe: Additive only, no data loss
- 🔄 Compatible: Works before and after migration
- 📊 Indexed: Fast queries after migration
- 🚨 Resilient: 3 layers of fallback

## Need Help?
- Full deployment guide: `DEPLOYMENT_INSTRUCTIONS.md`
- Technical details: `TECHNICAL_SUMMARY.md`
- User guide: `HOTFIX_README.md`

## Compliance
✅ CodeQL security scan passed (0 alerts)
✅ No new dependencies
✅ Build passes
✅ Backward compatible
✅ Tested with mock data
