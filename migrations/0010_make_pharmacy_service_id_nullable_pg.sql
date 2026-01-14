-- Migration: Make service_id nullable in pharmacy_orders table (PostgreSQL)
-- 
-- This migration addresses the issue where pharmacy orders fail with a 500 error
-- when submitting medications from the Treatment page with serviceId: null.
--
-- Background:
-- PR #294 changed the TypeScript schema to make serviceId optional for backward
-- compatibility with service-based pricing. However, the database table was not
-- migrated and still has a NOT NULL constraint.
--
-- PostgreSQL supports ALTER COLUMN, so this is simpler than the SQLite version.

-- Remove NOT NULL constraint from service_id column
ALTER TABLE pharmacy_orders ALTER COLUMN service_id DROP NOT NULL;
