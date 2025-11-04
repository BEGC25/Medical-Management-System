# Bahr El Ghazal Clinic Management System

## Overview
This full-stack, offline-capable web application provides a comprehensive healthcare management solution for the Bahr El Ghazal Clinic in rural South Sudan. Its core purpose is to digitalize and streamline patient management, treatment tracking, laboratory testing with automated interpretation, radiology examinations, pharmacy inventory (FEFO batch tracking), service pricing, billing, and financial reporting. The system aims to deliver a professional, enterprise-grade healthcare experience while maintaining simplicity and clarity for local clinic staff, thereby enhancing healthcare delivery in the region.

## User Preferences
- **Communication Style**: Simple, everyday language (non-technical)
- **User Context**: Rural clinic in South Sudan requiring offline-capable system
- **Critical User Requirements**:
  - Dashboard shows TODAY's data ONLY - user strongly objected when this filter was removed
  - Use "Age" instead of "Date of Birth" (age-centric design)
  - Use "visits" instead of "encounters" for simplicity
  - Both professional design AND simple/clear interface
- **Dashboard Filter**: Dashboard shows TODAY's data ONLY - do not remove this filter
- **Date Handling**: Use string comparison (YYYY-MM-DD) for date filtering to avoid timezone issues
- **Lab Test Grouping**: Multiple tests are stored as ONE record with JSON array in `tests` field
- **Edit/Delete Location**: Lab test edit/delete buttons are in **Treatment page** (Pending Orders section), NOT in Lab page
- **Soft Deletes**: Use `status='cancelled'` for lab tests, `isDeleted=1` for patients
- **Database Migrations**: ALWAYS use `npm run db:push`, NEVER write manual SQL migrations
- **ID Column Types**: NEVER change primary key types (serial ↔ varchar) - causes destructive migrations
- **Permissions**: Check user role before allowing sensitive operations
- **Order Lines**: Single source of truth for linking tests/exams to encounters

## System Architecture

### Design Philosophy
The system features a professional, enterprise-grade healthcare design with a medical blue theme, prioritizing simplicity and clarity. The dashboard exclusively displays today's data.

### Tech Stack
-   **Frontend**: React 18, TypeScript, Wouter, TanStack Query v5, Tailwind CSS, Radix UI, shadcn/ui, Lucide React, React Hook Form, Zod, Vite.
-   **Backend**: Node.js, TypeScript, Express.js, Passport.js (local strategy), scrypt, express-session, Zod, Drizzle ORM.
-   **Database**: Production: Neon (PostgreSQL); Local/Offline: Better SQLite3.

### Feature Specifications
-   **Role-Based Access Control (RBAC)**: Supports Admin, Reception, Doctor, Lab, Radiology, Pharmacy roles with granular permissions.
-   **Patient Management**: Registration, search, updates, and soft deletion.
-   **Encounter/Visit Management**: Creation, tracking, and closure of patient visits.
-   **Treatment Tracking**: SOAP notes, vitals, diagnosis, and treatment plans.
-   **Laboratory Management**: Grouped test ordering, results entry, clinical interpretation, and status tracking.
-   **Radiology (X-Ray/Ultrasound)**: Exam requests, findings entry, and multi-type ultrasound reports.
-   **Pharmacy Management**: Drug catalog, FEFO batch tracking, inventory, dispensing, and low stock alerts.
-   **Billing & Payments**: Service pricing, multi-item payment processing, receipt generation, and tracking.
-   **Financial Reporting**: Dashboard statistics and a "Results Ready to Review" widget.
-   **Discharge Documentation**: Generation of printable patient summaries.
-   **Offline Capability**: Local storage caching and a pending sync queue for low-connectivity environments.

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
-   **Database**: Drizzle ORM for database interactions, with custom business ID generation (e.g., BGC###).
-   **Soft Delete**: Implemented for patients and cancelled lab tests.
-   **State Management (Frontend)**: TanStack Query manages data fetching, caching, and synchronization.
-   **Form Management (Frontend)**: React Hook Form with Zod validation.
-   **Entity Relationships**: The `order_lines` table serves as the single source of truth for linking tests/exams to encounters, primarily using business IDs for joins.

## External Dependencies
-   **Backend Deployment**: Render
-   **Frontend Deployment**: Vercel
-   **Database**: Neon (PostgreSQL)