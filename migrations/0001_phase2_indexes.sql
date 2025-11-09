-- Phase 2: Add indexes and constraints for efficient date-range queries
-- This migration adds B-Tree indexes on date columns and a unique partial
-- index to prevent duplicate open encounters for the same patient on the same day.

-- Add index on lab_tests.requestedDate for efficient date range queries
CREATE INDEX IF NOT EXISTS "idx_lab_tests_requested_date" ON "lab_tests" ("requested_date");

-- Add index on treatments.visitDate for efficient date range queries  
CREATE INDEX IF NOT EXISTS "idx_treatments_visit_date" ON "treatments" ("visit_date");

-- Add index on encounters.visitDate for efficient date range queries
CREATE INDEX IF NOT EXISTS "idx_encounters_visit_date" ON "encounters" ("visit_date");

-- Add index on xray_exams.requestedDate for efficient date range queries
CREATE INDEX IF NOT EXISTS "idx_xray_exams_requested_date" ON "xray_exams" ("requested_date");

-- Add index on ultrasound_exams.requestedDate for efficient date range queries
CREATE INDEX IF NOT EXISTS "idx_ultrasound_exams_requested_date" ON "ultrasound_exams" ("requested_date");

-- Add unique partial index to prevent duplicate open encounters
-- Only one open encounter per patient per clinic day
CREATE UNIQUE INDEX IF NOT EXISTS "idx_encounters_unique_open_visit" 
ON "encounters" ("patient_id", "visit_date") 
WHERE "status" = 'open';
