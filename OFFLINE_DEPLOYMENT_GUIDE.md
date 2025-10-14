# Rural Clinic Management System - Offline Deployment Guide

## Overview
This guide helps you install and run the clinic management system on a local computer without requiring internet connectivity. Perfect for rural clinics with unreliable internet.

## System Requirements

### Minimum Hardware
- **Computer**: Windows 10/11, macOS, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **Processor**: Any modern CPU (Intel i3 or equivalent)

### Software Prerequisites
1. **Node.js** (version 18 or higher)
2. **PostgreSQL** (version 12 or higher)
3. **Git** (for downloading the system)

## Step-by-Step Installation

### Step 1: Install Required Software

#### Windows
1. **Download Node.js**:
   - Visit: https://nodejs.org/
   - Download LTS version
   - Run installer with default settings

2. **Download PostgreSQL**:
   - Visit: https://www.postgresql.org/download/windows/
   - Download version 15 or higher
   - During installation:
     - Set password for 'postgres' user (remember this!)
     - Use default port 5432
     - Note the installation path

3. **Download Git**:
   - Visit: https://git-scm.com/download/win
   - Run installer with default settings

#### macOS

**Option 1: If you have Homebrew installed:**
```bash
# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Git
brew install git
```

**Option 2: Manual installation (no Homebrew required):**
1. Download Node.js from https://nodejs.org/ (LTS version)
2. Download PostgreSQL from https://www.postgresql.org/download/macos/
3. Download Git from https://git-scm.com/download/mac
4. Install all three with default settings

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Git
sudo apt install git
```

### Step 2: Download the Clinic System

1. **Create a folder** for the clinic system:
   ```bash
   mkdir clinic-management
   cd clinic-management
   ```

2. **Download the system files** (copy all files from this Replit project to your local folder)

### Step 3: Database Setup

#### Start PostgreSQL Service
- **Windows**: PostgreSQL should auto-start. If not, start it from Services.
- **macOS**: `brew services start postgresql@15`
- **Linux**: `sudo systemctl start postgresql`

#### Create Database
```bash
# Connect to PostgreSQL (enter password when prompted)
psql -U postgres -h localhost

# Create database for clinic
CREATE DATABASE clinic_management;

# Create user for the clinic system
CREATE USER clinic_user WITH PASSWORD 'clinic_password_2024';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE clinic_management TO clinic_user;

# Exit PostgreSQL
\q
```

### Step 4: Configure the System

1. **Create environment file**:
   Create a file named `.env` in the project folder:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://clinic_user:clinic_password_2024@localhost:5432/clinic_management
   PORT=3000
   ```

2. **Install system dependencies**:
   ```bash
   npm install
   ```

3. **Setup database tables**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

### Step 5: Build and Start the System

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the clinic system**:
   ```bash
   npm run start
   ```

3. **Access the system**:
   - Open your web browser
   - Go to: http://localhost:3000
   - The clinic management system should load

## Daily Operations

### Starting the System
1. Ensure PostgreSQL is running
2. Open terminal/command prompt
3. Navigate to clinic folder: `cd clinic-management`
4. Start system: `npm run start`
5. Open browser to: http://localhost:3000

### Stopping the System
- Press `Ctrl+C` in the terminal to stop
- Close the browser

### Backing Up Data

#### Daily Backup (Recommended)
```bash
# Create backup folder
mkdir backups

# Backup database
pg_dump -U clinic_user -h localhost clinic_management > backups/clinic_backup_$(date +%Y%m%d).sql
```

#### Weekly Full Backup
1. Copy the entire `clinic-management` folder to external drive
2. Copy the `backups` folder to external drive

### Restoring from Backup
```bash
# Drop existing database (if needed)
psql -U postgres -h localhost -c "DROP DATABASE clinic_management;"

# Create fresh database
psql -U postgres -h localhost -c "CREATE DATABASE clinic_management;"
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE clinic_management TO clinic_user;"

# Restore from backup
psql -U clinic_user -h localhost clinic_management < backups/clinic_backup_YYYYMMDD.sql
```

## Troubleshooting

### System Won't Start
1. **Check PostgreSQL**: Ensure PostgreSQL service is running
2. **Check ports**: Make sure port 3000 is not used by another program
3. **Check environment**: Verify `.env` file has correct database settings

### Database Connection Issues
1. **Test connection**:
   ```bash
   psql -U clinic_user -h localhost clinic_management
   ```
2. **Reset password** if needed:
   ```bash
   psql -U postgres -h localhost
   ALTER USER clinic_user WITH PASSWORD 'new_password';
   ```
3. **Update `.env`** with new password

### System Running Slowly
1. **Restart PostgreSQL** service
2. **Restart the application**
3. **Clear browser cache**

## Network Access (Optional)

To access the system from other computers in the clinic:

1. **Find computer's IP address**:
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig`

2. **Update start command**:
   ```bash
   HOST=0.0.0.0 npm run start
   ```

3. **Access from other devices**:
   - Go to: http://[COMPUTER_IP]:3000
   - Example: http://192.168.1.100:3000

## Security Recommendations

1. **Change default passwords** in `.env` file
2. **Regular backups** to external storage
3. **Restrict network access** if not needed
4. **Keep system updated** when internet is available

## Support

For technical support:
- Keep this guide handy
- Document any error messages
- Maintain regular backups
- Consider having a local IT person familiar with the system

---

**Remember**: This system works completely offline once installed. No internet required for daily operations!