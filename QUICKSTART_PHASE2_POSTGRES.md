# Phase 2 Migration Guide - PostgreSQL/Neon

This guide is specifically for deployments using **PostgreSQL** or **Neon Database**.

> **Note**: If you're using SQLite locally, see the main QUICKSTART_PHASE2.md instead.

## Overview

This migration adds:
1. **Database indexes** for better performance
2. **Data corrections** for historical records (if needed)
3. **New API features** for date filtering

**Important**: These changes are backward compatible - your existing system will continue to work!

## Prerequisites

- Access to your Neon/PostgreSQL database
- `psql` command-line tool (or Neon SQL Editor)
- Node.js and npm installed
- Your `DATABASE_URL` environment variable set

## Simple Migration Steps

### Step 1: Merge the PR

After reviewing and approving the PR, merge it into your main branch.

```bash
# On GitHub, click "Merge Pull Request"
# Or from command line:
git checkout main
git merge copilot/standardize-date-handling
git push origin main
```

### Step 2: Update Your Local Environment

```bash
# Navigate to your project directory
cd /path/to/Medical-Management-System

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Build the project
npm run build
```

### Step 3: Backup Your Database (IMPORTANT!)

For Neon/PostgreSQL, create a backup through your database provider:

**Option A: Neon Dashboard**
1. Go to your Neon project dashboard
2. Click on your database
3. Go to "Backups" or "Snapshots"
4. Create a manual backup/snapshot before proceeding

**Option B: Using pg_dump**
```bash
# Export your database structure and data
pg_dump $DATABASE_URL > clinic_backup_phase2_$(date +%Y%m%d).sql

# Verify the backup was created
ls -lh clinic_backup_phase2_*.sql
```

### Step 4: Apply Database Indexes

**Option A: Using psql (Recommended)**

```bash
# Apply the migration using psql
psql $DATABASE_URL -f migrations/0001_phase2_indexes.sql

# Verify indexes were created
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY indexname;"
```

Expected output:
```
           indexname            
--------------------------------
 idx_encounters_unique_open_visit
 idx_encounters_visit_date
 idx_lab_tests_requested_date
 idx_treatments_visit_date
 idx_ultrasound_exams_requested_date
 idx_xray_exams_requested_date
(6 rows)
```

**Option B: Using Neon SQL Editor**

1. Go to your Neon dashboard
2. Open the SQL Editor
3. Copy the contents of `migrations/0001_phase2_indexes.sql`
4. Paste and run the SQL
5. Verify all indexes were created successfully

**Option C: Using Drizzle Kit**

```bash
# Push schema changes using Drizzle
npm run db:push
```

### Step 5: Check If Data Migration Is Needed (Optional)

This step corrects historical records if they have the wrong date. **You can skip this if:**
- You just started using the system recently
- Your system was already using Phase 1 (clinic day stamping)

To check if you need data migration:

```bash
# Set your DATABASE_URL if not already set
# export DATABASE_URL="postgresql://user:pass@host/db"

# Dry run - just shows what would change, doesn't modify anything
tsx server/migrations/backfill-clinic-days.ts --dry-run
```

**Interpreting the results:**

- **"0 records would be updated"** → You're good! Skip to Step 7.
- **"10-50 records would be updated"** → Run the migration (Step 6)
- **"100+ records would be updated"** → Your data needs correction, run migration (Step 6)

### Step 6: Apply Data Migration (If Needed)

Only do this if Step 5 showed records that need updating:

```bash
# Apply the corrections
tsx server/migrations/backfill-clinic-days.ts
```

This will show progress and confirm when complete:
```
✅ Migration complete. 26 records updated.
```

### Step 7: Restart Your Application

```bash
# Stop your current server (Ctrl+C if running)

# Start the server
npm start

# Or for development
npm run dev
```

### Step 8: Verify Everything Works

1. **Open your application** in a web browser
2. **Go to Laboratory page** and check that filters work:
   - Try "Today" filter
   - Try "Last 7 Days" filter
   - Verify pending count badge matches the list
3. **Check Dashboard** - ensure counts look correct

## Troubleshooting

