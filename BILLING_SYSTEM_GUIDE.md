# Comprehensive Billing System Guide

## Overview

This guide documents the new **system-wide, automatic, and zero-math** billing system implemented for the Bahr El Ghazal Clinic Management System. The system transforms the existing payment model into a comprehensive encounter-based billing workflow that eliminates manual calculations and ensures accuracy.

## Key Features Implemented

### ✅ **Consultation Fees**
- **Service Management**: Consultation fees are configured through the Service Management page
- **Automatic collection**: System adds consultation fee to patient's visit when selected at registration
- **Flexible collection**: Reception staff can choose whether to collect consultation fee for each patient

### ✅ **Encounter-Based Patient Visits**
- **Automatic encounter creation**: Every patient visit creates an "encounter" (like a shopping cart)
- **Single source of truth**: All services for a visit are tracked in one place
- **Price snapshotting**: Prices are captured when ordered, so historical bills stay accurate
- **Real-time totals**: Running total calculated automatically, no manual math

### ✅ **Zero-Math Reception Desk**
- **Automatic calculations**: System computes all totals in real-time
- **Pre-built invoices**: Cashier sees complete breakdown, just collects payment
- **No service lookup**: All services and prices pre-populated from orders
- **One-click billing**: "Send to Cashier" button prepares complete bill

### ✅ **Integrated Department Workflow**
- **Auto-order creation**: When doctors order labs/x-rays/ultrasounds, items automatically added to bill
- **Price consistency**: All departments use same price catalog
- **Status tracking**: Services show as requested → authorized → performed → paid
- **Department transparency**: Each department sees what's been ordered and paid

## System Architecture

### Core Tables

1. **encounters** - Patient visit "shopping carts"
   - One per patient per day
   - Tracks attending clinician
   - Status: open → closed

2. **orderLines** - Items in the encounter
   - Service details with price snapshots
   - Quantity and totals
   - Status tracking (requested → performed)
   - Department assignment

4. **invoices** - Generated billing documents
   - Created from encounters
   - Subtotal, discounts, tax, grand total
   - Status: draft → posted → void

5. **invoiceLines** - Mirror of order lines for billing
   - Permanent record for accounting
   - Price and quantity details

### Enhanced Services Table
- **Service codes**: Easy reference (e.g., "CONS-GEN", "LAB-CBC")
- **Extended categories**: consultation | laboratory | radiology | ultrasound | pharmacy | procedure
- **Consistent pricing**: Single source of truth for all service costs

## User Workflows

### 1. **Patient Registration with Billing**

**Reception Staff Process:**
1. Open Patients → New Patient Registration
2. Fill patient details as normal
3. **New**: Consultation fee collection section appears
4. If "Require Prepayment" is ON → consultation fee auto-selected
5. If OFF → reception can choose to collect now or later
6. Click "Register Patient"
7. **Result**: Patient registered + encounter created + consultation fee added (if selected)

**Behind the Scenes:**
- System creates patient record
- Creates today's encounter for patient
- Adds consultation service to encounter with current price
- Ready for doctor visit

### 2. **Doctor Treatment with Real-Time Billing**

**Doctor Process:**
1. Open Treatment → Select Patient
2. **New**: Visit cart appears showing current charges
3. Fill treatment details as normal
4. Order labs/x-rays/ultrasounds → **automatically added to visit cart**
5. Click "Send to Cashier" when ready
6. **Result**: Complete visit bill prepared, zero math needed

**Visit Cart Features:**
- Shows all services ordered for this visit
- Real-time total calculation
- Service status (requested → performed)
- One-click send to billing

### 3. **Department Integration (Lab/X-Ray/Ultrasound)**

**Department Staff Process:**
1. See pending requests as normal
2. **New**: Each request shows payment status
3. Can only perform services marked as "paid" (if policy requires)
4. When test completed → status updates to "performed"
5. **Result**: Service automatically marked complete in billing

### 4. **Cashier/Reception Billing**

**Cashier Process:**
1. Open Billing → Today's Encounters
2. Find patient → Click "View Details"
3. **New**: Complete breakdown appears automatically:
   - All services with quantities and prices
   - Subtotals and grand total
   - No manual entry needed
4. Click "Generate Invoice" → formal bill created
5. Collect payment → mark as paid
6. **Result**: Complete audit trail, accurate billing

## Admin Configuration

### Service Management

**Access**: Navigation → Settings → Service Management

**Configuration:**
- **Consultation Fees**: Configure consultation service pricing (code: CONS-GEN)
- **Service Catalog**: Manage all billable services and their prices
- **Currency**: All prices are in SSP (South Sudanese Pounds)

## Technical Implementation

### API Endpoints

**Encounters:**
- `GET /api/encounters` - List encounters (filterable by date/status)
- `POST /api/encounters` - Create new encounter
- `GET /api/encounters/:id` - Get encounter details
- `PUT /api/encounters/:id` - Update encounter
- `POST /api/encounters/:id/close` - Close encounter

**Order Lines:**
- `POST /api/order-lines` - Add service to encounter
- `GET /api/encounters/:id/order-lines` - Get encounter items
- `PUT /api/order-lines/:id` - Update order line status

