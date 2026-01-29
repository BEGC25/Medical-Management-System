# Migration 0013: Fix Pharmacy Payment Items

## Purpose
This migration repairs pharmacy `payment_items` records where `total_price` was incorrectly stored as the unit price instead of `unit_price × quantity`.

## Problem
A bug in the payment creation endpoint (`POST /api/payments`) was storing pharmacy payment items with:
- `total_price = unit_price` (WRONG)
- Instead of `total_price = unit_price × quantity` (CORRECT)

This caused:
1. Receipt line items showing wrong amounts (e.g., SSP 100 instead of SSP 2,000)
2. Daily Cash Report showing incorrect pharmacy totals
3. Data inconsistency: `payments.total_amount != SUM(payment_items.total_price)`

## Example
For payment `BGC-PAY2`:
- Drug unit price: SSP 100
- Quantity ordered: 20
- **Before fix:** `total_price = 100` (wrong)
- **After fix:** `total_price = 2000` (correct = 100 × 20)

## Files
- `0013_fix_pharmacy_payment_items.sql` - SQLite version for local development
- `0013_fix_pharmacy_payment_items_pg.sql` - PostgreSQL version for production

## Running the Migration

### Local Development (SQLite)
```bash
sqlite3 clinic.db < migrations/0013_fix_pharmacy_payment_items.sql
```

### Production (PostgreSQL/Neon)
```bash
psql "$DATABASE_URL" < migrations/0013_fix_pharmacy_payment_items_pg.sql
```

## Verification
After running the migration, verify data integrity with:

```sql
SELECT p.payment_id, p.total_amount, SUM(pi.total_price) AS items_sum, 
       p.total_amount - SUM(pi.total_price) AS difference
FROM payments p
JOIN payment_items pi ON pi.payment_id = p.payment_id
GROUP BY p.payment_id, p.total_amount
HAVING ABS(p.total_amount - SUM(pi.total_price)) > 0.01;
```

This should return **no rows** if all data is consistent.

## Related Bug Fix
The backend code in `server/routes.ts` was also fixed to prevent this issue from occurring in future payments. The fix ensures that:
1. Pharmacy payment items use the pharmacy order's quantity (from database) not client-submitted quantity
2. `total_price = unit_price × pharmacy_order.quantity`
3. A runtime integrity check logs warnings if `payments.total_amount != SUM(payment_items.total_price)`
