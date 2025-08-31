@echo off
echo ========================================
echo   CLINIC NETWORK CONNECTION TEST
echo ========================================
echo.

echo Testing network connectivity for all departments...
echo.

echo Testing Main Server (Reception - 192.168.1.100):
ping -n 4 192.168.1.100
echo.

echo Testing Laboratory Computer (192.168.1.101):
ping -n 4 192.168.1.101
echo.

echo Testing X-ray Computer (192.168.1.102):
ping -n 4 192.168.1.102
echo.

echo Testing Ultrasound Computer (192.168.1.103):
ping -n 4 192.168.1.103
echo.

echo Testing Consultation Computer (192.168.1.104):
ping -n 4 192.168.1.104
echo.

echo ========================================
echo Displaying current network configuration:
echo ========================================
ipconfig
echo.

echo ========================================
echo Testing clinic system accessibility:
echo ========================================
echo.
echo Checking if clinic server is running on port 5000...
netstat -an | findstr ":5000"
echo.

echo ========================================
echo NETWORK TEST COMPLETE
echo ========================================
echo.
echo If any computer shows "Request timed out":
echo 1. Check ethernet cable connections
echo 2. Verify IP address configuration
echo 3. Check if computer is powered on
echo 4. Restart network switch if needed
echo.

pause