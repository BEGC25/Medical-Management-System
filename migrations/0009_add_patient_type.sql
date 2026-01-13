-- Add patient_type column to patients table
-- This allows tracking whether a patient is a regular patient or a referral/diagnostic-only patient

ALTER TABLE patients ADD COLUMN patient_type TEXT NOT NULL DEFAULT 'regular';
