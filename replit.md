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
- August 27, 2025. Implemented photo upload system for lab results: Staff can now photograph lab machine printouts (CBC, chemistry, etc.) and attach them to patient records, significantly reducing manual data entry time while maintaining accuracy
- August 29, 2025. Major laboratory workflow enhancement: Redesigned system to match clinic's actual workflow where doctors order simple tests (e.g., "Urine Analysis") and lab technicians select detailed result fields during testing. Added modern interface with dropdown options, normal value indicators, smart defaults, and quick-action buttons for common results. System now includes comprehensive result fields for Urine Analysis, Urine Microscopy, Stool Examination, and CBC with proper normal ranges and visual indicators.
- August 29, 2025. Fixed laboratory results entry workflow: Individual "Save" buttons under each test category now save only that specific test's results without marking the entire lab test as completed, allowing technicians to work on multiple tests progressively. Added a final "Complete & Finalize All Results" button that marks the entire test as completed and closes the form.
- August 29, 2025. Completely redesigned lab results display for doctors: Replaced unprofessional raw JSON format with hospital-grade medical report layout. Added professional formatting with clear test sections, color-coded abnormal values (red for critical findings), automatic clinical interpretation with warnings for malaria, typhoid, proteinuria, and other critical findings. Results now display like professional medical reports suitable for clinical decision-making.
- August 29, 2025. Enhanced system for rural South Sudan context: Changed "Date of Birth" to "Age" throughout the system since people in rural areas typically know their age rather than exact birth dates. Added professional print functionality to All Results page allowing doctors to generate high-quality medical reports for patient files and referrals.
- August 29, 2025. Achieved comprehensive clinical interpretation consistency: Fixed View Details dialog to show same critical findings as print version. System now detects 12+ critical medical findings including Brucella infection, urine microscopy abnormalities (cellular/granular casts, Trichomonas, high pus cells, blood cells), stool parasites (Ascaris worms, E. histolytica), bloody urine/stool, severe proteinuria, and other urgent conditions. Both digital and print interfaces provide identical USA-level medical reporting quality with complete clinical accuracy for rural healthcare.
- August 30, 2025. Enhanced clinical interpretation system to detect ALL laboratory abnormalities: Added comprehensive detection for malaria (all 4 species + gametocytes), severe anemia/hemoglobin levels, CBC analysis, typhoid/paratyphoid titers, Brucella infections, VDRL syphilis, complete urine analysis (appearance, protein, glucose, ketones, hemoglobin, leucocytes, nitrite, bilirubin), urine microscopy (all cast types, parasites, cell counts, crystals), stool examination (all parasites, bloody appearance), blood glucose, renal function, and HIV/Hepatitis tests. System now catches critically low hemoglobin (4 g/dL) and other life-threatening conditions. Implemented multiselect malaria detection for mixed infections and follow-up test ordering workflow.
- August 30, 2025. Replaced "Date of Birth" with "Age" throughout entire system: Updated database schema with automatic migration, modified all patient forms and displays to use age field instead of birth date calculation. This change reflects the rural South Sudan context where people commonly know their age rather than exact birth dates. Database migration successfully preserved existing data by converting birth dates to calculated ages.
- August 30, 2025. Major laboratory system expansion for South Sudan healthcare needs: Added comprehensive new test categories including STI/reproductive health tests (Gonorrhea, Chlamydia, VDRL for syphilis), parasitic/tropical disease tests (Toxoplasma, Filariasis skin snip and wet mount, Schistosomiasis, Leishmaniasis), improved hormone tests matching clinic request paper format (separate Thyroid, Reproductive, and Cardiac markers), tuberculosis tests (AFB smear, GeneXpert), emergency tests (meningitis, yellow fever, typhus), and enhanced clinical interpretation system to detect all new test abnormalities. System now provides complete laboratory coverage for rural African healthcare with professional medical-grade reporting and critical findings detection.
- August 31, 2025. Fixed remaining age display issues across all modules: Corrected All Results View Details dialog to use age field instead of non-existent dateOfBirth field, updated print templates to properly display patient ages (30 for BGC3, 35 for BGC1, 15 for BGC2), added age display to X-ray and Ultrasound patient information sections. All age-related display issues are now completely resolved throughout the entire system.
- August 31, 2025. Simplified X-ray module per user request: Removed Priority field from X-ray order form, removed Technical Quality and Report Status fields from results entry, updated database schema and applied migration. X-ray interface now streamlined with essential fields only.
- August 31, 2025. Enhanced ultrasound module with professional template system: Added "Normal" and "Abnormal" template buttons for both Findings and Impression fields. Templates are exam-type specific (abdominal, pelvic, obstetric, cardiac, renal, thyroid, vascular) with comprehensive medical terminology and structured reporting format. Radiographers can now quickly insert professional findings templates and customize as needed, significantly reducing typing time while maintaining clinical accuracy.

## User Preferences

Preferred communication style: Simple, everyday language.
User Context: Rural clinic in South Sudan requiring offline-capable system.