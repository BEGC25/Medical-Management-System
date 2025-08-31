@echo off
echo ========================================
echo   CLINIC SYSTEM FIREWALL CONFIGURATION
echo ========================================
echo.

echo This script configures Windows Firewall to allow clinic system access
echo across the local network (192.168.1.x).
echo.
echo IMPORTANT: Must be run as Administrator!
echo.

REM Check for administrator privileges
net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Administrator privileges confirmed.
echo.

echo Adding firewall rules for clinic system...
echo.

REM Allow Node.js application through firewall
echo Adding rule for Node.js application...
netsh advfirewall firewall add rule name="Clinic System - Node.js" dir=in action=allow program="node.exe" enable=yes
netsh advfirewall firewall add rule name="Clinic System - Node.js Out" dir=out action=allow program="node.exe" enable=yes

REM Allow specific port 5000 for clinic system
echo Adding rule for port 5000 (Clinic System)...
netsh advfirewall firewall add rule name="Clinic System - Port 5000" dir=in action=allow protocol=TCP localport=5000 enable=yes
netsh advfirewall firewall add rule name="Clinic System - Port 5000 Out" dir=out action=allow protocol=TCP localport=5000 enable=yes

REM Allow access from local network subnet
echo Adding rule for local network access (192.168.1.x)...
netsh advfirewall firewall add rule name="Clinic System - Local Network" dir=in action=allow protocol=TCP localport=5000 remoteip=192.168.1.0/24 enable=yes

REM Allow HTTP traffic on local network
echo Adding rule for HTTP traffic...
netsh advfirewall firewall add rule name="Clinic System - HTTP" dir=in action=allow protocol=TCP localport=80 remoteip=192.168.1.0/24 enable=yes

echo.
echo ========================================
echo FIREWALL RULES ADDED SUCCESSFULLY
echo ========================================
echo.

echo The following firewall rules have been created:
echo.
echo 1. Node.js application access (inbound/outbound)
echo 2. Port 5000 access for clinic system
echo 3. Local network access (192.168.1.0/24)
echo 4. HTTP traffic on local network
echo.

echo Current firewall status:
netsh advfirewall show currentprofile
echo.

echo Testing firewall rules...
echo Checking if port 5000 is allowed:
netsh advfirewall firewall show rule name="Clinic System - Port 5000"
echo.

echo ========================================
echo CONFIGURATION COMPLETE
echo ========================================
echo.
echo Your computer is now configured to allow clinic system access
echo from other computers on the local network (192.168.1.100-104).
echo.
echo Next steps:
echo 1. Configure IP addresses using: configure-ip-address.bat
echo 2. Start the clinic server using: start-local-server.bat
echo 3. Test network connectivity using: check-network-connection.bat
echo.

pause