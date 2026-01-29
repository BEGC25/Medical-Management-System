-- Migration 0014: Add indexes on payment_status columns for optimized unpaid order queries
-- This improves performance of the /api/unpaid-orders/all endpoint by filtering at the database level

-- Add index on lab_tests.payment_status for efficient filtering of unpaid lab tests
CREATE INDEX IF NOT EXISTS "idx_lab_tests_payment_status" ON "lab_tests" ("payment_status");

-- Add index on xray_exams.payment_status for efficient filtering of unpaid x-ray exams
CREATE INDEX IF NOT EXISTS "idx_xray_exams_payment_status" ON "xray_exams" ("payment_status");

-- Add index on ultrasound_exams.payment_status for efficient filtering of unpaid ultrasound exams
CREATE INDEX IF NOT EXISTS "idx_ultrasound_exams_payment_status" ON "ultrasound_exams" ("payment_status");

-- Add index on pharmacy_orders.payment_status for efficient filtering of unpaid pharmacy orders
CREATE INDEX IF NOT EXISTS "idx_pharmacy_orders_payment_status" ON "pharmacy_orders" ("payment_status");
