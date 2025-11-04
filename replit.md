# Bahr El Ghazal Clinic Management System

## Overview
This full-stack web application is an offline-capable healthcare management system for the Bahr El Ghazal Clinic in rural South Sudan. It digitalizes patient management, treatment tracking, laboratory testing with automated clinical interpretation, X-ray/ultrasound examinations, pharmacy inventory with FEFO batch tracking, service pricing, billing with granular per-test payment support, payment processing, financial reporting, and patient discharge documentation. The project aims to provide a professional, world-class enterprise healthcare solution that is also simple and clear for rural clinic staff.

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
Professional, world-class enterprise healthcare design with a medical blue theme, optimized for simplicity and clarity for rural clinic staff. The dashboard explicitly displays only today's data.

### Tech Stack
-   **Frontend**: React 18, TypeScript, Wouter, TanStack Query v5, Tailwind CSS, Radix UI, shadcn/ui, Lucide React, React Hook Form, Zod, Vite.
-   **Backend**: Node.js, TypeScript, Express.js, Passport.js (local strategy), scrypt, express-session, Zod, Drizzle ORM.
-   **Database**: Production: Neon (PostgreSQL); Local/Offline: Better SQLite3. Migrations handled by Drizzle ORM (`npm run db:push`).
-   **Deployment**: Backend on Render, Frontend on Vercel, Database on Neon. All systems operate in UTC timezone.

### Feature Specifications
-   **Role-Based Access Control (RBAC)**: Admin, Reception, Doctor, Lab, Radiology, Pharmacy roles with specific permissions.
-   **Patient Management**: Registration, search, update, soft delete, age-centric design.
-   **Encounter/Visit Management**: Create, close, track visits ("encounters" are referred to as "visits").
-   **Treatment Tracking**: SOAP notes, vitals, diagnosis, treatment plans, follow-ups.
-   **Laboratory Management**: Grouped test ordering (category dropdown + checkboxes), results entry, clinical interpretation, edit/delete pending tests (from Treatment page), status tracking.
-   **Radiology (X-Ray/Ultrasound)**: Requesting exams, findings, impression entry, multi-type ultrasound support.
-   **Pharmacy Management**: Drug catalog, FEFO batch tracking, inventory, dispensing workflow, low stock alerts.
-   **Billing & Payments**: Service pricing, multi-item payment processing, receipt generation, tracking unpaid orders, payment status integration with lab/radiology.
-   **Financial Reporting**: Dashboard statistics for daily operations.
-   **Discharge Documentation**: Printable patient-friendly summaries.
-   **Offline Capability**: Local storage caching and pending sync queue.

### UI/UX Decisions
-   **Color Scheme**: Primary medical blue (`hsl(211, 80%, 48%)`), with distinct secondary colors for departments (e.g., Amber for Lab, Purple for X-Ray).
-   **Theming**: Dark mode support configured via Tailwind CSS.
-   **Component Library**: Utilizes `shadcn/ui` for pre-built components and `Radix UI` for unstyled primitives, built on Tailwind CSS.
-   **Dashboard**: Compact, clickable stat cards (Patients Today, Active Visits, Pending Orders) that filter patient lists, patient flow monitor, outstanding payments, results ready, recent patients.
-   **Date Handling**: Dates stored as ISO strings (YYYY-MM-DD or full ISO timestamp), displayed as needed, and compared as strings to avoid timezone issues.
-   **Lab Test Ordering UI**: Category dropdown with checkboxes for grouping multiple tests into a single request.

### System Design Choices
-   **Authentication**: Passport.js with local strategy, scrypt for password hashing, `express-session` with httpOnly cookies.
-   **Data Validation**: Zod schemas for both frontend and backend, ensuring type safety.
-   **Error Handling**: Consistent API error responses with appropriate HTTP status codes (400, 401, 403, 404, 500).
-   **Database**: Drizzle ORM for database interactions. Custom ID generation for business entities (e.g., BGC###).
-   **Soft Delete**: Implemented for patients (`isDeleted`) and cancelled lab tests (`status='cancelled'`) for auditability.
-   **State Management (Frontend)**: TanStack Query (React Query) for data fetching, caching, and synchronization.
-   **Form Management (Frontend)**: React Hook Form with Zod validation.

## External Dependencies
-   **Backend Deployment**: Render
-   **Frontend Deployment**: Vercel
-   **Database**: Neon (PostgreSQL)