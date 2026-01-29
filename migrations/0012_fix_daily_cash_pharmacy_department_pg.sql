-- Fix daily cash report pharmacy department categorization
-- PostgreSQL Edition for Production (Neon/PostgreSQL)
-- This migration fixes the finance_vw_daily_cash view to correctly categorize pharmacy_order as 'pharmacy'
-- Date: 2026-01-29
--
-- PRODUCTION CONTEXT:
-- - Database: Neon (PostgreSQL) or any PostgreSQL database
-- - Execute with: psql "$DATABASE_URL" < migrations/0012_fix_daily_cash_pharmacy_department_pg.sql
--
-- Safe for production: All changes are additive and idempotent, no data loss.

-- ===========================================================================
-- Recreate the finance_vw_daily_cash view with pharmacy support
-- ===========================================================================

CREATE OR REPLACE VIEW finance_vw_daily_cash AS
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

-- Verification Query (run manually after migration to confirm):
-- SELECT * FROM finance_vw_daily_cash WHERE department = 'pharmacy';
