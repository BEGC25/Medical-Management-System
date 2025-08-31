@echo off
echo ========================================
echo    BAHR EL GHAZAL CLINIC SYSTEM
echo         Local Network Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking system requirements...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js first.
    pause
    exit /b 1
)

echo Node.js version: 
node --version

echo.
echo Starting clinic management system server...
echo.
echo IMPORTANT: This computer will act as the main server.
echo Other department computers should access the system at:
echo.
echo    http://192.168.1.100:5000
echo.
echo Make sure this computer's IP address is set to 192.168.1.100
echo.

REM Set environment variables for local network
set NODE_ENV=production
set DATABASE_FILE=clinic.db
set SERVER_HOST=0.0.0.0
set SERVER_PORT=5000

echo Server will start on all network interfaces (0.0.0.0:5000)
echo This allows other computers on the local network to connect.
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing system dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo  SERVER STARTING - DO NOT CLOSE WINDOW
echo ========================================
echo.
echo Access URLs for each department:
echo.
echo Reception/Admin:  http://localhost:5000
echo Laboratory:       http://192.168.1.100:5000
echo X-ray:            http://192.168.1.100:5000  
echo Ultrasound:       http://192.168.1.100:5000
echo Consultation:     http://192.168.1.100:5000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
call npx tsx server/index.ts

echo.
echo Server has stopped.
pause