### "psql: command not found"

Install PostgreSQL client:
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql-client`

Or use the Neon SQL Editor instead (no CLI needed).

### "connection refused" or "could not connect"

Check your DATABASE_URL:
```bash
echo $DATABASE_URL
```

It should look like:
```
postgresql://user:password@host.region.neon.tech/dbname?sslmode=require
```

Make sure:
- Your Neon project is active
- Your IP is allowed (check Neon firewall rules)
- The credentials are correct

### "tsx: command not found"

Install TypeScript execution:

```bash
npm install -g tsx
```

Or run via npx:

```bash
npx tsx server/migrations/backfill-clinic-days.ts --dry-run
```

### "Cannot find module"

Make sure you ran `npm install` after pulling the changes:

```bash
npm install
```

### Something Went Wrong - How to Rollback

If you encounter issues:

**Option A: Restore from Neon Backup**
1. Go to your Neon dashboard
2. Navigate to Backups/Snapshots
3. Restore the snapshot you created before migration

**Option B: Restore from pg_dump**
```bash
# Drop and recreate database (⚠️ destructive!)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from backup
psql $DATABASE_URL < clinic_backup_phase2_YYYYMMDD.sql
```

**Option C: Manual Index Removal** (if only indexes are the problem)
```sql
-- Remove the indexes
DROP INDEX IF EXISTS idx_lab_tests_requested_date;
DROP INDEX IF EXISTS idx_treatments_visit_date;
DROP INDEX IF EXISTS idx_encounters_visit_date;
DROP INDEX IF EXISTS idx_xray_exams_requested_date;
DROP INDEX IF EXISTS idx_ultrasound_exams_requested_date;
DROP INDEX IF EXISTS idx_encounters_unique_open_visit;
```

## PostgreSQL vs SQLite Differences

The migration is designed to work with both databases. Key differences:

| Feature | PostgreSQL/Neon | SQLite |
|---------|----------------|--------|
| Index syntax | ✅ Compatible | ✅ Compatible |
| Partial indexes | ✅ Supported | ✅ Supported |
| IF NOT EXISTS | ✅ Supported | ✅ Supported |
| Apply command | `psql $DATABASE_URL -f file.sql` | `sqlite3 clinic.db < file.sql` |
| Verify indexes | `pg_indexes` system table | `sqlite_master` table |

## Connection String Examples

**Neon:**
```
postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require
```

**Local PostgreSQL:**
```
postgresql://user:pass@localhost:5432/clinic_management
```

**SQLite (local dev):**
```
Not used - DATABASE_URL not set or contains 'sqlite'
```

## Environment Variables

Make sure your `.env` file has:

```bash
# For Neon/PostgreSQL
DATABASE_URL=postgresql://your-connection-string

# Clinic timezone (should already be set from Phase 1)
CLINIC_TZ=Africa/Juba
VITE_CLINIC_TZ=Africa/Juba
```

## What Changed After Migration?

### For Users
- Date filters work more consistently
- "Today" means the same thing across all pages
- Pending counts match the filtered lists

### For Developers
- New API parameters: `?preset=today` instead of `?today=1`
- Old parameters still work (backward compatible)
- Debug endpoints available: `/api/debug/time`, `/api/debug/range`

## Summary Checklist

- [ ] Merged PR into main branch
- [ ] Pulled latest code: `git pull`
- [ ] Installed dependencies: `npm install`
- [ ] Built project: `npm run build`
- [ ] Backed up database (Neon snapshot or pg_dump)
- [ ] Applied indexes via psql or Neon SQL Editor
- [ ] Checked if migration needed: `tsx server/migrations/backfill-clinic-days.ts --dry-run`
- [ ] Applied migration (if needed): `tsx server/migrations/backfill-clinic-days.ts`
- [ ] Restarted application
- [ ] Verified filters work correctly

**That's it!** Your Phase 2 migration is complete.

## Need Help?

- Check the main PHASE2_MIGRATION_GUIDE.md for more details
- Review TIMEZONE_CONFIGURATION.md for technical specs
- Contact support if you encounter database-specific issues
