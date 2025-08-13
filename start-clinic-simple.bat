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

REM Set environment and start the server directly
set NODE_ENV=development
node_modules\.bin\tsx server/index.ts

echo.
echo System stopped. You can close this window.
pause