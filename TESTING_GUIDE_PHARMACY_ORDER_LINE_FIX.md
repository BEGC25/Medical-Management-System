# Testing Guide: Pharmacy Order Line Creation Fix

## Overview
This guide provides instructions for testing the fix that ensures pharmacy charges appear in the Billing & Invoices page.

## Problem Being Fixed
Previously, when a doctor prescribed medication in the Treatment page:
- ✅ A pharmacy order was created
- ❌ **No order line was created**
- ❌ Pharmacy charges did NOT appear in Billing & Invoices
- ❌ Invoices did NOT include pharmacy items

## Expected Behavior After Fix
When a doctor prescribes medication in the Treatment page:
- ✅ A pharmacy order is created
- ✅ **An order line is also created** (NEW)
- ✅ Pharmacy charges WILL appear in Billing & Invoices (FIXED)
- ✅ Invoices WILL include pharmacy items (FIXED)

## Test Scenarios

### Scenario 1: Create Pharmacy Order with Encounter
**Purpose**: Verify that order line is created when pharmacy order has an encounterId

**Prerequisites**:
1. At least one active pharmacy service exists in Service Management
2. At least one drug exists in the drug catalog
3. A patient has an active encounter (visit)

**Steps**:
1. Navigate to Treatment page for a patient with an active encounter
2. Prescribe a medication:
   - Select a drug from the catalog
   - Enter dosage (e.g., "500mg")
   - Enter quantity (e.g., 2)
   - Enter instructions
3. Save the pharmacy order

**Expected Results**:
- ✅ Pharmacy order is created successfully
- ✅ Order line is created with:
  - `relatedType` = "pharmacy_order"
  - `relatedId` = pharmacy order's orderId
  - `description` = "Pharmacy: [DrugName] ([Dosage])"
  - `unitPriceSnapshot` = calculated price from drug/service
  - `quantity` = prescribed quantity
  - `totalPrice` = unitPriceSnapshot × quantity
  - `department` = "pharmacy"
- ✅ Check server logs for: `[PHARMACY-ORDER] Created order line for pharmacy order [orderId]`

**Verification Queries** (if you have database access):
```sql
-- Check pharmacy order was created
SELECT * FROM pharmacy_orders WHERE order_id = '[orderId]';

-- Check order line was created
SELECT * FROM order_lines 
WHERE related_type = 'pharmacy_order' 
AND related_id = '[orderId]';
```

### Scenario 2: View Pharmacy Charges in Billing & Invoices
**Purpose**: Verify that pharmacy charges now appear in the Billing page

**Prerequisites**:
- Complete Scenario 1 (pharmacy order with encounter created)

**Steps**:
1. Navigate to Billing & Invoices page
2. Find the patient's visit
3. Click on "Visit Details" or "View Services"

**Expected Results**:
- ✅ Pharmacy charges are displayed in the "Services & Charges" section
- ✅ Drug name, dosage, quantity, and price are shown
- ✅ Total amount includes pharmacy charges

### Scenario 3: Generate Invoice with Pharmacy Items
**Purpose**: Verify that invoices include pharmacy items

**Prerequisites**:
- Complete Scenario 1 (pharmacy order with encounter created)

**Steps**:
1. Navigate to Billing & Invoices page
2. Select the patient's visit
3. Generate invoice

**Expected Results**:
- ✅ Invoice includes pharmacy line items
- ✅ Pharmacy charges are itemized correctly
- ✅ Total invoice amount includes pharmacy charges

### Scenario 4: Pharmacy Order without Encounter
**Purpose**: Verify that order line is NOT created when pharmacy order has no encounterId

**Prerequisites**:
- System allows pharmacy orders without encounters (rare case)

**Steps**:
1. Create a pharmacy order without an encounterId (e.g., via API)
2. Check if order line is created

**Expected Results**:
- ✅ Pharmacy order is created successfully
- ✅ No order line is created (intentional - no encounter to link to)
- ✅ No error occurs

### Scenario 5: Multiple Pharmacy Orders in Same Visit
**Purpose**: Verify that multiple pharmacy orders create multiple order lines

**Prerequisites**:
- Patient has an active encounter

**Steps**:
1. Prescribe first medication (e.g., Paracetamol)
2. Prescribe second medication (e.g., Amoxicillin)
3. Check billing page

**Expected Results**:
- ✅ Both pharmacy orders are created
- ✅ Two separate order lines are created
- ✅ Both medications appear in Billing & Invoices
- ✅ Each has correct price and quantity

### Scenario 6: Price Calculation
**Purpose**: Verify that prices are calculated correctly

**Test Cases**:

**Case 6a: Price from Service**
- Pharmacy order has a serviceId
- Service has a price set
- Expected: unitPriceSnapshot = service price

**Case 6b: Price from Drug Default Price**
- Pharmacy order has no serviceId OR service has no price
- Drug has a defaultPrice set
- Expected: unitPriceSnapshot = drug defaultPrice

**Case 6c: Price from Latest Batch**
- Drug has no defaultPrice
- Latest batch exists with unitCost
- Expected: unitPriceSnapshot = batch unitCost

**Case 6d: No Price Available**
- No service price, no drug price, no batch price
- Expected: unitPriceSnapshot = 0

### Scenario 7: Error Handling - No Pharmacy Service
**Purpose**: Verify graceful handling when no pharmacy service exists

