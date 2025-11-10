# Payments Clinic Day Extension - Implementation Summary

**Date:** 2025-11-11  
**Branch:** hotfix/clinic-day-unification  
**PR:** Extend clinic_day unification to payments module

## Overview

This implementation extends the existing clinic_day unification pattern to the payments module, ensuring consistent date filtering across all preset ranges (Today/Yesterday/Last7/Last30) using Africa/Juba timezone.

## Problem Statement

The payments table lacked the `clinic_day` column that other modules (patients, lab_tests, xray_exams, ultrasound_exams, treatments) already use. This caused:
- "Today's Payments" tab showing empty results
- Inconsistent date filtering between modules
- Timezone-related discrepancies in payment reporting

## Solution

### 1. Database Schema Changes

**File:** `sql/2025-11-11_payments_clinic_day_pg.sql`

Added idempotent migration script that:
- Adds `clinic_day DATE` column to `payments` table
- Backfills from `created_at` using Africa/Juba timezone conversion
- Sets default value for new records: `(timezone('Africa/Juba', now()))::date`
- Creates index `idx_payments_clinic_day` for efficient filtering

```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS clinic_day DATE;
UPDATE payments SET clinic_day = (created_at::timestamptz AT TIME ZONE 'Africa/Juba')::date WHERE clinic_day IS NULL;
ALTER TABLE payments ALTER COLUMN clinic_day SET DEFAULT (timezone('Africa/Juba', now()))::date;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_clinic_day ON payments(clinic_day);
```

### 2. Schema Definition

**File:** `shared/schema.ts`

Added `clinicDay` field to payments table schema:

```typescript
export const payments = sqliteTable("payments", {
  // ... existing fields ...
  clinicDay: text("clinic_day"), // Clinic day in YYYY-MM-DD format (Africa/Juba timezone)
  createdAt: text("created_at").notNull(),
});
```

### 3. Storage Layer

**File:** `server/storage.ts`

Modified `createPayment()` to automatically set clinic_day:

```typescript
async createPayment(data: schema.InsertPayment): Promise<schema.Payment> {
  const paymentId = await generatePaymentId();
  const now = new Date().toISOString();
  const clinicDay = getClinicDayKey(); // Africa/Juba timezone
  const insertData: any = {
    ...data,
    paymentId,
    clinicDay,
    createdAt: now,
  };
  const [payment] = await db.insert(payments).values(insertData).returning();
  return payment;
}
```

Updated `getPayments()` to support date range filtering:

```typescript
async getPayments(startDayKey?: string, endDayKey?: string): Promise<schema.Payment[]> {
  if (startDayKey && endDayKey) {
    return await db.select().from(payments)
      .where(
        and(
          gte(payments.clinicDay, startDayKey),
          lte(payments.clinicDay, endDayKey)
        )
      )
      .orderBy(desc(payments.createdAt));
  }
  return await db.select().from(payments).orderBy(desc(payments.createdAt));
}
```

### 4. API Route

**File:** `server/routes.ts`

Enhanced `/api/payments` endpoint to support preset filtering:

```typescript
router.get("/api/payments", async (req, res) => {
  const { patientId, date, receivedBy, limit, preset, from, to } = req.query;
  
  let startDayKey: string | undefined;
  let endDayKey: string | undefined;
  
  // Parse preset (today/yesterday/last7/last30)
  if (preset) {
    const { getPresetDayKeys } = await import('./utils/clinic-range');
    const dayKeys = getPresetDayKeys(preset as string);
    if (dayKeys) {
      startDayKey = dayKeys.startDayKey;
      endDayKey = dayKeys.endDayKey;
      console.log(`[payments] Preset ${preset}: ${startDayKey} to ${endDayKey}`);
    }
  }
  // Custom range support
  else if (from && to) {
    startDayKey = from as string;
    endDayKey = to as string;
  }
  // Legacy parameter support with deprecation warnings
  else if (req.query.today === '1') {
    console.warn('[payments] DEPRECATED: today=1. Use preset=today');
    // ... handle legacy params
  }
  
  let payments = patientId
    ? await storage.getPaymentsByPatient(patientId as string)
    : await storage.getPayments(startDayKey, endDayKey);
  
  // ... rest of implementation
});
```

### 5. Frontend

