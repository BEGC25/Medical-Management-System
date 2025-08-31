@echo off
echo ========================================
echo   CLINIC SYSTEM DESKTOP SHORTCUTS
echo ========================================
echo.

echo This script creates desktop shortcuts for easy access to the clinic system.
echo.

set DESKTOP=%USERPROFILE%\Desktop
set CLINIC_PATH=%~dp0

echo Creating desktop shortcuts...
echo.

REM Main Server Shortcut
echo Creating "Start Clinic Server" shortcut...
echo [InternetShortcut] > "%DESKTOP%\Start Clinic Server.url"
echo URL=file:///%CLINIC_PATH%start-local-server.bat >> "%DESKTOP%\Start Clinic Server.url"
echo IconFile=%CLINIC_PATH%clinic-icon.ico >> "%DESKTOP%\Start Clinic Server.url"

REM Department Access Shortcut
echo Creating "Access Clinic System" shortcut...
echo [InternetShortcut] > "%DESKTOP%\Access Clinic System.url"
echo URL=http://192.168.1.100:5000 >> "%DESKTOP%\Access Clinic System.url"

REM Network Test Shortcut  
echo Creating "Test Network Connection" shortcut...
echo [InternetShortcut] > "%DESKTOP%\Test Network Connection.url"
echo URL=file:///%CLINIC_PATH%check-network-connection.bat >> "%DESKTOP%\Test Network Connection.url"

REM Configuration Shortcut
echo Creating "Configure Network" shortcut...
echo [InternetShortcut] > "%DESKTOP%\Configure Network.url"
echo URL=file:///%CLINIC_PATH%configure-ip-address.bat >> "%DESKTOP%\Configure Network.url"

echo.
echo ========================================
echo SHORTCUTS CREATED SUCCESSFULLY
echo ========================================
echo.

echo The following shortcuts have been created on your desktop:
echo.
echo 1. "Start Clinic Server" - Use on Main Server computer only
echo 2. "Access Clinic System" - Use on all department computers  
echo 3. "Test Network Connection" - Check network connectivity
echo 4. "Configure Network" - Set up IP addresses
echo.

echo USAGE INSTRUCTIONS:
echo.
echo FOR MAIN SERVER COMPUTER:
echo - Double-click "Start Clinic Server" to start the system
echo - Then double-click "Access Clinic System" to use the system
echo.
echo FOR DEPARTMENT COMPUTERS:
echo - Only double-click "Access Clinic System" to access the system
echo - The Main Server must be running first!
echo.

pause