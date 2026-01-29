# Migration 0014: Add Payment Status Indexes

## Purpose
This migration adds database indexes on the `payment_status` column for lab_tests, xray_exams, ultrasound_exams, and pharmacy_orders tables to optimize the `/api/unpaid-orders/all` endpoint performance.

## Problem Being Solved
The Payment page was very slow because it fetched ALL records from multiple tables and then filtered in JavaScript. This caused:
- Full table scans on every request
- Performance degradation as data grows
- Unnecessary load on the database

## Solution
By adding B-Tree indexes on the `payment_status` columns, the database can efficiently filter records where `payment_status = 'unpaid'` without scanning entire tables.

## Tables Affected
- `lab_tests` - Added index on `payment_status`
- `xray_exams` - Added index on `payment_status`
- `ultrasound_exams` - Added index on `payment_status`
- `pharmacy_orders` - Added index on `payment_status`

## Impact
- Dramatically improved query performance for fetching unpaid orders
- Reduced database load
- Faster page load times for the Payment page

## Backward Compatibility
This migration is fully backward compatible. It only adds indexes and does not modify any data or table structure.

## Related Changes
This migration works in conjunction with:
- New optimized storage methods (`getUnpaidLabTests`, `getUnpaidXrayExams`, etc.)
- Updated `/api/unpaid-orders/all` endpoint to use database-level filtering
