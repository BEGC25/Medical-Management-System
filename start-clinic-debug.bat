@echo off
title Bahr El Ghazal Clinic System - Debug Mode

echo ========================================
echo   Bahr El Ghazal Clinic Management System
echo   DEBUG MODE - Shows All Errors
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Check if Node.js is available
echo Checking Node.js installation...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is available
echo.

REM Check if dependencies are installed
echo Checking dependencies...
if not exist "node_modules" (
    echo ❌ Dependencies not found
    echo Running npm install...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo ✓ Dependencies found
)
echo.

REM Check if tsx is available
echo Checking tsx availability...
npx tsx --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ tsx not available, installing...
    npm install tsx
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install tsx
        pause
        exit /b 1
    )
)
echo ✓ tsx is available
echo.

REM Check if server file exists
if not exist "server\index.ts" (
    echo ❌ Server file not found: server\index.ts
    echo Current files in server directory:
    dir server\
    pause
    exit /b 1
)
echo ✓ Server file found
echo.

echo Starting the clinic system...
echo Access at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the system when done
echo.

REM Set environment and start with detailed error reporting
set NODE_ENV=development
npx tsx server/index.ts

echo.
echo System stopped.
echo If you saw any errors above, please report them.
pause