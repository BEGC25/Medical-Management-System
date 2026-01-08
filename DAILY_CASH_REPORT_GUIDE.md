# Daily Cash Report Enhancement - Implementation Guide

## Overview
This document describes the implementation of premium, mobile-optimized Daily Cash Report enhancements including SSP formatting, variance tracking, admin-only Close Day workflow, clickable department drill-down, and Print/PDF support.

## Database Changes

### Migration File
**Location:** `migrations/0007_add_daily_cash_closings.sql`

This migration creates:
1. `daily_cash_closings` table - stores daily cash closing records
2. `finance_vw_daily_cash` view - aggregates payment data by department

### Running the Migration

#### SQLite (Development)
```bash
cd /home/runner/work/Medical-Management-System/Medical-Management-System
sqlite3 clinic.db < migrations/0007_add_daily_cash_closings.sql
```

#### PostgreSQL (Production)
```bash
psql "$DATABASE_URL" < migrations/0007_add_daily_cash_closings.sql
```

### Database Schema

#### daily_cash_closings Table
```sql
CREATE TABLE daily_cash_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,           -- YYYY-MM-DD format
  expected_amount REAL NOT NULL,        -- Total expected from receipts
  counted_amount REAL NOT NULL,         -- Physical cash counted
  variance REAL NOT NULL,               -- counted_amount - expected_amount
  handed_over_by TEXT NOT NULL,        -- Receptionist name
  received_by TEXT NOT NULL,           -- Admin/Manager name
  notes TEXT,                          -- Optional notes
  closed_by_user_id INTEGER,           -- User ID who closed (if available)
  closed_by_username TEXT,             -- Username who closed
  closed_at TEXT NOT NULL,             -- When day was closed
  created_at TEXT NOT NULL             -- Record creation timestamp
);
```

#### finance_vw_daily_cash View
Aggregates payment data by:
- Collection date (clinic_day)
- Payment method
- Department (derived from related_type in payment_items)
- Cashier (received_by)

## Backend API Endpoints

### 1. Daily Cash Report (Existing - Enhanced)
**Endpoint:** `GET /api/reports/daily-cash?date=YYYY-MM-DD`
**Access:** ADMIN, RECEPTION
**Returns:** Cash receipts summary by department

### 2. Closing Status
**Endpoint:** `GET /api/reports/daily-cash-closing/status?date=YYYY-MM-DD`
**Access:** ADMIN, RECEPTION
**Returns:** Whether day is closed and closing details

**Response:**
```json
{
  "closed": true,
  "closing": {
    "expected_amount": 15000,
    "counted_amount": 15000,
    "variance": 0,
    "handed_over_by": "Jane Doe",
    "received_by": "John Smith",
    "notes": "All cash accounted for",
    "closed_at": "2026-01-08T18:30:00"
  }
}
```

### 3. Close Day
**Endpoint:** `POST /api/reports/daily-cash-closing/close`
**Access:** ADMIN only
**Body:**
```json
{
  "date": "2026-01-08",
  "expected_amount": 15000,
  "counted_amount": 15000,
  "handed_over_by": "Jane Doe",
  "received_by": "John Smith",
  "notes": "Optional notes"
}
```

**Validations:**
- Date must be valid YYYY-MM-DD format
- Counted amount must be non-negative
- handed_over_by and received_by are required
- Date cannot be closed twice (unique constraint)

### 4. Receipt Details
**Endpoint:** `GET /api/reports/daily-cash-receipts?date=YYYY-MM-DD&department=xxx`
**Access:** ADMIN, RECEPTION
**Returns:** Receipt-level details for a department

**Response:**
```json
{
  "date": "2026-01-08",
  "department": "laboratory",
  "receipts": [
    {
      "receipt_id": "PAY-001",
      "payment_date": "2026-01-08",
      "time": "09:30",
      "patient_id": "P-12345",
      "patient_name": "John Doe",
      "amount": 500,
      "cashier": "Jane",
      "service_type": "lab_test"
    }
  ]
}
```

## Frontend Changes

### Role Access Updates
**File:** `client/src/App.tsx`

Updated routes to allow RECEPTION access:
- `/reports/daily-cash` - ADMIN, RECEPTION
- `/payment` - ADMIN, RECEPTION
- `/` (Dashboard) - ADMIN, RECEPTION, DOCTOR, LAB, RADIOLOGY

### Daily Cash Report Page
**File:** `client/src/pages/ReportsDailyCash.tsx`

#### New Features:

1. **SSP Currency Formatting**
   - All amounts display as "SSP X,XXX" with thousand separators
   - Consistent formatting throughout the page

2. **Expected vs Counted vs Variance Section**
   - Three-card layout showing:
     - Expected Cash (from receipts)
     - Counted Cash (user-entered)
     - Variance (color-coded: green for 0, red for non-zero)
   - Visible when day is closed or for admins before closing

