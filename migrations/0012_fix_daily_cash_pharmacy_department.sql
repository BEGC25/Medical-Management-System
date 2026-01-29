-- Fix daily cash report pharmacy department categorization
-- SQLite Edition for Local Development
-- This migration fixes the finance_vw_daily_cash view to correctly categorize pharmacy_order as 'pharmacy'
-- Date: 2026-01-29
--
-- IMPORTANT: For PostgreSQL production environments, use:
--   migrations/0012_fix_daily_cash_pharmacy_department_pg.sql
-- This file is for SQLite (local development) only.

-- ===========================================================================
-- Drop and recreate the finance_vw_daily_cash view with pharmacy support
-- ===========================================================================

DROP VIEW IF EXISTS finance_vw_daily_cash;

CREATE VIEW finance_vw_daily_cash AS
SELECT 
  p.clinic_day AS collection_date,
  p.payment_method,
  CASE 
    WHEN pi.related_type = 'consultation' THEN 'consultation'
    WHEN pi.related_type = 'lab_test' OR pi.related_type = 'lab_test_item' THEN 'laboratory'
    WHEN pi.related_type = 'xray_exam' THEN 'xray'
    WHEN pi.related_type = 'ultrasound_exam' THEN 'ultrasound'
    WHEN pi.related_type = 'pharmacy_order' THEN 'pharmacy'
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
-- ✓ finance_vw_daily_cash view updated to categorize pharmacy_order as 'pharmacy'
-- ✓ This fixes the Daily Cash Report showing pharmacy payments as 'other'
