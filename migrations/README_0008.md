# Migration 0008: Drop billing_settings Table

## Purpose
Removes the `billing_settings` table as the Billing Settings feature has been removed from the application.

## Rationale
- Currency setting was hardcoded to "SSP" throughout the system
- Require Prepayment toggle only set a checkbox default, with no enforcement
- Allow Emergency Grace toggle was completely unused
- Consultation fee is now managed in Service Management instead

## Changes
- Drops the `billing_settings` table

## Safety
- Uses `DROP TABLE IF EXISTS` for idempotency
- Safe to run multiple times
- No foreign key dependencies to worry about

## Files
- `0008_drop_billing_settings.sql` - SQLite version (for development)
- `0008_drop_billing_settings_pg.sql` - PostgreSQL version (for production)

## How to Apply

### SQLite (Development)
```bash
sqlite3 clinic.db < migrations/0008_drop_billing_settings.sql
```

### PostgreSQL (Production)
```bash
psql $DATABASE_URL -f migrations/0008_drop_billing_settings_pg.sql
```

## Rollback
Not applicable - if needed, the table schema can be found in git history and recreated, though this is not recommended as the feature has been removed from the application.
