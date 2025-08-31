@echo off
echo ========================================
echo   CLINIC NETWORK IP CONFIGURATION
echo ========================================
echo.

echo This script will help configure IP addresses for clinic computers.
echo.
echo IMPORTANT: Run this script on each computer with Administrator privileges!
echo.

echo Select the computer type:
echo.
echo 1. Main Server (Reception/Admin) - IP: 192.168.1.100
echo 2. Laboratory Computer - IP: 192.168.1.101
echo 3. X-ray Computer - IP: 192.168.1.102  
echo 4. Ultrasound Computer - IP: 192.168.1.103
echo 5. Consultation Computer - IP: 192.168.1.104
echo 6. Show current network configuration
echo 7. Exit
echo.

set /p choice=Enter your choice (1-7): 

if "%choice%"=="1" (
    set IP=192.168.1.100
    set COMPUTER_TYPE=Main Server
    goto configure
)
if "%choice%"=="2" (
    set IP=192.168.1.101
    set COMPUTER_TYPE=Laboratory
    goto configure
)
if "%choice%"=="3" (
    set IP=192.168.1.102
    set COMPUTER_TYPE=X-ray
    goto configure
)
if "%choice%"=="4" (
    set IP=192.168.1.103
    set COMPUTER_TYPE=Ultrasound
    goto configure
)
if "%choice%"=="5" (
    set IP=192.168.1.104
    set COMPUTER_TYPE=Consultation
    goto configure
)
if "%choice%"=="6" (
    goto showconfig
)
if "%choice%"=="7" (
    goto end
)

echo Invalid choice. Please try again.
pause
goto start

:configure
echo.
echo ========================================
echo Configuring %COMPUTER_TYPE% Computer
echo IP Address: %IP%
echo ========================================
echo.

echo WARNING: This will change your network settings!
echo Make sure you want to proceed.
echo.
set /p confirm=Type YES to continue: 

if not "%confirm%"=="YES" (
    echo Configuration cancelled.
    goto end
)

echo.
echo Applying network configuration...
echo.

REM Configure static IP address
netsh interface ip set address "Ethernet" static %IP% 255.255.255.0 192.168.1.1

if errorlevel 1 (
    echo.
    echo ERROR: Failed to configure IP address!
    echo Please check:
    echo 1. You are running as Administrator
    echo 2. Network adapter is named "Ethernet"
    echo 3. Network adapter is connected
    echo.
    echo To check adapter names, run: netsh interface show interface
    echo.
    pause
    goto end
)

echo.
echo SUCCESS: IP address configured successfully!
echo.
echo New configuration:
echo - IP Address: %IP%
echo - Subnet Mask: 255.255.255.0
echo - Gateway: 192.168.1.1
echo.

echo Testing network connectivity...
ping -n 2 192.168.1.1 >nul
if errorlevel 1 (
    echo WARNING: Cannot reach gateway (192.168.1.1)
    echo Check network switch/router connection
) else (
    echo Network connection test: PASSED
)

echo.
echo Configuration complete for %COMPUTER_TYPE% computer.
echo.

if "%choice%"=="1" (
    echo This computer is now the Main Server.
    echo To start the clinic system, run: start-local-server.bat
    echo Other computers should access: http://192.168.1.100:5000
) else (
    echo This computer can now access the clinic system at:
    echo http://192.168.1.100:5000
    echo.
    echo Make sure the Main Server is running first!
)

goto end

:showconfig
echo.
echo ========================================
echo CURRENT NETWORK CONFIGURATION
echo ========================================
echo.
ipconfig /all | findstr "IPv4"
echo.
echo To access clinic system:
echo - If this is Main Server: http://localhost:5000
echo - If this is Department computer: http://192.168.1.100:5000
echo.
goto end

:end
echo.
pause