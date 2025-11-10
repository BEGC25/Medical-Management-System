-- Idempotent SQL script to set clinic_day column defaults
-- Run this on PostgreSQL database to ensure clinic_day is auto-populated
-- for all new records using Africa/Juba timezone

-- This script is safe to run multiple times (idempotent)
-- It only sets the default value, doesn't modify existing data

-- Set clinic_day default for patients table
ALTER TABLE patients 
  ALTER COLUMN clinic_day SET DEFAULT (timezone('Africa/Juba', now()))::date;

-- Set clinic_day default for encounters table
ALTER TABLE encounters 
  ALTER COLUMN clinic_day SET DEFAULT (timezone('Africa/Juba', now()))::date;

-- Set clinic_day default for treatments table
ALTER TABLE treatments 
  ALTER COLUMN clinic_day SET DEFAULT (timezone('Africa/Juba', now()))::date;

-- Set clinic_day default for lab_tests table
ALTER TABLE lab_tests 
  ALTER COLUMN clinic_day SET DEFAULT (timezone('Africa/Juba', now()))::date;

-- Set clinic_day default for xray_exams table
ALTER TABLE xray_exams 
  ALTER COLUMN clinic_day SET DEFAULT (timezone('Africa/Juba', now()))::date;

-- Set clinic_day default for ultrasound_exams table
ALTER TABLE ultrasound_exams 
  ALTER COLUMN clinic_day SET DEFAULT (timezone('Africa/Juba', now()))::date;

-- Verify defaults were set (informational query)
SELECT 
  table_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE 
  table_schema = 'public'
  AND column_name = 'clinic_day'
  AND table_name IN ('patients', 'encounters', 'treatments', 'lab_tests', 'xray_exams', 'ultrasound_exams')
ORDER BY table_name;
