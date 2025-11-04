# Bahr El Ghazal Clinic Management System

## Overview
This full-stack web application provides a comprehensive, offline-capable healthcare management system for the Bahr El Ghazal Clinic in rural South Sudan. It aims to digitize patient management, treatment tracking, laboratory testing, and X-ray/ultrasound examinations, thereby improving healthcare delivery in underserved regions with intermittent internet access by enhancing data accuracy and facilitating better patient care. The system is designed to function effectively both online and offline.

## User Preferences
Preferred communication style: Simple, everyday language.
User Context: Rural clinic in South Sudan requiring offline-capable system.

## System Architecture

### UI/UX Decisions
The frontend uses React with TypeScript, styled with Radix UI, shadcn/ui, and Tailwind CSS, featuring a custom medical theme. Routing is handled by Wouter, and state management by TanStack Query. The design prioritizes professional world-class standards with simple terminology familiar to rural clinic staff, including age-centric design (using "Age" instead of "Date of Birth").

### Technical Implementations
The backend is built with Node.js and Express.js, using TypeScript for a RESTful API with JSON responses. Data validation is performed using Zod schemas. Offline functionality is supported via local storage caching and a pending sync queue.

### Feature Specifications
- **Authentication & Security**: Username/password authentication with Passport.js local strategy, secure password hashing (scrypt), session-based authentication with httpOnly cookies, role-based access control (admin, reception, doctor, lab, radiology, pharmacy), and protected routes.
- **Patient Management**: Registration, search, unique ID generation, medical history, allergy tracking, and comprehensive admin-only patient deletion with audit logging and soft-delete implementation. Features world-class date filtering (Today, Yesterday, Last 7/30 Days, Custom Range) and an independent search toggle for name/ID lookups.
- **Treatment Module**: Visit recording, vital signs, chief complaint, diagnosis, treatment plans, and follow-up scheduling. Includes a tabbed interface for Visit Notes (SOAP), Lab Tests, Imaging, and Medications. Medication orders are submitted directly to the pharmacy. A comprehensive, patient-friendly discharge summary can be printed, consolidating all visit information in simple language.
- **Payment System**: Integrated tracking for all diagnostic services with partial payment support for lab tests. The system displays pending payments by department, allowing staff to build payments manually. Unpaid services are visually indicated and blocked from results entry until payment is processed.
- **Laboratory System**: Comprehensive test ordering (various categories), priority management, results recording with normal values, status tracking, photo upload, and payment validation. Lab test cards show professional, specific titles with test count and preview. Features smart date filtering.
- **X-Ray Module**: Examination requests, safety checklists, findings, impression documentation, photo upload, offline sync, and integrated payment validation. Features smart date filtering.
- **Ultrasound Module (ECube 8)**: Advanced capabilities for specialized examinations, high-resolution imaging, quality assessment, comprehensive reporting, photo upload, offline sync, and integrated payment validation. Features smart date filtering.
- **Pharmacy Module**: Comprehensive inventory management with drug catalog, batch tracking (FEFO), inventory ledger, dispensing workflow, stock management, auto-generated drug codes, bulk purchase support, low stock/expiring drug alerts, and supplier tracking.
- **Service Management (Admin)**: Centralized pricing management for all clinic services (Laboratory, X-Ray/Radiology, Ultrasound, Consultation, Pharmacy, Procedures). Admins can add, edit, deactivate services, assign codes, and categorize by department.
- **Dashboard & Reporting**: Statistical overview, recent patient activity, common diagnosis analysis, and printable reports. The reception-focused dashboard includes a Patient Flow & Queue Monitor, Outstanding Payments, and a Results Ready to Review widget, which groups results by patient and provides direct navigation to treatment pages.

### System Design Choices
The application supports both cloud and local network deployments with a robust offline-first approach. It uses Drizzle ORM with PostgreSQL (Neon) for cloud and SQLite for local/offline environments, with automated migration scripts for data consistency.

## External Dependencies

- **Frontend**: React, TypeScript, Radix UI, shadcn/ui, Tailwind CSS, Wouter, TanStack Query, Lucide React, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, TypeScript, Zod.
- **Database & ORM**: Drizzle ORM, Neon Database (PostgreSQL), Better SQLite3.
- **Development Tools**: Vite, ESBuild, Replit.