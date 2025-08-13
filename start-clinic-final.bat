@echo off
title Bahr El Ghazal Clinic System

echo ========================================
echo   Bahr El Ghazal Clinic Management System
echo ========================================
echo.
echo Starting the clinic system...
echo Access at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the system when done
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Dependencies not found. Running setup first...
    call setup-windows-simple.bat
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Setup failed. Please check your internet connection.
        pause
        exit /b 1
    )
)

REM Set environment and start
set NODE_ENV=development
npx tsx server/index.ts

echo.
echo System stopped. You can close this window.
pause