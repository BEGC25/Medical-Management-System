-- Migration: Drop billing_settings table
-- SQLite version
-- Safe to run multiple times (idempotent)

DROP TABLE IF EXISTS billing_settings;
