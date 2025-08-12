#!/bin/bash

# Bahr El Ghazal Clinic - Database Backup Script
# Run this script daily to backup your clinic data

# Create backups directory if it doesn't exist
mkdir -p backups

# Get current date and time
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# Database connection details (update if needed)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-clinic_management}
DB_USER=${DB_USER:-clinic_user}

# Create backup filename
BACKUP_FILE="backups/clinic_backup_${BACKUP_DATE}.sql"

echo "Starting database backup..."
echo "Backup file: $BACKUP_FILE"

# Create database backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✓ Database backup completed successfully!"
    echo "Backup saved to: $BACKUP_FILE"
    
    # Keep only last 30 backups (delete older ones)
    echo "Cleaning old backups (keeping last 30)..."
    ls -t backups/clinic_backup_*.sql | tail -n +31 | xargs -r rm
    
    echo "✓ Backup process completed!"
else
    echo "✗ Backup failed!"
    exit 1
fi

# Display backup size
echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
echo "Total backups: $(ls backups/clinic_backup_*.sql 2>/dev/null | wc -l)"