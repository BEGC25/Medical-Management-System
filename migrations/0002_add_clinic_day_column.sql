-- Add clinic_day column to patients table
-- This column stores the clinic day (Africa/Juba timezone) in YYYY-MM-DD format
-- for efficient date-based filtering

ALTER TABLE patients ADD COLUMN clinic_day TEXT;

-- Create index on clinic_day for efficient filtering
CREATE INDEX idx_patients_clinic_day ON patients(clinic_day);
