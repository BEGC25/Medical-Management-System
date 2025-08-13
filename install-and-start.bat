@echo off
echo ========================================
echo   Bahr El Ghazal Clinic Management System
echo   Installing Dependencies and Starting...
echo ========================================
echo.

REM Change to the script directory
cd /d "%~dp0"

echo Installing required packages...
echo This may take a few minutes...
echo.

REM Install all dependencies
npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed successfully
echo.
echo Starting the clinic system...
echo Access at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the system when done
echo.

REM Start the application using npm script
npm run dev

echo.
echo System stopped. You can close this window.
pause