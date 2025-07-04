# Rural Clinic Management System

## Overview

This is a full-stack web application designed for rural medical clinics, providing comprehensive patient management, treatment tracking, laboratory testing, and X-ray examination capabilities. The system is built to work both online and offline, making it suitable for remote healthcare facilities with intermittent internet connectivity.

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
- Lab test ordering with multiple categories (blood, urine, stool, microbiology)
- Priority-based test management
- Results recording and normal value reference
- Status tracking (pending, completed, cancelled)

### X-Ray Module
- X-ray examination requests
- Safety checklist implementation
- Technical quality assessment
- Findings and impression documentation

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

## Changelog
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.