@echo off
title Bahr El Ghazal Clinic System

echo ========================================
echo   Bahr El Ghazal Clinic Management System
echo ========================================
echo.

REM Force change to the script directory (where this bat file is located)
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Check if we're in the right place by looking for package.json
if not exist "package.json" (
    echo ❌ ERROR: Cannot find package.json in current directory
    echo This script must be run from the MedicalTracker folder
    echo Make sure you extracted the files to C:\MedicalTracker
    echo.
    pause
    exit /b 1
)

echo ✓ Found package.json - we're in the right directory
echo.

echo Installing dependencies...
call npm install --silent

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    echo Check your internet connection and try again
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.
echo Starting the clinic system...
echo Access at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the system when done
echo.

REM Set environment and start
set NODE_ENV=development
call npx tsx server/index.ts

echo.
echo System stopped. You can close this window.
pause