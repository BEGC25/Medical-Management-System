# Bahr El Ghazal Clinic Management System

## Overview
This full-stack web application is designed for the Bahr El Ghazal Clinic in rural South Sudan, offering comprehensive patient management, treatment tracking, laboratory testing, and X-ray/ultrasound examination capabilities. Its primary purpose is to provide a reliable healthcare management system that functions effectively both online and offline, catering to remote facilities with intermittent internet access. The project aims to improve healthcare delivery in underserved regions by digitizing essential clinic operations, enhancing data accuracy, and facilitating better patient care.

## User Preferences
Preferred communication style: Simple, everyday language.
User Context: Rural clinic in South Sudan requiring offline-capable system.

## System Architecture

### UI/UX Decisions
The frontend utilizes React with TypeScript, styled using Radix UI and shadcn/ui with Tailwind CSS, featuring a custom medical theme. Routing is handled by Wouter, and state management by TanStack Query.

### Technical Implementations
The backend is built with Node.js and Express.js, using TypeScript for a RESTful API with JSON responses. Data validation is performed using Zod schemas. The system supports offline functionality through local storage caching and a pending sync queue.

### Feature Specifications
- **Authentication & Security**: Username/password authentication with Passport.js local strategy, secure password hashing (scrypt), session-based authentication with httpOnly cookies, role-based access control (admin, reception, doctor, lab, radiology, pharmacy), and protected routes ensuring only authenticated users can access the system.
- **Patient Management**: Registration, search, unique ID generation, medical history, and allergy tracking.
- **Treatment Module**: Visit recording, vital signs, chief complaint, diagnosis, treatment plans, and follow-up scheduling.
- **Payment System**: Integrated payment tracking across all diagnostic services (Laboratory, X-Ray, Ultrasound). Unpaid services display visual indicators (red background, UNPAID badge) and are blocked from results entry until payment is processed at reception. Payment status is automatically updated when payments are recorded through the payment module.
- **Laboratory System**: Comprehensive test ordering (blood, urine, stool, microbiology, chemistry, hormonal, STI/reproductive health, parasitic/tropical, tuberculosis), chemistry and hormonal machine integration, priority management, results recording with normal values, status tracking, photo upload for lab results, and payment validation. The system is designed to match clinic workflow, allowing doctors to order simple tests and technicians to input detailed results. It includes robust clinical interpretation, detecting critical medical findings and generating professional medical reports.
- **X-Ray Module**: Examination requests, safety checklists, findings, impression documentation, photo upload capability, offline sync functionality, modern Pending/Completed tab interface, and integrated payment validation requiring payment before exam performance.
- **Ultrasound Module (ECube 8)**: Advanced ultrasound capabilities (cardiac echo, vascular Doppler, obstetric), specialized examinations, high-resolution imaging, quality assessment, comprehensive reporting with professional template systems for findings and impressions, photo upload capability, offline sync functionality, modern Pending/Completed tab interface, and integrated payment validation.
- **Dashboard & Reporting**: Statistical overview, recent patient activity, common diagnosis analysis, and printable reports.
- **Age-centric Design**: "Date of Birth" has been replaced with "Age" throughout the system to align with local user contexts.

### System Design Choices
The application is designed for both cloud and local network deployments. A key architectural decision is the robust offline-first approach, enabling full functionality without continuous internet access. The database layer uses Drizzle ORM with PostgreSQL (Neon) for cloud deployment and SQLite for local/offline environments. Automated migration scripts ensure data consistency.

## External Dependencies

- **Frontend**: React, TypeScript, Radix UI, shadcn/ui, Tailwind CSS, Wouter, TanStack Query, Lucide React, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, TypeScript, Zod.
- **Database & ORM**: Drizzle ORM, Neon Database (PostgreSQL), Better SQLite3.
- **Development Tools**: Vite, ESBuild, Replit.