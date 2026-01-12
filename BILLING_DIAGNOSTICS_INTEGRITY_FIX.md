# Billing & Diagnostics Integrity Fix Implementation

## Summary
This document describes the comprehensive fix implemented to ensure billing and diagnostics integrity in the Medical Management System, addressing service catalog control, prepayment enforcement, and relatedType standardization.

## Problems Addressed

### 1. Unconstrained Diagnostic Ordering
**Problem**: Doctors could order diagnostic tests (Lab/X-Ray/Ultrasound) that don't exist in Service Management.
- Example: "Hepatitis C Test (HCV)" could be ordered from Treatment page despite not being in the service catalog
- This caused inconsistent pricing and billing issues

**Solution**: Implemented strict catalog control (Option A)
- Lab tests are now filtered based on active services in Service Management
- Only tests with corresponding active services can be ordered
- Service validation happens both client-side (UI filtering) and server-side (API validation)

### 2. Missing Prepayment Enforcement
**Problem**: Backend did NOT enforce "must be paid before performing diagnostics" for X-Ray and Ultrasound update endpoints.
- Technicians could enter results regardless of payment status
- This violated the clinic's prepayment policy

**Solution**: Server-side prepayment enforcement
- Added validation to PUT endpoints for lab tests, X-rays, and ultrasounds
- Updates that constitute "performing" the diagnostic (entering results, changing status to completed) now require payment
- Returns HTTP 402 (Payment Required) with clear error messages when unpaid

### 3. Inconsistent relatedType Values
**Problem**: Inconsistency between order_lines and payment_items relatedType values
- order_lines used: 'lab', 'xray', 'ultrasound' (legacy)
- Schema expected: 'lab_test', 'xray_exam', 'ultrasound_exam' (canonical)
- This caused issues with joins, reporting, and payment processing

**Solution**: Standardization with backward compatibility
- Added normalizeRelatedType() helper function in schema.ts
- Automatically maps legacy values to canonical values
- Updated order creation to use canonical values
- Maintains backward compatibility for existing data

## Technical Implementation

### Schema Changes (shared/schema.ts)

#### 1. Added Normalization Helpers
```typescript
export function normalizeRelatedType(relatedType: string | undefined | null): CanonicalRelatedType | undefined
export function relatedTypeToDepartment(relatedType: string | undefined | null): Department | undefined
```

These helpers ensure consistent relatedType usage across the application.

### Server Changes (server/routes.ts)

#### 1. Prepayment Enforcement Helpers
```typescript
function requiresPrepayment(currentData: any, updateData: any, diagnosticType: string): boolean
function validatePrepayment(paymentStatus: string, diagnosticType: string, diagnosticId: string): ErrorResponse | null
```

#### 2. Updated Diagnostic Update Routes
- **PUT /api/lab-tests/:testId**: Now checks payment status before allowing result entry
- **PUT /api/xray-exams/:examId**: Now checks payment status before allowing findings entry
- **PUT /api/ultrasound-exams/:examId**: Now checks payment status before allowing findings entry

#### 3. Enhanced Order Line Creation
- **POST /api/order-lines**: 
  - Validates service exists and is active
  - Validates service category matches relatedType
  - Normalizes relatedType to canonical values
  - Returns clear error messages for validation failures

### Storage Changes (server/storage.ts)

#### 1. Added getServiceById Method
```typescript
async getServiceById(id: number): Promise<Service | undefined>
```
Enables service validation in order creation.

#### 2. Enhanced Service Seeding
Added comprehensive laboratory services to seed data, including:
- Blood Film for Malaria (BFFM)
- Complete Blood Count (CBC)
- Hemoglobin (HB)
- Blood Group & Rh
- Random Blood Sugar (RBS)
- Pregnancy Test (HCG)
- Hepatitis B Test (HBsAg)
- VDRL Test (Syphilis)
- Renal Function Test (RFT)
- Liver Function Test (LFT)
- Widal Test (Typhoid)
- Urine Analysis
- Urine Microscopy
- Stool Examination

