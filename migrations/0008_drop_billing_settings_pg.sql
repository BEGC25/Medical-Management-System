-- Migration: Drop billing_settings table
-- PostgreSQL version
-- Safe to run multiple times (idempotent)

DROP TABLE IF EXISTS billing_settings;
