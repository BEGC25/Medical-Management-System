@echo off
echo Starting Bahr El Ghazal Clinic...
cd /d "%~dp0"

echo Installing dependencies...
call npm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo Starting server...
call npx tsx server/index.ts
pause