**Important**: "Hepatitis C Test (HCV)" is intentionally excluded from seed data to demonstrate the catalog control requirement.

### Client Changes (client/src/pages/Treatment.tsx)

#### 1. Service-Based Lab Test Filtering
```typescript
const laboratoryServices = useMemo(() => {
  return services.filter(s => s.category === 'laboratory' && s.isActive);
}, [services]);

const availableLabTests = useMemo(() => {
  // Filter tests from catalog that have corresponding active services
  // ...
}, [laboratoryServices]);
```

#### 2. Enhanced Order Validation
- Validates each selected test has a corresponding active service
- Shows clear error if trying to order tests not in catalog
- Uses proper serviceId from matched service
- Uses canonical relatedType ("lab_test")

#### 3. UI Updates
- Test selection shows only tests with active services
- Empty state message when no tests available in category
- Edit dialog also uses filtered test list

## Testing Guide

### Test Case 1: Catalog Control - Hepatitis C Test
**Objective**: Verify that tests not in service catalog cannot be ordered

**Steps**:
1. Start the application with fresh database (will seed default services)
2. Navigate to Treatment page
3. Select a patient and create encounter
4. Go to "Orders" tab and select "Lab Tests"
5. Select "Blood" category
6. Look for "Hepatitis C Test (HCV)" in the test list

**Expected Result**:
- "Hepatitis C Test (HCV)" should NOT appear in the available tests list
- This is because it's not in the seeded services

**To Enable the Test**:
1. Go to Service Management page
2. Add new service:
   - Name: "Hepatitis C Test (HCV)"
   - Category: "laboratory"
   - Price: (set appropriate price)
   - Active: Yes
3. Return to Treatment page
4. "Hepatitis C Test (HCV)" should now appear in available tests

### Test Case 2: Service Validation on Order Creation
**Objective**: Verify server-side validation rejects invalid/inactive services

**Steps**:
1. Try to order a lab test
2. Use browser dev tools to modify the POST request to /api/order-lines
3. Change serviceId to 99999 (non-existent)

**Expected Result**:
- Request should fail with 400 Bad Request
- Error message: "Service ID 99999 does not exist in the catalog"

**Alternative Test**:
1. Create a service and mark it as inactive
2. Try to order using that service's ID

**Expected Result**:
- Request should fail with 400 Bad Request
- Error message: "Service '[name]' is not currently active. Please contact administration."

### Test Case 3: Prepayment Enforcement - Lab Tests
**Objective**: Verify lab results cannot be entered until payment received

**Steps**:
1. Order a lab test from Treatment page
2. Verify the order appears in Laboratory page with status "pending" and payment status "unpaid"
3. Try to enter results (click on test, enter results, click Save)

**Expected Result**:
- Request should fail with 402 Payment Required
- Error message: "Cannot perform lab test until payment has been received. Please collect payment before entering results."
- Results should NOT be saved

**To Complete the Test**:
1. Go to Payment page
2. Process payment for the lab test
3. Return to Laboratory page
4. Now entering results should succeed

### Test Case 4: Prepayment Enforcement - X-Ray
**Objective**: Verify X-ray findings cannot be entered until payment received

**Steps**:
1. Order an X-ray from Treatment page
2. Navigate to Radiology page
3. Select the pending X-ray
4. Try to enter findings in the "Findings" field and save

**Expected Result**:
- Request should fail with 402 Payment Required
- Error message: "Cannot perform xray exam until payment has been received. Please collect payment before entering results."

### Test Case 5: Prepayment Enforcement - Ultrasound
**Objective**: Verify ultrasound findings cannot be entered until payment received

**Steps**:
1. Order an ultrasound from Treatment page
2. Navigate to Ultrasound page
3. Select the pending ultrasound
4. Try to enter findings and save

