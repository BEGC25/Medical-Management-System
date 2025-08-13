@echo off
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

REM Set environment variable for Windows
set NODE_ENV=development

REM Start using npx to find tsx properly
npx tsx server/index.ts

echo.
echo System stopped. You can close this window.
pause