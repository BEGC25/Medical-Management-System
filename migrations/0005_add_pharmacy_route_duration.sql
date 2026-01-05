-- Add route and duration columns to pharmacy_orders table
ALTER TABLE pharmacy_orders ADD COLUMN route TEXT;
ALTER TABLE pharmacy_orders ADD COLUMN duration TEXT;
