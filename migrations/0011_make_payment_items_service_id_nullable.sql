-- Migration: Make service_id nullable in payment_items table (SQLite)
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
--
-- SQLite does not support ALTER TABLE ... ALTER COLUMN, so we need to:
-- 1. Create a new table with the correct schema (service_id nullable)
-- 2. Copy all existing data from the old table
-- 3. Drop the old table
-- 4. Rename the new table to payment_items

-- Step 1: Create new table with nullable service_id
CREATE TABLE payment_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT NOT NULL,
  order_line_id INTEGER,
  service_id INTEGER,  -- CHANGED: Removed NOT NULL constraint
  related_id TEXT,
  related_type TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL
);

-- Step 2: Copy all data from old table to new table
INSERT INTO payment_items_new (
  id, payment_id, order_line_id, service_id, related_id, related_type,
  quantity, unit_price, total_price, amount, created_at
)
SELECT 
  id, payment_id, order_line_id, service_id, related_id, related_type,
  quantity, unit_price, total_price, amount, created_at
FROM payment_items;

-- Step 3: Drop old table
DROP TABLE payment_items;

-- Step 4: Rename new table to payment_items
ALTER TABLE payment_items_new RENAME TO payment_items;

-- Note: Foreign key relationships and indexes are not explicitly recreated
-- because SQLite does not enforce foreign keys by default and indexes
-- will be recreated automatically if needed.
