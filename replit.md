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
- **Treatment Module**: Visit recording, vital signs, chief complaint, diagnosis, treatment plans, and follow-up scheduling. Features a modern tabbed interface with Visit Notes (SOAP documentation), Lab Tests (ordering), Imaging (X-ray/ultrasound ordering), and Medications (pharmacy ordering). The medication ordering tab allows doctors to select drugs from inventory, specify dosage/quantity/instructions, and submit orders directly to the pharmacy dispensing queue, eliminating previous workflow confusion.
- **Payment System**: Integrated payment tracking across all diagnostic services (Laboratory, X-Ray, Ultrasound, Pharmacy). The Payment page automatically displays all patients with pending payments on load, organized in a tabbed interface by department (Laboratory, X-Ray, Ultrasound, Pharmacy). Each pending payment shows patient name, patient ID, service description, and date. Clicking a pending payment card selects that patient, allowing staff to manually build the payment with the correct services and pricing. Unpaid services display visual indicators (red background, UNPAID badge) and are blocked from results entry until payment is processed at reception. Payment status is automatically updated when payments are recorded through the payment module. The search functionality remains available for quick patient lookup.
- **Laboratory System**: Comprehensive test ordering (blood, urine, stool, microbiology, chemistry, hormonal, STI/reproductive health, parasitic/tropical, tuberculosis), chemistry and hormonal machine integration, priority management, results recording with normal values, status tracking, photo upload for lab results, and payment validation. The system is designed to match clinic workflow, allowing doctors to order simple tests and technicians to input detailed results. It includes robust clinical interpretation, detecting critical medical findings and generating professional medical reports.
- **X-Ray Module**: Examination requests, safety checklists, findings, impression documentation, photo upload capability, offline sync functionality, modern Pending/Completed tab interface, and integrated payment validation requiring payment before exam performance.
- **Ultrasound Module (ECube 8)**: Advanced ultrasound capabilities (cardiac echo, vascular Doppler, obstetric), specialized examinations, high-resolution imaging, quality assessment, comprehensive reporting with professional template systems for findings and impressions, photo upload capability, offline sync functionality, modern Pending/Completed tab interface, and integrated payment validation.
- **Pharmacy Module**: Comprehensive inventory management with drug catalog, batch tracking (FEFO), inventory ledger, dispensing workflow, and stock management. Features include: auto-generated drug codes (DRG00001, DRG00002...), bulk purchase support (cartons/boxes with automatic quantity calculation), optional lot numbers, batch-specific pricing, FEFO batch dispensing to minimize waste, low stock and expiring drugs alerts, and supplier tracking.
- **Dashboard & Reporting**: Statistical overview, recent patient activity, common diagnosis analysis, and printable reports.
- **Age-centric Design**: "Date of Birth" has been replaced with "Age" throughout the system to align with local user contexts.

### System Design Choices
The application is designed for both cloud and local network deployments. A key architectural decision is the robust offline-first approach, enabling full functionality without continuous internet access. The database layer uses Drizzle ORM with PostgreSQL (Neon) for cloud deployment and SQLite for local/offline environments. Automated migration scripts ensure data consistency.

## External Dependencies

- **Frontend**: React, TypeScript, Radix UI, shadcn/ui, Tailwind CSS, Wouter, TanStack Query, Lucide React, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, TypeScript, Zod.
- **Database & ORM**: Drizzle ORM, Neon Database (PostgreSQL), Better SQLite3.
- **Development Tools**: Vite, ESBuild, Replit.