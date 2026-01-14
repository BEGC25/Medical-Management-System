# Migration 0010: Make service_id Nullable in pharmacy_orders Table

## Purpose
This migration fixes a critical bug where pharmacy orders fail with a 500 error when submitting medications from the Treatment page.

## Background
PR #294 changed the TypeScript schema definition in `shared/schema.ts` to make `serviceId` optional for backward compatibility with service-based pricing:
```typescript
serviceId: integer("service_id"), // Optional - for backward compatibility with service-based pricing
```

However, the actual database table was not migrated and still has a NOT NULL constraint. When the frontend sends a pharmacy order with `serviceId: null`, the database insertion fails because SQLite/PostgreSQL enforces the NOT NULL constraint.

## Changes
- Removes the NOT NULL constraint from `service_id` column in `pharmacy_orders` table
- Allows pharmacy orders to be created with or without a service_id
- Maintains backward compatibility with existing records that have service_id values

## How to Apply

### SQLite (Development/Local):
```bash
sqlite3 clinic.db < migrations/0010_make_pharmacy_service_id_nullable.sql
```

### PostgreSQL (Production):
```bash
psql $DATABASE_URL -f migrations/0010_make_pharmacy_service_id_nullable_pg.sql
```

Or use the Neon SQL Editor:
1. Go to your Neon dashboard
2. Open SQL Editor
3. Copy and run the contents of `migrations/0010_make_pharmacy_service_id_nullable_pg.sql`

## Impact
- **Existing records**: No data loss - all existing pharmacy orders with service_id values will continue to work
- **New records**: Pharmacy orders can now be created with `serviceId: null` (using drug-based pricing)
- **API**: The `/api/pharmacy-orders` endpoint will accept requests with `serviceId: null`

## Verification
After running the migration, verify:

### SQLite:
```sql
-- Check that service_id is now nullable
PRAGMA table_info(pharmacy_orders);
-- Look for service_id column - should NOT have "NOT NULL" in the type

-- Test creating a record with null service_id
INSERT INTO pharmacy_orders (order_id, patient_id, quantity, status, payment_status, created_at)
VALUES ('TEST-001', 'BGC1', 1, 'prescribed', 'unpaid', datetime('now'));

-- Verify the test record was created
SELECT * FROM pharmacy_orders WHERE order_id = 'TEST-001';

-- Clean up test record
DELETE FROM pharmacy_orders WHERE order_id = 'TEST-001';
```

### PostgreSQL:
```sql
-- Check column constraints
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'pharmacy_orders' AND column_name = 'service_id';
-- is_nullable should be 'YES'

-- Test creating a record with null service_id (same as SQLite above)
```

## Rollback
**⚠️ Warning**: Rolling back this migration may break pharmacy orders that were created with `serviceId: null`.

### SQLite:
To rollback, you would need to:
1. Check if any records have `service_id IS NULL`
2. Update those records with a valid service_id or delete them
3. Recreate the table with service_id NOT NULL

This is complex and not recommended unless absolutely necessary.

### PostgreSQL:
```sql
-- First check for records with null service_id
SELECT COUNT(*) FROM pharmacy_orders WHERE service_id IS NULL;

-- If you must rollback, add the NOT NULL constraint back
-- WARNING: This will fail if any records have null service_id
ALTER TABLE pharmacy_orders ALTER COLUMN service_id SET NOT NULL;
```

## Related Changes
- `shared/schema.ts`: Already updated in PR #294 to make serviceId optional
- No code changes needed - this migration aligns the database with the schema

## Testing
After applying the migration:
1. Navigate to the Treatment page
2. Select a patient
3. Click "Submit to Pharmacy" with a medication that has `drugId` but no `serviceId`
4. Verify the pharmacy order is created successfully (no 500 error)
5. Verify existing pharmacy orders still work correctly
