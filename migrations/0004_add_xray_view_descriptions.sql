-- Migration: Add view_descriptions, image_quality, and technical_factors columns to xray_exams table
-- This migration adds fields to support comprehensive X-Ray reporting

-- Add view_descriptions column (TEXT) to store X-Ray view descriptions
ALTER TABLE xray_exams ADD COLUMN view_descriptions TEXT;

-- Add image_quality column (TEXT) to store image quality assessment
ALTER TABLE xray_exams ADD COLUMN image_quality TEXT;

-- Add technical_factors column (TEXT) to store technical factors (kVp, mAs, positioning notes)
ALTER TABLE xray_exams ADD COLUMN technical_factors TEXT;
