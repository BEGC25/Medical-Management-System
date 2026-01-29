-- Add daily_cash_closings table and finance_vw_daily_cash view
-- SQLite Edition for Local Development
-- This migration supports the Daily Cash Report enhancements
-- Date: 2026-01-08
--
-- IMPORTANT: For PostgreSQL production environments, use:
--   migrations/0007_add_daily_cash_closings_pg.sql
-- This file is for SQLite (local development) only.

-- ===========================================================================
-- Step 1: Create daily_cash_closings table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS daily_cash_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD format
  expected_amount REAL NOT NULL,
  counted_amount REAL NOT NULL,
  variance REAL NOT NULL,
  handed_over_by TEXT NOT NULL,
  received_by TEXT NOT NULL,
  notes TEXT,
  closed_by_user_id INTEGER,
  closed_by_username TEXT,
  closed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create index on date for efficient lookups
CREATE INDEX IF NOT EXISTS idx_daily_cash_closings_date ON daily_cash_closings(date);

-- ===========================================================================
-- Step 2: Create finance_vw_daily_cash view
-- ===========================================================================

-- This view aggregates payment data by department and date
-- It joins payment_items with payments to get department information
-- and filters for cash payments only

CREATE VIEW IF NOT EXISTS finance_vw_daily_cash AS
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
-- ✓ daily_cash_closings table created for storing daily closing data
-- ✓ finance_vw_daily_cash view created for aggregating payment data
-- ✓ Indexes created for efficient lookups