**Prerequisites**:
- Delete or deactivate all pharmacy services

**Steps**:
1. Try to create a pharmacy order with encounterId

**Expected Results**:
- ✅ Pharmacy order is created successfully (order line creation fails gracefully)
- ✅ Error logged: `[PHARMACY-ORDER] No active pharmacy service found`
- ✅ Error logged: `[PHARMACY-ORDER] Pharmacy order was created successfully but order line creation failed`
- ⚠️ Order line is NOT created (expected due to missing service)
- ℹ️ Admin should create a pharmacy service in Service Management

## API Testing

### Test POST /api/pharmacy-orders
```bash
curl -X POST http://localhost:3000/api/pharmacy-orders \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P-123",
    "treatmentId": "T-456",
    "encounterId": "ENC-789",
    "drugId": 1,
    "drugName": "Paracetamol",
    "dosage": "500mg",
    "quantity": 2,
    "instructions": "Take twice daily"
  }'
```

**Expected Response**:
- Status: 201 Created
- Body: Pharmacy order object with orderId

**Database Check**:
```sql
-- Verify order line was created
SELECT ol.*, po.drug_name, po.dosage 
FROM order_lines ol
JOIN pharmacy_orders po ON ol.related_id = po.order_id
WHERE ol.related_type = 'pharmacy_order'
AND po.encounter_id = 'ENC-789'
ORDER BY ol.created_at DESC
LIMIT 1;
```

## Performance Testing

### Test: Concurrent Pharmacy Order Creation
**Purpose**: Verify system handles multiple simultaneous pharmacy orders

**Steps**:
1. Create 10 pharmacy orders concurrently
2. Verify all order lines are created correctly

**Expected Results**:
- ✅ All pharmacy orders created
- ✅ All order lines created
- ✅ No race conditions or deadlocks
- ✅ Performance is acceptable (< 2 seconds per order)

## Regression Testing

### Verify Other Services Still Work
Test that the fix doesn't break existing functionality:

1. ✅ **Consultation**: Create consultation, verify order line created
2. ✅ **Laboratory**: Order lab test, verify order line created
3. ✅ **X-Ray**: Order x-ray, verify order line created
4. ✅ **Ultrasound**: Order ultrasound, verify order line created

## Test Data Setup

### Minimum Required Data
1. **Patient**: At least one patient record
2. **Encounter**: At least one active encounter
3. **Drug**: At least one drug in catalog with:
   - Name (e.g., "Paracetamol")
   - Form (e.g., "tablet")
   - Strength (e.g., "500mg")
   - Default price OR batch with unit cost
4. **Service**: At least one active pharmacy service with price

### SQL to Create Test Service
```sql
-- Create a pharmacy service if none exists
INSERT INTO services (name, code, category, price, is_active)
VALUES ('Pharmacy Dispensing', 'PHARM-001', 'pharmacy', 5.00, 1);
```

## Test Results Template

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| 1. Create pharmacy order with encounter | ⬜ | |
| 2. View pharmacy charges in billing | ⬜ | |
| 3. Generate invoice with pharmacy items | ⬜ | |
| 4. Pharmacy order without encounter | ⬜ | |
| 5. Multiple pharmacy orders | ⬜ | |
| 6. Price calculation | ⬜ | |
| 7. Error handling - no service | ⬜ | |
| Regression: Consultation | ⬜ | |
| Regression: Laboratory | ⬜ | |
| Regression: X-Ray | ⬜ | |
| Regression: Ultrasound | ⬜ | |

Legend:
- ⬜ Not tested
- ✅ Passed
- ❌ Failed

## Known Limitations

1. **Order line creation failure is silent**: If order line creation fails, the pharmacy order is still created successfully. This is intentional to avoid data loss, but admins should monitor logs for: `[PHARMACY-ORDER] Failed to create order line`

2. **Requires active pharmacy service**: If no active pharmacy service exists, order line creation will fail. Admins should ensure at least one pharmacy service is created in Service Management.

## Troubleshooting

### Pharmacy charges not appearing in billing

**Check 1**: Does pharmacy order have encounterId?
```sql
SELECT order_id, encounter_id FROM pharmacy_orders WHERE order_id = '[orderId]';
```
- If encounterId is NULL, order line won't be created

**Check 2**: Was order line created?
```sql
SELECT * FROM order_lines 
WHERE related_type = 'pharmacy_order' 
AND related_id = '[orderId]';
```
- If no order line exists, check server logs

**Check 3**: Is there an active pharmacy service?
```sql
SELECT * FROM services WHERE category = 'pharmacy' AND is_active = 1;
```
- If none exist, create one in Service Management

**Check 4**: Check server logs
```bash
grep "PHARMACY-ORDER" logs/server.log
```
- Look for error messages

## Deployment Checklist

Before deploying to production:
- [ ] Verify at least one active pharmacy service exists
- [ ] Run all test scenarios
- [ ] Verify existing pharmacy orders are unaffected
- [ ] Verify other service types (lab, x-ray, etc.) still work
- [ ] Monitor logs for `[PHARMACY-ORDER]` messages
- [ ] Backup database before deployment
- [ ] Test rollback procedure if needed

---

**Note**: This fix only affects NEW pharmacy orders created after deployment. Existing pharmacy orders without order lines will need to be manually backfilled if billing history is required.
