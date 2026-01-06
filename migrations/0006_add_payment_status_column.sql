-- Add payment_status column to lab_tests table
-- This column tracks whether a lab test has been paid for
-- Default value is 'unpaid'

ALTER TABLE lab_tests ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- Create index on payment_status for efficient filtering of unpaid tests
CREATE INDEX idx_lab_tests_payment_status ON lab_tests(payment_status);

-- Add clinic_day column to lab_tests table
-- This column stores the clinic day (Africa/Juba timezone) in YYYY-MM-DD format
-- for efficient date-based filtering

ALTER TABLE lab_tests ADD COLUMN clinic_day TEXT;

-- Add payment_status column to xray_exams table
-- This column tracks whether an x-ray exam has been paid for
-- Default value is 'unpaid'

ALTER TABLE xray_exams ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- Create index on payment_status for efficient filtering of unpaid exams
CREATE INDEX idx_xray_exams_payment_status ON xray_exams(payment_status);

-- Add clinic_day column to xray_exams table
-- This column stores the clinic day (Africa/Juba timezone) in YYYY-MM-DD format
-- for efficient date-based filtering

ALTER TABLE xray_exams ADD COLUMN clinic_day TEXT;
