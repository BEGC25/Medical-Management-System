@echo off
REM Clinic Management System - Database Backup Script for Windows
REM Run this script daily to backup your clinic data

REM Create backups directory if it doesn't exist
if not exist "backups" mkdir backups

REM Get current date and time (format: YYYYMMDD_HHMMSS)
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "BACKUP_DATE=%dt:~0,8%_%dt:~8,6%"

REM Database connection details (update if needed)
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=clinic_management
set DB_USER=clinic_user

REM Create backup filename
set "BACKUP_FILE=backups\clinic_backup_%BACKUP_DATE%.sql"

echo Starting database backup...
echo Backup file: %BACKUP_FILE%

REM Create database backup
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo ✓ Database backup completed successfully!
    echo Backup saved to: %BACKUP_FILE%
    echo ✓ Backup process completed!
) else (
    echo ✗ Backup failed!
    pause
    exit /b 1
)

REM Display backup info
for %%F in ("%BACKUP_FILE%") do echo Backup size: %%~zF bytes
for /f %%F in ('dir backups\clinic_backup_*.sql 2^>nul ^| find "File(s)"') do echo Total backups: %%F

pause