-- Add specific_exam column to ultrasound_exams table
-- This column stores the specific exam type selected (e.g., "Renal (Kidneys & Bladder)")
-- for better display and tracking of ultrasound examination requests

ALTER TABLE ultrasound_exams ADD COLUMN specific_exam TEXT;
