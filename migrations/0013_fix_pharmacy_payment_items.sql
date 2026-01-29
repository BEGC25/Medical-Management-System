-- Fix incorrect pharmacy payment_items where total_price was stored as unit_price instead of unit_price * quantity
-- SQLite Edition for Local Development
-- This migration repairs broken records like BGC-PAY2 where payment_items.total_price = unit price instead of quantity * unit price
-- Date: 2026-01-29
--
-- PROBLEM:
-- Pharmacy payment_items were incorrectly storing total_price = unit_price (not multiplied by quantity)
-- This caused:
--   - Receipt line items showing wrong amounts (e.g., SSP 100 instead of SSP 2,000)
--   - Daily Cash Report showing wrong pharmacy totals
--
-- FIX:
-- Update all pharmacy_order payment_items to have correct total_price = unit_price * quantity
-- This also updates the 'amount' field to match for consistency
--
-- Safe for production: Data repair only, no schema changes

-- ===========================================================================
-- Step 1: Repair pharmacy payment_items where total_price = unit_price (bug pattern)
-- ===========================================================================

-- Update payment_items for pharmacy_orders where total_price appears to be wrong
-- The bug stored total_price = unit_price regardless of quantity
-- We recalculate: total_price = unit_price * quantity
UPDATE payment_items
SET 
  total_price = unit_price * quantity,
  amount = unit_price * quantity
WHERE related_type = 'pharmacy_order'
  AND quantity > 1
  AND total_price = unit_price;

-- ===========================================================================
-- Migration Complete
-- ===========================================================================

-- Summary:
-- ✓ Fixed pharmacy payment_items where total_price was incorrectly set to unit_price
-- ✓ Only updates records matching the bug pattern: quantity > 1 AND total_price = unit_price
--
-- Verification Query (run manually after migration):
-- SELECT p.payment_id, p.total_amount, SUM(pi.total_price) AS items_sum, 
--        p.total_amount - SUM(pi.total_price) AS difference
-- FROM payments p
-- JOIN payment_items pi ON pi.payment_id = p.payment_id
-- GROUP BY p.payment_id, p.total_amount
-- HAVING ABS(p.total_amount - SUM(pi.total_price)) > 0.01;
