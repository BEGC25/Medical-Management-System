-- Migration: Make service_id nullable in order_lines table
-- 
-- This migration makes service_id nullable in the order_lines table to support
-- pharmacy orders that are priced via the drug catalog rather than the services table.
--
-- Background:
-- PR #481 made payment_items.service_id nullable to support pharmacy pricing from 
-- the drug inventory. This migration extends that pattern to order_lines, allowing
-- pharmacy order lines to have serviceId: null while other service types (consultation,
-- laboratory, radiology, ultrasound) continue to use services table pricing.
--
-- SQLite does not support ALTER TABLE ... ALTER COLUMN, so we need to:
-- 1. Create a new table with the correct schema (service_id nullable)
-- 2. Copy all existing data from the old table
-- 3. Drop the old table
-- 4. Rename the new table to order_lines

-- Step 1: Create new table with nullable service_id
CREATE TABLE order_lines_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  encounter_id TEXT NOT NULL,
  service_id INTEGER,  -- CHANGED: Removed NOT NULL constraint (nullable for pharmacy orders)
  related_id TEXT,
  related_type TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_snapshot REAL NOT NULL,
  total_price REAL NOT NULL,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  ordered_by TEXT,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  add_to_cart INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Step 2: Copy all data from old table to new table
INSERT INTO order_lines_new (
  id, encounter_id, service_id, related_id, related_type, description,
  quantity, unit_price_snapshot, total_price, department, status,
  ordered_by, acknowledged_by, acknowledged_at, add_to_cart, created_at
)
SELECT 
  id, encounter_id, service_id, related_id, related_type, description,
  quantity, unit_price_snapshot, total_price, department, status,
  ordered_by, acknowledged_by, acknowledged_at, add_to_cart, created_at
FROM order_lines;

-- Step 3: Drop old table
DROP TABLE order_lines;

-- Step 4: Rename new table to order_lines
ALTER TABLE order_lines_new RENAME TO order_lines;