**Expected Result**:
- Request should fail with 402 Payment Required
- Error message: "Cannot perform ultrasound exam until payment has been received. Please collect payment before entering results."

### Test Case 6: Status Transition Protection
**Objective**: Verify status changes to 'completed' require payment

**Steps**:
1. Have an unpaid diagnostic test (lab/xray/ultrasound)
2. Try to change status from "pending" to "completed"

**Expected Result**:
- Request should fail with 402 Payment Required
- Status should remain "pending"

### Test Case 7: relatedType Normalization
**Objective**: Verify legacy relatedType values are normalized

**Steps**:
1. Check database before fix - may have 'lab', 'xray', 'ultrasound' values
2. Create new order with proper frontend
3. Verify database has 'lab_test', 'xray_exam', 'ultrasound_exam'

**Note**: This is automatic and transparent to users

### Test Case 8: Payment Workflow Still Functions
**Objective**: Verify payment processing works correctly with new changes

**Steps**:
1. Order multiple diagnostics (lab, x-ray, ultrasound)
2. Navigate to Payment page
3. Verify unpaid items appear correctly
4. Process payment for all items
5. Verify payment status updates to 'paid'
6. Verify department classification in daily cash report

**Expected Result**:
- All diagnostics should appear in unpaid items
- Payment should process successfully
- Department classification should be correct (laboratory, radiology, ultrasound)
- Daily cash report should show correct departments

## Error Messages

### Service Validation Errors
- **Invalid relatedType**: `"relatedType '[value]' is not valid"`
- **Service not found**: `"Service ID [id] does not exist in the catalog"`
- **Service inactive**: `"Service '[name]' is not currently active. Please contact administration."`
- **Category mismatch**: `"Service '[name]' is a [category] service but you are trying to order it as [relatedType]"`

### Prepayment Errors
- **Lab test**: `"Cannot perform lab test until payment has been received. Please collect payment before entering results."`
- **X-ray**: `"Cannot perform xray exam until payment has been received. Please collect payment before entering results."`
- **Ultrasound**: `"Cannot perform ultrasound exam until payment has been received. Please collect payment before entering results."`

### Client Validation Errors
- **Missing services**: `"Cannot order the following test(s) - not found in active service catalog: [test names]. Please contact administration to add these tests to Service Management."`

## Backward Compatibility

The implementation maintains backward compatibility:

1. **Existing Data**: Order lines with legacy relatedType values ('lab', 'xray', 'ultrasound') will continue to work
2. **Normalization**: Legacy values are automatically mapped to canonical values
3. **No Data Migration Required**: The normalizeRelatedType() function handles conversion on-the-fly
4. **API Compatibility**: Old API calls with legacy values are accepted and normalized

## Security Considerations

1. **Server-Side Validation**: All validation is enforced server-side, preventing bypass via client manipulation
2. **Payment Enforcement**: Prepayment checks are server-side only, cannot be bypassed from UI
3. **Service Validation**: Service existence and active status checked on every order
4. **HTTP Status Codes**: Proper use of 400 (Bad Request) and 402 (Payment Required)

## Migration Notes

For existing deployments:

1. **Database**: No schema changes required
2. **Services**: Run application to seed default services (if services table is empty)
3. **Existing Orders**: Will continue to work with legacy relatedType values
4. **Testing**: Recommended to test payment workflow after deployment

## Future Enhancements

Potential improvements:

1. **Multiple Service Ordering**: Currently uses first service for composite lab orders; could create separate order lines per test
2. **Price Calculation**: Could sum individual test prices for more accurate billing
3. **Service Bundles**: Could create bundle services (e.g., "Antenatal Panel") with package pricing
4. **Audit Logging**: Could log payment enforcement failures for compliance tracking

## Support

For issues or questions:
- Check error messages for specific validation failures
- Verify services are active in Service Management
- Check payment status in Payment page
- Review console logs for detailed error information
