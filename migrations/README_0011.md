# Migration 0011: Make service_id Nullable in payment_items Table

## Purpose
This migration fixes a critical bug where pharmacy order payments fail with a 500 error:
```
"Missing serviceId for payment item type pharmacy_order"
```

## Background
Pharmacy medications are priced from the drug catalog (`drugs` table and `drug_batches` table), not from the `services` table. When paying for pharmacy orders:

1. The frontend sends `serviceId: 0` for pharmacy items because there is no corresponding service record
2. The backend validation fails because `payment_items.service_id` has a NOT NULL constraint
3. This causes a 500 error even though the pharmacy order has valid pricing from the drug catalog

## Changes
- Removes the NOT NULL constraint from `service_id` column in `payment_items` table
- Allows pharmacy order payment items to have `serviceId: null`
- Non-pharmacy payment items (consultation, lab, radiology, ultrasound) still require a valid serviceId

## How to Apply

### SQLite (Development/Local):
```bash
sqlite3 clinic.db < migrations/0011_make_payment_items_service_id_nullable.sql
```

### PostgreSQL (Production):
```bash
psql $DATABASE_URL -f migrations/0011_make_payment_items_service_id_nullable_pg.sql
```

Or use the Neon SQL Editor:
1. Go to your Neon dashboard
2. Open SQL Editor
3. Copy and run the contents of `migrations/0011_make_payment_items_service_id_nullable_pg.sql`

## Impact
- **Existing records**: No data loss - all existing payment items with service_id values will continue to work
- **New pharmacy payments**: Payment items for pharmacy orders can now have `serviceId: null`
- **Non-pharmacy payments**: Still require a valid serviceId (validated in backend)
- **Receipts/Reports**: Already handle null serviceId gracefully for pharmacy items

## Verification
After running the migration, verify:

### SQLite:
```sql
-- Check that service_id is now nullable
PRAGMA table_info(payment_items);
-- Look for service_id column - should NOT have "1" in the "notnull" column

-- Test creating a payment item with null service_id
INSERT INTO payment_items (payment_id, quantity, unit_price, total_price, amount, created_at, related_type, related_id)
VALUES ('TEST-PAY-001', 1, 100.00, 100.00, 100.00, datetime('now'), 'pharmacy_order', 'TEST-ORD-001');

-- Verify the test record was created
SELECT * FROM payment_items WHERE payment_id = 'TEST-PAY-001';

-- Clean up test record
DELETE FROM payment_items WHERE payment_id = 'TEST-PAY-001';
```

### PostgreSQL:
```sql
-- Check column constraints
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_items' AND column_name = 'service_id';
-- is_nullable should be 'YES'

-- Test creating a payment item with null service_id (same as SQLite above)
```

## Rollback
**⚠️ Warning**: Rolling back this migration may break pharmacy payments that were created with `serviceId = NULL`.

### SQLite:
To rollback, you would need to:
1. Check if any records have `service_id IS NULL`
2. Update those records with a valid service_id or delete them
3. Recreate the table with service_id NOT NULL

This is complex and not recommended unless absolutely necessary.

### PostgreSQL:
```sql
-- First check for records with null service_id
SELECT COUNT(*) FROM payment_items WHERE service_id IS NULL;

-- If you must rollback, add the NOT NULL constraint back
-- WARNING: This will fail if any records have null service_id
ALTER TABLE payment_items ALTER COLUMN service_id SET NOT NULL;
```

## Related Changes
- `shared/schema.ts`: Updated to make serviceId optional in paymentItems table
- `server/routes.ts`: Updated POST /api/payments to:
  - Allow null serviceId for pharmacy_order items
  - Require serviceId for all other item types
  - Load pharmacy pricing from database instead of trusting client
- `client/src/pages/Payment.tsx`: Removed `|| 0` coercion for serviceId

## Testing
After applying the migration:
1. Navigate to the Payment page
2. Select a patient with unpaid pharmacy orders
3. Add the pharmacy order to payment
4. Process the payment
5. Verify the payment is created successfully (no 500 error)
6. Verify the receipt shows the correct drug name and price
7. Verify existing non-pharmacy payments still work correctly
