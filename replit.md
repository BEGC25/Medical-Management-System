# Bahr El Ghazal Clinic Management System

## Overview

This is a full-stack web application designed specifically for Bahr El Ghazal Clinic in rural South Sudan, providing comprehensive patient management, treatment tracking, laboratory testing, and X-ray examination capabilities. The system is built to work both online and offline, making it suitable for remote healthcare facilities with intermittent internet connectivity.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom medical theme colors
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and building

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with JSON responses
- **Middleware**: Express middleware for logging and error handling

### Database Architecture
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: Configured for PostgreSQL (via Neon) with SQLite fallback
- **Schema**: Centralized schema definitions in shared directory
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Patient Management
- Patient registration with comprehensive medical information
- Patient search functionality
- Unique patient ID generation system
- Medical history and allergy tracking

### Treatment Module
- Visit recording with vital signs
- Chief complaint and examination notes
- Diagnosis and treatment plan documentation
- Follow-up scheduling

### Laboratory System
- Lab test ordering with multiple categories (blood, urine, stool, microbiology, chemistry, hormonal)
- Chemistry machine integration: LFT, KFT, Lipid Profile, HbA1c, Cardiac Enzymes, Electrolyte Panel
- Hormonal machine integration: Thyroid Function, Diabetes Panel, Reproductive Hormones, Adrenal Function
- Priority-based test management
- Results recording and normal value reference
- Status tracking (pending, completed, cancelled)

### X-Ray Module
- X-ray examination requests
- Safety checklist implementation
- Technical quality assessment
- Findings and impression documentation

### Ultrasound Module (ECube 8)
- Advanced ultrasound capabilities: cardiac echo, vascular Doppler, obstetric monitoring
- Specialized examinations: renal, hepatobiliary, gynecological, urological, pediatric
- High-resolution imaging: breast, scrotal, thyroid, musculoskeletal, carotid Doppler
- Quality assessment and comprehensive reporting system

### Dashboard & Reporting
- Statistical overview of clinic operations
- Recent patient activity tracking
- Common diagnosis analysis
- Printable reports generation

## Data Flow

1. **Client Requests**: Frontend makes API calls using TanStack Query
2. **Server Processing**: Express routes handle requests and validate data using Zod schemas
3. **Database Operations**: Drizzle ORM performs type-safe database operations
4. **Response Handling**: Structured JSON responses with error handling
5. **Offline Support**: Local storage caching with pending sync queue

## External Dependencies

### UI Components
- Radix UI primitives for accessible components
- Lucide React for consistent iconography
- React Hook Form with Zod validation

### Development Tools
- TypeScript for type safety
- ESBuild for production bundling
- Replit integration for development environment

### Database & ORM
- Drizzle ORM with PostgreSQL dialect
- Neon Database for serverless PostgreSQL
- Better SQLite3 for local development

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- TSX for TypeScript execution in development
- Replit-specific plugins for enhanced development experience

### Production
- Vite build for optimized frontend bundle
- ESBuild for server-side bundling
- Static file serving from Express
- Environment variable configuration for database connections

### Database Deployment
- Production: Neon Database (serverless PostgreSQL)
- Development: Local SQLite database
- Automatic migration running on startup

## Deployment Options

### Cloud Deployment (Current)
- Hosted on Replit for development and testing
- Requires internet connectivity
- Automatic scaling and updates

### Local/Offline Deployment (Recommended for Rural Clinics)
- Complete offline operation after setup
- No monthly hosting costs
- Full data privacy and security
- Setup guides created for Windows, macOS, and Linux

### Deployment Files Created
- `OFFLINE_DEPLOYMENT_GUIDE.md` - Comprehensive technical setup guide
- `QUICK_START_GUIDE.md` - Simple instructions for non-technical users
- `setup-local.sh` / `setup-local.bat` - Automated setup scripts
- `backup.sh` / `backup.bat` - Daily backup scripts
- `start-clinic.bat` - Easy start script for Windows

## Changelog
- July 04, 2025. Initial setup with PostgreSQL database and full CRUD operations
- January 14, 2025. Added comprehensive offline deployment guides and scripts for rural clinic use
- August 13, 2025. Converted to SQLite database for simplified Windows deployment, created simplified setup package for rural clinic deployment
- August 13, 2025. Fixed Windows compatibility issues: Added cross-env dependency, updated batch files with npx tsx commands, created comprehensive Windows setup guide (WINDOWS_SETUP_FINAL.md)
- August 13, 2025. Successfully deployed on Windows: Fixed server binding issues (localhost vs 0.0.0.0), resolved reusePort compatibility, system now fully operational on Windows with SQLite database, created staff training documentation (HOW_THE_CLINIC_SYSTEM_WORKS.md)
- August 13, 2025. Created comprehensive deployment package for USA-to-South Sudan shipping: Digital and physical delivery options, complete setup checklists, remote support guidelines (DEPLOYMENT_PACKAGE_FOR_SOUTH_SUDAN.md, SIMPLE_SETUP_CHECKLIST.md, SHIPPING_INSTRUCTIONS.md)
- August 13, 2025. Enhanced laboratory system with chemistry and hormonal testing machines plus infectious disease tests: Added Widal (typhoid), H. pylori, Brucella, and other regional disease tests specific to South Sudan healthcare needs
- August 14, 2025. **Perfected printing system**: Created bullet-proof isolated window printing with CSS copying system (printByHtml/printById), implemented shared ClinicHeader component for consistent branding, all documents now print identically on single A4 page with exact 210mm x 297mm dimensions and no browser interference

## User Preferences

Preferred communication style: Simple, everyday language.
User Context: Rural clinic in South Sudan requiring offline-capable system.