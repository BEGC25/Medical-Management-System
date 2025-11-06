# Bahr El Ghazal Clinic Management System

## Overview
This full-stack web application is an offline-capable healthcare management system designed for the Bahr El Ghazal Clinic in rural South Sudan. Its primary purpose is to digitalize and streamline patient management, treatment tracking, laboratory testing with automated clinical interpretation, radiology (X-ray/ultrasound) examinations, pharmacy inventory with FEFO batch tracking, service pricing, billing with granular payment support, and financial reporting. The system aims to provide a professional, enterprise-grade healthcare solution that remains simple and clear for local clinic staff, ultimately enhancing healthcare delivery in the region.

## User Preferences
- **Communication Style**: Simple, everyday language (non-technical)
- **User Context**: Rural clinic in South Sudan requiring offline-capable system
- **Critical User Requirements**:
  - Dashboard shows TODAY's data ONLY - user strongly objected when this filter was removed
  - Use "Age" instead of "Date of Birth" (age-centric design)
  - Use "visits" instead of "encounters" for simplicity
  - Both professional design AND simple/clear interface
- **Dashboard Filter**: Dashboard shows TODAY's data ONLY - do not remove this filter
- **Date Handling**: **NEW:** System now uses timezone-aware date handling with `CLINIC_TZ=Africa/Juba` (UTC+3) to ensure consistent "Today" filtering across all pages. See [TIMEZONE_CONFIGURATION.md](./TIMEZONE_CONFIGURATION.md) for details.
- **Lab Test Grouping**: Multiple tests are stored as ONE record with JSON array in `tests` field
- **Edit/Delete Location**: Lab test edit/delete buttons are in **Treatment page** (Pending Orders section), NOT in Lab page
- **Soft Deletes**: Use `status='cancelled'` for lab tests, `isDeleted=1` for patients
- **Database Migrations**: ALWAYS use `npm run db:push`, NEVER write manual SQL migrations
- **ID Column Types**: NEVER change primary key types (serial ↔ varchar) - causes destructive migrations
- **Permissions**: Check user role before allowing sensitive operations
- **Order Lines**: Single source of truth for linking tests/exams to encounters

## System Architecture

### Design Philosophy
The system features a professional, world-class enterprise healthcare design with a medical blue theme, optimized for simplicity and clarity. The dashboard explicitly displays only today's data.

### Tech Stack
-   **Frontend**: React 18, TypeScript, Wouter, TanStack Query v5, Tailwind CSS, Radix UI, shadcn/ui, Lucide React, React Hook Form, Zod, Vite.
-   **Backend**: Node.js, TypeScript, Express.js, Passport.js (local strategy), scrypt, express-session, Zod, Drizzle ORM.
-   **Database**: Production: Neon (PostgreSQL); Local/Offline: Better SQLite3.
-   **Deployment**: Backend on Render, Frontend on Vercel, Database on Neon. Database stores timestamps in UTC; application converts to/from clinic timezone (Africa/Juba, UTC+3) for filtering and display.
-   **Timezone**: Configurable via `CLINIC_TZ` environment variable (default: Africa/Juba UTC+3). See [TIMEZONE_CONFIGURATION.md](./TIMEZONE_CONFIGURATION.md).

### Feature Specifications
-   **Role-Based Access Control (RBAC)**: Supports Admin, Reception, Doctor, Lab, Radiology, Pharmacy roles with specific permissions for navigation and API routes.
-   **Patient Management**: Comprehensive workflow for registration, search, updates, and soft deletion.
-   **Encounter/Visit Management**: Creation, tracking, and closure of patient visits.
-   **Treatment Tracking**: Includes SOAP notes, vitals, diagnosis, and treatment plans.
-   **Laboratory Management**: Grouped test ordering, results entry, clinical interpretation, and status tracking.
-   **Radiology (X-Ray/Ultrasound)**: Supports requesting exams, entering findings, and managing multi-type ultrasound reports.
-   **Pharmacy Management**: Features drug catalog, FEFO batch tracking, inventory, dispensing, and low stock alerts.
-   **Billing & Payments**: Manages service pricing, multi-item payment processing, receipt generation, and tracking.
-   **Financial Reporting**: Provides dashboard statistics for daily operations, including a "Results Ready to Review" widget.
-   **Discharge Documentation**: Generates printable patient summaries.
-   **Offline Capability**: Utilizes local storage caching and a pending sync queue for resilience in low-connectivity environments.

### UI/UX Decisions
-   **Color Scheme**: Medical blue primary theme with distinct secondary colors and dark mode support.
-   **Component Library**: `shadcn/ui` and `Radix UI` built on Tailwind CSS.
-   **Dashboard**: Features compact, clickable stat cards, patient flow monitor, and a "Results Ready to Review" widget that strictly shows today's completed results, grouped by patient/visit.
-   **Date Handling**: Dates are stored as ISO strings and compared as strings for timezone robustness.
-   **Lab Test Ordering UI**: Uses a category dropdown with checkboxes for ordering multiple tests.

