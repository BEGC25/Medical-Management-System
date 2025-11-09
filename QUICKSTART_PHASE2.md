# Quick Start Guide - Phase 2 Migration

This is a simplified guide for applying Phase 2 changes. For detailed information, see PHASE2_MIGRATION_GUIDE.md.

> **📌 Database Type**: This guide is for **SQLite** (local development). If you're using **PostgreSQL/Neon**, see **QUICKSTART_PHASE2_POSTGRES.md** instead.

## Overview

This migration adds:
1. **Database indexes** for better performance
2. **Data corrections** for historical records (if needed)
3. **New API features** for date filtering

**Important**: These changes are backward compatible - your existing system will continue to work!

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

Before making any database changes, create a backup:

```bash
# This creates a backup file with today's date
cp clinic.db clinic.db.backup-phase2-$(date +%Y%m%d)

# Verify the backup was created
ls -lh clinic.db*
```

You should see both `clinic.db` and `clinic.db.backup-phase2-YYYYMMDD`

### Step 4: Apply Database Indexes (Improves Performance)

This adds indexes to make date queries faster:

```bash
# Apply the indexes
sqlite3 clinic.db < migrations/0001_phase2_indexes.sql

# Verify they were created (optional)
sqlite3 clinic.db "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';"
```

Expected output:
```
idx_lab_tests_requested_date
idx_treatments_visit_date
idx_encounters_visit_date
idx_xray_exams_requested_date
idx_ultrasound_exams_requested_date
idx_encounters_unique_open_visit
```

### Step 5: Check If Data Migration Is Needed (Optional)

This step corrects historical records if they have the wrong date. **You can skip this if:**
- You just started using the system recently
- Your system was already using Phase 1 (clinic day stamping)

To check if you need data migration:

```bash
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

### "sqlite3: command not found"

Install SQLite:
- **Windows**: Download from https://sqlite.org/download.html
- **Mac**: `brew install sqlite3`
- **Linux**: `sudo apt-get install sqlite3`

### "tsx: command not found"

This means TypeScript execution is not available. Install it:

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

If you encounter issues, restore your backup:

```bash
# Stop the server

# Restore the backup
cp clinic.db.backup-phase2-YYYYMMDD clinic.db

# Restart the server
npm start
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

## Need More Details?

- **Full migration guide**: See PHASE2_MIGRATION_GUIDE.md
- **Technical details**: See TIMEZONE_CONFIGURATION.md
- **Implementation summary**: See PHASE2_SUMMARY.md

## Summary Checklist

- [ ] Merged PR into main branch
- [ ] Pulled latest code: `git pull`
- [ ] Installed dependencies: `npm install`
- [ ] Built project: `npm run build`
- [ ] Backed up database: `cp clinic.db clinic.db.backup-phase2-$(date +%Y%m%d)`
- [ ] Applied indexes: `sqlite3 clinic.db < migrations/0001_phase2_indexes.sql`
- [ ] Checked if migration needed: `tsx server/migrations/backfill-clinic-days.ts --dry-run`
- [ ] Applied migration (if needed): `tsx server/migrations/backfill-clinic-days.ts`
- [ ] Restarted application
- [ ] Verified filters work correctly

**That's it!** Your Phase 2 migration is complete.
