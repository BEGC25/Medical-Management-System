# Migration 0009: Add Patient Type Column

## Purpose
This migration adds support for different patient types to distinguish between regular patients and external referral patients who only need diagnostic services.

## Changes
- Adds `patient_type` column to `patients` table
- Default value: `'regular'`
- Allowed values: `'regular'`, `'referral_diagnostic'`

## Impact
- **Regular patients**: Continue to work as before - they appear in Treatment queue and receive consultation fees
- **Referral/Diagnostic-only patients**: 
  - Do NOT appear in Doctor's Treatment queue
  - Do NOT get charged consultation fees
  - Only appear in diagnostic department work queues (Lab/X-ray/Ultrasound)

## How to Apply

### SQLite (Development/Local):
```bash
sqlite3 clinic.db < migrations/0009_add_patient_type.sql
```

### PostgreSQL (Production):
```sql
ALTER TABLE patients ADD COLUMN patient_type TEXT NOT NULL DEFAULT 'regular';
```

## Rollback
To rollback this migration:

```sql
ALTER TABLE patients DROP COLUMN patient_type;
```

**Note**: This will permanently delete the patient type information. Use with caution.

## Verification
After running the migration, verify:
```sql
-- Check that column was added
SELECT patient_type FROM patients LIMIT 1;

-- All existing patients should have 'regular' type
SELECT patient_type, COUNT(*) FROM patients GROUP BY patient_type;
```

## Related Changes
- `shared/schema.ts`: Updated patient schema with `patientType` field
- `server/storage.ts`: Updated registration workflow to skip consultation for referral patients
- `client/src/pages/Patients.tsx`: Added patient type selection in registration form
- `client/src/pages/Treatment.tsx`: Filter out referral patients from Treatment queue
- Diagnostic pages: Added visual indicators for referral patients
