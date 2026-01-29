# Migration 0012: Fix Daily Cash Pharmacy Department

## Purpose
This migration fixes the `finance_vw_daily_cash` view to correctly categorize pharmacy payments as 'pharmacy' instead of 'other'.

## Background
The original view in migration 0007 was missing a case for `pharmacy_order` in the department categorization, causing pharmacy payments to appear under "Other" in the Daily Cash Report.

## Important Note
This migration is required for existing databases that have already run migration 0007. The original 0007 migration files are intentionally kept unchanged to preserve migration history integrity.

## Changes
- Recreates the `finance_vw_daily_cash` view with the added case:
  ```sql
  WHEN pi.related_type = 'pharmacy_order' THEN 'pharmacy'
  ```

## Files
- `0012_fix_daily_cash_pharmacy_department.sql` - SQLite version (local development)
- `0012_fix_daily_cash_pharmacy_department_pg.sql` - PostgreSQL version (production)

## How to Apply

### For SQLite (Local Development)
```bash
sqlite3 your_database.db < migrations/0012_fix_daily_cash_pharmacy_department.sql
```

### For PostgreSQL (Production)
```bash
psql "$DATABASE_URL" < migrations/0012_fix_daily_cash_pharmacy_department_pg.sql
```

## Verification
After applying, verify the fix with:
```sql
SELECT * FROM finance_vw_daily_cash WHERE department = 'pharmacy';
```

## Related Bug Fixes
This migration is part of a fix for the pharmacy payment workflow that also includes:
1. Bug #1: Payment Receipt showing wrong unit prices (fixed in client/src/pages/Payment.tsx)
2. Bug #2: Daily Cash Report categorizing pharmacy as "Other" (this migration)
3. Bug #3: Daily Cash Report wrong amounts (related to Bug #2)
