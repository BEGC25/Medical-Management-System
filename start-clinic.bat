@echo off
title Bahr El Ghazal Clinic System

echo ========================================
echo   Starting Bahr El Ghazal Clinic System
echo ========================================
echo.

REM Check if the system is built
if not exist "dist\index.js" (
    echo Building system for first time...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Build failed! Please run setup-local.bat first.
        pause
        exit /b 1
    )
)

echo Starting clinic system...
echo.
echo ✓ System will be available at: http://localhost:3000
echo ✓ Press Ctrl+C to stop the system
echo ✓ Close this window to stop the system
echo.

REM Start the application
call npm run start

echo.
echo System stopped.
pause