-- Clinic Day Unification Migration - PostgreSQL/Neon Edition
-- Date: 2025-11-10
-- 
-- This migration adds clinic_day columns to all clinical activity tables
-- and backfills them from created_at timestamps using Africa/Juba timezone.
-- 
-- Purpose: Unify date filtering across all modules to use a single canonical
-- clinic day field, ensuring consistent preset results (Today/Yesterday/Last7/Last30)
-- across Patients, Laboratory, X-Ray, Ultrasound, and Treatment pages.
--
-- PRODUCTION CONTEXT:
-- - Database: Neon (PostgreSQL) only
-- - Server: Render
-- - Client: Vercel
-- - Source of truth: GitHub
-- - Execute with: psql "$DATABASE_URL" < sql/2025-11-10_clinic_day_unification_pg.sql
--
-- Tables affected:
-- - patients (ensure clinic_day exists and is properly set)
-- - encounters (new clinic_day column)
-- - treatments (new clinic_day column)
-- - lab_tests (new clinic_day column)
-- - xray_exams (new clinic_day column)
-- - ultrasound_exams (new clinic_day column)
--
-- Safe for production: All changes are additive and idempotent, no data loss.
-- Indexes created CONCURRENTLY to avoid blocking.

-- ===========================================================================
-- Step 1: Add clinic_day columns (nullable initially for safe backfill)
-- ===========================================================================

-- Patients table (ensure column exists)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_day DATE;

-- Encounters table
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS clinic_day DATE;

-- Treatments table  
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS clinic_day DATE;

-- Lab Tests table
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS clinic_day DATE;

-- X-Ray Exams table
ALTER TABLE xray_exams ADD COLUMN IF NOT EXISTS clinic_day DATE;

-- Ultrasound Exams table
ALTER TABLE ultrasound_exams ADD COLUMN IF NOT EXISTS clinic_day DATE;

-- ===========================================================================
-- Step 2: Backfill clinic_day from created_at timestamps
-- Convert timestamps to Africa/Juba timezone (UTC+2) and extract date portion
-- ===========================================================================

-- Backfill patients.clinic_day
-- PostgreSQL has AT TIME ZONE support for proper timezone conversion
UPDATE patients 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date
WHERE clinic_day IS NULL;

-- Backfill encounters.clinic_day
UPDATE encounters 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date
WHERE clinic_day IS NULL;

-- Backfill treatments.clinic_day
UPDATE treatments 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date
WHERE clinic_day IS NULL;

-- Backfill lab_tests.clinic_day
UPDATE lab_tests 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date
WHERE clinic_day IS NULL;

-- Backfill xray_exams.clinic_day
UPDATE xray_exams 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date
WHERE clinic_day IS NULL;

-- Backfill ultrasound_exams.clinic_day
UPDATE ultrasound_exams 
SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date
WHERE clinic_day IS NULL;

-- ===========================================================================
-- Step 3: Set default values for clinic_day columns
-- New records will automatically get the current clinic day
-- ===========================================================================

-- Set default for patients.clinic_day
ALTER TABLE patients 
ALTER COLUMN clinic_day SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;

-- Set default for encounters.clinic_day
ALTER TABLE encounters 
ALTER COLUMN clinic_day SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;

-- Set default for treatments.clinic_day
ALTER TABLE treatments 
ALTER COLUMN clinic_day SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;

-- Set default for lab_tests.clinic_day
ALTER TABLE lab_tests 
ALTER COLUMN clinic_day SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;

-- Set default for xray_exams.clinic_day
ALTER TABLE xray_exams 
ALTER COLUMN clinic_day SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;

-- Set default for ultrasound_exams.clinic_day
ALTER TABLE ultrasound_exams 
ALTER COLUMN clinic_day SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Juba')::date;

-- ===========================================================================
-- Step 4: Create indexes for efficient filtering by clinic_day
-- Using CONCURRENTLY to avoid blocking production queries
-- Note: CONCURRENTLY requires being outside a transaction block
-- ===========================================================================

