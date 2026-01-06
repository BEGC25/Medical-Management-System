-- Add payment_status column to lab_tests table
-- This column tracks whether a lab test has been paid for
-- Default value is 'unpaid'

ALTER TABLE lab_tests ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- Create index on payment_status for efficient filtering of unpaid tests
CREATE INDEX idx_lab_tests_payment_status ON lab_tests(payment_status);

-- Add payment_status column to xray_exams table
-- This column tracks whether an x-ray exam has been paid for
-- Default value is 'unpaid'

ALTER TABLE xray_exams ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- Create index on payment_status for efficient filtering of unpaid exams
CREATE INDEX idx_xray_exams_payment_status ON xray_exams(payment_status);
