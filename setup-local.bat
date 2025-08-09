@echo off
setlocal enabledelayedexpansion

REM Clinic Management System - Local Setup Script for Windows
REM This script helps set up the system for offline deployment

echo ========================================
echo   Clinic Management System Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed.
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL is not installed.
    echo Please install PostgreSQL from: https://www.postgresql.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js version: %NODE_VERSION%
echo ✓ PostgreSQL is installed
echo.

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file...
    (
    echo NODE_ENV=production
    echo DATABASE_URL=postgresql://clinic_user:clinic_password_2024@localhost:5432/clinic_management
    echo PORT=3000
    echo HOST=0.0.0.0
    ) > .env
    echo ✓ .env file created
) else (
    echo ✓ .env file already exists
)

echo.
echo Installing dependencies...
call npm install --production

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.

REM Setup database
echo Setting up database...
echo Please enter PostgreSQL superuser password when prompted:

REM Create database setup SQL
(
echo DO $$ 
echo BEGIN
echo    IF NOT EXISTS ^(SELECT FROM pg_catalog.pg_roles WHERE rolname = 'clinic_user'^) THEN
echo       CREATE USER clinic_user WITH PASSWORD 'clinic_password_2024';
echo    END IF;
echo END
echo $$;
echo.
echo SELECT 'CREATE DATABASE clinic_management' 
echo WHERE NOT EXISTS ^(SELECT FROM pg_database WHERE datname = 'clinic_management'^);
echo.
echo GRANT ALL PRIVILEGES ON DATABASE clinic_management TO clinic_user;
) > temp_setup.sql

psql -U postgres -h localhost -f temp_setup.sql
set DB_RESULT=%ERRORLEVEL%
del temp_setup.sql

if %DB_RESULT% EQU 0 (
    echo ✓ Database setup completed
) else (
    echo ❌ Database setup failed
    pause
    exit /b 1
)

echo.
echo Setting up database tables...
call npm run db:push

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create database tables
    pause
    exit /b 1
)

echo ✓ Database tables created

echo.
echo Building application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✓ Application built successfully

REM Create backups directory
if not exist "backups" mkdir backups
echo ✓ Backups directory created
echo ✓ Backup script configured

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the clinic system:
echo   npm run start
echo.
echo To access the system:
echo   Open browser to: http://localhost:3000
echo.
echo To backup data:
echo   backup.bat
echo.
echo System is ready for offline use!
echo.
pause