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

REM Alternative startup method
cd /d "%~dp0"
npm start

echo.
echo System stopped. You can close this window.
pause