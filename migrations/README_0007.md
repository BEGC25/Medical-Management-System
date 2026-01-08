# Daily Cash Report Migration - Quick Start

## Running the Migration

### For SQLite (Local Development)
```bash
cd /home/runner/work/Medical-Management-System/Medical-Management-System
sqlite3 clinic.db < migrations/0007_add_daily_cash_closings.sql
```

### For PostgreSQL (Production)
```bash
# Using psql
psql "$DATABASE_URL" < migrations/0007_add_daily_cash_closings.sql

# Or using DATABASE_URL from .env
source .env
psql "$DATABASE_URL" < migrations/0007_add_daily_cash_closings.sql
```

## Verification

### Verify Tables
```bash
# SQLite
sqlite3 clinic.db "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_cash_closings';"

# PostgreSQL
psql "$DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE tablename='daily_cash_closings';"
```

### Verify View
```bash
# SQLite
sqlite3 clinic.db "SELECT name FROM sqlite_master WHERE type='view' AND name='finance_vw_daily_cash';"

# PostgreSQL
psql "$DATABASE_URL" -c "SELECT viewname FROM pg_views WHERE viewname='finance_vw_daily_cash';"
```

## What This Migration Does

1. **Creates `daily_cash_closings` table**
   - Stores daily cash closing records
   - Prevents duplicate closes with UNIQUE constraint on date
   - Tracks who closed the day and when

2. **Creates `finance_vw_daily_cash` view**
   - Aggregates payment data by department and date
   - Filters for cash payments only
   - Joins payments with payment_items to derive department

## Rollback (if needed)

```sql
-- SQLite / PostgreSQL
DROP VIEW IF EXISTS finance_vw_daily_cash;
DROP TABLE IF EXISTS daily_cash_closings;
```

## Notes

- Migration is idempotent (safe to run multiple times)
- Uses `IF NOT EXISTS` / `IF EXISTS` clauses
- No data loss - only creates new tables/views
- Does not modify existing tables
