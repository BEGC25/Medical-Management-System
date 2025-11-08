# Manual Testing Guide - Timezone Date Filtering Fix

## Overview
This guide helps you verify that the timezone date filtering fix works correctly across all pages.

## Test Environment Setup

### Option 1: Change Browser Timezone (Recommended)
1. Open Chrome DevTools (F12)
2. Click the three dots menu → More tools → Sensors
3. Under "Location", find "Timezone" dropdown
4. Try these timezones:
   - `Africa/Juba` (UTC+2) - The clinic's actual timezone
   - `America/New_York` (UTC-5) - US East Coast
   - `America/Los_Angeles` (UTC-8) - US West Coast
   - `Europe/London` (UTC+0) - UK

### Option 2: Change System Time
Set your computer's timezone to different regions to test.

## Test Procedure

### Test 1: Consistent "Today" Across All Pages

1. Set browser timezone to `America/New_York` (UTC-5)
2. Create a new patient record
3. Create lab test request for that patient
4. Create X-ray exam for that patient
5. Create ultrasound exam for that patient
6. Create a treatment visit for that patient

**Expected Result**: 
All records should appear under "Today" on ALL pages:
- Patients page → "Today" filter
- Laboratory page → "Today" filter  
- X-Ray page → "Today" filter
- Ultrasound page → "Today" filter
- Treatment page → "Today" filter

### Test 2: Timezone Independence

1. With records from Test 1 still showing as "Today"
2. Change browser timezone to `Europe/London` (UTC+0)
3. Refresh the application
4. Check all pages again

**Expected Result**: 
Records should STILL appear under "Today" on all pages, because the timezone calculations use Africa/Juba time, not browser time.

### Test 3: Yesterday Filter

1. Using the same test records
2. Wait until after midnight Juba time (22:00 UTC)
3. OR manually adjust the record timestamps in database to be from yesterday
4. Go to each page and select "Yesterday" filter

**Expected Result**:
All records should now appear under "Yesterday" on ALL pages.

### Test 4: Date Range Filters

Test with "Last 7 Days" filter:

1. Create records on different days
2. Select "Last 7 Days" on each page
3. Verify same records appear on all pages

**Expected Result**:
All pages show the same set of records for "Last 7 Days"

### Test 5: Custom Date Range

1. On each page, select "Custom" date filter
2. Set start date: 7 days ago
3. Set end date: today
4. Apply filter

**Expected Result**:
All pages show the same set of records for the custom range

## What to Look For

### ✅ Good Signs (Working Correctly)
- Same records appear in "Today" on all pages
- Changing browser timezone doesn't affect which records show
- Date transitions happen at midnight Juba time (22:00 UTC)
- Custom date ranges return consistent results

### ❌ Bad Signs (Not Working)
- Records appear as "Today" on one page, "Yesterday" on another
- Changing browser timezone changes which records appear
- Same date filter shows different records on different pages

## Debugging

If you see inconsistent results:

1. **Check browser console for errors**
   - Look for date parsing errors
   - Check API request URLs

2. **Verify API calls**
   - Open Network tab in DevTools
   - Check the `startDate` and `endDate` parameters
   - All should be ISO 8601 UTC timestamps

3. **Check timezone configuration**
   - Verify `.env` has `CLINIC_TZ=Africa/Juba`
   - Verify `.env` has `VITE_CLINIC_TZ=Africa/Juba`
   - Restart server after changing `.env`

## Example Test Scenario

**Setup**: Current time is 2025-11-08 10:00 AM Juba time (08:00 UTC)

1. Create a patient at 10:00 AM Juba time
2. The record is stored as: `2025-11-08T08:00:00Z` (UTC)

**Testing from US timezone (UTC-8)**:
- Browser shows: 12:00 AM local time (midnight)
- "Today" in US: 2025-11-08
- "Today" in Juba: 2025-11-08
- Record SHOULD appear as "Today" because it's stored as 08:00 UTC, which is within the Juba "Today" range of [2025-11-07T22:00Z to 2025-11-08T22:00Z)

**Testing from UK timezone (UTC+0)**:
- Browser shows: 08:00 AM local time
- "Today" in UK: 2025-11-08
- "Today" in Juba: 2025-11-08
- Record SHOULD appear as "Today" for the same reason

## Reporting Issues

If you find any inconsistencies, report:
1. Which page showed the issue
2. What timezone your browser was set to
3. What time the record was created (in UTC)
4. Which date filter was used
5. Screenshot of the issue

## Reference

- Africa/Juba timezone: UTC+2 (no daylight saving)
- "Today" in Juba means: 00:00:00 to 23:59:59 Juba time
- In UTC, this translates to: 22:00:00 (previous day) to 21:59:59 (current day)