3. **Close Day Workflow (Admin-only)**
   - "Close Day" button visible only for admins on unclosed days
   - Modal dialog for entering:
     - Counted cash amount
     - Handed over by (receptionist name)
     - Received by (admin/manager name)
     - Optional notes
   - Validates all inputs before submission
   - Prevents duplicate closes for same date

4. **Clickable Department Drill-down**
   - Click any department row to view receipt details
   - Mobile-friendly drawer showing:
     - Receipt ID
     - Time
     - Patient name/ID
     - Amount
     - Cashier
   - Touch-optimized for mobile devices

5. **Print/PDF Support**
   - "Print/PDF" button triggers window.print()
   - Custom print stylesheet includes:
     - Clinic header
     - Date
     - Expected/Counted/Variance summary
     - Department table
     - Signature lines
     - Closing summary (if day is closed)
   - Hides interactive elements in print view

6. **Mobile Optimization**
   - Responsive layout that adapts to screen size
   - Touch-friendly buttons with appropriate sizing
   - Cards stack on mobile
   - Drawer opens from bottom on mobile
   - Compact button text on small screens

7. **UI Polish**
   - Changed "# Receipts" to "Receipts"
   - Updated page title to "Daily Cash Report"
   - Single toolbar with date picker and actions
   - Proper spacing and padding for mobile
   - Read-only state when day is closed

## User Roles and Permissions

### ADMIN
- View Daily Cash Report
- Close Day
- View receipt details
- Access all features

### RECEPTION
- View Daily Cash Report
- View receipt details
- Cannot close day
- Cannot modify closed days

## Testing Checklist

### API Endpoints
- [ ] GET closing status returns correct data
- [ ] POST close day with valid data succeeds
- [ ] POST close day with invalid data returns error
- [ ] POST close day with duplicate date returns 409 error
- [ ] GET receipt details returns correct receipts
- [ ] Non-admin cannot close day (403 error)

### UI Features
- [ ] Page loads correctly
- [ ] SSP formatting displays correctly
- [ ] Date picker works
- [ ] Expected/Counted/Variance cards show correct data
- [ ] Close Day button only visible for admins
- [ ] Close Day dialog validates inputs
- [ ] Successful close updates UI
- [ ] Department rows are clickable
- [ ] Receipt drawer opens and displays data
- [ ] Print/PDF button works
- [ ] Print layout is correct
- [ ] Mobile layout is responsive
- [ ] Touch targets are adequate

### Role-Based Access
- [ ] RECEPTION can view page
- [ ] RECEPTION cannot close day
- [ ] ADMIN can close day
- [ ] Non-authorized roles cannot access page

## Security Considerations

1. **Server-side enforcement** - Admin-only check for close endpoint in backend
2. **Input validation** - All inputs validated on server
3. **SQL injection prevention** - Parameterized queries used
4. **Unique constraints** - Prevent duplicate closes
5. **Cache disabled** - Financial data not cached
6. **Session-based auth** - All endpoints require valid session

## Known Limitations

1. Cannot undo a day closing (by design - immutable record)
2. Receipt drill-down shows only cash payments
3. View depends on payment_items table structure
4. Time extraction assumes SQLite datetime format

## Future Enhancements

1. Add ability to export receipt details to CSV
2. Add email notification when day is closed
3. Add audit log for who viewed the report
4. Add ability to add attachments (photos of cash count)
5. Add comparison with previous days
6. Add monthly summary view

## Troubleshooting

### View Missing Error
If you see "The SQL view is missing on this database":
1. Run the migration: `sqlite3 clinic.db < migrations/0007_add_daily_cash_closings.sql`
2. Verify view exists: `sqlite3 clinic.db "SELECT name FROM sqlite_master WHERE type='view'"`

### Cannot Close Day
1. Verify you're logged in as admin
2. Check that the day hasn't already been closed
3. Ensure all required fields are filled
4. Check browser console for errors

### Receipt Details Not Loading
1. Verify the department name matches exactly (case-insensitive)
2. Check that payments exist for that date and department
3. Verify payment_method is 'cash'
4. Check browser console for API errors

## File Changes Summary

### New Files
- `migrations/0007_add_daily_cash_closings.sql` - Database migration
- `server/reports.daily-cash-closing.ts` - Close day endpoints
- `server/reports.daily-cash-receipts.ts` - Receipt details endpoint
- `DAILY_CASH_REPORT_GUIDE.md` - This documentation

### Modified Files
- `client/src/App.tsx` - Updated role access for routes
- `client/src/pages/ReportsDailyCash.tsx` - Complete UI overhaul
- `server/routes.ts` - Registered new API endpoints

## Deployment Instructions

1. Run database migration
2. Deploy server code
3. Deploy client code
4. Test with admin account
5. Test with reception account
6. Verify print functionality
7. Test on mobile devices
