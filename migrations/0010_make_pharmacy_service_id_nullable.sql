-- Migration: Make service_id nullable in pharmacy_orders table
-- 
-- This migration addresses the issue where pharmacy orders fail with a 500 error
-- when submitting medications from the Treatment page with serviceId: null.
--
-- Background:
-- PR #294 changed the TypeScript schema to make serviceId optional for backward
-- compatibility with service-based pricing. However, the database table was not
-- migrated and still has a NOT NULL constraint.
--
-- SQLite does not support ALTER TABLE ... ALTER COLUMN, so we need to:
-- 1. Create a new table with the correct schema (service_id nullable)
-- 2. Copy all existing data from the old table
-- 3. Drop the old table
-- 4. Rename the new table to pharmacy_orders

-- Step 1: Create new table with nullable service_id
CREATE TABLE pharmacy_orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL,
  treatment_id TEXT,
  encounter_id TEXT,
  service_id INTEGER,  -- CHANGED: Removed NOT NULL constraint
  drug_id INTEGER,
  drug_name TEXT,
  dosage TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  instructions TEXT,
  route TEXT,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'prescribed',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  dispensed_by TEXT,
  dispensed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 2: Copy all data from old table to new table
-- Note: This migration assumes the old table has all columns except that service_id is NOT NULL.
-- If your table is missing some columns, the migration will fail. In that case, you may need
-- to create a custom migration that only copies the columns that exist in your current table.
INSERT INTO pharmacy_orders_new (
  id, order_id, patient_id, treatment_id, encounter_id, service_id,
  drug_id, drug_name, dosage, quantity, instructions, route, duration,
  status, payment_status, dispensed_by, dispensed_at, created_at
)
SELECT 
  id, order_id, patient_id, treatment_id, encounter_id, service_id,
  drug_id, drug_name, dosage, quantity, instructions, route, duration,
  status, payment_status, dispensed_by, dispensed_at, created_at
FROM pharmacy_orders;

-- Step 3: Drop old table
DROP TABLE pharmacy_orders;

-- Step 4: Rename new table to pharmacy_orders
ALTER TABLE pharmacy_orders_new RENAME TO pharmacy_orders;

-- Note: The UNIQUE constraint on order_id is defined in the table schema (line 18),
-- so SQLite will automatically create the necessary index. No additional index creation needed.
