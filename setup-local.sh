#!/bin/bash

# Clinic Management System - Local Setup Script
# This script helps set up the system for offline deployment

echo "========================================"
echo "  Clinic Management System Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "Please install PostgreSQL from: https://www.postgresql.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ PostgreSQL is installed"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOL
NODE_ENV=production
DATABASE_URL=postgresql://clinic_user:clinic_password_2024@localhost:5432/clinic_management
PORT=3000
HOST=0.0.0.0
EOL
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "Installing dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Check if database exists
echo "Setting up database..."
echo "Please enter PostgreSQL superuser password when prompted:"

# Create user and database
psql -U postgres -h localhost << EOL
-- Create user if not exists
DO \$\$ 
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'clinic_user') THEN
      CREATE USER clinic_user WITH PASSWORD 'clinic_password_2024';
   END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE clinic_management' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'clinic_management');

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE clinic_management TO clinic_user;
EOL

if [ $? -eq 0 ]; then
    echo "✓ Database setup completed"
else
    echo "❌ Database setup failed"
    exit 1
fi

echo ""
echo "Setting up database tables..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✓ Database tables created"
else
    echo "❌ Failed to create database tables"
    exit 1
fi

echo ""
echo "Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✓ Application built successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Create backups directory
mkdir -p backups
echo "✓ Backups directory created"

# Make backup script executable
chmod +x backup.sh
echo "✓ Backup script configured"

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "To start the clinic system:"
echo "  npm run start"
echo ""
echo "To access the system:"
echo "  Open browser to: http://localhost:3000"
echo ""
echo "To backup data:"
echo "  ./backup.sh"
echo ""
echo "System is ready for offline use!"