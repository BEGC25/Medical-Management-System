# Simple Windows Setup Guide - Bahr El Ghazal Clinic

## What You Need (Minimal Requirements)

- **Windows 10 or 11**
- **Only Node.js** (no PostgreSQL needed!)
- **30 minutes for setup**

## Why This Is Simpler

The original setup requires PostgreSQL, but this simplified version uses **SQLite** instead:

| Feature | PostgreSQL Setup | SQLite Setup (This One) |
|---------|------------------|--------------------------|
| Software needed | Node.js + PostgreSQL | **Only Node.js** |
| Database setup | Manual configuration | **Automatic** |
| File storage | Separate database server | **Single clinic.db file** |
| Backup | Complex commands | **Copy one file** |
| Maintenance | Database administration | **None needed** |

## Step-by-Step Installation

### Step 1: Install Node.js
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer with default settings
4. Restart your computer

### Step 2: Download Clinic System
1. Download all clinic system files to: `C:\clinic-management\`
2. Make sure you have these key files:
   - `setup-windows-simple.bat`
   - `package.json`
   - All other project files

### Step 3: Run Simple Setup
1. Open `C:\clinic-management\` folder
2. **Double-click: `setup-windows-simple.bat`**
3. Wait for setup to complete (takes about 5-10 minutes)
4. Setup will create:
   - SQLite database (`clinic.db`)
   - Start script (`start-clinic.bat`)
   - Backup script (`backup.bat`)

### Step 4: Start Using the System

#### To Start the Clinic System:
- **Double-click: `start-clinic.bat`**
- System will start and show: "Access the system at: http://localhost:5000"
- Open any web browser and go to: **http://localhost:5000**

#### To Stop the System:
- Press **Ctrl+C** in the command window
- Close the browser

#### To Backup Data:
- **Double-click: `backup.bat`** (do this daily!)
- Backup files saved in `backups\` folder

## What You Get

✅ **Complete clinic management system**  
✅ **Patient registration with GC-format IDs**  
✅ **Treatment records and vital signs**  
✅ **Laboratory test management**  
✅ **X-ray examination system**  
✅ **Ultrasound documentation**  
✅ **Dashboard with statistics**  
✅ **Completely offline operation**  
✅ **No monthly fees**  
✅ **All data stays on your computer**  

## File Structure After Setup

```
C:\clinic-management\
├── clinic.db              ← Your patient database
├── start-clinic.bat       ← Double-click to start
├── backup.bat            ← Double-click to backup
├── backups\              ← Daily backup files
├── package.json          ← System configuration
└── [other system files]
```

## Daily Operations

### Morning Routine:
1. Double-click `start-clinic.bat`
2. Open browser to `http://localhost:5000`
3. Begin patient registration and treatments

### Evening Routine:
1. Double-click `backup.bat` to save data
2. Press Ctrl+C to stop the system
3. Close browser

### Weekly Routine:
1. Copy the entire `clinic-management` folder to USB drive
2. Copy `backups` folder to external storage

## Troubleshooting

**System won't start:**
- Make sure Node.js is installed: `node --version`
- Run setup again: `setup-windows-simple.bat`

**Can't access http://localhost:5000:**
- Check if system is running (command window open)
- Try: http://127.0.0.1:5000

**Data backup:**
- Your database is in `clinic.db` file
- Copy this file to USB/external drive regularly
- Use the automated `backup.bat` script

## Advantages of This Setup

- **No complex database setup**
- **Single file contains all data**
- **Easy to backup and restore**
- **Perfect for single-computer clinics**
- **Zero ongoing maintenance**
- **No database administrator needed**

This simplified setup is perfect for rural clinics that need a reliable, offline-capable system without complex database administration.