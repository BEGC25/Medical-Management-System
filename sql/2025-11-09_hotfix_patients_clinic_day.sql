-- Hotfix: Add clinic_day column to patients table for reliable timezone-aware filtering
-- This migration is safe for production (additive only, no data loss)
-- Addresses issue: /api/patients?today=1 returning 500 due to timezone() on text column

-- Step 1: Add clinic_day column (nullable initially for safe backfill)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_day date;

-- Step 2: Backfill clinic_day from created_at
-- Cast created_at to timestamptz, convert to Africa/Juba time, extract date
-- Handles both text ISO strings and proper timestamptz values
UPDATE patients 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date 
WHERE clinic_day IS NULL;

-- Step 3: Create index for performance (CONCURRENTLY to avoid blocking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_day ON patients (clinic_day);

-- Step 4: Set default for new records to automatically populate clinic_day
ALTER TABLE patients 
ALTER COLUMN clinic_day SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;

-- Step 5 (OPTIONAL): Convert created_at from text to timestamptz
-- Only safe for small tables (current: 18 rows)
-- Uncomment if you want to eliminate repeated casts in queries:
-- ALTER TABLE patients ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;

-- Verification queries (run these after migration to confirm):
-- SELECT COUNT(*) FROM patients WHERE clinic_day IS NULL; -- Should be 0
-- SELECT patient_id, created_at, clinic_day FROM patients ORDER BY created_at DESC LIMIT 5;
-- SELECT COUNT(*) FROM patients WHERE clinic_day = CURRENT_DATE; -- Today's patients