**File:** `client/src/pages/Payment.tsx`

Updated payment history query to use preset-based filtering:

```typescript
const { data: paymentHistory = [], ... } = useQuery<any[]>({
  queryKey: ["/api/payments", { preset: paymentHistoryTab === "today" ? "today" : undefined }, paymentSearchQuery],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (paymentHistoryTab === "today") {
      params.append('preset', 'today');  // Changed from 'date', today
    }
    if (paymentSearchQuery) {
      params.append('patientId', paymentSearchQuery);
    }
    const response = await fetch(`/api/payments?${params.toString()}`);
    return response.json();
  },
});
```

Removed unused `getClinicDayKey` import (now handled server-side).

## Key Features

### Preset Support
- `preset=today` - Current clinic day
- `preset=yesterday` - Previous clinic day  
- `preset=last7` - Last 7 days inclusive
- `preset=last30` - Last 30 days inclusive

### Custom Range Support
- `from=YYYY-MM-DD&to=YYYY-MM-DD` - Custom date range

### Legacy Parameter Support
- `date=YYYY-MM-DD` - Single day filter (deprecated with warning)
- `today=1` - Today's payments (deprecated with warning)

### Financial Audit Requirements
- Soft-deleted patients are included in payment queries
- This ensures complete financial audit trail

## Testing

### Manual Testing

Run the test script:
```bash
node test-payments-preset.js
```

### Acceptance Tests

1. **Today's Count Match:**
   ```bash
   # API
   curl "http://localhost:5000/api/payments?preset=today" | jq 'length'
   
   # SQL
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM payments WHERE clinic_day = (timezone('Africa/Juba', now()))::date;"
   ```

2. **Tab Switching:**
   - Navigate to Payment page in browser
   - Switch between "Today's Payments" and "All Payments" tabs
   - Verify distinct React Query requests in Network tab
   - Verify different counts displayed

3. **New Payment Immediate Display:**
   - Create a new payment
   - Verify it appears immediately in "Today's Payments" tab
   - Verify query cache is invalidated

4. **Yesterday Exclusion:**
   ```bash
   curl "http://localhost:5000/api/payments?preset=yesterday"
   ```
   - Should not include today's payments

5. **Performance:**
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM payments 
   WHERE clinic_day = (timezone('Africa/Juba', now()))::date;
   ```
   - Should show index usage: `idx_payments_clinic_day`

## Deployment Steps

### Prerequisites
- Database already has `clinic_day` column (applied manually)
- Backfill already completed (verified COUNT(*) WHERE clinic_day IS NULL = 0)
- Index already created

### Server Deployment
1. Merge PR to main branch
2. Deploy to Render (auto-deploy on push)
3. Verify API endpoints respond correctly

### Client Deployment
1. Vercel auto-deploys on main branch push
2. Verify Payment page tabs work correctly

### Post-Deployment Verification
1. Check server logs for preset parsing messages
2. Verify Today's Payments shows correct count
3. Test all preset options (today/yesterday/last7/last30)
4. Verify legacy parameters still work (with deprecation warnings in logs)

## Rollback Plan

If issues occur:

1. **Revert Code Changes:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Database Rollback (if needed):**
   ```sql
   DROP INDEX IF EXISTS idx_payments_clinic_day;
   ALTER TABLE payments DROP COLUMN IF EXISTS clinic_day;
   ```

## Benefits

1. **Consistency:** Payments now use same clinic_day pattern as other modules
2. **Accuracy:** Timezone-aware filtering ensures correct "Today" results
3. **Performance:** Index on clinic_day enables efficient filtering
4. **Compatibility:** Legacy parameters continue to work with deprecation warnings
5. **Audit Trail:** Soft-deleted patients included for complete financial records

## Future Improvements (Deferred)

- Payment summary endpoint (/api/payments/summary) for KPI display
- UX restructuring for cashier & manager workflows  
- Shift/denomination tracking
- Payment receipt improvements

## References

- Issue: Extend clinic_day unification to payments module
- Related: Clinic Day Unification (Phase 1) - patients/lab/xray/ultrasound
- Timezone: Africa/Juba (UTC+2)
- Database: Neon PostgreSQL

---

**Author:** GitHub Copilot  
**Reviewer:** BEGC25  
**Status:** Ready for Review
