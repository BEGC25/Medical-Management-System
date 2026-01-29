# Pharmacy Order Lines Fix - Implementation Summary

## Overview
This fix addresses the issue where pharmacy charges don't appear in the Billing & Invoices page by correcting the order line creation logic for pharmacy orders.

## Problem
- PR #492 attempted to create order lines for pharmacy orders but **incorrectly required a pharmacy service to exist** in the services table
- This contradicted the architecture established in PR #481, which made `payment_items.service_id` nullable specifically because pharmacy pricing comes from the drug inventory, not the services table
- Database evidence showed:
  - No pharmacy order lines existed (`SELECT * FROM order_lines WHERE related_type = 'pharmacy_order'` returned no results)
  - No pharmacy services existed in the services table
  - 4 pharmacy orders existed (BGC-PHARM1 through BGC-PHARM4) but without corresponding order lines

## Solution

### 1. Schema Changes (`shared/schema.ts`)
Made `orderLines.serviceId` nullable to align with the PR #481 architecture:

```typescript
// BEFORE:
serviceId: integer("service_id").notNull(),

// AFTER:
serviceId: integer("service_id"), // Optional - null for pharmacy_order items (priced via drug catalog)
```

### 2. Route Handler Changes (`server/routes.ts`)
Updated `POST /api/pharmacy-orders` to not require a pharmacy service:

**Key Changes:**
- Removed pharmacy service lookup and validation that threw error
- Set `serviceId: null` for pharmacy order lines
- Pass empty services array to `calculatePharmacyOrderPriceHelper` to enforce drug inventory pricing
- Simplified from ~88 lines to ~68 lines of code

```typescript
// BEFORE:
const [pharmacyServices, drugs] = await Promise.all([
  storage.getServicesByCategory("pharmacy"),
  storage.getDrugs(true)
]);
// ... complex service lookup logic ...
if (!service) {
  throw new Error("No active pharmacy service found. Please create a pharmacy service in Service Management.");
}
serviceId: service.id,

// AFTER:
const drugs = await storage.getDrugs(true);
const unitPrice = await calculatePharmacyOrderPriceHelper(
  pharmacyOrder,
  [], // Empty services array - pharmacy pricing from drug inventory, not services
  drugMap,
  storage
);
serviceId: null, // Pharmacy orders don't need a service
```

### 3. Backfill Migration (`server/migrations/backfill-pharmacy-order-lines.ts`)
Created an idempotent backfill script that:
- Finds all pharmacy orders with `encounterId` but no corresponding order line
- Creates order lines with `serviceId: null` and prices from drug inventory
- Runs automatically on server startup (safe because it checks for existing order lines)
- Handles errors gracefully without crashing the server

### 4. SQL Migration (`migrations/0014_make_order_lines_service_id_nullable.sql`)
Created SQLite migration to make `service_id` nullable in the `order_lines` table:
- Uses the CREATE-INSERT-DROP-RENAME pattern (SQLite doesn't support ALTER COLUMN)
- Preserves all existing data
- Follows the same pattern as PR #481's pharmacy_orders migration

### 5. Startup Integration (`server/index.ts`)
Added backfill execution to server startup:
- Runs after routes are registered
- Logs errors without crashing the server
- Includes comment explaining the idempotent nature

## Architecture Alignment

This fix aligns with the architecture established in PR #481:

| Service Type | Price Source | serviceId |
|-------------|--------------|-----------|
| Consultation | `services` table | Required (NOT NULL) |
| Laboratory | `services` table | Required (NOT NULL) |
| X-Ray | `services` table | Required (NOT NULL) |
| Ultrasound | `services` table | Required (NOT NULL) |
| **Pharmacy** | `drug_batches.unitCost` or `drugs.defaultPrice` | **NULL** |

By passing an empty services array to `calculatePharmacyOrderPriceHelper`, we ensure that pharmacy orders always use drug inventory pricing, even if they have a legacy `serviceId` set from before PR #481.

## Expected Outcomes

After this fix:
1. ✅ New pharmacy orders will create order lines with `serviceId: null`
2. ✅ Existing pharmacy orders (BGC-PHARM1 through BGC-PHARM4) will have order lines created on next server startup
3. ✅ Pharmacy charges will appear in Billing & Invoices alongside consultations, lab tests, x-rays, and ultrasounds
4. ✅ No pharmacy service is required in Service Management
5. ✅ All existing pharmacy payment, receipt, and Daily Cash Report functionality continues to work (established in PRs #488, #490, #491)

## Files Changed

1. `shared/schema.ts` - Made `orderLines.serviceId` nullable
2. `server/routes.ts` - Updated `POST /api/pharmacy-orders` to allow null serviceId
3. `server/migrations/backfill-pharmacy-order-lines.ts` - Created backfill script
4. `server/index.ts` - Added backfill execution on startup
5. `migrations/0014_make_order_lines_service_id_nullable.sql` - SQLite schema migration

## Testing Recommendations

1. **Database Migration**: Apply the SQL migration to make `order_lines.service_id` nullable
2. **Server Restart**: Restart the server to run the backfill migration
3. **Verify Backfill**: Check that order lines were created for existing pharmacy orders:
   ```sql
   SELECT * FROM order_lines WHERE related_type = 'pharmacy_order';
   ```
4. **Create New Pharmacy Order**: Test creating a new pharmacy order and verify the order line is created
5. **Check Billing Page**: Verify pharmacy charges appear in the Billing & Invoices page
6. **Verify No Service Required**: Confirm pharmacy orders work without any pharmacy service in Service Management

## Security Analysis

CodeQL analysis completed with **0 security alerts** found.

## Related Pull Requests

- **PR #481**: Made `payment_items.service_id` nullable - established the pharmacy pricing architecture
- **PR #488**: Fixed receipt display for pharmacy items
- **PR #490**: Fixed pharmacy payment total calculation
- **PR #491**: Fixed payment_items storing unit_price vs total_price for pharmacy
- **PR #492**: Attempted to create order lines but incorrectly required pharmacy service (this PR fixes that)

## Backward Compatibility

This change is backward compatible:
- Existing pharmacy orders with `serviceId` set will continue to work
- The pricing logic ensures drug inventory pricing is used regardless of legacy serviceId values
- Other service types (consultation, lab, x-ray, ultrasound) are unaffected
- All existing pharmacy payment and receipt functionality continues to work
