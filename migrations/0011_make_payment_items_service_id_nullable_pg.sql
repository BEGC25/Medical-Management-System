-- Migration: Make service_id nullable in payment_items table (PostgreSQL)
-- 
-- This migration fixes the issue where pharmacy order payments fail with:
-- "500: Missing serviceId for payment item type pharmacy_order"
--
-- Background:
-- Pharmacy medications are priced from the drug catalog (drugs table), not from
-- the services table. The frontend sends serviceId: 0 for pharmacy items because
-- there is no corresponding service record. The backend then fails because
-- payment_items.service_id has a NOT NULL constraint.
--
-- Solution:
-- Make service_id nullable in payment_items table. For pharmacy_order items,
-- serviceId can be null while pricing comes from the pharmacy order's drug.

-- Remove NOT NULL constraint from service_id column
ALTER TABLE payment_items ALTER COLUMN service_id DROP NOT NULL;