### System Design Choices
-   **Authentication**: Passport.js with local strategy, scrypt for password hashing, and `express-session` for secure session management.
-   **Data Validation**: Zod schemas enforce data integrity on both frontend and backend.
-   **Error Handling**: Standardized API error responses with appropriate HTTP status codes.
-   **Database**: Drizzle ORM for database interactions. Custom business ID generation (e.g., BGC###) is used for key entities.
-   **Soft Delete**: Implemented for patients and cancelled lab tests.
-   **State Management (Frontend)**: TanStack Query manages data fetching, caching, and synchronization.
-   **Form Management (Frontend)**: React Hook Form with Zod validation.
-   **Entity Relationships**: The `order_lines` table is the single source of truth for linking tests/exams to encounters, primarily using business IDs for joins.

## External Dependencies
-   **Backend Deployment**: Render
-   **Frontend Deployment**: Vercel
-   **Database**: Neon (PostgreSQL)
---

## APPENDIX A: Entity Relationship Diagram (ERD)

### Visual Relationship Diagram

```
                           ┌─────────────────────────┐
                           │       PATIENTS          │
                           │  (Central Entity)       │
                           ├─────────────────────────┤
                           │ PK: id (serial)         │
                           │ UK: patientId (BGC###)  │
                           │ firstName, lastName     │
                           │ age, gender, village    │
                           │ isDeleted (soft delete) │
                           └─────────────────────────┘
                                      │
                         ┌────────────┼────────────┐
                         │            │            │
                         ▼            ▼            ▼
          ┌───────────────────┐ ┌──────────────┐ ┌─────────────────┐
          │   ENCOUNTERS      │ │  TREATMENTS  │ │   PAYMENTS      │
          │   (Visits)        │ │  (SOAP)      │ │                 │
          ├───────────────────┤ ├──────────────┤ ├─────────────────┤
          │ PK: id            │ │ PK: id       │ │ PK: id          │
          │ UK: encounterId   │ │ UK: treatId  │ │ UK: paymentId   │
          │ FK: patientId ────┼─┤ FK: patId ───┼─┤ FK: patientId ──┼─┐
          │ status: active/   │ │ FK: encId    │ │ FK: encounterId │ │
          │         closed    │ │ vitals, dx   │ │ amount, method  │ │
          └───────────────────┘ └──────────────┘ └─────────────────┘ │
                    │                                      │          │
                    │                                      ▼          │
                    │                           ┌─────────────────┐   │
                    │                           │  PAYMENT_ITEMS  │   │
                    │                           ├─────────────────┤   │
                    │                           │ PK: id          │   │
                    │                           │ FK: paymentId   │   │
                    │                           │ relatedType     │   │
                    │                           │ relatedId       │   │
                    │                           │ amount          │   │
                    │                           └─────────────────┘   │
                    │                                                 │
                    ▼                                                 │
          ┌──────────────────────┐                                   │
          │    ORDER_LINES       │                                   │
          │ (Single Source of    │                                   │
          │  Truth for Orders)   │                                   │
          ├──────────────────────┤                                   │
          │ PK: id               │                                   │
          │ FK: encounterId      │                                   │
          │ relatedType ─────────┼──┐ ('lab', 'xray', 'ultrasound') │
          │ relatedId            │  │                                │
          │ serviceId, price     │  │                                │
          └──────────────────────┘  │                                │
                    │               │                                │
        ┌───────────┼───────────┐   │                                │
        │           │           │   │                                │
        ▼           ▼           ▼   │                                │
┌─────────────┐ ┌─────────────┐ ┌──────────────────┐ ┌──────────────┴──────┐
│  LAB_TESTS  │ │ XRAY_EXAMS  │ │ ULTRASOUND_EXAMS │ │  PHARMACY_ORDERS    │
├─────────────┤ ├─────────────┤ ├──────────────────┤ ├─────────────────────┤
│ PK: id      │ │ PK: id      │ │ PK: id           │ │ PK: id              │
│ UK: testId  │ │ UK: examId  │ │ UK: examId       │ │ UK: orderId         │
│ FK: patId ──┼─┤ FK: patId ──┼─┤ FK: patientId ───┼─┤ FK: patientId ──────┤
│ tests: JSON │ │ examType    │ │ examType         │ │ FK: encounterId     │
│ status      │ │ findings    │ │ findings         │ │ FK: drugId          │
│ payStatus   │ │ payStatus   │ │ payStatus        │ │ status, payStatus   │
│ results     │ │ impression  │ │ impression       │ │ quantity, dosage    │
└─────────────┘ └─────────────┘ └──────────────────┘ └─────────────────────┘
      │               │                  │                       │
      │               │                  │                       │
      └───────────────┴──────────────────┴───────────────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │   SERVICES   │
                      │  (Pricing)   │
                      ├──────────────┤
                      │ PK: id       │
                      │ UK: code     │
                      │ name, price  │
                      │ category     │
                      │ isActive     │
                      └──────────────┘

LEGEND:
  PK = Primary Key (serial auto-increment)
  UK = Unique Key (business ID: BGC###, BGC-ENC###, etc.)
  FK = Foreign Key (references another table)
  ─── = One-to-Many relationship
  ──┐ = Links back to parent table
```

### Relationship Summary

| From Table | To Table | Relationship | Join Field | Notes |
|------------|----------|--------------|------------|-------|
| `patients` | `encounters` | 1:M | `patientId` | One patient, many visits |
| `patients` | `treatments` | 1:M | `patientId` | One patient, many treatments |
| `patients` | `lab_tests` | 1:M | `patientId` | Direct patient link |
| `patients` | `xray_exams` | 1:M | `patientId` | Direct patient link |
| `patients` | `ultrasound_exams` | 1:M | `patientId` | Direct patient link |
| `patients` | `pharmacy_orders` | 1:M | `patientId` | Direct patient link |
| `patients` | `payments` | 1:M | `patientId` | One patient, many payments |
| `encounters` | `treatments` | 1:M | `encounterId` | One visit, many treatment records |
| `encounters` | `order_lines` | 1:M | `encounterId` | **Single source of truth** |
| `order_lines` | `lab_tests` | M:1 | `relatedId = testId` | Via relatedType='lab' |
| `order_lines` | `xray_exams` | M:1 | `relatedId = examId` | Via relatedType='xray' |
| `order_lines` | `ultrasound_exams` | M:1 | `relatedId = examId` | Via relatedType='ultrasound' |
| `order_lines` | `pharmacy_orders` | M:1 | `relatedId = orderId` | Via relatedType='pharmacy' |
| `payments` | `payment_items` | 1:M | `paymentId` | One payment, many line items |

### Quick Table Reference with Keys

| Table | Primary Key | Business ID | Patient Link | Encounter Link | Notes |
|-------|------------|-------------|--------------|----------------|-------|
| **patients** | `id` (serial) | `patientId` (varchar, BGC###) | - | - | Soft delete via `isDeleted` |
| **encounters** | `id` (serial) | `encounterId` (varchar, BGC-ENC###) | `patientId` | - | status: active/closed |
| **treatments** | `id` (serial) | `treatmentId` (varchar) | `patientId` | `encounterId` (nullable) | SOAP notes |
| **lab_tests** | `id` (serial) | `testId` (varchar, BGC-LAB###) | `patientId` | via `order_lines` | `tests` is JSON array |
| **xray_exams** | `id` (serial) | `examId` (varchar) | `patientId` | via `order_lines` | Uses `examId` not `xrayId` |
| **ultrasound_exams** | `id` (serial) | `examId` (varchar) | `patientId` | via `order_lines` | Uses `examId` not `ultrasoundId` |
| **order_lines** | `id` (serial) | - | - | `encounterId` | Links tests/exams to visits |
| **payments** | `id` (serial) | `paymentId` (varchar) | `patientId` | `encounterId` (nullable) | Receipt number |
| **payment_items** | `id` (serial) | - | - | - | Links payments to services |
| **pharmacy_orders** | `id` (serial) | `orderId` (varchar) | `patientId` | `encounterId` (nullable) | Drug dispensing |

### Critical Join Patterns

**1. Get Patient with Active Visit:**
```sql
SELECT p.*, e.encounterId, e.status
FROM patients p
LEFT JOIN encounters e ON e.patientId = p.patientId
WHERE p.patientId = 'BGC001' AND e.status = 'active';
```

**2. Get All Orders for a Visit:**
```sql
SELECT ol.*, 
       lt.tests as lab_tests,
       xe.examType as xray_type,
       ue.examType as ultrasound_type
FROM order_lines ol
LEFT JOIN lab_tests lt ON ol.relatedType = 'lab' AND ol.relatedId = lt.testId
LEFT JOIN xray_exams xe ON ol.relatedType = 'xray' AND ol.relatedId = xe.examId
LEFT JOIN ultrasound_exams ue ON ol.relatedType = 'ultrasound' AND ol.relatedId = ue.examId
WHERE ol.encounterId = 'BGC-ENC001';
```

**3. Get Lab Tests with Patient Info:**
```sql
SELECT lt.*, p.firstName, p.lastName, p.patientId
FROM lab_tests lt
JOIN patients p ON lt.patientId = p.patientId
WHERE lt.status = 'pending';
```

**Important Notes:**
- Always join on **business IDs** (`patientId`, `testId`, `examId`), NOT serial `id`
- `order_lines` is the **single source of truth** for linking tests/exams to encounters
- `relatedType` uses lowercase: `'lab'`, `'xray'`, `'ultrasound'`
- Both `xray_exams` and `ultrasound_exams` use field name `examId`

---

## APPENDIX B: Role-Based Access Control Matrix

### Navigation Menu by Role

| Route | Label | Admin | Doctor | Lab | Radiology | Reception |
|-------|-------|:-----:|:------:|:---:|:---------:|:---------:|
| `/` | Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/patients` | Patients | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/treatment` | Treatment | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/laboratory` | Laboratory | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/xray` | X-Ray | ✅ | ✅ | ❌ | ✅ | ❌ |
| `/ultrasound` | Ultrasound | ✅ | ✅ | ❌ | ✅ | ❌ |
| `/pharmacy` | Pharmacy | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/payment` | Payment | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/reports/daily-cash` | Daily Cash | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/service-management` | Services | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/users` | Users | ✅ | ❌ | ❌ | ❌ | ❌ |

### API Route Permissions

| Endpoint | Method | Admin | Doctor | Lab | Radiology | Reception | Notes |
|----------|--------|:-----:|:------:|:---:|:---------:|:---------:|-------|
| `/api/login` | POST | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | Public |
| `/api/register` | POST | ✅ | ❌ | ❌ | ❌ | ❌ | Admin only |
| `/api/patients/:id` | DELETE | ✅ | ❌ | ❌ | ❌ | ❌ | Soft delete |
| `/api/lab-tests` | POST | ✅ | ✅ | ❌ | ❌ | ❌ | Order tests |
| `/api/lab-tests/:id` | PATCH | ✅ | ✅ | ❌ | ❌ | ❌ | Edit pending |
| `/api/lab-tests/:id` | DELETE | ✅ | ✅ | ❌ | ❌ | ❌ | Cancel pending |
| `/api/lab-tests/:id` | PUT | ✅ | ❌ | ✅ | ❌ | ❌ | Enter results |
| `/api/payments` | POST | ✅ | ❌ | ❌ | ❌ | ✅ | Process payment |

**Legend:** ✅ = Allowed | ❌ = Forbidden | 🔓 = Public | 🔒 = Authenticated

---

## APPENDIX C: Environment Variables Matrix

| Variable | Development | Production | Security |
|----------|-------------|------------|----------|
| `DATABASE_URL` | Auto (Replit) | Neon connection string | ✅ SENSITIVE |
| `SESSION_SECRET` | dev-secret | Strong random (32+ chars) | ✅ CRITICAL - Rotate every 90 days |
| `ALLOWED_ORIGINS` | localhost URLs | Your Vercel domain | ⚠️ Never use `*` |
| `VITE_API_URL` | "" (same origin) | Render backend URL | ℹ️ Public (in bundle) |

### Setup Instructions

**Render (Backend):**
```
DATABASE_URL=postgresql://neondb_owner:***@ep-....neon.tech/neondb?sslmode=require
SESSION_SECRET=7x9kL2mN8pQ4rT6vY1zA3bC5dF7gH9jK
ALLOWED_ORIGINS=https://yourapp.vercel.app
NODE_ENV=production
```

**Vercel (Frontend):**
```
VITE_API_URL=https://your-api.onrender.com
```

---

## APPENDIX D: Results Ready Widget - Final Acceptance

### ✅ CONFIRMED BEHAVIOR

**1. Today-Only Filter:** ✅ VERIFIED
- Widget shows ONLY results completed TODAY
- Uses `DATE(completedDate) = ${today}` filter
- Yesterday's results do NOT appear

**2. Grouping by Visit/Patient:** ✅ VERIFIED
- Groups by encounter (visit) when available
- Falls back to patient grouping
- Shows "3 Lab Tests, 1 X-Ray" not separate cards

**3. Acceptance Criteria:**

| Criterion | Status |
|-----------|--------|
| Shows only TODAY's results | ✅ PASS |
| Groups by visit/patient | ✅ PASS |
| Shows max 5 patients | ✅ PASS |
| Links to treatment page | ✅ PASS |
| Handles mixed types | ✅ PASS |

### ✅ FINAL ACCEPTANCE

**Status:** ACCEPTED - No changes required

Implementation correctly:
1. ✅ Follows "today only" dashboard rule
2. ✅ Groups results by visit/patient
3. ✅ Shows professional summary
4. ✅ Provides navigation to treatment
5. ✅ Handles all result types

---

## Last Updated
November 4, 2025 - Added comprehensive appendices with Visual ERD, RBAC matrix, environment vars, widget acceptance
