-- Payments Clinic Day Migration - PostgreSQL/Neon Edition
-- Date: 2025-11-11
-- 
-- This migration adds clinic_day column to the payments table
-- and backfills it from created_at timestamps using Africa/Juba timezone.
-- 
-- Purpose: Extend clinic day unification to payments module for consistent
-- date filtering across preset ranges (Today/Yesterday/Last7/Last30).
--
-- PRODUCTION CONTEXT:
-- - Database: Neon (PostgreSQL) only
-- - Execute with: psql "$DATABASE_URL" < sql/2025-11-11_payments_clinic_day_pg.sql
--
-- Safe for production: All changes are additive and idempotent, no data loss.
-- Indexes created CONCURRENTLY to avoid blocking.
--
-- NOTE: This script is provided for repository history. The clinic_day column
-- and backfill may have already been applied manually in production.

-- ===========================================================================
-- Step 1: Add clinic_day column (nullable initially for safe backfill)
-- ===========================================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS clinic_day DATE;

-- ===========================================================================
-- Step 2: Backfill clinic_day from created_at in Africa/Juba timezone
-- ===========================================================================

-- Backfill all NULL clinic_day values
-- Convert created_at to Africa/Juba timezone (+02:00) and extract date
UPDATE payments 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date
WHERE clinic_day IS NULL;

-- ===========================================================================
-- Step 3: Set default for new records
-- ===========================================================================

-- Set default value for future inserts
ALTER TABLE payments 
ALTER COLUMN clinic_day SET DEFAULT (timezone('Africa/Juba', now()))::date;

-- ===========================================================================
-- Step 4: Create index for efficient filtering
-- ===========================================================================

-- Create index CONCURRENTLY to avoid blocking production queries
-- Use IF NOT EXISTS equivalent (ignore errors if already exists)
DO $$
BEGIN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_clinic_day ON payments(clinic_day);
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Index idx_payments_clinic_day already exists, skipping';
END
$$;

-- ===========================================================================
-- Step 5: Verification queries (for manual execution after migration)
-- ===========================================================================

-- Check backfill completeness
-- SELECT COUNT(*) AS null_clinic_day_count FROM payments WHERE clinic_day IS NULL;
-- Expected: 0

-- Check distribution across recent days
-- SELECT clinic_day, COUNT(*) AS count
-- FROM payments
-- WHERE clinic_day >= CURRENT_DATE - INTERVAL '7 days'
-- GROUP BY clinic_day
-- ORDER BY clinic_day DESC;

-- Verify today's count
-- SELECT COUNT(*) FROM payments 
-- WHERE clinic_day = (timezone('Africa/Juba', now()))::date;

-- ===========================================================================
-- Migration Complete
-- ===========================================================================

-- Summary:
-- ✓ clinic_day column added to payments table
-- ✓ Backfilled from created_at using Africa/Juba timezone
-- ✓ Default set for new records
-- ✓ Index created for efficient filtering
-- 
-- Next steps:
-- 1. Update server code to use clinic_day for filtering
-- 2. Update client to use preset-based queries
-- 3. Test /api/payments?preset=today endpoint