-- Index on patients.clinic_day
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_clinic_day ON patients(clinic_day);

-- Index on encounters.clinic_day
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_encounters_clinic_day ON encounters(clinic_day);

-- Index on treatments.clinic_day
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatments_clinic_day ON treatments(clinic_day);

-- Index on lab_tests.clinic_day
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_tests_clinic_day ON lab_tests(clinic_day);

-- Index on xray_exams.clinic_day
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_xray_exams_clinic_day ON xray_exams(clinic_day);

-- Index on ultrasound_exams.clinic_day
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ultrasound_exams_clinic_day ON ultrasound_exams(clinic_day);

-- ===========================================================================
-- Verification Queries (run these manually after migration to confirm)
-- ===========================================================================

-- Count records missing clinic_day (should be 0 for all)
-- SELECT 'patients' as table_name, COUNT(*) as missing FROM patients WHERE clinic_day IS NULL
-- UNION ALL
-- SELECT 'encounters', COUNT(*) FROM encounters WHERE clinic_day IS NULL
-- UNION ALL
-- SELECT 'treatments', COUNT(*) FROM treatments WHERE clinic_day IS NULL
-- UNION ALL
-- SELECT 'lab_tests', COUNT(*) FROM lab_tests WHERE clinic_day IS NULL
-- UNION ALL
-- SELECT 'xray_exams', COUNT(*) FROM xray_exams WHERE clinic_day IS NULL
-- UNION ALL
-- SELECT 'ultrasound_exams', COUNT(*) FROM ultrasound_exams WHERE clinic_day IS NULL;

-- Sample records to verify clinic_day values
-- SELECT 'patients' as table_name, patient_id as record_id, created_at, clinic_day FROM patients ORDER BY created_at DESC LIMIT 3
-- UNION ALL
-- SELECT 'encounters', encounter_id, created_at, clinic_day FROM encounters ORDER BY created_at DESC LIMIT 3
-- UNION ALL
-- SELECT 'treatments', treatment_id, created_at, clinic_day FROM treatments ORDER BY created_at DESC LIMIT 3
-- UNION ALL
-- SELECT 'lab_tests', test_id, created_at, clinic_day FROM lab_tests ORDER BY created_at DESC LIMIT 3
-- UNION ALL
-- SELECT 'xray_exams', exam_id, created_at, clinic_day FROM xray_exams ORDER BY created_at DESC LIMIT 3
-- UNION ALL
-- SELECT 'ultrasound_exams', exam_id, created_at, clinic_day FROM ultrasound_exams ORDER BY created_at DESC LIMIT 3;

-- Verify indexes were created successfully
-- SELECT
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE indexname LIKE 'idx_%_clinic_day'
-- ORDER BY tablename;

-- ===========================================================================
-- Notes
-- ===========================================================================
-- 
-- 1. This migration preserves requested_date/visit_date columns for display
--    and scheduling purposes, but presets will filter by clinic_day only.
--
-- 2. After this migration, the application code must be updated to:
--    - Set clinic_day on INSERT operations (database default handles this)
--    - Filter by clinic_day for presets (Today/Yesterday/Last7/Last30)
--    - Use requested_date/visit_date only for display or future scheduling
--
-- 3. Future items (scheduled for future dates) will NOT appear under Today
--    unless they were created today, which matches Option A policy.
--
-- 4. For custom date ranges, the application can still use from/to parameters
--    which will be converted to clinic_day ranges.
--
-- 5. IMPORTANT: The CREATE INDEX CONCURRENTLY commands cannot be run inside
--    a transaction block. If you encounter errors with CONCURRENTLY, you have
--    two options:
--    a) Run the migration script as-is (it will handle the transaction)
--    b) Run the CREATE INDEX commands separately outside a transaction
--
-- 6. Execution instructions:
--    - Ensure DATABASE_URL environment variable is set
--    - Run: psql "$DATABASE_URL" < sql/2025-11-10_clinic_day_unification_pg.sql
--    - Or from psql: \i sql/2025-11-10_clinic_day_unification_pg.sql
