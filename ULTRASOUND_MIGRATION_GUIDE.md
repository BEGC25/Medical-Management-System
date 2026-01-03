# Ultrasound Page Fixes - Migration Guide

This PR fixes three critical issues with the Ultrasound page:

## Issues Fixed

1. **Incomplete Exam Type Display** - Now shows full exam description (e.g., "Abdominal - Renal (Kidneys & Bladder)")
2. **Wrong Auto-Fill in Clinical Indication** - Clinical indication field no longer auto-fills with exam type
3. **Wrong Timestamp Display** - Time calculations now use Africa/Juba timezone correctly

## Database Migration Required

A new column `specific_exam` has been added to the `ultrasound_exams` table.

### Option 1: Run the TypeScript Migration Script

```bash
cd /path/to/Medical-Management-System
npx tsx server/migrations/add-specific-exam-column.ts
```

### Option 2: Apply SQL Migration Manually

```bash
cd /path/to/Medical-Management-System
sqlite3 clinic.db < migrations/0003_add_specific_exam_column.sql
```

### Option 3: Execute SQL Directly

```bash
sqlite3 clinic.db "ALTER TABLE ultrasound_exams ADD COLUMN specific_exam TEXT;"
```

## Changes Made

### Backend Changes

1. **shared/schema.ts**
   - Added `specificExam: text("specific_exam")` field to `ultrasoundExams` table
   - This field stores the detailed exam selection (e.g., "Renal (Kidneys & Bladder)")

### Frontend Changes

1. **client/src/pages/Ultrasound.tsx**
   - **Fixed timeAgo() function**: Now uses Africa/Juba timezone with date-fns-tz
   - **Updated pending list**: Shows full exam description: `${examType} - ${specificExam}`
   - **Updated report modal header**: Shows full exam description in badge
   - **Fixed timestamp field**: Changed from `exam.requestedDate` to `exam.createdAt` for accurate "time ago" display
   - **Removed auto-fill**: Clinical indication field no longer auto-fills with exam description
   - **Updated placeholder**: Clinical indication now guides users to enter proper medical context
   - **Updated form submission**: Includes `specificExam` value when creating exam requests

## Testing

After applying the migration and deploying:

1. **Test Full Exam Description Display**
   - Create new exam: Select "Abdominal" → "Renal (Kidneys & Bladder)"
   - Verify pending list shows: "abdominal - Renal (Kidneys & Bladder)"
   - Verify report modal shows same

2. **Test Clinical Indication**
   - Create new exam
   - Verify Clinical Indication field is BLANK (no auto-fill)
   - Verify placeholder guides proper medical context

3. **Test Timestamp Accuracy**
   - Create new exam RIGHT NOW
   - Verify shows "less than a minute ago" or similar
   - Wait 2 minutes and refresh
   - Verify shows "2 minutes ago"

## Backward Compatibility

- The `specific_exam` column is nullable, so existing records will have NULL values
- Existing records will display only the `examType` (no " - " separator)
- New records will display the full `examType - specificExam` format

## Rollback

If issues occur, the migration can be reversed (though data in the new column will be lost):

```sql
-- For SQLite, you need to recreate the table without the column
-- This is complex, so it's better to keep the column even if unused
```

Note: SQLite doesn't support DROP COLUMN easily. It's safer to keep the column and just not use it if rollback is needed.
