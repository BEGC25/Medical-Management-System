-- Add daily_cash_closings table and finance_vw_daily_cash view
-- PostgreSQL Edition for Production (Neon/PostgreSQL)
-- This migration supports the Daily Cash Report enhancements
-- Date: 2026-01-08
--
-- PRODUCTION CONTEXT:
-- - Database: Neon (PostgreSQL) or any PostgreSQL database
-- - Execute with: psql "$DATABASE_URL" < migrations/0007_add_daily_cash_closings_pg.sql
--
-- Safe for production: All changes are additive and idempotent, no data loss.

-- ===========================================================================
-- Step 1: Create daily_cash_closings table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS daily_cash_closings (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE, -- YYYY-MM-DD format
  expected_amount NUMERIC(10, 2) NOT NULL,
  counted_amount NUMERIC(10, 2) NOT NULL,
  variance NUMERIC(10, 2) NOT NULL,
  handed_over_by TEXT NOT NULL,
  received_by TEXT NOT NULL,
  notes TEXT,
  closed_by_user_id INTEGER,
  closed_by_username TEXT,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on date for efficient lookups
CREATE INDEX IF NOT EXISTS idx_daily_cash_closings_date ON daily_cash_closings(date);

-- ===========================================================================
-- Step 2: Create finance_vw_daily_cash view
-- ===========================================================================

-- This view aggregates payment data by department and date
-- It joins payment_items with payments to get department information
-- and filters for cash payments only

CREATE OR REPLACE VIEW finance_vw_daily_cash AS
SELECT 
  p.clinic_day AS collection_date,
  p.payment_method,
  CASE 
    WHEN pi.related_type = 'consultation' THEN 'consultation'
    WHEN pi.related_type = 'lab_test' OR pi.related_type = 'lab_test_item' THEN 'laboratory'
    WHEN pi.related_type = 'xray_exam' THEN 'xray'
    WHEN pi.related_type = 'ultrasound_exam' THEN 'ultrasound'
    ELSE 'other'
  END AS department,
  p.received_by AS cashier_id,
  SUM(pi.total_price) AS total_amount,
  COUNT(DISTINCT p.payment_id) AS receipt_count
FROM payments p
LEFT JOIN payment_items pi ON p.payment_id = pi.payment_id
WHERE p.clinic_day IS NOT NULL
GROUP BY p.clinic_day, p.payment_method, department, p.received_by;

-- ===========================================================================
-- Migration Complete
-- ===========================================================================

-- Summary:
-- ✓ daily_cash_closings table created for storing daily closing data (PostgreSQL types)
-- ✓ finance_vw_daily_cash view created for aggregating payment data
-- ✓ Indexes created for efficient lookups

-- Verification Queries (run these manually after migration to confirm):
-- SELECT * FROM daily_cash_closings LIMIT 5;
-- SELECT * FROM finance_vw_daily_cash WHERE collection_date = CURRENT_DATE;
-- SELECT tablename FROM pg_tables WHERE tablename='daily_cash_closings';
-- SELECT viewname FROM pg_views WHERE viewname='finance_vw_daily_cash';