**Invoices:**
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/encounters/:id/generate-invoice` - Create invoice from encounter

**Auto-Integration:**
- `POST /api/services/:type/auto-order` - Auto-add service to encounter (used by departments)

### Database Schema

**Core Tables:**
```sql
-- Patient visit carts
CREATE TABLE encounters (
    id SERIAL PRIMARY KEY,
    encounter_id TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL,
    visit_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'closed'
    policy TEXT NOT NULL DEFAULT 'cash', -- 'cash' | 'insurance'
    attending_clinician TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    closed_at TEXT
);

-- Items in visit cart
CREATE TABLE order_lines (
    id SERIAL PRIMARY KEY,
    encounter_id TEXT NOT NULL,
    service_id INTEGER NOT NULL,
    related_id TEXT, -- lab/xray/ultrasound ID
    related_type TEXT, -- 'consultation' | 'lab_test' | 'xray_exam' | etc.
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_snapshot REAL NOT NULL, -- Price when ordered
    total_price REAL NOT NULL,
    department TEXT, -- 'consultation' | 'laboratory' | etc.
    status TEXT NOT NULL DEFAULT 'requested', -- 'requested' | 'authorized' | 'performed' | 'canceled'
    ordered_by TEXT,
    created_at TEXT NOT NULL
);

-- Generated bills
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_id TEXT UNIQUE NOT NULL,
    encounter_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    subtotal REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    tax REAL NOT NULL DEFAULT 0,
    grand_total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'posted' | 'void'
    generated_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    posted_at TEXT,
    voided_at TEXT
);
```

**Enhanced Services Table:**
```sql
-- Added service codes and pharmacy category
ALTER TABLE services ADD COLUMN code TEXT UNIQUE;
-- category now includes: 'consultation' | 'laboratory' | 'radiology' | 'ultrasound' | 'pharmacy' | 'procedure'
```

## Benefits Delivered

### 🎯 **For Reception Staff**
- **Zero math**: System calculates all totals automatically
- **Policy compliance**: System enforces prepayment rules automatically
- **Faster registration**: Consultation fee handled in registration flow
- **Complete bills**: No manual service lookup or price calculation

### 🎯 **For Doctors**
- **Real-time visit cost**: See what patient will be charged as you work
- **Automatic billing**: Orders automatically create billing entries
- **No price concerns**: Focus on treatment, system handles billing
- **Complete transparency**: "Send to Cashier" prepares accurate bill

### 🎯 **For Department Staff**
- **Payment visibility**: See what's paid before performing services
- **Automatic updates**: Service completion updates billing automatically
- **Consistent pricing**: All departments use same price catalog
- **Status clarity**: Clear workflow from requested → performed → paid

### 🎯 **For Administrators**
- **Policy control**: Configure consultation fees and payment rules centrally
- **Audit trail**: Complete record of all charges and when they were added
- **Pricing consistency**: Single source of truth for all service prices
- **Scalable system**: Handles hundreds of patients/day with automatic calculations

### 🎯 **For Patients**
- **Transparent billing**: Clear breakdown of all services and costs
- **Consistent experience**: Same billing process regardless of department
- **Policy clarity**: Understand payment requirements upfront
- **Accurate charges**: Price snapshots ensure no surprise changes

## Migration from Old System

The new system is **fully backward compatible**:

1. **Existing patients**: Continue to work normally
2. **Existing services**: Enhanced with codes and pharmacy category
3. **Existing payments**: Continue to work alongside new encounter system
4. **Gradual adoption**: Old and new billing can run simultaneously during transition

## Future Enhancements (Phase 4)

Planned improvements include:
- **Insurance billing**: Support for insurance policies and claims
- **Bulk discounts**: Package deals and bulk service discounts  
- **Advanced reporting**: Revenue by department, service utilization, etc.
- **Mobile payments**: Integration with mobile money systems
- **Inventory integration**: Pharmacy stock management with billing
- **Appointment billing**: Pre-billing for scheduled appointments

## Support and Troubleshooting

### Common Workflows

**Q: How do I change the consultation fee?**
A: Go to Navigation → Administration → Billing Settings → Update "Consultation Fee" → Save Settings

**Q: What if a patient needs emergency care but hasn't paid?**
A: If "Allow Emergency Grace" is enabled, register patient normally, select emergency priority in Treatment, payment will be required before discharge

**Q: How do I see what a patient owes for today's visit?**
A: Go to Treatment → Select Patient → Visit Cart shows real-time total, or go to Billing → Today's Encounters → Find patient

**Q: What happens if I order a lab test - does it automatically get billed?**
A: Yes, when you order labs/x-rays/ultrasounds from Treatment, they automatically appear in the patient's visit cart with current prices

### Database Seeding

The system automatically creates default services including:
- General Consultation (2000 SSP) - code: CONS-GEN
- Follow-up Consultation (1000 SSP) - code: CONS-FU
- Laboratory tests (CBC, Urine Analysis, Malaria, etc.)
- Radiology services (Chest X-Ray, Abdominal X-Ray, etc.)
- Ultrasound services (Abdominal, Pelvic, Obstetric, etc.)
- Basic pharmacy items (Paracetamol, Amoxicillin, etc.)

---

*This billing system delivers on the promise of "system-wide, automatic, and zero-math at the desk" while maintaining your current "pay consultation first" workflow and scaling to hundreds of patients per day.*