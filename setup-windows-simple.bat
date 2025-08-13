@echo off
setlocal enabledelayedexpansion

REM Clinic Management System - Simple Windows Setup (SQLite)
REM No PostgreSQL required - uses built-in SQLite database

echo ========================================
echo   Bahr El Ghazal Clinic Setup (Simple)
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js version: %NODE_VERSION%
echo ✓ Using SQLite database (no additional software needed)
echo.

REM Create simple .env file for SQLite
if not exist ".env" (
    echo Creating .env file for SQLite...
    (
    echo NODE_ENV=production
    echo PORT=5000
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
    echo.
    echo This might be due to:
    echo - No internet connection
    echo - Antivirus blocking downloads
    echo - Network firewall restrictions
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.

echo Building application...
REM Note: Skip build for development mode - we'll use npm run dev instead
echo ✓ Development setup ready (skipping build for faster startup)

REM Create backups directory
if not exist "backups" mkdir backups
echo ✓ Backups directory created

REM Create simple start script
(
echo @echo off
echo echo ========================================
echo echo   Bahr El Ghazal Clinic Management System
echo echo ========================================
echo echo.
echo echo Starting the clinic system...
echo echo Access at: http://localhost:5000
echo echo.
echo echo Press Ctrl+C to stop the system when done
echo echo.
echo call npm run dev
echo.
echo echo System stopped. You can close this window.
echo pause
) > start-clinic.bat

echo ✓ Start script created (start-clinic.bat)

REM Create simple backup script for SQLite
(
echo @echo off
echo echo Creating backup of clinic database...
echo if not exist "backups" mkdir backups
echo copy clinic.db "backups\clinic_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.db"
echo echo ✓ Backup created in backups folder
echo pause
) > backup.bat

echo ✓ Backup script created (backup.bat)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Your clinic system is ready to use with:
echo   ✓ SQLite database (clinic.db file)
echo   ✓ No additional software needed
echo   ✓ Complete offline operation
echo.
echo To start the clinic system:
echo   Double-click: start-clinic.bat
echo.
echo To access the system:
echo   Open browser to: http://localhost:5000
echo.
echo To backup data:
echo   Double-click: backup.bat
echo.
echo All patient data is stored in: clinic.db
echo.
pause